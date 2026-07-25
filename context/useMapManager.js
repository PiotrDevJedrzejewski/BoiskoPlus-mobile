/**
 * =====================================================
 * MAP / LOCATION MANAGER — React lifecycle hook (NIE Provider/Context)
 * =====================================================
 *
 * Stan mapy żyje w zustand (mapStore.js). Ten hook odpowiada TYLKO za
 * efekty zależne od AuthContext (zgody, zapisana lokalizacja):
 *   1. Zapytanie o systemowe uprawnienia do geolokalizacji (dialog Androida/iOS)
 *   2. Inicjalizację lokalizacji startowej (AsyncStorage → GPS fallback)
 *   3. Reakcję na zmianę zgody na lokalizację w ustawieniach
 *
 * ⚠️ WYWOŁYWANY W `app/(auth)/_layout.jsx`, NIE w show-map.jsx.
 * Systemowy dialog o lokalizację musi pojawić się zaraz po zalogowaniu,
 * a lokalizacja jest potrzebna także poza mapą (dashboard, find-event),
 * więc manager musi startować razem z drzewem (auth) — dokładnie tak,
 * jak robił to stary <MapProvider>. Wewnętrzne refy pilnują, żeby
 * bootstrap wykonał się dokładnie raz.
 */

import { useRef, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { useMapStore } from "./mapStore";
import {
  checkSystemLocationPermissions,
  fetchAndSaveLocation,
} from "../assets/utils/getUserLocation";
import { useDebugEffect } from "../assets/utils/debugLogger";

export const useMapManager = () => {
  const {
    consents,
    consentsLoading,
    getSavedLocation,
    saveLocation,
    reverseGeocode,
    systemPermissionsGeo,
    setSystemPermissionsGeo,
    updateConsents,
  } = useAuth();

  const hasInitializedRef = useRef(false);
  const prevLocationAccepted = useRef(consents?.locationAccepted);

  // Lustro zgody w store — MapboxMobile czyta to selektorem zamiast
  // subskrybować cały AuthContext tylko dla markera lokalizacji.
  useEffect(() => {
    useMapStore.getState().setGeolocationAccepted(!!consents?.locationAccepted);
  }, [consents?.locationAccepted]);

  /**
   * Ustawia lokalizację w store:
   *  1. próbuje wziąć zapisaną (AsyncStorage) — natychmiastowa, offline
   *  2. jeśli jej nie ma, a mamy uprawnienia — pobiera z GPS, reverse-geocoduje
   *     i ZAPISUJE, żeby kolejne starty aplikacji były natychmiastowe
   */
  const ensureLocation = useCallback(
    async (locationAccepted) => {
      // Ekrany zależne od lokalizacji mają czekać, dopóki nie skończymy
      // (istotne przy przełączeniu zgody w ustawieniach — bootstrap już minął).
      useMapStore.getState().setLocationResolved(false);

      const hasSavedLocation = await useMapStore
        .getState()
        .setStartLocation(locationAccepted, getSavedLocation);

      if (!locationAccepted || hasSavedLocation) {
        useMapStore.getState().setLocationResolved(true);
        return;
      }

      const result = await fetchAndSaveLocation({
        reverseGeocode,
        saveLocation,
      });
      if (result.success) {
        useMapStore.getState().applyUserLocation(result.location, 12);
      }

      // Dopiero TERAZ lokalizacja jest rozstrzygnięta — ekrany zależne od
      // niej (dashboard-home, find-event) mogą bezpiecznie odpytać backend.
      useMapStore.getState().setLocationResolved(true);
    },
    [getSavedLocation, reverseGeocode, saveLocation],
  );

  // Bootstrap: uprawnienia systemowe → lokalizacja startowa. Raz na sesję.
  useDebugEffect(
    "useMapManager:bootstrap",
    [consentsLoading, consents?.locationAccepted],
    ["consentsLoading", "consents.locationAccepted"],
  );
  useEffect(() => {
    if (consentsLoading || !consents) return;
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;
    prevLocationAccepted.current = consents.locationAccepted;

    const bootstrap = async () => {
      // Systemowy dialog o uprawnienia (tylko gdy mamy własną zgodę).
      // checkSystemLocationPermissions cofa consents.locationAccepted,
      // jeśli użytkownik odmówi na poziomie systemu.
      const permission = await checkSystemLocationPermissions({
        consents,
        systemPermissionsGeo,
        setSystemPermissionsGeo,
        updateConsents,
        consentsLoading,
      });

      const granted = permission.status === "granted";
      prevLocationAccepted.current = granted && consents.locationAccepted;

      await ensureLocation(granted && consents.locationAccepted);
    };

    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consentsLoading, consents, ensureLocation]);

  // Reaguj na zmiany zgody na lokalizację - tylko po inicjalizacji (zmiana w ustawieniach)
  useEffect(() => {
    if (consentsLoading || !hasInitializedRef.current) return;
    // Reaguj tylko na faktyczną zmianę zgody (nie na initial mount)
    if (prevLocationAccepted.current === consents?.locationAccepted) return;
    prevLocationAccepted.current = consents?.locationAccepted;

    ensureLocation(!!consents?.locationAccepted);
  }, [consents?.locationAccepted, consentsLoading, ensureLocation]);
};
