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
 * Wyszukuje publiczne, nadchodzące wydarzenia według lokalizacji i filtrów.
 * Zwraca pełną odpowiedź paginacji (events, center, total, hasMore, ...).
 */
export const fetchNearbyEvents = async ({
  latitude,
  longitude,
  City,
  region,
  Country = "Poland",
  distance = 25,
  eventName,
  gameType,
  minPlayerCount,
  level,
  maxPrice,
  ageRange,
  limit = 4,
  page = 1,
  signal,
} = {}) => {
  const { data } = await customFetch.post(
    "/football-events/search",
    {
      latitude,
      longitude,
      City,
      region,
      Country,
      distance,
      eventName,
      gameType,
      minPlayerCount,
      level,
      maxPrice,
      ageRange,
      limit,
      page,
    },
    { signal },
  );

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
