# PLAN 4.1 — Ready Check wydarzeń

Data: 2026-11-20 (wersja 4.0: 2026-10-29)
Wersja: 4.1 — nowy model `Event` (Faza 0) + Ready Check z wersji 4.0: transakcje bez
wersjonowania, jeden stały dokument na event, sygnały socketowe bez danych, `maxPlayers`
liczone zamiast przechowywane
Status: **nic nie jest zaimplementowane** (implementacja Faz 1–4 z planu 3.x została
w całości cofnięta). W kodzie mobile istnieje jedynie oznaczony `TEMPORARY FIX`
podglądu składu (§4.2) — Faza 0 go zastępuje.
Zakres: `BoiskoPlus/server` oraz aplikacja `BoiskoPlus-mobile`
(`BoiskoPlus/client` to nieutrzymywany prototyp web — **nie dotykamy go**;
`BoiskoPlus-web` i `BoiskoPlus-Partners-*` to boilerplate'y uzupełniane po Ready Check —
poza zakresem)

**Najważniejsza zmiana 4.1:** przed wdrożeniem developer wykonuje **pełny reset bazy
danych** (wszystkie kolekcje, także użytkownicy). Plan nie zawiera żadnej obsługi starych
danych, migracji ani zgodności ze starymi wersjami aplikacji (§4.1).

Szczegółowy podział na zadania dla wykonawców: [PLAN-PRAC-ready-check-4.0.md](PLAN-PRAC-ready-check-4.0.md).

---

## 0. Notka — sposób implementacji backendu

Kod backendu (`BoiskoPlus/server`, MongoDB + Mongoose) powstaje w istniejącym stylu
projektu: **funkcjonalność wykonuje kod JavaScript w controllerach i serwisach**, a nie
polecenia zapisane jako wyrażenia wykonywane po stronie bazy.

- Każda zmiana danych (`Event`, `Status`, `ReadyCheck`, czat) przechodzi przez ścieżkę
  `route → middleware walidacji → controller → (serwis) → model Mongoose`.
- Controller odpowiada za HTTP: odczyt `req`, wywołanie logiki, odpowiedź, efekty
  uboczne po zapisie (socket, push, czat, statystyki).
- Serwis (`server/services/`) zawiera logikę biznesową współdzieloną przez kilka
  controllerów albo scheduler. Folder `services/` powstaje w tym wdrożeniu, ponieważ ta
  sama logika uczestnictwa jest potrzebna w `statusController`, `eventController`
  i schedulerze — trzymanie jej w jednym controllerze wymagałoby importowania
  controllera przez inny controller.
- Logika (warunki, przejścia statusów, liczenie miejsc) jest zapisana czytelnie, krok po
  kroku: **odczyt dokumentu → sprawdzenie warunku zwykłym `if` → zmiana pól → `save()`**.
- Nie upychamy logiki w wyrażeniach bazy. Zakazane są:
  - pipeline update (`updateOne(filter, [ ... ])`),
  - `$cond`, `$expr`, `$switch` i podobne operatory agregacji w zapisach,
  - rozbudowane `arrayFilters` i ścieżki `participants.$[x].pole`,
  - `mongosh`, `db.runCommand`, `mongoose.connection.db.collection(...)`,
  - ręczne migracje albo poprawki danych wykonywane bezpośrednio w Atlasie.
- Dozwolone są zwykłe zapytania Mongoose: `find`, `findOne`, `findById`, proste filtry
  (`$in`, `$lte`, `$gt`), `create`, `save`, `deleteOne`, `findOneAndUpdate` z prostym
  `$set` oraz `populate`.
- Atomowość zapewniają transakcje MongoDB uruchamiane przez
  `mongoose.connection.transaction(async (session) => { ... })` (szczegóły w §5).
- Jeżeli kiedykolwiek będzie potrzebna operacja na istniejących danych, powstaje dla niej
  endpoint obsługiwany przez controller — nie skrypt na bazie.
- Wyjątek jednorazowy: **pełny reset bazy** przed Fazą 0 (§4.1) wykonuje developer
  ręcznie. To nie jest migracja — kod nie zawiera żadnej logiki dla danych sprzed resetu.
- Dokument `Event` zmieniamy przez `doc.save()` / `Model.create()`, a nie przez
  `findByIdAndUpdate` / `updateOne` / `$inc`, bo pola liczone przez serwer są ustawiane
  w hooku `pre("validate")`, który działa tylko przy `save()` (§4.6).

---

## 1. Słownik pojęć

W planie 3.x słowo „snapshot” oznaczało trzy różne rzeczy. W wersji 4.0 to słowo nie
występuje. Obowiązują poniższe nazwy:

| Pojęcie                           | Znaczenie                                                                                                                                                                                  |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Dokument Ready Check**          | Jeden dokument kolekcji `readychecks` dla jednego wydarzenia (unikalny `eventID`). Nie jest usuwany przy zmianie terminu — jest resetowany.                                                |
| **Lista uczestników Ready Check** | Tablica `participants` w dokumencie. Stan **na żywo**, synchronizowany w tej samej transakcji co `Status`. Przechowuje gotowość i historię `left`/`rejected`. To nie jest zamrożona kopia. |
| **Stan aktualny Ready Check**     | Odpowiedź `GET /api/v1/ready-checks/events/:eventID` — jedyne źródło danych dla ekranu mobilnego.                                                                                          |
| **Sygnał zmiany**                 | Zdarzenie socketowe `readyCheckChanged { eventId }` bez danych. Mówi tylko: „pobierz stan aktualny ponownie”.                                                                              |
| **`format`, `totalPlayers`**      | `format` — klucz tabeli `EVENT_FORMATS` (`"1v1"`…`"20v20"`, `"other"`). `totalPlayers` — łączna liczba graczy meczu z tabeli (`11v11` → `22`), liczona przez serwer; `null` dla `other`.     |
| **`searchedPlayers`**             | Pole `Event` — ilu graczy organizator szuka przez aplikację („Ilu graczy szukasz”). Wartość organizatora, **nie maleje** przy akceptacji. Zastępuje `playerCount`.                         |
| **`acceptedPlayers`**             | Pole `Event` — licznik zaakceptowanych graczy (bez organizatora). Zmienia go wyłącznie backend, w transakcjach.                                                                             |
| **`openSlots`**                   | Pole `Event` liczone przez serwer przy każdym `save()`: `searchedPlayers - acceptedPlayers`. Istnieje, żeby wyszukiwanie mogło filtrować indeksowalnym warunkiem bez `$expr`.             |
| **`organizerPlays`**              | Pole `Event` — czy organizator gra. Zastępuje `isParticipating`. Organizator **nigdy** nie zajmuje szukanego miejsca.                                                                      |
| **Skład meczu**                   | Wartość wyświetlana („Uczestnicy”, karty, podgląd formularza), np. `20/22` — wzory w §4.8. Nie jest używana przez Ready Check.                                                             |
| **Aktywni (`active`)**            | Uczestnicy listy ze statusem `pending` lub `ready`.                                                                                                                                        |
| **Pojemność (`maxPlayers`)**      | Wartość **liczona przy każdym odczycie**: `event.searchedPlayers + (event.organizerPlays ? 1 : 0)`. Nie jest zapisywana w bazie (§6).                                                       |
| **Termin wydarzenia w RC**        | Pole `eventStartAt` — kopia `event.startDateTime` aktualizowana w tej samej transakcji co edycja eventu. Potrzebna do zapytań schedulera.                                                  |
| **Zakomunikowany termin**         | Pole `notifiedStartAt` — termin, który uczestnicy znają z ostatniego pusha (otwarcie albo zmiana godziny).                                                                                 |
| **Reset Ready Check**             | Przebudowa dokumentu w miejscu: lista uczestników tworzona od nowa z `Status: accepted` (wszyscy `pending`), nowy harmonogram, wyczyszczone daty pushy.                                    |
| **Tick schedulera**               | Jeden przebieg zadania cyklicznego uruchamianego co minutę z `utils/eventStatusUpdater.js`.                                                                                                |

---

## 2. Cel

Ready Check jest dodatkowym mechanizmem organizacyjnym uruchamianym przed wydarzeniem.
Nie steruje statusem wydarzenia i nie blokuje jego rozpoczęcia.

System ma:

- prowadzić listę uczestników Ready Check zgodną z zaakceptowanym składem,
- wysłać uczestnikom obowiązkowy push przed rozpoczęciem,
- pozwolić każdemu uczestnikowi oznaczyć się jako `ready`,
- odświeżać ekran osobom, które aktualnie na nim są,
- zachować ślad po osobach, które opuściły wydarzenie albo zostały odrzucone,
- po 30 minutach powiadomić organizatora, jeżeli nie ma kompletu,
- przenieść organizatora do istniejącego ekranu zarządzania uczestnikami,
- nie wpływać na standardowe przejście eventu `upcoming → live → completed`.

Źródłem prawdy jest MongoDB udostępnione przez REST. Socket.IO wysyła wyłącznie sygnały
„coś się zmieniło”.

Ready Check jest funkcją **eksperymentalną**: starsze wersje aplikacji go nie znają. Z
tego powodu ma osobny namespace Socket.IO i osobny router REST, które można zmieniać
albo wyłączyć bez dotykania czatu i powiadomień.

---

## 3. Reguły biznesowe

### 3.1. Harmonogram

Moment otwarcia zależy od czasu pozostałego do startu w chwili utworzenia wydarzenia,
przełożenia terminu albo resetu:

| Czas do startu   | Zachowanie                                 | `scheduleMode` |
| ---------------- | ------------------------------------------ | -------------- |
| `> 4h`           | Ready Check otwiera się `4h` przed startem | `four_hours`   |
| `> 1h` i `<= 4h` | Ready Check otwiera się `1h` przed startem | `one_hour`     |
| `<= 1h`          | Ready Check jest pomijany                  | `skipped`      |

Granice są celowe: dokładnie `4h` oznacza tryb `T-1h`, dokładnie `1h` oznacza pominięcie.

Przykład dla wydarzenia o `20:10`:

- utworzone przed `16:10` → otwarcie o `16:10`,
- utworzone między `16:10` a `19:10` → otwarcie o `19:10`,
- utworzone o `19:10` lub później → brak Ready Check (`state = skipped`).

### 3.2. Powiadomienie uczestników

W chwili otwarcia każdy aktywny uczestnik dostaje push:

> Ready Check: [nazwa wydarzenia]
> Potwierdź obecność. Start o [godzina].

Kliknięcie otwiera `/(auth)/ready-check?eventId=<eventId>`.

Jeżeli ktoś zostanie zaakceptowany już po otwarciu, trafia na listę jako `pending` i
dostaje ten push od razu (najpóźniej w kolejnym ticku).

### 3.3. Powiadomienie organizatora

30 minut po zaplanowanym otwarciu (`organizerReminderAt = triggerAt + 30 min`) organizator
dostaje push, ale tylko jeżeli `ready < maxPlayers`:

- tryb `T-4h` → przypomnienie w `T-3h30m`,
- tryb `T-1h` → przypomnienie w `T-30m`.

> Nie masz kompletu
> [nazwa]: gotowi 4/5, w składzie 5/5. Zarządzaj uczestnikami.

Kliknięcie: `/(auth)/events-managment/edit-event?id=<eventId>&tab=players`.

Przy komplecie organizator nie dostaje pusha. Osiągnięcie kompletu później nie generuje
żadnego pusha — zmienia się tylko UI.

### 3.4. Brak wpływu na lifecycle wydarzenia

Ready Check nie anuluje wydarzenia, nie zatrzymuje przejścia do `LIVE`, nie wymaga
decyzji organizatora, nie zamyka zapisów i nie zmienia automatycznie `Status`.

### 3.5. Powiadomień nie można wyciszyć w aplikacji

Pushe Ready Check nie respektują `eventStatusUpdates`, `eventReminders` ani `mutedEvents`
(wywołanie `sendPushToUser` z `notificationType = null`) i idą osobnym kanałem Android
`ready-checks`. Systemowych ustawień telefonu aplikacja nie omija.

---

## 4. Model `Event` i liczniki składu (Faza 0 + Faza B)

### 4.1. Decyzja 4.1 — pełny reset bazy

- Jesteśmy na wczesnym etapie rozwoju. Developer **usuwa całą bazę** (wszystkie kolekcje,
  także `users`) przed pierwszym uruchomieniem backendu z Fazą 0 (Bramka 0 w Planie prac).
- Dlatego: brak migracji, brak wartości domyślnych „dla starych dokumentów”, brak
  `validateModifiedOnly`, brak obcinania ujemnych liczników, brak ścieżek „stare
  wydarzenie bez dokumentu Ready Check”.
- **Stare buildy aplikacji są niekompatybilne** z nowym API (inne nazwy pól). Backend
  i nowy build deweloperski/produkcyjny wydajemy razem.
- Przy okazji resetu porządkujemy nazwy pól (§4.3) i usuwamy pola zbędne.

### 4.2. Stan przed Fazą 0 (zweryfikowany w kodzie 2026-11-20)

Model i liczniki:

- `playerCount` = liczba **wolnych** miejsc, malejąca przy akceptacji. Liczba
  zaakceptowanych nie jest zapisana — `searchEvents` liczy ją `$lookup`-iem
  (`acceptedCount`), inne endpointy jej nie zwracają.
- `format` to opcjonalny string (`EVENT_FORMATS` = tablica `"1v1"`…`"20v20"`, `"other"`,
  domyślnie `"11v11"`) — nigdzie nie wpływa na liczby.
- `startDate` (string) i `startHour` (`HH:mm`) duplikują `startDateTime`; rollover zapisuje
  `startDate` przez `toISOString()` (data UTC — błąd dla późnych godzin).
- Klient wysyła `endDateTime` i `addressString` — serwer im ufa.
- Hook `post("save")` w `eventModel` tworzący czat prawdopodobnie nigdy się nie wykonuje
  (`doc.isNew` jest już `false`); czat tworzy jawnie `createEvent`.

Integralność licznika (powody Fazy B):

- `statusController.updateUserStatus`: zapisuje `Status`, potem osobno
  `$inc: { playerCount: -1 }` z `runValidators: false` — licznik może zejść poniżej zera,
  a dwukrotne `accepted` zmniejsza go dwa razy.
- `statusController.respondToInvite`: przyjęcie zaproszenia nie sprawdza wolnych miejsc.
- `statusController.leaveEvent`: nie blokuje organizatora; `+1` w osobnym `try/catch`.
- `eventController.updateEvent`: nadpisuje `playerCount` wartością z formularza (wyścig
  z równoległą akceptacją), a zmiana `isParticipating` nie koryguje licznika.
- Żaden `catch` w `statusController` nie przekazuje `err.statusCode` — każdy błąd to `500`.
- W całym backendzie nie ma transakcji.

Mobile: `TEMPORARY FIX` (helpery `getFormatTotalPlayers` i `getEventPlayersPreview`
w `assets/utils/eventDisplay.js`, użyte w `FormEvent.jsx`, `EventSimpleCard.jsx`,
`single-event.jsx`, `dashboard-home.jsx`) liczy podgląd składu z `format` i `playerCount`.
Faza 0 zastępuje go docelowymi helperami (§4.8). Zmiana kolejności pól w formularzu
(format przed „Ilu graczy szukasz”, minus po lewej, plus po prawej) oraz pole „Podgląd”
zostają.

### 4.3. Zmiany nazw i pól

| Przed Fazą 0                                               | Po Fazie 0                                          | Uwagi                                                          |
| ---------------------------------------------------------- | --------------------------------------------------- | -------------------------------------------------------------- |
| `address { city, street, addressNumber, postalCode }`      | `location { city, street, addressNumber, postalCode }` | jeden poddokument lokalizacji                               |
| `addressString` (od klienta)                               | `location.addressString`                            | buduje serwer                                                  |
| `geolocation`                                              | `location.geolocation`                              | indeks `2dsphere` na `location.geolocation`                    |
| `startDate`, `startHour`                                   | — (usunięte)                                        | data i godzina tylko ze `startDateTime`                        |
| `duration`                                                 | `durationMinutes`                                   |                                                                |
| `endDateTime` (od klienta)                                 | `endDateTime`                                       | liczy serwer: `startDateTime + durationMinutes`                |
| `fieldType`, stała `EVENT_GROUND_TYPES`                    | `venueType`, stała `EVENT_VENUE_TYPES`              | wartości bez zmian: `field`, `hall`, `other`                  |
| `format` (opcjonalny string, tablica `EVENT_FORMATS`)      | `format` (wymagany klucz tabeli `EVENT_FORMATS`)    | tabela z `totalPlayers` (§4.5)                                 |
| —                                                          | `totalPlayers`                                      | liczy serwer z tabeli; `null` dla `other`                      |
| `playerCount` (wolne miejsca, malejące)                    | `searchedPlayers`                                   | wartość organizatora, stała przy akceptacji                    |
| `acceptedCount` (tylko `$lookup` w wyszukiwarce)           | `acceptedPlayers`                                   | licznik backendu, bez organizatora                             |
| —                                                          | `openSlots`                                         | liczy serwer: `searchedPlayers - acceptedPlayers`              |
| `isParticipating`                                          | `organizerPlays`                                    |                                                                |
| `ageRange: [min, max]`                                     | `ageMin`, `ageMax`                                  |                                                                |
| hook `post("save")` tworzący czat                          | — (usunięty)                                        | czat tworzy `createEvent`                                      |
| wyszukiwarka: parametr `minPlayerCount`                    | parametr `minOpenSlots`                             | parametr `ageRange` (zakres filtra) zostaje                    |

Bez zmian: `eventName`, `eventDescription`, `gameType`, `level`, `price`, `paymentMethod`,
`phoneNumber`, `isPrivate`, `isRecurring`, `eventStatus`, `createdBy`, `inviteToken`
(`select: false`), `timestamps`.

### 4.4. Schemat `server/models/eventModel.js`

```js
const geolocationSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["Point"], required: true },
    coordinates: { type: [Number], required: true }, // [longitude, latitude]
  },
  { _id: false },
);

const locationSchema = new mongoose.Schema(
  {
    city: { type: String, required: true },
    street: { type: String, required: true },
    addressNumber: { type: String, required: true },
    postalCode: { type: String, required: true },
    addressString: { type: String, required: true }, // built by the server
    geolocation: { type: geolocationSchema, required: true },
  },
  { _id: false },
);

const eventSchema = new mongoose.Schema(
  {
    eventName: { type: String, required: true },
    eventDescription: { type: String, default: "" },
    gameType: { type: String, enum: SUPPORTED_GAME_TYPES, required: true },
    level: { type: String, enum: Object.values(EVENT_LEVELS), required: true },
    venueType: {
      type: String,
      enum: Object.values(EVENT_VENUE_TYPES),
      required: true,
    },

    startDateTime: { type: Date, required: true },
    durationMinutes: { type: Number, required: true, min: 1 },
    endDateTime: { type: Date, required: true }, // computed

    location: { type: locationSchema, required: true },

    format: { type: String, enum: EVENT_FORMAT_KEYS, required: true },
    totalPlayers: { type: Number, default: null }, // computed, null for "other"
    searchedPlayers: {
      type: Number,
      required: true,
      min: 1,
      max: MAX_SEARCHED_PLAYERS,
    },
    acceptedPlayers: { type: Number, default: 0, min: 0 }, // backend only
    openSlots: { type: Number, default: 0, min: 0 }, // computed
    organizerPlays: { type: Boolean, default: false },

    price: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, default: "" },
    phoneNumber: { type: String, default: "" },
    ageMin: { type: Number, default: 0, min: 0, max: 100 },
    ageMax: { type: Number, default: 100, min: 0, max: 100 },

    isPrivate: { type: Boolean, default: false },
    isRecurring: { type: Boolean, default: false },
    eventStatus: {
      type: String,
      enum: Object.values(EVENT_STATUS),
      default: EVENT_STATUS.UPCOMING,
    },
    createdBy: { type: mongoose.Types.ObjectId, ref: "User", required: true },
    inviteToken: { type: String, unique: true, sparse: true, select: false },
  },
  { timestamps: true },
);
```

Indeksy: `{ "location.geolocation": "2dsphere" }` oraz bez zmian: `eventStatus`,
`createdBy`, `startDateTime`, `gameType`, `isPrivate`, `{ eventStatus, startDateTime }`,
`{ createdBy, eventStatus }`. Hook `post("save")` (czat) — usunięty.

`openSlots` ma `min: 0`: jeżeli jakaś ścieżka spróbuje zapisać
`acceptedPlayers > searchedPlayers`, walidacja Mongoose odrzuci zapis (siatka
bezpieczeństwa; reguły biznesowe z §4.11 zwracają wcześniej czytelny `409`).

### 4.5. Tabela formatów (`server/utils/constants.js`)

```js
export const EVENT_VENUE_TYPES = { FIELD: "field", HALL: "hall", OTHER: "other" };
export const OTHER_EVENT_FORMAT = "other";
export const MAX_SEARCHED_PLAYERS = 999;

const buildEventFormats = () => {
  const formats = {};
  for (let playersPerTeam = 1; playersPerTeam <= 20; playersPerTeam += 1) {
    formats[`${playersPerTeam}v${playersPerTeam}`] = {
      totalPlayers: playersPerTeam * 2,
    };
  }
  formats[OTHER_EVENT_FORMAT] = { totalPlayers: null };
  return formats;
};

// { "1v1": { totalPlayers: 2 }, ..., "11v11": { totalPlayers: 22 }, ..., other: { totalPlayers: null } }
export const EVENT_FORMATS = buildEventFormats();
export const EVENT_FORMAT_KEYS = Object.keys(EVENT_FORMATS);
```

`EVENT_GROUND_TYPES` znika (zastępuje go `EVENT_VENUE_TYPES`). Struktura obiektu pozwala
w przyszłości dopisać do formatu inne właściwości (np. etykietę) bez zmiany modelu.

### 4.6. Pola liczone przez serwer i zasada `save()`

Nowy plik `server/utils/eventFields.js` (funkcje czyste, bez bazy):

```js
getFormatTotalPlayers(format)                 → number | null   // z EVENT_FORMATS
getMaxSearchedPlayers(format, organizerPlays) → number          // NvN: totalPlayers - (organizerPlays ? 1 : 0); other: MAX_SEARCHED_PLAYERS
buildAddressString({ street, addressNumber, city, postalCode }) → string // "Street 1, City, 00-000"
calculateEndDateTime(startDateTime, durationMinutes)            → Date
calculateOpenSlots(searchedPlayers, acceptedPlayers)            → number
```

Hook w `eventModel.js`:

```js
eventSchema.pre("validate", function () {
  this.totalPlayers = getFormatTotalPlayers(this.format);
  this.openSlots = calculateOpenSlots(this.searchedPlayers, this.acceptedPlayers);
  // + endDateTime i location.addressString, gdy dane wejściowe istnieją
  //   (brak danych zgłosi walidacja `required`)
});
```

Zasada (obowiązuje cały backend):

- `totalPlayers`, `openSlots`, `endDateTime`, `location.addressString` ustawia **tylko**
  hook. Controllery nie przyjmują ich z `req.body`.
- Pola wejściowe hooka (`format`, `searchedPlayers`, `acceptedPlayers`, `startDateTime`,
  `durationMinutes`, `location`) zmieniamy wyłącznie przez `doc.save()` /
  `Model.create()`. Zakazane dla nich: `findByIdAndUpdate`, `findOneAndUpdate`,
  `updateOne`, `updateMany`, `$inc`.
- Pola niezwiązane z hookiem (`eventStatus`, `inviteToken`) mogą być aktualizowane jak
  dotychczas (np. `updateMany` statusu w `eventStatusUpdater.js`).
- `openSlots` jest przechowywane (a nie liczone przy odczycie), bo wyszukiwarka filtruje
  `openSlots: { $gt: 0 }` / `{ $gte: minOpenSlots }` — zwykłym, indeksowalnym warunkiem.
  Alternatywa (`$expr` porównujący dwa pola) jest zakazana przez §0.

Nowy plik `server/utils/eventDateFormat.js` — data i godzina w treściach generowanych
przez serwer (pushe, komunikaty rolloveru), zawsze w strefie `Europe/Warsaw`:

```js
formatEventTime(date) → "HH:mm"       // toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Warsaw" })
formatEventDate(date) → "DD.MM.YYYY"  // toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Warsaw" })
```

### 4.7. Kontrakt API eventu

Body `POST /api/v1/football-events` i `PATCH /api/v1/football-events/:eventID`
(pełny formularz w obu przypadkach, jak dziś):

```js
{
  eventName, eventDescription, gameType, level, venueType,
  startDateTime,      // ISO 8601; mobile buduje z daty i godziny formularza (czas lokalny urządzenia)
  durationMinutes,
  location: { city, street, addressNumber, postalCode },
  format, searchedPlayers, organizerPlays,
  price, paymentMethod, phoneNumber, ageMin, ageMax,
  isPrivate, isRecurring,
  eventStatus,        // tylko PATCH, opcjonalnie (anulowanie)
}
```

Serwer ignoruje w body: `totalPlayers`, `acceptedPlayers`, `openSlots`, `endDateTime`,
`location.addressString`, `location.geolocation` (controller buduje obiekt zapisu z jawnej
listy pól). Geolokalizację ustala geokodowanie `location.addressString` (Mapbox) przed
transakcją; przy edycji tylko wtedy, gdy adres się zmienił.

Odpowiedzi zwracają dokument eventu z nowymi polami (w tym `totalPlayers`,
`acceptedPlayers`, `openSlots`). Wyszukiwarka nie dolicza już `acceptedCount`.

Wyszukiwarka (`validateLocationInput` + `searchEvents`): `minOpenSlots` (1–999,
opcjonalny) → `openSlots: { $gte: minOpenSlots }`, bez parametru `openSlots: { $gt: 0 }`;
`ageRange: [min, max]` (filtr) → `ageMin: { $lte: max }`, `ageMax: { $gte: min }`;
`$geoNear` po `location.geolocation`.

### 4.8. Wzory wyświetlania (mobile)

| Miejsce                                                                 | Wzór                                                                              |
| ----------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Wolne miejsca („Poszukiwani” w `single-event`, „WOLNE MIEJSCA” w `edit-event`, lista na mapie) | `openSlots`                                                                       |
| Skład meczu `NvN` („Uczestnicy”, karty, dashboard, pasek postępu, „Podgląd” w formularzu) | `(totalPlayers - searchedPlayers + acceptedPlayers) / totalPlayers`               |
| Skład meczu `other`                                                     | `(acceptedPlayers + (organizerPlays ? 1 : 0)) / (searchedPlayers + (organizerPlays ? 1 : 0))` |

Przykłady: `11v11`, szukam 2 → `20/22`, „Poszukiwani: 2”; po akceptacji jednego gracza →
`21/22`, „Poszukiwani: 1”. `other`, szukam 2, organizator nie gra → `0/2`; organizator gra
→ `1/3`.

Dla `NvN` organizator jest już wliczony w `totalPlayers - searchedPlayers` („reszta
składu, którą organizator ma”), więc `organizerPlays` nie zmienia wyniku.

Helpery w `assets/utils/eventDisplay.js` (docelowe, bez `TEMPORARY FIX`):

```js
getFormatTotalPlayers(format)                 → number | null   // potrzebne formularzowi przed zapisem
getMaxSearchedPlayers(format, organizerPlays) → number          // lustro serwera (§4.6)
getEventOccupancy(event) → { acceptedPlayers, searchedPlayers, openSlots, isFull }
getEventSquad({ format, totalPlayers, searchedPlayers, acceptedPlayers, organizerPlays })
  → { current, max }   // działa dla zapisanego eventu i dla danych formularza
```

`getEventSquad` używa `totalPlayers ?? getFormatTotalPlayers(format)`, więc formularz
(bez `totalPlayers` z serwera) i zapisany event liczą to samo.

### 4.9. Reguły liczników

| Operacja                                          | `acceptedPlayers` | `openSlots`                    |
| ------------------------------------------------- | ----------------: | -----------------------------: |
| Utworzenie eventu (organizator gra albo nie)      |               `0` |              `searchedPlayers` |
| Organizator zmienia `organizerPlays` (w edycji)   |         bez zmian |                      bez zmian |
| Organizator zmienia `searchedPlayers` (w edycji)  |         bez zmian | `searchedPlayers - accepted`   |
| Gracz przechodzi na `accepted`                    |              `+1` |                           `-1` |
| Gracz przechodzi z `accepted` na inny status      |              `-1` |                           `+1` |
| Zaakceptowany gracz opuszcza wydarzenie           |              `-1` |                           `+1` |
| `interested` opuszcza wydarzenie                  |         bez zmian |                      bez zmian |
| Ponowne ustawienie tego samego statusu            |   bez zmian (no-op) |              bez zmian (no-op) |

Niezmiennik: `0 <= acceptedPlayers <= searchedPlayers`. Zajęcie miejsca przy
`acceptedPlayers >= searchedPlayers` kończy się `409 EVENT_FULL`. `openSlots = 0` nie
blokuje zgłoszenia `interested` (lista oczekujących).

`searchedPlayers` w edycji jest **wartością absolutną**: formularz otwarty przed
akceptacją gracza nie „oddaje” jego miejsca, bo zaakceptowani są w osobnym liczniku.
Mechanizm `previousPlayerCount` z wersji 4.0 nie jest potrzebny.

### 4.10. Organizator

- Nigdy nie zajmuje szukanego miejsca i nie jest liczony w `acceptedPlayers`.
- `organizerPlays = true` oznacza: istnieje `Status accepted` organizatora (oraz jego wpis
  na liście Ready Check). Zmiana `organizerPlays` w edycji tylko tworzy/usuwa ten `Status`
  (i synchronizuje Ready Check) — liczników nie zmienia.
- Nie może użyć `DELETE /status/events/:eventID/leave` → `403 ORGANIZER_CANNOT_LEAVE`.
- Nie może zmienić **własnego** `Status` przez
  `PATCH /status/events/:eventID/users/:userID/status` → `400` z komunikatem
  „Swój udział zmieniasz w edycji wydarzenia” (inaczej `Status` rozjechałby się z
  `organizerPlays`).
- Swój udział zmienia wyłącznie przez edycję eventu (`organizerPlays`).

### 4.11. Walidacja tworzenia i edycji

Jeden walidator `validateEventInput` dla `POST` i `PATCH` (jak dziś; osobny
`validateEventUpdateInput` z wersji 4.0 nie powstaje):

- `searchedPlayers`: liczba całkowita `1–999`,
- `format`: wymagany klucz `EVENT_FORMATS`,
- `NvN`: `searchedPlayers <= getMaxSearchedPlayers(format, organizerPlays)`, czyli
  `searchedPlayers + (organizerPlays ? 1 : 0) <= totalPlayers` → inaczej `400`
  `Przy formacie ${format} możesz szukać maksymalnie ${max} graczy`,
- `organizerPlays`, `isPrivate`, `isRecurring`: boolean,
- `startDateTime`: ISO 8601, w przyszłości (reguła zostaje — §22),
- `durationMinutes`: liczba całkowita `>= 1`,
- `ageMin`, `ageMax`: opcjonalne, `0–100`, `ageMin <= ageMax`,
- `location.city|street|addressNumber|postalCode`: wymagane,
- `venueType`, `level`, `gameType`, `eventStatus` (opcjonalny): wartości ze stałych.

Tylko edycja, **w transakcji** (wymaga aktualnego `acceptedPlayers`):
`searchedPlayers < event.acceptedPlayers` → `409 SEARCHED_BELOW_ACCEPTED`.
Wartość równa `acceptedPlayers` jest dozwolona (`openSlots = 0`, event pełny).

Mobile powtarza walidację w `FormEvent.jsx` (limit przycisku plus, `validateForm`), ale
źródłem prawdy jest backend.

### 4.12. Kontrakt błędów

Błąd biznesowy zwraca:

```js
{
  (msg, code, details);
}
```

| Sytuacja                                             | HTTP / `code`                     | `msg`                                                                                   |
| ---------------------------------------------------- | --------------------------------- | --------------------------------------------------------------------------------------- |
| Uczestnik przyjmuje zaproszenie przy pełnym składzie | `409 EVENT_FULL`                  | `Liczba graczy jest pełna. Skontaktuj się z organizatorem`                              |
| Organizator akceptuje gracza przy pełnym składzie    | `409 EVENT_FULL`                  | `Brak wolnych miejsc. Zwiększ liczbę szukanych graczy przed zaakceptowaniem gracza`     |
| Edycja: `searchedPlayers < acceptedPlayers`          | `409 SEARCHED_BELOW_ACCEPTED`     | `Nie możesz szukać mniej graczy, niż już zaakceptowałeś (${acceptedPlayers})`           |
| Organizator używa endpointu opuszczenia              | `403 ORGANIZER_CANNOT_LEAVE`      | `Organizator nie może opuścić wydarzenia. Zmień swój udział w edycji wydarzenia`        |
| Zmiana gotowości poza otwartym Ready Check (§11.2)   | `409 READY_CHECK_NOT_OPEN`        | `Ready Check nie jest teraz otwarty`                                                    |

`details` dla błędów składu: `{ eventId, searchedPlayers, acceptedPlayers }`.

Usunięte kody: `ORGANIZER_PARTICIPATION_REQUIRES_SLOT` (organizator nie zajmuje miejsca),
`PLAYER_COUNT_CHANGED` (zastąpione przez `SEARCHED_BELOW_ACCEPTED`),
`CAPACITY_BELOW_ACCEPTED` z planu 3.x.

Infrastruktura:

- `errors/customErrors.js`: nowa klasa `ConflictError(message, errorCode, details)` (409);
  `UnauthorizedError` dostaje opcjonalny drugi parametr `errorCode`.
- Pole w obiekcie błędu nazywa się `errorCode`, nie `code`, bo błędy MongoDB mają
  liczbowe `code` (np. `11000`), które nie może wyciekać do klienta.
- `middleware/errorHandlerMW.js` zwraca `{ msg, code: err.errorCode, details: err.details }`
  (pola tylko gdy istnieją).
- W zmienianych funkcjach controllerów `catch` przekazuje znane błędy dalej
  (`if (err.statusCode) throw err;`) — Express 5 kieruje je do `errorHandlerMW`.
  Nieznane błędy zostają obsłużone jak dotychczas (`500`).

Mobile pokazuje błąd przez `Toast.error(error.response?.data?.msg || "<lokalny komunikat>", "top")`.
Nie używamy w tych ścieżkach `Alert.alert("Błąd", ...)`.

---

## 5. Transakcje

### 5.1. Zasada

Każda operacja, która zmienia więcej niż jeden dokument, który musi pozostać spójny
(`Event.acceptedPlayers`, `Status`, `ReadyCheck`), wykonuje się w **jednej transakcji**:

```js
await mongoose.connection.transaction(async (session) => {
  const event = await eventModel.findById(eventId).session(session);
  if (event.acceptedPlayers >= event.searchedPlayers) {
    throw new ConflictError("...", "EVENT_FULL", {
      eventId,
      searchedPlayers: event.searchedPlayers,
      acceptedPlayers: event.acceptedPlayers,
    });
  }
  event.acceptedPlayers += 1; // openSlots recomputed by the pre("validate") hook
  statusDoc.status = "accepted";
  await statusDoc.save({ session });
  await event.save({ session });
});
```

Dlaczego to wystarcza bez wersjonowania i bez warunkowych update’ów: MongoDB wykrywa
konflikt zapisu na poziomie dokumentu. Dwie równoległe akceptacje ostatniego miejsca obie
zapisują ten sam dokument `Event`; druga dostaje `WriteConflict`, a
`connection.transaction()` automatycznie powtarza całą funkcję. W powtórce odczyt widzi
już `acceptedPlayers === searchedPlayers` i kończy się `EVENT_FULL`.

### 5.2. Reguły pisania kodu w transakcji

1. Wszystkie odczyty i zapisy w środku dostają `session` (`.session(session)`,
   `save({ session })`, `create([doc], { session })`, `deleteOne(filter, { session })`).
2. Dokumenty **czytamy wewnątrz** funkcji transakcji — nie używamy dokumentów pobranych
   wcześniej (np. przez middleware walidacji), bo przy powtórce byłyby nieaktualne.
3. Funkcja transakcji może zostać wykonana kilka razy, więc **nie zawiera efektów
   ubocznych**: żadnego socketu, pusha, czatu, statystyk, `console.log` z „wysłano”.
4. Wynik przekazujemy na zewnątrz przez zmienną zadeklarowaną przed transakcją
   (`let result = null;` … `result = { ... };`) — nie polegamy na wartości zwracanej.
5. Błąd rzucony w środku przerywa transakcję (rollback) i jest rzucany dalej.
6. Wywołania sieciowe (geokodowanie Mapbox, Expo Push) nigdy nie są w transakcji.

### 5.3. Co dzieje się po commicie

W tej kolejności, każde w osobnym `try/catch`, błędy tylko logowane:

1. czat grupowy (`addParticipantToGroupChat` / `removeParticipantFromGroupChat`),
2. statystyki (`userStatsModel`),
3. istniejące powiadomienia (`sendEventStatusUpdate`),
4. `notifyReadyCheckChanged(eventId)`,
5. `sendPendingOpeningPushes({ eventId })` — jeżeli ktoś dołączył do otwartego RC.

### 5.4. Wymaganie środowiskowe

Transakcje wymagają replica setu. Dev i prod działają na MongoDB Atlas (replica set) —
**założenie nie zostało zweryfikowane w kodzie**; developer potwierdza je przy pierwszym
uruchomieniu (błąd `Transaction numbers are only allowed on a replica set member or mongos`
oznacza brak replica setu, np. lokalny `mongod`).

### 5.5. Kiedy transakcja nie jest potrzebna

- Odczyty (`GET` stanu aktualnego) — klient i tak pobierze stan ponownie po sygnale.
- Pojedyncze usunięcie dokumentu RC przy usuwaniu/zakończeniu wydarzenia
  (`ReadyCheck.deleteOne({ eventID })`) — to jedna atomowa operacja. Równoległa
  transakcja, która w tym czasie modyfikuje RC, dostanie konflikt i w powtórce nie
  znajdzie dokumentu.

---

## 6. Pojemność `maxPlayers`

`maxPlayers` nie jest nigdzie zapisywane — liczy je `calculateReadyCheckSummary` z pól
eventu:

```text
maxPlayers = event.searchedPlayers + (event.organizerPlays ? 1 : 0)
```

Lista uczestników jest synchronizowana w tej samej transakcji co `Status` i
`acceptedPlayers`, więc `active = acceptedPlayers + (organizerPlays ? 1 : 0)` i zawsze
`active <= maxPlayers`:

| Operacja                                    | `acceptedPlayers` | `active` | `maxPlayers` |
| ------------------------------------------- | ----------------: | -------: | -----------: |
| Akceptacja gracza                           |              `+1` |     `+1` |    bez zmian |
| Gracz opuszcza / odrzucony                  |              `-1` |     `-1` |    bez zmian |
| Organizator `false → true`                  |         bez zmian |     `+1` |         `+1` |
| Organizator `true → false`                  |         bez zmian |     `-1` |         `-1` |
| Organizator zmienia `searchedPlayers` o `n` |         bez zmian | bez zmian |        `+n` |

Organizator nie zajmuje szukanego miejsca — jeżeli gra, jest zwykłym uczestnikiem listy
i może ustawić `ready`.

**Dlaczego nie `totalPlayers`:** Ready Check dotyczy wyłącznie osób w aplikacji. Gracze
spoza aplikacji (reszta składu organizatora) nie mogą kliknąć „gotowy” — przy
`maxPlayers = totalPlayers` Ready Check nigdy nie byłby kompletny. Skład meczu (§4.8) i
pojemność Ready Check to różne liczby.

Przykład: `11v11`, `searchedPlayers = 3`, organizator gra, zaakceptowanych 2 →
skład meczu `21/22`, `active = 3`, `maxPlayers = 4`.

---

## 7. Model `ReadyCheck`

Plik: `BoiskoPlus/server/models/readyCheckModel.js`

```js
participant = {
  userID, // ObjectId, ref "User"
  status, // "pending" | "ready" | "left" | "rejected"
  addedAt, // Date
  statusChangedAt, // Date
  notifiedAt, // Date | null — kiedy wysłano push otwarcia
};

readyCheck = {
  eventID, // ObjectId, ref "Event", unique
  eventStartAt, // Date — kopia event.startDateTime
  state, // "scheduled" | "open" | "closed" | "skipped"
  scheduleMode, // "four_hours" | "one_hour" | "skipped"
  triggerAt, // Date | null — moment otwarcia
  organizerReminderAt, // Date | null — triggerAt + 30 min
  organizerReminderCheckedAt, // Date | null — kiedy oceniono komplet (wysłano albo pominięto)
  notifiedStartAt, // Date | null — termin zakomunikowany uczestnikom
  scheduleChangeNotifyAt, // Date | null — koniec okna debounce zmiany terminu
  openedAt, // Date | null
  closedAt, // Date | null
  participants: [participant],
  createdAt,
  updatedAt, // timestamps
};
```

Nie ma pól `version`, `maxPlayers`, `history`, stanów `processing/sent/failed`, liczników
prób ani `messageId`. Stan wysyłki opisują **daty**: `null` = jeszcze nie zrobione.

### 7.1. Indeksy

```js
{ eventID: 1 }                         // unique
{ state: 1, triggerAt: 1 }             // otwieranie
{ state: 1, eventStartAt: 1 }          // zamykanie
{ state: 1, organizerReminderAt: 1 }   // przypomnienie organizatora
{ state: 1, scheduleChangeNotifyAt: 1 } // debounce zmiany terminu
```

Unikalny indeks gwarantuje jeden dokument na event. Mechanizm „self-healing” duplikatów
z planu 3.x nie jest potrzebny.

### 7.2. Kiedy dokument powstaje

- Razem z wydarzeniem, w transakcji `createEvent` — także gdy do startu jest `<= 1h`
  (`state = skipped`). Dzięki temu lista uczestników jest synchronizowana od początku.
- Po pełnym resecie bazy (§4.1) każde wydarzenie ma dokument od chwili utworzenia.
  `createOrResetReadyCheck` tworzy dokument, jeżeli go brak, wyłącznie jako
  zabezpieczenie (np. przy edycji terminu albo rolloverze).

### 7.3. Synchronizacja listy uczestników

Lista jest synchronizowana **zawsze**, niezależnie od `state` (także `scheduled`,
`skipped`, `closed`). Dzięki temu otwarcie nie musi kopiować składu i nie ma wyścigu
„ktoś dołączył w chwili otwarcia”.

| Zdarzenie                                       | Lista uczestników                                                                                                                      |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Użytkownik dostaje `accepted`                   | brak wpisu → dodaj `pending`; `left`/`rejected` → ten sam wpis wraca do `pending` z `notifiedAt = null`; `pending`/`ready` → bez zmian |
| Użytkownik sam opuszcza wydarzenie              | `left`                                                                                                                                 |
| Organizator zmienia `accepted → rejected`       | `rejected`                                                                                                                             |
| Organizator wycofuje własny udział przez edycję | `left`                                                                                                                                 |

Wpis nigdy nie jest usuwany z tablicy (poza resetem). Jeżeli dokument RC nie istnieje
(nie powinno się zdarzyć — zabezpieczenie), synchronizacja nic nie robi.

### 7.4. Zmiana gotowości

Użytkownik może zmieniać wyłącznie własny wpis: `pending ↔ ready`, tylko gdy
`state = open` i `eventStartAt > now`. `left` i `rejected` są tylko do odczytu.
Ponowne ustawienie tej samej wartości nie zapisuje niczego.

---

## 8. Podsumowanie i komplet

Backend zwraca w stanie aktualnym:

```js
summary: {
  (ready, pending, active, left, rejected, maxPlayers);
}
```

UI pokazuje `Gotowi: ready/maxPlayers` i `W składzie: active/maxPlayers`.

Komplet: `ready === maxPlayers` (przy `maxPlayers > 0`). Samo `active === maxPlayers`
oznacza pełny skład, ale nie komplet potwierdzeń.

---

## 9. Scheduler

### 9.1. Punkt wejścia

`utils/eventStatusUpdater.js` pozostaje punktem uruchamianym co minutę. Zmiany:

- `startEventStatusChecker()` wywołuje funkcję ticka chronioną flagą `isTickRunning`
  (nowy tick nie startuje, dopóki poprzedni trwa) i łapie błędy (dziś odrzucona obietnica
  z `setInterval` nie jest obsłużona),
- tick: najpierw `updateEventStatuses()` (lifecycle + rollover), potem
  `runReadyCheckTick()` z `services/readyCheckScheduler.js`,
- `updateEventStatusesManually` (`POST /football-events/update-statuses`) uruchamia ten
  sam tick — przydatne przy ręcznej weryfikacji.

### 9.2. Kolejność kroków `runReadyCheckTick(now)`

1. **Zamknij rozpoczęte**: `state ∈ {scheduled, open}` i `eventStartAt <= now` →
   `closed`, `closedAt = now`, `scheduleChangeNotifyAt = null`. Sygnał zmiany.
2. **Otwórz należne**: `state = scheduled`, `triggerAt <= now`, `eventStartAt > now` →
   w transakcji: ponowny odczyt, jeżeli nadal `scheduled` → `open`, `openedAt = now`,
   `notifiedStartAt = eventStartAt`. Sygnał zmiany. Dwie instancje serwera nie otworzą
   dokumentu dwa razy (konflikt zapisu → powtórka widzi `open`).
3. **Wyślij brakujące pushe otwarcia** (§9.3).
4. **Przypomnienie organizatora** (§9.4).
5. **Zmiany terminu po debounce** (§10.3).

Każdy dokument jest przetwarzany w osobnym `try/catch` — błąd jednego nie zatrzymuje
pozostałych.

### 9.3. Push otwarcia — „najpierw wyślij, potem zapisz datę”

Dla każdego dokumentu `open` z `eventStartAt > now` i każdego aktywnego uczestnika z
`notifiedAt = null`:

1. wyślij push `readyCheckOpened`,
2. jeżeli `result.sent > 0` albo `result.skipped` (brak tokenów — nie ma sensu ponawiać),
   ustaw w transakcji `notifiedAt = now`,
3. jeżeli wysyłka się nie udała — `notifiedAt` zostaje `null` i kolejny tick ponowi
   (aż do startu wydarzenia).

Semantyka: **co najmniej raz**. Rzadki duplikat (np. awaria między wysłaniem a zapisem)
jest akceptowany. `collapseId` = `ready-check-opened-<eventId>` ogranicza duplikaty na
urządzeniu.

Ta sama funkcja (`sendPendingOpeningPushes({ eventId })`) jest wywoływana po commicie
akceptacji uczestnika, więc nowy uczestnik otwartego RC dostaje push od razu.

### 9.4. Przypomnienie organizatora

Dokumenty `open`, `organizerReminderAt <= now`, `organizerReminderCheckedAt = null`,
`eventStartAt > now`:

1. policz podsumowanie,
2. jeżeli `ready < maxPlayers` → wyślij `readyCheckIncomplete` do organizatora,
3. ustaw `organizerReminderCheckedAt = now` (w transakcji), jeżeli push się udał albo
   nie był potrzebny. Przy nieudanej wysyłce kolejny tick ponowi.

### 9.5. Opóźnione uruchomienie po awarii

Kolejność kroków z §9.2 daje automatycznie:

- zaległy RC otwiera się, o ile wydarzenie jeszcze się nie zaczęło,
- zaległe pushe wychodzą w tym samym ticku,
- zaległe przypomnienie organizatora jest oceniane od razu,
- po starcie wydarzenia nic nie jest wysyłane (krok 1 zamyka dokument).

---

## 10. Zmiana terminu

### 10.1. Edycja eventu — w transakcji `updateEvent`

Jeżeli zmienił się `startDateTime`, wywołujemy `handleEventStartChange()`:

| Stan RC                | Działanie                                                                                          |
| ---------------------- | -------------------------------------------------------------------------------------------------- |
| brak dokumentu         | reset (tworzy dokument — zabezpieczenie)                                                           |
| `scheduled`, `skipped` | `eventStartAt` = nowy termin, przelicz harmonogram (§3.1); lista uczestników bez zmian; brak pusha |
| `open`                 | `eventStartAt` = nowy termin, `scheduleChangeNotifyAt = now + 15 min`; ready zachowane             |
| `closed`               | reset (wydarzenie przeniesione po starcie — nowy cykl)                                             |

`skipped` wraca do `scheduled`, jeżeli do nowego startu jest `> 1h`.

Anulowanie (`eventStatus = cancelled`) albo `completed` ustawione przez edycję → dokument
RC jest usuwany w tej samej transakcji.

### 10.2. Debounce

Każda kolejna edycja terminu w stanie `open` przesuwa `scheduleChangeNotifyAt` na
`now + 15 min`. Termin w RC (`eventStartAt`) jest aktualny od razu — osoby na ekranie
widzą go po sygnale zmiany. Push wychodzi dopiero po 15 minutach bez edycji.

```text
16:10  RC otwarty dla wydarzenia 20:10 (notifiedStartAt = 20:10)
16:12  zmiana na 20:11 → scheduleChangeNotifyAt = 16:27
16:14  zmiana na 20:12 → scheduleChangeNotifyAt = 16:29
16:16  zmiana na 20:13 → scheduleChangeNotifyAt = 16:31
16:31  przesunięcie 3 min < 60 min → jeden push „rozpocznie się o 20:13”
```

### 10.3. Decyzja po debounce (tick, w transakcji)

Dokumenty `open` z `scheduleChangeNotifyAt <= now`. W transakcji: ponowny odczyt (jeżeli
warunki już nie są spełnione — pomiń), `scheduleChangeNotifyAt = null`, następnie:

```text
shift     = |eventStartAt - notifiedStartAt|
toStart   = eventStartAt - now
```

| Warunek           | Ścieżka    | Działanie                                                                                                     |
| ----------------- | ---------- | ------------------------------------------------------------------------------------------------------------- |
| `shift = 0`       | bez zmiany | nic (organizator wrócił do zakomunikowanej godziny)                                                           |
| `toStart < 1h`    | cutoff     | brak pusha, `ready` zachowane, `notifiedStartAt` bez zmian                                                    |
| `shift < 60 min`  | ścieżka 1  | `notifiedStartAt = eventStartAt`; po commicie push `readyCheckTimeChanged` do aktywnych (bez organizatora)    |
| `shift >= 60 min` | ścieżka 3  | reset dokumentu w miejscu; po commicie push `eventScheduleChanged` do aktywnych po resecie (bez organizatora) |

(Ścieżka 2 z planu 3.x — duże przesunięcie przy `< 1h` do startu — to wiersz „cutoff”.)

Push zmiany terminu jest wysyłany **najwyżej raz** (data jest zapisywana przed wysyłką).
Organizator nie dostaje pushy o zmianie terminu, bo sam ją wykonał.

Reset w ścieżce 3: wszyscy aktualnie zaakceptowani wracają jako `pending`, `left`/`rejected`
z poprzedniego terminu znikają, harmonogram jest liczony od nowa (nowy `triggerAt` jest
zawsze w przyszłości, bo progi liczymy od `now`). Nowy RC wyśle standardowy
`readyCheckOpened` o swoim `triggerAt`.

Cutoff `< 1h` dotyczy wyłącznie pushy o zmianie terminu. Nie wyłącza przypomnienia
organizatora `T-30m`. `organizerReminderAt` nie zmienia się przy drobnych zmianach
godziny — tylko reset nadaje mu nową wartość.

Rzadki przypadek akceptowany: uczestnik zaakceptowany w trakcie okna debounce dostaje
push otwarcia z nową godziną, a potem także push o zmianie godziny.

---

## 11. REST API

Pliki: `server/controllers/readyCheckController.js`, `server/routes/readyCheckRouter.js`.
Montowanie w `server.js`: `app.use("/api/v1/ready-checks", authenticateUser, readyCheckRouter)`.

Parametr nazywa się `:eventID` — zgodnie z resztą routerów projektu.

| Metoda  | Endpoint                                  | Cel                                    |
| ------- | ----------------------------------------- | -------------------------------------- |
| `GET`   | `/api/v1/ready-checks/events/:eventID`    | Stan aktualny Ready Check              |
| `PATCH` | `/api/v1/ready-checks/events/:eventID/me` | Ustawienie/wycofanie własnej gotowości |

`PATCH` body: `{ "ready": true }` albo `{ "ready": false }` — wyłącznie boolean
(`"true"`, `1`, `null` → `400`). Backend mapuje `true → ready`, `false → pending`.
Odpowiedź `PATCH` = stan aktualny (jak `GET`).

### 11.1. Stan aktualny — odpowiedź

```js
{
  serverNow,
  readyCheck: { eventId, state, eventStartAt, triggerAt },
  event: { eventName, startDateTime, addressString, createdBy }, // addressString = event.location.addressString
  currentUser: {
    role: "organizer" | "participant",
    status: "pending" | "ready" | "left" | "rejected" | null
  },
  summary: { ready, pending, active, left, rejected, maxPlayers },
  participants: [
    { user: { _id, nickName, avatarUrl }, status, statusChangedAt }
  ]
}
```

Nagłówek `Cache-Control: no-store`. Klient nie liczy podsumowania sam.

### 11.2. Uprawnienia i błędy

| Sytuacja                                                  | Odpowiedź                  |
| --------------------------------------------------------- | -------------------------- |
| Nieprawidłowe ID / body                                   | `400`                      |
| Event albo dokument RC nie istnieje                       | `404`                      |
| `GET`: użytkownik nie jest organizatorem ani nie ma wpisu | `403`                      |
| `PATCH`: brak własnego wpisu albo wpis `left`/`rejected`  | `403`                      |
| `PATCH`: `state != open` albo wydarzenie już się zaczęło  | `409 READY_CHECK_NOT_OPEN` |

`GET` jest dostępny dla organizatora (także niegrającego) oraz wpisów `left`/`rejected`.

### 11.3. Opuszczenie wydarzenia

Przycisk „Opuść wydarzenie” używa istniejącego `DELETE /api/v1/status/events/:eventID/leave`
(po zmianach z §4 synchronizuje listę uczestników na `left` w tej samej transakcji).

---

## 12. Namespace Socket.IO `/ready-check`

### 12.1. Dlaczego osobny namespace

- funkcja eksperymentalna — można ją zmienić/wyłączyć bez ryzyka dla `/chat` i
  `/notifications`,
- połączenie potrzebne tylko na jednym ekranie,
- własne zasady dostępu,
- prosty, czytelny kod w jednym pliku.

### 12.2. Backend

Pliki:

- `server/socket/socketAuth.js` — wydzielona z `socketHandler.V2.js` funkcja
  `authenticateSocket(socket)` (odczyt tokena z cookie / `auth.token` / query / nagłówka,
  `verifyJWT`, ustawienie `socket.userID`, `socket.data.userID`). `authMiddleware` w V2
  korzysta z niej i nadal sam zapisuje `socketUserMap`.
- `server/socket/readyCheckSocketHandler.js` — `setupReadyCheckNamespace(namespace)` i
  `notifyReadyCheckChanged(eventId)`; rejestrowany w `initializeSocket()`.

Pokój: `ready-check:<eventId>`.

| Kierunek        | Zdarzenie           | Payload       | Uwagi                                                            |
| --------------- | ------------------- | ------------- | ---------------------------------------------------------------- |
| klient → serwer | `subscribe`         | `{ eventId }` | ACK wymagany: `{ success: true }` albo `{ success: false, msg }` |
| klient → serwer | `unsubscribe`       | `{ eventId }` | ACK opcjonalny                                                   |
| serwer → klient | `readyCheckChanged` | `{ eventId }` | tylko sygnał; klient wykonuje `GET`                              |

`subscribe` sprawdza w MongoDB przed `socket.join()`: dokument RC istnieje i użytkownik
jest organizatorem albo ma wpis w liście uczestników.

`connectionStateRecovery` (globalne, `skipMiddlewares: true`) może odtworzyć pokoje bez
autoryzacji. Dlatego przy każdym `connection` handler opuszcza wszystkie pokoje
`ready-check:*`, a klient po każdym `connect` subskrybuje ponownie. `userID` przy
odtworzonym połączeniu jest brany z `socket.data` (wzorem `/chat`).

Sygnał jest emitowany **po commicie** przez controller albo scheduler — nigdy z wnętrza
transakcji i nigdy z serwisu.

### 12.3. Mobile

Hook `assets/hooks/useReadyCheck.js` (jedyny konsument namespace’u):

1. ekran aktywny (focus) i aplikacja na pierwszym planie → utwórz socket
   `${getSocketUrl()}/ready-check` z tokenem z `SecureStore` (`"authToken"`),
2. po każdym `connect`: `subscribe({ eventId })` → po ACK wykonaj `GET`,
3. `readyCheckChanged` z tym `eventId` → `GET`,
4. utrata focusu / tło / unmount → `unsubscribe` + `disconnect`,
5. powrót → nowy socket, `subscribe`, `GET`,
6. gdy dwa `GET` nakładają się, hook stosuje tylko odpowiedź na **najnowsze** żądanie
   (licznik żądań w `useRef`); odpowiedź `PATCH` też jest takim żądaniem.

Kolejność „najpierw subskrypcja, potem `GET`” gwarantuje, że żadna zmiana nie zginie
między odczytem a dołączeniem do pokoju — bez numerów wersji.

Błąd socketu nie blokuje REST: ekran działa bez live (wskaźnik „brak połączenia live”).

---

## 13. Push i routing mobilny

Godziny i daty w treściach pushy formatuje serwer ze `startDateTime` funkcjami
`formatEventTime` / `formatEventDate` z `utils/eventDateFormat.js` (strefa
`Europe/Warsaw`, §4.6). Pola `startHour` / `startDate` nie istnieją.

| `type`                  | Odbiorca                    | `data`                                                          | Trasa po kliknięciu                                   |
| ----------------------- | --------------------------- | --------------------------------------------------------------- | ----------------------------------------------------- |
| `readyCheckOpened`      | aktywni uczestnicy          | `{ type, screen: "ready-check", eventId }`                      | `/(auth)/ready-check?eventId=`                        |
| `readyCheckIncomplete`  | organizator                 | `{ type, screen: "event-management", eventId, tab: "players" }` | `/(auth)/events-managment/edit-event?id=&tab=players` |
| `readyCheckTimeChanged` | aktywni bez organizatora    | `{ type, screen: "ready-check", eventId }`                      | `/(auth)/ready-check?eventId=`                        |
| `eventScheduleChanged`  | aktywni po resecie bez org. | `{ type, screen: "single-event", eventId }`                     | `/(auth)/single-event?id=`                            |

Treści:

- `readyCheckOpened`: „Ready Check: [nazwa]” / „Potwierdź obecność. Start o [HH:mm].”
- `readyCheckIncomplete`: „Nie masz kompletu” / „[nazwa]: gotowi X/Y, w składzie Z/Y. Zarządzaj uczestnikami.”
- `readyCheckTimeChanged`: „Zmieniono godzinę wydarzenia” / „[nazwa] rozpocznie się o [HH:mm]. Sprawdź swój Ready Check.”
- `eventScheduleChanged`: „Zmieniono termin wydarzenia” / „[nazwa]: nowy termin [data] [HH:mm]. Sprawdź informacje o wydarzeniu.”

Wszystkie: `channelId: "ready-checks"`, `notificationType = null`.

Mobile (`context/NotificationContext.jsx`):

- kanał Android `ready-checks` (importance HIGH),
- foreground: dla czterech typów powyżej handler zwraca widoczny banner i dźwięk; dla
  pozostałych typów zachowanie bez zmian,
- `resolveNotificationRoute`: cztery nowe trasy (przed istniejącymi warunkami),
- `navigateFromNotification`: dla tych typów **nie** wywołuje `markEventAsRead` ani
  `clearInvite`,
- `edit-event.jsx` odczytuje parametr `tab` (`"players"` → zakładka uczestników).

---

## 14. Ekran mobilny

Trasa: `app/(auth)/ready-check.jsx`, parametr `eventId`.

Nowe komponenty (`components/ready-check/`): `ReadyCheckHeader.jsx`, `ReadyCheckTabs.jsx`,
`ReadyCheckParticipantRow.jsx`. Modal opuszczenia: istniejący
`components/popup/ConfirmModal.jsx` rozszerzony o opcjonalny prop `confirmDelaySeconds`
(domyślnie `0` — dotychczasowe użycia bez zmian).

Styl: `Theme/` + `useThemedStyles`. Bez `scaleUI.UX`.

### 14.1. Górna część

Nazwa, data i godzina, czas do startu (liczony względem `serverNow`), stan RC,
`Gotowi: ready/maxPlayers`, `W składzie: active/maxPlayers`, wskaźnik live.

Stany specjalne:

- `scheduled` → „Ready Check otworzy się o HH:mm”, akcje nieaktywne,
- `skipped` → „Ready Check nie jest aktywny dla tego terminu”,
- `closed` → „Wydarzenie się rozpoczęło”, tylko odczyt,
- `404` → „Ready Check nie jest dostępny” + przycisk powrotu.

### 14.2. Zakładki (domyślnie `Oczekujący`)

| Zakładka     | Zawartość                                 |
| ------------ | ----------------------------------------- |
| `Oczekujący` | `pending`                                 |
| `Gotowi`     | `ready`                                   |
| `Odeszli`    | `left` i `rejected` z osobnymi etykietami |

Liczniki zakładek pochodzą z `summary`.

### 14.3. Przycisk pod zakładkami

| Zakładka     | Przycisk             | Aktywny gdy                                                        |
| ------------ | -------------------- | ------------------------------------------------------------------ |
| `Oczekujący` | `Potwierdź obecność` | własny status `pending`, `state = open`                            |
| `Gotowi`     | `Wycofaj gotowość`   | własny status `ready`, `state = open`                              |
| `Odeszli`    | `Opuść wydarzenie`   | własny status `pending`/`ready`, użytkownik nie jest organizatorem |

Nieaktywny przycisk pokazuje krótkie wyjaśnienie. Backend waliduje to samo niezależnie.

### 14.4. Gotowość

`PATCH .../me` z `{ ready }`. W trakcie: przycisk zablokowany + loader; UI przyjmuje
stan z odpowiedzi; błąd → `Toast.error(msg, "top")`, poprzedni stan zostaje.

### 14.5. Opuszczenie — modal 5 sekund

`ConfirmModal` z `confirmDelaySeconds={5}`: „Na pewno chcesz opuścić wydarzenie?”,
przycisk `Tak (5)` … `Tak (1)` → aktywne `Tak`. Zamknięcie resetuje licznik. Po
kliknięciu: loading, `DELETE /status/events/:eventID/leave`, po sukcesie odświeżenie
stanu — użytkownik jest w `Odeszli`, ekran zostaje w trybie tylko do odczytu. Toast po
zamknięciu modala przez `InteractionManager.runAfterInteractions` (wzorem
`single-event.jsx`).

### 14.6. Layout

`CustomTabBar` ukryty na `ready-check` (jak na `chat-room`). Trasa zarejestrowana w
`app/(auth)/_layout.jsx`.

---

## 15. Tabela synchronizacji

| Operacja                              | `Status`          |         `acceptedPlayers` | Lista uczestników RC           | Transakcja |
| ------------------------------------- | ----------------- | ------------------------: | ------------------------------ | ---------- |
| Akceptacja zainteresowanego           | `accepted`        |                      `+1` | dodaj/przywróć `pending`       | tak        |
| Akceptacja zaproszenia                | `accepted`        |                      `+1` | dodaj/przywróć `pending`       | tak        |
| Gracz opuszcza event                  | usunięty          | `-1` jeśli był `accepted` | `left`                         | tak        |
| Organizator odrzuca gracza            | `rejected`        | `-1` jeśli był `accepted` | `rejected`                     | tak        |
| Organizator `false → true`            | utwórz `accepted` |                 bez zmian | dodaj/przywróć `pending`       | tak        |
| Organizator `true → false`            | usuń              |                 bez zmian | `left`                         | tak        |
| Organizator zmienia `searchedPlayers` | bez zmian         |                 bez zmian | bez zmian                      | tak        |
| Gracz potwierdza / wycofuje           | bez zmian         |                 bez zmian | `ready` / `pending`            | tak        |
| Start wydarzenia                      | bez zmian         |                 bez zmian | RC `closed`, statusy zachowane | tak        |

`openSlots` zmienia się zawsze przeciwnie do `acceptedPlayers` (hook przy `save()`).

Po każdej z tych operacji (po commicie): `notifyReadyCheckChanged(eventId)`.

---

## 16. Eventy cykliczne, usuwanie, anulowanie, zakończenie

### 16.1. Rollover wydarzenia cyklicznego

W `updateEventStatuses()` przesunięcie o 7 dni wykonuje się w transakcji razem z resetem
RC:

- odczyt eventu warunkowany starym `endDateTime` (`findOne({ _id, endDateTime: stare })`),
  zmiana `startDateTime` (+7 dni) i `eventStatus`, zapis przez `save()` — `endDateTime`
  przelicza hook (§4.6); drugi tick (albo powtórka transakcji) nie znajdzie dokumentu ze
  starym `endDateTime` i nie przesunie eventu drugi raz,
- nie ma już `startDate` do zapisania; komunikat o nowym terminie formatuje
  `formatEventDate` / `formatEventTime` (czas polski),
- reset RC (tworzy dokument, jeżeli go nie ma): bieżący skład `accepted` jako `pending`,
  tryb `T-4h`,
- stare odpowiedzi `ready` nie przechodzą na kolejny termin,
- brak pusha z Ready Check (istniejące powiadomienia o rolloverze bez zmian),
- sygnał zmiany po commicie.

### 16.2. Usunięcie, anulowanie, zakończenie

| Operacja                                        | Skutek dla RC                       |
| ----------------------------------------------- | ----------------------------------- |
| Usunięcie eventu (`deleteEvent`)                | `ReadyCheck.deleteOne({ eventID })` |
| Anulowanie (`eventStatus = cancelled` w edycji) | usunięcie w transakcji edycji       |
| Ręczne zakończenie (`markEventAsFinished`)      | `ReadyCheck.deleteOne({ eventID })` |
| Automatyczne zakończenie (scheduler)            | dokument zostaje (`closed`)         |

Po usunięciu: sygnał zmiany → otwarty ekran wykonuje `GET`, dostaje `404` i pokazuje
„Ready Check nie jest dostępny”. Żadne zaplanowane pushe nie wyjdą, bo dokumentu nie ma.

---

## 17. Zakres zmian w plikach

### Backend `BoiskoPlus/server`

Nowe pliki (10):

| Plik                                  | Odpowiedzialność                                                                          |
| ------------------------------------- | ----------------------------------------------------------------------------------------- |
| `utils/eventFields.js`                | czyste funkcje pól liczonych eventu (§4.6)                                                |
| `utils/eventDateFormat.js`            | data i godzina w strefie `Europe/Warsaw` dla treści serwera (§4.6)                        |
| `models/readyCheckModel.js`           | schemat i indeksy                                                                         |
| `services/eventParticipantService.js` | transakcyjne zmiany uczestnictwa i `acceptedPlayers`                                      |
| `services/readyCheckService.js`       | harmonogram, tworzenie/reset, synchronizacja listy, podsumowanie, stan aktualny, gotowość |
| `services/readyCheckScheduler.js`     | kroki ticka: zamykanie, otwieranie, pushe, przypomnienie, debounce                        |
| `controllers/readyCheckController.js` | `GET` i `PATCH`                                                                           |
| `routes/readyCheckRouter.js`          | routing                                                                                   |
| `socket/socketAuth.js`                | wspólne uwierzytelnienie socketów                                                         |
| `socket/readyCheckSocketHandler.js`   | namespace `/ready-check` i sygnał zmiany                                                  |

Pliki modyfikowane:

```text
models/eventModel.js
utils/constants.js
errors/customErrors.js
middleware/errorHandlerMW.js
middleware/validationMW.js
controllers/statusController.js
controllers/eventController.js
controllers/notificationController.js
utils/eventStatusUpdater.js
utils/pushService.js
socket/socketHandler.V2.js
server.js
```

### Mobile `BoiskoPlus-mobile`

Nowe pliki:

```text
app/(auth)/ready-check.jsx
assets/hooks/useReadyCheck.js
components/ready-check/ReadyCheckHeader.jsx
components/ready-check/ReadyCheckTabs.jsx
components/ready-check/ReadyCheckParticipantRow.jsx
```

Pliki modyfikowane:

```text
context/NotificationContext.jsx
context/SocketIoContext.jsx          (tylko export getSocketUrl / getSocketOptions)
assets/utils/eventDisplay.js
assets/utils/eventsApi.js
assets/utils/geoDistance.js
components/FormEvent.jsx
components/Cards/EventSimpleCard.jsx
components/popup/ConfirmModal.jsx
components/popup/EventMarkerEventList.jsx
components/MapboxMobile.jsx
components/events/UpcomingEventsTab.jsx
app/(auth)/single-event.jsx
app/(auth)/dashboard-home.jsx
app/(auth)/show-map.jsx
app/(auth)/events-managment/edit-event.jsx
app/(auth)/events-managment/events-dashboard.jsx
app/(auth)/_layout.jsx
Navigation/CustomTabBar.jsx
```

`components/FindEventListElement.jsx` nie jest nigdzie importowany — nie aktualizujemy go
(usunięcie: decyzja developera, §22).

---

## 18. Kolejność wdrożenia

Wszystkie fazy: ⏳ **do zrobienia**. Szczegóły zadań, modele wykonawcze i kryteria
akceptacji: [PLAN-PRAC-ready-check-4.0.md](PLAN-PRAC-ready-check-4.0.md).

| Faza | Zakres                                                  | Status |
| ---- | ------------------------------------------------------- | ------ |
| 0    | Nowy model `Event` (backend + mobile), reset bazy       | ⏳     |
| A    | Infrastruktura błędów                                   | ⏳     |
| B    | Transakcyjny serwis uczestnictwa, licznik `acceptedPlayers` | ⏳ |
| C    | Model i serwis Ready Check                              | ⏳     |
| D    | Namespace `/ready-check` (backend)                      | ⏳     |
| E    | Podpięcie RC do create/edit/delete/finish/rollover      | ⏳     |
| F    | Push i scheduler                                        | ⏳     |
| G    | REST Ready Check                                        | ⏳     |
| H    | Mobile: komunikaty błędów                               | ⏳     |
| I    | Mobile: powiadomienia, routing, layout                  | ⏳     |
| J    | Mobile: hook, ekran, komponenty, modal                  | ⏳     |
| K    | Weryfikacja manualna                                    | ⏳     |

---

## 19. Checklista weryfikacji manualnej

Bez testów automatycznych. Najważniejszy scenariusz, którego błędu nie widać w kodzie,
a który trwale psuje dane: **równoległa akceptacja ostatniego miejsca** (19.1.9) —
sprawdzić na dwóch sesjach (np. dwa równoległe requesty z Postmana).

### 19.0. Model `Event` (Bramka 0)

1. Po resecie bazy rejestracja i logowanie działają.
2. Utworzenie `11v11`, szukam 2 → w bazie `totalPlayers: 22`, `searchedPlayers: 2`,
   `acceptedPlayers: 0`, `openSlots: 2`, `endDateTime` policzone, `location.addressString`
   i `location.geolocation` ustawione; brak starych pól (§4.3).
3. Formularz: „Format gry” przed „Ilu graczy szukasz”, plus po prawej, „Podgląd” `20/22`;
   `other` → `0/2` (organizator gra → `1/3`).
4. Walidacja: `11v11` + organizator gra + szukam 22 → `400`; szukam 0 → `400`; `other` 999
   → ok, 1000 → `400`; `ageMin > ageMax` → `400`.
5. Edycja wypełnia datę i godzinę ze `startDateTime` (czas lokalny, bez przesunięcia o
   strefę); zmiana formatu, czasu trwania i adresu przelicza `totalPlayers`,
   `endDateTime`, `location.addressString`/`geolocation`.
6. Ekrany: „Uczestnicy” = skład meczu (§4.8); „Poszukiwani” / „WOLNE MIEJSCA” = `openSlots`.
7. Wyszukiwarka: filtr `minOpenSlots`, filtr wieku, eventy z `openSlots = 0` ukryte;
   pinezki mapy i odległość działają.
8. Lista nieprzeczytanych powiadomień pokazuje nazwę eventu; komunikat rolloveru ma datę
   i godzinę w czasie polskim.
9. W kodzie mobile nie ma już komentarzy `TEMPORARY FIX`.
10. Stare buildy aplikacji nie są wspierane (backend i nowy build wdrażane razem).

### 19.1. Liczniki składu

1. Utworzenie eventu przez grającego organizatora → `acceptedPlayers: 0`, istnieje
   `Status accepted` organizatora.
2. Organizator `true → false`: liczniki bez zmian, `Status` organizatora usunięty.
3. Organizator `false → true`: liczniki bez zmian, `Status` utworzony; `NvN` z
   `searchedPlayers = totalPlayers` → `400`.
4. Organizator nie może użyć `leave` (`403 ORGANIZER_CANNOT_LEAVE`).
5. Organizator nie może zmienić własnego `Status` endpointem zarządzania (`400`).
6. Zaakceptowany gracz opuszczający event → `acceptedPlayers -1`, `openSlots +1`;
   `interested` — bez zmian.
7. `openSlots = 0` pozwala na `interested`, blokuje każde przejście do `accepted` (`409`).
8. Dwukrotna akceptacja tego samego gracza liczy się tylko raz.
9. Dwie równoległe akceptacje na ostatnie miejsce → jedno `accepted`, jedno `409 EVENT_FULL`.
10. Zawsze `0 <= acceptedPlayers <= searchedPlayers` i
    `openSlots = searchedPlayers - acceptedPlayers`.
11. Edycja pełnego eventu (`openSlots = 0`) zapisuje się (np. zmiana opisu).
12. Edycja `searchedPlayers < acceptedPlayers` → `409 SEARCHED_BELOW_ACCEPTED`; równe → ok.
13. Edycja z formularza otwartego przed akceptacją gracza nie „oddaje” jego miejsca
    (`searchedPlayers` jest wartością absolutną).
14. Mobile pokazuje dokładny `msg` serwera przez `Toast.error`.

### 19.2. Transakcje

1. Błąd w środku operacji (np. `EVENT_FULL`) nie zostawia częściowego zapisu
   (`Status` bez zmiany `acceptedPlayers`).
2. Czat/statystyki/push nie są wykonywane, gdy transakcja się nie powiodła.

### 19.3. Harmonogram

1. `4h01m` do startu → `four_hours`; dokładnie `4h` → `one_hour`; `1h01m` → `one_hour`;
   dokładnie `1h` → `skipped`.
2. Edycja terminu przed otwarciem aktualizuje ten sam dokument bez pusha.
3. `skipped` po przełożeniu na `> 1h` wraca do `scheduled`.
4. Edycje `20:11 → 20:12 → 20:13` po otwarciu → jeden push z `20:13` po 15 minutach ciszy.
5. Powrót do zakomunikowanej godziny → brak pusha.
6. Przesunięcie `59 min` zachowuje `ready`; `60 min` przy `>= 1h` do startu → reset,
   wszyscy `pending`, push `eventScheduleChanged` do `single-event`.
7. Przesunięcie przy `< 1h` do startu → brak pusha, `ready` zachowane.
8. Cutoff nie wyłącza przypomnienia organizatora `T-30m`.
9. Restart serwera po `triggerAt` → zaległy RC otwiera się raz; po starcie nic nie wychodzi.
10. Nakładające się ticki nie startują (flaga `isTickRunning`).

### 19.4. Uczestnicy

1. Każdy `accepted` jest na liście jako `pending`; `interested`/`invited` — nie.
2. `pending ↔ ready` tylko we własnym wpisie, tylko w `open`.
3. Opuszczenie → `left`; odrzucenie → `rejected`; wpis zostaje.
4. Ponowna akceptacja przywraca ten sam wpis do `pending`.
5. Gracz zaakceptowany po otwarciu dostaje push od razu i pojawia się na ekranie.
6. Organizator grający może ustawić `ready`.

### 19.5. Powiadomienia

1. Jeden push otwarcia na uczestnika; wyciszenie eventu go nie blokuje.
2. Komplet przed `+30 min` → brak pusha organizatora; `4/5 ready` → push.
3. Osiągnięcie kompletu nie generuje pusha.
4. Push uczestnika otwiera Ready Check; push organizatora otwiera `edit-event` na
   zakładce uczestników; `eventScheduleChanged` otwiera `single-event`.
5. Foreground pokazuje banner dla pushy Ready Check; pozostałe typy bez zmian.
6. Kliknięcie pusha Ready Check nie oznacza eventu jako przeczytanego.

### 19.6. Socket i REST

1. Obcy użytkownik nie może pobrać stanu ani zasubskrybować pokoju.
2. Organizator niegrający i wpisy `left`/`rejected` mogą pobrać stan.
3. Zmiana innego gracza pojawia się na ekranie bez ręcznego odświeżania.
4. Poza ekranem aplikacja nie utrzymuje `/ready-check`.
5. Powrót z tła → reconnect, `subscribe`, `GET`.
6. Błąd socketu nie blokuje zmiany gotowości przez REST.
7. `PATCH` odrzuca `"true"`, `1`, `null`, brak pola.
8. `PATCH` po starcie wydarzenia (także przed tickiem) → `409`.
9. Usunięcie/anulowanie/zakończenie eventu przy otwartym ekranie → ekran pokazuje
   „Ready Check nie jest dostępny”.
10. `/chat` i `/notifications` działają bez zmian po wydzieleniu `socketAuth.js`.

### 19.7. UI

1. Domyślna zakładka `Oczekujący`; liczniki zgodne z `summary`.
2. `left` i `rejected` w jednej zakładce z różnymi etykietami.
3. Przycisk zależy od zakładki i własnego statusu; organizator nie może opuścić.
4. Modal blokuje `Tak` przez 5 sekund; ponowne otwarcie resetuje licznik.
5. Inne użycia `ConfirmModal` działają jak wcześniej.
6. Tab bar ukryty na ekranie Ready Check.

### 19.8. Eventy cykliczne

1. Rollover resetuje dokument (ten sam `_id`), wszyscy `pending`.
2. Rollover przelicza `endDateTime`; data w komunikacie jest w czasie polskim.
3. Wynik Ready Check nie zatrzymuje serii.

---

## 20. Kryteria ukończenia MVP

- nowy model `Event` (§4.4) w bazie i w aplikacji, brak starych nazw pól,
- liczniki `acceptedPlayers` / `openSlots` spójne we wszystkich ścieżkach, w transakcjach,
- konflikty pojemności zwracają `code` + `msg`, mobile pokazuje `Toast.error`,
- organizator nie może opuścić eventu ani zmienić własnego `Status` endpointem uczestnika,
- jeden dokument RC na event, tworzony z wydarzeniem, resetowany zamiast usuwany przy
  zmianie terminu/rolloverze,
- `maxPlayers` liczone (`searchedPlayers + (organizerPlays ? 1 : 0)`), nie przechowywane,
- lista uczestników zachowuje `pending/ready/left/rejected`,
- gotowość zmieniana tylko przez REST,
- ekran odświeża się po sygnałach `/ready-check`, a reconnect zawsze kończy się `GET`,
- pushe: otwarcie, przypomnienie organizatora, zmiana godziny (debounce), zmiana terminu
  (reset), wszystkie z poprawnym routingiem,
- usunięcie/anulowanie/ręczne zakończenie usuwa RC bez pushy,
- Ready Check nie wpływa na przejście do `LIVE`,
- trzy zakładki i modal opuszczenia z timerem 5 sekund.

---

## 21. Decyzje wersji 4.0 i 4.1

### Decyzje 4.0 (zmiany względem 3.x)

1. **Transakcje tak, wersjonowanie nie.** Usunięte: `version`, wersje w payloadach i ACK,
   wykrywanie luk, `readyCheckReplaced`. Spójność listy zapewnia kolejność
   „subskrypcja → `GET`” (wzorem czatu).
2. **Jeden stały dokument na event.** Reset w miejscu zamiast usuwania i tworzenia.
   API i pokój po `eventId`; `readyCheckId` nie występuje w API ani pushach.
3. **Daty zamiast maszyn stanów pushy.** `notifiedAt`, `organizerReminderCheckedAt`,
   `notifiedStartAt`, `scheduleChangeNotifyAt`. Push otwarcia „co najmniej raz”, push
   zmiany terminu „najwyżej raz”.
4. **Osobny namespace `/ready-check` zostaje** (funkcja eksperymentalna, stare wersje
   aplikacji, czytelność), ale z samymi sygnałami bez danych.
5. **Folder `services/`** — 4 pliki z jasnym podziałem odpowiedzialności (zamiast 7 w 3.x).
6. **Lista uczestników synchronizowana zawsze**, niezależnie od stanu RC; RC tworzony
   razem z eventem.
7. ~~Bez migracji; stare eventy dostają RC przy edycji terminu albo rolloverze.~~
   _(zastąpione w 4.1 — reset bazy)_
8. ~~`maxPlayers = Math.max(0, playerCount) + active`.~~ _(zastąpione w 4.1)_
9. ~~`previousPlayerCount` w edycji eventu.~~ _(zastąpione w 4.1)_
10. ~~Kod `PLAYER_COUNT_CHANGED`.~~ _(zastąpione w 4.1)_
11. **Organizator nie zmienia własnego `Status`** endpointem zarządzania uczestnikami.
12. **Organizator nie dostaje pushy o zmianie terminu** (sam ją wykonał).
13. Nazewnictwo: słowo „snapshot” usunięte — patrz §1.

### Decyzje 4.1 (zmiany względem 4.0)

1. **Pełny reset bazy** (wszystkie kolekcje, także użytkownicy). Bez migracji. Stare buildy
   aplikacji są niekompatybilne — backend i nowy build wdrażane razem.
2. **Nowe nazwy pól** — tabela §4.3 (`location`, `durationMinutes`, `venueType`,
   `organizerPlays`, `ageMin`/`ageMax`, `searchedPlayers`).
3. **Format jako tabela wartości** (`EVENT_FORMATS` z `totalPlayers`, §4.5) zamiast
   tablicy stringów; `other` ma `totalPlayers: null`.
4. **Trzy liczniki zamiast malejącego `playerCount`:** `searchedPlayers` (organizator),
   `acceptedPlayers` (backend), `openSlots` (przechowywane, żeby filtrować bez `$expr`).
5. **Organizator nigdy nie zajmuje miejsca.** `organizerPlays` tylko tworzy/usuwa jego
   `Status`. Kod `ORGANIZER_PARTICIPATION_REQUIRES_SLOT` usunięty.
6. **`previousPlayerCount` i `PLAYER_COUNT_CHANGED` zastąpione przez
   `SEARCHED_BELOW_ACCEPTED`** — `searchedPlayers` jest wartością absolutną.
7. **`maxPlayers = searchedPlayers + (organizerPlays ? 1 : 0)`** (§6).
8. **`startDate` i `startHour` usunięte.** Jedyne źródło czasu to `startDateTime`; serwer
   formatuje datę w strefie `Europe/Warsaw` (`eventDateFormat.js`).
9. **Pola liczone tylko przez hook `pre("validate")`**; ich dane wejściowe zmieniane
   wyłącznie przez `save()` / `create()`.
10. **Hook `post("save")` tworzący czat usunięty** (czat tworzy `createEvent`).
11. **Jeden walidator `validateEventInput`** dla `POST` i `PATCH`; zadanie A2 z 4.0
    usunięte.

---

## 22. Poza zakresem / zauważone przy researchu

Nie naprawiamy w tym wdrożeniu, do decyzji w przyszłości:

- `validateEventInput` odrzuca edycję wydarzenia, którego start już minął (np. zmiana
  opisu wydarzenia `LIVE`).
- `POST /football-events/update-statuses` może wywołać każdy zalogowany użytkownik.
- Rollover przesuwa `startDateTime` o `7 * 24h`. Przy zmianie czasu (DST) między
  terminami lokalna godzina wydarzenia przesuwa się o 1h. Nie naprawiamy w 4.1.
- `components/FindEventListElement.jsx` nie jest nigdzie używany (stary komponent).
  Usunięcie pliku — decyzja developera; Faza 0 go nie aktualizuje.
- Namespace `/notifications` zapisuje `socketUserMap` w `authMiddleware`, ale nie usuwa
  wpisu przy rozłączeniu.
- Wejście na ekran Ready Check jest możliwe tylko z pusha. Przycisk „Ready Check” na
  `single-event` dla zaakceptowanych uczestników byłby naturalnym rozszerzeniem.
- Archiwum Ready Check, statystyki obecności, automatyczne decyzje organizatora.
