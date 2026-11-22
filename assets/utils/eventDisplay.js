// Wspólne helpery do prezentacji wydarzeń (karty, dashboard, lista wyszukiwania).
import { getEventDistanceKm, formatDistanceKm } from "./geoDistance";

const GAME_TYPE_LABELS = {
  football: "Piłka nożna",
  volleyball: "Siatkówka",
  basketball: "Koszykówka",
  handball: "Piłka ręczna",
  rugby: "Rugby",
  hockey: "Hokej",
  tennis: "Tenis",
  badminton: "Badminton",
  "table tennis": "Tenis stołowy",
  bowling: "Kręgle",
  cards: "Karty",
  "board games": "Planszówki",
  other: "Inne",
};

const DAY_MS = 24 * 60 * 60 * 1000;

// Mirrors MAX_SEARCHED_PLAYERS on the server (limit for the "other" format).
export const MAX_SEARCHED_PLAYERS = 999;

export const getGameTypeLabel = (gameType) =>
  GAME_TYPE_LABELS[gameType] ?? "Wydarzenie";

/** "DZIŚ · 18:00" / "JUTRO · 18:00" / "25.07 · 18:00" */
export const formatEventDateLabel = (event) => {
  if (!event?.startDateTime) {
    return "";
  }

  const date = new Date(event.startDateTime);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const time = date.toLocaleTimeString("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const today = new Date();
  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const startOfDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  const diffDays = Math.round((startOfDate - startOfToday) / DAY_MS);

  let dayLabel;
  if (diffDays === 0) {
    dayLabel = "DZIŚ";
  } else if (diffDays === 1) {
    dayLabel = "JUTRO";
  } else {
    dayLabel = date
      .toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit" })
      .toUpperCase();
  }

  return `${dayLabel} · ${time}`;
};

/** Etykieta formatu gry. "other"/brak → "—". */
export const formatEventFormat = (format) => {
  if (!format || format === "other") {
    return "—";
  }
  return format;
};

/** Łączna liczba graczy wynikająca z formatu ("11v11" → 22). "other"/brak → null. */
export const getFormatTotalPlayers = (format) => {
  const match = /^(\d+)v(\d+)$/.exec(format || "");
  if (!match) {
    return null;
  }
  return Number(match[1]) + Number(match[2]);
};

/**
 * Maksymalna liczba poszukiwanych graczy (lustro serwera).
 * NvN: organizator grający zajmuje jedno miejsce z totalPlayers.
 * "other": stały limit MAX_SEARCHED_PLAYERS.
 */
export const getMaxSearchedPlayers = (format, organizerPlays) => {
  const formatTotal = getFormatTotalPlayers(format);
  if (formatTotal === null) {
    return MAX_SEARCHED_PLAYERS;
  }
  return formatTotal - (organizerPlays ? 1 : 0);
};

/** Zajętość wydarzenia z pól eventu zwracanych przez serwer. */
export const getEventOccupancy = (event) => {
  const acceptedPlayers = Number(event?.acceptedPlayers ?? 0);
  const searchedPlayers = Number(event?.searchedPlayers ?? 0);
  const openSlots = Number(event?.openSlots ?? 0);
  return {
    acceptedPlayers,
    searchedPlayers,
    openSlots,
    isFull: openSlots <= 0,
  };
};

/**
 * Skład meczu "zajęte/łącznie" (Plan §4.8). Działa dla zapisanego eventu
 * i dla danych formularza (bez `totalPlayers` z serwera).
 * NvN: organizator jest już wliczony w (totalPlayers - searchedPlayers).
 * "other": organizator doliczany tylko gdy gra.
 */
export const getEventSquad = ({
  format,
  totalPlayers,
  searchedPlayers,
  acceptedPlayers,
  organizerPlays,
}) => {
  const searched = Number(searchedPlayers ?? 0);
  const accepted = Number(acceptedPlayers ?? 0);
  const squadTotal = totalPlayers ?? getFormatTotalPlayers(format);

  if (squadTotal === null) {
    const organizerSlot = organizerPlays ? 1 : 0;
    return {
      current: accepted + organizerSlot,
      max: searched + organizerSlot,
    };
  }

  return {
    current: squadTotal - searched + accepted,
    max: squadTotal,
  };
};

/** Krótki napis odległości ("3.4 KM") lub null. */
export const getEventDistanceLabel = (event, fromLocation) =>
  formatDistanceKm(getEventDistanceKm(event, fromLocation));

/** Tytuł wydarzenia z fallbackiem na etykietę typu gry. */
export const getEventTitle = (event) =>
  event?.eventName || getGameTypeLabel(event?.gameType);

/**
 * Badge statusu bieżącego użytkownika wobec wydarzenia (ze statusModel).
 * Brak statusu (lub status "martwy") → wydarzenie OTWARTE.
 * `colorKey` odnosi się do klucza w palecie kolorów motywu.
 */
export const getParticipationBadge = (status) => {
  switch (status) {
    case "owner":
      return {
        icon: "ribbon-outline",
        text: "ORGANIZATOR",
        colorKey: "PrimaryGreen",
      };
    case "rejected":
      return {
        icon: "close-circle-outline",
        text: "ODRZUCONY",
        colorKey: "Danger",
      };
    case "finished":
      return {
        icon: "flag-outline",
        text: "ZAKOŃCZONE",
        colorKey: "StatusClosed",
      };
    case "accepted":
      return {
        icon: "checkmark-circle-outline",
        text: "DODANY",
        colorKey: "SuccessGreen",
      };
    case "interested":
      return {
        icon: "star-outline",
        text: "CHĘTNY",
        colorKey: "GoldYellow",
      };
    case "invited":
      return {
        icon: "mail-outline",
        text: "ZAPROSZONY",
        colorKey: "PrimaryYellow",
      };
    default:
      return {
        icon: "lock-open-outline",
        text: "OTWARTE",
        colorKey: "StatusOpen",
      };
  }
};

/**
 * Buduje mapę { [eventId]: status } z listy statusów użytkownika
 * (odpowiedź `/status/my-events`, dostępna w DashboardContext.userEvents).
 */
export const buildUserStatusMap = (userEvents = []) => {
  const map = {};
  for (const item of userEvents) {
    const eventId = item?.eventID?._id || item?.eventID;
    if (eventId) {
      map[String(eventId)] = item.status;
    }
  }
  return map;
};
