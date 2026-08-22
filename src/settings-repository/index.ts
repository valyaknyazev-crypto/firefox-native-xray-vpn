import browser from 'webextension-polyfill';
import { ProxyServer, RoutingMode, RoutingRule, STORAGE_KEYS } from '../types';

export interface VpnSettings {
  proxyServers: ProxyServer[];
  selectedProxyServerId: string | null;
  connected: boolean;
  subscriptionUrl: string;
  routingMode: RoutingMode;
  routingRules: RoutingRule[];
  lastSyncedAt: number | null;
}

export const DEFAULT_SETTINGS: VpnSettings = {
  proxyServers: [],
  selectedProxyServerId: null,
  connected: false,
  subscriptionUrl: '',
  routingMode: 'Global',
  routingRules: [],
  lastSyncedAt: null,
};

export interface StorageAdapter {
  get: (keys?: string | string[] | null) => Promise<Record<string, any>>;
  set: (items: Record<string, any>) => Promise<void>;
  onChanged?: {
    addListener: (callback: (changes: Record<string, any>, areaName: string) => void) => void;
    removeListener: (callback: (changes: Record<string, any>, areaName: string) => void) => void;
  };
}

export interface SettingsRepositoryOptions {
  adapter?: StorageAdapter;
}

export interface SettingsRepository {
  getSettings(): Promise<VpnSettings>;
  get<K extends keyof VpnSettings>(key: K): Promise<VpnSettings[K]>;
  updateSettings(partial: Partial<VpnSettings>): Promise<void>;
  set<K extends keyof VpnSettings>(key: K, value: VpnSettings[K]): Promise<void>;
  subscribe(listener: (settings: VpnSettings) => void): () => void;
}

export function createSettingsRepository(options?: SettingsRepositoryOptions): SettingsRepository {
  const adapter: StorageAdapter = options?.adapter ?? {
    get: (keys) => browser.storage.local.get(keys || undefined),
    set: (items) => browser.storage.local.set(items),
    onChanged: browser.storage.onChanged ? {
      addListener: (cb) => browser.storage.onChanged.addListener(cb),
      removeListener: (cb) => browser.storage.onChanged.removeListener(cb)
    } : undefined
  };

  const subscribers = new Set<(settings: VpnSettings) => void>();

  if (adapter.onChanged) {
    adapter.onChanged.addListener(async (_changes, areaName) => {
      if (areaName === 'local' && subscribers.size > 0) {
        const current = await getSettings();
        subscribers.forEach(cb => cb(current));
      }
    });
  }

  async function getSettings(): Promise<VpnSettings> {
    const raw = await adapter.get(null);
    return {
      proxyServers: Array.isArray(raw[STORAGE_KEYS.PROXY_SERVERS]) ? raw[STORAGE_KEYS.PROXY_SERVERS] : DEFAULT_SETTINGS.proxyServers,
      selectedProxyServerId: raw[STORAGE_KEYS.SELECTED_PROXY_SERVER_ID] ?? DEFAULT_SETTINGS.selectedProxyServerId,
      connected: typeof raw[STORAGE_KEYS.CONNECTED] === 'boolean' ? raw[STORAGE_KEYS.CONNECTED] : DEFAULT_SETTINGS.connected,
      subscriptionUrl: typeof raw[STORAGE_KEYS.SUBSCRIPTION_URL] === 'string' ? raw[STORAGE_KEYS.SUBSCRIPTION_URL] : DEFAULT_SETTINGS.subscriptionUrl,
      routingMode: raw[STORAGE_KEYS.ROUTING_MODE] ?? DEFAULT_SETTINGS.routingMode,
      routingRules: Array.isArray(raw[STORAGE_KEYS.ROUTING_RULES]) ? raw[STORAGE_KEYS.ROUTING_RULES] : DEFAULT_SETTINGS.routingRules,
      lastSyncedAt: typeof raw[STORAGE_KEYS.LAST_SYNCED_AT] === 'number' ? raw[STORAGE_KEYS.LAST_SYNCED_AT] : DEFAULT_SETTINGS.lastSyncedAt,
    };
  }

  async function get<K extends keyof VpnSettings>(key: K): Promise<VpnSettings[K]> {
    const settings = await getSettings();
    return settings[key];
  }

  async function updateSettings(partial: Partial<VpnSettings>): Promise<void> {
    const payload: Record<string, any> = {};
    if (partial.proxyServers !== undefined) payload[STORAGE_KEYS.PROXY_SERVERS] = partial.proxyServers;
    if (partial.selectedProxyServerId !== undefined) payload[STORAGE_KEYS.SELECTED_PROXY_SERVER_ID] = partial.selectedProxyServerId;
    if (partial.connected !== undefined) payload[STORAGE_KEYS.CONNECTED] = partial.connected;
    if (partial.subscriptionUrl !== undefined) payload[STORAGE_KEYS.SUBSCRIPTION_URL] = partial.subscriptionUrl;
    if (partial.routingMode !== undefined) payload[STORAGE_KEYS.ROUTING_MODE] = partial.routingMode;
    if (partial.routingRules !== undefined) payload[STORAGE_KEYS.ROUTING_RULES] = partial.routingRules;
    if (partial.lastSyncedAt !== undefined) payload[STORAGE_KEYS.LAST_SYNCED_AT] = partial.lastSyncedAt;

    await adapter.set(payload);
  }

  async function set<K extends keyof VpnSettings>(key: K, value: VpnSettings[K]): Promise<void> {
    await updateSettings({ [key]: value });
  }

  function subscribe(listener: (settings: VpnSettings) => void): () => void {
    subscribers.add(listener);
    return () => {
      subscribers.delete(listener);
    };
  }

  return {
    getSettings,
    get,
    updateSettings,
    set,
    subscribe,
  };
}

export const defaultSettingsRepository = createSettingsRepository();
