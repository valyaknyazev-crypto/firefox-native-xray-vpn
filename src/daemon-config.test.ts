import { expect, describe, it } from 'vitest';
import { buildFor } from './daemon-config';
import { ProxyServer } from './types';

describe('DaemonConfig buildFor', () => {
  it('builds VLESS TCP configuration correctly', () => {
    const server: ProxyServer = {
      id: 'mock-1',
      name: 'test',
      type: 'vless',
      host: 'example.com',
      port: 443,
      uuid: 'abc-123'
    };
    
    const config = buildFor(server);
    expect(config.outbounds[0].protocol).toBe('vless');
    expect(config.outbounds[0].streamSettings.network).toBe('tcp');
    expect(config.outbounds[0].settings.vnext[0].users[0].id).toBe('abc-123');
    expect(config.inbounds[0].protocol).toBe('socks');
  });

  it('builds VMess WebSocket TLS configuration correctly', () => {
    const server: ProxyServer = {
      id: 'mock-2',
      name: 'test-vmess',
      type: 'vmess',
      host: 'vmess.example.com',
      port: 8443,
      uuid: 'def-456',
      network: 'ws',
      security: 'tls',
      sni: 'vmess.example.com',
      path: '/v'
    };
    
    const config = buildFor(server);
    expect(config.outbounds[0].protocol).toBe('vmess');
    expect(config.outbounds[0].streamSettings.network).toBe('ws');
    expect(config.outbounds[0].streamSettings.wsSettings.path).toBe('/v');
    expect(config.outbounds[0].streamSettings.tlsSettings.serverName).toBe('vmess.example.com');
    expect(config.outbounds[0].settings.vnext[0].users[0].security).toBe('auto');
    expect(config.outbounds[0].settings.vnext[0].users[0].alterId).toBe(0);
  });

  it('builds Trojan configuration correctly', () => {
    const server: ProxyServer = {
      id: 'mock-3',
      name: 'test-trojan',
      type: 'trojan',
      host: 'trojan.example.com',
      port: 443,
      uuid: 'my-super-secret-password'
    };
    
    const config = buildFor(server);
    expect(config.outbounds[0].protocol).toBe('trojan');
    expect(config.outbounds[0].settings.servers[0].password).toBe('my-super-secret-password');
    expect(config.outbounds[0].settings.servers[0].address).toBe('trojan.example.com');
  });
  
  it('handles xhttp correctly', () => {
    const server: ProxyServer = {
      id: 'mock-4',
      name: 'test-xhttp',
      type: 'vless',
      host: 'x.example.com',
      port: 443,
      uuid: 'xyz',
      network: 'xhttp',
      path: '/stream'
    };
    
    const config = buildFor(server);
    expect(config.outbounds[0].streamSettings.network).toBe('xhttp');
    expect(config.outbounds[0].streamSettings.xhttpSettings.path).toBe('/stream');
    expect(config.outbounds[0].streamSettings.xhttpSettings.mode).toBe('auto');
  });
});
