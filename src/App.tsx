import { useState, useEffect } from 'react';
import browser from 'webextension-polyfill';
import { ProxyServer, MESSAGES, PingResult } from './types';
import { defaultSettingsRepository } from './settings-repository';
import {
  TowerIcon,
  ZapIcon,
  SignalBarsIcon,
  RefreshCwIcon,
  SettingsIcon,
  ExternalLinkIcon,
  AlertCircleIcon,
  CheckIcon,
  RadioDotIcon,
} from './components/Icons';
import { NoticeBanner } from './components/NoticeBanner';

import './popup.css';

export type LatencyTier = 'optimal' | 'moderate' | 'high' | 'offline';

export interface LatencyClassification {
  tier: LatencyTier;
  colorClass: string;
  signalLevel: 'high' | 'med' | 'low';
}

export function classifyLatency(latencyMs: number): LatencyClassification {
  if (latencyMs > 300) {
    return { tier: 'high', colorClass: 'latency-bad', signalLevel: 'low' };
  }
  if (latencyMs >= 100) {
    return { tier: 'moderate', colorClass: 'latency-medium', signalLevel: 'med' };
  }
  return { tier: 'optimal', colorClass: 'latency-good', signalLevel: 'high' };
}

interface ServerPingState {
  latencyMs?: number;
  error?: string;
  loading?: boolean;
}

export interface NoticeState {
  type: 'error' | 'warning' | 'info' | 'success';
  message: string;
  title?: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
}

export interface AppProps {
  initialConnected?: boolean;
  initialServers?: ProxyServer[];
  initialSelectedId?: string | null;
  settingsRepo?: typeof defaultSettingsRepository;
  initialPingStates?: Record<string, ServerPingState>;
}

function App({
  initialConnected,
  initialServers,
  initialSelectedId,
  settingsRepo = defaultSettingsRepository,
  initialPingStates,
}: AppProps = {}) {
  const [connected, setConnected] = useState(initialConnected ?? false);
  const [proxyServers, setProxyServers] = useState<ProxyServer[]>(initialServers ?? []);
  const [selectedProxyServerId, setSelectedProxyServerId] = useState<string | null>(
    initialSelectedId ?? null
  );
  const [pingStates, setPingStates] = useState<Record<string, ServerPingState>>(
    initialPingStates ?? {}
  );
  const [isPingingAll, setIsPingingAll] = useState(false);
  const [notice, setNotice] = useState<NoticeState | null>(null);

  useEffect(() => {
    settingsRepo.getSettings().then((settings) => {
      if (initialConnected === undefined) setConnected(settings.connected);
      if (initialServers === undefined) setProxyServers(settings.proxyServers);
      if (initialSelectedId === undefined) setSelectedProxyServerId(settings.selectedProxyServerId);
    });

    const unsubscribe = settingsRepo.subscribe((settings) => {
      setConnected(settings.connected);
      setProxyServers(settings.proxyServers);
      setSelectedProxyServerId(settings.selectedProxyServerId);
    });

    return unsubscribe;
  }, [settingsRepo, initialConnected, initialServers, initialSelectedId]);

  const openOptions = () => {
    browser.runtime.openOptionsPage();
  };

  const toggleConnection = async () => {
    if (!selectedProxyServerId && !connected) {
      setNotice({
        type: 'warning',
        title: 'Server Required',
        message: 'Please select a Proxy Server first!',
      });
      return;
    }
    const newState = !connected;

    try {
      const response = await browser.runtime.sendMessage({
        type: MESSAGES.TOGGLE_PROXY,
        connected: newState,
        proxyServerId: selectedProxyServerId,
      });

      if (response && response.error) {
        throw new Error(response.error);
      }

      setConnected(newState);
      setNotice(null);
    } catch (err: any) {
      const rawError =
        typeof err === 'string'
          ? err
          : err?.message || err?.error || 'Check if Native Daemon is installed and running.';
      const isDaemonOffline =
        /daemon|connection refused|connect error|unreachable|offline|native host/i.test(rawError);

      setNotice({
        type: 'error',
        title: isDaemonOffline ? 'Native Daemon Offline' : 'Connection Failed',
        message: isDaemonOffline
          ? `Native Daemon Connection Failed: ${rawError}`
          : `Connection Error: ${rawError}`,
        action: {
          label: 'Troubleshoot',
          onClick: openOptions,
        },
      });
    }
  };

  const selectProxyServer = async (id: string) => {
    if (connected) return;
    setSelectedProxyServerId(id);
    if (notice?.type === 'warning') {
      setNotice(null);
    }
    await settingsRepo.set('selectedProxyServerId', id);
  };

  const handlePingAll = async () => {
    if (isPingingAll || proxyServers.length === 0) return;
    setIsPingingAll(true);

    const initialLoading: Record<string, ServerPingState> = {};
    proxyServers.forEach((s) => {
      initialLoading[s.id] = { loading: true };
    });
    setPingStates(initialLoading);

    try {
      const res = await browser.runtime.sendMessage({
        type: MESSAGES.PING_ALL,
        servers: proxyServers,
      });

      if (res && res.success && Array.isArray(res.results)) {
        const updated: Record<string, ServerPingState> = {};
        res.results.forEach((r: PingResult) => {
          updated[r.serverId] = {
            latencyMs: r.latencyMs,
            error: r.error,
            loading: false,
          };
        });
        setPingStates(updated);
      } else {
        const failed: Record<string, ServerPingState> = {};
        proxyServers.forEach((s) => {
          failed[s.id] = { error: res?.error || 'Offline', loading: false };
        });
        setPingStates(failed);
      }
    } catch (e: any) {
      const failed: Record<string, ServerPingState> = {};
      proxyServers.forEach((s) => {
        failed[s.id] = { error: 'Daemon offline', loading: false };
      });
      setPingStates(failed);
    } finally {
      setIsPingingAll(false);
    }
  };

  const renderLatencyBadge = (serverId: string) => {
    const state = pingStates[serverId];
    if (!state) return null;

    if (state.loading) {
      return (
        <span className="latency-badge latency-loading" title="Probing latency...">
          <RefreshCwIcon size={11} className="animate-spin" />
          <span>...</span>
        </span>
      );
    }

    if (state.error) {
      return (
        <span className="latency-badge latency-error" title={state.error}>
          <AlertCircleIcon size={11} />
          <span>Err</span>
        </span>
      );
    }

    if (
      typeof state.latencyMs === 'number' &&
      Number.isFinite(state.latencyMs) &&
      state.latencyMs >= 0
    ) {
      const { colorClass, signalLevel } = classifyLatency(state.latencyMs);

      return (
        <span className={`latency-badge ${colorClass}`}>
          <span className="latency-dot" aria-hidden="true" />
          <SignalBarsIcon level={signalLevel} size={11} />
          <span>{state.latencyMs} ms</span>
        </span>
      );
    }

    return null;
  };

  return (
    <div className="app-container">
      {/* Header */}
      <div className="app-header">
        <div className="brand-wrapper">
          <img src="/icons/icon-32.png" alt="Logo" className="brand-logo" />
          <div className="brand-text">
            <h2 className="header-title">VPN Proxy</h2>
            <span className="header-subtitle">Native Xray Core</span>
          </div>
        </div>
        <div className={`status-badge ${connected ? 'active' : 'disconnected'}`}>
          <span className="status-dot" aria-hidden="true" />
          <span>{connected ? 'Active' : 'Disconnected'}</span>
        </div>
      </div>

      {/* Inline Notice Banner */}
      {notice && (
        <NoticeBanner
          type={notice.type}
          title={notice.title}
          message={notice.message}
          action={notice.action}
          onDismiss={() => setNotice(null)}
        />
      )}

      {proxyServers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <TowerIcon size={42} strokeWidth={1.75} className="empty-tower-icon" />
          </div>
          <h3 className="empty-state-title">No Proxies Configured</h3>
          <p className="empty-state-desc">
            Import a subscription URL or custom server configurations in Settings to get started.
          </p>
          <button className="btn btn-connect btn-add-sub" onClick={openOptions}>
            <SettingsIcon size={14} style={{ marginRight: 6 }} />
            Add Subscription
          </button>
        </div>
      ) : (
        <>
          <div className="server-section-header">
            <div className="section-title-wrap">
              <TowerIcon size={13} className="section-icon" />
              <span className="section-label">Servers ({proxyServers.length})</span>
            </div>
            <button
              className="ping-all-btn"
              onClick={handlePingAll}
              disabled={isPingingAll}
              title="Test ping to all servers"
            >
              {isPingingAll ? (
                <>
                  <RefreshCwIcon size={12} className="animate-spin" />
                  <span>Testing...</span>
                </>
              ) : (
                <>
                  <ZapIcon size={12} />
                  <span>Ping All</span>
                </>
              )}
            </button>
          </div>

          <div className="server-list">
            {proxyServers.map((server) => {
              const isSelected = selectedProxyServerId === server.id;
              const isDisabled = connected && !isSelected;

              return (
                <div
                  key={server.id}
                  role="button"
                  tabIndex={isDisabled ? -1 : 0}
                  onClick={() => selectProxyServer(server.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      selectProxyServer(server.id);
                    }
                  }}
                  className={`server-item ${isSelected ? 'selected' : ''} ${
                    isDisabled ? 'disabled' : ''
                  }`}
                >
                  <div className="server-item-left">
                    <div className="server-radio">
                      <RadioDotIcon
                        active={isSelected}
                        size={14}
                        color={isSelected ? 'var(--accent-cyan)' : 'var(--text-muted)'}
                      />
                    </div>
                    <div className="server-info">
                      <div className="server-name" title={server.name}>
                        {server.name}
                      </div>
                      <div className="server-tags">
                        <span className="tag-pill tag-proto">
                          {(server.type || 'VLESS').toUpperCase()}
                        </span>
                        <span className="tag-pill tag-net">
                          {(server.network || 'TCP').toUpperCase()}
                        </span>
                        {server.security && server.security !== 'none' && (
                          <span className="tag-pill tag-sec">
                            {server.security.toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="server-item-right">{renderLatencyBadge(server.id)}</div>
                </div>
              );
            })}
          </div>

          <button
            onClick={toggleConnection}
            className={`btn ${
              connected
                ? 'btn-disconnect connected-glow'
                : selectedProxyServerId
                ? 'btn-connect'
                : 'btn-disabled'
            }`}
          >
            {connected ? (
              <>
                <CheckIcon size={15} className="btn-icon" />
                <span>Disconnect</span>
              </>
            ) : (
              <>
                <ZapIcon size={15} className="btn-icon" />
                <span>Connect</span>
              </>
            )}
          </button>

          <div className="footer-bar">
            <a
              href="https://github.com/valyaknyazev-crypto/firefox-native-xray-vpn"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              <span>GitHub</span>
              <ExternalLinkIcon size={12} className="footer-icon" />
            </a>
            <a
              href="#"
              className="footer-link"
              onClick={(e) => {
                e.preventDefault();
                openOptions();
              }}
            >
              <SettingsIcon size={13} className="footer-icon" />
              <span>Routing & Settings</span>
            </a>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
