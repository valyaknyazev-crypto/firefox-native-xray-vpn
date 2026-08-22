import { useState, useEffect } from 'react';
import browser from 'webextension-polyfill';
import { ProxyServer, MESSAGES, PingResult } from './types';
import { defaultSettingsRepository } from './settings-repository';

import './popup.css';

interface ServerPingState {
  latencyMs?: number;
  error?: string;
  loading?: boolean;
}

function App() {
  const [connected, setConnected] = useState(false);
  const [proxyServers, setProxyServers] = useState<ProxyServer[]>([]);
  const [selectedProxyServerId, setSelectedProxyServerId] = useState<string | null>(null);
  const [pingStates, setPingStates] = useState<Record<string, ServerPingState>>({});
  const [isPingingAll, setIsPingingAll] = useState(false);

  useEffect(() => {
    defaultSettingsRepository.getSettings().then((settings) => {
      setConnected(settings.connected);
      setProxyServers(settings.proxyServers);
      setSelectedProxyServerId(settings.selectedProxyServerId);
    });

    const unsubscribe = defaultSettingsRepository.subscribe((settings) => {
      setConnected(settings.connected);
      setProxyServers(settings.proxyServers);
      setSelectedProxyServerId(settings.selectedProxyServerId);
    });

    return unsubscribe;
  }, []);

  const toggleConnection = async () => {
    if (!selectedProxyServerId && !connected) {
      alert("Please select a Proxy Server first!");
      return;
    }
    const newState = !connected;
    
    try {
      const response = await browser.runtime.sendMessage({ 
        type: MESSAGES.TOGGLE_PROXY, 
        connected: newState,
        proxyServerId: selectedProxyServerId 
      });

      if (response && response.error) {
        throw new Error(response.error);
      }
      
      setConnected(newState);
    } catch (err: any) {
      alert("Native Daemon Connection Failed: " + err.message + "\n\nIs the Native Daemon installed?");
    }
  };

  const selectProxyServer = async (id: string) => {
    if (connected) return;
    setSelectedProxyServerId(id);
    await defaultSettingsRepository.set('selectedProxyServerId', id);
  };

  const handlePingAll = async () => {
    if (isPingingAll || proxyServers.length === 0) return;
    setIsPingingAll(true);

    const initialLoading: Record<string, ServerPingState> = {};
    proxyServers.forEach(s => {
      initialLoading[s.id] = { loading: true };
    });
    setPingStates(initialLoading);

    try {
      const res = await browser.runtime.sendMessage({
        type: MESSAGES.PING_ALL,
        servers: proxyServers
      });

      if (res && res.success && Array.isArray(res.results)) {
        const updated: Record<string, ServerPingState> = {};
        res.results.forEach((r: PingResult) => {
          updated[r.serverId] = {
            latencyMs: r.latencyMs,
            error: r.error,
            loading: false
          };
        });
        setPingStates(updated);
      } else {
        const failed: Record<string, ServerPingState> = {};
        proxyServers.forEach(s => {
          failed[s.id] = { error: res?.error || 'Offline', loading: false };
        });
        setPingStates(failed);
      }
    } catch (e: any) {
      const failed: Record<string, ServerPingState> = {};
      proxyServers.forEach(s => {
        failed[s.id] = { error: 'Daemon offline', loading: false };
      });
      setPingStates(failed);
    } finally {
      setIsPingingAll(false);
    }
  };

  const openOptions = () => {
    browser.runtime.openOptionsPage();
  };

  const renderLatencyBadge = (serverId: string) => {
    const state = pingStates[serverId];
    if (!state) return null;

    if (state.loading) {
      return <span className="latency-badge latency-loading">⏳ ...</span>;
    }
    if (state.error) {
      return <span className="latency-badge latency-error" title={state.error}>⚠️ Err</span>;
    }
    if (typeof state.latencyMs === 'number') {
      let colorClass = 'latency-good';
      if (state.latencyMs > 300) colorClass = 'latency-bad';
      else if (state.latencyMs > 100) colorClass = 'latency-medium';

      return <span className={`latency-badge ${colorClass}`}>⚡ {state.latencyMs} ms</span>;
    }
    return null;
  };

  return (
    <div className="app-container">
      {/* Header */}
      <div className="app-header">
        <div className="brand-wrapper">
          <img src="/icons/icon-32.png" alt="Logo" className="brand-logo" />
          <h2 className="header-title">VPN Proxy</h2>
        </div>
        <div className={`status-badge ${connected ? 'active' : 'disconnected'}`}>
          <span className="status-dot"></span>
          {connected ? 'Active' : 'Disconnected'}
        </div>
      </div>

      {proxyServers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📡</div>
          <p>No proxy servers found.</p>
          <button className="btn btn-connect" onClick={openOptions}>Add Subscription</button>
        </div>
      ) : (
        <>
          <div className="server-section-header">
            <span className="section-label">Servers ({proxyServers.length})</span>
            <button 
              className="ping-all-btn" 
              onClick={handlePingAll} 
              disabled={isPingingAll}
              title="Test ping to all servers"
            >
              {isPingingAll ? '⚡ Testing...' : '⚡ Ping All'}
            </button>
          </div>

          <div className="server-list">
            {proxyServers.map(server => (
              <div 
                key={server.id}
                onClick={() => selectProxyServer(server.id)}
                className={`server-item ${selectedProxyServerId === server.id ? 'selected' : ''} ${connected && selectedProxyServerId !== server.id ? 'disabled' : ''}`}
              >
                <div className="server-info">
                  <div className="server-name">{server.name}</div>
                  <div className="server-tags">
                    <span className="tag-pill">{server.type || 'VLESS'}</span>
                    <span className="tag-pill">{server.network || 'TCP'}</span>
                    {server.security && server.security !== 'none' && (
                      <span className="tag-pill">{server.security}</span>
                    )}
                  </div>
                </div>
                {renderLatencyBadge(server.id)}
              </div>
            ))}
          </div>

          <button 
            onClick={toggleConnection}
            disabled={!selectedProxyServerId && !connected}
            className={`btn ${connected ? 'btn-disconnect' : (selectedProxyServerId ? 'btn-connect' : 'btn-disabled')}`}
          >
            {connected ? 'Disconnect' : 'Connect'}
          </button>
          
          <div className="footer-bar">
             <a href="https://github.com/valyaknyazev-crypto/firefox-native-xray-vpn" target="_blank" rel="noopener noreferrer" className="footer-link">GitHub</a>
             <a href="#" className="footer-link" onClick={(e) => { e.preventDefault(); openOptions(); }}>Routing & Settings</a>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
