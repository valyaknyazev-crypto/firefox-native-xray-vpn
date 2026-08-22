import { expect, describe, it, vi, beforeEach } from 'vitest';
import { syncSubscription } from './subscription';
import browser from 'webextension-polyfill';
import { STORAGE_KEYS } from './types';

// Mock webextension-polyfill
vi.mock('webextension-polyfill', () => {
  let storage: any = {};
  return {
    default: {
      storage: {
        local: {
          get: vi.fn(async (keys) => {
            if (typeof keys === 'string') return { [keys]: storage[keys] };
            if (Array.isArray(keys)) {
              const res: any = {};
              keys.forEach(k => res[k] = storage[k]);
              return res;
            }
            return storage;
          }),
          set: vi.fn(async (payload) => {
            storage = { ...storage, ...payload };
          }),
          _reset: () => { storage = {}; },
          _setStorage: (initial: any) => { storage = initial; }
        }
      }
    }
  };
});

describe('syncSubscription', () => {
  beforeEach(() => {
    (browser.storage.local as any)._reset();
    vi.clearAllMocks();
  });

  it('handles "mock" url by generating test data', async () => {
    const result = await syncSubscription('mock://test');
    expect(result.servers).toHaveLength(2);
    expect(result.servers[0].name).toContain('Netherlands');
    
    // Verify storage was updated
    expect(browser.storage.local.set).toHaveBeenCalledWith(
      expect.objectContaining({
        [STORAGE_KEYS.SUBSCRIPTION_URL]: 'mock://test',
        [STORAGE_KEYS.PROXY_SERVERS]: expect.any(Array),
        [STORAGE_KEYS.LAST_SYNCED_AT]: expect.any(Number)
      })
    );
  });

  it('fetches and parses a real URL using provided fetchFn', async () => {
    const fakeText = `vless://mock-uuid@host1:443?type=tcp#Test1\nvless://mock2@host2:443?type=tcp#Test2`;
    const fakeFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue(fakeText)
    });

    const result = await syncSubscription('https://example.com/sub', fakeFetch as any);
    
    expect(fakeFetch).toHaveBeenCalledWith('https://example.com/sub', expect.any(Object));
    expect(result.servers).toHaveLength(2);
    expect(result.servers[0].name).toBe('Test1');
  });

  it('throws an error if no supported servers are found', async () => {
    const fakeFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue(`invalid data here`)
    });

    await expect(syncSubscription('https://example.com/sub', fakeFetch as any)).rejects.toThrow(/No supported servers/);
  });

  it('clears selection if current selected server is no longer in the subscription', async () => {
    (browser.storage.local as any)._setStorage({
      [STORAGE_KEYS.SELECTED_PROXY_SERVER_ID]: 'old-id-not-in-new-sub'
    });

    const fakeFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue(`vless://mock1@host1:443?type=tcp#Test1`)
    });

    const result = await syncSubscription('https://example.com/sub', fakeFetch as any);
    
    expect(result.selectionCleared).toBe(true);
    expect(browser.storage.local.set).toHaveBeenCalledWith(
      expect.objectContaining({
        [STORAGE_KEYS.SELECTED_PROXY_SERVER_ID]: null,
        [STORAGE_KEYS.CONNECTED]: false
      })
    );
  });

  it('keeps selection if current selected server is still in the subscription', async () => {
    const fakeFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue(`vless://mock1@host1:443?type=tcp#Test1`)
    });
    
    // Test1 will get a random UUID, so we need to intercept parsing or mock the ID
    // Let's just mock the randomUUID to be predictable
    const originalRandomUUID = crypto.randomUUID;
    crypto.randomUUID = vi.fn().mockReturnValue('mock-id-1');

    (browser.storage.local as any)._setStorage({
      [STORAGE_KEYS.SELECTED_PROXY_SERVER_ID]: 'mock-id-1'
    });

    const result = await syncSubscription('https://example.com/sub', fakeFetch as any);
    
    expect(result.selectionCleared).toBe(false);
    expect(browser.storage.local.set).not.toHaveBeenCalledWith(
      expect.objectContaining({
        [STORAGE_KEYS.SELECTED_PROXY_SERVER_ID]: null
      })
    );

    crypto.randomUUID = originalRandomUUID;
  });

  it('resolves servers via fetchFn fixture without any URL magic string (SubscriptionSource internal seam)', async () => {
    // This test verifies the internal resolveSource seam:
    // The URL is a plain HTTPS URL — no "mock" substring.
    // The fetchFn returns a fixture payload directly.
    // This proves the seam is exercised cleanly without URL-string hacks.
    const fixturePayload = [
      { id: 'fixture-1', name: 'Fixture Server DE', host: 'de.fixture.test', port: 443, type: 'vless', uuid: 'abc-123', network: 'tcp', security: 'tls' }
    ];
    const fixtureFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue(JSON.stringify(fixturePayload))
    });

    const result = await syncSubscription('https://sub.example.com/real', fixtureFetch as any);

    expect(fixtureFetch).toHaveBeenCalledWith('https://sub.example.com/real', expect.objectContaining({
      headers: expect.objectContaining({ 'User-Agent': expect.stringContaining('happ') })
    }));
    expect(result.servers).toHaveLength(1);
    expect(result.servers[0].name).toBe('Fixture Server DE');
    expect(result.selectionCleared).toBe(false);
  });
});
