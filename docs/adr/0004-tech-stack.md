# Tech Stack: React, Vite, TS, and Manifest V3

We will build the extension using React and TypeScript, bundled with Vite, and targeting Manifest V3 exclusively.

## Context
A VPN proxy extension requires a complex UI for managing subscriptions, parsing large lists of proxy servers, displaying pings, and toggling routing modes. Standard vanilla JavaScript would quickly become unmaintainable. Additionally, Mozilla is pushing for Manifest V3 for all modern extensions.

## Decision Details
- **UI Framework**: React + TypeScript.
- **Bundler**: Vite (typically utilizing a web extension plugin for seamless hot-reloading and manifest generation).
- **Manifest**: Manifest V3 (MV3). Firefox's implementation of MV3 allows `browser.proxy.onRequest` to function correctly in background scripts (Event Pages), sidestepping the severe proxy limitations Chrome introduced in their MV3 Service Workers.

## Consequences
- Development requires a build step (Node.js/npm) rather than just editing raw HTML/JS files.
- Ensures a modern, maintainable codebase with strict type-safety, which is crucial for handling complex JSON configurations sent over Native Messaging.
