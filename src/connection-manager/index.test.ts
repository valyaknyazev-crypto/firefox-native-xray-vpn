import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('webextension-polyfill', () => ({
  default: {
    runtime: {
      connectNative: vi.fn()
    },
    storage: {
      local: {
        set: vi.fn(),
        get: vi.fn()
      }
    },
    proxy: {
      onRequest: {
        addListener: vi.fn(),
        removeListener: vi.fn(),
        hasListener: vi.fn()
      }
    }
  }
}));

import { createConnectionManager } from './index';
import { ProxyServer } from '../types';

describe('ConnectionManager', () => {
  const dummyServer: ProxyServer = {
    id: 'server-1',
    name: 'US Fast',
    type: 'vless',
    uuid: 'test-uuid',
    host: '1.2.3.4',
    port: 443,
    network: 'tcp',
    security: 'none'
  };

  let mockPort: any;
  let mockStorage: any;
  let mockProxy: any;
  let listeners: Record<string, Function[]>;

  beforeEach(() => {
    listeners = {
      disconnect: [],
      message: []
    };

    mockPort = {
      postMessage: vi.fn(),
      disconnect: vi.fn(),
      error: null,
      onDisconnect: {
        addListener: vi.fn((fn) => listeners.disconnect.push(fn)),
        removeListener: vi.fn((fn) => {
          listeners.disconnect = listeners.disconnect.filter(l => l !== fn);
        })
      },
      onMessage: {
        addListener: vi.fn((fn) => listeners.message.push(fn)),
        removeListener: vi.fn((fn) => {
          listeners.message = listeners.message.filter(l => l !== fn);
        })
      }
    };

    mockStorage = {
      set: vi.fn().mockResolvedValue(undefined)
    };

    let proxyListeners: Function[] = [];
    mockProxy = {
      addListener: vi.fn((fn) => proxyListeners.push(fn)),
      removeListener: vi.fn((fn) => {
        proxyListeners = proxyListeners.filter(l => l !== fn);
      }),
      hasListener: vi.fn((fn) => proxyListeners.includes(fn))
    };
  });

  it('starts in disconnected state', () => {
    const manager = createConnectionManager({
      connectNative: () => mockPort,
      storage: mockStorage,
      proxy: mockProxy
    });

    expect(manager.getState().status).toBe('disconnected');
    expect(manager.getState().activeServer).toBeNull();
  });

  it('connects to native host, sends start command, registers proxy listener, and sets storage', async () => {
    const manager = createConnectionManager({
      connectNative: () => mockPort,
      storage: mockStorage,
      proxy: mockProxy,
      handshakeDelayMs: 0
    });

    await manager.connect(dummyServer);

    expect(mockPort.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        command: 'START',
        config: expect.objectContaining({
          outbounds: expect.any(Array)
        })
      })
    );
    expect(mockProxy.addListener).toHaveBeenCalled();
    expect(mockStorage.set).toHaveBeenCalledWith({ connected: true });
    expect(manager.getState().status).toBe('connected');
    expect(manager.getState().activeServer?.id).toBe('server-1');
  });

  it('disconnects gracefully: sends STOP, disconnects port, removes proxy listener, and updates storage', async () => {
    const manager = createConnectionManager({
      connectNative: () => mockPort,
      storage: mockStorage,
      proxy: mockProxy,
      handshakeDelayMs: 0
    });

    await manager.connect(dummyServer);
    await manager.disconnect();

    expect(mockPort.postMessage).toHaveBeenCalledWith({ command: 'STOP' });
    expect(mockPort.disconnect).toHaveBeenCalled();
    expect(mockProxy.removeListener).toHaveBeenCalled();
    expect(mockStorage.set).toHaveBeenCalledWith({ connected: false });
    expect(manager.getState().status).toBe('disconnected');
    expect(manager.getState().activeServer).toBeNull();
  });

  it('handles unexpected native daemon disconnect and cleans up proxy state', async () => {
    const manager = createConnectionManager({
      connectNative: () => mockPort,
      storage: mockStorage,
      proxy: mockProxy,
      handshakeDelayMs: 0
    });

    await manager.connect(dummyServer);

    // Simulate unexpected port disconnect from OS/daemon
    listeners.disconnect.forEach(fn => fn({ error: { message: 'Process exited unexpectedly' } }));

    expect(manager.getState().status).toBe('disconnected');
    expect(mockProxy.removeListener).toHaveBeenCalled();
    expect(mockStorage.set).toHaveBeenCalledWith({ connected: false });
  });

  it('evaluates routing through handleProxyRequest when active and returns socks payload for PROXY action', async () => {
    const manager = createConnectionManager({
      connectNative: () => mockPort,
      storage: mockStorage,
      proxy: mockProxy,
      handshakeDelayMs: 0,
      getRoutingMode: () => 'Global'
    });

    // When disconnected -> returns direct
    expect(manager.handleProxyRequest({ url: 'https://example.com' })).toEqual({ type: 'direct' });

    // When connected in Global mode -> returns socks5
    await manager.connect(dummyServer);
    expect(manager.handleProxyRequest({ url: 'https://example.com' })).toEqual({
      type: 'socks',
      host: '127.0.0.1',
      port: 1080,
      proxyDNS: true
    });
  });

  it('pings server through native daemon and resolves with latency', async () => {
    const manager = createConnectionManager({
      connectNative: () => mockPort,
      storage: mockStorage,
      proxy: mockProxy
    });

    mockPort.postMessage.mockImplementation((msg: any) => {
      if (msg.command === 'PING') {
        setTimeout(() => {
          listeners.message.forEach(fn => fn({
            type: 'PING_RESULT',
            id: msg.id,
            latencyMs: 72
          }));
        }, 10);
      }
    });

    const latency = await manager.pingServer(dummyServer);
    expect(latency).toBe(72);
    expect(mockPort.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        command: 'PING',
        host: '1.2.3.4',
        port: 443
      })
    );
  });

  it('handles ping error from native daemon', async () => {
    const manager = createConnectionManager({
      connectNative: () => mockPort,
      storage: mockStorage,
      proxy: mockProxy
    });

    mockPort.postMessage.mockImplementation((msg: any) => {
      if (msg.command === 'PING') {
        setTimeout(() => {
          listeners.message.forEach(fn => fn({
            type: 'PING_ERROR',
            id: msg.id,
            error: 'Connection refused'
          }));
        }, 10);
      }
    });

    await expect(manager.pingServer(dummyServer)).rejects.toThrow('Connection refused');
  });

  it('simulates latency for .mock servers without touching native port', async () => {
    const manager = createConnectionManager({
      connectNative: () => mockPort,
      storage: mockStorage,
      proxy: mockProxy
    });

    const mockServer: ProxyServer = { ...dummyServer, host: 'nl.proxy.mock' };
    const latency = await manager.pingServer(mockServer);

    expect(typeof latency).toBe('number');
    expect(latency).toBeGreaterThan(0);
    expect(mockPort.postMessage).not.toHaveBeenCalled();
  });
});
