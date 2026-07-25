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

| Area               | Library / Version                                                                     |
| ------------------ | ------------------------------------------------------------------------------------- |
| Framework          | React Native 0.81.5 + Expo SDK 54                                                     |
| Navigation         | Expo Router 6 (file-based) + React Navigation 7                                       |
| State management   | **Zustand 5** (`zustand` — installed, needs more integration)                         |
| HTTP client        | **customFetch** — axios instance with JWT interceptor (`assets/utils/customFetch.js`) |
| Real-time          | **Socket.IO Client 4.8** (two namespaces: `/chat`, `/notifications`)                  |
| Maps               | **@rnmapbox/maps 10.2.9** + **supercluster 8** for marker clustering                  |
| Auth               | Firebase Auth + Google Sign-In (`@react-native-google-signin/google-signin`)          |
| Storage            | `expo-secure-store` (JWT token) + `@react-native-async-storage/async-storage`         |
| Animations         | React Native Reanimated 4 + **Lottie** (`lottie-react-native 7`)                      |
| Alerts / Toasts    | **toastify-react-native 7**                                                           |
| Image handling     | `expo-image-picker` + `expo-image-manipulator`                                        |
| Push notifications | `expo-notifications`                                                                  |
| Audio              | `expo-audio`                                                                          |
| UI extras          | `expo-blur`, `expo-linear-gradient`, `react-native-gesture-handler`                   |
| Keyboard           | `react-native-keyboard-controller`                                                    |
| Slider             | `@miblanchard/react-native-slider`                                                    |
| Firebase (storage) | `firebase 12` (avatar uploads via Firebase Storage)                                   |

### Backend (BoiskoPlus/server — shared with web)

| Area      | Tech                                              |
| --------- | ------------------------------------------------- |
| Server    | Express.js                                        |
| Database  | MongoDB (Mongoose)                                |
| Real-time | Socket.IO (namespaces: `/chat`, `/notifications`) |
| Auth      | JWT tokens + Firebase OAuth                       |
| Geocoding | Mapbox API                                        |

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
    debugLogger.js      # Debug logging helpers
    gameTypeIcons.js    # Icon map for sport types
    getUserLocation.js  # Geolocation helper
    citySearchUtils.js  # Polish city autocomplete logic
    variablesPolandRegion.js
    scaleUI.UX.js       # DEPRECATED — being migrated to Theme/, do not use in new code
    spinner.json        # Lottie animation
    typing.json         # Lottie animation (chat typing indicator)

Theme/                  # New design-tokens module (WIP migration target for scaleUI.UX.js)
  index.js              # Entry point — loadTheme()/getTheme()/setTheme(), AsyncStorage-backed light/dark switch
  StyleConstants.js      # SPACING (Fibonacci), PADDING, MARGIN, BORDER_RADIUS, FONT_SIZE (xs-xxl)
  ScalableStyles.js      # scale/verticalScale/moderateScale/scaleFont — lightweight replacement for scaleUI.UX.js
  ColorsLight.js         # Light theme palette
  ColorsDark.js          # Dark theme palette (default)
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
  FilterButton.jsx
  FindEventListElement.jsx
  FormEvent.jsx
  HeaderDrawer.jsx
  HeaderStack.jsx
  MapboxMobile.jsx
  NetworkGuard.jsx
  PlayerCard.jsx
  WeekCalendar.jsx
  ...

context/
  AuthContext.jsx         # User session, consents, Google Sign-In, location
  DashboardContext.jsx
  DrawerContext.jsx
  FriendshipContext.jsx
  mapStore.js             # Zustand store for map state (show-map.jsx + MapboxMobile.jsx only)
  useMapManager.js        # Location/map lifecycle hook (NOT a Provider) — permissions + location bootstrap, called in app/(auth)/_layout.jsx
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
- State lives in `context/mapStore.js` (Zustand, selector-based — no MapContext/Provider anymore). Only `app/(auth)/show-map.jsx` and `components/MapboxMobile.jsx` consume it.
- `context/useMapManager.js` is a hook (not a Provider) called once inside `app/(auth)/_layout.jsx`; owns AuthContext-dependent side effects (system permission prompt, initial location, consent-change reactions). It must run at the `(auth)` tree level — not only on the map screen — otherwise the OS location dialog only appears after opening the map.
- Location persistence: `fetchAndSaveLocation()` in `assets/utils/getUserLocation.js` is the single place that pulls GPS → reverse-geocodes via `/location-mobile/reverse-geocode` → writes to AsyncStorage. Used by `useMapManager` on bootstrap (only when nothing is saved yet) and by the "Moja lokalizacja" button in `show-map.jsx`.
- `mapStore.geolocationAccepted` mirrors `consents.locationAccepted` (set by `useMapManager`) so `MapboxMobile` can decide whether to render the user marker without subscribing to `AuthContext`.
- `mapStore` is the reactive source of truth for the user's location: `userLocation` (always a valid object, falls back to the centre of Poland), `hasUserLocation` (is it a _real_ location or the fallback?) and `locationResolved` (has `useMapManager` finished the permission + storage + GPS bootstrap?). Screens that need the location (`dashboard-home`, `find-event`) must subscribe to these instead of calling `getSavedLocation()` in their own effect — on a first launch the AsyncStorage write happens _after_ those effects run, so the direct read races and never retries.
- `mapRef`/`cameraRef` are plain imperative refs registered via `registerCameraRef`/`registerMapRef` (not reactive store state) so `flyTo()` can imperatively drive the camera without triggering re-renders.
- Cross-screen navigation: to center the map on a specific point before navigating to `show-map` from an unrelated screen (e.g. `events-managment/*`), call `useMapStore.getState().setPendingFlyTo({ coordinates: [lon, lat], zoom })` then navigate — no subscription needed in the calling screen. `show-map.jsx` consumes and clears `pendingFlyTo` once `isMapReady` is true.

### Navigation

- Expo Router 6 (file-based, `app/` directory)
- `(auth)/` group for protected routes
- Drawer navigation via `DrawerContext` + `DrawerModal`
- Deep links scheme: `boiskoplusmobile://`

### UI Scaling

- **DEPRECATED**: `assets/utils/scaleUI.UX.js` — too heavy (recomputes via `useMemo`/hook on every consumer). Being phased out.
- **Ongoing goal**: gradually migrate every screen/component from `scaleUI.UX.js` to the new `Theme/` module (`Theme/ScalableStyles.js` for scaling, `Theme/StyleConstants.js` for spacing/padding/margin/borderRadius/fontSize, `Theme/ColorsLight.js` + `Theme/ColorsDark.js` via `Theme/index.js` for colors).
- Do not add new `scaleUI.UX.js` imports — new/edited screens should pull from `Theme/` instead.

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

| Domain               | Router             |
| -------------------- | ------------------ |
| Auth (mobile)        | `/auth-mobile`     |
| Users                | `/users`           |
| Events               | `/events`          |
| Participation status | `/status`          |
| Chat                 | `/chat`            |
| Friendships          | `/friendship`      |
| Leaderboard / Stats  | `/user-stats`      |
| Notifications        | `/notifications`   |
| Location             | `/location-mobile` |
| Reports              | `/reports`         |

Socket.IO namespaces: `/chat`, `/notifications`

---

## Code Conventions

- JavaScript (no TypeScript)
- Functional components with hooks
- File-based routing via Expo Router (`app/` directory)
- Context providers wrapped in `app/_layout.jsx`
- API calls go through `customFetch` (never raw `fetch` or bare `axios`)
- Toast alerts via `toastify-react-native` (not Alert.alert for user-facing messages)
- Lottie animations for loading states (`assets/utils/spinner.json`, `typing.json`)
- UI scaling: `scaleUI.UX.js` is **deprecated** — migrate to `Theme/` (see UI Scaling section); do not use it in new code
- Debug logging via `assets/utils/debugLogger.js` (`dbg`, `logHttp`, etc.)
- `expo-secure-store` for sensitive data (JWT), `AsyncStorage` for non-sensitive persistence
