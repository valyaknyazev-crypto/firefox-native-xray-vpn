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

import browser from 'webextension-polyfill';
import App from './App';
import { ProxyServer, MESSAGES } from './types';

describe('App Component — Modern Glass UI & Vector Icon Redesign', () => {
  const mockServers: ProxyServer[] = [
    {
      id: 'server-1',
      name: 'Tokyo Fast Node',
      type: 'vless',
      host: 'tokyo.example.com',
      port: 443,
      uuid: 'uuid-1',
      network: 'ws',
      security: 'tls',
    },
    {
      id: 'server-2',
      name: 'Frankfurt Direct Node',
      type: 'vmess',
      host: 'fra.example.com',
      port: 8443,
      uuid: 'uuid-2',
      network: 'tcp',
      security: 'none',
    },
    {
      id: 'server-3',
      name: 'Singapore Ultra Node',
      type: 'trojan',
      host: 'sg.example.com',
      port: 443,
      uuid: 'uuid-3',
      network: 'grpc',
      security: 'reality',
    },
  ];

  let mockSettingsRepo: any;

  beforeEach(() => {
    vi.clearAllMocks();
    window.alert = vi.fn();

    mockSettingsRepo = {
      getSettings: vi.fn().mockResolvedValue({
        connected: false,
        proxyServers: mockServers,
        selectedProxyServerId: null,
      }),
      subscribe: vi.fn().mockReturnValue(() => {}),
      set: vi.fn().mockResolvedValue(undefined),
    };
  });

  afterEach(() => {
    cleanup();
  });

  describe('Zero Unicode Emojis in Rendered DOM', () => {
    it('contains absolute zero emoji characters when rendered with servers', () => {
      const { container } = render(
        <App
          initialConnected={false}
          initialServers={mockServers}
          initialSelectedId={null}
          settingsRepo={mockSettingsRepo}
          initialPingStates={{
            'server-1': { latencyMs: 65 },
            'server-2': { loading: true },
            'server-3': { error: 'Timeout' },
          }}
        />
      );

      const html = container.innerHTML;
      // Comprehensive Unicode emoji range
      const emojiRegex = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
      expect(emojiRegex.test(html)).toBe(false);

      // Explicit check for previously used emojis
      expect(html).not.toContain('📡');
      expect(html).not.toContain('⚡');
      expect(html).not.toContain('⏳');
      expect(html).not.toContain('⚠️');
    });

    it('contains zero emoji characters in empty state', () => {
      const { container } = render(
        <App
          initialConnected={false}
          initialServers={[]}
          initialSelectedId={null}
          settingsRepo={mockSettingsRepo}
        />
      );

      const html = container.innerHTML;
      const emojiRegex = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
      expect(emojiRegex.test(html)).toBe(false);
      expect(html).not.toContain('📡');
    });
  });

  describe('Vector Icons Rendering', () => {
    it('renders vector icons from Icons.tsx (TowerIcon, ZapIcon, SignalBarsIcon, RefreshCwIcon, SettingsIcon, ExternalLinkIcon)', () => {
      const { container } = render(
        <App
          initialConnected={false}
          initialServers={mockServers}
          initialSelectedId="server-1"
          settingsRepo={mockSettingsRepo}
          initialPingStates={{
            'server-1': { latencyMs: 45 },
            'server-2': { loading: true },
            'server-3': { error: 'Unreachable' },
          }}
        />
      );

      // Section header TowerIcon
      const svgElements = container.querySelectorAll('svg');
      expect(svgElements.length).toBeGreaterThan(5);

      // All SVGs have viewBox 0 0 24 24
      svgElements.forEach((svg) => {
        expect(svg.getAttribute('viewBox')).toBe('0 0 24 24');
      });

      // ZapIcon is rendered on "Ping All" and "Connect" button
      const zapPolygon = container.querySelectorAll('polygon[points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"]');
      expect(zapPolygon.length).toBeGreaterThanOrEqual(1);

      // SignalBarsIcon lines are rendered for server-1 latency
      const signalLines = container.querySelectorAll('.latency-good svg line');
      expect(signalLines.length).toBe(3);

      // RefreshCwIcon is rendered for loading server-2
      const spinningIcon = container.querySelector('.latency-loading svg.animate-spin');
      expect(spinningIcon).not.toBeNull();

      // AlertCircleIcon is rendered for error server-3
      const errorBadge = container.querySelector('.latency-error');
      expect(errorBadge).not.toBeNull();
      expect(errorBadge?.textContent).toContain('Err');

      // SettingsIcon is rendered in footer
      const settingsLinks = container.querySelectorAll('.footer-link');
      expect(settingsLinks.length).toBe(2);

      // ExternalLinkIcon is rendered in footer GitHub link
      const githubLink = screen.getByText('GitHub');
      expect(githubLink).toBeDefined();
    });

    it('renders TowerIcon in empty state with custom call-to-action button', () => {
      const { container } = render(
        <App
          initialConnected={false}
          initialServers={[]}
          initialSelectedId={null}
          settingsRepo={mockSettingsRepo}
        />
      );

      expect(container.querySelector('.empty-tower-icon')).not.toBeNull();
      expect(screen.getByText('No Proxies Configured')).toBeDefined();
      expect(screen.getByText('Add Subscription')).toBeDefined();
    });
  });

  describe('Server Selection & State Updates', () => {
    it('updates selected server when clicked', async () => {
      render(
        <App
          initialConnected={false}
          initialServers={mockServers}
          initialSelectedId={null}
          settingsRepo={mockSettingsRepo}
        />
      );

      const serverNode = screen.getByText('Tokyo Fast Node');
      await act(async () => {
        fireEvent.click(serverNode);
      });

      expect(mockSettingsRepo.set).toHaveBeenCalledWith('selectedProxyServerId', 'server-1');
      const selectedItem = serverNode.closest('.server-item');
      expect(selectedItem?.classList.contains('selected')).toBe(true);
    });

    it('does not allow server selection while connected', async () => {
      render(
        <App
          initialConnected={true}
          initialServers={mockServers}
          initialSelectedId="server-1"
          settingsRepo={mockSettingsRepo}
        />
      );

      const secondServer = screen.getByText('Frankfurt Direct Node');
      await act(async () => {
        fireEvent.click(secondServer);
      });

      expect(mockSettingsRepo.set).not.toHaveBeenCalled();
    });

    it('selects server using keyboard Enter and Space keys', async () => {
      render(
        <App
          initialConnected={false}
          initialServers={mockServers}
          initialSelectedId={null}
          settingsRepo={mockSettingsRepo}
        />
      );

      const serverItems = screen.getAllByRole('button');
      const firstServerItem = serverItems.find((el) => el.classList.contains('server-item'));
      expect(firstServerItem).toBeDefined();

      // Test Space key
      await act(async () => {
        fireEvent.keyDown(firstServerItem!, { key: ' ' });
      });
      expect(mockSettingsRepo.set).toHaveBeenCalledWith('selectedProxyServerId', 'server-1');

      // Test Enter key on second server
      const secondServer = screen.getByText('Frankfurt Direct Node').closest('.server-item');
      await act(async () => {
        fireEvent.keyDown(secondServer!, { key: 'Enter' });
      });
      expect(mockSettingsRepo.set).toHaveBeenCalledWith('selectedProxyServerId', 'server-2');
    });

    it('renders long server names and tags with truncation without overflowing', () => {
      const longServer: ProxyServer = {
        id: 'long-server-1',
        name: 'Super Extremely Long Production Server Name That Exceeds Normal Length Bounds 2026',
        type: 'vless',
        host: 'very-long-domain-name.example.com',
        port: 443,
        uuid: 'uuid-long',
        network: 'grpc',
        security: 'reality-long-param-test',
      };

      const { container } = render(
        <App
          initialConnected={false}
          initialServers={[longServer]}
          initialSelectedId="long-server-1"
          settingsRepo={mockSettingsRepo}
        />
      );

      const nameEl = container.querySelector('.server-name');
      expect(nameEl?.getAttribute('title')).toContain('Super Extremely Long');
      expect(container.querySelector('.tag-proto')?.textContent).toBe('VLESS');
      expect(container.querySelector('.tag-net')?.textContent).toBe('GRPC');
      expect(container.querySelector('.tag-sec')?.textContent).toBe('REALITY-LONG-PARAM-TEST');
    });
  });

  describe('Inline NoticeBanner vs window.alert()', () => {
    it('clicking connect without server displays inline NoticeBanner instead of window.alert()', async () => {
      render(
        <App
          initialConnected={false}
          initialServers={mockServers}
          initialSelectedId={null}
          settingsRepo={mockSettingsRepo}
        />
      );

      const connectButton = screen.getByRole('button', { name: /connect/i });
      await act(async () => {
        fireEvent.click(connectButton);
      });

      // Crucial: window.alert must NOT have been called!
      expect(window.alert).not.toHaveBeenCalled();

      // NoticeBanner rendered inline
      const alertRole = screen.getByRole('alert');
      expect(alertRole).toBeDefined();
      expect(alertRole.textContent).toContain('Please select a Proxy Server first!');
      expect(alertRole.classList.contains('notice-banner-warning')).toBe(true);
    });

    it('dismisses notice banner when dismiss button is clicked', async () => {
      render(
        <App
          initialConnected={false}
          initialServers={mockServers}
          initialSelectedId={null}
          settingsRepo={mockSettingsRepo}
        />
      );

      const connectButton = screen.getByRole('button', { name: /connect/i });
      await act(async () => {
        fireEvent.click(connectButton);
      });

      expect(screen.getByRole('alert')).toBeDefined();

      const dismissBtn = screen.getByLabelText('Dismiss notice');
      await act(async () => {
        fireEvent.click(dismissBtn);
      });

      expect(screen.queryByRole('alert')).toBeNull();
    });

    it('daemon failure displays inline error notice with action link instead of window.alert()', async () => {
      vi.mocked(browser.runtime.sendMessage).mockRejectedValueOnce(
        new Error('connection refused at 127.0.0.1:18080')
      );

      render(
        <App
          initialConnected={false}
          initialServers={mockServers}
          initialSelectedId="server-1"
          settingsRepo={mockSettingsRepo}
        />
      );

      const connectButton = screen.getByRole('button', { name: /connect/i });
      await act(async () => {
        fireEvent.click(connectButton);
      });

      expect(window.alert).not.toHaveBeenCalled();

      const alertBanner = screen.getByRole('alert');
      expect(alertBanner).toBeDefined();
      expect(alertBanner.classList.contains('notice-banner-error')).toBe(true);
      expect(alertBanner.textContent).toContain('Native Daemon Connection Failed');
      expect(alertBanner.textContent).toContain('connection refused');

      // Action link to open settings
      const troubleshootBtn = screen.getByRole('button', { name: 'Troubleshoot' });
      expect(troubleshootBtn).toBeDefined();

      await act(async () => {
        fireEvent.click(troubleshootBtn);
      });
      expect(browser.runtime.openOptionsPage).toHaveBeenCalledTimes(1);
    });

    it('daemon failure with non-standard string rejection displays informative notice', async () => {
      vi.mocked(browser.runtime.sendMessage).mockRejectedValueOnce('Daemon process crashed: SIGSEGV');

      render(
        <App
          initialConnected={false}
          initialServers={mockServers}
          initialSelectedId="server-1"
          settingsRepo={mockSettingsRepo}
        />
      );

      const connectButton = screen.getByRole('button', { name: /connect/i });
      await act(async () => {
        fireEvent.click(connectButton);
      });

      const alertBanner = screen.getByRole('alert');
      expect(alertBanner).toBeDefined();
      expect(alertBanner.textContent).toContain('Daemon process crashed: SIGSEGV');
    });

    it('daemon failure with error object displays error message correctly', async () => {
      vi.mocked(browser.runtime.sendMessage).mockResolvedValueOnce({
        error: 'Proxy configuration invalid for xray-core',
      });

      render(
        <App
          initialConnected={false}
          initialServers={mockServers}
          initialSelectedId="server-1"
          settingsRepo={mockSettingsRepo}
        />
      );

      const connectButton = screen.getByRole('button', { name: /connect/i });
      await act(async () => {
        fireEvent.click(connectButton);
      });

      const alertBanner = screen.getByRole('alert');
      expect(alertBanner).toBeDefined();
      expect(alertBanner.textContent).toContain('Proxy configuration invalid for xray-core');
    });

    it('selecting a server clears the server required warning banner', async () => {
      render(
        <App
          initialConnected={false}
          initialServers={mockServers}
          initialSelectedId={null}
          settingsRepo={mockSettingsRepo}
        />
      );

      const connectButton = screen.getByRole('button', { name: /connect/i });
      await act(async () => {
        fireEvent.click(connectButton);
      });

      expect(screen.getByRole('alert')).toBeDefined();

      const serverNode = screen.getByText('Tokyo Fast Node');
      await act(async () => {
        fireEvent.click(serverNode);
      });

      expect(screen.queryByRole('alert')).toBeNull();
    });
  });

  describe('Latency Badge Tiers', () => {
    it('renders emerald tier (<100ms) with high signal bars', () => {
      const { container } = render(
        <App
          initialConnected={false}
          initialServers={[mockServers[0]]}
          initialSelectedId="server-1"
          settingsRepo={mockSettingsRepo}
          initialPingStates={{
            'server-1': { latencyMs: 42 },
          }}
        />
      );

      const badge = container.querySelector('.latency-badge');
      expect(badge?.classList.contains('latency-good')).toBe(true);
      expect(badge?.textContent).toContain('42 ms');

      // Check SignalBarsIcon high level (all 3 bars opacity 1)
      const lines = badge?.querySelectorAll('line');
      expect(lines?.length).toBe(3);
      lines?.forEach((line) => {
        expect(line.getAttribute('opacity')).toBe('1');
      });
    });

    it('renders amber tier (100-300ms) with medium signal bars', () => {
      const { container } = render(
        <App
          initialConnected={false}
          initialServers={[mockServers[0]]}
          initialSelectedId="server-1"
          settingsRepo={mockSettingsRepo}
          initialPingStates={{
            'server-1': { latencyMs: 185 },
          }}
        />
      );

      const badge = container.querySelector('.latency-badge');
      expect(badge?.classList.contains('latency-medium')).toBe(true);
      expect(badge?.textContent).toContain('185 ms');

      const lines = badge?.querySelectorAll('line');
      expect(lines?.length).toBe(3);
      expect(lines?.[0].getAttribute('opacity')).toBe('1');
      expect(lines?.[1].getAttribute('opacity')).toBe('1');
      expect(lines?.[2].getAttribute('opacity')).toBe('0.25');
    });

    it('renders rose tier (>300ms) with low signal bars', () => {
      const { container } = render(
        <App
          initialConnected={false}
          initialServers={[mockServers[0]]}
          initialSelectedId="server-1"
          settingsRepo={mockSettingsRepo}
          initialPingStates={{
            'server-1': { latencyMs: 420 },
          }}
        />
      );

      const badge = container.querySelector('.latency-badge');
      expect(badge?.classList.contains('latency-bad')).toBe(true);
      expect(badge?.textContent).toContain('420 ms');

      const lines = badge?.querySelectorAll('line');
      expect(lines?.length).toBe(3);
      expect(lines?.[0].getAttribute('opacity')).toBe('1');
      expect(lines?.[1].getAttribute('opacity')).toBe('0.25');
      expect(lines?.[2].getAttribute('opacity')).toBe('0.25');
    });

    it('renders loading spinner with RefreshCwIcon', () => {
      const { container } = render(
        <App
          initialConnected={false}
          initialServers={[mockServers[0]]}
          initialSelectedId="server-1"
          settingsRepo={mockSettingsRepo}
          initialPingStates={{
            'server-1': { loading: true },
          }}
        />
      );

      const badge = container.querySelector('.latency-loading');
      expect(badge).not.toBeNull();
      expect(badge?.querySelector('.animate-spin')).not.toBeNull();
      expect(badge?.textContent).toContain('...');
    });

    it('renders error state with AlertCircleIcon', () => {
      const { container } = render(
        <App
          initialConnected={false}
          initialServers={[mockServers[0]]}
          initialSelectedId="server-1"
          settingsRepo={mockSettingsRepo}
          initialPingStates={{
            'server-1': { error: 'Host unreachable' },
          }}
        />
      );

      const badge = container.querySelector('.latency-error');
      expect(badge).not.toBeNull();
      expect(badge?.getAttribute('title')).toBe('Host unreachable');
      expect(badge?.textContent).toContain('Err');
    });

    it('renders exact boundary values correctly (99ms, 100ms, 300ms, 301ms)', () => {
      // 99ms -> emerald (<100ms)
      const { container: c99 } = render(
        <App
          initialConnected={false}
          initialServers={[mockServers[0]]}
          initialSelectedId="server-1"
          settingsRepo={mockSettingsRepo}
          initialPingStates={{ 'server-1': { latencyMs: 99 } }}
        />
      );
      expect(c99.querySelector('.latency-good')).not.toBeNull();

      // 100ms -> amber (100-300ms)
      const { container: c100 } = render(
        <App
          initialConnected={false}
          initialServers={[mockServers[0]]}
          initialSelectedId="server-1"
          settingsRepo={mockSettingsRepo}
          initialPingStates={{ 'server-1': { latencyMs: 100 } }}
        />
      );
      expect(c100.querySelector('.latency-medium')).not.toBeNull();
      expect(c100.querySelector('.latency-good')).toBeNull();

      // 300ms -> amber (100-300ms)
      const { container: c300 } = render(
        <App
          initialConnected={false}
          initialServers={[mockServers[0]]}
          initialSelectedId="server-1"
          settingsRepo={mockSettingsRepo}
          initialPingStates={{ 'server-1': { latencyMs: 300 } }}
        />
      );
      expect(c300.querySelector('.latency-medium')).not.toBeNull();
      expect(c300.querySelector('.latency-bad')).toBeNull();

      // 301ms -> rose (>300ms)
      const { container: c301 } = render(
        <App
          initialConnected={false}
          initialServers={[mockServers[0]]}
          initialSelectedId="server-1"
          settingsRepo={mockSettingsRepo}
          initialPingStates={{ 'server-1': { latencyMs: 301 } }}
        />
      );
      expect(c301.querySelector('.latency-bad')).not.toBeNull();
    });

    it('does not render latency badge for negative or non-finite latency values', () => {
      const { container } = render(
        <App
          initialConnected={false}
          initialServers={[mockServers[0]]}
          initialSelectedId="server-1"
          settingsRepo={mockSettingsRepo}
          initialPingStates={{
            'server-1': { latencyMs: -1 },
          }}
        />
      );

      expect(container.querySelector('.latency-badge')).toBeNull();
    });
  });

  describe('Ping All Button & Power Button Glowing Transitions', () => {
    it('Ping All button triggers probe and displays spinning icon while testing', async () => {
      let resolvePing: (val: any) => void = () => {};
      const pingPromise = new Promise((resolve) => {
        resolvePing = resolve;
      });

      vi.mocked(browser.runtime.sendMessage).mockImplementation(async (msg: any) => {
        if (msg.type === MESSAGES.PING_ALL) {
          return await pingPromise;
        }
        return {};
      });

      render(
        <App
          initialConnected={false}
          initialServers={mockServers}
          initialSelectedId="server-1"
          settingsRepo={mockSettingsRepo}
        />
      );

      const pingBtn = screen.getByTitle('Test ping to all servers');
      expect(pingBtn.textContent).toContain('Ping All');

      // Click Ping All
      await act(async () => {
        fireEvent.click(pingBtn);
      });

      // Now should show Testing... with spinning icon
      expect(pingBtn.textContent).toContain('Testing...');
      expect(pingBtn.querySelector('.animate-spin')).not.toBeNull();

      // Complete probe
      await act(async () => {
        resolvePing({
          success: true,
          results: [
            { serverId: 'server-1', latencyMs: 50 },
            { serverId: 'server-2', latencyMs: 120 },
            { serverId: 'server-3', latencyMs: 380 },
          ],
        });
      });

      expect(pingBtn.textContent).toContain('Ping All');
      expect(pingBtn.querySelector('.animate-spin')).toBeNull();
    });

    it('toggles power button with connected-glow styling when connected vs disconnected', async () => {
      vi.mocked(browser.runtime.sendMessage).mockResolvedValue({ success: true });

      render(
        <App
          initialConnected={false}
          initialServers={mockServers}
          initialSelectedId="server-1"
          settingsRepo={mockSettingsRepo}
        />
      );

      const powerButton = screen.getByRole('button', { name: /connect/i });
      expect(powerButton.classList.contains('btn-connect')).toBe(true);
      expect(powerButton.classList.contains('connected-glow')).toBe(false);

      await act(async () => {
        fireEvent.click(powerButton);
      });

      // After connecting, button has connected-glow and btn-disconnect
      expect(powerButton.classList.contains('btn-disconnect')).toBe(true);
      expect(powerButton.classList.contains('connected-glow')).toBe(true);
      expect(powerButton.textContent).toContain('Disconnect');
    });
  });
});
