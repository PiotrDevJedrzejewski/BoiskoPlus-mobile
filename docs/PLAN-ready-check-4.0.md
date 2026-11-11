# PLAN 4.0 — Ready Check wydarzeń

Data: 2026-10-29
Wersja: 4.0 — transakcje bez wersjonowania, jeden stały dokument na event, sygnały
socketowe bez danych, `maxPlayers` liczone zamiast przechowywane
Status: **nic nie jest zaimplementowane** (implementacja Faz 1–4 z planu 3.x została
w całości cofnięta)
Zakres: `BoiskoPlus/server` oraz aplikacja `BoiskoPlus-mobile`
(`BoiskoPlus/client` to nieutrzymywany prototyp web — **nie dotykamy go**)

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
| **`playerCount`**                 | Pole `Event` — bieżąca liczba **wolnych** miejsc („Ilu graczy szukasz”). Nigdy nie obejmuje organizatora.                                                                                  |
| **Aktywni (`active`)**            | Uczestnicy listy ze statusem `pending` lub `ready`.                                                                                                                                        |
| **Pojemność (`maxPlayers`)**      | Wartość **liczona przy każdym odczycie**: `Math.max(0, event.playerCount) + active`. Nie jest zapisywana w bazie.                                                                          |
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

## 4. Integralność `playerCount` (etap zerowy)

### 4.1. Stan obecny (zweryfikowany w kodzie 2026-10-29)

- `statusController.updateUserStatus`: zapisuje `Status`, potem osobno
  `$inc: { playerCount: -1 }` z `runValidators: false` — licznik może zejść poniżej zera,
  a dwukrotne `accepted` zmniejsza go dwa razy.
- `statusController.respondToInvite`: przyjęcie zaproszenia nie sprawdza wolnych miejsc.
- `statusController.leaveEvent`: nie blokuje organizatora; `+1` w osobnym `try/catch`.
- `eventController.updateEvent`: nadpisuje `playerCount` wartością z formularza (wyścig
  z równoległą akceptacją), a zmiana `isParticipating` nie koryguje licznika o `±1`.
- `validateEventInput` (także dla `PATCH`) wymaga `playerCount >= 1` i startu w
  przyszłości — pełnego eventu (`0`) nie da się zapisać.
- `FormEvent.jsx` ogranicza wartość do 0–999 tylko po stronie aplikacji; `validateForm`
  nie sprawdza liczby miejsc.
- Żaden `catch` w `statusController` nie przekazuje `err.statusCode` — każdy błąd to `500`.
- W całym backendzie nie ma transakcji.

### 4.2. Docelowe reguły

| Operacja                                     | Zmiana `playerCount` |
| -------------------------------------------- | -------------------: |
| Organizator tworzy event i zaznacza udział   |            Bez zmian |
| Organizator edytuje udział `true → false`    |                 `+1` |
| Organizator edytuje udział `false → true`    |                 `-1` |
| Gracz przechodzi na `accepted`               |                 `-1` |
| Gracz przechodzi z `accepted` na inny status |                 `+1` |
| Zaakceptowany gracz opuszcza wydarzenie      |                 `+1` |
| `interested` opuszcza wydarzenie             |            Bez zmian |
| Ponowne ustawienie tego samego statusu       |    Bez zmian (no-op) |

Żadna operacja **zajmująca** miejsce nie może zejść poniżej `0`. Zajęcie miejsca przy
`playerCount <= 0` kończy się błędem `409`.

`playerCount = 0` nie blokuje zgłoszenia `interested` (lista oczekujących).

### 4.3. Organizator

- Nie może użyć `DELETE /status/events/:eventID/leave` → `403 ORGANIZER_CANNOT_LEAVE`.
- Nie może zmienić **własnego** `Status` przez
  `PATCH /status/events/:eventID/users/:userID/status` → `400` z komunikatem
  „Swój udział zmieniasz w edycji wydarzenia” (inaczej `Status` rozjechałby się z
  `isParticipating`).
- Swój udział zmienia wyłącznie przez edycję eventu (`isParticipating`).

### 4.4. Edycja liczby miejsc — `previousPlayerCount`

Formularz edycji pokazuje `playerCount` z chwili otwarcia. Jeżeli w międzyczasie ktoś
został zaakceptowany, nadpisanie wartością z formularza „oddałoby” zajęte miejsce.

Dlatego `FormEvent.jsx` w trybie edycji wysyła dodatkowo `previousPlayerCount` (wartość,
którą formularz dostał przy otwarciu). Backend w transakcji stosuje **różnicę**:

```text
manualChange   = requestedPlayerCount - (previousPlayerCount ?? currentPlayerCount)
newPlayerCount = currentPlayerCount + manualChange
               + 1 jeżeli organizator przechodzi true → false
               - 1 jeżeli organizator przechodzi false → true
```

- Stara wersja aplikacji nie wysyła `previousPlayerCount` → przyjmujemy
  `previousPlayerCount = currentPlayerCount` (zachowanie jak dotychczas: nadpisanie).
- `false → true` przy braku miejsca (`newPlayerCount` przed odjęciem `<= 0`) →
  `409 ORGANIZER_PARTICIPATION_REQUIRES_SLOT`.
- Wynik `< 0` przy `manualChange < 0` → `409 PLAYER_COUNT_CHANGED` (ktoś zajął miejsce
  w międzyczasie albo organizator próbuje zejść poniżej zera).
- Wynik `< 0` przy `manualChange >= 0` jest dozwolony — dotyczy wyłącznie starych danych
  z ujemnym licznikiem; edycja nie może ich pogarszać, ale nie blokuje zapisu.

### 4.5. Walidacja tworzenia i edycji

- Tworzenie (`POST /football-events`): bez zmian — `playerCount >= 1`.
- Edycja (`PATCH /football-events/:eventID`): nowa walidacja `validateEventUpdateInput`
  z tymi samymi regułami pól, ale `playerCount >= 0` oraz opcjonalnym
  `previousPlayerCount` (liczba całkowita, może być ujemna dla starych danych).
- Reguła „start nie może być w przeszłości” zostaje w obu walidacjach (bez zmiany
  zachowania — patrz §21).

### 4.6. Kontrakt błędów

Błąd biznesowy zwraca:

```js
{
  (msg, code, details);
}
```

| Sytuacja                                             | HTTP / `code`                               | `msg`                                                                                      |
| ---------------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Organizator włącza swój udział bez wolnego miejsca   | `409 ORGANIZER_PARTICIPATION_REQUIRES_SLOT` | `Zwiększ liczbę miejsc przed edycją swojego udziału`                                       |
| Uczestnik przyjmuje zaproszenie przy pełnym składzie | `409 EVENT_FULL`                            | `Liczba graczy jest pełna. Skontaktuj się z organizatorem`                                 |
| Organizator akceptuje gracza przy pełnym składzie    | `409 EVENT_FULL`                            | `Brak wolnych miejsc. Zwiększ liczbę miejsc przed zaakceptowaniem gracza`                  |
| Edycja zmniejsza liczbę miejsc poniżej zera          | `409 PLAYER_COUNT_CHANGED`                  | `Liczba wolnych miejsc zmieniła się w międzyczasie. Odśwież wydarzenie i spróbuj ponownie` |
| Organizator używa endpointu opuszczenia              | `403 ORGANIZER_CANNOT_LEAVE`                | `Organizator nie może opuścić wydarzenia. Zmień swój udział w edycji wydarzenia`           |

`details` zawiera co najmniej `{ eventId, playerCount }`.

`CAPACITY_BELOW_ACCEPTED` z planu 3.x **nie istnieje** — przy liczonym `maxPlayers` jego
rolę przejmuje zakaz zejścia `playerCount` poniżej zera.

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
(`Event.playerCount`, `Status`, `ReadyCheck`), wykonuje się w **jednej transakcji**:

```js
await mongoose.connection.transaction(async (session) => {
  const event = await eventModel.findById(eventId).session(session);
  if (event.playerCount <= 0) {
    throw new ConflictError("...", "EVENT_FULL", {
      eventId,
      playerCount: event.playerCount,
    });
  }
  event.playerCount -= 1;
  statusDoc.status = "accepted";
  await statusDoc.save({ session });
  await event.save({ session });
});
```

Dlaczego to wystarcza bez wersjonowania i bez warunkowych update’ów: MongoDB wykrywa
konflikt zapisu na poziomie dokumentu. Dwie równoległe akceptacje ostatniego miejsca obie
zapisują ten sam dokument `Event`; druga dostaje `WriteConflict`, a
`connection.transaction()` automatycznie powtarza całą funkcję. W powtórce odczyt widzi
już `playerCount === 0` i kończy się `EVENT_FULL`.

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

`eventModel.js` pozostaje bez zmian. `maxPlayers` nie jest nigdzie zapisywane:

```text
maxPlayers = Math.max(0, event.playerCount) + active
```

Dlaczego to działa: lista uczestników jest synchronizowana w tej samej transakcji co
`Status` i `playerCount`, więc każda operacja zmienia oba składniki przeciwnie:

| Operacja                                | `playerCount` |  `active` | `maxPlayers` |
| --------------------------------------- | ------------: | --------: | -----------: |
| Akceptacja gracza                       |          `-1` |      `+1` |    bez zmian |
| Gracz opuszcza / odrzucony              |          `+1` |      `-1` |    bez zmian |
| Organizator `false → true`              |          `-1` |      `+1` |    bez zmian |
| Organizator `true → false`              |          `+1` |      `-1` |    bez zmian |
| Organizator zmienia liczbę miejsc o `n` |          `+n` | bez zmian |         `+n` |

Organizator jest „extra” (nie zajmuje poszukiwanego miejsca) — jeżeli gra, jest zwykłym
uczestnikiem listy i może ustawić `ready`.

`Math.max(0, …)` chroni wyświetlanie przy starych danych z ujemnym licznikiem.

Przykład: `playerCount = 2`, zaakceptowani: organizator + 3 graczy → `active = 4`,
`maxPlayers = 6`.

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
- Dla starych wydarzeń (bez dokumentu) — przy edycji terminu albo przy rolloverze
  wydarzenia cyklicznego (reset tworzy dokument, jeżeli go nie ma). Bez migracji i bez
  skryptów.

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
(stare wydarzenie), synchronizacja nic nie robi.

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
| brak dokumentu         | reset (tworzy dokument — stare wydarzenia)                                                         |
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
  event: { eventName, startDate, startHour, startDateTime, addressString, createdBy },
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

Godziny w treściach pushy: `event.startHour` (zapisana przez organizatora, czas polski).
Data: `event.startDate`.

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

| Operacja                    | `Status`          |             `playerCount` | Lista uczestników RC           | Transakcja |
| --------------------------- | ----------------- | ------------------------: | ------------------------------ | ---------- |
| Akceptacja zainteresowanego | `accepted`        |                      `-1` | dodaj/przywróć `pending`       | tak        |
| Akceptacja zaproszenia      | `accepted`        |                      `-1` | dodaj/przywróć `pending`       | tak        |
| Gracz opuszcza event        | usunięty          | `+1` jeśli był `accepted` | `left`                         | tak        |
| Organizator odrzuca gracza  | `rejected`        | `+1` jeśli był `accepted` | `rejected`                     | tak        |
| Organizator `false → true`  | utwórz `accepted` |                      `-1` | dodaj/przywróć `pending`       | tak        |
| Organizator `true → false`  | usuń              |                      `+1` | `left`                         | tak        |
| Organizator zmienia liczbę  | bez zmian         |                   różnica | bez zmian                      | tak        |
| Gracz potwierdza / wycofuje | bez zmian         |                 bez zmian | `ready` / `pending`            | tak        |
| Start wydarzenia            | bez zmian         |                 bez zmian | RC `closed`, statusy zachowane | tak        |

Po każdej z tych operacji (po commicie): `notifyReadyCheckChanged(eventId)`.

---

## 16. Eventy cykliczne, usuwanie, anulowanie, zakończenie

### 16.1. Rollover wydarzenia cyklicznego

W `updateEventStatuses()` przesunięcie o 7 dni wykonuje się w transakcji razem z resetem
RC:

- zapis eventu warunkowany starym `endDateTime` (`findOneAndUpdate({ _id, endDateTime: stare })`) —
  drugi tick nie przesunie eventu drugi raz,
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

Nowe pliki (8):

| Plik                                  | Odpowiedzialność                                                                          |
| ------------------------------------- | ----------------------------------------------------------------------------------------- |
| `models/readyCheckModel.js`           | schemat i indeksy                                                                         |
| `services/eventParticipantService.js` | transakcyjne zmiany uczestnictwa i `playerCount`                                          |
| `services/readyCheckService.js`       | harmonogram, tworzenie/reset, synchronizacja listy, podsumowanie, stan aktualny, gotowość |
| `services/readyCheckScheduler.js`     | kroki ticka: zamykanie, otwieranie, pushe, przypomnienie, debounce                        |
| `controllers/readyCheckController.js` | `GET` i `PATCH`                                                                           |
| `routes/readyCheckRouter.js`          | routing                                                                                   |
| `socket/socketAuth.js`                | wspólne uwierzytelnienie socketów                                                         |
| `socket/readyCheckSocketHandler.js`   | namespace `/ready-check` i sygnał zmiany                                                  |

Pliki modyfikowane:

```text
errors/customErrors.js
middleware/errorHandlerMW.js
middleware/validationMW.js
routes/eventRouter.js
controllers/statusController.js
controllers/eventController.js
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
components/FormEvent.jsx
components/popup/ConfirmModal.jsx
app/(auth)/single-event.jsx
app/(auth)/events-managment/edit-event.jsx
app/(auth)/_layout.jsx
Navigation/CustomTabBar.jsx
```

---

## 18. Kolejność wdrożenia

Wszystkie fazy: ⏳ **do zrobienia**. Szczegóły zadań, modele wykonawcze i kryteria
akceptacji: [PLAN-PRAC-ready-check-4.0.md](PLAN-PRAC-ready-check-4.0.md).

| Faza | Zakres                                                  | Status |
| ---- | ------------------------------------------------------- | ------ |
| A    | Infrastruktura błędów i walidacji edycji                | ⏳     |
| B    | Transakcyjny serwis uczestnictwa, naprawa `playerCount` | ⏳     |
| C    | Model i serwis Ready Check                              | ⏳     |
| D    | Namespace `/ready-check` (backend)                      | ⏳     |
| E    | Podpięcie RC do create/edit/delete/finish/rollover      | ⏳     |
| F    | Push i scheduler                                        | ⏳     |
| G    | REST Ready Check                                        | ⏳     |
| H    | Mobile: błędy i `previousPlayerCount`                   | ⏳     |
| I    | Mobile: powiadomienia, routing, layout                  | ⏳     |
| J    | Mobile: hook, ekran, komponenty, modal                  | ⏳     |
| K    | Weryfikacja manualna                                    | ⏳     |

---

## 19. Checklista weryfikacji manualnej

Bez testów automatycznych. Najważniejszy scenariusz, którego błędu nie widać w kodzie,
a który trwale psuje dane: **równoległa akceptacja ostatniego miejsca** (19.1.9) —
sprawdzić na dwóch sesjach (np. dwa równoległe requesty z Postmana).

### 19.1. `playerCount`

1. Utworzenie eventu przez grającego organizatora nie zmienia licznika.
2. Organizator `true → false` zwiększa licznik dokładnie o 1.
3. Organizator `false → true` zmniejsza licznik dokładnie o 1.
4. Organizator nie może użyć `leave` (`403 ORGANIZER_CANNOT_LEAVE`).
5. Organizator nie może zmienić własnego `Status` endpointem zarządzania (`400`).
6. Zaakceptowany gracz opuszczający event zwiększa licznik; `interested` — nie.
7. `playerCount = 0` pozwala na `interested`, blokuje każde przejście do `accepted`.
8. Dwukrotna akceptacja tego samego gracza zmniejsza licznik tylko raz.
9. Dwie równoległe akceptacje na ostatnie miejsce → jedno `accepted`, jedno `409 EVENT_FULL`.
10. Żadna ścieżka nie zapisuje wartości ujemnej.
11. Edycja pełnego eventu (`0`) zapisuje się (np. zmiana opisu).
12. Edycja z formularza otwartego przed akceptacją gracza nie „oddaje” jego miejsca
    (`previousPlayerCount`).
13. Edycja zmniejszająca poniżej zera → `409 PLAYER_COUNT_CHANGED`.
14. Mobile pokazuje dokładny `msg` serwera przez `Toast.error`.

### 19.2. Transakcje

1. Błąd w środku operacji (np. `EVENT_FULL`) nie zostawia częściowego zapisu
   (`Status` bez zmiany licznika).
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
2. Stary event bez dokumentu dostaje go przy rolloverze albo edycji terminu.
3. Wynik Ready Check nie zatrzymuje serii.

---

## 20. Kryteria ukończenia MVP

- wszystkie ścieżki `playerCount` spójne, bez wartości ujemnych, w transakcjach,
- konflikty pojemności zwracają `code` + `msg`, mobile pokazuje `Toast.error`,
- organizator nie może opuścić eventu ani zmienić własnego `Status` endpointem uczestnika,
- jeden dokument RC na event, tworzony z wydarzeniem, resetowany zamiast usuwany przy
  zmianie terminu/rolloverze,
- `maxPlayers` liczone, nie przechowywane,
- lista uczestników zachowuje `pending/ready/left/rejected`,
- gotowość zmieniana tylko przez REST,
- ekran odświeża się po sygnałach `/ready-check`, a reconnect zawsze kończy się `GET`,
- pushe: otwarcie, przypomnienie organizatora, zmiana godziny (debounce), zmiana terminu
  (reset), wszystkie z poprawnym routingiem,
- usunięcie/anulowanie/ręczne zakończenie usuwa RC bez pushy,
- Ready Check nie wpływa na przejście do `LIVE`,
- trzy zakładki i modal opuszczenia z timerem 5 sekund.

---

## 21. Decyzje wersji 4.0 (zmiany względem 3.x)

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
7. **Bez migracji i raportów przez skrypty.** Stare eventy dostają RC przy edycji terminu
   albo rolloverze. Ujemny `playerCount` jest tylko obcinany do zera przy wyświetlaniu.
8. **`maxPlayers` liczone**: `Math.max(0, playerCount) + active`. Usunięte:
   `manualDelta`, `CAPACITY_BELOW_ACCEPTED`.
9. **`previousPlayerCount`** w edycji eventu — backend stosuje różnicę, nie nadpisuje.
10. **Nowy kod `PLAYER_COUNT_CHANGED`** (`409`) dla edycji schodzącej poniżej zera.
11. **Organizator nie zmienia własnego `Status`** endpointem zarządzania uczestnikami.
12. **Organizator nie dostaje pushy o zmianie terminu** (sam ją wykonał).
13. Nazewnictwo: słowo „snapshot” usunięte — patrz §1.

---

## 22. Poza zakresem / zauważone przy researchu

Nie naprawiamy w tym wdrożeniu, do decyzji w przyszłości:

- `validateEventInput` odrzuca edycję wydarzenia, którego start już minął (np. zmiana
  opisu wydarzenia `LIVE`).
- `POST /football-events/update-statuses` może wywołać każdy zalogowany użytkownik.
- Rollover zapisuje `startDate` jako datę UTC (`toISOString()`), co dla późnych godzin
  może dać poprzedni dzień w Polsce.
- `eventModel` ma hook `post("save")` tworzący czat, który (prawdopodobnie) nigdy się nie
  wykonuje, bo `doc.isNew` jest już `false` po zapisie; czat tworzy jawnie `createEvent`.
- Namespace `/notifications` zapisuje `socketUserMap` w `authMiddleware`, ale nie usuwa
  wpisu przy rozłączeniu.
- Wejście na ekran Ready Check jest możliwe tylko z pusha. Przycisk „Ready Check” na
  `single-event` dla zaakceptowanych uczestników byłby naturalnym rozszerzeniem.
- Archiwum Ready Check, statystyki obecności, automatyczne decyzje organizatora.
