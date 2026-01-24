import { useState, useCallback } from 'react'
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
import { useFocusEffect } from 'expo-router'
import { COLORS } from '../../../constants/colors'
import FindEventListElement from '../../../components/FindEventListElement'
import { useMap } from '../../../context/MapContext'

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
  const { setIsInteractive, setOverlayOpacity } = useMap()
  const [loading, setLoading] = useState(false)
  const [userInput, setUserInput] = useState({
    City: '',
    gameType: '',
    distance: '5',
  })
  const [filteredEvents, setFilteredEvents] = useState([])
  const [hasSearched, setHasSearched] = useState(false)

  // Włącz interaktywność mapy gdy ekran jest aktywny
  useFocusEffect(
    useCallback(() => {
      setIsInteractive(true)
      setOverlayOpacity(0.4) // Lekkie przyciemnienie dla lepszej czytelności formularza

      return () => {
        setIsInteractive(false)
        setOverlayOpacity(0.3)
      }
    }, []),
  )

  const handleSearch = async () => {
    setLoading(true)
    setHasSearched(true)

    // Symulacja wyszukiwania (w przyszłości zastąpić API call)
    setTimeout(() => {
      let results = [...MOCK_EVENTS]

      // Filtrowanie po typie gry
      if (userInput.gameType) {
        results = results.filter(
          (event) => event.gameType === userInput.gameType,
        )
      }

      setFilteredEvents(results)
      setLoading(false)
    }, 1000)
  }

  const handleEventPress = (eventId) => {
    // Nawigacja do szczegółów wydarzenia
    // router.push(`/(main)/(tabs)/(hidden)/event/${eventId}`)
    console.log('Event pressed:', eventId)
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
            placeholder='Twoja lokalizacja...'
            placeholderTextColor={COLORS.gray}
            value={userInput.City}
            onChangeText={(text) => setUserInput({ ...userInput, City: text })}
          />
        </View>

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
            value={userInput.distance}
            onChangeText={(text) => {
              let value = parseInt(text) || 0
              if (value < 1) value = 1
              if (value > 50) value = 50
              setUserInput({ ...userInput, distance: value.toString() })
            }}
          />
        </View>

        {/* Przycisk szukaj */}
        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearch}
          activeOpacity={0.8}
        >
          <Text style={styles.searchButtonText}>Szukaj</Text>
        </TouchableOpacity>
      </View>

      {/* Loading */}
      {loading && (
        <View style={styles.loaderContainer} pointerEvents='auto'>
          <ActivityIndicator size='large' color={COLORS.secondary} />
          <Text style={styles.loaderText}>Ładowanie...</Text>
        </View>
      )}

      {/* Lista wydarzeń */}
      {!loading && hasSearched && (
        <ScrollView
          style={styles.eventList}
          contentContainerStyle={styles.eventListContent}
          showsVerticalScrollIndicator={false}
          pointerEvents='auto'
        >
          {filteredEvents.length > 0 ? (
            filteredEvents.map((event) => (
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
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 12,
    fontSize: 16,
    fontFamily: 'Lato-Regular',
    color: COLORS.primary,
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
  infoText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Lato-Regular',
    color: COLORS.primary,
    textAlign: 'center',
    opacity: 0.8,
  },
})
