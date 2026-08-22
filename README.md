# 🦊 Firefox Native Xray VPN (v2.0.1)

[Русский](#инструкция-на-русском) | [English](#english-guide)

---

<a name="инструкция-на-русском"></a>
## 🇷🇺 Инструкция на русском

Полнофункциональный нативный VPN/прокси-клиент для браузера Mozilla Firefox на базе [Xray-core](https://github.com/XTLS/Xray-core). В отличие от обычных прокси-расширений, ограниченных стандартными протоколами HTTP/SOCKS, это расширение напрямую управляет локальным демоном Xray через **Firefox Native Messaging API**.

Это позволяет использовать современные протоколы обхода блокировок (**VLESS, VMess, Trojan, Reality, XTLS-Vision, XHTTP, gRPC, WebSocket**) прямо внутри браузера без сторонних десктопных приложений.

---

### ✨ Возможности

* **Современный UI на React + TypeScript**: Быстрый и отзывчивый интерфейс попапа и страницы настроек.
* **Поддержка протоколов**: `VLESS`, `VMess`, `Trojan`, `Shadowsocks`.
* **Транспорты и шифрование**: `REALITY`, `TLS`, `XTLS-Vision` (`flow: xtls-rprx-vision`), `XHTTP` (splithttp), `gRPC`, `WebSocket`, `TCP`.
* **Умная маршрутизация (Smart Routing)**:
  * **Global**: Весь трафик браузера идёт через VPN.
  * ~~**Smart (Auto)**: Автоматический обход блокировок по встроенной базе geosite — заблокированные ресурсы идут через прокси, локальные и быстрые сайты напрямую.~~ *(в разработке)*
  * ~~**Custom Rules**: Ручные правила маршрутизации для конкретных доменов и IP.~~ *(в разработке)*
* **Управление подписками**: Поддержка ссылок подписок (Base64), прямых URI (`vless://`, `vmess://`, `trojan://`) и сырых JSON-конфигов.
* **Фоновое автообновление**: Автоматическая синхронизация серверов подписки в фоне каждые 6 часов через `browser.alarms`.
* **Безопасность**: Конфигурации передаются демону в оперативную память через stdin Native Messaging без записи чувствительных ключей на диск.

---

### 📦 Системные требования и зависимости

1. **ОС**: Windows 10 / 11 (64-bit).
2. **Браузер**: Mozilla Firefox версии 115.0 или новее.
3. **Зависимости для работы демона**:
   * [Node.js](https://nodejs.org/) (LTS версия) — требуется для работы Native Messaging хоста.

---

### 🚀 Пошаговая установка

Установка состоит из двух простых шагов: установки локального демона и добавления расширения в Firefox.

#### Шаг 1: Установка локального демона (Native Daemon)

Локальный демон принимает команды от расширения и запускает Xray-core на локальном порту:

1. Откройте **PowerShell от имени Администратора**.
2. Перейдите в папку с проектом:
   ```powershell
   cd путь\к\папке
   ```
3. Запустите скрипт установки:
   ```powershell
   .\install-daemon.ps1
   ```
   *Скрипт автоматически скачает официальный бинарник `Xray-core`, скопирует демон в `%APPDATA%\VPNProxyDaemon` и пропишет ключ Native Messaging в реестр Windows.*

#### Шаг 2: Установка расширения в Firefox

1. Перейдите в раздел **[Releases](https://github.com/valyaknyazev-crypto/firefox-native-xray-vpn/releases)** репозитория.
2. Скачайте файл расширения **`vpn-extension.xpi`**.
3. В Firefox откройте страницу управления дополнениями:
   * Введите в адресной строке: `about:addons`
   * Либо нажмите сочетание клавиш `Ctrl + Shift + A`.
4. Нажмите на значок шестерёнки ⚙️ в правом верхнем углу и выберите **«Установить дополнение из файла...»** (*Install Add-on From File...*).
5. Выберите скачанный файл **`.xpi`** и подтвердите установку.

*(Для разработчиков: можно загрузить распакованную папку `dist/` через `about:debugging#/runtime/this-firefox` ➔ «Загрузить временное дополнение...»).*

---

### ⚙️ Использование

1. Нажмите на иконку **VPN Extension** на панели инструментов Firefox.
2. Перейдите в **Routing & Settings** (или нажмите **Add Subscription**).
3. В поле **Subscription URL** вставьте ссылку на вашу подписку (или слово `mock` для проверки) и нажмите **Sync**.
4. Вернитесь в главное окно попапа, выберите нужный сервер из списка и нажмите **Connect**.
5. Трафик браузера защищён и направлен через выбранный прокси-сервер!

---

### 🛠️ Сборка из исходного кода

```bash
# Клонировать репозиторий
git clone https://github.com/valyaknyazev-crypto/firefox-native-xray-vpn.git
cd firefox-native-xray-vpn

# Установить зависимости
npm install

# Запустить тесты
npm test

# Собрать расширение для Firefox
npm run build

# Упаковать релизные архивы (ZIP и XPI)
npm run package
```

---
---

<a name="english-guide"></a>
## 🇬🇧 English Guide

A full-featured native VPN/proxy client for Mozilla Firefox powered by [Xray-core](https://github.com/XTLS/Xray-core). Unlike traditional browser proxy add-ons limited to standard HTTP/SOCKS protocols, this extension directly controls a local background Xray daemon using the **Firefox Native Messaging API**.

This enables censorship-resistant protocols (**VLESS, VMess, Trojan, Reality, XTLS-Vision, XHTTP, gRPC, WebSocket**) directly inside your browser without needing bulky third-party desktop clients.

---

### ✨ Features

* **Modern UI with React + TypeScript**: Fast and responsive popup interface and settings page.
* **Protocol Support**: `VLESS`, `VMess`, `Trojan`, `Shadowsocks`.
* **Transports & Security**: `REALITY`, `TLS`, `XTLS-Vision` (`flow: xtls-rprx-vision`), `XHTTP` (splithttp), `gRPC`, `WebSocket`, `TCP`.
* **Smart Traffic Routing**:
  * **Global**: All browser traffic routes through the VPN.
  * ~~**Smart (Auto)**: Built-in geosite ruleset — blocked resources route through proxy, local and fast websites connect directly.~~ *(in development)*
  * ~~**Custom Rules**: User-defined domain and IP routing rules.~~ *(in development)*
* **Subscription Management**: Supports Base64 subscription URLs, direct URIs (`vless://`, `vmess://`, `trojan://`), and raw JSON configs.
* **Background Auto-Sync**: Automatically updates subscription server lists every 6 hours via `browser.alarms`.
* **Security & Privacy**: Configurations are passed directly into memory over Native Messaging stdin without writing keys to disk.

---

### 📦 Requirements & Dependencies

1. **OS**: Windows 10 / 11 (64-bit).
2. **Browser**: Mozilla Firefox version 115.0 or newer.
3. **Daemon Dependencies**:
   * [Node.js](https://nodejs.org/) (LTS recommended) — required for the Native Messaging wrapper host.

---

### 🚀 Step-by-Step Installation

Installation consists of two simple steps: installing the local native daemon and loading the extension into Firefox.

#### Step 1: Install the Native Daemon

The native daemon receives commands from the extension and spawns Xray-core on a local port:

1. Open **PowerShell as Administrator**.
2. Navigate to the repository folder:
   ```powershell
   cd path\to\folder
   ```
3. Run the installer script:
   ```powershell
   .\install-daemon.ps1
   ```
   *The script automatically downloads official `Xray-core`, deploys files to `%APPDATA%\VPNProxyDaemon`, and registers the Native Messaging host in the Windows Registry.*

#### Step 2: Install Extension in Firefox

1. Go to the **[Releases](https://github.com/valyaknyazev-crypto/firefox-native-xray-vpn/releases)** page of this repository.
2. Download the extension file: **`vpn-extension.xpi`**.
3. In Firefox, open the Add-ons manager:
   * Enter `about:addons` in the URL address bar.
   * Or press `Ctrl + Shift + A`.
4. Click the gear icon ⚙️ in the top-right corner and select **"Install Add-on From File..."**.
5. Select the downloaded **`.xpi`** file and confirm the installation.

*(For developers: you can load the uncompressed `dist/` directory via `about:debugging#/runtime/this-firefox` ➔ "Load Temporary Add-on...").*

---

### ⚙️ Usage

1. Click the **VPN Extension** icon in the Firefox toolbar.
2. Click **Routing & Settings** (or **Add Subscription**).
3. In the **Subscription URL** field, enter your subscription link (or type `mock` for testing) and click **Sync**.
4. Return to the popup, select your server, and click **Connect**.
5. Your browser traffic is now securely tunneled!

---

### 🛠️ Building from Source

```bash
# Clone the repository
git clone https://github.com/valyaknyazev-crypto/firefox-native-xray-vpn.git
cd firefox-native-xray-vpn

# Install dependencies
npm install

# Run tests
npm test

# Build extension
npm run build

# Package release archives (ZIP and XPI)
npm run package
```

---

### 📄 License

MIT License
