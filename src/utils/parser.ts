import { ProxyServer } from '../types';

/**
 * Decodes a base64 string, handling URL-safe base64 and padding.
 */
function decodeBase64(str: string): string {
  try {
    // Pad string with '=' to make it a multiple of 4
    let b64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) {
      b64 += '=';
    }
    const binStr = atob(b64);
    const bytes = new Uint8Array(binStr.length);
    for (let i = 0; i < binStr.length; i++) {
      bytes[i] = binStr.charCodeAt(i);
    }
    return new TextDecoder('utf-8').decode(bytes);
  } catch (e) {
    console.error("Failed to decode base64:", e);
    return "";
  }
}

/**
 * Parses a single vless:// URI into a ProxyServer object.
 * Format: vless://uuid@host:port?query=params#name
 */
export function parseVlessUri(uri: string): ProxyServer | null {
  try {
    const url = new URL(uri);
    if (url.protocol !== 'vless:') return null;

    const uuid = url.username || url.pathname.replace(/^\/\//, '').split('@')[0];
    const host = url.hostname;
    const port = parseInt(url.port, 10) || 443;
    const name = decodeURIComponent(url.hash.replace('#', '')) || host;

    const network = url.searchParams.get('type') || 'tcp';
    const security = url.searchParams.get('security') || 'none';
    const sni = url.searchParams.get('sni') || '';
    const fp = url.searchParams.get('fp') || '';
    const path = url.searchParams.get('path') || '';
    const hostHeader = url.searchParams.get('host') || '';
    const pbk = url.searchParams.get('pbk') || '';
    const sid = url.searchParams.get('sid') || '';
    const flow = url.searchParams.get('flow') || '';
    const alpn = url.searchParams.get('alpn') || '';

    return {
      id: crypto.randomUUID(),
      type: 'vless',
      name,
      uuid,
      host,
      port,
      network,
      security,
      sni,
      fp,
      path,
      hostHeader,
      pbk,
      sid,
      flow,
      alpn
    };
  } catch (e) {
    console.error("Failed to parse VLESS URI:", uri, e);
    return null;
  }
}

export function parseVmessUri(uri: string): ProxyServer | null {
  try {
    if (!uri.startsWith('vmess://')) return null;
    const base64 = uri.substring('vmess://'.length);
    const jsonStr = decodeBase64(base64);
    const vmess = JSON.parse(jsonStr);

    return {
      id: crypto.randomUUID(),
      type: 'vmess',
      name: vmess.ps || vmess.add,
      uuid: vmess.id,
      host: vmess.add,
      port: parseInt(vmess.port, 10) || 443,
      network: vmess.net || 'tcp',
      security: vmess.tls || 'none',
      sni: vmess.sni || '',
      path: vmess.path || '',
      hostHeader: vmess.host || '',
      alpn: vmess.alpn || ''
    };
  } catch (e) {
    console.error("Failed to parse VMESS URI:", uri, e);
    return null;
  }
}

export function parseTrojanUri(uri: string): ProxyServer | null {
  try {
    const url = new URL(uri);
    if (url.protocol !== 'trojan:') return null;

    const password = url.username || url.pathname.replace(/^\/\//, '').split('@')[0];
    const host = url.hostname;
    const port = parseInt(url.port, 10) || 443;
    const name = decodeURIComponent(url.hash.replace('#', '')) || host;

    const security = url.searchParams.get('security') || 'none';
    const sni = url.searchParams.get('sni') || '';
    const network = url.searchParams.get('type') || 'tcp';
    
    return {
      id: crypto.randomUUID(),
      type: 'trojan',
      name,
      uuid: password,
      host,
      port,
      network,
      security,
      sni,
    };
  } catch (e) {
    console.error("Failed to parse TROJAN URI:", uri, e);
    return null;
  }
}

/**
 * Parses a raw subscription payload (either JSON or Base64).
 */
export function parseSubscription(payload: string): ProxyServer[] {
  let text = payload;
  
  if (!text.trim().startsWith('{') && !text.trim().startsWith('[') && !text.includes('://')) {
    const decoded = decodeBase64(text.trim());
    if (decoded) {
      text = decoded;
    }
  }

  // If it's standard JSON array (like our mock)
  try {
    const json = JSON.parse(text);
    if (Array.isArray(json)) {
      return json as ProxyServer[];
    }
  } catch (e) {
    // Not JSON, continue to parse as line-separated URIs
  }

  const servers: ProxyServer[] = [];
  const lines = text.split(/[\r\n]+/).filter(l => l.trim().length > 0);

  for (const line of lines) {
    if (line.startsWith('vless://')) {
      const server = parseVlessUri(line);
      if (server) servers.push(server);
    } else if (line.startsWith('vmess://')) {
      const server = parseVmessUri(line);
      if (server) servers.push(server);
    } else if (line.startsWith('trojan://')) {
      const server = parseTrojanUri(line);
      if (server) servers.push(server);
    }
  }

  return servers;
}
