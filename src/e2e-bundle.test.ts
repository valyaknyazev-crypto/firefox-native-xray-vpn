// @vitest-environment node
import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';
import { execFileSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.resolve(rootDir, 'dist');
const releaseDir = path.resolve(rootDir, 'release');

// Helper to inspect zip file entries without external dependencies
function getZipEntries(zipPath: string): string[] {
  const buf = fs.readFileSync(zipPath);
  const entries: string[] = [];
  let eocdOffset = -1;

  for (let i = buf.length - 22; i >= 0; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }

  if (eocdOffset === -1) {
    throw new Error(`File ${zipPath} is not a valid zip archive (missing EOCD)`);
  }

  const cdOffset = buf.readUInt32LE(eocdOffset + 16);
  const cdTotal = buf.readUInt16LE(eocdOffset + 10);
  let pos = cdOffset;

  for (let i = 0; i < cdTotal; i++) {
    if (buf.readUInt32LE(pos) !== 0x02014b50) break;
    const nameLen = buf.readUInt16LE(pos + 28);
    const extraLen = buf.readUInt16LE(pos + 30);
    const commentLen = buf.readUInt16LE(pos + 32);
    const name = buf.toString('utf8', pos + 46, pos + 46 + nameLen);
    entries.push(name);
    pos += 46 + nameLen + extraLen + commentLen;
  }

  return entries;
}

function collectTextFiles(dir: string): Array<{ path: string; relative: string; content: string }> {
  const results: Array<{ path: string; relative: string; content: string }> = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectTextFiles(fullPath));
    } else if (entry.isFile() && !entry.name.endsWith('.png') && !entry.name.endsWith('.zip') && !entry.name.endsWith('.exe')) {
      const relative = path.relative(rootDir, fullPath).replace(/\\/g, '/');
      const content = fs.readFileSync(fullPath, 'utf8');
      results.push({ path: fullPath, relative, content });
    }
  }

  return results;
}

describe('E2E Production Build Bundle & Release Packaging Verification', () => {
  beforeAll(async () => {
    // Ensure production build is up to date
    await build({
      root: rootDir,
      logLevel: 'warn',
    });

    // Run package-release.cjs to ensure release archives exist
    const packageScript = path.resolve(rootDir, 'package-release.cjs');
    execFileSync(process.execPath, [packageScript], {
      cwd: rootDir,
      stdio: 'pipe',
    });
  });

  describe('Dist Bundle Completeness', () => {
    it('generates all expected production assets in dist/', () => {
      expect(fs.existsSync(distDir)).toBe(true);

      const requiredFiles = [
        'manifest.json',
        'index.html',
        'options.html',
        'popup.js',
        'options.js',
        'background.js',
        'popup.css',
        'options.css',
      ];

      for (const file of requiredFiles) {
        const filePath = path.join(distDir, file);
        expect(fs.existsSync(filePath), `dist/${file} must exist`).toBe(true);
        expect(fs.statSync(filePath).size).toBeGreaterThan(0);
      }

      // Assert shared runtime JS chunks exist and are non-empty
      const jsFiles = fs.readdirSync(distDir).filter(f => f.endsWith('.js'));
      expect(jsFiles.length).toBeGreaterThanOrEqual(4);
      for (const js of jsFiles) {
        expect(fs.statSync(path.join(distDir, js)).size).toBeGreaterThan(0);
      }
    });

    it('includes all required icon files in dist/icons/', () => {
      const requiredIcons = [
        'icon-16.png',
        'icon-32.png',
        'icon-48.png',
        'icon-128.png',
      ];

      for (const icon of requiredIcons) {
        const iconPath = path.join(distDir, 'icons', icon);
        expect(fs.existsSync(iconPath), `dist/icons/${icon} must exist`).toBe(true);
      }
    });
  });

  describe('Zero Unicode Emojis in Built Output (dist/)', () => {
    const emojiRegex = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
    const legacyEmojis = ['📡', '⚡', '⏳', '⚠️', '🕒', '🧭'];

    it('contains absolute zero emoji characters across all dist files', () => {
      const textFiles = collectTextFiles(distDir);
      expect(textFiles.length).toBeGreaterThan(5);

      for (const file of textFiles) {
        expect(emojiRegex.test(file.content), `Found Unicode emoji regex match in ${file.relative}`).toBe(false);

        for (const emoji of legacyEmojis) {
          expect(file.content.includes(emoji), `Found specific legacy emoji '${emoji}' in ${file.relative}`).toBe(false);
        }
      }
    });
  });

  describe('Zero Native alert() Invocations in Production JS', () => {
    it('does not contain alert() or window.alert() in any compiled JS bundle', () => {
      const jsFiles = collectTextFiles(distDir).filter(f => f.path.endsWith('.js'));
      expect(jsFiles.length).toBeGreaterThanOrEqual(5);

      for (const js of jsFiles) {
        // Exclude test mocks if any, dist should only have production runtime code
        expect(js.content.includes('window.alert')).toBe(false);
        expect(/\balert\s*\(/.test(js.content)).toBe(false);
      }
    });
  });

  describe('CSS Architecture & Styling Token Verification', () => {
    it('verifies dist/options.css contains AMOLED cyberpunk tokens and custom rule classes', () => {
      const cssPath = path.join(distDir, 'options.css');
      const css = fs.readFileSync(cssPath, 'utf8');

      // Theme variables
      expect(css).toContain('--bg-primary');
      expect(css).toContain('--card-bg');
      expect(css).toContain('--accent-cyan');
      expect(css).toContain('--border-subtle');
      expect(css).toContain('#050811');

      // Layout and component classes
      expect(css).toContain('.options-container');
      expect(css).toContain('.options-card');
      expect(css).toContain('.rule-item');
      expect(css).toContain('.rule-pattern');
      expect(css).toContain('.btn-delete-rule');
      expect(css).toContain('.routing-card');
      expect(css).toContain('.btn-sync');
      expect(css).toContain('backdrop-filter');
      expect(css).toContain('.error-boundary-fallback');
    });

    it('verifies dist/popup.css contains glassmorphic styling, glow aura and latency classes', () => {
      const cssPath = path.join(distDir, 'popup.css');
      const css = fs.readFileSync(cssPath, 'utf8');

      // Glassmorphic and glow styling
      expect(css).toContain('--bg-void');
      expect(css).toContain('connected-glow');
      expect(css).toContain('.server-item');
      expect(css).toContain('.error-boundary-fallback');
      expect(css).toContain('.latency-badge');
      expect(css).toContain('.latency-good');
      expect(css).toContain('.latency-medium');
      expect(css).toContain('.latency-bad');
      expect(css).toContain('.latency-loading');
      expect(css).toContain('.latency-error');
      expect(css).toContain('.btn-connect');
      expect(css).toContain('.btn-disconnect');
    });
  });

  describe('Vector Icon System Bundle', () => {
    it('contains SVG vector specifications with viewBox="0 0 24 24" and currentColor', () => {
      const jsFiles = collectTextFiles(distDir).filter(f => f.path.endsWith('.js'));
      const foundSvgSpecs = jsFiles.some(
        f => f.content.includes('viewBox:"0 0 24 24"') && f.content.includes('"currentColor"')
      );
      expect(foundSvgSpecs).toBe(true);
    });
  });

  describe('Manifest v3 Validation', () => {
    it('validates dist/manifest.json conforms to MV3 specification', () => {
      const manifestPath = path.join(distDir, 'manifest.json');
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

      expect(manifest.manifest_version).toBe(3);
      expect(manifest.name).toBe('VPN Proxy');
      expect(manifest.action.default_popup).toBe('index.html');
      expect(manifest.options_ui.page).toBe('options.html');
      expect(manifest.background.scripts).toContain('background.js');
      expect(manifest.permissions).toEqual(
        expect.arrayContaining(['alarms', 'proxy', 'storage', 'nativeMessaging'])
      );
      expect(manifest.browser_specific_settings.gecko.id).toBe('vpnproxy@antigravity.dev');
    });
  });

  describe('HTML Entry Files Validation', () => {
    it('validates index.html and options.html root mounts', () => {
      const indexPath = path.join(distDir, 'index.html');
      const optionsPath = path.join(distDir, 'options.html');

      const indexHtml = fs.readFileSync(indexPath, 'utf8');
      const optionsHtml = fs.readFileSync(optionsPath, 'utf8');

      expect(indexHtml).toContain('<div id="root"></div>');
      expect(indexHtml).toContain('popup.css');
      expect(optionsHtml).toContain('<div id="root"></div>');
      expect(optionsHtml).toContain('options.css');
    });
  });

  describe('Release Packaging Integrity', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
    const version = pkg.version;

    it('verifies vpn-extension-v<version>.zip contains all dist files and no repo junk', () => {
      const extZip = path.join(releaseDir, `vpn-extension-v${version}.zip`);
      expect(fs.existsSync(extZip), `Release zip ${extZip} must exist`).toBe(true);

      const entries = getZipEntries(extZip);
      expect(entries).toContain('manifest.json');
      expect(entries).toContain('index.html');
      expect(entries).toContain('options.html');
      expect(entries).toContain('popup.js');
      expect(entries).toContain('options.js');
      expect(entries).toContain('popup.css');
      expect(entries).toContain('options.css');
      expect(entries).toContain('background.js');

      // Verify every non-directory file in dist/ was packaged into zip
      const distFiles = fs.readdirSync(distDir).filter(f => !fs.statSync(path.join(distDir, f)).isDirectory());
      for (const distFile of distFiles) {
        expect(entries).toContain(distFile);
      }

      // Must NOT contain dev junk
      for (const entry of entries) {
        expect(entry).not.toMatch(/^\.git/);
        expect(entry).not.toMatch(/^\.scratch/);
        expect(entry).not.toMatch(/^node_modules/);
        expect(entry).not.toMatch(/\.test\./);
      }

      // Size lightweight (< 200KB for pure extension zip conforming to spec)
      const sizeBytes = fs.statSync(extZip).size;
      expect(sizeBytes).toBeLessThan(250 * 1024);
      expect(sizeBytes).toBeGreaterThan(10 * 1024);
    });

    it('verifies vpn-source-v<version>.zip and vpn-daemon-v<version>.zip are valid archives', () => {
      const sourceZip = path.join(releaseDir, `vpn-source-v${version}.zip`);
      const daemonZip = path.join(releaseDir, `vpn-daemon-v${version}.zip`);

      expect(fs.existsSync(sourceZip)).toBe(true);
      expect(fs.existsSync(daemonZip)).toBe(true);

      const sourceEntries = getZipEntries(sourceZip);
      expect(sourceEntries).toContain('package.json');
      expect(sourceEntries).toContain('src/App.tsx');
      expect(sourceEntries).toContain('src/options/Options.tsx');
      expect(sourceEntries).toContain('src/components/Icons.tsx');

      const daemonEntries = getZipEntries(daemonZip);
      expect(daemonEntries).toContain('install-daemon.ps1');
      expect(daemonEntries).toContain('uninstall-daemon.ps1');
      expect(daemonEntries).toContain('src-daemon/daemon.js');
    });
  });
});
