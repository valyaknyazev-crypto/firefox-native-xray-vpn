import { useState, useEffect, useRef } from 'react';
import { RoutingMode, RoutingRule } from '../types';
import { defaultSettingsRepository, SettingsRepository } from '../settings-repository';
import { syncSubscription } from '../subscription';
import {
  TowerIcon,
  ClockIcon,
  CompassIcon,
  TrashIcon,
  RefreshCwIcon,
  CheckIcon,
  AlertCircleIcon,
  PlusIcon,
} from '../components/Icons';
import './options.css';

export interface OptionsProps {
  settingsRepo?: SettingsRepository;
  syncSubscriptionFn?: (url: string) => Promise<{ servers: any[]; selectionCleared?: boolean }>;
  initialUrl?: string;
  initialRoutingMode?: RoutingMode;
  initialRoutingRules?: RoutingRule[];
  initialLastSyncedAt?: number | null;
}

export default function Options({
  settingsRepo = defaultSettingsRepository,
  syncSubscriptionFn,
  initialUrl,
  initialRoutingMode,
  initialRoutingRules,
  initialLastSyncedAt,
}: OptionsProps = {}) {
  const [url, setUrl] = useState(initialUrl ?? '');
  const [status, setStatus] = useState<{ text: string; type?: 'success' | 'error' | 'info' } | null>(null);
  const [routingMode, setRoutingMode] = useState<RoutingMode>(initialRoutingMode ?? 'Global');
  const [routingRules, setRoutingRules] = useState<RoutingRule[]>(initialRoutingRules ?? []);
  const [newRule, setNewRule] = useState('');
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(initialLastSyncedAt ?? null);
  const [isSyncing, setIsSyncing] = useState(false);
  const lastRemoteUrlRef = useRef<string | null>(initialUrl ?? null);

  useEffect(() => {
    let isMounted = true;

    settingsRepo.getSettings().then(settings => {
      if (!isMounted) return;
      lastRemoteUrlRef.current = settings.subscriptionUrl;
      if (initialUrl === undefined) setUrl(settings.subscriptionUrl);
      if (initialRoutingMode === undefined) setRoutingMode(settings.routingMode);
      if (initialRoutingRules === undefined) setRoutingRules(settings.routingRules);
      if (initialLastSyncedAt === undefined) setLastSyncedAt(settings.lastSyncedAt);
    });

    const unsubscribe = settingsRepo.subscribe(settings => {
      if (!isMounted) return;
      if (lastRemoteUrlRef.current !== settings.subscriptionUrl) {
        lastRemoteUrlRef.current = settings.subscriptionUrl;
        setUrl(settings.subscriptionUrl);
      }
      setRoutingMode(settings.routingMode);
      setRoutingRules(settings.routingRules);
      setLastSyncedAt(settings.lastSyncedAt);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [settingsRepo, initialUrl, initialRoutingMode, initialRoutingRules, initialLastSyncedAt]);

  const handleSync = async () => {
    const trimmed = url.trim();
    if (!trimmed) {
      setStatus({ text: 'Please enter a subscription URL or paste configs', type: 'error' });
      return;
    }
    setIsSyncing(true);
    setStatus({ text: 'Fetching and parsing subscription servers...', type: 'info' });
    try {
      const result = syncSubscriptionFn
        ? await syncSubscriptionFn(trimmed)
        : await syncSubscription(trimmed, undefined, settingsRepo);

      lastRemoteUrlRef.current = trimmed;
      setStatus({
        text: `Success! Loaded ${result.servers.length} proxy servers.${result.selectionCleared ? ' (Previous selection reset)' : ''}`,
        type: 'success',
      });
      const syncedAt = await settingsRepo.get('lastSyncedAt');
      setLastSyncedAt(syncedAt ?? Date.now());
    } catch (err: any) {
      setStatus({ text: 'Sync failed: ' + (err?.message || String(err)), type: 'error' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRoutingModeChange = async (mode: RoutingMode) => {
    setRoutingMode(mode);
    await settingsRepo.set('routingMode', mode);
  };

  const addRule = async () => {
    const trimmed = newRule.trim();
    if (!trimmed) return;
    if (routingRules.some(r => r.pattern.toLowerCase() === trimmed.toLowerCase())) {
      setNewRule('');
      return;
    }
    const rule: RoutingRule = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      pattern: trimmed,
    };
    const updated = [...routingRules, rule];
    setRoutingRules(updated);
    setNewRule('');
    await settingsRepo.set('routingRules', updated);
  };

  const removeRule = async (id: string) => {
    const updated = routingRules.filter(r => r.id !== id);
    setRoutingRules(updated);
    await settingsRepo.set('routingRules', updated);
  };

  return (
    <div className="options-page">
      <div className="options-container">
        {/* Header */}
        <header className="options-header">
          <img src="/icons/icon-48.png" alt="Logo" className="header-logo" />
          <div className="header-content">
            <h1 className="header-title">Settings &amp; Routing</h1>
            <p className="header-subtitle">
              Configure subscriptions, proxy traffic rules, and options
            </p>
          </div>
        </header>

        {/* Card 1: Subscription */}
        <section className="options-card" aria-labelledby="subscription-heading">
          <h2 id="subscription-heading" className="card-title">
            <TowerIcon size={18} className="card-title-icon" aria-hidden="true" />
            <span>Subscription Management</span>
          </h2>
          <div className="card-hint">
            <AlertCircleIcon size={14} className="card-hint-icon" aria-hidden="true" />
            <span>
              Enter your V2Ray/Xray subscription URL, or type{' '}
              <code className="inline-code">mock</code> to load test servers.
            </span>
          </div>

          <div className="input-row">
            <input
              type="text"
              className="options-input"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://example.com/sub or paste raw configs"
              onKeyDown={e => e.key === 'Enter' && handleSync()}
            />
            <button
              type="button"
              className="btn btn-sync"
              onClick={handleSync}
              disabled={isSyncing}
              aria-busy={isSyncing}
            >
              <RefreshCwIcon
                size={16}
                className={`btn-sync-icon ${isSyncing ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              <span>Sync</span>
            </button>
          </div>

          <div className="last-synced">
            <ClockIcon size={14} className="last-synced-icon" aria-hidden="true" />
            <span>
              {lastSyncedAt
                ? `Last synced: ${new Date(lastSyncedAt).toLocaleString()}`
                : 'Not synced yet'}
            </span>
          </div>

          {status && (
            <div
              className={`status-banner status-banner-${status.type || 'info'}`}
              role="status"
              aria-live="polite"
            >
              {status.type === 'success' ? (
                <CheckIcon size={16} className="status-icon" aria-hidden="true" />
              ) : (
                <AlertCircleIcon size={16} className="status-icon" aria-hidden="true" />
              )}
              <span>{status.text}</span>
            </div>
          )}
        </section>

        {/* Card 2: Routing Rules */}
        <section className="options-card" aria-labelledby="routing-heading">
          <h2 id="routing-heading" className="card-title">
            <CompassIcon size={18} className="card-title-icon" aria-hidden="true" />
            <span>Traffic Routing Mode</span>
          </h2>
          <p className="card-description">
            Choose how browser traffic is evaluated and forwarded through the proxy.
          </p>

          <div className="routing-grid" role="radiogroup" aria-label="Traffic Routing Mode">
            {[
              { id: 'Global', title: 'Global Mode', desc: 'Tunnel all traffic' },
              { id: 'Smart', title: 'Smart Mode', desc: 'Auto geosite bypass' },
              { id: 'Custom', title: 'Custom Rules', desc: 'Specific domains only' },
            ].map(mode => {
              const isSelected = routingMode === mode.id;
              return (
                <label
                  key={mode.id}
                  className={`routing-card ${isSelected ? 'active' : ''}`}
                >
                  <div className="routing-card-header">
                    <div className="routing-label-wrap">
                      <input
                        type="radio"
                        name="routingMode"
                        className="routing-radio"
                        checked={isSelected}
                        onChange={() => handleRoutingModeChange(mode.id as RoutingMode)}
                      />
                      <span className="routing-title">{mode.title}</span>
                    </div>
                    {isSelected && <CheckIcon size={14} className="routing-check-icon" aria-hidden="true" />}
                  </div>
                  <span className="routing-desc">{mode.desc}</span>
                </label>
              );
            })}
          </div>

          {routingMode === 'Custom' && (
            <div className="custom-rules-container">
              <h3 className="custom-rules-title">Custom Proxy Domains &amp; IPs</h3>

              <div className="rule-input-row">
                <input
                  type="text"
                  className="rule-input"
                  placeholder="e.g. *.example.com or 1.1.1.1"
                  value={newRule}
                  onChange={e => setNewRule(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addRule()}
                />
                <button
                  type="button"
                  className="btn btn-add-rule"
                  onClick={addRule}
                >
                  <PlusIcon size={14} className="btn-add-icon" aria-hidden="true" />
                  <span>Add Rule</span>
                </button>
              </div>

              <ul className="rules-list">
                {routingRules.map(r => (
                  <li key={r.id} className="rule-item">
                    <span className="rule-pattern">{r.pattern}</span>
                    <button
                      type="button"
                      className="btn-delete-rule"
                      onClick={() => removeRule(r.id)}
                      aria-label={`Delete rule ${r.pattern}`}
                      title={`Delete rule ${r.pattern}`}
                    >
                      <TrashIcon size={14} aria-hidden="true" />
                    </button>
                  </li>
                ))}
                {routingRules.length === 0 && (
                  <li className="rules-empty">
                    No custom rules configured. Unmatched traffic connects DIRECT.
                  </li>
                )}
              </ul>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
