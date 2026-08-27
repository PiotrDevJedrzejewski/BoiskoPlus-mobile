# BoiskoPlus Mobile

Mobilna wersja aplikacji **BoiskoPlus** — platformy do organizowania i wyszukiwania wydarzeń sportowych. Zbudowana w **React Native** z **Expo** (SDK 57), korzysta ze wspólnego backendu Express.js + MongoDB.

---

## Spis treści

- [Stack technologiczny](#stack-technologiczny)
- [Lista funkcjonalności](#lista-funkcjonalności)
  - [Autoryzacja i rejestracja](#1-autoryzacja-i-rejestracja)
  - [Dashboard](#2-dashboard)
  - [Wyszukiwanie wydarzeń](#3-wyszukiwanie-wydarzeń)
  - [Mapa](#4-mapa)
  - [Zarządzanie wydarzeniami](#5-zarządzanie-wydarzeniami)
  - [Czat](#6-czat-w-czasie-rzeczywistym)
  - [Profil użytkownika](#7-profil-użytkownika)
  - [Znajomi](#8-system-znajomych)
  - [Ranking](#9-ranking-i-statystyki)
  - [Powiadomienia](#10-powiadomienia)
  - [Zgłoszenia](#11-zgłoszenia-i-raporty)
  - [Ustawienia](#12-ustawienia)
  - [Premium](#13-premium)
- [Obsługiwane dyscypliny](#obsługiwane-dyscypliny)
- [Backend API](#backend-api)
  - [Autentykacja](#autentykacja-mobilna)
  - [Użytkownicy](#użytkownicy)
  - [Wydarzenia](#wydarzenia)
  - [Statusy uczestnictwa](#statusy-uczestnictwa)
  - [Czat](#czat)
  - [Znajomi](#znajomi)
  - [Statystyki i ranking](#statystyki-i-ranking)
  - [Powiadomienia](#powiadomienia-api)
  - [Lokalizacja](#lokalizacja)
  - [Zgłoszenia](#zgłoszenia)
  - [WebSocket / Socket.IO](#websocket--socketio)
- [Uruchomienie projektu](#uruchomienie-projektu)

---

## Stack technologiczny

| Warstwa        | Technologia                                      |
| -------------- | ------------------------------------------------ |
| Framework      | React Native 0.81 + Expo SDK 54                  |
| Nawigacja      | Expo Router 6 (file-based) + React Navigation 7  |
| Mapy           | Mapbox (`@rnmapbox/maps`)                        |
| Czat real-time | Socket.IO Client                                 |
| Autoryzacja    | Firebase Auth + Google Sign-In + JWT             |
| Storage        | Expo SecureStore + AsyncStorage                  |
| Animacje       | React Native Reanimated 4 + Lottie               |
| UI             | Expo BlurView, Linear Gradient, Gesture Handler  |
| Backend        | Express.js + MongoDB + Socket.IO (wspólny z web) |

---

## Lista funkcjonalności

### 1. Autoryzacja i rejestracja

- Logowanie przez e-mail/nick + hasło
- Logowanie przez Google OAuth (Firebase)
- Rejestracja z polami: nick, imię, nazwisko, telefon, data urodzenia, e-mail, hasło
- Rejestracja przez Google OAuth
- Resetowanie hasła (forgot password)
- Zmiana hasła z poziomu aplikacji
- Ekran regulaminu i polityki prywatności
- Automatyczne przekierowanie zalogowanego użytkownika na dashboard
- Walidacja formularzy (format e-mail, siła hasła, unikalnośc nicku)

### 2. Dashboard

- Ekran główny z czterema kafelkami szybkiego dostępu:
  - **Znajdź Grę** — przejście do wyszukiwania wydarzeń
  - **Pokaż Mapę** — przejście do widoku mapy
  - **Stwórz Grę** — przejście do formularza tworzenia wydarzenia
  - **Moje Gry** — przejście do zarządzania wydarzeniami
- Drawer menu z nawigacją do profilu, znajomych, rankingu, ustawień, premium, czatu

### 3. Wyszukiwanie wydarzeń

- Filtrowanie po mieście z autouzupełnianiem (baza polskich miejscowości)
- Filtrowanie po odległości (suwak 1–50 km)
- Filtrowanie po typie gry (14 dyscyplin)
- Filtrowanie po nazwie wydarzenia
- Lista wyników z paginacją i infinite scroll
- Wyświetlanie ikon dyscyplin
- Obsługa bieżącej lokalizacji użytkownika

### 4. Mapa

- Interaktywna mapa Mapbox z markerami wydarzeń i boisk
- Wyszukiwanie po mieście
- Toggle widoczności markerów i wydarzeń
- Filtrowanie po odległości
- Obsługa geolokalizacji użytkownika
- Predefiniowane boiska sportowe (orliki) z geolokalizacją
- Klasteryzacja markerów (supercluster)
- Motyw mapy (jasny/ciemny)

### 5. Zarządzanie wydarzeniami

#### Tworzenie wydarzenia

- Formularz z polami: nazwa, opis, typ gry, typ boiska, poziom trudności
- Wybór daty i godziny
- Adres z geokodowaniem (Mapbox)
- Opcja „uczestniczę" dla autora
- Zakres graczy (min/max)
- Ustawienie wydarzenia jako prywatne
- Wybór predefiniowanego boiska z mapy

#### Edycja wydarzenia

- Modyfikacja wszystkich pól wydarzenia
- Podgląd liczby zainteresowanych / zaakceptowanych / odrzuconych
- Zarządzanie statusami uczestników (akceptuj / odrzuć)
- Usuwanie i kończenie wydarzenia

#### Moje Gry — panel zarządzania

- **Wszystkie wydarzenia** — z filtrami: własne / zaakceptowane / zainteresowane / odrzucone / zakończone
- **Aktywne wydarzenia** — nadchodzące, posortowane chronologicznie
- **Moje wydarzenia (autor)** — tylko te, które użytkownik stworzył
- **Historia** — zakończone i anulowane wydarzenia

#### Widok pojedynczego wydarzenia

- Pełne informacje: data, lokalizacja, typ gry, opis, poziom, liczba graczy
- Przyciski akcji: dołącz / opuść / zainteresowany
- Lista uczestników z podziałem na statusy
- Czat z organizatorem
- Wyciszenie powiadomień o wydarzeniu
- Możliwość zgłoszenia wydarzenia
- Wyświetlanie reklam

### 6. Czat w czasie rzeczywistym

- Pokoje prywatne (1-na-1) i grupowe (powiązane z wydarzeniem)
- Komunikacja przez WebSocket (Socket.IO)
- Filtrowanie pokojów: wszystkie / prywatne / grupowe
- Wyszukiwanie pokojów po nazwie
- Historia wiadomości z paginacją (infinite scroll)
- Wskaźnik pisania (typing indicator)
- Status online użytkowników
- Oznaczanie wiadomości jako przeczytane
- Licznik nieprzeczytanych wiadomości
- Wyciszanie pokojów czatu
- Automatyczne tworzenie pokoju grupowego przy tworzeniu wydarzenia

### 7. Profil użytkownika

#### Własny profil

- Wyświetlanie avatara, nicku, danych osobowych
- Statystyki: rozegrane gry, zorganizowane wydarzenia, polubienia, punkty
- Przejście do edycji profilu
- Zmiana hasła
- Usunięcie konta (z kaskadowym usunięciem danych)

#### Edycja profilu

- Zmiana nicku (walidacja zabronionych słów: admin, mod, itp.)
- Zmiana imienia i nazwiska (obsługa polskich znaków)
- Zmiana e-maila, telefonu, daty urodzenia
- Upload avatara (image picker + manipulator)

#### Profil innego użytkownika

- Podgląd publicznych danych i statystyk
- Polubienie / cofnięcie polubienia
- Akcje znajomych: dodaj / akceptuj / odrzuć / usuń / anuluj zaproszenie
- Wyślij wiadomość

### 8. System znajomych

- Lista znajomych ze statystykami
- Przychodzące zaproszenia — akceptuj / odrzuć
- Wychodzące zaproszenia — anuluj
- Wyszukiwanie użytkowników (min. 3 znaki) z paginacją
- Wysyłanie zaproszeń do znajomych z wyników wyszukiwania
- Karty użytkowników z akcjami
- Powiadomienia real-time o zaproszeniach (Socket.IO)

### 9. Ranking i statystyki

- Tabela rankingowa z sortowaniem po:
  - Punktach (domyślnie)
  - Rozegranych grach
  - Zorganizowanych wydarzeniach
  - Polubieniach
- Wizualne oznaczenia top 3 (złoto / srebro / brąz)
- Paginacja
- Avatary i nicki użytkowników w rankingu

### 10. Powiadomienia

- Preferencje powiadomień: statusy wydarzeń, wiadomości czatu, przypomnienia, nowe wydarzenia w okolicy
- Wyciszanie poszczególnych pokojów czatu (z opcjonalną datą wygaśnięcia)
- Wyciszanie poszczególnych wydarzeń
- Oznaczanie powiadomień jako przeczytane
- Licznik nieprzeczytanych powiadomień

### 11. Zgłoszenia i raporty

- Zgłoszenie użytkownika
- Zgłoszenie wydarzenia
- Zgłoszenie błędu (bug report)
- Formularz z walidacją (10–500 znaków)
- Ochrona przed duplikatami zgłoszeń

### 12. Ustawienia

- **Prywatność i zgody** — marketing, consent management, cookies
- **Lokalizacja** — czyszczenie zapisanej lokalizacji, sprawdzanie uprawnień systemowych
- **Mapa** — wybór motywu (jasny / ciemny)
- **Czat** — czyszczenie historii czatu
- **Wsparcie** — zgłoś błąd, wyświetl regulamin

### 13. Premium

- _Status: Coming Soon_
- Planowane funkcje:
  - Brak reklam
  - Odznaka supportera
  - Priorytet w wynikach wyszukiwania
  - Narzędzia analityczne

---

## Obsługiwane dyscypliny

| #   | Dyscyplina    | Klucz         |
| --- | ------------- | ------------- |
| 1   | Piłka nożna   | `football`    |
| 2   | Siatkówka     | `volleyball`  |
| 3   | Koszykówka    | `basketball`  |
| 4   | Piłka ręczna  | `handball`    |
| 5   | Rugby         | `rugby`       |
| 6   | Hokej         | `hockey`      |
| 7   | Tenis         | `tennis`      |
| 8   | Badminton     | `badminton`   |
| 9   | Tenis stołowy | `tableTennis` |
| 10  | Kręgle        | `bowling`     |
| 11  | Karty         | `cards`       |
| 12  | Planszówki    | `boardGames`  |
| 13  | Inne          | `other`       |

Dodatkowe klasyfikacje:

- **Typ boiska**: pole/orlik, hala, inne
- **Poziom**: początkujący, średniozaawansowany, zaawansowany, profesjonalny, inny

---

## Backend API

Backend jest wspólny z wersją web. Poniżej lista endpointów wykorzystywanych przez aplikację mobilną.

### Autentykacja mobilna

`/api/v1/auth-mobile`

| Metoda  | Endpoint                 | Opis                                   |
| ------- | ------------------------ | -------------------------------------- |
| `POST`  | `/register`              | Rejestracja — zwraca token w body JSON |
| `POST`  | `/login`                 | Logowanie — zwraca token w body JSON   |
| `GET`   | `/logout`                | Wylogowanie                            |
| `POST`  | `/complete-oauth`        | Dokończenie rejestracji OAuth          |
| `POST`  | `/login-oauth`           | Logowanie przez OAuth                  |
| `POST`  | `/forgot-password`       | Żądanie resetu hasła                   |
| `POST`  | `/reset-password/:token` | Reset hasła z tokenem                  |
| `PATCH` | `/change-password`       | Zmiana hasła (wymaga auth)             |

### Użytkownicy

`/api/v1/users`

| Metoda   | Endpoint                    | Opis                               |
| -------- | --------------------------- | ---------------------------------- |
| `GET`    | `/current-user`             | Pobranie profilu zalogowanego      |
| `GET`    | `/search?query=...`         | Wyszukiwanie użytkowników po nicku |
| `GET`    | `/:id`                      | Pobranie profilu po ID             |
| `PATCH`  | `/current-user/update-user` | Aktualizacja profilu               |
| `DELETE` | `/current-user/delete`      | Usunięcie konta (kaskadowe)        |

### Wydarzenia

`/api/v1/events`

| Metoda   | Endpoint           | Opis                                     |
| -------- | ------------------ | ---------------------------------------- |
| `GET`    | `/`                | Pobranie wydarzeń użytkownika            |
| `POST`   | `/`                | Utworzenie wydarzenia                    |
| `GET`    | `/:eventID`        | Szczegóły wydarzenia                     |
| `PATCH`  | `/:eventID`        | Edycja wydarzenia (tylko autor)          |
| `DELETE` | `/:eventID`        | Usunięcie wydarzenia (tylko autor)       |
| `POST`   | `/search`          | Wyszukiwanie geolokalizacyjne (2dsphere) |
| `POST`   | `/update-statuses` | Ręczna aktualizacja statusów wydarzeń    |

Automatyczne funkcje:

- Tworzenie pokoju czatu grupowego przy tworzeniu wydarzenia
- Geokodowanie adresu przez Mapbox
- Okresowa aktualizacja statusów: upcoming → live → completed

### Statusy uczestnictwa

`/api/v1/status`

| Metoda   | Endpoint                                | Opis                                      |
| -------- | --------------------------------------- | ----------------------------------------- |
| `POST`   | `/events/:eventID/join`                 | Dołączenie do wydarzenia (interested)     |
| `DELETE` | `/events/:eventID/leave`                | Opuszczenie wydarzenia                    |
| `PATCH`  | `/events/:eventID/users/:userID/status` | Zmiana statusu uczestnika (autor)         |
| `GET`    | `/events/:eventID/users`                | Lista uczestników                         |
| `GET`    | `/events/:eventID/my-status`            | Własny status w wydarzeniu                |
| `GET`    | `/status`                               | Wszystkie statusy użytkownika             |
| `PATCH`  | `/events/:eventID/mark-finished`        | Oznaczenie wydarzenia jako zakończone     |
| `PATCH`  | `/mark-read/:eventID`                   | Oznaczenie powiadomienia jako przeczytane |

### Czat

`/api/v1/chat`

| Metoda   | Endpoint                   | Opis                                   |
| -------- | -------------------------- | -------------------------------------- |
| `GET`    | `/rooms`                   | Pobranie pokojów czatu                 |
| `POST`   | `/rooms`                   | Utworzenie/pobranie pokoju prywatnego  |
| `GET`    | `/messages/:roomId`        | Historia wiadomości (paginacja)        |
| `PATCH`  | `/messages/read`           | Oznaczenie wiadomości jako przeczytane |
| `GET`    | `/messages/unreaded/count` | Liczba nieprzeczytanych                |
| `DELETE` | `/messages/clear`          | Usunięcie swoich wiadomości            |
| `GET`    | `/group/:eventId`          | Pobranie/utworzenie czatu grupowego    |

Format ID pokojów:

- Prywatny: `private_{sortedUserID1}_{sortedUserID2}`
- Grupowy: `group_{eventID}`

### Znajomi

`/api/v1/friendship`

| Metoda   | Endpoint                 | Opis                              |
| -------- | ------------------------ | --------------------------------- |
| `GET`    | `/friends`               | Lista znajomych                   |
| `GET`    | `/pending`               | Oczekujące zaproszenia            |
| `GET`    | `/status/:otherUserID`   | Status relacji z użytkownikiem    |
| `POST`   | `/send/:recipientID`     | Wysłanie zaproszenia              |
| `PATCH`  | `/:friendshipID/respond` | Akceptacja/odrzucenie zaproszenia |
| `DELETE` | `/:friendshipID`         | Usunięcie znajomego               |

### Statystyki i ranking

`/api/v1/user-stats`

| Metoda   | Endpoint                    | Opis                                                     |
| -------- | --------------------------- | -------------------------------------------------------- |
| `GET`    | `/current`                  | Statystyki zalogowanego                                  |
| `GET`    | `/leaderboard?type=&limit=` | Ranking (points / likes / gamesPlayed / eventsOrganized) |
| `GET`    | `/:userId`                  | Statystyki użytkownika                                   |
| `POST`   | `/multiple`                 | Statystyki wielu użytkowników                            |
| `POST`   | `/like`                     | Polubienie użytkownika                                   |
| `DELETE` | `/like`                     | Cofnięcie polubienia                                     |

Obliczanie punktów: `(eventsOrganized × 30) + (gamesPlayed × 10) + (totalLikes × 3)`

### Powiadomienia (API)

`/api/v1/notifications`

| Metoda   | Endpoint                 | Opis                         |
| -------- | ------------------------ | ---------------------------- |
| `GET`    | `/preferences`           | Pobranie preferencji         |
| `PUT`    | `/preferences`           | Aktualizacja preferencji     |
| `POST`   | `/mute-chat/:chatRoomId` | Wyciszenie pokoju czatu      |
| `DELETE` | `/mute-chat/:chatRoomId` | Odciszenie pokoju czatu      |
| `POST`   | `/mute-event/:eventId`   | Wyciszenie wydarzenia        |
| `DELETE` | `/mute-event/:eventId`   | Odciszenie wydarzenia        |
| `GET`    | `/unread`                | Nieprzeczytane powiadomienia |

### Lokalizacja

`/api/v1/location-mobile`

| Metoda | Endpoint           | Opis                              |
| ------ | ------------------ | --------------------------------- |
| `POST` | `/reverse-geocode` | Konwersja lat/lon → miasto/region |
| `POST` | `/geocode`         | Konwersja miasto → lat/lon        |

### Zgłoszenia

`/api/v1/reports`

| Metoda | Endpoint | Opis                                   |
| ------ | -------- | -------------------------------------- |
| `POST` | `/`      | Utworzenie zgłoszenia (user/event/bug) |

### WebSocket / Socket.IO

#### Namespace `/chat`

| Zdarzenie     | Opis                                  |
| ------------- | ------------------------------------- |
| `newMessage`  | Nowa wiadomość w pokoju               |
| `newChatRoom` | Utworzenie nowego pokoju prywatnego   |
| `messageRead` | Wiadomości oznaczone jako przeczytane |

#### Namespace `/notifications`

| Zdarzenie           | Opis                                    |
| ------------------- | --------------------------------------- |
| `friendRequest`     | Otrzymanie zaproszenia do znajomych     |
| `eventStatusUpdate` | Zmiana statusu gracza w wydarzeniu      |
| `eventReminder`     | Przypomnienie o nadchodzącym wydarzeniu |
| `notificationMuted` | Wyciszenie pokoju/wydarzenia            |

Funkcje real-time:

- Cache uprawnień do pokojów (TTL 5 min)
- Śledzenie użytkowników online
- Automatyczne ponowne dołączanie do pokojów po reconnect
- Exponential backoff przy reconnect

---

## Uruchomienie projektu

```bash
# Instalacja zależności
npm install

# Development z dev-client (wymaga zbudowanego natywnego klienta)
npm run dev

# Alternatywnie — Expo Go
npm start

# Build Android (EAS)
eas build --profile development --platform android

# Uruchomienie na Android
npm run android

# Uruchomienie na iOS
npm run ios
```

Wymagane zmienne środowiskowe / konfiguracja:

- Plik `google-services.json` (Firebase Android)
- Plik `GoogleService-Info.plist` (Firebase iOS)
- Konfiguracja Mapbox access token
- Adres backendu w konfiguracji API
