# 🦊 Firefox Native Xray VPN (v2.0.4)

[![Firefox Add-on](https://img.shields.io/badge/Firefox-115.0%2B-orange.svg?logo=firefox-browser)](https://www.mozilla.org/firefox/)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-blue.svg)](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions)
[![Xray-core](https://img.shields.io/badge/Core-Xray--core-red.svg?logo=xray)](https://github.com/XTLS/Xray-core)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6.svg?logo=typescript)](https://www.typescriptlang.org/)
[![React 18](https://img.shields.io/badge/UI-React%2018-61DAFB.svg?logo=react)](https://react.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

[🇷🇺 Инструкция на русском](#инструкция-на-русском) | [🇬🇧 English Guide](#english-guide)

---

<a name="инструкция-на-русском"></a>
## 🇷🇺 Инструкция на русском

Полнофункциональный нативный VPN и прокси-клиент для браузера Mozilla Firefox, построенный на базе передового ядра [Xray-core](https://github.com/XTLS/Xray-core).

В отличие от стандартных браузерных расширений, ограниченных возможностями HTTP/SOCKS5 прокси, это решение напрямую взаимодействует с локальным системным демоном через **Firefox Native Messaging API**. Это открывает доступ к передовым протоколам обхода блокировок и маскировки трафика прямо внутри браузера без необходимости держать открытыми тяжелые десктопные клиенты (v2rayN, Nekoray, Hiddify).

---

### ✨ Ключевые возможности

* **Кибер-минималистичный интерфейс (v2.0.4)**:
  * Полный отказ от эмодзи в пользу 20+ четких векторных SVG-иконок (`Icons.tsx`), отображающихся идентично на любых мониторах и ОС.
  * Глубокая AMOLED тёмная тема (`#050811`) со стекломорфизмом (`backdrop-filter: blur(12px)`).
  * Плавные микроинтеракции, неоновое циановое свечение и анимированный пульсирующий изумрудный индикатор активного соединения.
  * Встроенные неблокирующие уведомления (`NoticeBanner`) взамен назойливых модальных окон `alert()`.
  * Многоуровневые бейджи задержки с точечным индикатором и антенной (Зелёный `< 100ms`, Янтарный `100–300ms`, Розовый `> 300ms`).
* **Поддержка современных протоколов**:
  * `VLESS`, `VMess`, `Trojan`, `Shadowsocks`.
* **Передовые транспорты и обфускация**:
  * `REALITY` (маскировка под популярные TLS-сайты без собственного домена).
  * `XTLS-Vision` (потоковое мультиплексирование с прямой передачей TCP).
  * `XHTTP` (SplitHTTP для обхода агрессивных DPI-фильтров).
  * `gRPC`, `WebSocket`, `TCP`.
* **Режимы маршрутизации**:
  * **Global**: Весь исходящий трафик Firefox направляется через защищённый VPN.
  * **Smart (Auto)**: Умная маршрутизация на основе правил — заблокированные ресурсы направляются через прокси, локальные сайты открываются напрямую.
  * **Custom Rules**: Пользовательские правила разделения трафика для отдельных доменов и IP-адресов.
* **Управление подписками**:
  * Импорт по прямым ссылкам на подписки (Base64), отдельным URI (`vless://`, `vmess://`, `trojan://`) или сырым JSON-конфигурациям.
  * Автоматическое фоновое обновление подписок каждые 6 часов через `browser.alarms`.
* **Безопасность и приватность**:
  * Чувствительные ключи и конфигурации передаются демону в оперативную память через стандартный ввод (stdin) процесса Native Messaging без сохранения конфигов на диск.
* **Экстремальная легковесность**:
  * Весь бандл расширения занимает всего **~120 КБ** благодаря нулевому количеству внешних тяжелых UI-зависимостей.

---

### 📦 Системные требования

1. **Операционная система**: Windows 10 / 11 (64-bit).
2. **Браузер**: Mozilla Firefox 115.0 или новее.
3. **Зависимости для демона**:
   * [Node.js](https://nodejs.org/) (версия LTS) — необходим для запуска Native Messaging хоста.

---

### 🚀 Пошаговая установка

Установка состоит из двух быстрых шагов: настройки локального демона и установки файла расширения в Firefox.

#### Шаг 1: Установка нативного демона (Native Daemon)

Демон принимает команды от расширения и управляет локальным ядром Xray:

1. Откройте **PowerShell от имени Администратора**.
2. Перейдите в каталог с проектом:
   ```powershell
   cd C:\путь\к\firefox-native-xray-vpn
   ```
3. Выполните скрипт автоматической установки:
   ```powershell
   .\install-daemon.ps1
   ```
   *Скрипт автоматически скачает официальный бинарник `Xray-core`, скопирует демон в `%APPDATA%\VPNProxyDaemon` и зарегистрирует хост Native Messaging в реестре Windows (`HKCU\Software\Mozilla\NativeMessagingHosts`).*

#### Шаг 2: Установка расширения в Firefox

1. Откройте раздел **[Releases](https://github.com/valyaknyazev-crypto/firefox-native-xray-vpn/releases)** этого репозитория (или загляните в локальную папку `release/`).
2. Скачайте файл расширения **`vpn-extension.xpi`**.
3. В браузере Firefox откройте страницу управления дополнениями:
   * Введите в адресной строке: `about:addons`
   * Или нажмите сочетание клавиш `Ctrl + Shift + A`.
4. Нажмите на значок шестерёнки ⚙️ в верхнем правом углу и выберите пункт **«Установить дополнение из файла...»** (*Install Add-on From File...*).
5. Выберите скачанный файл **`vpn-extension.xpi`** и подтвердите установку.

*(Для разработчиков: можно загрузить распакованную директорию `dist/` через `about:debugging#/runtime/this-firefox` ➔ «Загрузить временное дополнение...»).*

---

### ⚙️ Использование

1. Нажмите на иконку **VPN Proxy** на панели инструментов Firefox.
2. Откройте **Routing & Settings** (или нажмите **Add Subscription**).
3. В поле **Subscription URL** вставьте ссылку на вашу подписку (или введите `mock` для проверки на тестовых серверах) и нажмите **Sync**.
4. Вернитесь в главное окно попапа, выберите нужный сервер и нажмите кнопку **Connect**.
5. Браузер перейдёт в режим защищённого туннелирования с активным изумрудным индикатором соединения!

---

### 🛠️ Сборка из исходного кода

```bash
# Клонировать репозиторий
git clone https://github.com/valyaknyazev-crypto/firefox-native-xray-vpn.git
cd firefox-native-xray-vpn

# Установить зависимости
npm install

# Запустить проверку типов TypeScript
npx tsc --noEmit

# Запустить полный набор модульных и интеграционных тестов
npm test

# Собрать продакшн-бандл
npm run build

# Собрать подписанные архивы релизов в папку release/
npm run package
```

Собранные готовые архивы для релиза создаются в каталоге `release/`:
* `release/vpn-extension-v2.0.4.zip` — чистый бандл расширения для публикации в Mozilla Add-on Developer Hub.
* `release/vpn-source-v2.0.4.zip` — архив исходного кода для ревью кода в Mozilla.
* `release/vpn-daemon-v2.0.4.zip` — архив инсталлятора нативного демона.

---
---

<a name="english-guide"></a>
## 🇬🇧 English Guide

A full-featured native VPN and proxy client for Mozilla Firefox powered by [Xray-core](https://github.com/XTLS/Xray-core).

Unlike standard browser proxy add-ons that are strictly constrained to traditional HTTP/SOCKS5 protocols, this extension directly controls a local background Xray daemon using the **Firefox Native Messaging API**. This brings advanced censorship-resistant protocols and obfuscation transports straight into your browser without needing bulky desktop clients.

---

### ✨ Features

* **Cyber-Minimalist Interface (v2.0.4)**:
  * Complete replacement of emojis with 20+ bespoke SVG vector line icons (`Icons.tsx`) rendering crisply on any OS and DPI scale.
  * Deep AMOLED dark theme (`#050811`) with frosted glassmorphism cards (`backdrop-filter: blur(12px)`).
  * Seamless micro-interactions: ambient cyan border in disconnected state and emerald pulsing glow when connected.
  * Contextual inline notice banners (`NoticeBanner`) with auto-dismiss timers, eliminating disruptive modal `alert()` popups.
  * Multi-tier latency pills with antenna signal indicators and color dots (Green `< 100ms`, Amber `100–300ms`, Rose `> 300ms`).
* **Supported Protocols**:
  * `VLESS`, `VMess`, `Trojan`, `Shadowsocks`.
* **Cutting-Edge Transports & Security**:
  * `REALITY` (direct TLS camouflage targeting popular domain certificates).
  * `XTLS-Vision` (flow control with direct TCP streaming).
  * `XHTTP` (SplitHTTP to circumvent strict DPI inspection).
  * `gRPC`, `WebSocket`, `TCP`.
* **Flexible Routing Modes**:
  * **Global**: All browser traffic routes through the active VPN server.
  * **Smart (Auto)**: Rule-based routing — proxy censored domains while keeping local and fast services direct.
  * **Custom Rules**: Manage granular domain and IP routing rules.
* **Subscription Management**:
  * Import Base64 subscription URLs, direct protocol links (`vless://`, `vmess://`, `trojan://`), or raw JSON configs.
  * Automated background synchronization every 6 hours via `browser.alarms`.
* **Zero-Leak Security**:
  * Configurations are streamed directly into daemon memory through Native Messaging stdin without sensitive credentials touching the disk.
* **Ultra-Lightweight**:
  * Production extension package is under **~120 KB**, keeping resource usage minimal.

---

### 📦 System Requirements

1. **OS**: Windows 10 / 11 (64-bit).
2. **Browser**: Mozilla Firefox version 115.0 or newer.
3. **Daemon Dependencies**:
   * [Node.js](https://nodejs.org/) (LTS recommended) — required for running the Native Messaging host.

---

### 🚀 Step-by-Step Installation

#### Step 1: Install the Native Daemon

The native daemon handles Xray-core process lifecycle and local traffic routing:

1. Open **PowerShell as Administrator**.
2. Navigate to your project folder:
   ```powershell
   cd C:\path\to\firefox-native-xray-vpn
   ```
3. Execute the automated installer:
   ```powershell
   .\install-daemon.ps1
   ```
   *The script automatically fetches the official `Xray-core` binary, installs daemon scripts to `%APPDATA%\VPNProxyDaemon`, and configures the Native Messaging manifest in the Windows Registry.*

#### Step 2: Install Extension in Firefox

1. Navigate to the **[Releases](https://github.com/valyaknyazev-crypto/firefox-native-xray-vpn/releases)** page of this repository (or check the local `release/` directory).
2. Download the **`vpn-extension.xpi`** installer file.
3. In Firefox, open the Add-ons manager:
   * Enter `about:addons` in the address bar.
   * Or press `Ctrl + Shift + A`.
4. Click the gear icon ⚙️ in the upper right corner and select **"Install Add-on From File..."**.
5. Select the downloaded **`vpn-extension.xpi`** file and confirm installation.

*(Developers can also load the `dist/` folder via `about:debugging#/runtime/this-firefox` ➔ "Load Temporary Add-on...").*

---

### ⚙️ Usage

1. Click the **VPN Proxy** icon in the Firefox browser toolbar.
2. Navigate to **Routing & Settings** (or click **Add Subscription**).
3. Paste your subscription URL into the **Subscription URL** field (or enter `mock` to generate sandbox test servers) and click **Sync**.
4. Return to the popup list, choose a server, and click **Connect**.
5. Your browser traffic is now securely routed with an emerald active indicator!

---

### 🛠️ Building from Source

```bash
# Clone the repository
git clone https://github.com/valyaknyazev-crypto/firefox-native-xray-vpn.git
cd firefox-native-xray-vpn

# Install dependencies
npm install

# Run TypeScript type check
npx tsc --noEmit

# Run Vitest test suite
npm test

# Build production bundles
npm run build

# Package release archives to release/ folder
npm run package
```

Built release archives are stored in the `release/` directory:
* `release/vpn-extension-v2.0.4.zip` — built extension bundle for submission to Mozilla Add-on Developer Hub.
* `release/vpn-source-v2.0.4.zip` — clean source code archive for Mozilla review.
* `release/vpn-daemon-v2.0.4.zip` — native daemon installer and binaries.

---

### 📄 License

This project is licensed under the [MIT License](LICENSE).
