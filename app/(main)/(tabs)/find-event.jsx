import { useState, useEffect } from 'react'
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
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

const FindEvent = () => {
  const router = useRouter()
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
  })
  const { filteredEvents, setFilteredEvents } = useDashboard()
  const [hasSearched, setHasSearched] = useState(false)
  const [showList, setShowList] = useState(true)
  const [filteredByGameType, setFilteredByGameType] = useState(filteredEvents)
  const [suggestions, setSuggestions] = useState([])
  const [suggestionSelected, setSuggestionSelected] = useState(false)

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
    if (suggestionSelected) {
      setSuggestions([])
      return
    }
    // Pokaż sugestie tylko gdy użytkownik aktywnie wpisuje
    if (!userInput.City || userInput.City.trim().length === 0) {
      setSuggestions([])
      return
    }
    // Jeśli miasto pochodzi z userLocation, nie pokazuj podpowiedzi
    if (consents.locationAccepted && userLocation.City && userInput.City === userLocation.City) {
      setSuggestions([])
      return
    }
    const filteredSuggestions = filterCitySuggestions(userInput.City, placesData)
    setSuggestions(filteredSuggestions)
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
      setLoading(false)
      return
    }

    // Walidacja miasta jeśli użytkownik wpisał własne miasto
    if (userInput.City.trim()) {
      const validation = validateCityInput(userInput.City, userInput.region, placesData)

      if (!validation.isValid) {
        Toast.error(validation.error, 'top')
        setLoading(false)
        return
      }

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
        distance: userInput.distance,
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
      Toast.error('Nie udało się wyszukać wydarzeń', 'top')
    }
    setLoading(false)
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
    setUserInput({ ...userInput, City: text })
    setSuggestionSelected(false)
  }

  const handleEventPress = (eventId) => {
    // Nawigacja do szczegółów wydarzenia
    router.push(`/(main)/(tabs)/(hidden)/single-event?id=${eventId}`)
  }

  return (
    <View style={styles.container} pointerEvents='box-none'>
      {/* Header */}
      <View style={styles.titleWrapper} pointerEvents='auto'>
        <Ionicons name='location' size={26} color={COLORS.secondary} />
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
        <CitySuggestions
          suggestions={suggestions}
          onSuggestionClick={handleSuggestionClick}
        />

        {/* Typ gry i dystans */}
        <View style={styles.inputRowSecond}>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={userInput.gameType}
              onValueChange={(value) =>
                setUserInput({ ...userInput, gameType: value })
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

          <TextInput
            style={styles.inputDistance}
            placeholder='km'
            placeholderTextColor={COLORS.gray}
            keyboardType='numeric'
            value={userInput.distance.toString()}
            onChangeText={(text) => {
              let value = parseInt(text) || 1
              if (value < 1) value = 1
              if (value > 50) value = 50
              setUserInput({ ...userInput, distance: value })
            }}
          />
        </View>

        {/* Przycisk szukaj */}
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

      {/* Lista wydarzeń - pokazywana gdy showList === true */}
      {showList && !loading && hasSearched && (
        <ScrollView
          style={styles.eventList}
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
              <Ionicons name='search' size={50} color={COLORS.gray} />
              <Text style={styles.noResultsText}>
                Brak wydarzeń spełniających kryteria
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Info przed wyszukaniem */}
      {!loading && !hasSearched && (
        <View style={styles.infoContainer}>
          <View style={styles.infoWrapper}>
          <Ionicons
            name='information-circle'
            size={50}
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
      {hasSearched && !loading && (
        <View style={styles.controlsContainer} pointerEvents='box-none'>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={toggleView}
            activeOpacity={0.8}
          >
            <Ionicons
              name={showList ? 'map' : 'list'}
              size={24}
              color={COLORS.secondary}
            />
          </TouchableOpacity>
          <Text style={styles.controlButtonText}>
            {showList ? 'Mapa' : 'Lista'}
          </Text>
        </View>
      )}
    </View>
  )
}

export default FindEvent

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  titleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  titleText: {
    fontSize: 24,
    fontFamily: 'Montserrat-Bold',
    color: COLORS.primary,
    marginLeft: 12,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  inputRow: {
    marginBottom: 12,
  },
  inputRowSecond: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  inputLocation: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    height: 50,
    paddingHorizontal: 20,
    fontSize: 16,
    fontFamily: 'Lato-Regular',
    color: COLORS.background,
  },
  pickerWrapper: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    height: 50,
    marginRight: 12,
    justifyContent: 'center',
    overflow: 'hidden',
    paddingLeft: 10,
  },
  picker: {
    height: 'auto',
  },
  pickerItem: {
    fontSize: 16,
    color: COLORS.background,
  },
  inputDistance: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    height: 50,
    width: 70,
    paddingHorizontal: 10,
    fontSize: 16,
    fontFamily: 'Lato-Regular',
    color: COLORS.background,
    textAlign: 'center',
  },
  searchButton: {
    backgroundColor: COLORS.secondary,
    borderRadius: 16,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    fontSize: 20,
    fontFamily: 'ObjectFont',
    color: COLORS.background,
  },
  eventList: {
    flex: 1,
  },
  eventListContent: {
    padding: 16,
  },
  noResults: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  noResultsText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Lato-Regular',
    color: COLORS.gray,
    textAlign: 'center',
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  infoWrapper: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  infoText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Lato-Regular',
    color: COLORS.primary,
    textAlign: 'center',

  },
  controlsContainer: {
    position: 'absolute',
    right: 16,
    bottom: 100,
    alignItems: 'center',
    gap: 4,
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
  },
  controlButtonText: {
    fontSize: 10,
    color: COLORS.secondary,
    fontFamily: 'ObjectFont',
    marginTop: 4,
  },
})
