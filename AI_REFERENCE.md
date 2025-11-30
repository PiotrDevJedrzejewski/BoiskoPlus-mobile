# 🤖 BoiskoPlus - React Native Migration - AI Reference Document

> **Ten dokument służy jako kontekst dla AI przy konwersji projektu React Web → React Native (Expo)**

---

## 📋 INFORMACJE O PROJEKCIE

### Nazwa Projektu

- **Oryginalna:** BoiskoPlus (Web - React + Vite)
- **Docelowa:** BoiskoPlus Mobile (React Native + Expo)
- **Repozytorium:** FootballEventFinder

### Cel Aplikacji

Aplikacja do organizowania i znajdowania wydarzeń sportowych (głównie piłka nożna, ale też inne sporty). Użytkownicy mogą:

- Tworzyć wydarzenia sportowe
- Dołączać do wydarzeń innych użytkowników
- Komunikować się przez chat grupowy/prywatny
- Przeglądać mapę z wydarzeniami
- Śledzić statystyki i ranking

### Stack Technologiczny

#### Backend (BEZ ZMIAN)

- **Runtime:** Node.js
- **Framework:** Express.js 5.x
- **Baza danych:** MongoDB + Mongoose
- **Auth:** JWT + HttpOnly Cookies
- **Real-time:** Socket.IO
- **Email:** Mailgun
- **Security:** Helmet, Rate Limiting, XSS Clean

#### Frontend Web (AKTUALNY)

- **Framework:** React 19
- **Bundler:** Vite 7
- **Routing:** React Router 7
- **HTTP:** Axios
- **Real-time:** Socket.IO Client
- **Mapy:** Mapbox GL (react-map-gl)
- **Stylowanie:** SCSS
- **Auth External:** Firebase (Google OAuth)
- **Obrazy:** react-easy-crop

#### Frontend Mobile (DOCELOWY)

- **Framework:** React Native + Expo SDK 52+
- **Nawigacja:** Expo Router 4 (file-based routing)
- **HTTP:** Axios
- **Real-time:** Socket.IO Client
- **Mapy:** @rnmapbox/maps + expo-location
- **Stylowanie:** StyleSheet API
- **Auth External:** Firebase + expo-auth-session
- **Obrazy:** expo-image-picker

---

## 🎨 DESIGN SYSTEM

### Kolory (z \_base.scss)

```javascript
// src/styles/colors.js
export const COLORS = {
  primary: '#EDF9E5', // Jasny zielony (tekst)
  secondary: '#FFCF00', // Żółty (akcenty, CTA)
  third: '#127340', // Ciemny zielony
  background: '#003B22', // Główne tło
  backgroundSecondary: '#00472A', // Wtórne tło

  // Dodatkowe
  white: '#FFFFFF',
  black: '#000000',
  error: '#FF4444',
  success: '#4CAF50',
  warning: '#FFC107',
  gray: '#888888',
  grayLight: '#CCCCCC',
  grayDark: '#444444',
}
```

### Typografia

```javascript
// src/styles/fonts.js
export const FONTS = {
  primary: 'Montserrat',
  secondary: 'Lato',
  custom: 'ObjectFont', // Custom font z /assets/font/object.ttf
};

---

## 📁 STRUKTURA PROJEKTU

### Obecna Struktura (Web)
```

client/
├── src/
│ ├── App.jsx # Główny komponent z routingiem
│ ├── main.jsx # Entry point
│ ├── assets/
│ │ ├── images/
│ │ ├── sounds/
│ │ └── utils/
│ │ ├── customFetch.js # Axios instance
│ │ ├── firebase.js # Firebase config
│ │ ├── getUserLocation.js # Reverse geocoding
│ │ ├── citySearchUtils.js
│ │ └── safeLocalStorage.js
│ ├── components/
│ │ ├── Button.jsx
│ │ ├── Navbar.jsx
│ │ ├── Sidebar.jsx
│ │ ├── Mapbox.jsx
│ │ ├── EventList.jsx
│ │ ├── FindEventList.jsx
│ │ ├── ChatRoomList.jsx
│ │ ├── PlayerCard.jsx
│ │ ├── FormEvent.jsx
│ │ └── windowPopups/
│ ├── context/
│ │ ├── authContext.jsx
│ │ ├── socketIoContext.jsx
│ │ ├── notificationContext.jsx
│ │ └── dashboardContext.jsx
│ ├── pages/
│ │ ├── Login.jsx
│ │ ├── Register.jsx
│ │ ├── Home.jsx
│ │ └── dashboard/
│ │ ├── DashboardLayout.jsx
│ │ ├── DashboardHome.jsx
│ │ ├── AddEvent.jsx
│ │ ├── FindEvent.jsx
│ │ ├── MyEvents.jsx
│ │ ├── ChatRoom.jsx
│ │ ├── Profile.jsx
│ │ └── ...
│ └── style/
│ ├── main.scss
│ ├── \_base.scss
│ └── [inne pliki SCSS]

```

### Docelowa Struktura (React Native + Expo Router)
```

BoiskoPlus-mobile/
├── app/ # Expo Router - file-based routing
│ ├── \_layout.jsx # Root layout (providers, fonts)
│ ├── index.jsx # Landing/Welcome screen (/)
│ ├── login.jsx # Login screen (/login)
│ ├── register.jsx # Register screen (/register)
│ ├── register-oauth.jsx # OAuth register (/register-oauth)
│ ├── forgot-password.jsx # Forgot password (/forgot-password)
│ ├── new-password/[token].jsx # Reset password (/new-password/:token)
│ ├── rules.jsx # Rules screen (/rules)
│ ├── +not-found.jsx # 404 screen
│ └── (dashboard)/ # Protected group - wymaga auth
│ ├── \_layout.jsx # Dashboard layout (tabs + Stack.Protected)
│ ├── (tabs)/ # Bottom tab navigator
│ │ ├── \_layout.jsx # Tabs configuration
│ │ ├── index.jsx # Home tab (dashboard home)
│ │ ├── find-event.jsx # Find events tab (z mapą)
│ │ ├── my-events.jsx # My events tab
│ │ ├── chat.jsx # Chat list tab
│ │ └── profile.jsx # Profile tab
│ ├── add-event.jsx # Add event screen
│ ├── edit-event/[id].jsx # Edit event screen
│ ├── event/[id].jsx # Event details screen
│ ├── chat/[roomId].jsx # Chat room screen
│ ├── profile-users/[id].jsx # Other user profile
│ ├── profile-edit.jsx # Edit profile screen
│ ├── ranking.jsx # Ranking screen
│ ├── settings.jsx # Settings screen
│ ├── premium.jsx # Premium screen
│ ├── report.jsx # Report screen
│ └── simple-map.jsx # Simple map screen
├── src/
│ ├── components/
│ │ ├── common/
│ │ │ ├── Button.jsx
│ │ │ ├── Card.jsx
│ │ │ ├── Avatar.jsx
│ │ │ ├── Input.jsx
│ │ │ ├── Loading.jsx
│ │ │ └── Header.jsx
│ │ ├── events/
│ │ │ ├── EventList.jsx
│ │ │ ├── EventCard.jsx
│ │ │ ├── EventForm.jsx
│ │ │ ├── EventMarker.jsx
│ │ │ └── UserList.jsx
│ │ ├── chat/
│ │ │ ├── ChatList.jsx
│ │ │ ├── ChatMessage.jsx
│ │ │ └── ChatInput.jsx
│ │ ├── map/
│ │ │ └── MapboxView.jsx # Mapbox component
│ │ └── modals/
│ │ ├── ConfirmModal.jsx
│ │ ├── OptionsModal.jsx
│ │ └── InfoModal.jsx
│ ├── context/
│ │ ├── AuthContext.jsx
│ │ ├── SocketContext.jsx
│ │ ├── NotificationContext.jsx
│ │ └── DashboardContext.jsx
│ ├── services/
│ │ ├── api.js # Axios instance
│ │ ├── authService.js
│ │ ├── eventService.js
│ │ ├── chatService.js
│ │ ├── userService.js
│ │ └── locationService.js
│ ├── hooks/
│ │ ├── useAuth.js
│ │ ├── useLocation.js
│ │ ├── useNotifications.js
│ │ ├── useSocket.js
│ │ └── useEvents.js
│ ├── utils/
│ │ ├── storage.js # AsyncStorage/SecureStore wrapper
│ │ ├── constants.js
│ │ ├── validation.js
│ │ ├── helpers.js
│ │ └── permissions.js
│ └── styles/
│ ├── colors.js
│ ├── fonts.js
│ ├── spacing.js
│ └── globalStyles.js
├── assets/
│ ├── images/
│ ├── sounds/
│ └── fonts/
│ └── object.ttf
├── app.json # Expo config
├── babel.config.js
├── jsconfig.json # JavaScript config (zamiast tsconfig)
└── package.json

````

---

## 🔄 MAPOWANIE KOMPONENTÓW

### Nawigacja (React Router → Expo Router)

```javascript
// WEB (App.jsx)
<Routes>
  <Route path='/' element={<Home />} />
  <Route path='/login' element={<Login />} />
  <Route path='/dashboard' element={<DashboardLayout />}>
    <Route index element={<DashboardHome />} />
    <Route path='my-events' element={<MyEvents />} />
  </Route>
</Routes>

// MOBILE - Expo Router (file-based routing)

// app/_layout.jsx - Root Layout
import { Stack } from 'expo-router';
import { AuthProvider } from '@/context/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="(dashboard)" />
      </Stack>
    </AuthProvider>
  );
}

// app/(dashboard)/_layout.jsx - Protected Dashboard Layout
import { Stack, Redirect } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';

export default function DashboardLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;

  return (
    <Stack.Protected guard={!!user} redirect="/login">
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="add-event" options={{ presentation: 'modal' }} />
        <Stack.Screen name="event/[id]" />
        <Stack.Screen name="chat/[roomId]" />
      </Stack>
    </Stack.Protected>
  );
}

// app/(dashboard)/(tabs)/_layout.jsx - Bottom Tabs
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/styles/colors';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.secondary,
        tabBarInactiveTintColor: COLORS.gray,
        tabBarStyle: { backgroundColor: COLORS.backgroundSecondary },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="find-event"
        options={{
          title: 'Szukaj',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="my-events"
        options={{
          title: 'Moje",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

// Nawigacja w kodzie:
import { router } from 'expo-router';

// Przejście do ekranu
router.push('/login');
router.push('/dashboard/event/123');
router.replace('/dashboard');  // bez możliwości cofnięcia
router.back();  // cofnięcie

// Link component
import { Link } from 'expo-router';
<Link href="/dashboard/add-event">Dodaj event</Link>
````

### Storage (localStorage → AsyncStorage/SecureStore)

```javascript
// WEB
localStorage.setItem('key', value)
const value = localStorage.getItem('key')

// MOBILE - Zwykłe dane
import AsyncStorage from '@react-native-async-storage/async-storage'
await AsyncStorage.setItem('key', JSON.stringify(value))
const value = JSON.parse(await AsyncStorage.getItem('key'))

// MOBILE - Wrażliwe dane (tokeny)
import * as SecureStore from 'expo-secure-store'
await SecureStore.setItemAsync('token', value)
const token = await SecureStore.getItemAsync('token')
```

### Mapy (Mapbox Web → Mapbox React Native)

```javascript
// WEB (Mapbox.jsx)
import Map, { Marker } from 'react-map-gl'

;<Map
  mapboxAccessToken={token}
  initialViewState={{ longitude, latitude, zoom: 12 }}
  mapStyle='mapbox://styles/mapbox/dark-v11'
>
  <Marker longitude={lng} latitude={lat} />
</Map>

// MOBILE (MapboxView.jsx) - @rnmapbox/maps
import Mapbox, {
  MapView,
  Camera,
  PointAnnotation,
  MarkerView,
} from '@rnmapbox/maps'

// Inicjalizacja w app/_layout.jsx
Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN)

// Komponent mapy
export default function MapboxView({ events, center, onMarkerPress }) {
  return (
    <MapView
      style={styles.map}
      styleURL='mapbox://styles/mapbox/dark-v11'
      logoEnabled={false}
      attributionEnabled={false}
    >
      <Camera
        zoomLevel={12}
        centerCoordinate={[center.longitude, center.latitude]}
        animationMode='flyTo'
        animationDuration={1000}
      />

      {/* Markery eventów */}
      {events.map((event) => (
        <MarkerView
          key={event._id}
          coordinate={[
            event.geolocation.coordinates[0], // longitude
            event.geolocation.coordinates[1], // latitude
          ]}
        >
          <TouchableOpacity onPress={() => onMarkerPress(event)}>
            <View style={styles.marker}>
              <GameTypeIcon type={event.gameType} />
            </View>
          </TouchableOpacity>
        </MarkerView>
      ))}

      {/* Lub PointAnnotation dla customowych markerów */}
      <PointAnnotation id='user-location' coordinate={[userLng, userLat]}>
        <View style={styles.userMarker} />
      </PointAnnotation>
    </MapView>
  )
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  marker: {
    backgroundColor: COLORS.secondary,
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  userMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    borderWidth: 3,
    borderColor: COLORS.white,
  },
})
```

### Konfiguracja Mapbox w app.json

```json
{
  "expo": {
    "plugins": [
      [
        "@rnmapbox/maps",
        {
          "RNMapboxMapsDownloadToken": "sk.xxx...",
          "RNMapboxMapsVersion": "11.0.0"
        }
      ]
    ]
  }
}
```

### Formularze

```javascript
// WEB
<input type="text" value={value} onChange={(e) => setValue(e.target.value)} />
<button onClick={handleSubmit}>Submit</button>

// MOBILE
import { TextInput, TouchableOpacity, Text } from 'react-native';

<TextInput
  value={value}
  onChangeText={setValue}
  style={styles.input}
/>
<TouchableOpacity onPress={handleSubmit} style={styles.button}>
  <Text style={styles.buttonText}>Submit</Text>
</TouchableOpacity>
```

### Listy (map → FlatList)

```javascript
// WEB
{
  events.map((event) => <EventCard key={event._id} event={event} />)
}

// MOBILE
import { FlatList } from 'react-native'
;<FlatList
  data={events}
  keyExtractor={(item) => item._id}
  renderItem={({ item }) => <EventCard event={item} />}
  ListEmptyComponent={<EmptyState />}
  refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} />}
/>
```

### Modale (CSS modal → React Native Modal)

```javascript
// WEB (WindowPopUp.jsx)
;<div className={`modal ${isOpen ? 'open' : ''}`}>
  <div className='modal-content'>...</div>
</div>

// MOBILE
import { Modal, View, TouchableOpacity } from 'react-native'
;<Modal
  visible={isOpen}
  transparent
  animationType='fade'
  onRequestClose={onClose}
>
  <TouchableOpacity style={styles.overlay} onPress={onClose}>
    <View style={styles.modalContent}>{/* content */}</View>
  </TouchableOpacity>
</Modal>
```

---

## 🌐 API ENDPOINTS

### Base URL

```javascript
const BASE_URL = 'https://your-server.com/api/v1'
// lub dla dev: 'http://localhost:3000/api/v1'
```

### Auth Endpoints

| Method | Endpoint                      | Opis                    |
| ------ | ----------------------------- | ----------------------- |
| POST   | `/auth/register`              | Rejestracja             |
| POST   | `/auth/login`                 | Logowanie               |
| POST   | `/auth/logout`                | Wylogowanie             |
| POST   | `/auth/forgot-password`       | Resetowanie hasła       |
| POST   | `/auth/reset-password/:token` | Ustawienie nowego hasła |
| POST   | `/auth/google-login`          | Logowanie przez Google  |
| GET    | `/auth/verify-email/:token`   | Weryfikacja email       |

### User Endpoints

| Method | Endpoint               | Opis                       |
| ------ | ---------------------- | -------------------------- |
| GET    | `/users/current-user`  | Pobierz zalogowanego usera |
| PATCH  | `/users/update-user`   | Aktualizuj profil          |
| PATCH  | `/users/update-avatar` | Aktualizuj avatar          |

### Event Endpoints

| Method | Endpoint                     | Opis                  |
| ------ | ---------------------------- | --------------------- |
| GET    | `/football-events`           | Lista eventów         |
| GET    | `/football-events/:id`       | Szczegóły eventu      |
| POST   | `/football-events`           | Utwórz event          |
| PATCH  | `/football-events/:id`       | Aktualizuj event      |
| DELETE | `/football-events/:id`       | Usuń event            |
| POST   | `/football-events/:id/join`  | Dołącz do eventu      |
| POST   | `/football-events/:id/leave` | Opuść event           |
| GET    | `/football-events/search`    | Wyszukaj eventy (geo) |

### Chat Endpoints

| Method | Endpoint                       | Opis                    |
| ------ | ------------------------------ | ----------------------- |
| GET    | `/chat/rooms`                  | Lista pokojów           |
| GET    | `/chat/rooms/:roomId/messages` | Wiadomości pokoju       |
| POST   | `/chat/rooms/:roomId/messages` | Wyślij wiadomość        |
| POST   | `/chat/mark-as-read`           | Oznacz jako przeczytane |

### User Stats Endpoints

| Method | Endpoint                   | Opis                    |
| ------ | -------------------------- | ----------------------- |
| GET    | `/user-stats/current`      | Statystyki zalogowanego |
| GET    | `/user-stats/:userId`      | Statystyki usera        |
| GET    | `/user-stats/ranking`      | Ranking                 |
| POST   | `/user-stats/:userId/like` | Polub usera             |

### Notification Endpoints

| Method | Endpoint                     | Opis                   |
| ------ | ---------------------------- | ---------------------- |
| GET    | `/notifications/preferences` | Preferencje            |
| PATCH  | `/notifications/preferences` | Aktualizuj preferencje |
| GET    | `/notifications/unread`      | Nieprzeczytane         |

### Location Endpoints

| Method | Endpoint            | Opis                         |
| ------ | ------------------- | ---------------------------- |
| GET    | `/location/decrypt` | Pobierz zapisaną lokalizację |
| POST   | `/location/encrypt` | Zapisz lokalizację           |

---

## 🔌 SOCKET.IO EVENTS

### Client → Server

| Event         | Payload                         | Opis                    |
| ------------- | ------------------------------- | ----------------------- |
| `joinRoom`    | `roomId`                        | Dołącz do pokoju        |
| `leaveRoom`   | `roomId`                        | Opuść pokój             |
| `sendMessage` | `{ roomId, message, senderId }` | Wyślij wiadomość        |
| `markAsRead`  | `{ roomId, userId }`            | Oznacz jako przeczytane |

### Server → Client

| Event               | Payload                                  | Opis                    |
| ------------------- | ---------------------------------------- | ----------------------- |
| `receiveMessage`    | `{ roomId, message, sender, timestamp }` | Nowa wiadomość          |
| `userJoined`        | `{ roomId, userId }`                     | User dołączył           |
| `userLeft`          | `{ roomId, userId }`                     | User opuścił            |
| `eventNotification` | `{ eventId, type, message }`             | Powiadomienie o evencie |
| `unreadCountUpdate` | `{ roomId, count }`                      | Update nieprzeczytanych |

---

## 📱 NATIVE FEATURES IMPLEMENTATION

### Geolokalizacja (expo-location)

```javascript
import * as Location from 'expo-location'

const getLocation = async () => {
  const { status } = await Location.requestForegroundPermissionsAsync()
  if (status !== 'granted') {
    throw new Error('Permission denied')
  }

  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  })

  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
  }
}

// Reverse geocoding
const reverseGeocode = async (latitude, longitude) => {
  const result = await Location.reverseGeocodeAsync({ latitude, longitude })
  return result[0] // { city, region, country, ... }
}
```

### Notyfikacje Push (expo-notifications)

```javascript
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'

// Konfiguracja
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

// Rejestracja tokenu
const registerForPushNotifications = async () => {
  if (!Device.isDevice) return null

  const { status } = await Notifications.requestPermissionsAsync()
  if (status !== 'granted') return null

  const token = await Notifications.getExpoPushTokenAsync()
  return token.data
}

// Lokalna notyfikacja
const sendLocalNotification = async (title, body) => {
  await Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: null, // natychmiast
  })
}
```

### Image Picker (expo-image-picker)

```javascript
import * as ImagePicker from 'expo-image-picker'
import * as ImageManipulator from 'expo-image-manipulator'

const pickImage = async () => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
  if (status !== 'granted') return null

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  })

  if (result.canceled) return null

  // Resize jeśli potrzeba
  const manipulated = await ImageManipulator.manipulateAsync(
    result.assets[0].uri,
    [{ resize: { width: 500 } }],
    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
  )

  return manipulated.uri
}
```

### Dźwięki (expo-av)

```javascript
import { Audio } from 'expo-av'

let soundObject = null

const playSound = async (soundFile) => {
  if (soundObject) await soundObject.unloadAsync()

  const { sound } = await Audio.Sound.createAsync(
    require('../assets/sounds/notification.mp3')
  )
  soundObject = sound
  await sound.playAsync()
}

const stopSound = async () => {
  if (soundObject) {
    await soundObject.stopAsync()
    await soundObject.unloadAsync()
    soundObject = null
  }
}
```

---

## 🗃️ MODELE DANYCH (MongoDB)

### User Model

```javascript
{
  _id: ObjectId,
  nickName: String,       // unique, 3-20 chars
  email: String,          // unique, lowercase
  password: String,       // hashed
  role: 'user' | 'admin',
  isActive: 'unauthorized' | 'free' | 'premium' | 'banned-temp' | 'banned-perm',
  name: String,
  surname: String,
  phoneNumber: String,
  avatarUrl: String,
  age: Date,
  emailVerified: Boolean,
  verificationToken: String,
  passwordResetToken: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Event Model

```javascript
{
  _id: ObjectId,
  eventName: String,
  gameType: String,       // football, volleyball, basketball, etc.
  eventDescription: String,
  address: {
    city: String,
    street: String,
    addressNumber: String,
    postalCode: String
  },
  addressString: String,
  startDate: String,      // ISO date
  startHour: String,      // HH:mm
  startDateTime: Date,
  endDateTime: Date,
  duration: Number,       // minutes
  fieldType: 'field' | 'hall' | 'other',
  level: 'beginner' | 'intermediate' | 'advanced' | 'professional' | 'other',
  playerCount: Number,
  price: Number,
  paymentMethod: String,
  phoneNumber: String,
  isParticipating: Boolean,
  isPrivate: Boolean,
  isRecurring: Boolean,
  eventStatus: 'upcoming' | 'live' | 'completed' | 'cancelled',
  geolocation: {
    type: 'Point',
    coordinates: [Number, Number]  // [longitude, latitude]
  },
  createdBy: ObjectId,    // ref: User
  createdAt: Date,
  updatedAt: Date
}
```

### ChatRoom Model

```javascript
{
  _id: ObjectId,
  participants: [ObjectId],  // ref: User
  roomId: String,
  roomType: 'private' | 'group',
  eventId: ObjectId,      // ref: Event (required for group)
  lastActivity: Date,
  createdAt: Date
}
```

### ChatMessage Model

```javascript
{
  _id: ObjectId,
  roomId: String,
  sender: ObjectId,       // ref: User
  message: String,        // max 1000 chars
  messageType: 'text' | 'image' | 'file',
  readBy: [{
    userId: ObjectId,
    readAt: Date
  }],
  createdAt: Date
}
```

### UserStats Model

```javascript
{
  _id: ObjectId,
  userID: ObjectId,       // ref: User
  gamesPlayed: Number,
  eventsOrganized: Number,
  totalLikes: Number,
  likedBy: [{
    userID: ObjectId,
    likedAt: Date
  }],
  points: Number,
  createdAt: Date
}
```

---

## ⚙️ KONFIGURACJA

### Zmienne Środowiskowe (.env)

```bash
# Server
EXPO_PUBLIC_SERVER_URL=https://your-server.com/api/v1
EXPO_PUBLIC_SERVER_URL_SOCKET=https://your-server.com

# Firebase
EXPO_PUBLIC_FIREBASE_API_KEY=xxx
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=xxx.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=xxx
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=xxx.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxx
EXPO_PUBLIC_FIREBASE_APP_ID=xxx

# Mapbox
EXPO_PUBLIC_MAPBOX_TOKEN=pk.xxx...  # Public token dla mapy
MAPBOX_DOWNLOAD_TOKEN=sk.xxx...      # Secret token dla buildu (nie EXPO_PUBLIC!)
```

### app.json (Expo z Expo Router + Mapbox)

```json
{
  "expo": {
    "name": "BoiskoPlus",
    "slug": "boiskoplus",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "dark",
    "scheme": "boiskoplus",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#003B22"
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.boiskoplus.app",
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "Potrzebujemy dostępu do lokalizacji, aby pokazać wydarzenia w Twojej okolicy.",
        "NSCameraUsageDescription": "Potrzebujemy dostępu do aparatu, aby móc robić zdjęcia profilowe.",
        "NSPhotoLibraryUsageDescription": "Potrzebujemy dostępu do galerii, aby móc wybrać zdjęcie profilowe."
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#003B22"
      },
      "package": "com.boiskoplus.app",
      "permissions": [
        "ACCESS_COARSE_LOCATION",
        "ACCESS_FINE_LOCATION",
        "CAMERA",
        "READ_EXTERNAL_STORAGE"
      ]
    },
    "plugins": [
      "expo-router",
      "expo-font",
      "expo-location",
      "expo-image-picker",
      "expo-notifications",
      "expo-secure-store",
      [
        "@rnmapbox/maps",
        {
          "RNMapboxMapsDownloadToken": "YOUR_SECRET_DOWNLOAD_TOKEN"
        }
      ]
    ]
  }
}
```

---

## 🎯 TYPY GIER (CONSTANTS)

```javascript
export const GAME_TYPES = [
  'football',
  'volleyball',
  'basketball',
  'handball',
  'rugby',
  'hockey',
  'tennis',
  'badminton',
  'table tennis',
  'bowling',
  'cards',
  'board games',
  'other',
]

export const EVENT_STATUS = {
  UPCOMING: 'upcoming',
  LIVE: 'live',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
}

export const EVENT_LEVELS = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
  PROFESSIONAL: 'professional',
  OTHER: 'other',
}

export const FIELD_TYPES = {
  FIELD: 'field',
  HALL: 'hall',
  OTHER: 'other',
}

export const USER_STATUS = {
  UNAUTHORIZED: 'unauthorized',
  FREE: 'free',
  PREMIUM: 'premium',
  BANNED_TEMP: 'banned-temp',
  BANNED_PERM: 'banned-perm',
}
```

---

## 📝 UWAGI DLA AI

### Kluczowe Różnice Web vs Mobile

1. **Cookies → Tokeny w SecureStore** - Mobile nie obsługuje httpOnly cookies, używaj Authorization header
2. **CSS/SCSS → StyleSheet** - Brak kaskadowości, brak pseudo-klas, inline styles
3. **onClick → onPress** - TouchableOpacity, Pressable
4. **input → TextInput** - Inne propsy (onChangeText zamiast onChange)
5. **div → View** - Brak semantycznych tagów
6. **img → Image** - Wymaga width/height lub flex
7. **scrollable div → ScrollView/FlatList** - FlatList dla długich list
8. **React Router → Expo Router** - File-based routing w folderze /app

### Expo Router - Kluczowe Koncepty

1. **File-based routing** - struktura plików = struktura URL
2. **Groups `(name)`** - folder w nawiasach nie wpływa na URL
3. **Dynamic routes `[param]`** - dynamiczne segmenty URL
4. **Layout `_layout.jsx`** - shared layout dla route'ów
5. **Stack.Protected guard** - ochrona tras wymagających auth
6. **router.push/replace/back** - nawigacja programatyczna
7. **Link component** - nawigacja deklaratywna
8. **useLocalSearchParams** - dostęp do parametrów URL

### Mapbox - Kluczowe Koncepty

1. **Inicjalizacja tokenu** - `Mapbox.setAccessToken()` w \_layout.jsx
2. **Camera** - kontrola widoku mapy (zoom, center, animation)
3. **MarkerView** - markery z custom React components
4. **PointAnnotation** - proste markery
5. **ShapeSource + SymbolLayer** - dla wielu markerów (wydajność)
6. **styleURL** - style mapy (dark-v11, streets-v12, etc.)

### Dobre Praktyki

1. Używaj FlatList zamiast map() dla list > 10 elementów
2. Memoizuj komponenty z React.memo() i useMemo()
3. Używaj StyleSheet.create() zamiast inline styles
4. Obsługuj bezpieczne obszary (SafeAreaView)
5. Używaj Platform.select() dla różnic iOS/Android
6. Testuj na fizycznych urządzeniach
7. Konfiguruj jsconfig.json dla aliasów ścieżek (@/)
8. Dla Mapbox: używaj ShapeSource dla >50 markerów

### Server Changes Required

1. Dodaj origin dla mobile w CORS (lub pozwól na `!origin`)
2. Rozważ alternatywną autentykację (token w header zamiast cookie)
3. Upewnij się, że wszystkie odpowiedzi są JSON

---

## 📚 BIBLIOTEKI DO ZAINSTALOWANIA

```bash
# Inicjalizacja projektu z Expo Router
npx create-expo-app@latest BoiskoPlus-mobile --template tabs

# Core & Router
npx expo install expo-router expo-font expo-constants expo-linking expo-status-bar

# Expo Router wymaga tych zależności
npx expo install react-native-screens react-native-safe-area-context react-native-gesture-handler react-native-reanimated

# UI
npx expo install expo-linear-gradient react-native-svg @expo/vector-icons

# Mapbox (zamiast Google Maps)
npm install @rnmapbox/maps
npx expo install expo-location

# Forms
npm install formik yup

# HTTP & State
npm install axios @tanstack/react-query

# Real-time
npm install socket.io-client

# Storage
npx expo install expo-secure-store @react-native-async-storage/async-storage

# Auth
npm install firebase
npx expo install expo-auth-session expo-web-browser expo-crypto

# Media
npx expo install expo-image-picker expo-file-system expo-image-manipulator

# Notifications
npx expo install expo-notifications expo-device

# Audio
npx expo install expo-av

# Other
npx expo install expo-haptics expo-splash-screen
```

### Package.json scripts (Expo Router)

```json
{
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "lint": "eslint .",
    "test": "jest"
  },
  "main": "expo-router/entry"
}
```

---

**Ostatnia aktualizacja:** 2025-11-28
**Wersja:** 1.0
