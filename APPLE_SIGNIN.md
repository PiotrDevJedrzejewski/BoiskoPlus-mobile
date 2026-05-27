# Sign in with Apple — Boisko+ Mobile

Pełna dokumentacja wdrożenia Apple Sign-In w kontekście istniejącej architektury (Google OAuth + Firebase + JWT backend).

---

## Co Apple zwraca (i czego NIE zwraca)

To jest kluczowa różnica względem Google, która wpływa na architekturę.

| Pole | Typ | Kiedy dostępne |
|------|-----|----------------|
| `identityToken` | JWT string | **Zawsze** — odpowiednik Google `idToken`, wysyłasz to do backendu |
| `authorizationCode` | string | **Zawsze** — jednorazowy kod (krótki TTL), opcjonalny |
| `user` | string | **Zawsze** — stabilny, unikalny ID użytkownika Apple (np. `001234.abc...`) |
| `email` | string \| null | **TYLKO PIERWSZE logowanie!** Potem `null`. Może być prywatnym aliasem (`xxx@privaterelay.appleid.com`) |
| `fullName.givenName` | string \| null | **TYLKO PIERWSZE logowanie!** Potem `null` |
| `fullName.familyName` | string \| null | **TYLKO PIERWSZE logowanie!** Potem `null` |
| `realUserStatus` | 0 / 1 / 2 | Zawsze. 2 = "likelyReal" (prawdziwy użytkownik) |
| `state` | string | Tylko jeśli podasz w żądaniu |

### ⚠️ Krytyczne: email i imię dostępne TYLKO RAZ
Apple przekazuje email i imię **wyłącznie podczas pierwszego logowania** (lub po wylogowaniu z konta Apple → Ustawienia → Apple ID → Hasło i bezpieczeństwo → Aplikacje). Przy każdym kolejnym wywołaniu `AppleAuthentication.signInAsync()` te pola będą `null`.

**Musisz zapisać je do AsyncStorage natychmiast po pierwszym logowaniu**, zanim trafią na backend.

---

## Czego potrzebujesz (wymagania zewnętrzne)

### 1. Apple Developer Account (WYMAGANE)
- Konto płatne: **99 USD / rok** — https://developer.apple.com/programs/
- Bez tego konta nie da się wdrożyć Apple Sign-In

### 2. App ID z włączoną capability
W [Apple Developer Portal](https://developer.apple.com/account/resources/identifiers/list):
- Identifiers → App IDs → `com.boiskoplusmobile.app`
- Włącz capability: **"Sign In with Apple"**
- Zapisz

### 3. Klucz prywatny do weryfikacji po stronie backendu
W Apple Developer Portal:
- Keys → "+" → zaznacz "Sign In with Apple" → Configure → wybierz App ID
- Pobierz plik `.p8` (np. `AuthKey_XXXXXXXXXX.p8`) — **pobrać można tylko raz!**
- Zapisz: **Key ID** (10-znakowy ciąg, np. `ABC1234567`)
- Zapisz: **Team ID** (10-znakowy, widoczny w górnym rogu portalu, np. `TEAM123456`)

### 4. Dane do konfiguracji backendu
```
APPLE_TEAM_ID=TEAM123456
APPLE_KEY_ID=ABC1234567
APPLE_CLIENT_ID=com.boiskoplusmobile.app   # Bundle identifier jako Client ID
APPLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----
```
Lub ścieżka do pliku `.p8`: `APPLE_PRIVATE_KEY_PATH=./AuthKey_ABC1234567.p8`

---

## TODO — Lista zadań do wdrożenia

### FRONTEND (BoiskoPlus-mobile)

- [ ] **Zainstaluj bibliotekę**
  ```bash
  npx expo install expo-apple-authentication
  ```

- [ ] **app.config.js** — włącz capability w sekcji `ios`:
  ```js
  ios: {
    // ... istniejące pola ...
    usesAppleSignIn: true,   // ← DODAJ TO
  }
  ```

- [ ] **Zapisz dane Apple przy pierwszym logowaniu** (patrz sekcja "Strategia persystencji")

- [ ] **login.jsx** — dodaj przycisk Apple Sign-In (tylko iOS):
  ```js
  import * as AppleAuthentication from 'expo-apple-authentication'
  import { Platform } from 'react-native'
  // Przycisk renderuj tylko na iOS:
  // {Platform.OS === 'ios' && <AppleAuthentication.AppleAuthenticationButton ... />}
  ```

- [ ] **register.jsx** — to samo co w login.jsx (w sekcji alternatywnych opcji)

- [ ] **AuthContext.jsx** — dodaj funkcję `loginWithApple(identityToken, user, email, name, surname)`

- [ ] **register-with-oauth.jsx** — obsłuży już Apple automatycznie (ta sama strona co Google), ale sprawdź czy `email` może być prywatnym aliasem

- [ ] **EAS Build** — dla development build przebuduj natywną aplikację po dodaniu pluginu:
  ```bash
  eas build --profile development --platform ios
  ```

---

### BACKEND (BoiskoPlus/server)

- [x] **Zainstaluj bibliotekę weryfikacji Apple token** — `apple-signin-auth` zainstalowany

- [ ] **Dodaj zmienne środowiskowe** do `.env`:
  ```
  APPLE_TEAM_ID=
  APPLE_KEY_ID=
  APPLE_CLIENT_ID=com.boiskoplusmobile.app
  APPLE_PRIVATE_KEY=
  ```

- [x] **authMobileController.js** — dodano `loginAppleMobile` i `registerAppleMobile`

- [x] **authMobileRouter.js** — dodano routes:
  - `POST /api/v1/auth-mobile/login-apple`
  - `POST /api/v1/auth-mobile/register-apple`

- [x] **validationMW.js** — dodano `validateAppleLogin` i `validateAppleRegister`

- [x] **userModel.js** — dodano pole `appleUserId: { type: String, unique: true, sparse: true }`

---

## Jak wygląda flow Apple Sign-In

```
[Użytkownik klika "Sign in with Apple"]
        ↓
AppleAuthentication.signInAsync() — system dialog iOS
        ↓
Apple zwraca: { identityToken, user, email*, fullName* }
(* tylko przy pierwszym logowaniu)
        ↓
[Frontend] Zapisz email + imię do AsyncStorage (jeśli nie null)
        ↓
[Frontend] POST /api/v1/auth-mobile/login-apple
  { identityToken, appleUserId: user, email, name, surname }
        ↓
[Backend] Weryfikuje identityToken przez Apple JWKS (RS256)
        ↓
  ┌─ Użytkownik istnieje? ──YES──→ Zwróć JWT (login)
  └─ NIE
        ↓
  Zwróć błąd "complete registration" (jak Google)
        ↓
[Frontend] Router → /register-with-oauth z params:
  { email, name, surname, appleIdToken: identityToken, appleUserId: user }
        ↓
Użytkownik uzupełnia: nick + data urodzenia
        ↓
POST /api/v1/auth-mobile/complete-oauth
  (rozszerzyć o pole appleIdToken / appleUserId)
        ↓
Backend tworzy użytkownika, zwraca JWT
```

---

## Strategia persystencji email/imię (krytyczne)

```js
// W handleAppleSignIn — przed wysłaniem do backendu:
import AsyncStorage from '@react-native-async-storage/async-storage'

const APPLE_USER_KEY = 'apple_user_cache'

const handleAppleSignIn = async () => {
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  })

  const { identityToken, user: appleUserId, email, fullName } = credential

  // Spróbuj załadować z cache (dla kolejnych logowań)
  let cachedData = {}
  try {
    const stored = await AsyncStorage.getItem(APPLE_USER_KEY + appleUserId)
    if (stored) cachedData = JSON.parse(stored)
  } catch {}

  // Jeśli Apple zwrócił dane — zapisz/zaktualizuj cache
  const resolvedEmail = email || cachedData.email || null
  const resolvedName = fullName?.givenName || cachedData.name || ''
  const resolvedSurname = fullName?.familyName || cachedData.surname || ''

  if (email || fullName?.givenName) {
    await AsyncStorage.setItem(APPLE_USER_KEY + appleUserId, JSON.stringify({
      email: resolvedEmail,
      name: resolvedName,
      surname: resolvedSurname,
    }))
  }

  // Dalej: wyślij do backendu...
}
```

---

## Różnice względem istniejącego Google flow

| | Google | Apple |
|---|---|---|
| Biblioteka | `@react-native-google-signin/google-signin` | `expo-apple-authentication` |
| Token do backendu | `idToken` (Google JWT) | `identityToken` (Apple JWT) |
| Weryfikacja backendu | `google-auth-library` `OAuth2Client` | `apple-signin-auth` lub JWKS ręcznie |
| Email przy każdym logowaniu | ✅ Zawsze | ❌ Tylko pierwsze logowanie |
| Imię przy każdym logowaniu | ✅ Zawsze | ❌ Tylko pierwsze logowanie |
| Platforma | Android + iOS | **Tylko iOS** |
| Wymaga Firebase? | Tak (w obecnej implementacji) | **Nie** — można bez Firebase |
| Wymaga Apple Developer konta | Nie | **Tak (99 USD/rok)** |
| Prywatny email | Nie | Możliwy (privaterelay.appleid.com) |
| Identyfikator użytkownika | email | `appleUserId` (opaque string) — email może być ukryty |

---

## Co zrobić z prywatnym emailem Apple

Gdy użytkownik wybierze "Hide My Email" w dialogu Apple, otrzymasz email w formacie:
`abc123def456@privaterelay.appleid.com`

Jest to działający adres (Apple przekazuje wiadomości), ale:
- Nie możesz na nim polegać jako unikalnym identyfikatorze między sesjami
- **Użyj `appleUserId` jako głównego identyfikatora** w bazie danych

Zalecane pole w userModel:
```js
appleUserId: { type: String, unique: true, sparse: true }
```

Backend powinien szukać użytkownika najpierw po `appleUserId`, a dopiero potem po `email`.

---

## Weryfikacja identityToken na backendzie

```js
// npm install apple-signin-auth
import appleSignin from 'apple-signin-auth'

const verifyAppleToken = async (identityToken) => {
  const applePublicKey = await appleSignin.getApplePublicKey()
  const jwtClaims = appleSignin.verifyIdToken(identityToken, {
    audience: process.env.APPLE_CLIENT_ID,  // com.boiskoplusmobile.app
    ignoreExpiration: false,
  })
  return jwtClaims // { sub: appleUserId, email, email_verified, ... }
}
```

`jwtClaims.sub` = stabilny Apple User ID (to samo co `user` z frontendu)

---

## Ograniczenia `expo-apple-authentication`

- **Działa TYLKO na iOS 13+**
- **Nie działa w Expo Go** — wymagany development build lub production build
- Nie działa na Androidzie ani webbie
- Przed renderowaniem przycisku sprawdzaj dostępność:
  ```js
  const isAvailable = await AppleAuthentication.isAvailableAsync()
  ```
- Przycisk musi spełniać [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/sign-in-with-apple) — używaj gotowego komponentu `AppleAuthenticationButton`

---

## Linki

- [expo-apple-authentication docs](https://docs.expo.dev/versions/latest/sdk/apple-authentication/)
- [Apple Developer: Sign In with Apple](https://developer.apple.com/sign-in-with-apple/)
- [apple-signin-auth npm](https://www.npmjs.com/package/apple-signin-auth)
- [Apple Sign-In button guidelines](https://developer.apple.com/design/human-interface-guidelines/sign-in-with-apple)
