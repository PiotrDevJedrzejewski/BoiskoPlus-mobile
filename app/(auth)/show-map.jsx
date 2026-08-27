import React, {
  useCallback,
  useState,
  useEffect,
  useRef,
  useMemo,
} from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  TextInput,
  Text,
  ActivityIndicator,
  Alert,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import LottieView from "lottie-react-native";
import { useMapStore } from "../../context/mapStore";
import { useDashboard } from "../../context/DashboardContext";
import { useAuth } from "../../context/AuthContext";
import CitySuggestions from "../../components/CitySuggestions";
import MapboxMobile from "../../components/MapboxMobile";
import {
  filterCitySuggestions,
  validateCityInput,
} from "../../assets/utils/citySearchUtils";
import customFetch from "../../assets/utils/customFetch";
import placesData from "../../assets/data/miejscowosci_wojewodztwa.json";
import sportsPlacesData from "../../assets/data/orliki_hale_polaczony_naprawiony.json";
import { getNearbyPlaces } from "../../assets/utils/geoDistance";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Toast } from "toastify-react-native";
import { fetchAndSaveLocation } from "../../assets/utils/getUserLocation";
import { dbg, useDebugMount } from "../../assets/utils/debugLogger";
import PlaceModal from "../../components/popup/PlaceModal";
import spinner from "../../assets/utils/spinner.json";

import { useThemedStyles } from "../../context/themeStore";
import { SPACING, BORDER_RADIUS } from "../../Theme/StyleConstants";
import {
  scale,
  verticalScale,
  moderateScale,
  scaleFont,
} from "../../Theme/ScalableStyles";

const SUGGESTIONS_DEBOUNCE_MS = 80;
const SUGGESTIONS_LIMIT = 30;

// Map background — renders the actual Mapbox map behind the screen UI
const MapBackground = React.memo(function MapBackground() {
  dbg("MapBackground");
  const isInteractive = useMapStore((s) => s.isInteractive);
  const overlayOpacity = useMapStore((s) => s.overlayOpacity);

  return (
    <View
      style={mapLayoutStyles.mapBackground}
      pointerEvents={isInteractive ? "auto" : "none"}
    >
      <MapboxMobile isInteractive={isInteractive} />
      {!isInteractive && overlayOpacity > 0 && (
        <View
          style={[
            mapLayoutStyles.mapOverlay,
            { backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})` },
          ]}
          pointerEvents="none"
        />
      )}
    </View>
  );
});

// Fullscreen loading overlay — hides map loading + Poland repositioning jank
const MapLoadingScreen = React.memo(function MapLoadingScreen() {
  dbg("MapLoadingScreen");
  const isMapReady = useMapStore((s) => s.isMapReady);
  const { colors } = useThemedStyles(createStyles);

  if (isMapReady) return null;

  return (
    <View
      style={[
        mapLayoutStyles.loadingOverlay,
        { backgroundColor: colors.background },
      ]}
      pointerEvents="none"
    >
      <LottieView
        source={spinner}
        autoPlay
        loop
        style={mapLayoutStyles.spinner}
      />
    </View>
  );
});

const ShowMap = () => {
  dbg("ShowMapScreen");
  useDebugMount("ShowMapScreen");

  const flyTo = useMapStore((s) => s.flyTo);
  const flyToProvince = useMapStore((s) => s.flyToProvince);
  const setShowMarkers = useMapStore((s) => s.setShowMarkers);
  const showMarkers = useMapStore((s) => s.showMarkers);
  const showEvents = useMapStore((s) => s.showEvents);
  const setShowEvents = useMapStore((s) => s.setShowEvents);
  const setIsInteractive = useMapStore((s) => s.setIsInteractive);
  const setOverlayOpacity = useMapStore((s) => s.setOverlayOpacity);
  const userLocation = useMapStore((s) => s.userLocation);
  const applyUserLocation = useMapStore((s) => s.applyUserLocation);
  const isMapReady = useMapStore((s) => s.isMapReady);
  const { setFilteredEvents } = useDashboard();
  const {
    consents,
    pendingConsents,
    getThrottledLocation,
    saveLocation,
    reverseGeocode,
  } = useAuth();

  const { styles, colors } = useThemedStyles(createStyles);

  const [userInput, setUserInput] = useState({
    latitude: null,
    longitude: null,
    City: "",
    Country: "Poland",
    region: "",
    distance: 5,
  });
  const [switched, setSwitched] = useState(true); // true = mapa, false = obiekty

  const [cityInput, setCityInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionSelected, setSuggestionSelected] = useState(false);
  const [loading, setLoading] = useState(false);
  const nearbyPlaces = useMemo(
    () =>
      getNearbyPlaces(sportsPlacesData, userLocation, {
        maxDistanceKm: 50,
      }),
    [userLocation.latitude, userLocation.longitude],
  );
  const isMountedRef = useRef(true);
  const suggestionsDebounceRef = useRef(null);
  const searchAbortControllerRef = useRef(null);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (suggestionsDebounceRef.current) {
        clearTimeout(suggestionsDebounceRef.current);
      }
      if (searchAbortControllerRef.current) {
        searchAbortControllerRef.current.abort();
      }
    };
  }, []);

  // Włącz interaktywność mapy gdy ekran jest aktywny
  useFocusEffect(
    useCallback(() => {
      setIsInteractive(true);
      setOverlayOpacity(0); // Brak przyciemnienia na mapie

      return () => {
        setIsInteractive(false);
        setOverlayOpacity(0.3); // Przywróć przyciemnienie
      };
    }, []),
  );

  // Skonsumuj "zlecenie" wycentrowania mapy zgłoszone z innego ekranu
  // (np. events-managment/*) przez useMapStore.getState().setPendingFlyTo(...)
  // przed nawigacją. Czekamy na isMapReady, żeby nie zgubić komendy zanim
  // <Mapbox.Camera> zdoła się zamontować.
  useEffect(() => {
    if (!isMapReady) return;
    const pending = useMapStore.getState().pendingFlyTo;
    if (pending) {
      flyTo(pending.coordinates, pending.zoom);
      useMapStore.getState().clearPendingFlyTo();
    }
  }, [isMapReady, flyTo]);

  // Aktualizuj podpowiedzi - tylko gdy użytkownik aktywnie wpisuje
  useEffect(() => {
    if (suggestionsDebounceRef.current) {
      clearTimeout(suggestionsDebounceRef.current);
    }

    if (suggestionSelected) {
      setSuggestions([]);
      return;
    }

    const normalizedInput = cityInput?.trim();

    // Pokaż sugestie tylko gdy użytkownik aktywnie wpisuje
    if (!normalizedInput) {
      setSuggestions([]);
      return;
    }

    suggestionsDebounceRef.current = setTimeout(() => {
      if (!isMountedRef.current) {
        return;
      }

      const filteredSuggestions = filterCitySuggestions(
        normalizedInput,
        placesData,
        2,
        SUGGESTIONS_LIMIT,
      );
      // Zachowaj strukturę { province, cities } zamiast spłaszczać
      setSuggestions(filteredSuggestions);
    }, SUGGESTIONS_DEBOUNCE_MS);

    return () => {
      if (suggestionsDebounceRef.current) {
        clearTimeout(suggestionsDebounceRef.current);
      }
    };
  }, [cityInput, suggestionSelected]);

  const handleInputChange = (text) => {
    setCityInput(text);
    setSuggestionSelected(false);
  };

  const handleSuggestionClick = (city, province) => {
    setCityInput(city);
    // Ustaw tymczasowo region w userInput
    setUserInput((prev) => ({ ...prev, region: province }));
    setSuggestions([]);
    setSuggestionSelected(true);
  };

  const handleSearch = async () => {
    setLoading(true);

    if (searchAbortControllerRef.current) {
      searchAbortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    searchAbortControllerRef.current = abortController;

    // Użyj lokalizacji użytkownika lub fallback na userLocation
    let finalCity =
      cityInput.trim() || (consents.locationAccepted ? userLocation.City : "");
    let finalRegion =
      userInput.region ||
      (consents.locationAccepted ? userLocation.region : "");

    // Współrzędne - użyj userLocation tylko jeśli użytkownik nie wpisał własnego miasta
    let finalLatitude = null;
    let finalLongitude = null;

    if (!cityInput.trim() && consents.locationAccepted) {
      // Użyj współrzędnych z userLocation tylko gdy nie ma własnego miasta
      finalLatitude = userLocation.latitude;
      finalLongitude = userLocation.longitude;
    }

    if (!finalCity) {
      Alert.alert("Błąd", "Proszę wpisać miasto lub włączyć lokalizację");
      if (isMountedRef.current) {
        setLoading(false);
      }
      return;
    }

    // Walidacja miasta tylko jeśli użytkownik wpisał własne miasto
    if (cityInput.trim()) {
      const validation = validateCityInput(
        cityInput,
        userInput.region,
        placesData,
      );

      if (!validation.isValid) {
        Alert.alert("Błąd", validation.error);
        if (isMountedRef.current) {
          setLoading(false);
        }
        return;
      }

      // Ustaw region jeśli został znaleziony
      if (validation.region) {
        finalRegion = validation.region;
      }
    }

    try {
      const response = await customFetch.post(
        "/football-events/search",
        {
          latitude: finalLatitude,
          longitude: finalLongitude,
          Country: userLocation.Country || "Poland",
          region: finalRegion,
          City: finalCity,
          distance: 5,
        },
        {
          signal: abortController.signal,
        },
      );

      const events = response.data.events || [];
      if (!isMountedRef.current) {
        return;
      }

      setFilteredEvents(response.data);

      // Logika centrowania mapy w zależności od liczby znalezionych eventów
      if (events.length === 0) {
        // Brak eventów - wyśrodkuj na województwie jeśli istnieje
        if (finalRegion) {
          flyToProvince(finalRegion);
          Toast.info("Nie znaleziono wydarzeń w tym mieście.", "top");
        }
      } else if (events.length === 1) {
        // Jeden event - wyśrodkuj na nim
        const event = events[0];
        if (event.geolocation?.coordinates) {
          const [longitude, latitude] = event.geolocation.coordinates;
          flyTo([longitude, latitude], 14);
        }
      } else {
        // Wiele eventów - wyśrodkuj na średniej z max 4 pierwszych
        const eventsToCenter = events.slice(0, 4);
        const validCoords = eventsToCenter
          .filter((event) => event.geolocation?.coordinates)
          .map((event) => event.geolocation.coordinates);

        if (validCoords.length > 0) {
          const avgLongitude =
            validCoords.reduce((sum, coords) => sum + coords[0], 0) /
            validCoords.length;
          const avgLatitude =
            validCoords.reduce((sum, coords) => sum + coords[1], 0) /
            validCoords.length;
          flyTo([avgLongitude, avgLatitude], 12);
        }
      }
    } catch (err) {
      if (err?.code === "ERR_CANCELED" || err?.name === "CanceledError") {
        return;
      }

      console.error("Błąd wyszukiwania:", err);
      Alert.alert("Błąd", "Nie udało się wyszukać wydarzeń");
    } finally {
      if (searchAbortControllerRef.current === abortController) {
        searchAbortControllerRef.current = null;
      }
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const handleMyLocation = async () => {
    // Sprawdź zgodę na lokalizację
    if (!pendingConsents.locationAccepted && !consents?.locationAccepted) {
      Toast.error(
        "Brak zgody na lokalizację. Możesz zmienić to w ustawieniach.",
        "top",
      );
      return;
    }

    // Sprawdź throttling
    const throttleResult = await getThrottledLocation();
    if (throttleResult.throttled) {
      Toast.info(throttleResult.error, "top");
      return;
    }

    try {
      // Pobierz aktualną lokalizację z GPS, reverse-geocoduj i zapisz w AsyncStorage
      const result = await fetchAndSaveLocation({
        reverseGeocode,
        saveLocation,
      });

      if (!result.success) {
        Toast.error("System blokuje lokalizację", "top");
        return;
      }

      // Zaktualizuj store + wyśrodkuj mapę na aktualnej lokalizacji
      applyUserLocation(result.location, 14);

      Toast.success("Lokalizacja zaktualizowana", "top");
    } catch (error) {
      console.error("Błąd pobierania lokalizacji:", error);
      Toast.error("Nie udało się pobrać lokalizacji", "top");
    }
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* 1. Map as background layer */}
      <MapBackground />

      {/* 2. Screen content rendered on top of the map */}
      <View style={mapLayoutStyles.contentContainer} pointerEvents="box-none">
        {/* Main UI */}
        <View style={styles.switcherContainer}>
          <Pressable
            style={[
              styles.switcherButton,
              switched ? styles.activeSwitcherButton : null,
            ]}
            onPress={() => setSwitched(true)}
          >
            <Ionicons
              name="map"
              size={scale(14, 0.25)}
              color={switched ? colors.background : colors.primaryText}
            />
            <Text
              style={[
                { color: switched ? colors.background : colors.primaryText },
                styles.switchButtonText,
              ]}
            >
              Mapa
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.switcherButton,
              !switched ? styles.activeSwitcherButton : null,
            ]}
            onPress={() => setSwitched(false)}
          >
            <Ionicons
              name="map"
              size={scale(14, 0.25)}
              color={!switched ? colors.background : colors.primaryText}
            />
            <Text
              style={[
                { color: !switched ? colors.background : colors.primaryText },
                styles.switchButtonText,
              ]}
            >
              Obiekty
            </Text>
          </Pressable>
        </View>
        {/* text input */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <TextInput
              style={styles.searchInput}
              value={cityInput}
              onChangeText={handleInputChange}
              placeholder={
                consents.locationAccepted && userLocation.City
                  ? userLocation.City
                  : "Wpisz miasto..."
              }
              placeholderTextColor={colors.Placeholder}
              autoCorrect={false}
              autoCapitalize="none"
            />
            <Pressable
              style={styles.searchButton}
              onPress={handleSearch}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.background} />
              ) : (
                <Text style={styles.searchButtonText}>Szukaj</Text>
              )}
            </Pressable>
          </View>
        </View>

        {/* Sugestie */}
        <CitySuggestions
          suggestions={suggestions}
          onSuggestionClick={handleSuggestionClick}
        />

        {/* Controlki */}
        <View style={styles.controlsContainer}>
          <Text style={styles.controlButtonTextLocation}>Znajdź</Text>
          <Pressable
            style={styles.controlButton}
            onPress={handleMyLocation}
            activeOpacity={0.8}
          >
            <Ionicons name="locate" style={styles.controlIconBasic} />
          </Pressable>

          <Text style={styles.controlButtonTextLocation}>Boiska</Text>
          <Pressable
            style={styles.controlButton}
            onPress={() => setShowMarkers(!showMarkers)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={showMarkers ? "eye" : "eye-off"}
              style={[
                styles.controlIconBasic,
                { opacity: showMarkers ? 1 : 0.5 },
              ]}
            />
          </Pressable>

          <Text style={styles.controlButtonTextLocation}>Mecze</Text>
          <Pressable
            style={styles.controlButton}
            onPress={() => setShowEvents(!showEvents)}
            activeOpacity={0.8}
          >
            <MaterialIcons
              name={showEvents ? "location-on" : "location-off"}
              style={[
                styles.controlIconBasic,
                { opacity: showEvents ? 1 : 0.5 },
              ]}
            />
          </Pressable>
        </View>
        <PlaceModal
          visible={!switched}
          closeModal={() => setSwitched(true)}
          places={nearbyPlaces}
        />
      </View>

      {/* 3. Loading overlay — covers everything until map is ready */}
      <MapLoadingScreen />
    </View>
  );
};

export default ShowMap;

const mapLayoutStyles = StyleSheet.create({
  mapBackground: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 0,
  },
  mapOverlay: {
    ...StyleSheet.absoluteFill,
  },
  contentContainer: {
    flex: 1,
    zIndex: 1,
    backgroundColor: "transparent",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  spinner: {
    width: 80,
    height: 80,
  },
});

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "transparent",
      position: "relative",
    },
    switcherContainer: {
      flexDirection: "row",
      width: "100%",
      justifyContent: "space-around",
      alignItems: "center",
      backgroundColor: colors.backgroundSecondary,
    },
    switcherButton: {
      flex: 1,
      borderRadius: BORDER_RADIUS.md,
      flexDirection: "row",
      alignItems: "center",
      padding: 10,
      justifyContent: "center",
    },
    activeSwitcherButton: {
      backgroundColor: colors.PrimaryGreen,
    },
    switchButtonText: {
      marginLeft: 5,
      fontSize: scaleFont(16, 0.25),
      fontFamily: "Inter-SemiBold",
    },

    searchContainer: {
      marginTop: SPACING.sm,
      flexDirection: "row",
      width: "100%",
      alignItems: "center",
      justifyContent: "center",
    },
    searchBox: {
      flexDirection: "row",
      alignItems: "center",
      width: "90%",
      backgroundColor: colors.backgroundSecondary,
      borderRadius: BORDER_RADIUS.md,
    },
    searchInput: {
      flex: 1,
      color: colors.primaryText,
      fontSize: scaleFont(16, 0.25),
      padding: 10,
      backgroundColor: colors.primaryCard,
      borderRadius: BORDER_RADIUS.md,
      fontFamily: "Inter-Regular",
    },
    searchButton: {
      padding: 10,
      width: scale(80, 0.25),
      backgroundColor: colors.DarkGreen,
      borderTopRightRadius: BORDER_RADIUS.md,
      borderBottomRightRadius: BORDER_RADIUS.md,
      alignItems: "center",
      justifyContent: "center",
    },
    searchButtonText: {
      color: colors.background,
      fontSize: scaleFont(16, 0.25),
      fontFamily: "Inter-SemiBold",
    },

    controlsContainer: {
      position: "absolute",
      right: SPACING.sm,
      bottom: verticalScale(100),
      gap: verticalScale(12),
    },
    controlButton: {
      width: moderateScale(48, 0.35),
      height: moderateScale(48, 0.35),
      borderRadius: moderateScale(24, 0.35),
      backgroundColor: colors.secondaryCard,
      alignItems: "center",
      justifyContent: "center",
    },
    controlButtonTextLocation: {
      fontSize: scaleFont(10, 0.25),
      color: colors.primaryText,
      textAlign: "center",
      fontFamily: "Inter-SemiBold",
    },
    controlIconBasic: {
      fontSize: scale(24, 0.25),
      color: colors.ActiveIcon,
    },
  });
