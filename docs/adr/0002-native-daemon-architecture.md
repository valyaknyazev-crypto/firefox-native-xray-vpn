# Native Messaging with Xray/Happ Daemon

We will use a native companion application (a background daemon based on Xray-core or Happ-core) installed on the OS to handle advanced VPN protocols (VLESS, Shadowsocks, WireGuard, Hysteria). The Firefox extension will communicate with this daemon via the WebExtensions `Native Messaging` API.

## Context
Browser extensions natively support only HTTP(S) and SOCKS proxy routing. They cannot open raw TCP/UDP sockets required for modern censorship-resistant protocols. To support these, a local daemon is mandatory.

## Decision Details
- The daemon will be completely headless and autonomous.
- It will NOT open local proxy ports automatically on startup.
- It will only open local ports (e.g., SOCKS5 on `127.0.0.1:1080`) when explicitly commanded by the browser extension via Native Messaging.
- The extension acts as the primary UI and configuration manager, parsing the Subscription and sending the selected Proxy Server configuration to the daemon.

## Consequences
- Requires a desktop installer to place the binary and register the Native Messaging manifest in the OS registry/filesystem.
- Breaks the "one-click install from AMO" experience, but delivers the required protocol support with a seamless browser-integrated UI.
