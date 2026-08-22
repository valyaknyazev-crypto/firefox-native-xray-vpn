import browser from 'webextension-polyfill';
import { ProxyServer, MESSAGES } from '../types';
import { ConnectionManager } from '../connection-manager';
import { SettingsRepository } from '../settings-repository';

/**
 * Registers all browser.runtime.onMessage handlers.
 * Each Message Handler type (TOGGLE_PROXY, PING_SERVER, PING_ALL) is handled
 * by a focused branch; adding a new type means adding one branch here only.
 */
export function registerMessageHandlers(
  connectionManager: ConnectionManager,
  settingsRepo: SettingsRepository
): void {
  browser.runtime.onMessage.addListener(async (message: any) => {
    if (message.type === MESSAGES.TOGGLE_PROXY) {
      return handleToggleProxy(message, connectionManager, settingsRepo);
    }

    if (message.type === MESSAGES.PING_SERVER) {
      return handlePingServer(message, connectionManager);
    }

    if (message.type === MESSAGES.PING_ALL) {
      return handlePingAll(message, connectionManager, settingsRepo);
    }
  });
}

async function handleToggleProxy(
  message: any,
  connectionManager: ConnectionManager,
  settingsRepo: SettingsRepository
): Promise<{ success: true } | { error: string }> {
  try {
    if (message.connected) {
      const servers: ProxyServer[] = await settingsRepo.get('proxyServers');
      const server = servers.find(s => s.id === message.proxyServerId);
      if (!server) throw new Error('Proxy Server not found in storage.');
      console.log(`Starting Daemon for Server: ${server.name}`);
      await connectionManager.connect(server);
      return { success: true };
    } else {
      console.log('Stopping Daemon & Disconnecting Proxy');
      await connectionManager.disconnect();
      return { success: true };
    }
  } catch (error: any) {
    console.error('Toggle proxy error:', error);
    return { error: error.message || 'Unknown error' };
  }
}

async function handlePingServer(
  message: any,
  connectionManager: ConnectionManager
): Promise<{ success: true; latencyMs: number } | { success: false; error: string }> {
  try {
    const server: ProxyServer = message.server;
    if (!server) throw new Error('No server provided for ping');
    const latencyMs = await connectionManager.pingServer(server, message.timeoutMs || 3000);
    return { success: true, latencyMs };
  } catch (error: any) {
    return { success: false, error: error.message || 'Ping failed' };
  }
}

async function handlePingAll(
  message: any,
  connectionManager: ConnectionManager,
  settingsRepo: SettingsRepository
): Promise<{ success: true; results: any[] } | { success: false; error: string }> {
  try {
    const servers: ProxyServer[] = message.servers || await settingsRepo.get('proxyServers');
    const results = await Promise.all(
      servers.map(async (server) => {
        try {
          const latencyMs = await connectionManager.pingServer(server, message.timeoutMs || 3000);
          return { serverId: server.id, latencyMs };
        } catch (err: any) {
          return { serverId: server.id, error: err.message || 'Error' };
        }
      })
    );
    return { success: true, results };
  } catch (error: any) {
    return { success: false, error: error.message || 'Batch ping failed' };
  }
}
