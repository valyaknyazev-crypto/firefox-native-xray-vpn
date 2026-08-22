const fs = require('fs/promises');
const { spawn } = require('child_process');
const path = require('path');
const net = require('net');

const logFile = path.join(__dirname, 'daemon.log');
async function log(msg) {
  try {
    await fs.appendFile(logFile, new Date().toISOString() + ' - ' + msg + '\n');
  } catch(e) {}
}

class NativeDaemon {
  constructor() {
    this.xrayProcess = null;
    this.buffer = Buffer.alloc(0);
  }

  start() {
    log("Daemon started");
    process.stdin.on('data', this.handleData.bind(this));
    process.stdin.on('end', this.shutdown.bind(this));
  }

  async handleData(chunk) {
    this.buffer = Buffer.concat([this.buffer, chunk]);
    while (this.buffer.length >= 4) {
      const length = this.buffer.readUInt32LE(0);
      if (this.buffer.length >= 4 + length) {
        const messageBuffer = this.buffer.subarray(4, 4 + length);
        this.buffer = this.buffer.subarray(4 + length);
        try {
          const msg = JSON.parse(messageBuffer.toString('utf8'));
          await this.handleCommand(msg);
        } catch (e) {
          await log("Error parsing message: " + e);
        }
      } else {
        break;
      }
    }
  }

  async sendMessage(msg) {
    const msgString = JSON.stringify(msg);
    await log("Sending message: " + msgString);
    const msgBuffer = Buffer.from(msgString, 'utf8');
    const lengthBuffer = Buffer.alloc(4);
    lengthBuffer.writeUInt32LE(msgBuffer.length, 0);
    process.stdout.write(lengthBuffer);
    process.stdout.write(msgBuffer);
  }

  async handleCommand(msg) {
    await log("Received command: " + msg.command);
    if (msg.command === 'START') {
      if (this.xrayProcess) {
        this.xrayProcess.kill();
      }
      
      // Basic validation
      if (!msg.config || typeof msg.config !== 'object') {
        await this.sendMessage({ status: "error", error: "Invalid config payload" });
        return;
      }
      
      const configPath = path.join(__dirname, 'config.json');
      await fs.writeFile(configPath, JSON.stringify(msg.config, null, 2));
      
      const xrayPath = path.join(__dirname, 'xray.exe');
      try {
        await fs.access(xrayPath);
        this.xrayProcess = spawn(xrayPath, ['run', '-c', configPath]);
        
        this.xrayProcess.on('error', async (err) => {
          await log('Xray failed to start: ' + err);
        });
        this.xrayProcess.on('exit', async (code) => {
          await log('Xray exited with code ' + code);
        });

        await this.sendMessage({ status: "started" });
      } catch (e) {
        await this.sendMessage({ status: "error", error: "xray.exe not found" });
      }
    } else if (msg.command === 'STOP') {
      if (this.xrayProcess) this.xrayProcess.kill();
      await this.sendMessage({ status: "stopped" });
      // Delay exit to ensure stdout buffer is flushed
      setTimeout(() => this.shutdown(), 200);
    } else if (msg.command === 'PING') {
      const start = Date.now();
      const host = msg.host;
      const port = Number(msg.port);
      const timeoutMs = msg.timeoutMs || 3000;
      const id = msg.id;

      if (!host || !port) {
        await this.sendMessage({ type: 'PING_ERROR', id, error: 'Invalid host or port' });
        return;
      }

      const sock = net.createConnection({ host, port });
      sock.setTimeout(timeoutMs);

      let responded = false;
      const finish = (result) => {
        if (responded) return;
        responded = true;
        try { sock.destroy(); } catch(e) {}
        this.sendMessage(result);
      };

      sock.on('connect', () => {
        const latencyMs = Date.now() - start;
        finish({ type: 'PING_RESULT', id, latencyMs, host, port });
      });
      sock.on('error', (err) => {
        finish({ type: 'PING_ERROR', id, error: err.message || 'Connection error', host, port });
      });
      sock.on('timeout', () => {
        finish({ type: 'PING_ERROR', id, error: 'Timeout', host, port });
      });
    }
  }

  async shutdown() {
    await log("Shutting down.");
    if (this.xrayProcess) this.xrayProcess.kill();
    process.exit(0);
  }
}

new NativeDaemon().start();
