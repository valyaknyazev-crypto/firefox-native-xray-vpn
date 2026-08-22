import { RoutingMode, RoutingRule } from '../types';
import { createConnectionManager } from '../connection-manager';
import { defaultSettingsRepository } from '../settings-repository';
import { registerMessageHandlers } from './message-handlers';
import { registerAlarms } from './alarms';

let currentMode: RoutingMode = 'Global';
let currentRoutingRules: RoutingRule[] = [];

const connectionManager = createConnectionManager({
  getRoutingMode: () => currentMode,
  getRoutingRules: () => currentRoutingRules
});

// Keep routing state in sync with persisted settings
defaultSettingsRepository.subscribe((settings) => {
  currentMode = settings.routingMode;
  currentRoutingRules = settings.routingRules;
});

// Register all message handlers (TOGGLE_PROXY, PING_SERVER, PING_ALL)
registerMessageHandlers(connectionManager, defaultSettingsRepository);

// Register subscription sync alarm (6-hour auto-update)
registerAlarms(defaultSettingsRepository);

// Restore connection on startup if the user was connected before
defaultSettingsRepository.getSettings().then(async (settings) => {
  currentMode = settings.routingMode;
  currentRoutingRules = settings.routingRules;

  if (settings.connected && settings.selectedProxyServerId) {
    const server = settings.proxyServers.find(s => s.id === settings.selectedProxyServerId);
    if (server) {
      try {
        await connectionManager.connect(server);
      } catch (err) {
        console.error('Failed to auto-start daemon on startup:', err);
      }
    }
  }
});
