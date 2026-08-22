# Proxy Routing Strategy

We will use the `browser.proxy.onRequest` API in Firefox to implement smart routing directly within the extension's background script.

## Context
When routing traffic through a local SOCKS5 port (opened by the Native Daemon), we need a way to decide which requests go through the tunnel and which bypass it.

## Decision Details
The extension will evaluate every web request and support three modes:
1. **Global Mode**: All browser traffic routes through the proxy.
2. **Smart Mode**: Traffic is routed conditionally based on a bundled geo/blocklist ruleset derived from Xray-core's geosite data. The ruleset is compiled into the extension at build time and evaluated inside the extension via `browser.proxy.onRequest`.
3. **Custom Rules Mode**: The user provides specific domain/IP routing rules.

This logic will reside purely in the extension JS using `browser.proxy.onRequest`. The Native Daemon will blindly accept whatever the extension sends to the SOCKS5 port.

### Smart Mode implementation detail

The Smart Mode ruleset is a `SmartRuleset` adapter — a module with a `matches(domain: string): boolean` interface. The production adapter wraps a `Set<string>` populated from a bundled plain-text domain list. An in-memory stub adapter is used in tests. The Native Daemon is not involved in routing decisions for Smart Mode.

## Consequences
- Routing decisions are isolated to the browser environment, keeping the Native Daemon simple and stateless.
- Firefox-specific Proxy API enables powerful, asynchronous proxy decisions that are not possible with traditional PAC files.
