# BahnAlarm: App & Architecture Overview

## 1. App Overview

**BahnAlarm** is a mobile application for train commuters in Germany. It provides a dynamic, delay-aware alarm system to ensure users arrive at their destination on time.

The app allows users to configure their commute, including start and destination stations, desired arrival time, and preparation time. Based on this, BahnAlarm calculates and sets an alarm.

The app monitors train schedules in near real-time using the Deutsche Bahn (DB) API. It adjusts the alarm if the user's train is delayed, ensuring the user is only woken up when necessary and can still make it to their destination on time.

## 2. Core Features

*   **Commute Configuration:**
    *   Set start and destination stations with autocomplete search.
    *   Set desired arrival time.
    *   Set preparation time.
*   **Dynamic Alarm Calculation:**
    *   Calculates the initial alarm time based on user settings and the planned train departure.
*   **Real-time Delay Monitoring:**
    *   Periodically fetches the latest journey information from the DB API.
*   **Automatic Alarm Adjustment:**
    *   Recalculates and adjusts the alarm time if a delay is detected.
*   **Push Notifications:**
    *   Uses local push notifications to trigger the alarm.
*   **Journey Status Display:**
    *   Displays the current status of the upcoming train journey, including departure/arrival times and delays.
*   **Adjustment History:**
    *   Shows a history of alarm time adjustments due to train delays.

## 3. Architecture

BahnAlarm is built with React Native using a component-based architecture with a clear separation of concerns.

### High-Level Diagram

```
+---------------------+      +-------------------------+      +------------------+
|   React Native UI   |      |      Business Logic     |      |     Services     |
| (Screens & Comps)   |      | (State Mgmt & Utils)    |      | (API, Notifs, BG)|
+---------------------+      +-------------------------+      +------------------+
        |                              |                              |
        v                              v                              v
+--------------------------------------------------------------------------------+
|                               React Native Bridge                              |
+--------------------------------------------------------------------------------+
        |                              |                              |
        v                              v                              v
+---------------------+      +-------------------------+      +------------------+
|    Native Modules   |      |      DB Navigator API   |      |   System APIs    |
| (Push, BG Fetch)    |      |                         |      | (iOS/Android)    |
+---------------------+      +-------------------------+      +------------------+
```

### Component Breakdown

*   **UI Layer (React Native):**
    *   **Screens (`src/screens`):** Top-level components for main views (e.g., `DashboardScreen`, `SettingsScreen`).
    *   **Components (`src/components`):** Reusable UI building blocks (e.g., `AlarmDisplay`, `StatusCard`, `TrainConnectionForm`).
*   **Business Logic Layer:**
    *   **State Management:** Uses React's built-in state management (`useState`, `useCallback`) and `AsyncStorage` for data persistence.
    *   **Utilities (`src/utils`):** Helper functions for tasks like date and time manipulation (`timeHelper.ts`).
*   **Services Layer (`src/services`):**
    *   **API Service (`src/api/DbApiService.ts`):** Handles communication with the Deutsche Bahn (DB) API.
    *   **Notification Service (`src/services/NotificationService.ts`):** Manages local push notifications.
    *   **Background Service (`src/services/BackgroundUpdateService.ts`):** Uses `react-native-background-fetch` for background data fetching.

## 4. Technologies Used

*   **Framework:** React Native
*   **Language:** TypeScript
*   **UI:**
    *   React Navigation
    *   Core React Native components
*   **State Management:**
    *   React Hooks
    *   `@react-native-async-storage/async-storage`
*   **Services:**
    *   `fetch` API
    *   `@react-native-community/push-notification-ios`
    *   `react-native-push-notification`
    *   `react-native-background-fetch`
*   **Utilities:**
    *   `date-fns`

## 5. File Structure

```
BahnAlarm/
├── android/
├── ios/
├── src/
│   ├── api/
│   ├── components/
│   ├── navigation/
│   ├── screens/
│   ├── services/
│   ├── styles/
│   ├── types/
│   └── utils/
├── App.tsx
└── package.json
```

This structure promotes maintainability and scalability.