import { useState, useEffect } from 'react';
import { RoutingMode, RoutingRule } from '../types';
import { defaultSettingsRepository } from '../settings-repository';
import { syncSubscription } from '../subscription';

export default function Options() {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<{ text: string; type?: 'success' | 'error' | 'info' } | null>(null);
  const [routingMode, setRoutingMode] = useState<RoutingMode>('Global');
  const [routingRules, setRoutingRules] = useState<RoutingRule[]>([]);
  const [newRule, setNewRule] = useState('');
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    defaultSettingsRepository.getSettings().then(settings => {
      setUrl(settings.subscriptionUrl);
      setRoutingMode(settings.routingMode);
      setRoutingRules(settings.routingRules);
      setLastSyncedAt(settings.lastSyncedAt);
    });

    const unsubscribe = defaultSettingsRepository.subscribe(settings => {
      setUrl(settings.subscriptionUrl);
      setRoutingMode(settings.routingMode);
      setRoutingRules(settings.routingRules);
      setLastSyncedAt(settings.lastSyncedAt);
    });

    return unsubscribe;
  }, []);

  const handleSync = async () => {
    if (!url.trim()) {
      setStatus({ text: 'Please enter a subscription URL or paste configs', type: 'error' });
      return;
    }
    setIsSyncing(true);
    setStatus({ text: 'Fetching and parsing subscription servers...', type: 'info' });
    try {
      const result = await syncSubscription(url);
      setStatus({ 
        text: `Success! Loaded ${result.servers.length} proxy servers.${result.selectionCleared ? ' (Previous selection reset)' : ''}`, 
        type: 'success' 
      });
      const syncedAt = await defaultSettingsRepository.get('lastSyncedAt');
      setLastSyncedAt(syncedAt);
    } catch (err: any) {
      setStatus({ text: 'Sync failed: ' + err.message, type: 'error' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRoutingModeChange = async (mode: RoutingMode) => {
    setRoutingMode(mode);
    await defaultSettingsRepository.set('routingMode', mode);
  };

  const addRule = async () => {
    if (!newRule.trim()) return;
    const rule: RoutingRule = { id: Date.now().toString(), pattern: newRule.trim() };
    const updated = [...routingRules, rule];
    setRoutingRules(updated);
    setNewRule('');
    await defaultSettingsRepository.set('routingRules', updated);
  };

  const removeRule = async (id: string) => {
    const updated = routingRules.filter(r => r.id !== id);
    setRoutingRules(updated);
    await defaultSettingsRepository.set('routingRules', updated);
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#090d16',
      backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(56, 189, 248, 0.08) 0%, transparent 70%)',
      color: '#f8fafc',
      fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      padding: '40px 20px',
      boxSizing: 'border-box'
    }}>
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '32px' }}>
          <img src="/icons/icon-48.png" alt="Logo" style={{ width: '40px', height: '40px', borderRadius: '10px', boxShadow: '0 0 16px rgba(56, 189, 248, 0.35)' }} />
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, letterSpacing: '-0.02em', background: 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Settings & Routing
            </h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#94a3b8' }}>
              Configure subscriptions, proxy traffic rules, and options
            </p>
          </div>
        </div>

        {/* Card 1: Subscription */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
        }}>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
            📡 Subscription Management
          </h2>
          <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#94a3b8' }}>
            Enter your V2Ray/Xray subscription URL, or type <code style={{ color: '#38bdf8', background: 'rgba(56,189,248,0.1)', padding: '2px 6px', borderRadius: '4px' }}>mock</code> to load test servers.
          </p>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
            <input 
              type="text" 
              value={url} 
              onChange={e => setUrl(e.target.value)} 
              placeholder="https://example.com/sub or paste raw configs"
              style={{
                flex: 1,
                padding: '12px 14px',
                fontSize: '14px',
                background: 'rgba(2, 6, 23, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '8px',
                color: '#fff',
                outline: 'none'
              }}
              onKeyDown={e => e.key === 'Enter' && handleSync()}
            />
            <button 
              onClick={handleSync} 
              disabled={isSyncing}
              style={{
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: isSyncing ? 'not-allowed' : 'pointer',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                transition: 'all 0.2s'
              }}
            >
              {isSyncing ? 'Syncing...' : 'Sync'}
            </button>
          </div>

          {lastSyncedAt && (
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              🕒 Last synced: {new Date(lastSyncedAt).toLocaleString()}
            </div>
          )}

          {status && (
            <div style={{
              marginTop: '12px',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              background: status.type === 'error' ? 'rgba(244, 63, 94, 0.15)' : (status.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(56, 189, 248, 0.15)'),
              color: status.type === 'error' ? '#fb7185' : (status.type === 'success' ? '#34d399' : '#38bdf8'),
              border: `1px solid ${status.type === 'error' ? 'rgba(244, 63, 94, 0.3)' : (status.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(56, 189, 248, 0.3)')}`
            }}>
              {status.text}
            </div>
          )}
        </div>

        {/* Card 2: Routing Rules */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
        }}>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🧭 Traffic Routing Mode
          </h2>
          <p style={{ margin: '0 0 18px 0', fontSize: '13px', color: '#94a3b8' }}>
            Choose how browser traffic is evaluated and forwarded through the proxy.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px', marginBottom: '20px' }}>
            {[
              { id: 'Global', title: 'Global Mode', desc: 'Tunnel all traffic' },
              { id: 'Smart', title: 'Smart Mode', desc: 'Auto geosite bypass' },
              { id: 'Custom', title: 'Custom Rules', desc: 'Specific domains only' }
            ].map(mode => (
              <label 
                key={mode.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  border: routingMode === mode.id ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                  background: routingMode === mode.id ? 'rgba(56, 189, 248, 0.12)' : 'rgba(2, 6, 23, 0.4)',
                  boxShadow: routingMode === mode.id ? '0 0 12px rgba(56, 189, 248, 0.2)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '14px', color: routingMode === mode.id ? '#38bdf8' : '#f8fafc' }}>
                  <input 
                    type="radio" 
                    name="routingMode" 
                    checked={routingMode === mode.id} 
                    onChange={() => handleRoutingModeChange(mode.id as RoutingMode)}
                    style={{ accentColor: '#38bdf8' }}
                  />
                  {mode.title}
                </div>
                <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', marginLeft: '20px' }}>
                  {mode.desc}
                </span>
              </label>
            ))}
          </div>

          {routingMode === 'Custom' && (
            <div style={{
              marginTop: '16px',
              padding: '16px',
              backgroundColor: 'rgba(2, 6, 23, 0.5)',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.06)'
            }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: 700, color: '#e2e8f0' }}>Custom Proxy Domains & IPs</h4>
              
              <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                <input 
                  type="text" 
                  placeholder="e.g. *.example.com or 1.1.1.1" 
                  value={newRule} 
                  onChange={e => setNewRule(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    fontSize: '13px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '6px',
                    color: '#fff',
                    outline: 'none'
                  }}
                  onKeyDown={e => e.key === 'Enter' && addRule()}
                />
                <button 
                  onClick={addRule} 
                  style={{
                    padding: '8px 16px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: 'rgba(56, 189, 248, 0.15)',
                    color: '#38bdf8',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    borderRadius: '6px'
                  }}
                >
                  + Add Rule
                </button>
              </div>

              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {routingRules.map(r => (
                  <li key={r.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    background: 'rgba(15, 23, 42, 0.6)',
                    borderRadius: '6px',
                    border: '1px solid rgba(255, 255, 255, 0.04)'
                  }}>
                    <span style={{ fontSize: '13px', color: '#cbd5e1', fontFamily: 'monospace' }}>{r.pattern}</span>
                    <button 
                      onClick={() => removeRule(r.id)} 
                      style={{
                        color: '#f43f5e',
                        cursor: 'pointer',
                        border: 'none',
                        background: 'none',
                        fontSize: '12px',
                        fontWeight: 600
                      }}
                    >
                      Delete
                    </button>
                  </li>
                ))}
                {routingRules.length === 0 && (
                  <li style={{ color: '#64748b', fontStyle: 'italic', fontSize: '12px', padding: '6px 0' }}>
                    No custom rules configured. Unmatched traffic connects DIRECT.
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
