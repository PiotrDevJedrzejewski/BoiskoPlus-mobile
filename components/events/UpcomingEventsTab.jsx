import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Slider } from "@miblanchard/react-native-slider";
import { Toast } from "toastify-react-native";

import BottomSpacer from "../BottomSpacer";
import EventSimpleCard from "../Cards/EventSimpleCard";
import CitySuggestions from "../CitySuggestions";
import CustomTypePickerModal from "../popup/CustomTypePickerModal";
import { useDashboard } from "../../context/DashboardContext";
import { useMapStore } from "../../context/mapStore";
import { useThemedStyles } from "../../context/themeStore";
import {
  filterCitySuggestions,
  validateCityInput,
} from "../../assets/utils/citySearchUtils";
import placesData from "../../assets/data/miejscowosci_wojewodztwa.json";
import {
  fetchNearbyEvents,
  parseEventDate,
} from "../../assets/utils/eventsApi";
import { buildUserStatusMap } from "../../assets/utils/eventDisplay";
import { toDateKey } from "../WeekCalendar";
import { BORDER_RADIUS, SPACING } from "../../Theme/StyleConstants";
import {
  moderateScale,
  scaleFont,
  verticalScale,
} from "../../Theme/ScalableStyles";

const DEFAULT_DISTANCE = 80;
const PAGE_SIZE = 50;
const SUGGESTIONS_LIMIT = 30;
const SUGGESTIONS_DEBOUNCE_MS = 100;

const GAME_TYPES = [
  { label: "Wszystkie typy", value: "" },
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

const LEVELS = [
  { label: "Wszystkie poziomy", value: "" },
  { label: "Początkujący", value: "beginner" },
  { label: "Średniozaawansowany", value: "intermediate" },
  { label: "Zaawansowany", value: "advanced" },
  { label: "Profesjonalny", value: "professional" },
  { label: "Inny", value: "other" },
];

const createDefaultFilters = () => ({
  City: "",
  region: "",
  distance: DEFAULT_DISTANCE,
  eventName: "",
  gameType: "",
  minPlayerCount: "",
  level: "",
  maxPrice: "",
  ageRange: [0, 100],
});

const getOptionLabel = (options, value) =>
  options.find((option) => option.value === value)?.label || "Wszystkie";

const sanitizeOptionalNumber = (value) => {
  if (value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const UpcomingEventsTab = ({
  filtersVisible,
  onCloseFilters,
  selectedDate,
  unreadEventIds,
  onEventPress,
}) => {
  const { styles, colors } = useThemedStyles(createStyles);
  const { filteredEvents, setFilteredEvents, eventsData } = useDashboard();
  const userLocation = useMapStore((state) => state.userLocation);
  const hasUserLocation = useMapStore((state) => state.hasUserLocation);
  const locationResolved = useMapStore((state) => state.locationResolved);

  const [appliedFilters, setAppliedFilters] = useState(createDefaultFilters);
  const [draftFilters, setDraftFilters] = useState(createDefaultFilters);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionSelected, setSuggestionSelected] = useState(false);
  const [cityInputLayout, setCityInputLayout] = useState(null);
  const [pickerField, setPickerField] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const isMountedRef = useRef(true);
  const abortControllerRef = useRef(null);
  const suggestionsTimerRef = useRef(null);

  useEffect(() => {
    if (filtersVisible) {
      setDraftFilters(appliedFilters);
      setSuggestions([]);
      setSuggestionSelected(false);
    }
  }, [appliedFilters, filtersVisible]);

  useEffect(() => {
    if (suggestionsTimerRef.current) {
      clearTimeout(suggestionsTimerRef.current);
    }

    const city = draftFilters.City.trim();
    if (!filtersVisible || suggestionSelected || city.length < 2) {
      setSuggestions([]);
      return undefined;
    }

    suggestionsTimerRef.current = setTimeout(() => {
      setSuggestions(
        filterCitySuggestions(city, placesData, 2, SUGGESTIONS_LIMIT),
      );
    }, SUGGESTIONS_DEBOUNCE_MS);

    return () => {
      if (suggestionsTimerRef.current) {
        clearTimeout(suggestionsTimerRef.current);
      }
    };
  }, [draftFilters.City, filtersVisible, suggestionSelected]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      const activeController = abortControllerRef.current;
      abortControllerRef.current = null;
      activeController?.abort();
      if (suggestionsTimerRef.current) {
        clearTimeout(suggestionsTimerRef.current);
      }
    };
  }, []);

  const buildSearchParams = useCallback(
    (filters, page) => {
      const useTypedCity = !!filters.City.trim();
      const ageRange =
        filters.ageRange[0] === 0 && filters.ageRange[1] === 100
          ? undefined
          : filters.ageRange.map(Math.round);

      return {
        latitude: useTypedCity ? undefined : userLocation.latitude,
        longitude: useTypedCity ? undefined : userLocation.longitude,
        City: useTypedCity ? filters.City.trim() : userLocation.City,
        region: useTypedCity ? filters.region : userLocation.region,
        Country: userLocation.Country || "Poland",
        distance: Math.round(filters.distance),
        eventName: filters.eventName.trim() || undefined,
        gameType: filters.gameType || undefined,
        minPlayerCount: sanitizeOptionalNumber(filters.minPlayerCount),
        level: filters.level || undefined,
        maxPrice: sanitizeOptionalNumber(filters.maxPrice),
        ageRange,
        page,
        limit: PAGE_SIZE,
      };
    },
    [userLocation],
  );

  const runSearch = useCallback(
    async ({ filters = appliedFilters, page = 1, append = false } = {}) => {
      if (!locationResolved) return;

      abortControllerRef.current?.abort();
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setError(null);
        setHasSearched(true);
        setCurrentPage(1);
        setHasMore(false);
      }

      try {
        const data = await fetchNearbyEvents({
          ...buildSearchParams(filters, page),
          signal: abortController.signal,
        });
        if (!isMountedRef.current) return;

        if (append) {
          setFilteredEvents((previous) => {
            const byId = new Map(
              [...(previous?.events || []), ...(data?.events || [])].map(
                (event) => [event._id, event],
              ),
            );
            return { ...data, events: Array.from(byId.values()) };
          });
        } else {
          setFilteredEvents(data);
        }

        setCurrentPage(page);
        setHasMore(!!data?.hasMore);
      } catch (requestError) {
        if (
          requestError?.code === "ERR_CANCELED" ||
          requestError?.name === "CanceledError"
        ) {
          return;
        }
        if (!isMountedRef.current) return;
        console.error("Błąd wyszukiwania wydarzeń:", requestError);
        if (append) {
          Toast.error("Nie udało się załadować kolejnych wydarzeń", "top");
        } else {
          setError("Nie udało się pobrać wydarzeń");
        }
      } finally {
        if (abortControllerRef.current === abortController) {
          abortControllerRef.current = null;
          if (isMountedRef.current) {
            setLoading(false);
            setLoadingMore(false);
          }
        }
      }
    },
    [appliedFilters, buildSearchParams, locationResolved, setFilteredEvents],
  );

  useEffect(() => {
    if (!locationResolved) return;
    runSearch({ filters: appliedFilters, page: 1, append: false });
  }, [
    appliedFilters,
    locationResolved,
    runSearch,
    userLocation.latitude,
    userLocation.longitude,
  ]);

  const handleLoadMore = () => {
    if (loading || loadingMore || !hasMore) return;
    runSearch({
      filters: appliedFilters,
      page: currentPage + 1,
      append: true,
    });
  };

  const handleCityChange = (value) => {
    setDraftFilters((previous) => ({
      ...previous,
      City: value,
      region: "",
    }));
    setSuggestionSelected(false);
  };

  const handleSuggestionClick = (city, province) => {
    setDraftFilters((previous) => ({
      ...previous,
      City: city,
      region: province,
    }));
    setSuggestions([]);
    setSuggestionSelected(true);
  };

  const handleApplyFilters = () => {
    const city = draftFilters.City.trim();
    let region = draftFilters.region;
    if (city) {
      const validation = validateCityInput(
        city,
        draftFilters.region,
        placesData,
      );
      if (!validation.isValid) {
        Toast.error(validation.error, "top");
        return;
      }
      if (validation.region) {
        region = validation.region;
      }
    }

    const minPlayerCount = sanitizeOptionalNumber(draftFilters.minPlayerCount);
    if (minPlayerCount !== undefined && minPlayerCount < 1) {
      Toast.error(
        "Minimalna liczba wolnych miejsc musi wynosić co najmniej 1",
        "top",
      );
      return;
    }

    setAppliedFilters({
      ...draftFilters,
      City: city,
      region,
      distance: Math.round(draftFilters.distance),
      ageRange: draftFilters.ageRange.map(Math.round),
    });
    onCloseFilters();
  };

  const handleResetFilters = () => {
    const defaults = createDefaultFilters();
    setDraftFilters(defaults);
    setAppliedFilters(defaults);
    setSuggestions([]);
    setSuggestionSelected(false);
    onCloseFilters();
  };

  const statusMap = useMemo(
    () => buildUserStatusMap(eventsData.userEvents),
    [eventsData.userEvents],
  );
  const ownerEventIds = useMemo(
    () => new Set(eventsData.ownerEvents.map((event) => String(event._id))),
    [eventsData.ownerEvents],
  );

  const events = useMemo(() => {
    const sorted = [...(filteredEvents?.events || [])].sort(
      (first, second) => parseEventDate(first) - parseEventDate(second),
    );
    if (!selectedDate) return sorted;
    return sorted.filter(
      (event) => toDateKey(parseEventDate(event)) === selectedDate,
    );
  }, [filteredEvents?.events, selectedDate]);

  const renderEvent = ({ item }) => {
    const status = ownerEventIds.has(String(item._id))
      ? "owner"
      : statusMap[item._id];
    return (
      <EventSimpleCard
        event={item}
        myStatus={status}
        highlighted={unreadEventIds.has(item._id)}
        onPress={() => onEventPress(item, status)}
      />
    );
  };

  const pickerOptions = pickerField === "gameType" ? GAME_TYPES : LEVELS;
  const pickerValue = pickerField ? draftFilters[pickerField] : "";

  if (!locationResolved) {
    return (
      <View style={styles.stateContainer}>
        <ActivityIndicator size="large" color={colors.PrimaryGreen} />
        <Text style={styles.stateText}>Ustalam obszar wyszukiwania...</Text>
      </View>
    );
  }

  return (
    <>
      <View style={styles.locationInfo}>
        <Ionicons
          name={hasUserLocation ? "navigate-outline" : "map-outline"}
          size={scaleFont(15)}
          color={colors.PrimaryGreen}
        />
        <Text style={styles.locationInfoText}>
          {appliedFilters.City
            ? `${appliedFilters.City} • ${appliedFilters.distance} km`
            : hasUserLocation
              ? `Twoja lokalizacja • ${appliedFilters.distance} km`
              : `Środek Polski • ${appliedFilters.distance} km`}
        </Text>
      </View>

      {loading ? (
        <View style={styles.stateContainer}>
          <ActivityIndicator size="large" color={colors.PrimaryGreen} />
          <Text style={styles.stateText}>Szukam wydarzeń...</Text>
        </View>
      ) : error ? (
        <View style={styles.stateContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={scaleFont(46)}
            color={colors.Danger}
          />
          <Text style={styles.stateText}>{error}</Text>
          <Pressable
            style={styles.retryButton}
            onPress={() => runSearch({ page: 1, append: false })}
          >
            <Text style={styles.retryButtonText}>Spróbuj ponownie</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          style={styles.list}
          contentContainerStyle={styles.listContent}
          data={events}
          keyExtractor={(item) => String(item._id)}
          renderItem={renderEvent}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.stateContainer}>
              <Ionicons
                name={hasSearched ? "sad-outline" : "search-outline"}
                size={scaleFont(46)}
                color={colors.InactiveIcon}
              />
              <Text style={styles.stateText}>
                {selectedDate
                  ? "Brak wydarzeń w wybranym dniu"
                  : "Brak wydarzeń spełniających kryteria"}
              </Text>
              <Text style={styles.stateSubtext}>
                Zmień datę lub ustawienia wyszukiwania
              </Text>
            </View>
          }
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

      <Modal
        visible={filtersVisible}
        transparent
        animationType="fade"
        onRequestClose={onCloseFilters}
      >
        <Pressable style={styles.modalBackdrop} onPress={onCloseFilters}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtry nadchodzących</Text>
              <Pressable
                style={styles.closeButton}
                onPress={onCloseFilters}
                accessibilityRole="button"
                accessibilityLabel="Zamknij filtry"
              >
                <Ionicons
                  name="close"
                  size={scaleFont(24)}
                  color={colors.primaryText}
                />
              </Pressable>
            </View>
            <View style={styles.cityFieldContainer}>
              <Text style={styles.label}>Miasto</Text>
              <TextInput
                style={styles.input}
                onLayout={({ nativeEvent: { layout } }) =>
                  setCityInputLayout(layout)
                }
                value={draftFilters.City}
                onChangeText={handleCityChange}
                placeholder={
                  hasUserLocation
                    ? "Puste = Twoja lokalizacja"
                    : "Puste = środek Polski"
                }
                placeholderTextColor={colors.Placeholder}
              />
              <CitySuggestions
                suggestions={suggestions}
                onSuggestionClick={handleSuggestionClick}
                style={[
                  styles.modalSuggestions,
                  cityInputLayout && {
                    top:
                      cityInputLayout.y +
                      cityInputLayout.height +
                      verticalScale(4),
                  },
                ]}
              />
            </View>

            <ScrollView
              style={styles.filtersScroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >

              <Text style={styles.label}>
                Odległość: {Math.round(draftFilters.distance)} km
              </Text>
              <Slider
                value={draftFilters.distance}
                onValueChange={([value]) =>
                  setDraftFilters((previous) => ({
                    ...previous,
                    distance: value,
                  }))
                }
                minimumValue={5}
                maximumValue={150}
                step={5}
                minimumTrackTintColor={colors.PrimaryGreen}
                maximumTrackTintColor={colors.thirdText}
                thumbTintColor={colors.PrimaryGreen}
                trackStyle={styles.sliderTrack}
                thumbStyle={styles.sliderThumb}
              />
              <View style={styles.sliderLabels}>
                <Text style={styles.sliderLabel}>5 km</Text>
                <Text style={styles.sliderLabel}>150 km</Text>
              </View>

              <Text style={styles.label}>Nazwa wydarzenia</Text>
              <TextInput
                style={styles.input}
                value={draftFilters.eventName}
                onChangeText={(eventName) =>
                  setDraftFilters((previous) => ({
                    ...previous,
                    eventName,
                  }))
                }
                maxLength={50}
                placeholder="Np. mecz towarzyski"
                placeholderTextColor={colors.Placeholder}
              />

              <Text style={styles.label}>Typ gry</Text>
              <Pressable
                style={styles.pickerButton}
                onPress={() => setPickerField("gameType")}
              >
                <Text style={styles.pickerButtonText}>
                  {getOptionLabel(GAME_TYPES, draftFilters.gameType)}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={scaleFont(18)}
                  color={colors.secondaryText}
                />
              </Pressable>

              <Text style={styles.label}>Poziom</Text>
              <Pressable
                style={styles.pickerButton}
                onPress={() => setPickerField("level")}
              >
                <Text style={styles.pickerButtonText}>
                  {getOptionLabel(LEVELS, draftFilters.level)}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={scaleFont(18)}
                  color={colors.secondaryText}
                />
              </Pressable>

              <View style={styles.row}>
                <View style={styles.column}>
                  <Text style={styles.label}>Min. wolnych miejsc</Text>
                  <TextInput
                    style={styles.input}
                    value={draftFilters.minPlayerCount}
                    onChangeText={(value) =>
                      setDraftFilters((previous) => ({
                        ...previous,
                        minPlayerCount: value.replace(/\D/g, "").slice(0, 3),
                      }))
                    }
                    keyboardType="numeric"
                    placeholder="Dowolnie"
                    placeholderTextColor={colors.Placeholder}
                  />
                </View>
                <View style={styles.column}>
                  <Text style={styles.label}>Maks. cena</Text>
                  <TextInput
                    style={styles.input}
                    value={draftFilters.maxPrice}
                    onChangeText={(value) =>
                      setDraftFilters((previous) => ({
                        ...previous,
                        maxPrice: value.replace(/\D/g, "").slice(0, 4),
                      }))
                    }
                    keyboardType="numeric"
                    placeholder="Dowolnie"
                    placeholderTextColor={colors.Placeholder}
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.actionButton, styles.resetButton]}
                onPress={handleResetFilters}
              >
                <Text style={styles.resetButtonText}>Wyczyść</Text>
              </Pressable>
              <Pressable
                style={[styles.actionButton, styles.applyButton]}
                onPress={handleApplyFilters}
              >
                <Text style={styles.applyButtonText}>Zastosuj</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <CustomTypePickerModal
        visible={!!pickerField}
        selectedValue={pickerValue}
        options={pickerOptions}
        title={
          pickerField === "gameType" ? "Wybierz typ gry" : "Wybierz poziom"
        }
        onSelect={(value) => {
          setDraftFilters((previous) => ({
            ...previous,
            [pickerField]: value,
          }));
        }}
        onClose={() => setPickerField(null)}
      />
    </>
  );
};

export default UpcomingEventsTab;

const createStyles = (colors) =>
  StyleSheet.create({
    locationInfo: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.xs,
      marginBottom: SPACING.sm,
    },
    locationInfoText: {
      color: colors.secondaryText,
      fontSize: scaleFont(12, 0.3),
    },
    list: {
      flex: 1,
    },
    listContent: {
      flexGrow: 1,
      paddingBottom: SPACING.xl,
    },
    stateContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: verticalScale(48),
      gap: SPACING.sm,
    },
    stateText: {
      color: colors.primaryText,
      fontSize: scaleFont(15, 0.35),
      textAlign: "center",
    },
    stateSubtext: {
      color: colors.secondaryText,
      fontSize: scaleFont(12, 0.3),
      textAlign: "center",
    },
    retryButton: {
      marginTop: SPACING.sm,
      paddingVertical: verticalScale(10),
      paddingHorizontal: SPACING.lg,
      borderRadius: BORDER_RADIUS.md,
      backgroundColor: colors.PrimaryYellow,
    },
    retryButtonText: {
      color: colors.background,
      fontSize: scaleFont(13, 0.3),
      fontWeight: "700",
      fontFamily: "Inter-SemiBold",
    },
    footerLoader: {
      marginVertical: SPACING.md,
    },
    modalBackdrop: {
      flex: 1,
      width: "100%",
      height: "100%",
      justifyContent: "center",
      paddingHorizontal: SPACING.md,
      backgroundColor: "rgba(0,0,0,0.65)",
    },
    modalCard: {
      height: "80%",
      padding: SPACING.md,
      borderRadius: BORDER_RADIUS.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.backgroundSecondary,
    },
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      minHeight: verticalScale(28),
    },
    modalTitle: {
      color: colors.primaryText,
      fontFamily: "BarlowCondensed-Bold",
      fontSize: scaleFont(17, 0.35),
      textAlign: "center",
    },
    cityFieldContainer: {
      zIndex: 2,
    },
    modalSuggestions: {
      position: "absolute",
      left: 0,
      right: 0,
      zIndex: 3,
      elevation: 3,
    },
    filtersScroll: {
      flex: 1,
    },
    closeButton: {
      position: "absolute",
      right: 0,
      padding: SPACING.xs,
    },
    label: {
      marginTop: SPACING.sm,
      marginBottom: SPACING.xs,
      color: colors.primaryText,
      fontSize: scaleFont(13, 0.3),
    },
    input: {
      minHeight: verticalScale(42),
      paddingHorizontal: SPACING.sm,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: BORDER_RADIUS.md,
      backgroundColor: colors.secondaryCard,
      color: colors.primaryText,
      fontSize: scaleFont(14, 0.35),
    },
    pickerButton: {
      minHeight: verticalScale(42),
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: SPACING.sm,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: BORDER_RADIUS.md,
      backgroundColor: colors.secondaryCard,
    },
    pickerButtonText: {
      color: colors.primaryText,
      fontSize: scaleFont(14, 0.35),
    },
    sliderTrack: {
      height: verticalScale(4),
      borderRadius: BORDER_RADIUS.xs,
    },
    sliderThumb: {
      width: moderateScale(20, 0.35),
      height: moderateScale(20, 0.35),
    },
    sliderLabels: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    sliderLabel: {
      color: colors.secondaryText,
      fontSize: scaleFont(11, 0.3),
    },
    row: {
      flexDirection: "row",
      gap: SPACING.sm,
    },
    column: {
      flex: 1,
    },
    modalActions: {
      flexDirection: "row",
      gap: SPACING.sm,
      marginTop: SPACING.md,
    },
    actionButton: {
      flex: 1,
      alignItems: "center",
      paddingVertical: verticalScale(11),
      borderRadius: BORDER_RADIUS.md,
    },
    resetButton: {
      backgroundColor: colors.NeutralButton,
    },
    applyButton: {
      backgroundColor: colors.PrimaryGreen,
    },
    resetButtonText: {
      color: colors.primaryText,
      fontWeight: "700",
      fontFamily: "Inter-SemiBold",
    },
    applyButtonText: {
      color: colors.background,
      fontWeight: "700",
      fontFamily: "Inter-SemiBold",
    },
  });
