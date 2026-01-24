import {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
} from 'react'
import customFetch from '../assets/utils/customFetch'
import { useAuth } from './AuthContext'

const MapContext = createContext()

export const MapProvider = ({ children }) => {
  const { consents, consentsLoading } = useAuth()
  const mapRef = useRef(null)

  // Czy pokazywać markery
  const [showMarkers, setShowMarkers] = useState(true)

  // Opacity overlay (dla przyciemnienia tła)
  const [overlayOpacity, setOverlayOpacity] = useState(0.3)

  // Czy mapa jest interaktywna
  const [isInteractive, setIsInteractive] = useState(false)

  // domyślne wartości dla lokalizacji - centrum Polski
  const [userLocation, setUserLocation] = useState({
    latitude: 52.0,
    longitude: 19.5,
    City: '',
    Country: 'Poland',
    region: '',
  })

  // Kamera mapy
  const [camera, setCamera] = useState({
    centerCoordinate: [19.5, 52.0], // Polska - cały kraj
    zoomLevel: 6,
  })

  // Komponent mapy do współdzielenia między ekranami
  const [mapComponent, setMapComponent] = useState(null)

  const flyTo = useCallback((coordinates, zoom = 14) => {
    if (mapRef.current) {
      mapRef.current.setCamera({
        centerCoordinate: coordinates,
        zoomLevel: zoom,
        animationDuration: 1000,
      })
    }
  }, [])

  // Funkcja do ustawienia lokalizacji startowej
  const setStartLocation = useCallback(async (locationAccepted) => {
    if (!locationAccepted) {
      // Brak zgody - domyślna lokalizacja (cała Polska)
      setUserLocation({
        latitude: 52.0,
        longitude: 19.5,
        City: '',
        Country: 'Poland',
        region: '',
      })
      setCamera({
        centerCoordinate: [19.5, 52.0], // Polska - cały kraj
        zoomLevel: 6,
      })
      return
    }

    try {
      // Pobierz lokalizację z backendu
      const response = await customFetch.get('/location/decrypt')
      if (response.data && response.data.latitude && response.data.longitude) {
        const location = {
          latitude: response.data.latitude,
          longitude: response.data.longitude,
          City: response.data.City || '',
          region: response.data.region || '',
          Country: response.data.Country || 'Poland',
        }
        setUserLocation(location)
        // Ustaw kamerę na lokalizację użytkownika
        setCamera({
          centerCoordinate: [response.data.longitude, response.data.latitude],
          zoomLevel: 12,
        })
      } else {
        // Brak danych lokalizacji - domyślna
        setUserLocation({
          latitude: 52.0,
          longitude: 19.5,
          City: '',
          region: '',
          Country: 'Poland',
        })
        setCamera({
          centerCoordinate: [19.5, 52.0],
          zoomLevel: 6,
        })
      }
    } catch (error) {
      console.error('Błąd pobierania lokalizacji:', error)
      // W przypadku błędu - domyślna lokalizacja
      setUserLocation({
        latitude: 52.0,
        longitude: 19.5,
        City: '',
        region: '',
        Country: 'Poland',
      })
      setCamera({
        centerCoordinate: [19.5, 52.0],
        zoomLevel: 6,
      })
    }
  }, [])

  // Inicjalizacja lokalizacji startowej na podstawie zgody użytkownika
  useEffect(() => {
    if (!consentsLoading && consents) {
      setStartLocation(consents.locationAccepted)
    }
  }, [consentsLoading, consents, setStartLocation])

  return (
    <MapContext.Provider
      value={{
        mapRef,
        showMarkers,
        setShowMarkers,
        overlayOpacity,
        setOverlayOpacity,
        isInteractive,
        setIsInteractive,
        camera,
        setCamera,
        flyTo,
        mapComponent,
        setMapComponent,
        userLocation,
        setUserLocation,
        setStartLocation,
      }}
    >
      {children}
    </MapContext.Provider>
  )
}

export const useMap = () => {
  const context = useContext(MapContext)
  if (!context) {
    throw new Error('useMap must be used within MapProvider')
  }
  return context
}
