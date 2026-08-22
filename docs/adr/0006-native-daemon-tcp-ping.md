# ADR 0006: Native Daemon TCP Ping Probe

## Status
Accepted

## Context
Users need to evaluate the responsiveness and latency of proxy servers before connecting. Standard browser JavaScript `fetch()` requests inside an extension cannot perform raw TCP/TLS timing probes to arbitrary hosts/ports without triggering CORS or security restrictions, nor can they accurately measure pure TCP connection latency to non-HTTP daemon endpoints (e.g. raw Xray VLESS/Trojan ports).

## Decision
We implement a native TCP latency probe (`PING` protocol command) directly in the Native Messaging Daemon:
1. **Daemon Side (`daemon.js` & `src-daemon-go/main.go`)**:
   * Accepts `{ type: "PING", id: string, host: string, port: number, timeoutMs?: number }`.
   * Opens a standard TCP socket connection (`net.createConnection` in Node / `net.DialTimeout` in Go).
   * Measures precise RTT (round-trip time in milliseconds) from socket open to handshake completion.
   * Returns `{ type: "PING_RESULT", id: string, latencyMs: number }` or `{ type: "PING_ERROR", id: string, error: string }`.
2. **Extension Side**:
   * `ConnectionManager` (or `Background`) provides a typed `pingServer(server: ProxyServer): Promise<number>` method communicating with the daemon over Native Messaging.
   * UI displays a "⚡ Test Ping" button and color-coded latency badges (🟢 `< 100ms`, 🟡 `100-300ms`, 🔴 `> 300ms`, ⚠️ `Timeout`).
   * Results are retained in ephemeral UI state during the popup session.

## Consequences
### Positive
* High-accuracy measurement of real TCP connection latency to any proxy port.
* No browser CORS or mixed-content limitations.
* Clean separation of concerns with minimal UI overhead.

### Negative / Risks
* If the Native Daemon is not installed or disconnected, ping tests will report daemon offline (fallback notice displayed in UI).
