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

// Współrzędne centrów województw Polski
const PROVINCE_COORDINATES = {
  'dolnośląskie': { lat: 51.1079, lon: 16.9252, zoom: 8 },
  'kujawsko-pomorskie': { lat: 53.0138, lon: 18.0060, zoom: 8 },
  'lubelskie': { lat: 51.2465, lon: 22.5684, zoom: 8 },
  'lubuskie': { lat: 52.2500, lon: 15.5000, zoom: 8 },
  'łódzkie': { lat: 51.463477, lon: 19.172697, zoom: 8 },
  'małopolskie': { lat: 50.0647, lon: 19.9450, zoom: 8 },
  'mazowieckie': { lat: 52.3423, lon: 21.1017, zoom: 8 },
  'opolskie': { lat: 50.6751, lon: 17.9270, zoom: 9 },
  'podkarpackie': { lat: 50.0413, lon: 21.9990, zoom: 8 },
  'podlaskie': { lat: 53.1325, lon: 23.1688, zoom: 8 },
  'pomorskie': { lat: 54.3520, lon: 18.6466, zoom: 8 },
  'śląskie': { lat: 50.2975, lon: 19.0238, zoom: 9 },
  'świętokrzyskie': { lat: 50.8661, lon: 20.6286, zoom: 9 },
  'warmińsko-mazurskie': { lat: 53.7784, lon: 20.4801, zoom: 8 },
  'wielkopolskie': { lat: 52.3337, lon: 17.2417, zoom: 8 },
  'zachodniopomorskie': { lat: 53.4300, lon: 15.5000, zoom: 8 },
}




export const MapProvider = ({ children }) => {
  const { consents, consentsLoading, getThrottledLocation } = useAuth()
  const mapRef = useRef(null)

  // Czy pokazywać markery dla predefiniowanych lokalizacji
  const [showMarkers, setShowMarkers] = useState(true)

  // Opacity overlay (dla przyciemnienia tła)
  const [overlayOpacity, setOverlayOpacity] = useState(0.3)

  // Czy mapa jest interaktywna
  const [isInteractive, setIsInteractive] = useState(false)

  // Czy mapa jest gotowa (załadowana)
  const [isMapReady, setIsMapReady] = useState(false)

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
    setCamera({
      centerCoordinate: coordinates,
      zoomLevel: zoom,
    })
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
        centerCoordinate: [19.5, 52.0],
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

  // Reaguj na zmiany zgody na lokalizację w czasie rzeczywistym
  useEffect(() => {
    const handleLocationConsentChange = async () => {
      if (consentsLoading) return
      
      // Jeśli użytkownik włączył zgodę na lokalizację
      if (consents?.locationAccepted) {
        const result = await getThrottledLocation()
        if (result.success && result.location) {
          const location = {
            latitude: result.location.latitude,
            longitude: result.location.longitude,
            City: result.location.City || '',
            region: result.location.region || '',
            Country: result.location.Country || 'Poland',
          }
          setUserLocation(location)
          setCamera({
            centerCoordinate: [result.location.longitude, result.location.latitude],
            zoomLevel: 12,
          })
        }
      } else {
        // Jeśli użytkownik wyłączył zgodę - wróć do domyślnej lokalizacji
        setUserLocation({
          latitude: 52.0,
          longitude: 19.5,
          City: '',
          Country: 'Poland',
          region: '',
        })
        setCamera({
          centerCoordinate: [19.5, 52.0],
          zoomLevel: 6,
        })
      }
    }
    
    handleLocationConsentChange()
  }, [consents?.locationAccepted, consentsLoading, getThrottledLocation])

  // Funkcja do pobrania współrzędnych województwa
  const getProvinceCoordinates = useCallback((provinceName) => {
    if (!provinceName) return null
    const normalized = provinceName.toLowerCase().trim()
    return PROVINCE_COORDINATES[normalized] || null
  }, [])

  // Funkcja do wyśrodkowania mapy na województwo
  const flyToProvince = useCallback((provinceName) => {
    const coords = getProvinceCoordinates(provinceName)
    if (coords) {
      flyTo([coords.lon, coords.lat], coords.zoom)
      return true
    }
    return false
  }, [flyTo, getProvinceCoordinates])

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
        isMapReady,
        setIsMapReady,
        camera,
        setCamera,
        flyTo,
        flyToProvince,
        getProvinceCoordinates,
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
