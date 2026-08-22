import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('webextension-polyfill', () => ({
  default: {
    storage: {
      local: {
        get: vi.fn(),
        set: vi.fn()
      },
      onChanged: {
        addListener: vi.fn(),
        removeListener: vi.fn()
      }
    }
  }
}));

import { createSettingsRepository, DEFAULT_SETTINGS } from './index';

describe('SettingsRepository', () => {
  let mockStorage: Record<string, any>;
  let changeListeners: Function[];

  let storageAdapter: any;

  beforeEach(() => {
    mockStorage = {};
    changeListeners = [];

    storageAdapter = {
      get: vi.fn(async (keys?: any) => {
        if (!keys) return { ...mockStorage };
        if (typeof keys === 'string') return { [keys]: mockStorage[keys] };
        if (Array.isArray(keys)) {
          const res: Record<string, any> = {};
          keys.forEach(k => { res[k] = mockStorage[k]; });
          return res;
        }
        return { ...mockStorage };
      }),
      set: vi.fn(async (items: Record<string, any>) => {
        const changes: Record<string, any> = {};
        for (const [k, v] of Object.entries(items)) {
          changes[k] = { oldValue: mockStorage[k], newValue: v };
          mockStorage[k] = v;
        }
        changeListeners.forEach(l => l(changes, 'local'));
      }),
      onChanged: {
        addListener: vi.fn((fn) => changeListeners.push(fn)),
        removeListener: vi.fn((fn) => {
          changeListeners = changeListeners.filter(l => l !== fn);
        })
      }
    };
  });

  it('returns default settings when storage is empty', async () => {
    const repo = createSettingsRepository({ adapter: storageAdapter });
    const settings = await repo.getSettings();

    expect(settings).toEqual(DEFAULT_SETTINGS);
    expect(settings.routingMode).toBe('Global');
    expect(settings.proxyServers).toEqual([]);
    expect(settings.connected).toBe(false);
  });

  it('reads specific fields with fallback to defaults', async () => {
    mockStorage['routingMode'] = 'Smart';
    const repo = createSettingsRepository({ adapter: storageAdapter });

    const mode = await repo.get('routingMode');
    const servers = await repo.get('proxyServers');

    expect(mode).toBe('Smart');
    expect(servers).toEqual([]);
  });

  it('updates partial settings and persists them to storage', async () => {
    const repo = createSettingsRepository({ adapter: storageAdapter });

    await repo.updateSettings({
      routingMode: 'Custom',
      subscriptionUrl: 'https://example.com/sub'
    });

    expect(storageAdapter.set).toHaveBeenCalledWith({
      routingMode: 'Custom',
      subscriptionUrl: 'https://example.com/sub'
    });

    const settings = await repo.getSettings();
    expect(settings.routingMode).toBe('Custom');
    expect(settings.subscriptionUrl).toBe('https://example.com/sub');
  });

  it('notifies subscribers when settings change', async () => {
    const repo = createSettingsRepository({ adapter: storageAdapter });
    const listener = vi.fn();

    const unsubscribe = repo.subscribe(listener);

    await repo.set('connected', true);

    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        connected: true
      })
    );

    unsubscribe();
    await repo.set('connected', false);

    // Should not be called again after unsubscribe
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
