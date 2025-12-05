import { createContext, useContext, useState, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import customFetch from '../assets/utils/customFetch'

const DashboardContext = createContext()

export const DashboardProvider = ({ children }) => {
  // GEOLOCATION
  // sprawdzenie czy geolokalizacja jest zapisana (istnieje)
  const [geolocationExists, setGeolocationExists] = useState(false)
  // geolokalizacja zaakceptowana automatycznie lub ręcznie przez użytkownika
  const [geolocationAccepted, setGeolocationAccepted] = useState(false)
  // state do przechowywania lokalizacji użytkownika
  // domyślne wartości dla lokalizacji
  const [userLocation, setUserLocation] = useState({
    latitude: 52.2297,
    longitude: 21.0122,
    City: 'warszawa',
    Country: 'Poland',
    region: 'mazowieckie',
  })

  const [filteredEvents, setFilteredEvents] = useState({
    center: { latitude: null, longitude: null },
    events: [],
    searchRadius: 5,
    total: 0,
  })

  // motyw mapy
  const [mapTheme, setMapTheme] = useState('dark')

  // Pobierz geolokalizację z serwera
  useEffect(() => {
    const fetchGeolocation = async () => {
      try {
        const response = await customFetch.get('/location/decrypt')
        if (response.data) {
          setUserLocation(response.data)
          setGeolocationAccepted(true)
          setGeolocationExists(true)
        }
      } catch (error) {
        console.error('Geolocation not setup yet or dont exist:', error)
      }
    }

    fetchGeolocation()
  }, [])

  // Wczytaj motyw mapy z AsyncStorage
  useEffect(() => {
    const loadMapTheme = async () => {
      try {
        const savedMapTheme = await AsyncStorage.getItem('mapTheme')
        if (
          savedMapTheme &&
          (savedMapTheme === 'light' || savedMapTheme === 'dark')
        ) {
          setMapTheme(savedMapTheme)
        }
      } catch (error) {
        console.error('Błąd wczytywania motywu mapy:', error)
      }
    }

    loadMapTheme()
  }, [])

  // Funkcja do zmiany motywu mapy
  const updateMapTheme = async (newTheme) => {
    if (newTheme === 'light' || newTheme === 'dark') {
      setMapTheme(newTheme)
      try {
        await AsyncStorage.setItem('mapTheme', newTheme)
      } catch (error) {
        console.error('Błąd zapisywania motywu mapy:', error)
      }
    }
  }

  // Funkcja do zapisania lokalizacji na serwerze

  // jest roznica w webie (windoPopups -> useReducer + cookies)

  // const saveUserLocation = async (location) => {
  //   try {
  //     await customFetch.post('/location/set', location)
  //     setUserLocation(location)
  //     setGeolocationAccepted(true)
  //     setGeolocationExists(true)
  //     return { success: true }
  //   } catch (error) {
  //     console.error('Błąd zapisywania lokalizacji:', error)
  //     return { success: false, error: error.message }
  //   }
  // }

  return (
    <DashboardContext.Provider
      value={{
        userLocation,
        setUserLocation,
        geolocationAccepted,
        setGeolocationAccepted,
        geolocationExists,
        setGeolocationExists,
        filteredEvents,
        setFilteredEvents,
        mapTheme,
        updateMapTheme,
        saveUserLocation,
      }}
    >
      {children}
    </DashboardContext.Provider>
  )
}

export const useDashboard = () => {
  const context = useContext(DashboardContext)
  if (!context) {
    throw new Error('useDashboard must be used within DashboardProvider')
  }
  return context
}
