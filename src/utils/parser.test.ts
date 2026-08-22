import { expect, describe, it } from 'vitest';
import { parseSubscription } from './parser';

describe('parseSubscription', () => {
  it('parses vmess:// correctly', () => {
    const vmessJson = JSON.stringify({
      v: "2",
      ps: "vmess-test",
      add: "vmess.example.com",
      port: "443",
      id: "abc-123",
      aid: "0",
      scy: "auto",
      net: "ws",
      type: "none",
      host: "vmess.example.com",
      path: "/vmess",
      tls: "tls",
      sni: "vmess.example.com"
    });
    // Node.js doesn't have btoa globally in old versions but we are in test environment, btoa works or we use Buffer
    const base64 = btoa(vmessJson);
    const uri = `vmess://${base64}`;
    
    const servers = parseSubscription(uri);
    expect(servers).toHaveLength(1);
    expect(servers[0].type).toBe('vmess');
    expect(servers[0].name).toBe('vmess-test');
    expect(servers[0].host).toBe('vmess.example.com');
    expect(servers[0].port).toBe(443);
    expect(servers[0].uuid).toBe('abc-123');
    expect(servers[0].network).toBe('ws');
    expect(servers[0].security).toBe('tls');
  });

  it('parses trojan:// correctly', () => {
    const uri = 'trojan://my-password@trojan.example.com:443?security=tls&sni=trojan.example.com&type=tcp#trojan-test';
    const servers = parseSubscription(uri);
    
    expect(servers).toHaveLength(1);
    expect(servers[0].type).toBe('trojan');
    expect(servers[0].name).toBe('trojan-test');
    expect(servers[0].host).toBe('trojan.example.com');
    expect(servers[0].port).toBe(443);
    expect(servers[0].uuid).toBe('my-password');
    expect(servers[0].security).toBe('tls');
  });

  it('skips malformed URIs silently', () => {
    const payload = `
    vless://malformed-no-host
    trojan://invalid-url-$$$
    vmess://not-base64
    `;
    const servers = parseSubscription(payload);
    expect(servers).toHaveLength(0);
  });
});
