import { useState, useEffect, useRef } from 'react'
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  Animated,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Picker } from '@react-native-picker/picker'
import { COLORS } from '../../../constants/colors'
import FindEventListElement from '../../../components/FindEventListElement'
import CitySuggestions from '../../../components/CitySuggestions'
import { useMap } from '../../../context/MapContext'
import { useDashboard } from '../../../context/DashboardContext'
import { useAuth } from '../../../context/AuthContext'
import { Toast } from 'toastify-react-native'
import { useRouter } from 'expo-router'
import {
  validateCityInput,
  filterCitySuggestions,
} from '../../../assets/utils/citySearchUtils'
import customFetch from '../../../assets/utils/customFetch'
import placesData from '../../../assets/data/miejscowosci_wojewodztwa.json'
import { useResponsiveScale } from '../../../assets/utils/scaleUI.UX'
import { dbg, useDebugMount } from '../../../assets/utils/debugLogger'
import LottieView from 'lottie-react-native'
import spinnerData from '../../../assets/utils/spinner.json'

const GAME_TYPES = [
  { label: 'Wybierz typ gry', value: '' },
  { label: 'Piłka nożna', value: 'football' },
  { label: 'Siatkówka', value: 'volleyball' },
  { label: 'Koszykówka', value: 'basketball' },
  { label: 'Piłka ręczna', value: 'handball' },
  { label: 'Rugby', value: 'rugby' },
  { label: 'Hokej', value: 'hockey' },
  { label: 'Tenis', value: 'tennis' },
  { label: 'Badminton', value: 'badminton' },
  { label: 'Tenis stołowy', value: 'table tennis' },
  { label: 'Kręgle', value: 'bowling' },
  { label: 'Karty', value: 'cards' },
  { label: 'Planszówki', value: 'board games' },
  { label: 'Inne', value: 'other' },
]

const SUGGESTIONS_DEBOUNCE_MS = 80
const SUGGESTIONS_LIMIT = 30
const EVENT_NAME_MAX = 50

const FindEvent = () => {
  dbg('FindEventScreen')
  useDebugMount('FindEventScreen')
  const router = useRouter()
  const ui = useResponsiveScale()
  const styles = createStyles(ui)
  const { setIsInteractive, setOverlayOpacity, userLocation, flyTo, flyToProvince } = useMap()
  const { consents } = useAuth()
  const [loading, setLoading] = useState(false)
  const [userInput, setUserInput] = useState({
    latitude: null,
    longitude: null,
    City: '',
    Country: 'Poland',
    region: '',
    distance: 5,
    gameType: '',
    eventName: '',
  })
  const { filteredEvents, setFilteredEvents } = useDashboard()
  const [hasSearched, setHasSearched] = useState(false)
  const [showList, setShowList] = useState(true)
  const [filteredByGameType, setFilteredByGameType] = useState(filteredEvents)
  const [suggestions, setSuggestions] = useState([])
  const [suggestionSelected, setSuggestionSelected] = useState(false)
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const isMountedRef = useRef(true)
  const suggestionsDebounceRef = useRef(null)
  const searchAbortControllerRef = useRef(null)
  const loadingTimerRef = useRef(null)
  const lastSearchParamsRef = useRef(null)
  const listOpacity = useRef(new Animated.Value(0)).current

  const headerIconSize = ui.moderateScale(26, 0.35)
  const actionIconSize = ui.moderateScale(26, 0.35)
  const stateIconSize = ui.moderateScale(50, 0.3)
  const floatingIconSize = ui.moderateScale(24, 0.35)

  useEffect(() => {
    return () => {
      isMountedRef.current = false
      if (suggestionsDebounceRef.current) {
        clearTimeout(suggestionsDebounceRef.current)
      }
      if (searchAbortControllerRef.current) {
        searchAbortControllerRef.current.abort()
      }
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current)
      }
      setIsInteractive(false)
      setOverlayOpacity(0.3)
    }
  }, [])

  // Ustaw początkową lokalizację z userLocation
  useEffect(() => {
    if (consents.locationAccepted && userLocation.City) {
      setUserInput((prev) => ({
        ...prev,
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        City: userLocation.City,
        region: userLocation.region,
        Country: userLocation.Country || 'Poland',
      }))
    }
  }, [userLocation, consents.locationAccepted])

  // Aktualizuj podpowiedzi - tylko gdy użytkownik aktywnie wpisuje
  useEffect(() => {
    if (suggestionsDebounceRef.current) {
      clearTimeout(suggestionsDebounceRef.current)
    }

    if (suggestionSelected) {
      setSuggestions([])
      return
    }

    const cityInput = userInput.City?.trim()

    // Pokaż sugestie tylko gdy użytkownik aktywnie wpisuje
    if (!cityInput) {
      setSuggestions([])
      return
    }

    // Jeśli miasto pochodzi z userLocation, nie pokazuj podpowiedzi
    if (consents.locationAccepted && userLocation.City && cityInput === userLocation.City) {
      setSuggestions([])
      return
    }

    suggestionsDebounceRef.current = setTimeout(() => {
      if (!isMountedRef.current) {
        return
      }

      const filteredSuggestions = filterCitySuggestions(
        cityInput,
        placesData,
        2,
        SUGGESTIONS_LIMIT,
      )
      setSuggestions(filteredSuggestions)
    }, SUGGESTIONS_DEBOUNCE_MS)

    return () => {
      if (suggestionsDebounceRef.current) {
        clearTimeout(suggestionsDebounceRef.current)
      }
    }
  }, [userInput.City, suggestionSelected, consents.locationAccepted, userLocation.City])

  // Aktualizuj UI gdy filteredEvents zmieni się z innego ekranu
  useEffect(() => {
    if (filteredEvents && filteredEvents.events && filteredEvents.events.length > 0) {
      setHasSearched(true)
    }
  }, [filteredEvents])

  // Filtrowanie po gameType
  useEffect(() => {
    if (filteredEvents && filteredEvents.events) {
      if (userInput.gameType && userInput.gameType !== '') {
        const filtered = filteredEvents.events.filter(
          (event) => event.gameType === userInput.gameType
        )
        setFilteredByGameType({
          ...filteredEvents,
          events: filtered,
          total: filtered.length,
        })
      } else {
        setFilteredByGameType(filteredEvents)
      }
    }
  }, [filteredEvents, userInput.gameType])

  // Sterowanie mapą i overlayem przez state
  useEffect(() => {
    if (showList) {
      setIsInteractive(false)
      setOverlayOpacity(0.3)
    } else {
      setIsInteractive(true)
      setOverlayOpacity(0)
    }
  }, [showList])

  const handleSubmit = async () => {
    setLoading(true)
    setHasSearched(true)
    setCurrentPage(1)
    setHasMore(false)
    if (loadingTimerRef.current) {
      clearTimeout(loadingTimerRef.current)
    }
    listOpacity.setValue(0)

    if (searchAbortControllerRef.current) {
      searchAbortControllerRef.current.abort()
    }

    const abortController = new AbortController()
    searchAbortControllerRef.current = abortController

    // Użyj lokalizacji użytkownika lub fallback na userLocation
    let finalCity = userInput.City.trim() || (consents.locationAccepted ? userLocation.City : '')
    let finalRegion = userInput.region || (consents.locationAccepted ? userLocation.region : '')
    
    // Współrzędne
    let finalLatitude = userInput.latitude
    let finalLongitude = userInput.longitude
    
    if (!userInput.City.trim() && consents.locationAccepted) {
      finalLatitude = userLocation.latitude
      finalLongitude = userLocation.longitude
    }

    if (!finalCity) {
      Toast.error('Proszę wpisać miasto lub włączyć lokalizację w ustawieniach', 'top')
      if (isMountedRef.current) {
        setLoading(false)
      }
      return
    }

    // Walidacja miasta jeśli użytkownik wpisał własne miasto
    if (userInput.City.trim()) {
      const validation = validateCityInput(userInput.City, userInput.region, placesData)

      if (!validation.isValid) {
        Toast.error(validation.error, 'top')
        if (isMountedRef.current) {
          setLoading(false)
        }
        return
      }

      if (validation.region) {
        finalRegion = validation.region
      }
    }

    try {
      const searchParams = {
        latitude: finalLatitude,
        longitude: finalLongitude,
        Country: userLocation.Country || 'Poland',
        region: finalRegion,
        City: finalCity,
        distance: userInput.distance,
        eventName: userInput.eventName?.trim() || undefined,
        page: 1,
        limit: 50,
      }
      lastSearchParamsRef.current = searchParams

      const response = await customFetch.post('/football-events/search', searchParams, {
        signal: abortController.signal,
      })
      
      const events = response.data.events || []
      if (!isMountedRef.current) {
        return
      }

      setFilteredEvents(response.data)
      setHasMore(response.data.hasMore || false)
      setCurrentPage(1)
      
      // Logika centrowania mapy w zależności od liczby znalezionych eventów
      if (events.length === 0) {
        // Brak eventów - wyśrodkuj na województwie jeśli istnieje
        if (finalRegion) {
          flyToProvince(finalRegion)
          Toast.info('Nie znaleziono wydarzeń w tym mieście.', 'top')
        }
      } else if (events.length === 1) {
        // Jeden event - wyśrodkuj na nim
        const event = events[0]
        if (event.geolocation?.coordinates) {
          const [longitude, latitude] = event.geolocation.coordinates
          flyTo([longitude, latitude], 14)
        }
      } else {
        // Wiele eventów - wyśrodkuj na średniej z max 4 pierwszych
        const eventsToCenter = events.slice(0, 4)
        const validCoords = eventsToCenter
          .filter(event => event.geolocation?.coordinates)
          .map(event => event.geolocation.coordinates)
        
        if (validCoords.length > 0) {
          const avgLongitude = validCoords.reduce((sum, coords) => sum + coords[0], 0) / validCoords.length
          const avgLatitude = validCoords.reduce((sum, coords) => sum + coords[1], 0) / validCoords.length
          flyTo([avgLongitude, avgLatitude], 12)
        }
      }
      
    } catch (err) {
      if (err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError') {
        return
      }

      console.error('Błąd wyszukiwania:', err)
      Toast.error('Nie udało się wyszukać wydarzeń', 'top')
    } finally {
      if (searchAbortControllerRef.current === abortController) {
        searchAbortControllerRef.current = null
      }
      if (isMountedRef.current) {
        loadingTimerRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            setLoading(false)
            Animated.timing(listOpacity, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }).start()
          }
        }, 700)
      }
    }
  }

  const toggleView = () => {
    setShowList(!showList)
  }

  const handleSuggestionClick = (city, province) => {
    setUserInput((prev) => ({ ...prev, City: city, region: province }))
    setSuggestions([])
    setSuggestionSelected(true)
  }

  const handleCityInputChange = (text) => {
    setUserInput((prev) => ({ ...prev, City: text }))
    setSuggestionSelected(false)
  }

  const handleEventPress = (eventId) => {
    // Nawigacja do szczegółów wydarzenia
    router.push(`/(auth)/single-event?id=${eventId}`)
  }

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore || !lastSearchParamsRef.current) return

    setLoadingMore(true)
    const nextPage = currentPage + 1

    try {
      const response = await customFetch.post('/football-events/search', {
        ...lastSearchParamsRef.current,
        page: nextPage,
      })

      if (!isMountedRef.current) return

      const newEvents = response.data.events || []
      setFilteredEvents((prev) => ({
        ...response.data,
        events: [...(prev?.events || []), ...newEvents],
      }))
      setHasMore(response.data.hasMore || false)
      setCurrentPage(nextPage)
    } catch (err) {
      if (err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError') return
      console.error('Błąd ładowania więcej:', err)
      Toast.error('Nie udało się załadować więcej wydarzeń', 'top')
    } finally {
      if (isMountedRef.current) {
        setLoadingMore(false)
      }
    }
  }

  return (
    <View style={styles.container} pointerEvents='box-none'>
      {/* Header */}
      <View style={styles.titleWrapper} pointerEvents='auto'>
        <Ionicons name='location-sharp' size={headerIconSize} color={COLORS.secondary} />
        <Text style={styles.titleText}>Znajdź Wydarzenie</Text>
      </View>

      {/* Formularz wyszukiwania */}
      <View style={styles.searchContainer} pointerEvents='auto'>
        {/* Lokalizacja */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.inputLocation}
            placeholder={
              consents.locationAccepted && userLocation.City
                ? userLocation.City
                : 'Twoja lokalizacja...'
            }
            placeholderTextColor={COLORS.gray}
            value={userInput.City}
            onChangeText={handleCityInputChange}
            autoCorrect={false}
            autoCapitalize='none'
          />
        </View>

        {/* Podpowiedzi */}
        <View style={styles.suggestionsContainer}>
        <CitySuggestions
          suggestions={suggestions}
          onSuggestionClick={handleSuggestionClick}
        />
        </View>


        {/* Szukaj po nazwie */}
        {showAdvancedSearch && (
        <View style={styles.inputRow}>
          <View style={styles.eventNameWrapper}>
          <TextInput
            style={styles.inputLocation}
            placeholder='Nazwa wydarzenia...'
            placeholderTextColor={COLORS.gray}
            value={userInput.eventName}
            maxLength={EVENT_NAME_MAX}
            onChangeText={(text) => {
              if (text.length <= EVENT_NAME_MAX) {
                setUserInput((prev) => ({ ...prev, eventName: text }))
              }
            }}
            autoCorrect={false}
            autoCapitalize='none'
          />
          {userInput.eventName.length > 0 && (
            <Text style={styles.eventNameCounter}>
              {userInput.eventName.length}/{EVENT_NAME_MAX}
            </Text>
          )}
          </View>
        </View>
        )}

        {/* Typ gry i dystans i wiecej */}
        {showAdvancedSearch && (
        <View style={styles.inputRowSecond}>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={userInput.gameType}
              onValueChange={(value) =>
                setUserInput((prev) => ({ ...prev, gameType: value }))
              }
              style={styles.picker}
              dropdownIconColor={COLORS.background}
            >
              {GAME_TYPES.map((type) => (
                <Picker.Item
                  style={styles.pickerItem}
                  key={type.value}
                  label={type.label}
                  value={type.value}
                />
              ))}
            </Picker>
          </View>
              
          <View style={styles.distanceWrapper}>
            <TextInput
              style={styles.inputDistance}
              placeholder='1'
              placeholderTextColor={COLORS.gray}
              keyboardType='numeric'
              value={userInput.distance.toString()}
              onChangeText={(text) => {
                let value = parseInt(text) || 1
                if (value < 1) value = 1
                if (value > 50) value = 50
                setUserInput((prev) => ({ ...prev, distance: value }))
              }}
            />
            <Text style={styles.kmLabel}>km</Text>
          </View>
        </View>
        )}

        {/* Przyciski */}
        <View style={styles.actionRow}>
        <Pressable style={styles.controlSearchButton} onPress={() => setShowAdvancedSearch((prev) => !prev)}>
          {showAdvancedSearch ?(<Ionicons name='arrow-up' size={actionIconSize} color={COLORS.background} />): (
            <Ionicons name='settings-sharp' size={actionIconSize} color={COLORS.background} />
          )}
        </Pressable>
        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSubmit}
          activeOpacity={0.8}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size='small' color={COLORS.background} />
          ) : (
            <Text style={styles.searchButtonText}>Szukaj</Text>
          )}
        </TouchableOpacity>
        </View>
      </View>

      {/* Lista wydarzeń - pokazywana gdy showList === true */}
      {showList && !loading && hasSearched && (
        <Animated.View style={[styles.eventList, { opacity: listOpacity }]}>
        <ScrollView
          contentContainerStyle={styles.eventListContent}
          showsVerticalScrollIndicator={false}
          pointerEvents='auto'
        >
          {filteredByGameType?.events?.length > 0 ? (
            filteredByGameType.events.map((event) => (
              <FindEventListElement
                key={event._id}
                event={event}
                onPress={() => handleEventPress(event._id)}
              />
            ))
          ) : (
            <View style={styles.noResults}>
              <Ionicons name='search' size={stateIconSize} color={COLORS.gray} />
              <Text style={styles.noResultsText}>
                Brak wydarzeń spełniających kryteria
              </Text>
            </View>
          )}
          {hasMore && !loadingMore && (
            <TouchableOpacity
              style={styles.loadMoreButton}
              onPress={handleLoadMore}
              activeOpacity={0.8}
            >
              <Text style={styles.loadMoreText}>Załaduj więcej</Text>
            </TouchableOpacity>
          )}
          {loadingMore && (
            <ActivityIndicator
              size='small'
              color={COLORS.secondary}
              style={{ marginVertical: ui.verticalScale(16) }}
            />
          )}
        </ScrollView>
        </Animated.View>
      )}

      {/* Spinner podczas wyszukiwania */}
      {loading && (
        <View style={styles.infoContainer}>
          <LottieView
            source={spinnerData}
            autoPlay
            loop
            style={styles.spinnerLottie}
          />
        </View>
      )}

      {/* Info przed wyszukaniem */}
      {!loading && !hasSearched && (
        <View style={styles.infoContainer}>
          <View style={styles.infoWrapper}>
          <Ionicons
            name='information-circle'
              size={stateIconSize}
            color={COLORS.secondary}
          />
          <Text style={styles.infoText}>
            Wprowadź lokalizację i kliknij "Szukaj" aby znaleźć wydarzenia w
            Twojej okolicy
          </Text>
          </View>
        </View>
      )}

      {/* Przycisk przełączania widoku lista/mapa */}
      {/* {hasSearched && !loading && (
        <View style={styles.controlsContainer} pointerEvents='box-none'>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={toggleView}
            activeOpacity={0.8}
          >
            <Ionicons
              name={showList ? 'map' : 'list'}
              size={floatingIconSize}
              color={COLORS.secondary}
            />
          </TouchableOpacity>
          <Text style={styles.controlButtonText}>
            {showList ? 'Mapa' : 'Lista'}
          </Text>
        </View>
      )} */}
    </View>
  )
}

export default FindEvent

const createStyles = (ui) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  titleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: ui.verticalScale(6),
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  titleText: {
    fontSize: ui.scaleFont(24, 0.45),
    fontFamily: 'Montserrat-Bold',
    color: COLORS.primary,
    marginLeft: ui.spacing(12, 0.35),
  },
  searchContainer: {
    paddingHorizontal: ui.spacing(18, 0.4),
    paddingTop: ui.verticalScale(6),
    paddingBottom: ui.verticalScale(12),
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  inputRow: {
    marginBottom: ui.verticalScale(12),
  },
  inputRowSecond: {
    flexDirection: 'row',
    marginBottom: ui.verticalScale(12),
  },
  inputLocation: {
    backgroundColor: COLORS.white,
    borderRadius: ui.controlRadius,
    minHeight: ui.controlMinHeight,
    paddingHorizontal: ui.controlPaddingHorizontal,
    paddingVertical: ui.controlPaddingVertical,
    fontSize: ui.scaleFont(16, 0.35),
    fontFamily: 'Lato-Regular',
    color: COLORS.background,
  },
  eventNameWrapper: {
    position: 'relative',
  },
  eventNameCounter: {
    position: 'absolute',
    right: ui.spacing(10, 0.25),
    top: '50%',
    transform: [{ translateY: '-50%' }],
    fontSize: ui.scaleFont(11, 0.25),
    fontFamily: 'Lato-Regular',
    color: COLORS.gray,
    pointerEvents: 'none',
  },
  pickerWrapper: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: ui.controlRadius,
    minHeight: ui.controlMinHeight,
    marginRight: ui.spacing(12, 0.35),
    justifyContent: 'center',
    overflow: 'hidden',
    paddingLeft: ui.controlPaddingHorizontal,
  },
  picker: {
    color: COLORS.background,
    height: ui.pickerHeight,
  },
  pickerItem: {
    fontSize: ui.scaleFont(16, 0.35),
    color: COLORS.background,
  },
  distanceWrapper: {
    position: 'relative',
    width: ui.scale(70),
    justifyContent: 'center',
  },
  inputDistance: {
    backgroundColor: COLORS.white,
    borderRadius: ui.controlRadius,
    minHeight: ui.controlMinHeight,
    width: '100%',
    paddingLeft: ui.controlPaddingHorizontal,
    paddingRight: ui.scale(26),
    paddingVertical: ui.controlPaddingVertical,
    fontSize: ui.scaleFont(16, 0.35),
    fontFamily: 'Lato-Regular',
    color: COLORS.background,
    textAlign: 'center',
  },
  kmLabel: {
    position: 'absolute',
    right: ui.spacing(10, 0.25),
    alignSelf: 'center',
    fontSize: ui.scaleFont(12, 0.3),
    fontFamily: 'Lato-Regular',
    color: COLORS.gray,
    pointerEvents: 'none',
  },
  searchButton: {
    backgroundColor: COLORS.secondary,
    borderRadius: ui.controlRadius,
    minHeight: ui.controlMinHeight,
    marginLeft: ui.spacing(12, 0.35),
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlSearchButton: {
    width: ui.scale(80),
    minHeight: ui.controlMinHeight,
    borderRadius: ui.controlRadius,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',

  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchButtonText: {
    fontSize: ui.scaleFont(20, 0.4),
    fontFamily: 'ObjectFont',
    color: COLORS.background,
  },
  eventList: {
    flex: 1,
  },
  eventListContent: {
    padding: ui.spacing(16),
  },
  noResults: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: ui.verticalScale(50),
  },
  noResultsText: {
    marginTop: ui.verticalScale(16),
    fontSize: ui.scaleFont(16, 0.35),
    fontFamily: 'Lato-Regular',
    color: COLORS.gray,
    textAlign: 'center',
  },
  loadMoreButton: {
    backgroundColor: COLORS.secondary,
    borderRadius: ui.controlRadius,
    minHeight: ui.controlMinHeight,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: ui.verticalScale(8),
    marginBottom: ui.verticalScale(16),
  },
  loadMoreText: {
    fontSize: ui.scaleFont(16, 0.35),
    fontFamily: 'ObjectFont',
    color: COLORS.background,
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: ui.spacing(40, 0.45),
  },
  infoWrapper: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: ui.spacing(20, 0.45),
    borderRadius: ui.moderateScale(16, 0.35),
    alignItems: 'center',
  },
  infoText: {
    marginTop: ui.verticalScale(16),
    fontSize: ui.scaleFont(16, 0.35),
    fontFamily: 'Lato-Regular',
    color: COLORS.primary,
    textAlign: 'center',

  },
  controlsContainer: {
    position: 'absolute',
    right: ui.spacing(16, 0.35),
    bottom: ui.verticalScale(100),
    alignItems: 'center',
    gap: ui.verticalScale(4),
  },
  controlButton: {
    width: ui.moderateScale(48, 0.35),
    height: ui.moderateScale(48, 0.35),
    borderRadius: ui.moderateScale(24, 0.35),
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  controlButtonText: {
    fontSize: ui.scaleFont(10, 0.25),
    color: COLORS.secondary,
    fontFamily: 'ObjectFont',
    marginTop: ui.verticalScale(4),
  },
  spinnerLottie: {
    width: ui.moderateScale(180, 0.4),
    height: ui.moderateScale(180, 0.4),
  },


  suggestionsContainer: {
    position: 'absolute',
    top: ui.verticalScale(42),
    left: ui.spacing(20, 0.35),
    width: '100%',
    zIndex: 10,
  }
})
