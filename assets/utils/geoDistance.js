// Narzędzia do liczenia i formatowania odległości geograficznych.
// Używane w kilku miejscach (karty wydarzeń, mapa, lista wyszukiwania).

const EARTH_RADIUS_KM = 6371;

const toRadians = (degrees) => (degrees * Math.PI) / 180;

const isFiniteNumber = (value) =>
  value !== null && value !== undefined && Number.isFinite(Number(value));

/**
 * Odległość między dwoma punktami (haversine), w kilometrach.
 * Zwraca null gdy którakolwiek współrzędna jest nieprawidłowa.
 */
export const getDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (![lat1, lon1, lat2, lon2].every(isFiniteNumber)) {
    return null;
  }

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
};

/** Zamienia metry na kilometry (null-safe). */
export const metersToKm = (meters) =>
  isFiniteNumber(meters) ? Number(meters) / 1000 : null;

/**
 * Wylicza odległość wydarzenia (w km).
 * Priorytet: distanceFromCenter zwrócone przez backend ($geoNear, w metrach),
 * następnie liczenie po współrzędnych względem podanej lokalizacji.
 */
export const getEventDistanceKm = (event, fromLocation) => {
  if (isFiniteNumber(event?.distanceFromCenter)) {
    return metersToKm(event.distanceFromCenter);
  }

  const coordinates = event?.geolocation?.coordinates;
  if (
    Array.isArray(coordinates) &&
    coordinates.length === 2 &&
    isFiniteNumber(fromLocation?.latitude) &&
    isFiniteNumber(fromLocation?.longitude)
  ) {
    const [longitude, latitude] = coordinates;
    return getDistanceKm(
      fromLocation.latitude,
      fromLocation.longitude,
      latitude,
      longitude,
    );
  }

  return null;
};

/**
 * Mapuje punkty z kolekcji GeoJSON na dane kart, liczy ich odległość,
 * opcjonalnie ogranicza promień i zwraca wyniki od najbliższego.
 */
export const getNearbyPlaces = (
  featureCollectionOrFeatures,
  fromLocation,
  { maxDistanceKm = null, limit = null } = {},
) => {
  const features = Array.isArray(featureCollectionOrFeatures)
    ? featureCollectionOrFeatures
    : featureCollectionOrFeatures?.features;

  if (
    !Array.isArray(features) ||
    !isFiniteNumber(fromLocation?.latitude) ||
    !isFiniteNumber(fromLocation?.longitude)
  ) {
    return [];
  }

  const normalizedMaxDistance = isFiniteNumber(maxDistanceKm)
    ? Math.max(0, Number(maxDistanceKm))
    : null;
  const normalizedLimit = isFiniteNumber(limit)
    ? Math.max(0, Math.floor(Number(limit)))
    : null;

  if (normalizedLimit === 0) {
    return [];
  }

  const places = features.reduce((result, feature, index) => {
    const coordinates = feature?.geometry?.coordinates;
    if (!Array.isArray(coordinates) || coordinates.length < 2) {
      return result;
    }

    const [longitude, latitude] = coordinates;
    const geoDistance = getDistanceKm(
      fromLocation.latitude,
      fromLocation.longitude,
      latitude,
      longitude,
    );

    if (
      geoDistance === null ||
      (normalizedMaxDistance !== null && geoDistance > normalizedMaxDistance)
    ) {
      return result;
    }

    const properties = feature?.properties || {};
    const city = properties.miasto || "Miasto";

    result.push({
      id: feature?.id ?? `place-${index}`,
      type: properties.kategoria || "orlik",
      name: properties.nazwa || city,
      city,
      address: properties.adres || city,
      geoDistance,
      coordinates: [Number(longitude), Number(latitude)],
    });

    return result;
  }, []);

  places.sort((first, second) => first.geoDistance - second.geoDistance);

  return normalizedLimit === null ? places : places.slice(0, normalizedLimit);
};

/**
 * Formatuje odległość (w km) do krótkiego napisu: "800 M" / "3.4 KM".
 * Zwraca null gdy brak danych, aby komponent mógł ukryć element.
 */
export const formatDistanceKm = (km) => {
  if (!isFiniteNumber(km)) {
    return null;
  }

  if (km < 1) {
    return `${Math.round(km * 1000)} M`;
  }

  return `${km.toFixed(1)} KM`;
};
