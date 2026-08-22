import { ProxyServer } from './types';

const SOCKS_HOST = '127.0.0.1';
const SOCKS_PORT = 1080;

export function buildFor(server: ProxyServer) {
  const streamSettings: any = {
    network: server.network || "tcp",
    security: server.security || "none"
  };

  if (server.security === "tls") {
    streamSettings.tlsSettings = {
      serverName: server.sni || server.host,
      fingerprint: server.fp || "firefox",
      ...(server.alpn ? { alpn: server.alpn.split(',') } : {})
    };
  } else if (server.security === "reality") {
    streamSettings.realitySettings = {
      publicKey: server.pbk,
      shortId: server.sid,
      serverName: server.sni || server.host,
      fingerprint: server.fp || "firefox",
      ...(server.alpn ? { alpn: server.alpn.split(',') } : {})
    };
  }

  if (server.network === "ws") {
    streamSettings.wsSettings = {
      path: server.path || "/",
      headers: server.hostHeader ? { Host: server.hostHeader } : {}
    };
  } else if (server.network === "xhttp" || server.network === "splithttp") {
    streamSettings.network = "splithttp";
    streamSettings.splithttpSettings = {
      path: server.path || "/",
      host: server.hostHeader || ""
    };
  } else if (server.network === "grpc") {
    streamSettings.grpcSettings = {
      serviceName: server.path || ""
    };
  }

  const protocol = server.type || "vless";
  let settings: any = {};

  if (protocol === "vless") {
    settings = {
      vnext: [{
        address: server.host,
        port: server.port,
        users: [{
          id: server.uuid || "mock-uuid",
          encryption: "none",
          ...(server.flow ? { flow: server.flow } : {})
        }]
      }]
    };
  } else if (protocol === "vmess") {
    settings = {
      vnext: [{
        address: server.host,
        port: server.port,
        users: [{
          id: server.uuid || "mock-uuid",
          alterId: 0,
          security: "auto"
        }]
      }]
    };
  } else if (protocol === "trojan") {
    settings = {
      servers: [{
        address: server.host,
        port: server.port,
        password: server.uuid || "mock-password"
      }]
    };
  }

  return {
    inbounds: [
      {
        port: SOCKS_PORT,
        listen: SOCKS_HOST,
        protocol: "socks",
        settings: {
          auth: "noauth",
          udp: true,
          ip: SOCKS_HOST
        }
      }
    ],
    outbounds: [
      {
        protocol,
        settings,
        streamSettings
      }
    ]
  };
}
