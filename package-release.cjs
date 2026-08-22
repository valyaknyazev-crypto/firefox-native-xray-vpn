const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Read version from package.json
const pkgPath = path.resolve(__dirname, 'package.json');
const pkgData = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const version = pkgData.version;

// Ensure release/ directory exists
const releaseDir = path.resolve(__dirname, 'release');
if (!fs.existsSync(releaseDir)) {
  fs.mkdirSync(releaseDir, { recursive: true });
}

// CRC32 table
const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[i] = c >>> 0;
}

function crc32(buf) {
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ (-1)) >>> 0;
}

function createZip(entries, outputPath) {
  const fileRecords = [];
  const localHeaders = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBuf = Buffer.from(entry.name.replace(/\\/g, '/'), 'utf8');
    const data = entry.data;
    const crc = crc32(data);
    const compressed = zlib.deflateRawSync(data);
    
    // Local file header (30 bytes + name)
    const localHeader = Buffer.alloc(30 + nameBuf.length);
    localHeader.writeUInt32LE(0x04034b50, 0); // signature
    localHeader.writeUInt16LE(20, 4); // version needed
    localHeader.writeUInt16LE(0x0800, 6); // UTF-8 flag
    localHeader.writeUInt16LE(8, 8); // compression method (deflate)
    localHeader.writeUInt16LE(0, 10); // mod time
    localHeader.writeUInt16LE(0, 12); // mod date
    localHeader.writeUInt32LE(crc, 14); // crc32
    localHeader.writeUInt32LE(compressed.length, 18); // compressed size
    localHeader.writeUInt32LE(data.length, 22); // uncompressed size
    localHeader.writeUInt16LE(nameBuf.length, 26); // file name length
    localHeader.writeUInt16LE(0, 28); // extra field length
    nameBuf.copy(localHeader, 30);

    localHeaders.push(localHeader, compressed);

    fileRecords.push({
      nameBuf,
      crc,
      compressedSize: compressed.length,
      uncompressedSize: data.length,
      offset
    });

    offset += localHeader.length + compressed.length;
  }

  const centralDirHeaders = [];
  let centralDirSize = 0;

  for (const rec of fileRecords) {
    const cdHeader = Buffer.alloc(46 + rec.nameBuf.length);
    cdHeader.writeUInt32LE(0x02014b50, 0); // central dir signature
    cdHeader.writeUInt16LE(20, 4); // version made by
    cdHeader.writeUInt16LE(20, 6); // version needed
    cdHeader.writeUInt16LE(0x0800, 8); // UTF-8 flag
    cdHeader.writeUInt16LE(8, 10); // compression method
    cdHeader.writeUInt16LE(0, 12); // mod time
    cdHeader.writeUInt16LE(0, 14); // mod date
    cdHeader.writeUInt32LE(rec.crc, 16); // crc32
    cdHeader.writeUInt32LE(rec.compressedSize, 20); // compressed size
    cdHeader.writeUInt32LE(rec.uncompressedSize, 24); // uncompressed size
    cdHeader.writeUInt16LE(rec.nameBuf.length, 28); // file name length
    cdHeader.writeUInt16LE(0, 30); // extra field length
    cdHeader.writeUInt16LE(0, 32); // comment length
    cdHeader.writeUInt16LE(0, 34); // disk start
    cdHeader.writeUInt16LE(0, 36); // internal file attributes
    cdHeader.writeUInt32LE(0, 38); // external file attributes
    cdHeader.writeUInt32LE(rec.offset, 42); // relative offset
    rec.nameBuf.copy(cdHeader, 46);

    centralDirHeaders.push(cdHeader);
    centralDirSize += cdHeader.length;
  }

  // End of central directory record (22 bytes)
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); // EOCD signature
  eocd.writeUInt16LE(0, 4); // disk number
  eocd.writeUInt16LE(0, 6); // start disk
  eocd.writeUInt16LE(fileRecords.length, 8); // total entries on disk
  eocd.writeUInt16LE(fileRecords.length, 10); // total entries
  eocd.writeUInt32LE(centralDirSize, 12); // central dir size
  eocd.writeUInt32LE(offset, 16); // offset of central dir
  eocd.writeUInt16LE(0, 20); // comment length

  const finalBuf = Buffer.concat([...localHeaders, ...centralDirHeaders, eocd]);
  fs.writeFileSync(outputPath, finalBuf);
  console.log(`Created ${outputPath} (${finalBuf.length} bytes, ${fileRecords.length} files)`);
}

function collectFiles(baseDir, relativeTo = baseDir) {
  const results = [];
  const entries = fs.readdirSync(baseDir, { withFileTypes: true });

  for (const entry of entries) {
    // EXCLUDE AGENT JUNK & ARTIFACTS
    if (['.scratch', '.agents', '.git', 'node_modules', 'dist-installer', 'release'].includes(entry.name)) continue;
    if (entry.name.endsWith('.md') && ['learning_proposal.md', 'architecture_report.md', 'handoff.md', 'task.md', 'implementation_plan.md', 'walkthrough.md'].includes(entry.name)) continue;
    
    const fullPath = path.join(baseDir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectFiles(fullPath, relativeTo));
    } else if (entry.isFile()) {
      const relPath = path.relative(relativeTo, fullPath).replace(/\\/g, '/');
      results.push({
        name: relPath,
        data: fs.readFileSync(fullPath)
      });
    }
  }
  return results;
}

// 1. Build Extension ZIP
const distFiles = collectFiles(path.resolve(__dirname, 'dist'));
const extZipPath = path.join(releaseDir, `vpn-extension-v${version}.zip`);
createZip(distFiles, extZipPath);
console.log(`Created Extension ZIP at ${extZipPath}`);

// 2. Build Source ZIP
const sourceItems = [
  'src',
  'src-daemon',
  'src-daemon-go',
  'public',
  'index.html',
  'options.html',
  'package.json',
  'package-lock.json',
  'package-release.cjs',
  'tsconfig.json',
  'vite.config.ts',
  'README.md',
  'CONTEXT.md',
  'LICENSE',
  'docs',
  'install-daemon.ps1',
  'uninstall-daemon.ps1',
  'updates.json',
  '.gitignore'
];

const sourceFiles = [];
const rootDir = __dirname;
for (const item of sourceItems) {
  const itemPath = path.join(rootDir, item);
  if (fs.existsSync(itemPath)) {
    const stat = fs.statSync(itemPath);
    if (stat.isDirectory()) {
      sourceFiles.push(...collectFiles(itemPath, rootDir));
    } else {
      sourceFiles.push({
        name: item.replace(/\\/g, '/'),
        data: fs.readFileSync(itemPath)
      });
    }
  }
}
const sourceZipPath = path.join(releaseDir, `vpn-source-v${version}.zip`);
createZip(sourceFiles, sourceZipPath);

// 3. Build Daemon Installer ZIP
const daemonItems = [
  'install-daemon.ps1',
  'uninstall-daemon.ps1',
  { src: 'build/xray.exe', dest: 'build/xray.exe' },
  { src: 'src-daemon/daemon.js', dest: 'src-daemon/daemon.js' }
];

const daemonFiles = [];
for (const item of daemonItems) {
  if (typeof item === 'string') {
    const itemPath = path.join(rootDir, item);
    if (fs.existsSync(itemPath)) {
      daemonFiles.push({
        name: item.replace(/\\/g, '/'),
        data: fs.readFileSync(itemPath)
      });
    }
  } else {
    const itemPath = path.join(rootDir, item.src);
    if (fs.existsSync(itemPath)) {
      daemonFiles.push({
        name: item.dest.replace(/\\/g, '/'),
        data: fs.readFileSync(itemPath)
      });
    }
  }
}
const daemonZipPath = path.join(releaseDir, `vpn-daemon-v${version}.zip`);
createZip(daemonFiles, daemonZipPath);

console.log(`\n🎉 Release v${version} built successfully in release/ directory!`);
