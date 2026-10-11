# NeverBeLate / BahnAlarm

A React Native and TypeScript commuter-app prototype that calculates a wake-up schedule from train departures and reported delays. Choose your stations, arrival time, preparation minutes and commute days to see when to get ready.

The application lives in [`BahnAlarm/`](BahnAlarm/). It demonstrates mobile UI, transport API integration, local persistence and scheduling logic; reliable background updates and alarm delivery remain unfinished.

## What is implemented

- Debounced station search and an alarm form with weekday selection, editing and deletion.
- Settings and alarm persistence through AsyncStorage.
- A dashboard with calculated wake-up time, train/platform information, reported delay and manual refresh.
- iOS local-notification scheduling and a background-fetch service designed to store the latest 20 schedule adjustments.
- Shared TypeScript models and reusable status/history components.

## How the schedule is calculated

The dashboard requests a journey for the configured arrival time and calculates from its first leg:

```text
calculated wake-up time
  = planned departure + reported departure delay - preparation minutes
```

For example: 07:30 departure + 10-minute delay - 45-minute preparation = 06:55 wake-up time.

The client calls `/locations` and `/journeys` on the [transport.rest Deutsche Bahn API](https://v6.db.transport.rest/) over HTTPS, without an API key. This is an independent project.

## Stack

| Area | Implementation |
| --- | --- |
| App | React Native 0.82, React 19, TypeScript, React Navigation |
| Data and dates | React hooks, AsyncStorage, `fetch`, date-fns |
| Native services | `push-notification-ios`, `react-native-background-fetch` |
| Tooling | Metro, ESLint, Jest |

## Local development

Follow the [React Native environment setup guide](https://reactnative.dev/docs/set-up-your-environment). Requirements:

- Node.js 20.19.4+ and npm, matching the locked React Native dependency.
- Android: Android Studio, JDK and a device/emulator; SDK 36, Build Tools 36.0.0, NDK 27.1.12297006, minimum SDK 24.
- iOS: macOS, Xcode, Ruby/Bundler and CocoaPods; the checked-in project targets iOS 15.1.
- Internet access for transport data.

Install dependencies:

```bash
git clone https://github.com/alexlanderzander/neverbelate.git
cd neverbelate/BahnAlarm
npm ci
```

For iOS, also run:

```bash
bundle install
cd ios
bundle exec pod install
cd ..
```

Start Metro:

```bash
npm start
```

In another terminal, from `neverbelate/BahnAlarm`:

```bash
npm run android
# or, on macOS:
npm run ios
```

Available checks:

```bash
npm run lint
npm test
```

The existing test covers basic app rendering. Builds and automated checks were not run for this documentation update.

## Project map

| Path | Responsibility |
| --- | --- |
| [`screens/`](BahnAlarm/src/screens/) / [`components/`](BahnAlarm/src/components/) | Forms, dashboard and reusable UI |
| [`DbApiService.ts`](BahnAlarm/src/api/DbApiService.ts) | Station and journey requests |
| [`timeHelper.ts`](BahnAlarm/src/utils/timeHelper.ts) / [`types/`](BahnAlarm/src/types/) | Schedule helpers and data models |
| [`services/`](BahnAlarm/src/services/) | Notifications and background updates |
| [`android/`](BahnAlarm/android/) / [`ios/`](BahnAlarm/ios/) | Native projects |

The earlier [architecture overview](BahnAlarm/README.md) is preserved.

## Current status and next steps

- **Background integration:** the worker imports a missing `getNextCommuteDateTime` helper and reads obsolete settings fields instead of the current `alarms[]` model.
- **Notifications:** the worker updates stored times without rescheduling notifications. Android's manifest references a notification library missing from `package.json`; the scheduling service currently uses iOS APIs.
- **Schedule handling:** weekday selection and occurrence-date calculation need aligning. Input validation and multi-leg/walking-first journeys also need work.
- **Device verification:** the requested 15-minute background interval is controlled by the operating system. Schedule calculations, permissions and lifecycle behavior need focused tests and device checks before dependable alarm use.
