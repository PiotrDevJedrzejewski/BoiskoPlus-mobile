import {
  StyleSheet,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Text,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { COLORS } from '../../../constants/colors'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect } from 'expo-router'
import { useCallback, useState, useEffect } from 'react'
import { useMap } from '../../../context/MapContext'
import { useDashboard } from '../../../context/DashboardContext'
import { useAuth } from '../../../context/AuthContext'
import {
  filterCitySuggestions,
  validateCityInput,
} from '../../../assets/utils/citySearchUtils'
import customFetch from '../../../assets/utils/customFetch'
import placesData from '../../../assets/data/miejscowosci_wojewodztwa.json'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { Toast } from 'toastify-react-native'
import { getCurrentLocation } from '../../../assets/utils/getUserLocation'

const ShowMap = () => {
  const {
    flyTo,
    flyToProvince,
    setShowMarkers,
    showMarkers,
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
    if (suggestionSelected) {
      setSuggestions([])
      return
    }
    // Pokaż sugestie tylko gdy użytkownik aktywnie wpisuje
    if (!cityInput || cityInput.trim().length === 0) {
      setSuggestions([])
      return
    }
    const filteredSuggestions = filterCitySuggestions(cityInput, placesData)
    // Zachowaj strukturę { province, cities } zamiast spłaszczać
    setSuggestions(filteredSuggestions)
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
      setLoading(false)
      return
    }

    // Walidacja miasta tylko jeśli użytkownik wpisał własne miasto
    if (cityInput.trim()) {
      const validation = validateCityInput(cityInput, userInput.region, placesData)

      if (!validation.isValid) {
        Alert.alert('Błąd', validation.error)
        setLoading(false)
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
      })
      
      const events = response.data.events || []
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
      console.error('Błąd wyszukiwania:', err)
      Alert.alert('Błąd', 'Nie udało się wyszukać wydarzeń')
    }
    setLoading(false)
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
              size={24}
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
          {suggestions.length > 0 && (
            <ScrollView style={styles.suggestionsContainer}>
              {suggestions.map(({ province, cities }) => (
                <View key={province}>
                  <View style={styles.provinceHeader}>
                    <Text style={styles.provinceText}>{province}</Text>
                  </View>
                  {cities.map((city) => (
                    <TouchableOpacity
                      key={city}
                      style={styles.suggestionItem}
                      onPress={() => handleSuggestionClick(city, province)}
                    >
                      <Text style={styles.suggestionCity}>{city}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Kontrolki na mapie */}
        <View style={styles.controlsContainer} pointerEvents='box-none'>
          <Text style={styles.controlButtonTextLocation }>Znajdź</Text>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={handleMyLocation}
            activeOpacity={0.8}
          >
            <Ionicons name='locate' size={24} color={COLORS.secondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => setShowMarkers(!showMarkers)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={showMarkers ? 'eye' : 'eye-off'}
              size={28}
              color={COLORS.secondary}
              style={styles.controlIconEye}
            />
            <MaterialCommunityIcons name="soccer-field" size={56} color={COLORS.third} style={styles.controlIconField} />
          </TouchableOpacity>
            <Text style={styles.controlButtonTextField }>Boiska</Text>
        </View>
      </View>
    </View>
  )
}

export default ShowMap

const styles = StyleSheet.create({
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
    top: 20,
    left: 16,
    right: 16,
    zIndex: 20,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 16,
    flex: 1,
    fontSize: 16,
    color: COLORS.primary,
    padding: 10,
  },
  searchButton: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginLeft: 8,
    minWidth: 70,
    alignItems: 'center',
  },
  searchButtonText: {
    color: COLORS.background,
    fontFamily: 'ObjectFont',
    fontSize: 18,
  },
  suggestionsContainer: {
    maxHeight: 300,
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 1,
    borderColor: COLORS.secondary,
    borderRadius: 8,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  provinceHeader: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  provinceText: {
    color: COLORS.secondary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  suggestionItem: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  suggestionCity: {
    fontSize: 14,
    color: COLORS.primary,
  },
  controlsContainer: {
    position: 'absolute',
    right: 16,
    bottom: 100,
    gap: 12,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
    top: 12,
    left: 12,
    zIndex: 6,
  },
  controlIconField: {
    opacity: 0.5,
    position: 'absolute',
    zIndex: 5,
    left: -2,
  },

  controlButtonTextLocation: {
    position: 'absolute',
    top: -20,
    right: 7,
    fontSize: 10,
    color: COLORS.secondary,
    fontFamily: 'ObjectFont',
  },
  controlButtonTextField: {
    position: 'absolute',
    bottom: -20,
    right: 5,
    fontSize: 10,
    color: COLORS.secondary,
    fontFamily: 'ObjectFont',
  },
})
