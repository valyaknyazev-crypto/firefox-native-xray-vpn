# Firefox VPN Extension

A browser extension that acts as a fully-featured VPN/Proxy client directly within Firefox, replacing the need for a separate desktop VPN application.

## Language

**Proxy Server** (Прокси-сервер):
A remote server used to route the browser's traffic. Contains connection details (IP, port, protocol).
_Avoid_: Node, endpoint

**Connection** (Соединение):
The active state of routing traffic through a specific Proxy Server.
_Avoid_: Tunnel, session

**Routing Rule** (Правило маршрутизации):
A rule that determines which traffic (e.g., specific domains or IP ranges) should go through the Proxy Server or bypass it.
_Avoid_: Filter, exception

**Subscription** (Подписка):
The user's access plan or configuration source that provides the list of available Proxy Servers and authentication details.
_Avoid_: Plan, account

**Native Daemon** (Локальный демон):
The headless background application (Xray/Happ core) installed on the OS that handles advanced protocols and opens a local SOCKS5 port when commanded by the extension.
_Avoid_: Background app, local client

**Settings Repository** (Репозиторий настроек):
The unified reactive persistence store for extension configuration, proxy server lists, and routing preferences.
_Avoid_: Storage cache, config wrapper

**Message Handler** (Обработчик сообщений):
A single-purpose function registered to handle one specific browser runtime message type (e.g. `TOGGLE_PROXY`, `PING_SERVER`, `PING_ALL`). Lives in its own module; does not know about other message types.
_Avoid_: Message controller, event handler

**SubscriptionSource** (Источник подписки):
An internal seam inside the Subscription module responsible for supplying raw server configuration text from a specific origin (HTTP URL, raw URI string). Used only for testability; not part of the public `syncSubscription` interface.
_Avoid_: Fetcher, provider

## Routing Modes

**Global Mode**:
All traffic from the browser is routed through the active Connection.
_Avoid_: Full proxy, VPN mode

**Smart Mode**:
Traffic is conditionally routed based on built-in rulesets (e.g., geofencing, blocklists).
_Avoid_: Auto mode, PAC mode

**Custom Rules Mode**:
Traffic is conditionally routed based on user-defined specific domain or IP rules.
_Avoid_: Manual mode

## Performance & Diagnostics

**Ping Probe** (Проверка пинга):
A lightweight TCP round-trip latency measurement initiated via the Native Daemon to determine the latency (in milliseconds) to a specific Proxy Server.
_Avoid_: ICMP check, speedtest

**Latency Tier** (Уровень задержки):
The standardized classification of Proxy Server responsiveness based on round-trip time thresholds: Optimal (< 100ms), Moderate (100–300ms), High (> 300ms), and Offline/Timeout.
_Avoid_: Ping color, speed rating

**Protocol Adapter** (Адаптер протокола):
A discrete unit of Xray/Happ configuration logic responsible for building the daemon configuration for a single proxy protocol (VLESS, VMess, Trojan, etc.). Each adapter handles one protocol type; `buildFor` dispatches to the correct adapter. Candidate for extraction from `daemon-config.ts`.
_Avoid_: Config builder, protocol handler

**Popup State** (Состояние попапа):
The reactive slice of application state consumed by the extension popup UI: connected flag, proxy server list, selected server ID, and ping results. Currently read directly from Settings Repository; candidate for encapsulation in a `usePopupState` hook.
_Avoid_: UI state, front-end state
