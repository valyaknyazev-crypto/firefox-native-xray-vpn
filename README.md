# Firefox Native Xray VPN

[![Firefox Add-on](https://img.shields.io/badge/Firefox-115.0%2B-orange.svg?logo=firefox-browser)](https://www.mozilla.org/firefox/)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-blue.svg)](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions)
[![Xray-core](https://img.shields.io/badge/Core-Xray--core-red.svg?logo=xray)](https://github.com/XTLS/Xray-core)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6.svg?logo=typescript)](https://www.typescriptlang.org/)
[![React 18](https://img.shields.io/badge/UI-React%2018-61DAFB.svg?logo=react)](https://react.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

Расширение для Mozilla Firefox, которое направляет трафик браузера в локальный демон Xray-core через Firefox Native Messaging.

В отличие от стандартных расширений только с HTTP и SOCKS5, этот клиент работает с протоколами VLESS, VMess и Trojan, а также с маскировкой трафика Reality и Vision прямо из браузера, без сторонних десктопных программ.

## Возможности

* Протоколы: VLESS, VMess, Trojan, Shadowsocks.
* Транспорты и безопасность: Reality, XTLS-Vision, XHTTP, gRPC, WebSocket, TCP.
* Подписки: загрузка серверов из ссылок на подписки (Base64), строк (vless://, vmess://, trojan://) и JSON-конфигов. Автоматическое обновление каждые 6 часов.
* Проверка связи: замер задержки (TCP-пинг) до каждого сервера.
* Маршрутизация: весь трафик через прокси (Global) или разделение по правилам.
* Безопасность: ключи и конфигурация передаются демону в память через stdin без сохранения на диск.

## Требования

* Windows 10 или 11 (64-bit).
* Mozilla Firefox 115 или новее.
* Node.js LTS (нужен для запуска хоста Native Messaging).

## Установка

### 1. Установка демона

Демон принимает команды от браузера и управляет процессом Xray:

1. Откройте PowerShell от имени Администратора.
2. Перейдите в папку с проектом.
3. Запустите скрипт установки:
   ```powershell
   .\install-daemon.ps1
   ```
   Скрипт скачает Xray-core, сохранит файлы в `%APPDATA%\VPNProxyDaemon` и добавит ключ Native Messaging в реестр Windows.

### 2. Установка расширения в Firefox

1. Откройте раздел Releases в репозитории.
2. Скачайте файл `vpn-extension.xpi`.
3. В Firefox перейдите на страницу `about:addons` (или нажмите Ctrl + Shift + A).
4. Нажмите на значок шестерёнки в правом верхнем углу и выберите «Установить дополнение из файла...».
5. Выберите скачанный `.xpi` и подтвердите установку.

Для разработки можно загрузить папку `dist/` на странице `about:debugging#/runtime/this-firefox`.

## Использование

1. Нажмите на значок расширения на панели Firefox.
2. Откройте Routing & Settings.
3. Вставьте ссылку на подписку в поле Subscription URL (или напишите `mock` для проверки на тестовых серверах) и нажмите Sync.
4. Выберите сервер из списка и нажмите Connect.

## Сборка из исходников

```bash
git clone https://github.com/valyaknyazev-crypto/firefox-native-xray-vpn.git
cd firefox-native-xray-vpn

npm install
npx tsc --noEmit
npm test
npm run build
npm run package
```

Скрипт упаковки создаёт готовые архивы в каталоге `release/`:
* `release/vpn-extension-v2.0.4.zip`: архив для публикации в Mozilla Add-on Developer Hub.
* `release/vpn-source-v2.0.4.zip`: чистый архив исходного кода.
* `release/vpn-daemon-v2.0.4.zip`: архив установщика демона.

## Лицензия

MIT License
