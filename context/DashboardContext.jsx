import { createContext, useContext, useState, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import customFetch from '../assets/utils/customFetch'

const DashboardContext = createContext()

export const DashboardProvider = ({ children }) => {
  const [filteredEvents, setFilteredEvents] = useState({
    center: { latitude: null, longitude: null },
    events: [],
    searchRadius: 5,
    total: 0,
  })

  // motyw mapy
  const [mapTheme, setMapTheme] = useState('dark')

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

  return (
    <DashboardContext.Provider
      value={{
        filteredEvents,
        setFilteredEvents,
        mapTheme,
        updateMapTheme,
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
