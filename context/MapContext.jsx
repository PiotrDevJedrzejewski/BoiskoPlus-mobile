import {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from 'react'
import { useAuth } from './AuthContext'
import { checkSystemLocationPermissions } from '../assets/utils/getUserLocation'
import { dbg, useDebugMount, useDebugEffect, useProviderRenderCount } from '../assets/utils/debugLogger'

const MapContext = createContext()

// Współrzędne centrów województw Polski
const PROVINCE_COORDINATES = {
  'dolnośląskie': { lat: 51.1079, lon: 16.9252, zoom: 7 },
  'kujawsko-pomorskie': { lat: 53.0138, lon: 18.0060, zoom: 7},
  'lubelskie': { lat: 51.2465, lon: 22.5684, zoom: 7 },
  'lubuskie': { lat: 52.2500, lon: 15.5000, zoom: 7 },
  'łódzkie': { lat: 51.463477, lon: 19.172697, zoom: 7 },
  'małopolskie': { lat: 50.0647, lon: 19.9450, zoom: 7 },
  'mazowieckie': { lat: 52.3423, lon: 21.1017, zoom: 7 },
  'opolskie': { lat: 50.6751, lon: 17.9270, zoom: 8 },
  'podkarpackie': { lat: 50.0413, lon: 21.9990, zoom: 7 },
  'podlaskie': { lat: 53.1325, lon: 23.1688, zoom: 7 },
  'pomorskie': { lat: 54.3520, lon: 18.6466, zoom: 7 },
  'śląskie': { lat: 50.2975, lon: 19.0238, zoom: 8 },
  'świętokrzyskie': { lat: 50.8661, lon: 20.6286, zoom: 8 },
  'warmińsko-mazurskie': { lat: 53.7784, lon: 20.4801, zoom: 7 },
  'wielkopolskie': { lat: 52.3337, lon: 17.2417, zoom: 7 },
  'zachodniopomorskie': { lat: 53.4300, lon: 15.5000, zoom: 7 },
}




export const MapProvider = ({ children }) => {
  dbg('MapProvider')
  useDebugMount('MapProvider')
  useProviderRenderCount('MapProvider')

  const { consents, consentsLoading, getSavedLocation, systemPermissionsGeo, setSystemPermissionsGeo, updateConsents } = useAuth()
  const mapRef = useRef(null)
  const hasInitializedRef = useRef(false)
  const permissionsCheckedRef = useRef(false)

  // Czy pokazywać markery dla predefiniowanych lokalizacji
  const [showMarkers, setShowMarkers] = useState(true)

  // Czy pokazywać markery wydarzeń
  const [showEvents, setShowEvents] = useState(true)

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
    // date to force re-render of Camera when coordinates change (Mapbox bug workaround) 
    //Te same współrzędne = brak re-renderu, więc dodajemy unikalny klucz przy każdej zmianie, aby wymusić aktualizację kamery
    _key: Date.now(),
  })

  // Komponent mapy do współdzielenia między ekranami
  const [mapComponent, setMapComponent] = useState(null)

  const flyTo = useCallback((coordinates, zoom = 14) => {
    setCamera({
      centerCoordinate: coordinates,
      zoomLevel: zoom,
      // date to force re-render of Camera when coordinates change (Mapbox bug workaround) 
      //Te same współrzędne = brak re-renderu, więc dodajemy unikalny klucz przy każdej zmianie, aby wymusić aktualizację kamery
      _key: Date.now(),
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
      flyTo([19.5, 52.0], 6)
      return
    }

    try {
      // Pobierz lokalizację z AsyncStorage (lokalnie)
      const result = await getSavedLocation()
      if (result.success && result.location) {
        const location = {
          latitude: result.location.latitude,
          longitude: result.location.longitude,
          City: result.location.City || '',
          region: result.location.region || '',
          Country: result.location.Country || 'Poland',
        }
        setUserLocation(location)
        flyTo([result.location.longitude, result.location.latitude], 12)
      } else {
        // Brak danych lokalizacji - domyślna
        setUserLocation({
          latitude: 52.0,
          longitude: 19.5,
          City: '',
          region: '',
          Country: 'Poland',
        })
        flyTo([19.5, 52.0], 6)
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
      flyTo([19.5, 52.0], 6)
    }
  }, [getSavedLocation, flyTo])

  // Inicjalizacja lokalizacji startowej - tylko raz przy pierwszym załadowaniu
  useEffect(() => {
    if (!consentsLoading && consents && !hasInitializedRef.current) {
      hasInitializedRef.current = true
      setStartLocation(consents.locationAccepted)
    }
  }, [consentsLoading, consents, setStartLocation])

  // Sprawdzanie uprawnień systemowych do geolokalizacji — z guardem przeciw infinite loop
  useDebugEffect('MapContext:checkPermissions',
    [consentsLoading, consents?.locationAccepted],
    ['consentsLoading', 'consents.locationAccepted']
  )
  useEffect(() => {
    if (consentsLoading) return
    if (permissionsCheckedRef.current) return
    permissionsCheckedRef.current = true

    const checkPermissions = async () => {
      await checkSystemLocationPermissions({
        consents,
        systemPermissionsGeo,
        setSystemPermissionsGeo,
        updateConsents,
        consentsLoading,
      })
    }

    checkPermissions()
  }, [consentsLoading, consents?.locationAccepted, systemPermissionsGeo, setSystemPermissionsGeo, updateConsents])

  // Reaguj na zmiany zgody na lokalizację - tylko po inicjalizacji (zmiana w ustawieniach)
  const prevLocationAccepted = useRef(consents?.locationAccepted)
  useEffect(() => {
    if (consentsLoading || !hasInitializedRef.current) return
    // Reaguj tylko na faktyczną zmianę zgody (nie na initial mount)
    if (prevLocationAccepted.current === consents?.locationAccepted) return
    prevLocationAccepted.current = consents?.locationAccepted

    const handleLocationConsentChange = async () => {
      if (consents?.locationAccepted) {
        const result = await getSavedLocation()
        if (result.success && result.location) {
          const location = {
            latitude: result.location.latitude,
            longitude: result.location.longitude,
            City: result.location.City || '',
            region: result.location.region || '',
            Country: result.location.Country || 'Poland',
          }
          setUserLocation(location)
          flyTo([result.location.longitude, result.location.latitude], 12)
        }
      } else {
        setUserLocation({
          latitude: 52.0,
          longitude: 19.5,
          City: '',
          Country: 'Poland',
          region: '',
        })
        flyTo([19.5, 52.0], 6)
      }
    }
    
    handleLocationConsentChange()
  }, [consents?.locationAccepted, consentsLoading, getSavedLocation, flyTo])

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

  const mapContextValue = useMemo(() => ({
    mapRef,
    showMarkers,
    setShowMarkers,
    showEvents,
    setShowEvents,
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
  }), [
    showMarkers, showEvents, overlayOpacity, isInteractive, isMapReady,
    camera, flyTo, flyToProvince, getProvinceCoordinates,
    mapComponent, userLocation, setStartLocation,
  ])

  return (
    <MapContext.Provider value={mapContextValue}>
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
