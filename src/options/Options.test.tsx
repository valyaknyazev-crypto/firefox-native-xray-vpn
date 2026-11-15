// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';

vi.mock('webextension-polyfill', () => {
  return {
    default: {
      runtime: {
        sendMessage: vi.fn(),
        openOptionsPage: vi.fn(),
      },
      storage: {
        local: {
          get: vi.fn().mockResolvedValue({}),
          set: vi.fn().mockResolvedValue(undefined),
        },
        onChanged: {
          addListener: vi.fn(),
          removeListener: vi.fn(),
        },
      },
    },
  };
});

import Options from './Options';
import { VpnSettings, SettingsRepository } from '../settings-repository';
import { RoutingRule } from '../types';

function createMockSettingsRepo(initial?: Partial<VpnSettings>) {
  let settings: VpnSettings = {
    proxyServers: [],
    selectedProxyServerId: null,
    connected: false,
    subscriptionUrl: '',
    routingMode: 'Global',
    routingRules: [],
    lastSyncedAt: null,
    ...initial,
  };
  const listeners: Array<(s: VpnSettings) => void> = [];

  return {
    get currentSettings() {
      return settings;
    },
    getSettings: vi.fn().mockImplementation(async () => ({ ...settings })),
    get: vi.fn().mockImplementation(async (key: keyof VpnSettings) => settings[key]),
    set: vi.fn().mockImplementation(async (key: keyof VpnSettings, val: any) => {
      (settings as any)[key] = val;
      listeners.forEach(fn => fn({ ...settings }));
    }),
    updateSettings: vi.fn().mockImplementation(async (partial: Partial<VpnSettings>) => {
      settings = { ...settings, ...partial };
      listeners.forEach(fn => fn({ ...settings }));
    }),
    subscribe: vi.fn().mockImplementation((fn: (s: VpnSettings) => void) => {
      listeners.push(fn);
      return () => {
        const idx = listeners.indexOf(fn);
        if (idx !== -1) listeners.splice(idx, 1);
      };
    }),
    triggerUpdate(partial: Partial<VpnSettings>) {
      settings = { ...settings, ...partial };
      listeners.forEach(fn => fn({ ...settings }));
    },
  };
}

describe('Options Component — Modular Stylesheet & Vector Icon System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Zero Unicode Emojis in Rendered DOM', () => {
    const emojiRegex = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

    it('contains absolute zero emoji characters in initial default state', async () => {
      const mockRepo = createMockSettingsRepo();
      const { container } = render(<Options settingsRepo={mockRepo as unknown as SettingsRepository} />);

      await act(async () => {
        await Promise.resolve();
      });

      const html = container.innerHTML;
      expect(emojiRegex.test(html)).toBe(false);
      expect(html).not.toContain('📡');
      expect(html).not.toContain('🕒');
      expect(html).not.toContain('🧭');
      expect(html).not.toContain('⚠️');
      expect(html).not.toContain('⚡');
    });

    it('contains zero emoji characters when rendered with custom rules and active status', async () => {
      const mockRepo = createMockSettingsRepo({
        routingMode: 'Custom',
        routingRules: [
          { id: '1', pattern: 'google.com' },
          { id: '2', pattern: '*.internal.net' },
        ],
        lastSyncedAt: Date.now(),
      });

      const { container } = render(<Options settingsRepo={mockRepo as unknown as SettingsRepository} />);

      await act(async () => {
        await Promise.resolve();
      });

      const html = container.innerHTML;
      expect(emojiRegex.test(html)).toBe(false);
      expect(html).not.toContain('📡');
      expect(html).not.toContain('🕒');
      expect(html).not.toContain('🧭');
    });

    it('contains zero emoji characters when showing error and success status banners', async () => {
      const mockRepo = createMockSettingsRepo();
      render(<Options settingsRepo={mockRepo as unknown as SettingsRepository} />);

      await act(async () => {
        await Promise.resolve();
      });

      // Trigger empty sync error
      const syncBtn = screen.getByRole('button', { name: /sync/i });
      fireEvent.click(syncBtn);

      const errorBanner = screen.getByRole('status');
      expect(emojiRegex.test(errorBanner.innerHTML)).toBe(false);
      expect(errorBanner.innerHTML).not.toContain('⚠️');
    });
  });

  describe('Vector Icons Rendering', () => {
    it('renders vector icons (TowerIcon, ClockIcon, CompassIcon, RefreshCwIcon, CheckIcon, AlertCircleIcon)', async () => {
      const mockRepo = createMockSettingsRepo({
        routingMode: 'Global',
        lastSyncedAt: 1700000000000,
      });

      const { container } = render(<Options settingsRepo={mockRepo as unknown as SettingsRepository} />);

      await act(async () => {
        await Promise.resolve();
      });

      const svgs = container.querySelectorAll('svg');
      expect(svgs.length).toBeGreaterThanOrEqual(5);

      // Verify uniform viewBox
      svgs.forEach(svg => {
        expect(svg.getAttribute('viewBox')).toBe('0 0 24 24');
      });

      // TowerIcon in section header
      const towerCircle = container.querySelector('circle[cx="12"][cy="9"][r="2"]');
      expect(towerCircle).not.toBeNull();

      // ClockIcon in last synced meta
      const clockCircle = container.querySelector('circle[cx="12"][cy="12"][r="10"]');
      expect(clockCircle).not.toBeNull();

      // CompassIcon in traffic routing header
      const compassCircle = container.querySelector('polygon[points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"]');
      expect(compassCircle).not.toBeNull();

      // RefreshCwIcon in sync button
      const refreshPath = container.querySelector('path[d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"]');
      expect(refreshPath).not.toBeNull();

      // CheckIcon in active routing mode card
      const checkPolyline = container.querySelector('polyline[points="20 6 9 17 4 12"]');
      expect(checkPolyline).not.toBeNull();

      // AlertCircleIcon in card hint
      const alertLine = container.querySelector('line[x1="12"][y1="8"][x2="12"][y2="12"]');
      expect(alertLine).not.toBeNull();
    });

    it('renders TrashIcon and PlusIcon when in Custom routing mode', async () => {
      const mockRepo = createMockSettingsRepo({
        routingMode: 'Custom',
        routingRules: [{ id: 'rule-1', pattern: 'api.example.com' }],
      });

      const { container } = render(<Options settingsRepo={mockRepo as unknown as SettingsRepository} />);

      await act(async () => {
        await Promise.resolve();
      });

      // PlusIcon on Add Rule button
      const plusLine = container.querySelector('line[x1="12"][y1="5"][x2="12"][y2="19"]');
      expect(plusLine).not.toBeNull();

      // TrashIcon on Delete rule button
      const trashPath = container.querySelector('path[d="M3 6h18"]');
      expect(trashPath).not.toBeNull();

      // Check accessible label on delete button
      const deleteBtn = screen.getByRole('button', { name: /delete rule/i });
      expect(deleteBtn).toBeDefined();
    });
  });

  describe('Subscription Sync Management', () => {
    it('displays error status banner when syncing with empty URL', async () => {
      const mockRepo = createMockSettingsRepo();
      render(<Options settingsRepo={mockRepo as unknown as SettingsRepository} />);

      await act(async () => {
        await Promise.resolve();
      });

      const syncBtn = screen.getByRole('button', { name: /sync/i });
      fireEvent.click(syncBtn);

      const statusBanner = screen.getByRole('status');
      expect(statusBanner.textContent).toContain('Please enter a subscription URL');
      expect(statusBanner.className).toContain('status-banner-error');
    });

    it('calls syncSubscriptionFn and displays success status banner upon success', async () => {
      const mockRepo = createMockSettingsRepo();
      const mockSyncFn = vi.fn().mockResolvedValue({
        servers: [
          { id: 's1', name: 'Server 1' },
          { id: 's2', name: 'Server 2' },
        ],
        selectionCleared: false,
      });

      render(
        <Options
          settingsRepo={mockRepo as unknown as SettingsRepository}
          syncSubscriptionFn={mockSyncFn}
        />
      );

      await act(async () => {
        await Promise.resolve();
      });

      const input = screen.getByPlaceholderText(/https:\/\/example\.com\/sub/i);
      fireEvent.change(input, { target: { value: 'https://mysub.example.com/nodes' } });

      const syncBtn = screen.getByRole('button', { name: /sync/i });

      await act(async () => {
        fireEvent.click(syncBtn);
      });

      expect(mockSyncFn).toHaveBeenCalledWith('https://mysub.example.com/nodes');

      const statusBanner = await screen.findByRole('status');
      expect(statusBanner.textContent).toContain('Success! Loaded 2 proxy servers.');
      expect(statusBanner.className).toContain('status-banner-success');
    });

    it('handles Enter key on subscription URL input to trigger sync', async () => {
      const mockRepo = createMockSettingsRepo();
      const mockSyncFn = vi.fn().mockResolvedValue({
        servers: [{ id: 's1', name: 'Server 1' }],
      });

      render(
        <Options
          settingsRepo={mockRepo as unknown as SettingsRepository}
          syncSubscriptionFn={mockSyncFn}
        />
      );

      await act(async () => {
        await Promise.resolve();
      });

      const input = screen.getByPlaceholderText(/https:\/\/example\.com\/sub/i);
      fireEvent.change(input, { target: { value: 'mock' } });

      await act(async () => {
        fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
      });

      expect(mockSyncFn).toHaveBeenCalledWith('mock');
    });

    it('displays error status banner when syncSubscription fails', async () => {
      const mockRepo = createMockSettingsRepo();
      const mockSyncFn = vi.fn().mockRejectedValue(new Error('Connection timeout 504'));

      render(
        <Options
          settingsRepo={mockRepo as unknown as SettingsRepository}
          syncSubscriptionFn={mockSyncFn}
        />
      );

      await act(async () => {
        await Promise.resolve();
      });

      const input = screen.getByPlaceholderText(/https:\/\/example\.com\/sub/i);
      fireEvent.change(input, { target: { value: 'https://bad.link' } });

      const syncBtn = screen.getByRole('button', { name: /sync/i });

      await act(async () => {
        fireEvent.click(syncBtn);
      });

      const statusBanner = await screen.findByRole('status');
      expect(statusBanner.textContent).toContain('Sync failed: Connection timeout 504');
      expect(statusBanner.className).toContain('status-banner-error');
    });
  });

  describe('Traffic Routing Mode Switching', () => {
    it('switches routing mode to Smart and updates repository', async () => {
      const mockRepo = createMockSettingsRepo({ routingMode: 'Global' });
      render(<Options settingsRepo={mockRepo as unknown as SettingsRepository} />);

      await act(async () => {
        await Promise.resolve();
      });

      const smartRadio = screen.getByLabelText(/Smart Mode/i);
      await act(async () => {
        fireEvent.click(smartRadio);
      });

      expect(mockRepo.set).toHaveBeenCalledWith('routingMode', 'Smart');
      expect((smartRadio as HTMLInputElement).checked).toBe(true);
    });

    it('switches routing mode to Custom, displays custom rules section and updates repository', async () => {
      const mockRepo = createMockSettingsRepo({ routingMode: 'Global' });
      render(<Options settingsRepo={mockRepo as unknown as SettingsRepository} />);

      await act(async () => {
        await Promise.resolve();
      });

      // Custom rules section should initially be absent
      expect(screen.queryByText(/Custom Proxy Domains & IPs/i)).toBeNull();

      const customRadio = screen.getByLabelText(/Custom Rules/i);
      await act(async () => {
        fireEvent.click(customRadio);
      });

      expect(mockRepo.set).toHaveBeenCalledWith('routingMode', 'Custom');
      expect(screen.getByText(/Custom Proxy Domains & IPs/i)).toBeDefined();

      // Switch back to Global Mode
      const globalRadio = screen.getByLabelText(/Global Mode/i);
      await act(async () => {
        fireEvent.click(globalRadio);
      });

      expect(mockRepo.set).toHaveBeenCalledWith('routingMode', 'Global');
      expect(screen.queryByText(/Custom Proxy Domains & IPs/i)).toBeNull();
    });
  });

  describe('Custom Rules Manipulation', () => {
    it('adds new rule on button click and clears input', async () => {
      const mockRepo = createMockSettingsRepo({ routingMode: 'Custom', routingRules: [] });
      render(<Options settingsRepo={mockRepo as unknown as SettingsRepository} />);

      await act(async () => {
        await Promise.resolve();
      });

      const ruleInput = screen.getByPlaceholderText(/e\.g\. \*\.example\.com/i);
      fireEvent.change(ruleInput, { target: { value: 'chatgpt.com' } });

      const addBtn = screen.getByRole('button', { name: /add rule/i });
      await act(async () => {
        fireEvent.click(addBtn);
      });

      expect(screen.getByText('chatgpt.com')).toBeDefined();
      expect((ruleInput as HTMLInputElement).value).toBe('');
      expect(mockRepo.set).toHaveBeenCalledWith('routingRules', expect.arrayContaining([
        expect.objectContaining({ pattern: 'chatgpt.com' })
      ]));
    });

    it('adds new rule on Enter key press', async () => {
      const mockRepo = createMockSettingsRepo({ routingMode: 'Custom', routingRules: [] });
      render(<Options settingsRepo={mockRepo as unknown as SettingsRepository} />);

      await act(async () => {
        await Promise.resolve();
      });

      const ruleInput = screen.getByPlaceholderText(/e\.g\. \*\.example\.com/i);
      fireEvent.change(ruleInput, { target: { value: '*.google.com' } });

      await act(async () => {
        fireEvent.keyDown(ruleInput, { key: 'Enter', code: 'Enter' });
      });

      expect(screen.getByText('*.google.com')).toBeDefined();
      expect((ruleInput as HTMLInputElement).value).toBe('');
    });

    it('does not add rule when input is empty or whitespace', async () => {
      const mockRepo = createMockSettingsRepo({ routingMode: 'Custom', routingRules: [] });
      render(<Options settingsRepo={mockRepo as unknown as SettingsRepository} />);

      await act(async () => {
        await Promise.resolve();
      });

      const ruleInput = screen.getByPlaceholderText(/e\.g\. \*\.example\.com/i);
      fireEvent.change(ruleInput, { target: { value: '   ' } });

      const addBtn = screen.getByRole('button', { name: /add rule/i });
      await act(async () => {
        fireEvent.click(addBtn);
      });

      expect(mockRepo.set).not.toHaveBeenCalledWith('routingRules', expect.anything());
    });

    it('deletes rule when clicking TrashIcon button and updates repository', async () => {
      const initialRules: RoutingRule[] = [
        { id: 'rule-alpha', pattern: 'alpha.com' },
        { id: 'rule-beta', pattern: 'beta.com' },
      ];
      const mockRepo = createMockSettingsRepo({ routingMode: 'Custom', routingRules: initialRules });
      render(<Options settingsRepo={mockRepo as unknown as SettingsRepository} />);

      await act(async () => {
        await Promise.resolve();
      });

      expect(screen.getByText('alpha.com')).toBeDefined();
      expect(screen.getByText('beta.com')).toBeDefined();

      const deleteButtons = screen.getAllByRole('button', { name: /delete rule/i });
      expect(deleteButtons.length).toBe(2);

      // Delete first rule
      await act(async () => {
        fireEvent.click(deleteButtons[0]);
      });

      expect(screen.queryByText('alpha.com')).toBeNull();
      expect(screen.getByText('beta.com')).toBeDefined();
      expect(mockRepo.set).toHaveBeenCalledWith('routingRules', [{ id: 'rule-beta', pattern: 'beta.com' }]);
    });

    it('shows empty state message when no custom rules are configured', async () => {
      const mockRepo = createMockSettingsRepo({ routingMode: 'Custom', routingRules: [] });
      render(<Options settingsRepo={mockRepo as unknown as SettingsRepository} />);

      await act(async () => {
        await Promise.resolve();
      });

      expect(screen.getByText(/No custom rules configured/i)).toBeDefined();
    });

    it('prevents adding duplicate custom rules (case-insensitive)', async () => {
      const initialRules: RoutingRule[] = [{ id: 'rule-1', pattern: 'existing.com' }];
      const mockRepo = createMockSettingsRepo({ routingMode: 'Custom', routingRules: initialRules });
      render(<Options settingsRepo={mockRepo as unknown as SettingsRepository} />);

      await act(async () => {
        await Promise.resolve();
      });

      const ruleInput = screen.getByPlaceholderText(/e\.g\. \*\.example\.com/i);
      fireEvent.change(ruleInput, { target: { value: 'EXISTING.COM' } });

      const addBtn = screen.getByRole('button', { name: /add rule/i });
      await act(async () => {
        fireEvent.click(addBtn);
      });

      const matchedItems = screen.getAllByText(/existing\.com/i);
      expect(matchedItems.length).toBe(1);
      expect((ruleInput as HTMLInputElement).value).toBe('');
    });

    it('renders extreme 500-character rule strings safely with proper pattern styling', async () => {
      const longPattern = 'subdomain.' + 'a'.repeat(450) + '.example.org';
      const mockRepo = createMockSettingsRepo({
        routingMode: 'Custom',
        routingRules: [{ id: 'long-1', pattern: longPattern }],
      });
      const { container } = render(<Options settingsRepo={mockRepo as unknown as SettingsRepository} />);

      await act(async () => {
        await Promise.resolve();
      });

      const ruleElem = screen.getByText(longPattern);
      expect(ruleElem).toBeDefined();
      expect(ruleElem.className).toContain('rule-pattern');

      const emojiRegex = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
      expect(emojiRegex.test(container.innerHTML)).toBe(false);
    });

    it('generates distinct IDs for rapidly added rules', async () => {
      const mockRepo = createMockSettingsRepo({ routingMode: 'Custom', routingRules: [] });
      render(<Options settingsRepo={mockRepo as unknown as SettingsRepository} />);

      await act(async () => {
        await Promise.resolve();
      });

      const ruleInput = screen.getByPlaceholderText(/e\.g\. \*\.example\.com/i);
      const addBtn = screen.getByRole('button', { name: /add rule/i });

      await act(async () => {
        fireEvent.change(ruleInput, { target: { value: 'first.com' } });
        fireEvent.click(addBtn);
      });

      await act(async () => {
        fireEvent.change(ruleInput, { target: { value: 'second.com' } });
        fireEvent.click(addBtn);
      });

      const calls = mockRepo.set.mock.calls.filter(c => c[0] === 'routingRules');
      const latestRules: RoutingRule[] = calls[calls.length - 1][1];
      expect(latestRules.length).toBe(2);
      expect(latestRules[0].id).not.toBe(latestRules[1].id);
    });

    it('includes rule pattern in delete button accessible aria-label and title', async () => {
      const initialRules: RoutingRule[] = [{ id: 'r1', pattern: 'specific-target.org' }];
      const mockRepo = createMockSettingsRepo({ routingMode: 'Custom', routingRules: initialRules });
      render(<Options settingsRepo={mockRepo as unknown as SettingsRepository} />);

      await act(async () => {
        await Promise.resolve();
      });

      const deleteBtn = screen.getByRole('button', { name: /delete rule specific-target\.org/i });
      expect(deleteBtn).toBeDefined();
      expect(deleteBtn.getAttribute('title')).toBe('Delete rule specific-target.org');
    });

    it('does not add rule when Enter key is pressed on whitespace-only input', async () => {
      const mockRepo = createMockSettingsRepo({ routingMode: 'Custom', routingRules: [] });
      render(<Options settingsRepo={mockRepo as unknown as SettingsRepository} />);

      await act(async () => {
        await Promise.resolve();
      });

      const ruleInput = screen.getByPlaceholderText(/e\.g\. \*\.example\.com/i);
      fireEvent.change(ruleInput, { target: { value: '    ' } });

      await act(async () => {
        fireEvent.keyDown(ruleInput, { key: 'Enter', code: 'Enter' });
      });

      expect(mockRepo.set).not.toHaveBeenCalledWith('routingRules', expect.anything());
    });
  });

  describe('Live Repository Subscriptions & Input Retention', () => {
    it('preserves unsynced subscription URL input when switching routing modes', async () => {
      const mockRepo = createMockSettingsRepo({ routingMode: 'Global', subscriptionUrl: '' });
      render(<Options settingsRepo={mockRepo as unknown as SettingsRepository} />);

      await act(async () => {
        await Promise.resolve();
      });

      const input = screen.getByPlaceholderText(/https:\/\/example\.com\/sub/i) as HTMLInputElement;
      fireEvent.change(input, { target: { value: 'https://new-url-being-typed.com' } });
      expect(input.value).toBe('https://new-url-being-typed.com');

      const smartRadio = screen.getByLabelText(/Smart Mode/i);
      await act(async () => {
        fireEvent.click(smartRadio);
      });

      // User's uncommitted typing MUST NOT be erased by routing mode updates
      expect(input.value).toBe('https://new-url-being-typed.com');
      expect(mockRepo.set).toHaveBeenCalledWith('routingMode', 'Smart');
    });

    it('trims subscription URL whitespace before triggering syncSubscriptionFn', async () => {
      const mockRepo = createMockSettingsRepo();
      const mockSyncFn = vi.fn().mockResolvedValue({
        servers: [{ id: 's1', name: 'Server 1' }],
      });

      render(
        <Options
          settingsRepo={mockRepo as unknown as SettingsRepository}
          syncSubscriptionFn={mockSyncFn}
        />
      );

      await act(async () => {
        await Promise.resolve();
      });

      const input = screen.getByPlaceholderText(/https:\/\/example\.com\/sub/i);
      fireEvent.change(input, { target: { value: '   https://trimmed.example.com/sub   \n' } });

      const syncBtn = screen.getByRole('button', { name: /sync/i });
      await act(async () => {
        fireEvent.click(syncBtn);
      });

      expect(mockSyncFn).toHaveBeenCalledWith('https://trimmed.example.com/sub');
    });

    it('reacts to repository updates published by external actors', async () => {
      const mockRepo = createMockSettingsRepo({ routingMode: 'Global', subscriptionUrl: 'https://initial.com' });
      render(<Options settingsRepo={mockRepo as unknown as SettingsRepository} />);

      await act(async () => {
        await Promise.resolve();
      });

      const input = screen.getByPlaceholderText(/https:\/\/example\.com\/sub/i) as HTMLInputElement;
      expect(input.value).toBe('https://initial.com');

      // External update occurs
      await act(async () => {
        mockRepo.triggerUpdate({ subscriptionUrl: 'https://updated.com', routingMode: 'Smart' });
      });

      expect(input.value).toBe('https://updated.com');
      const smartRadio = screen.getByLabelText(/Smart Mode/i) as HTMLInputElement;
      expect(smartRadio.checked).toBe(true);
    });
  });
});
