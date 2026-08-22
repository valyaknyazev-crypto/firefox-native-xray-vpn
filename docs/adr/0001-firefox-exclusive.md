# Target Firefox exclusively

We are building the VPN extension exclusively for Firefox, using the native `browser.*` APIs with Promises.

We decided not to support Chrome or other Chromium-based browsers at this stage. The proxy configuration APIs differ significantly between Firefox (which uses the modern `browser.proxy.onRequest` event for granular control) and Chrome (which uses a global `chrome.proxy` settings approach). Focusing only on Firefox allows us to utilize its proxy routing capabilities directly without complex polyfills or lowest-common-denominator abstractions.
