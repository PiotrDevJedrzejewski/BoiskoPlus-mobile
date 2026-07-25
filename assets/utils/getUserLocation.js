import * as Location from "expo-location";

/**
 * Sprawdza i żąda uprawnień systemowych do geolokalizacji
 * @param {Object} params - Parametry funkcji
 * @param {Object} params.consents - Zgody użytkownika
 * @param {Object} params.systemPermissionsGeo - Stan uprawnień systemowych
 * @param {Function} params.setSystemPermissionsGeo - Funkcja do aktualizacji uprawnień systemowych
 * @param {Function} params.updateConsents - Funkcja do aktualizacji zgód
 * @param {boolean} params.consentsLoading - Czy zgody się ładują
 * @returns {Promise<Object>} - Rezultat sprawdzenia uprawnień
 */
export const checkSystemLocationPermissions = async ({
  consents,
  systemPermissionsGeo,
  setSystemPermissionsGeo,
  updateConsents,
  consentsLoading,
}) => {
  try {
    // Pomiń jeśli zgody się jeszcze ładują
    if (consentsLoading) {
      return { success: false, reason: "consents_loading" };
    }

    // Jeśli nie mamy naszej zgody - nie pytaj o systemową
    if (!consents?.locationAccepted) {
      // Pozostaw undetermined
      if (systemPermissionsGeo.status !== "undetermined") {
        setSystemPermissionsGeo({ status: "undetermined" });
      }
      return { success: false, reason: "no_consent" };
    }

    // Mamy naszą zgodę - sprawdź systemową
    // Najpierw sprawdź obecny stan uprawnień
    const { status: currentStatus } =
      await Location.getForegroundPermissionsAsync();

    if (currentStatus === "granted") {
      // Użytkownik już wcześniej przyznał uprawnienia
      if (systemPermissionsGeo.status !== "granted") {
        setSystemPermissionsGeo({ status: "granted" });
      }
      return { success: true, status: "granted", wasAlreadyGranted: true };
    }

    // Jeśli uprawnienia nie są przyznane, poproś użytkownika
    const { status: newStatus } =
      await Location.requestForegroundPermissionsAsync();

    if (newStatus === "granted") {
      // Użytkownik przyznał uprawnienia
      if (systemPermissionsGeo.status !== "granted") {
        setSystemPermissionsGeo({ status: "granted" });
      }
      return { success: true, status: "granted", wasAlreadyGranted: false };
    } else {
      // Użytkownik odmówił - zmień status i cofnij naszą zgodę
      if (systemPermissionsGeo.status !== "denied") {
        setSystemPermissionsGeo({ status: "denied" });
      }
      await updateConsents({ locationAccepted: false });
      return { success: false, status: "denied", reason: "user_denied" };
    }
  } catch (error) {
    console.error("Błąd sprawdzania uprawnień systemowych:", error);
    if (systemPermissionsGeo.status !== "denied") {
      setSystemPermissionsGeo({ status: "denied" });
    }
    await updateConsents({ locationAccepted: false });
    return { success: false, status: "denied", reason: "error", error };
  }
};

/**
 * Pobiera aktualną lokalizację użytkownika
 * Wymaga wcześniejszego sprawdzenia uprawnień
 * @returns {Promise<Object>} - Lokalizacja użytkownika
 */
export const getCurrentLocation = async () => {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();

    if (status !== "granted") {
      return {
        success: false,
        error: "Brak uprawnień do lokalizacji",
      };
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      success: true,
      location: {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
      },
    };
  } catch (error) {
    console.error("Błąd pobierania lokalizacji:", error);
    return {
      success: false,
      error: "Nie udało się pobrać lokalizacji",
    };
  }
};

/**
 * Pobiera świeżą lokalizację z GPS, uzupełnia ją o dane adresowe
 * (reverse geocoding przez backend) i ZAPISUJE w AsyncStorage.
 *
 * To jedyne miejsce, które utrwala lokalizację — używane zarówno przy
 * starcie aplikacji (useMapManager), jak i przy ręcznym odświeżeniu
 * przyciskiem "Moja lokalizacja" (show-map.jsx).
 *
 * @param {Object} params
 * @param {Function} params.reverseGeocode - z AuthContext
 * @param {Function} params.saveLocation - z AuthContext
 * @returns {Promise<{success: boolean, location?: Object, error?: string}>}
 */
export const fetchAndSaveLocation = async ({
  reverseGeocode,
  saveLocation,
}) => {
  const locationResult = await getCurrentLocation();

  if (!locationResult.success) {
    return { success: false, error: locationResult.error };
  }

  const { latitude, longitude } = locationResult.location;
  const geocodeResult = await reverseGeocode(latitude, longitude);

  const location = {
    latitude,
    longitude,
    City: geocodeResult.success ? geocodeResult.location.City || "" : "",
    region: geocodeResult.success ? geocodeResult.location.region || "" : "",
    Country: geocodeResult.success
      ? geocodeResult.location.Country || "Poland"
      : "Poland",
  };

  await saveLocation(location);

  return { success: true, location };
};
