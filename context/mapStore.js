/**
 * =====================================================
 * MAP ZUSTAND STORE
 * =====================================================
 *
 * Stan mapy (show-map.jsx + MapboxMobile.jsx) w jednym zustand store.
 * Konsumenci subskrybują TYLKO potrzebne wartości przez selektory
 * (np. useMapStore(s => s.showMarkers)), więc zmiana np. overlayOpacity
 * NIE rerenderuje komponentu, który czyta tylko showMarkers — w
 * przeciwieństwie do poprzedniego MapContext, gdzie każdy konsument
 * useMap() dostawał jeden złączony obiekt i rerenderował się przy
 * KAŻDEJ zmianie dowolnego pola.
 *
 * mapRef/cameraRef NIE są częścią reaktywnego stanu — to zwykłe
 * imperatywne referencje rejestrowane raz przez MapboxMobile przy
 * mouncie (patrz registerCameraRef/registerMapRef poniżej). Nikt nie
 * musi się rerenderować, gdy ref zostaje podpięty — flyTo() używa go
 * wyłącznie imperatywnie (tak samo jak chatSocket/notificationSocket
 * w socketStore.js są tylko odczytywane przez get(), nie subskrybowane).
 *
 * pendingFlyTo pozwala DOWOLNEMU ekranowi (np. events-managment/*)
 * poprosić o wycentrowanie mapy na konkretnym punkcie PRZED nawigacją
 * na show-map — bez subskrybowania store'a i bez Contextu:
 *
 *   useMapStore.getState().setPendingFlyTo({ coordinates: [lon, lat], zoom: 14 })
 *   router.push('/(auth)/show-map')
 *
 * show-map.jsx konsumuje i czyści pendingFlyTo dopiero gdy isMapReady
 * === true (żeby nie zgubić komendy zanim <Mapbox.Camera> się zamontuje).
 */

import { create } from "zustand";

// =====================================================
// PROVINCE COORDINATES (Polska)
// =====================================================

const PROVINCE_COORDINATES = {
  dolnośląskie: { lat: 51.1079, lon: 16.9252, zoom: 7 },
  "kujawsko-pomorskie": { lat: 53.0138, lon: 18.006, zoom: 7 },
  lubelskie: { lat: 51.2465, lon: 22.5684, zoom: 7 },
  lubuskie: { lat: 52.25, lon: 15.5, zoom: 7 },
  łódzkie: { lat: 51.463477, lon: 19.172697, zoom: 7 },
  małopolskie: { lat: 50.0647, lon: 19.945, zoom: 7 },
  mazowieckie: { lat: 52.3423, lon: 21.1017, zoom: 7 },
  opolskie: { lat: 50.6751, lon: 17.927, zoom: 8 },
  podkarpackie: { lat: 50.0413, lon: 21.999, zoom: 7 },
  podlaskie: { lat: 53.1325, lon: 23.1688, zoom: 7 },
  pomorskie: { lat: 54.352, lon: 18.6466, zoom: 7 },
  śląskie: { lat: 50.2975, lon: 19.0238, zoom: 8 },
  świętokrzyskie: { lat: 50.8661, lon: 20.6286, zoom: 8 },
  "warmińsko-mazurskie": { lat: 53.7784, lon: 20.4801, zoom: 7 },
  wielkopolskie: { lat: 52.3337, lon: 17.2417, zoom: 7 },
  zachodniopomorskie: { lat: 53.43, lon: 15.5, zoom: 7 },
};

const DEFAULT_LOCATION = {
  latitude: 52.0,
  longitude: 19.5,
  City: "",
  Country: "Poland",
  region: "",
};

const DEFAULT_CAMERA = {
  centerCoordinate: [19.5, 52.0], // Polska - cały kraj
  zoomLevel: 6,
};

// =====================================================
// INTERNAL (non-reactive imperative refs, NOT zustand state)
// =====================================================

let cameraRefInstance = null;
let mapRefInstance = null;

/** Wywoływane przez MapboxMobile przy mouncie/unmouncie */
export const registerCameraRef = (ref) => {
  cameraRefInstance = ref;
};

export const registerMapRef = (ref) => {
  mapRefInstance = ref;
};

// =====================================================
// STORE
// =====================================================

export const useMapStore = create((set, get) => ({
  // ── Markery / widoczność warstw ──
  showMarkers: true,
  showEvents: true,

  // ── Overlay / interaktywność (kontrolowane przez show-map.jsx) ──
  overlayOpacity: 0.3,
  isInteractive: false,

  // ── Stan ładowania mapy (ustawiane przez MapboxMobile) ──
  isMapReady: false,

  // ── Kamera - stan tylko do inicjalnego renderu; nawigacja przez cameraRef ──
  camera: DEFAULT_CAMERA,

  // ── Lokalizacja użytkownika ──
  userLocation: DEFAULT_LOCATION,

  // Czy `userLocation` to REALNA lokalizacja użytkownika, a nie fallback
  // na środek Polski. Ekrany (dashboard-home, find-event) muszą to wiedzieć,
  // żeby nie odpytywać backendu o wydarzenia "w środku Polski".
  hasUserLocation: false,

  // Czy useMapManager skończył bootstrap lokalizacji (uprawnienia +
  // AsyncStorage + ewentualny strzał po GPS). Dopóki false, konsumenci
  // powinni trzymać spinner zamiast wyciągać wnioski z pustej lokalizacji.
  //
  // ⚠️ To jest lek na wyścig: przy PIERWSZYM uruchomieniu (świeża zgoda)
  // w AsyncStorage nie ma jeszcze nic, bo GPS + reverse-geocoding trwają.
  // Efekty zależne tylko od `consents.locationAccepted` odpalały się za
  // wcześnie, dostawały pustkę i nigdy nie ponawiały próby.
  locationResolved: false,

  // ── Czy użytkownik zgodził się na geolokalizację (mirror consents.locationAccepted) ──
  // Trzymane w store, żeby MapboxMobile nie musiał subskrybować AuthContext
  // tylko po to, by zdecydować o renderze markera lokalizacji.
  geolocationAccepted: false,

  // ── "Zlecenie" wycentrowania mapy z ekranu spoza mapy (np. events-managment) ──
  pendingFlyTo: null,

  // ═════════════════════════════════════════════════
  // SETTERS (wspierają funkcyjne aktualizacje jak useState)
  // ═════════════════════════════════════════════════

  setShowMarkers: (valOrFn) =>
    set((s) => ({
      showMarkers:
        typeof valOrFn === "function" ? valOrFn(s.showMarkers) : valOrFn,
    })),

  setShowEvents: (valOrFn) =>
    set((s) => ({
      showEvents:
        typeof valOrFn === "function" ? valOrFn(s.showEvents) : valOrFn,
    })),

  setOverlayOpacity: (v) => set({ overlayOpacity: v }),
  setIsInteractive: (v) => set({ isInteractive: v }),
  setIsMapReady: (v) => set({ isMapReady: v }),
  setUserLocation: (v) => set({ userLocation: v }),
  setGeolocationAccepted: (v) => set({ geolocationAccepted: v }),
  setLocationResolved: (v) => set({ locationResolved: v }),

  setPendingFlyTo: (target) => set({ pendingFlyTo: target }),
  clearPendingFlyTo: () => set({ pendingFlyTo: null }),

  // ═════════════════════════════════════════════════
  // ACTIONS
  // ═════════════════════════════════════════════════

  /** Imperatywnie przesuwa kamerę mapy (jeśli zamontowana) + synchronizuje stan */
  flyTo: (coordinates, zoom = 14) => {
    if (cameraRefInstance?.current) {
      cameraRefInstance.current.setCamera({
        centerCoordinate: coordinates,
        zoomLevel: zoom,
        animationMode: "flyTo",
        animationDuration: 1000,
      });
    }
    set({ camera: { centerCoordinate: coordinates, zoomLevel: zoom } });
  },

  /** Zwraca współrzędne środka województwa (lub null) */
  getProvinceCoordinates: (provinceName) => {
    if (!provinceName) return null;
    const normalized = provinceName.toLowerCase().trim();
    return PROVINCE_COORDINATES[normalized] || null;
  },

  /** Wyśrodkowuje mapę na województwo */
  flyToProvince: (provinceName) => {
    const coords = get().getProvinceCoordinates(provinceName);
    if (coords) {
      get().flyTo([coords.lon, coords.lat], coords.zoom);
      return true;
    }
    return false;
  },

  /**
   * Ustawia lokalizację startową na podstawie zgody + zapisanej lokalizacji.
   * `getSavedLocation` jest wstrzykiwane z AuthContext przez useMapManager,
   * bo store nie ma dostępu do React Context.
   *
   * @returns {Promise<boolean>} true jeśli udało się zastosować ZAPISANĄ
   *   lokalizację (wołający wie wtedy, że nie musi strzelać po GPS)
   */
  setStartLocation: async (locationAccepted, getSavedLocation) => {
    if (!locationAccepted) {
      set({ userLocation: DEFAULT_LOCATION, hasUserLocation: false });
      get().flyTo(DEFAULT_CAMERA.centerCoordinate, DEFAULT_CAMERA.zoomLevel);
      return false;
    }

    try {
      const result = await getSavedLocation();
      if (result.success && result.location) {
        const location = {
          latitude: result.location.latitude,
          longitude: result.location.longitude,
          City: result.location.City || "",
          region: result.location.region || "",
          Country: result.location.Country || "Poland",
        };
        set({ userLocation: location, hasUserLocation: true });
        get().flyTo([result.location.longitude, result.location.latitude], 12);
        return true;
      }

      set({ userLocation: DEFAULT_LOCATION, hasUserLocation: false });
      get().flyTo(DEFAULT_CAMERA.centerCoordinate, DEFAULT_CAMERA.zoomLevel);
      return false;
    } catch (error) {
      console.error("Błąd pobierania lokalizacji:", error);
      set({ userLocation: DEFAULT_LOCATION, hasUserLocation: false });
      get().flyTo(DEFAULT_CAMERA.centerCoordinate, DEFAULT_CAMERA.zoomLevel);
      return false;
    }
  },

  /** Ustawia lokalizację użytkownika i od razu centruje na niej mapę */
  applyUserLocation: (location, zoom = 12) => {
    set({ userLocation: location, hasUserLocation: true });
    get().flyTo([location.longitude, location.latitude], zoom);
  },

  /** Reset do fallbacku (używane po "Usuń lokalizację" w ustawieniach) */
  clearUserLocation: () => {
    set({ userLocation: DEFAULT_LOCATION, hasUserLocation: false });
    get().flyTo(DEFAULT_CAMERA.centerCoordinate, DEFAULT_CAMERA.zoomLevel);
  },
}));
