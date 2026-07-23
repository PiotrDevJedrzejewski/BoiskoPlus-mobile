import customFetch from "./customFetch";

export const fetchEventsCollections = async () => {
  const [ownerResponse, participantResponse] = await Promise.all([
    customFetch.get("/football-events"),
    customFetch.get("/status/my-events"),
  ]);

  return {
    ownerEvents: ownerResponse?.data?.events || [],
    userEvents: participantResponse?.data?.userEvents || [],
  };
};

/**
 * Pobiera najbliższe wydarzenia od podanej lokalizacji (bez dodatkowych filtrów).
 * Wykorzystuje endpoint wyszukiwarki ($geoNear zwraca wyniki od najbliższego).
 * Zwraca pełną odpowiedź (events, center, total, ...).
 */
export const fetchNearbyEvents = async ({
  latitude,
  longitude,
  City,
  region,
  Country = "Poland",
  distance = 25,
  limit = 4,
  page = 1,
} = {}) => {
  const { data } = await customFetch.post("/football-events/search", {
    latitude,
    longitude,
    City,
    region,
    Country,
    distance,
    limit,
    page,
  });

  return data;
};

export const parseEventDate = (event) => {
  if (!event) return new Date(0);

  if (event.startDateTime) {
    const parsed = new Date(event.startDateTime);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  if (event.startDate && event.startHour) {
    const parsed = new Date(`${event.startDate}T${event.startHour}`);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  return new Date(0);
};
