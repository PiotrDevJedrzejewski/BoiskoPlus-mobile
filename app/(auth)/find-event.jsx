import { useState, useEffect, useRef, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  ActivityIndicator,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import CitySuggestions from "../../components/CitySuggestions";
import { useDashboard } from "../../context/DashboardContext";
import { useAuth } from "../../context/AuthContext";
import { Toast } from "toastify-react-native";
import { useRouter } from "expo-router";
import {
  validateCityInput,
  filterCitySuggestions,
} from "../../assets/utils/citySearchUtils";
import customFetch from "../../assets/utils/customFetch";
import placesData from "../../assets/data/miejscowosci_wojewodztwa.json";
import { dbg, useDebugMount } from "../../assets/utils/debugLogger";
import AntDesign from "@expo/vector-icons/AntDesign";
import LottieView from "lottie-react-native";
import spinnerData from "../../assets/utils/spinner.json";
import CustomTypePickerModal from "../../components/popup/CustomTypePickerModal";
import EventSimpleCard from "../../components/Cards/EventSimpleCard";
import { buildUserStatusMap } from "../../assets/utils/eventDisplay";

import { useThemedStyles } from "../../context/themeStore";
import { SPACING, BORDER_RADIUS } from "../../Theme/StyleConstants";
import {
  scale,
  verticalScale,
  moderateScale,
  scaleFont,
} from "../../Theme/ScalableStyles";
import BottomSpacer from "../../components/BottomSpacer";

const GAME_TYPES = [
  { label: "Wybierz typ gry", value: "" },
  { label: "Piłka nożna", value: "football" },
  { label: "Siatkówka", value: "volleyball" },
  { label: "Koszykówka", value: "basketball" },
  { label: "Piłka ręczna", value: "handball" },
  { label: "Rugby", value: "rugby" },
  { label: "Hokej", value: "hockey" },
  { label: "Tenis", value: "tennis" },
  { label: "Badminton", value: "badminton" },
  { label: "Tenis stołowy", value: "table tennis" },
  { label: "Kręgle", value: "bowling" },
  { label: "Karty", value: "cards" },
  { label: "Planszówki", value: "board games" },
  { label: "Inne", value: "other" },
];

const SUGGESTIONS_DEBOUNCE_MS = 80;
const SUGGESTIONS_LIMIT = 30;
const EVENT_NAME_MAX = 50;

const FindEvent = () => {
  dbg("FindEventScreen");
  useDebugMount("FindEventScreen");

  const { styles, colors } = useThemedStyles(createStyles);

  const router = useRouter();
  const { consents, getSavedLocation } = useAuth();
  const [userLocation, setUserLocation] = useState({
    latitude: null,
    longitude: null,
    City: "",
    Country: "Poland",
    region: "",
  });
  const [loading, setLoading] = useState(false);
  const [userInput, setUserInput] = useState({
    latitude: null,
    longitude: null,
    City: "",
    Country: "Poland",
    region: "",
    distance: 5,
    gameType: "",
    eventName: "",
  });
  const { filteredEvents, setFilteredEvents, eventsData } = useDashboard();
  const [hasSearched, setHasSearched] = useState(false);
  const [showList, setShowList] = useState(true);
  const [filteredByGameType, setFilteredByGameType] = useState(filteredEvents);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionSelected, setSuggestionSelected] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const isMountedRef = useRef(true);
  const suggestionsDebounceRef = useRef(null);
  const searchAbortControllerRef = useRef(null);
  const loadingTimerRef = useRef(null);
  const lastSearchParamsRef = useRef(null);
  const [showGameTypeModal, setShowGameTypeModal] = useState(false);
  const listOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (suggestionsDebounceRef.current) {
        clearTimeout(suggestionsDebounceRef.current);
      }
      if (searchAbortControllerRef.current) {
        searchAbortControllerRef.current.abort();
      }
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
      }
    };
  }, []);

  // Pobierz zapisaną lokalizację użytkownika
  useEffect(() => {
    let isActive = true;

    const loadLocation = async () => {
      if (!consents.locationAccepted) return;
      const result = await getSavedLocation();
      if (isActive && result.success && result.location) {
        setUserLocation({
          latitude: result.location.latitude,
          longitude: result.location.longitude,
          City: result.location.City || "",
          region: result.location.region || "",
          Country: result.location.Country || "Poland",
        });
      }
    };

    loadLocation();

    return () => {
      isActive = false;
    };
  }, [consents.locationAccepted, getSavedLocation]);

  // Ustaw początkową lokalizację z userLocation
  useEffect(() => {
    if (consents.locationAccepted && userLocation.City) {
      setUserInput((prev) => ({
        ...prev,
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        City: userLocation.City,
        region: userLocation.region,
        Country: userLocation.Country || "Poland",
      }));
    }
  }, [userLocation, consents.locationAccepted]);

  // Aktualizuj podpowiedzi - tylko gdy użytkownik aktywnie wpisuje
  useEffect(() => {
    if (suggestionsDebounceRef.current) {
      clearTimeout(suggestionsDebounceRef.current);
    }

    if (suggestionSelected) {
      setSuggestions([]);
      return;
    }

    const cityInput = userInput.City?.trim();

    // Pokaż sugestie tylko gdy użytkownik aktywnie wpisuje
    if (!cityInput) {
      setSuggestions([]);
      return;
    }

    // Jeśli miasto pochodzi z userLocation, nie pokazuj podpowiedzi
    if (
      consents.locationAccepted &&
      userLocation.City &&
      cityInput === userLocation.City
    ) {
      setSuggestions([]);
      return;
    }

    suggestionsDebounceRef.current = setTimeout(() => {
      if (!isMountedRef.current) {
        return;
      }

      const filteredSuggestions = filterCitySuggestions(
        cityInput,
        placesData,
        2,
        SUGGESTIONS_LIMIT,
      );
      setSuggestions(filteredSuggestions);
    }, SUGGESTIONS_DEBOUNCE_MS);

    return () => {
      if (suggestionsDebounceRef.current) {
        clearTimeout(suggestionsDebounceRef.current);
      }
    };
  }, [
    userInput.City,
    suggestionSelected,
    consents.locationAccepted,
    userLocation.City,
  ]);

  // Aktualizuj UI gdy filteredEvents zmieni się z innego ekranu (np. show-map)
  useEffect(() => {
    if (
      filteredEvents &&
      filteredEvents.events &&
      filteredEvents.events.length > 0
    ) {
      setHasSearched(true);
      Animated.timing(listOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }
  }, [filteredEvents]);

  // Filtrowanie po gameType
  useEffect(() => {
    if (filteredEvents && filteredEvents.events) {
      if (userInput.gameType && userInput.gameType !== "") {
        const filtered = filteredEvents.events.filter(
          (event) => event.gameType === userInput.gameType,
        );
        setFilteredByGameType({
          ...filteredEvents,
          events: filtered,
          total: filtered.length,
        });
      } else {
        setFilteredByGameType(filteredEvents);
      }
    }
  }, [filteredEvents, userInput.gameType]);

  const handleSubmit = async () => {
    setLoading(true);
    setHasSearched(true);
    setCurrentPage(1);
    setHasMore(false);
    if (loadingTimerRef.current) {
      clearTimeout(loadingTimerRef.current);
    }
    listOpacity.setValue(0);

    if (searchAbortControllerRef.current) {
      searchAbortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    searchAbortControllerRef.current = abortController;

    // Użyj lokalizacji użytkownika lub fallback na userLocation
    let finalCity =
      userInput.City.trim() ||
      (consents.locationAccepted ? userLocation.City : "");
    let finalRegion =
      userInput.region ||
      (consents.locationAccepted ? userLocation.region : "");

    // Współrzędne
    let finalLatitude = userInput.latitude;
    let finalLongitude = userInput.longitude;

    if (!userInput.City.trim() && consents.locationAccepted) {
      finalLatitude = userLocation.latitude;
      finalLongitude = userLocation.longitude;
    }

    if (!finalCity) {
      Toast.error(
        "Proszę wpisać miasto lub włączyć lokalizację w ustawieniach",
        "top",
      );
      if (isMountedRef.current) {
        setLoading(false);
      }
      return;
    }

    // Walidacja miasta jeśli użytkownik wpisał własne miasto
    if (userInput.City.trim()) {
      const validation = validateCityInput(
        userInput.City,
        userInput.region,
        placesData,
      );

      if (!validation.isValid) {
        Toast.error(validation.error, "top");
        if (isMountedRef.current) {
          setLoading(false);
        }
        return;
      }

      if (validation.region) {
        finalRegion = validation.region;
      }
    }

    try {
      const searchParams = {
        latitude: finalLatitude,
        longitude: finalLongitude,
        Country: userLocation.Country || "Poland",
        region: finalRegion,
        City: finalCity,
        distance: userInput.distance,
        eventName: userInput.eventName?.trim() || undefined,
        page: 1,
        limit: 50,
      };
      lastSearchParamsRef.current = searchParams;

      const response = await customFetch.post(
        "/football-events/search",
        searchParams,
        {
          signal: abortController.signal,
        },
      );

      const events = response.data.events || [];
      if (!isMountedRef.current) {
        return;
      }

      setFilteredEvents(response.data);
      setHasMore(response.data.hasMore || false);
      setCurrentPage(1);

      if (events.length === 0 && finalRegion) {
        Toast.info("Nie znaleziono wydarzeń w tym mieście.", "top");
      }
    } catch (err) {
      if (err?.code === "ERR_CANCELED" || err?.name === "CanceledError") {
        return;
      }

      console.error("Błąd wyszukiwania:", err);
      Toast.error("Nie udało się wyszukać wydarzeń", "top");
    } finally {
      if (searchAbortControllerRef.current === abortController) {
        searchAbortControllerRef.current = null;
      }
      if (isMountedRef.current) {
        loadingTimerRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            setLoading(false);
            Animated.timing(listOpacity, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }).start();
          }
        }, 700);
      }
    }
  };

  const toggleView = () => {
    setShowList(!showList);
  };

  const handleSuggestionClick = (city, province) => {
    setUserInput((prev) => ({ ...prev, City: city, region: province }));
    setSuggestions([]);
    setSuggestionSelected(true);
  };

  const handleCityInputChange = (text) => {
    setUserInput((prev) => ({ ...prev, City: text }));
    setSuggestionSelected(false);
  };

  const handleEventPress = (eventId) => {
    // Nawigacja do szczegółów wydarzenia
    router.push(`/(auth)/single-event?id=${eventId}`);
  };

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore || !lastSearchParamsRef.current) return;

    setLoadingMore(true);
    const nextPage = currentPage + 1;

    try {
      const response = await customFetch.post("/football-events/search", {
        ...lastSearchParamsRef.current,
        page: nextPage,
      });

      if (!isMountedRef.current) return;

      const newEvents = response.data.events || [];
      setFilteredEvents((prev) => ({
        ...response.data,
        events: [...(prev?.events || []), ...newEvents],
      }));
      setHasMore(response.data.hasMore || false);
      setCurrentPage(nextPage);
    } catch (err) {
      if (err?.code === "ERR_CANCELED" || err?.name === "CanceledError") return;
      console.error("Błąd ładowania więcej:", err);
      Toast.error("Nie udało się załadować więcej wydarzeń", "top");
    } finally {
      if (isMountedRef.current) {
        setLoadingMore(false);
      }
    }
  };

  const handleGameTypeSelect = (value) => {
    setUserInput((prev) => ({ ...prev, gameType: value }));
  };

  const events = filteredByGameType?.events || [];
  const statusMap = useMemo(
    () => buildUserStatusMap(eventsData.userEvents),
    [eventsData.userEvents],
  );

  const renderEvent = ({ item }) => (
    <EventSimpleCard
      event={item}
      myStatus={statusMap[item._id]}
      onPress={() => handleEventPress(item._id)}
    />
  );

  const renderEmpty = () => (
    <View style={styles.stateContainer}>
      <Ionicons
        name={hasSearched ? "sad-outline" : "search-outline"}
        size={24}
        color={colors.Placeholder}
      />
      <Text style={styles.stateText}>
        {hasSearched
          ? "Nie znaleziono wydarzeń w tej okolicy"
          : "Wpisz miasto i wyszukaj wydarzenia"}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchHeader}>
          <Text style={styles.searchHeaderText}>Znajdź wydarzenie</Text>
          <Pressable style={styles.filters}>
            <AntDesign
              name="unordered-list"
              size={16}
              color={colors.primaryText}
            />
            <Text style={styles.filtersText}>Filtry</Text>
          </Pressable>
        </View>
        {/* text input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Wpisz miasto"
            placeholderTextColor={colors.Placeholder}
            value={userInput.City}
            onChangeText={handleCityInputChange}
            onSubmitEditing={handleSubmit}
            returnKeyType="search"
          />
          <Pressable style={styles.searchButton} onPress={handleSubmit}>
            <Ionicons name="search" size={16} color={colors.primaryCard} />
            <Text style={styles.searchButtonText}>Szukaj</Text>
          </Pressable>
        </View>
        {suggestions.length > 0 && (
          <CitySuggestions
            suggestions={suggestions}
            onSuggestionClick={handleSuggestionClick}
          />
        )}
      </View>

      {loading ? (
        <View style={styles.stateContainer}>
          <LottieView
            source={spinnerData}
            autoPlay
            loop
            style={styles.spinner}
          />
        </View>
      ) : (
        <Animated.FlatList
          style={[styles.list, { opacity: listOpacity }]}
          contentContainerStyle={styles.listContent}
          data={events}
          extraData={statusMap}
          keyExtractor={(item) => item._id}
          renderItem={renderEvent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={
            <>
              {loadingMore && (
                <ActivityIndicator
                  color={colors.PrimaryGreen}
                  style={styles.footerLoader}
                />
              )}
              <BottomSpacer />
            </>
          }
        />
      )}
    </View>
  );
};

export default FindEvent;

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    searchContainer: {
      marginTop: SPACING.md,
      paddingHorizontal: SPACING.sm,
    },
    searchHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
    },
    searchHeaderText: {
      color: colors.primaryText,
      fontFamily: "ObjectFont",
      fontSize: scaleFont(18, 0.25),
    },
    filters: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      borderWidth: 1,
      borderRadius: BORDER_RADIUS.md,
      borderColor: colors.border,
    },
    filtersText: {
      color: colors.PrimaryGreen,
    },
    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
    },
    textInput: {
      flex: 1,
      color: colors.primaryText,
      fontSize: scaleFont(16, 0.25),
      padding: 10,
      backgroundColor: colors.primaryCard,
      borderTopLeftRadius: BORDER_RADIUS.md,
      borderBottomLeftRadius: BORDER_RADIUS.md,
    },
    searchButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      backgroundColor: colors.DarkGreen,
      // borderRadius: BORDER_RADIUS.md,
      borderTopRightRadius: BORDER_RADIUS.md,
      borderBottomRightRadius: BORDER_RADIUS.md,
    },
    searchButtonText: {
      color: colors.primaryCard,
    },
    list: {
      flex: 1,
    },
    listContent: {
      flexGrow: 1,
      paddingHorizontal: SPACING.sm,
      paddingTop: SPACING.sm,
    },
    stateContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: SPACING.lg,
      paddingTop: verticalScale(80),
      gap: SPACING.md,
    },
    stateText: {
      color: colors.Placeholder,
      fontSize: scaleFont(14, 0.25),
      textAlign: "center",
    },
    spinner: {
      width: moderateScale(80),
      height: moderateScale(80),
    },
    footerLoader: {
      marginVertical: SPACING.md,
    },
  });
