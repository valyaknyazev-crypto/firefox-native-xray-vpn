const USER_AGENT = 'happ/3.3.6 (Windows 11_10.0.22631 PC_x86_64)';
import { ProxyServer } from './types';
import { parseSubscription } from './utils/parser';
import { SettingsRepository, defaultSettingsRepository } from './settings-repository';

export interface SyncResult {
  servers: ProxyServer[];
  selectionCleared: boolean;
}

/**
 * SubscriptionSource: internal seam that resolves raw server configuration text
 * from a URL. Not exported; used only within this module for testability.
 *
 * Concentrates all source-type discrimination in one place:
 * - "mock" substring → returns hardcoded fixture data string
 * - raw URI lines (vless://, vmess://, trojan://, JSON) → returns the url string as-is
 * - everything else → HTTP fetch with User-Agent header
 */
async function resolveSource(
  url: string,
  fetchFn: typeof fetch
): Promise<string> {
  if (url.includes('mock')) {
    // Simulate network delay for realistic mock behaviour
    await new Promise(r => setTimeout(r, 500));
    return JSON.stringify([
      { id: '1', name: '🇳🇱 Netherlands - Amsterdam', host: 'nl.proxy.mock', port: 443, type: 'vless', uuid: 'mock-1', network: 'tcp', security: 'none', sni: '', fp: '', path: '', hostHeader: '', pbk: '', sid: '', flow: '', alpn: '' },
      { id: '2', name: '🇺🇸 USA - New York', host: 'us.proxy.mock', port: 443, type: 'shadowsocks', uuid: 'mock-2', network: 'tcp', security: 'none', sni: '', fp: '', path: '', hostHeader: '', pbk: '', sid: '', flow: '', alpn: '' }
    ]);
  }

  const trimmed = url.trim();
  if (
    trimmed.startsWith('{') ||
    trimmed.startsWith('[') ||
    trimmed.startsWith('vless://') ||
    trimmed.startsWith('vmess://') ||
    trimmed.startsWith('trojan://')
  ) {
    // Raw config text passed directly — return as-is for parseSubscription
    return trimmed;
  }

  // Remote HTTP subscription URL
  const response = await fetchFn(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!response.ok) throw new Error('HTTP ' + response.status + ' ' + response.statusText);
  return response.text();
}

export async function syncSubscription(
  url: string,
  fetchFn: typeof fetch = globalThis.fetch.bind(globalThis),
  settingsRepo: SettingsRepository = defaultSettingsRepository
): Promise<SyncResult> {
  const raw = await resolveSource(url, fetchFn);
  const data: ProxyServer[] = parseSubscription(raw);

  if (data.length === 0) {
    const preview = raw.substring(0, 40);
    throw new Error('No supported servers found. Raw preview: ' + preview);
  }

  const currentSelectedId = await settingsRepo.get('selectedProxyServerId');
  let selectionCleared = false;

  const updatePayload: any = {
    subscriptionUrl: url,
    proxyServers: data,
    lastSyncedAt: Date.now()
  };

  if (currentSelectedId && !data.find(s => s.id === currentSelectedId)) {
    updatePayload.selectedProxyServerId = null;
    updatePayload.connected = false;
    selectionCleared = true;
  }

  await settingsRepo.updateSettings(updatePayload);
  return { servers: data, selectionCleared };
}
