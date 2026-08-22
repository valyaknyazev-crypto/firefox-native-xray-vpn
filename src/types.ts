export type RoutingMode = 'Global' | 'Custom' | 'Smart';

export interface RoutingRule {
  id: string;
  pattern: string;
}

export interface ProxyServer {
  id: string;
  name: string;
  host: string;
  port: number;
  type: string; // 'vless', 'vmess', etc.
  uuid: string;
  network?: string; // 'tcp', 'ws', 'xhttp', 'grpc'
  security?: string; // 'none', 'tls', 'reality'
  sni?: string;
  fp?: string; // fingerprint (e.g., 'firefox')
  path?: string;
  hostHeader?: string;
  pbk?: string; // REALITY public key
  sid?: string; // REALITY short id
  flow?: string; // XTLS flow (e.g., xtls-rprx-vision)
  alpn?: string; // ALPN (e.g., h2,http/1.1)
}

export interface PingResult {
  serverId: string;
  latencyMs?: number;
  error?: string;
}

export const STORAGE_KEYS = {
  PROXY_SERVERS: 'proxyServers',
  SELECTED_PROXY_SERVER_ID: 'selectedProxyServerId',
  CONNECTED: 'connected',
  SUBSCRIPTION_URL: 'subscriptionUrl',
  ROUTING_MODE: 'routingMode',
  ROUTING_RULES: 'routingRules',
  LAST_SYNCED_AT: 'lastSyncedAt',
};

export const MESSAGES = {
  TOGGLE_PROXY: 'TOGGLE_PROXY',
  PING_SERVER: 'PING_SERVER',
  PING_ALL: 'PING_ALL'
};

export type NativeCommand = 
  | { command: "START"; config: any }
  | { command: "STOP" }
  | { command: "PING"; id: string; host: string; port: number; timeoutMs?: number };
