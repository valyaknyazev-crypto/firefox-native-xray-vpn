import browser from 'webextension-polyfill';
import { ProxyServer, NativeCommand, STORAGE_KEYS, RoutingMode, RoutingRule } from '../types';
import { buildFor } from '../daemon-config';
import { evaluateRouting } from '../routing';
import { getBuiltInRuleset, SmartRuleset } from '../smart-ruleset';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface ConnectionState {
  status: ConnectionStatus;
  activeServer: ProxyServer | null;
  error: string | null;
}

export interface ConnectionManagerOptions {
  nativeHostName?: string;
  socksHost?: string;
  socksPort?: number;
  connectNative?: (name: string) => any;
  storage?: {
    set: (items: Record<string, any>) => Promise<void>;
  };
  proxy?: {
    addListener: (listener: (req: any) => any, filter: any) => void;
    removeListener: (listener: (req: any) => any) => void;
    hasListener: (listener: (req: any) => any) => boolean;
  };
  handshakeDelayMs?: number;
  getRoutingMode?: () => RoutingMode;
  getRoutingRules?: () => RoutingRule[];
  getSmartRuleset?: () => SmartRuleset;
  onStateChange?: (state: ConnectionState) => void;
}

export interface ConnectionManager {
  connect(server: ProxyServer): Promise<void>;
  disconnect(): Promise<void>;
  getState(): ConnectionState;
  handleProxyRequest(requestInfo: { url: string }): { type: 'socks'; host: string; port: number; proxyDNS: boolean } | { type: 'direct' };
  pingServer(server: ProxyServer, timeoutMs?: number): Promise<number>;
}

const DEFAULT_NATIVE_DAEMON_NAME = 'com.vpn.daemon.core';
const DEFAULT_SOCKS_HOST = '127.0.0.1';
const DEFAULT_SOCKS_PORT = 1080;

export function createConnectionManager(options?: ConnectionManagerOptions): ConnectionManager {
  const nativeHostName = options?.nativeHostName ?? DEFAULT_NATIVE_DAEMON_NAME;
  const socksHost = options?.socksHost ?? DEFAULT_SOCKS_HOST;
  const socksPort = options?.socksPort ?? DEFAULT_SOCKS_PORT;
  const handshakeDelayMs = options?.handshakeDelayMs ?? 200;

  const connectNative = options?.connectNative ?? ((name: string) => browser.runtime.connectNative(name));
  const storage = options?.storage ?? {
    set: (items: Record<string, any>) => browser.storage.local.set(items)
  };
  const proxy = options?.proxy ?? {
    addListener: (listener: any, filter: any) => browser.proxy.onRequest.addListener(listener, filter),
    removeListener: (listener: any) => browser.proxy.onRequest.removeListener(listener),
    hasListener: (listener: any) => browser.proxy.onRequest.hasListener(listener)
  };

  const getRoutingMode = options?.getRoutingMode ?? (() => 'Global');
  const getRoutingRules = options?.getRoutingRules ?? (() => []);
  const getRuleset = options?.getSmartRuleset ?? (() => getBuiltInRuleset());

  let nativePort: any = null;
  let state: ConnectionState = {
    status: 'disconnected',
    activeServer: null,
    error: null
  };

  function updateState(partial: Partial<ConnectionState>) {
    state = { ...state, ...partial };
    if (options?.onStateChange) {
      options.onStateChange(state);
    }
  }

  function handleProxyRequest(requestInfo: { url: string }) {
    if (state.status === 'connected') {
      const mode = getRoutingMode();
      const rules = getRoutingRules();
      const ruleset = getRuleset();
      const action = evaluateRouting(requestInfo.url, rules, mode, ruleset);

      if (action === 'PROXY') {
        return {
          type: 'socks' as const,
          host: socksHost,
          port: socksPort,
          proxyDNS: true
        };
      }
    }
    return { type: 'direct' as const };
  }

  async function connect(server: ProxyServer): Promise<void> {
    updateState({ status: 'connecting', activeServer: server, error: null });

    return new Promise((resolve, reject) => {
      try {
        nativePort = connectNative(nativeHostName);
        let isConnected = true;

        nativePort.onDisconnect.addListener((port: any) => {
          isConnected = false;
          const errMsg = port?.error?.message || 'Native daemon disconnected';
          console.warn('Native Daemon Disconnected:', errMsg);

          // Teardown proxy on unexpected disconnect
          if (proxy.hasListener(handleProxyRequest)) {
            proxy.removeListener(handleProxyRequest);
          }
          storage.set({ [STORAGE_KEYS.CONNECTED]: false }).catch(() => {});
          updateState({ status: 'disconnected', activeServer: null, error: errMsg });

          if (port?.error) {
            reject(new Error(port.error.message));
          }
        });

        nativePort.onMessage.addListener((msg: any) => {
          console.log('Daemon message:', msg);
        });

        const config = buildFor(server);
        const cmd: NativeCommand = { command: 'START', config };
        nativePort.postMessage(cmd);

        setTimeout(async () => {
          if (isConnected) {
            if (!proxy.hasListener(handleProxyRequest)) {
              proxy.addListener(handleProxyRequest, { urls: ['<all_urls>'] });
            }
            try {
              await storage.set({ [STORAGE_KEYS.CONNECTED]: true });
            } catch (err) {
              console.error('Failed to persist connected state in storage:', err);
            }
            updateState({ status: 'connected', activeServer: server, error: null });
            resolve();
          }
        }, handshakeDelayMs);

      } catch (err: any) {
        console.error('Failed to connect to native messaging host:', err);
        updateState({ status: 'error', activeServer: null, error: err.message || 'Unknown connection error' });
        reject(err);
      }
    });
  }

  async function disconnect(): Promise<void> {
    if (nativePort) {
      try {
        const cmd: NativeCommand = { command: 'STOP' };
        nativePort.postMessage(cmd);
      } catch (e) {
        console.error('Error sending STOP to daemon:', e);
      }
      try {
        nativePort.disconnect();
      } catch (e) {
        console.error('Error disconnecting native port:', e);
      }
      nativePort = null;
    }

    if (proxy.hasListener(handleProxyRequest)) {
      proxy.removeListener(handleProxyRequest);
    }

    await storage.set({ [STORAGE_KEYS.CONNECTED]: false });
    updateState({ status: 'disconnected', activeServer: null, error: null });
  }

  async function pingServer(server: ProxyServer, timeoutMs: number = 3000): Promise<number> {
    const pingId = 'ping_' + Math.random().toString(36).substring(2, 9);
    
    // For mock / simulated servers in dev
    if (server.host.endsWith('.mock')) {
      await new Promise(r => setTimeout(r, 45 + Math.floor(Math.random() * 60)));
      return 45 + Math.floor(Math.random() * 50);
    }

    return new Promise((resolve, reject) => {
      let tempPort: any = null;
      let targetPort = nativePort;
      let isDedicatedPort = false;

      if (!targetPort) {
        try {
          tempPort = connectNative(nativeHostName);
          targetPort = tempPort;
          isDedicatedPort = true;
        } catch (e: any) {
          return reject(new Error('Native daemon not reachable: ' + (e.message || 'Error')));
        }
      }

      const timer = setTimeout(() => {
        cleanup();
        reject(new Error('Ping timeout (' + timeoutMs + 'ms)'));
      }, timeoutMs + 200);

      const messageListener = (msg: any) => {
        if (msg && msg.id === pingId) {
          cleanup();
          if (msg.type === 'PING_RESULT' && typeof msg.latencyMs === 'number') {
            resolve(msg.latencyMs);
          } else {
            reject(new Error(msg.error || 'Ping failed'));
          }
        }
      };

      const disconnectListener = (port: any) => {
        cleanup();
        const err = port?.error?.message || 'Native daemon disconnected during ping';
        reject(new Error(err));
      };

      function cleanup() {
        clearTimeout(timer);
        try {
          if (targetPort?.onMessage?.removeListener) {
            targetPort.onMessage.removeListener(messageListener);
          }
          if (targetPort?.onDisconnect?.removeListener) {
            targetPort.onDisconnect.removeListener(disconnectListener);
          }
        } catch (e) {}

        if (isDedicatedPort && tempPort) {
          try {
            tempPort.disconnect();
          } catch (e) {}
        }
      }

      targetPort.onMessage.addListener(messageListener);
      targetPort.onDisconnect.addListener(disconnectListener);

      const cmd: NativeCommand = {
        command: 'PING',
        id: pingId,
        host: server.host,
        port: server.port,
        timeoutMs
      };

      try {
        targetPort.postMessage(cmd);
      } catch (err: any) {
        cleanup();
        reject(err);
      }
    });
  }

  function getState(): ConnectionState {
    return state;
  }

  return {
    connect,
    disconnect,
    getState,
    handleProxyRequest,
    pingServer
  };
}
