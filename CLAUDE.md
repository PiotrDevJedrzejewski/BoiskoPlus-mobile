# BoiskoPlus Mobile — CLAUDE.md

AI assistant context file. Read this before touching any code.

---

## Project Overview

**Boisko+** is a React Native / Expo mobile app for organising and finding local sports events in Poland. It is the mobile counterpart of the **BoiskoPlus** web app. Both share the same Express + MongoDB backend.

- App name: `Boisko+`
- Bundle ID: `com.boiskoplusmobile.app`
- Expo SDK: 54 | React Native: 0.81.5 | React: 19.1.0
- New Architecture enabled (`newArchEnabled: true`)
- Language: **JavaScript only** (no TypeScript)
- Orientation: portrait

---

## Tech Stack

### Frontend (this repo)

| Area | Library / Version |
|---|---|
| Framework | React Native 0.81.5 + Expo SDK 54 |
| Navigation | Expo Router 6 (file-based) + React Navigation 7 |
| State management | **Zustand 5** (`zustand` — installed, needs more integration) |
| HTTP client | **customFetch** — axios instance with JWT interceptor (`assets/utils/customFetch.js`) |
| Real-time | **Socket.IO Client 4.8** (two namespaces: `/chat`, `/notifications`) |
| Maps | **@rnmapbox/maps 10.2.9** + **supercluster 8** for marker clustering |
| Auth | Firebase Auth + Google Sign-In (`@react-native-google-signin/google-signin`) |
| Storage | `expo-secure-store` (JWT token) + `@react-native-async-storage/async-storage` |
| Animations | React Native Reanimated 4 + **Lottie** (`lottie-react-native 7`) |
| Alerts / Toasts | **toastify-react-native 7** |
| Image handling | `expo-image-picker` + `expo-image-manipulator` |
| Push notifications | `expo-notifications` |
| Audio | `expo-audio` |
| UI extras | `expo-blur`, `expo-linear-gradient`, `react-native-gesture-handler` |
| Keyboard | `react-native-keyboard-controller` |
| Slider | `@miblanchard/react-native-slider` |
| Firebase (storage) | `firebase 12` (avatar uploads via Firebase Storage) |

### Backend (BoiskoPlus/server — shared with web)

| Area | Tech |
|---|---|
| Server | Express.js |
| Database | MongoDB (Mongoose) |
| Real-time | Socket.IO (namespaces: `/chat`, `/notifications`) |
| Auth | JWT tokens + Firebase OAuth |
| Geocoding | Mapbox API |

---

## Project Structure

```
app/                    # Expo Router pages (file-based routing)
  _layout.jsx           # Root layout
  index.jsx             # Entry / redirect
  login.jsx
  register.jsx
  forget-password.jsx
  new-password.jsx
  register-with-oauth.jsx
  rules.jsx
  (auth)/               # Authenticated route group

assets/
  utils/
    customFetch.js      # Axios instance (JWT interceptor, base URL logic)
    firebase.js         # Firebase app init
    firebaseStorage.js  # Firebase Storage helpers
    eventsApi.js        # Event-specific API calls
    safeStorage.js      # Safe wrappers around SecureStore/AsyncStorage
    scaleUI.UX.js       # UI scaling utilities
    debugLogger.js      # Debug logging helpers
    gameTypeIcons.js    # Icon map for sport types
    getUserLocation.js  # Geolocation helper
    citySearchUtils.js  # Polish city autocomplete logic
    variablesPolandRegion.js
    spinner.json        # Lottie animation
    typing.json         # Lottie animation (chat typing indicator)
  fonts/
  images/
  sounds/
  hooks/
    useGradualAnimation.jsx

components/             # Reusable UI components
  Button1.jsx
  CardDashboard.jsx
  ChatMessageBox.jsx
  ChatRoomListItem.jsx
  CitySuggestions.jsx
  DrawerModal.jsx
  EditEventUserCard.jsx
  FilterButton.jsx
  FindEventListElement.jsx
  FormEvent.jsx
  HeaderDrawer.jsx
  HeaderStack.jsx
  MapboxMobile.jsx
  MyEventCard.jsx
  NetworkGuard.jsx
  PlayerCard.jsx
  ...

context/
  AuthContext.jsx         # User session, consents, Google Sign-In, location
  DashboardContext.jsx
  DrawerContext.jsx
  FriendshipContext.jsx
  MapContext.jsx
  NotificationContext.jsx
  SocketIoContext.jsx     # Socket.IO lifecycle manager (NOT a context provider — renders children directly)
  socketStore.js          # Zustand store for all socket state (source of truth)
  index.js                # Barrel exports

constants/              # App-wide constants

app.config.js           # Expo config (env, plugins, Firebase, Mapbox)
eas.json                # EAS Build profiles
babel.config.js
```

---

## Key Architecture Patterns

### customFetch (Axios)
- File: `assets/utils/customFetch.js`
- Axios instance with `baseURL` resolved at runtime (dev vs prod, Android emulator vs physical device vs iOS)
- Request interceptor: reads JWT from `expo-secure-store` and injects `Authorization: Bearer <token>`
- Response interceptor: fires `_onUnauthorized` callback on 401 (triggers logout in AuthContext)
- Dev URL: `EXPO_PUBLIC_SERVER_URL` env var, falls back to `10.0.2.2:3000` (Android) or `localhost:3000` (iOS)
- Prod URL: `Constants.expoConfig.extra.serverUrl` or `https://boiskoplus-backend.onrender.com/api/v1`

### Zustand (State Management)
- `socketStore.js` is the primary Zustand store — holds all Socket.IO state
- Consumers import `useSocketStore` directly with selectors (no re-renders on unrelated state)
- `SocketIoContext.jsx` is a manager component (not a Provider) — it initialises sockets, attaches listeners, and updates the Zustand store
- **TODO**: Zustand is underutilised — more global state (auth, notifications, etc.) should be migrated from React Context to Zustand stores

### Socket.IO
- Two namespaces: `/chat` and `/notifications`
- Socket options: polling → websocket upgrade, exponential backoff, 10 reconnection attempts
- Socket URL: `EXPO_PUBLIC_SERVER_URL_SOCKET` env var or `Constants.expoConfig.extra.socketUrl`
- Room cache: `joinedRooms` Set (in-memory, **cleared on app restart/minimize** — see known bugs)

### Firebase
- Auth: Google OAuth via `@react-native-google-signin/google-signin`
- Storage: Avatar uploads via Firebase Storage (`firebase 12` SDK)
- Config files: `google-services.json` (Android), `GoogleService-Info.plist` (iOS)

### Push Notifications
- Uses `expo-notifications`
- Push token stored in backend (`pushTokenModel.js`)
- Notification preferences per-user (events, chat messages, reminders, nearby events)
- Per-room and per-event muting with optional expiry date

### Maps
- `@rnmapbox/maps` with Mapbox access token
- Supercluster for marker clustering
- Dark/light map theme toggle
- Predefined sport courts (orliki) with geolocation
- Geocoding via Mapbox API (both address → coords and coords → city)

### Navigation
- Expo Router 6 (file-based, `app/` directory)
- `(auth)/` group for protected routes
- Drawer navigation via `DrawerContext` + `DrawerModal`
- Deep links scheme: `boiskoplusmobile://`

### UI Scaling
- Custom scaling utilities in `assets/utils/scaleUI.UX.js` for consistent sizing across devices

---

## Environment Variables

```
EXPO_PUBLIC_SERVER_URL          # Backend API base URL (with /api/v1)
EXPO_PUBLIC_SERVER_URL_SOCKET   # Socket.IO server URL (no /api/v1)
EXPO_MODE                       # 'development' or 'production'
```

Also configured in `app.config.js` under `expo.extra`:
- `serverUrl`
- `socketUrl`
- Mapbox access token

---

## Build & Run

```bash
# Install
npm install

# Dev (requires built native client)
npm run dev

# Expo Go (limited — no custom native modules)
npm start

# Android
npm run android

# iOS
npm run ios

# EAS Build (Android production)
eas build --profile production --platform android
```

Required files not in repo:
- `google-services.json` (Firebase Android)
- `GoogleService-Info.plist` (Firebase iOS)
- Mapbox access token in config
- `.env` with server URLs

---

## Backend API Base Paths

All routes prefixed with `/api/v1`:

| Domain | Router |
|---|---|
| Auth (mobile) | `/auth-mobile` |
| Users | `/users` |
| Events | `/events` |
| Participation status | `/status` |
| Chat | `/chat` |
| Friendships | `/friendship` |
| Leaderboard / Stats | `/user-stats` |
| Notifications | `/notifications` |
| Location | `/location-mobile` |
| Reports | `/reports` |

Socket.IO namespaces: `/chat`, `/notifications`

---

## Known Bugs / TODO

### 🐛 Bug: Push notifications only fire when app is fully closed
- **Status**: Open
- **Description**: Push notifications are sent correctly when the app is fully terminated. When the app is minimised (background state), push notifications are **not delivered**.
- **Suspected cause**: The push token registration or notification handler may not be correctly handling the `AppState` `background` transition. The `expo-notifications` background task / notification handler may not be registered outside of the foreground.
- **Files to investigate**: `context/NotificationContext.jsx`, `app.config.js` (notification plugin config), backend `utils/` (push sending logic)

### 🐛 Bug: Push notification deep-link navigates to empty/non-existent route
- **Status**: Open
- **Description**: Tapping a push notification sometimes navigates to an empty or broken route instead of the intended screen.
- **Suspected cause**: The notification `data.path` or deep-link URL stored in the notification payload does not match the current Expo Router file-based route structure, or the navigation handler fires before the navigator is ready.
- **Files to investigate**: Notification response handler in `context/NotificationContext.jsx`, `app/_layout.jsx` (navigation ready state), notification payload construction on the backend

### 🐛 Bug: iOS map navigation does not work
- **Status**: Open
- **Description**: Map-based navigation is broken on iOS.
- **Suspected cause**: `@rnmapbox/maps` version `10.2.9` likely needs to be updated — possible API or native module mismatch on iOS.
- **Fix**: Update `@rnmapbox/maps` to latest stable and test on iOS simulator/device. Check breaking changes in changelog.

### 🐛 Bug: Chat stops working after app is minimised
- **Status**: Open
- **Description**: After the app is sent to background and resumed, the chat becomes unresponsive — new messages are not received and sending may fail.
- **Suspected cause 1**: Socket.IO connection is lost on `AppState` change to `background` and reconnection does not re-join the active chat room. The `joinedRooms` Set is in-memory and is the source of truth for which rooms are joined — after reconnect, rooms are not automatically re-joined.
- **Suspected cause 2**: The socket instance reference stored in Zustand (`socketStore.js`) becomes stale after a reconnect because a new socket object is created but the old reference persists in some consumers.
- **Files to investigate**: `context/SocketIoContext.jsx` (AppState listener, reconnect logic), `context/socketStore.js` (`joinedRooms` Set, reconnect action)
- **Partial fix hint**: Listen to `AppState` change to `active`, check connection state, and force re-join all rooms that were previously joined

---

## Code Conventions

- JavaScript (no TypeScript)
- Functional components with hooks
- File-based routing via Expo Router (`app/` directory)
- Context providers wrapped in `app/_layout.jsx`
- API calls go through `customFetch` (never raw `fetch` or bare `axios`)
- Toast alerts via `toastify-react-native` (not Alert.alert for user-facing messages)
- Lottie animations for loading states (`assets/utils/spinner.json`, `typing.json`)
- UI scaling via `scaleUI.UX.js` utilities
- Debug logging via `assets/utils/debugLogger.js` (`dbg`, `logHttp`, etc.)
- `expo-secure-store` for sensitive data (JWT), `AsyncStorage` for non-sensitive persistence
