import {
  StyleSheet,
  View,
  TouchableOpacity,
  TextInput,
  Text,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { COLORS } from '../../../constants/colors'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect } from 'expo-router'
import { useCallback, useState, useEffect, useRef } from 'react'
import { useMap } from '../../../context/MapContext'
import { useDashboard } from '../../../context/DashboardContext'
import { useAuth } from '../../../context/AuthContext'
import CitySuggestions from '../../../components/CitySuggestions'
import {
  filterCitySuggestions,
  validateCityInput,
} from '../../../assets/utils/citySearchUtils'
import customFetch from '../../../assets/utils/customFetch'
import placesData from '../../../assets/data/miejscowosci_wojewodztwa.json'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Toast } from 'toastify-react-native'
import { getCurrentLocation } from '../../../assets/utils/getUserLocation'
import { useResponsiveScale } from '../../../assets/utils/scaleUI.UX'
import { dbg, useDebugMount } from '../../../assets/utils/debugLogger'

const SUGGESTIONS_DEBOUNCE_MS = 80
const SUGGESTIONS_LIMIT = 30

const ShowMap = () => {
  dbg('ShowMapScreen')
  useDebugMount('ShowMapScreen')
  const ui = useResponsiveScale()
  const styles = createStyles(ui)
  const {
    flyTo,
    flyToProvince,
    setShowMarkers,
    showMarkers,
    showEvents,
    setShowEvents,
    setIsInteractive,
    setOverlayOpacity,
    userLocation,
    setUserLocation,
  } = useMap()
  const { setFilteredEvents } = useDashboard()
  const { consents, pendingConsents, getThrottledLocation, saveLocation, reverseGeocode } = useAuth()

  const [userInput, setUserInput] = useState({
    latitude: null,
    longitude: null,
    City: '',
    Country: 'Poland',
    region: '',
    distance: 5,
  })
  const [cityInput, setCityInput] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [suggestionSelected, setSuggestionSelected] = useState(false)
  const [loading, setLoading] = useState(false)
  const isMountedRef = useRef(true)
  const suggestionsDebounceRef = useRef(null)
  const searchAbortControllerRef = useRef(null)

  const searchIconSize = ui.moderateScale(24, 0.35)
  const locateIconSize = ui.moderateScale(24, 0.35)
  const eyeIconSize = ui.moderateScale(28, 0.35)
  const fieldIconSize = ui.moderateScale(56, 0.35)

  useEffect(() => {
    return () => {
      isMountedRef.current = false
      if (suggestionsDebounceRef.current) {
        clearTimeout(suggestionsDebounceRef.current)
      }
      if (searchAbortControllerRef.current) {
        searchAbortControllerRef.current.abort()
      }
    }
  }, [])

  // Włącz interaktywność mapy gdy ekran jest aktywny
  useFocusEffect(
    useCallback(() => {
      setIsInteractive(true)
      setOverlayOpacity(0) // Brak przyciemnienia na mapie

      return () => {
        setIsInteractive(false)
        setOverlayOpacity(0.3) // Przywróć przyciemnienie
      }
    }, []),
  )

  // Aktualizuj podpowiedzi - tylko gdy użytkownik aktywnie wpisuje
  useEffect(() => {
    if (suggestionsDebounceRef.current) {
      clearTimeout(suggestionsDebounceRef.current)
    }

    if (suggestionSelected) {
      setSuggestions([])
      return
    }

    const normalizedInput = cityInput?.trim()

    // Pokaż sugestie tylko gdy użytkownik aktywnie wpisuje
    if (!normalizedInput) {
      setSuggestions([])
      return
    }

    suggestionsDebounceRef.current = setTimeout(() => {
      if (!isMountedRef.current) {
        return
      }

      const filteredSuggestions = filterCitySuggestions(
        normalizedInput,
        placesData,
        2,
        SUGGESTIONS_LIMIT,
      )
      // Zachowaj strukturę { province, cities } zamiast spłaszczać
      setSuggestions(filteredSuggestions)
    }, SUGGESTIONS_DEBOUNCE_MS)

    return () => {
      if (suggestionsDebounceRef.current) {
        clearTimeout(suggestionsDebounceRef.current)
      }
    }
  }, [cityInput, suggestionSelected])

  const handleInputChange = (text) => {
    setCityInput(text)
    setSuggestionSelected(false)
  }

  const handleSuggestionClick = (city, province) => {
    setCityInput(city)
    // Ustaw tymczasowo region w userInput
    setUserInput((prev) => ({ ...prev, region: province }))
    setSuggestions([])
    setSuggestionSelected(true)
  }

  const handleSearch = async () => {
    setLoading(true)

    if (searchAbortControllerRef.current) {
      searchAbortControllerRef.current.abort()
    }

    const abortController = new AbortController()
    searchAbortControllerRef.current = abortController

    // Użyj lokalizacji użytkownika lub fallback na userLocation
    let finalCity = cityInput.trim() || (consents.locationAccepted ? userLocation.City : '')
    let finalRegion = userInput.region || (consents.locationAccepted ? userLocation.region : '')
    
    // Współrzędne - użyj userLocation tylko jeśli użytkownik nie wpisał własnego miasta
    let finalLatitude = null
    let finalLongitude = null
    
    if (!cityInput.trim() && consents.locationAccepted) {
      // Użyj współrzędnych z userLocation tylko gdy nie ma własnego miasta
      finalLatitude = userLocation.latitude
      finalLongitude = userLocation.longitude
    }

    if (!finalCity) {
      Alert.alert('Błąd', 'Proszę wpisać miasto lub włączyć lokalizację')
      if (isMountedRef.current) {
        setLoading(false)
      }
      return
    }

    // Walidacja miasta tylko jeśli użytkownik wpisał własne miasto
    if (cityInput.trim()) {
      const validation = validateCityInput(cityInput, userInput.region, placesData)

      if (!validation.isValid) {
        Alert.alert('Błąd', validation.error)
        if (isMountedRef.current) {
          setLoading(false)
        }
        return
      }

      // Ustaw region jeśli został znaleziony
      if (validation.region) {
        finalRegion = validation.region
      }
    }

    try {
      const response = await customFetch.post('/football-events/search', {
        latitude: finalLatitude,
        longitude: finalLongitude,
        Country: userLocation.Country || 'Poland',
        region: finalRegion,
        City: finalCity,
        distance: 5,
      }, {
        signal: abortController.signal,
      })
      
      const events = response.data.events || []
      if (!isMountedRef.current) {
        return
      }

      setFilteredEvents(response.data)
      
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
      Alert.alert('Błąd', 'Nie udało się wyszukać wydarzeń')
    } finally {
      if (searchAbortControllerRef.current === abortController) {
        searchAbortControllerRef.current = null
      }
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }

  const handleMyLocation = async () => {
    // Sprawdź zgodę na lokalizację
    if (!pendingConsents.locationAccepted && !consents?.locationAccepted) {
      Toast.error('Brak zgody na lokalizację. Możesz zmienić to w ustawieniach.', 'top')
      return
    }

    // Sprawdź throttling
    const throttleResult = await getThrottledLocation()
    if (throttleResult.throttled) {
      Toast.info(throttleResult.error, 'top')
      return
    }

    try {
      // Pobierz aktualną lokalizację z GPS
      const locationResult = await getCurrentLocation()
      
      if (!locationResult.success) {
        Toast.error('System blokuje lokalizację', 'top')
        return
      }

      const { latitude, longitude } = locationResult.location

      // Reverse geocoding - pobierz nazwę miasta/regionu z backendu
      const geocodeResult = await reverseGeocode(latitude, longitude)
      
      const newLocation = {
        latitude,
        longitude,
        City: geocodeResult.success ? geocodeResult.location.City : null,
        region: geocodeResult.success ? geocodeResult.location.region : null,
        Country: geocodeResult.success ? geocodeResult.location.Country : 'Poland',
      }

      // Zapisz lokalizację w AsyncStorage
      await saveLocation(newLocation)
      
      // Zaktualizuj state w MapContext
      setUserLocation(newLocation)

      // Wyśrodkuj mapę na aktualnej lokalizacji
      flyTo([longitude, latitude], 14)
      
      Toast.success('Lokalizacja zaktualizowana', 'top')
    } catch (error) {
      console.error('Błąd pobierania lokalizacji:', error)
      Toast.error('Nie udało się pobrać lokalizacji', 'top')
    }
  }

  return (
    <View style={styles.container} pointerEvents='box-none'>
      {/* UI Controls - zawsze nad mapą */}
      <View style={styles.controlsWrapper} pointerEvents='box-none'>
        {/* Input do wyszukiwania miasta */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <Ionicons
              name='map'
              size={searchIconSize}
              color={COLORS.secondary}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              value={cityInput}
              onChangeText={handleInputChange}
              placeholder={
                consents.locationAccepted && userLocation.City
                  ? userLocation.City
                  : 'Wpisz miasto...'
              }
              placeholderTextColor='#999'
              autoCorrect={false}
              autoCapitalize='none'
            />
            <TouchableOpacity
              style={styles.searchButton}
              onPress={handleSearch}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size='small' color={COLORS.primary} />
              ) : (
                <Text style={styles.searchButtonText}>Szukaj</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Podpowiedzi */}
          <CitySuggestions
            suggestions={suggestions}
            onSuggestionClick={handleSuggestionClick}
          />
        </View>

        {/* Kontrolki na mapie */}
        <View style={styles.controlsContainer} pointerEvents='box-none'>
          <Text style={styles.controlButtonTextLocation}>Znajdź</Text>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={handleMyLocation}
            activeOpacity={0.8}
          >
            <Ionicons name='locate' size={locateIconSize} color={COLORS.secondary} />
          </TouchableOpacity>

          <Text style={styles.controlButtonTextAbove}>Boiska</Text>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => setShowMarkers(!showMarkers)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={showMarkers ? 'eye' : 'eye-off'}
              size={eyeIconSize}
              color={showMarkers ? COLORS.secondary : '#999'}
              style={styles.controlIconEye}
            />
            <MaterialCommunityIcons name="soccer-field" size={fieldIconSize} color={COLORS.third} style={styles.controlIconField} />
          </TouchableOpacity>

          <Text style={styles.controlButtonTextAbove}>Mecze</Text>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => setShowEvents(!showEvents)}
            activeOpacity={0.8}
          >
            <MaterialIcons
              name={showEvents ? 'location-on' : 'location-off'}
              size={eyeIconSize}
              color={showEvents ? COLORS.secondary : '#999'}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

export default ShowMap

const createStyles = (ui) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  controlsWrapper: {
    flex: 1,
    zIndex: 10,
    backgroundColor: 'transparent',
  },
  searchContainer: {
    position: 'absolute',
    top: ui.verticalScale(20),
    left: ui.spacing(16, 0.35),
    right: ui.spacing(16, 0.35),
    zIndex: 20,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: ui.controlRadius,
    paddingHorizontal: ui.controlPaddingHorizontal,
    paddingVertical: ui.buttonPaddingVertical,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  searchIcon: {
    marginRight: ui.spacing(8, 0.35),
  },
  searchInput: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: ui.controlRadius,
    flex: 1,
    fontSize: ui.scaleFont(16, 0.35),
    color: COLORS.primary,
    minHeight: ui.controlMinHeight,
    paddingHorizontal: ui.controlPaddingHorizontal,
    paddingVertical: ui.controlPaddingVertical,
  },
  searchButton: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: ui.controlPaddingHorizontal,
    paddingVertical: ui.buttonPaddingVertical,
    borderRadius: ui.controlRadius,
    marginLeft: ui.spacing(8, 0.35),
    minWidth: ui.scale(70),
    minHeight: ui.controlMinHeight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonText: {
    color: COLORS.background,
    fontFamily: 'ObjectFont',
    fontSize: ui.scaleFont(18, 0.4),
  },
  controlsContainer: {
    position: 'absolute',
    right: ui.spacing(16, 0.35),
    bottom: ui.verticalScale(100),
    gap: ui.verticalScale(12),
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
    overflow: 'hidden',
  },
  controlIconEye: {
    position: 'absolute',
    top: ui.verticalScale(12),
    left: ui.spacing(12, 0.35),
    zIndex: 6,
  },
  controlIconField: {
    opacity: 0.5,
    position: 'absolute',
    zIndex: 5,
    left: -ui.spacing(2, 0.2),
  },

  controlButtonTextLocation: {
    fontSize: ui.scaleFont(10, 0.25),
    color: COLORS.secondary,
    fontFamily: 'ObjectFont',
    textAlign: 'center',
  },
  controlButtonTextAbove: {
    fontSize: ui.scaleFont(10, 0.25),
    color: COLORS.secondary,
    fontFamily: 'ObjectFont',
    textAlign: 'center',
    marginTop: ui.verticalScale(4),
  },
})
