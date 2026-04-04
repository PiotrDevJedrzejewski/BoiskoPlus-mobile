import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import customFetch from '../assets/utils/customFetch'
import { useAuth } from './AuthContext'
import { useSocketStore } from './socketStore'
import { dbg, useDebugMount, useProviderRenderCount } from '../assets/utils/debugLogger'

const DashboardContext = createContext()
// Minimalny odstęp między odświeżeniami HTTP, aby przełączanie ekranów
// nie powodowało lawiny zapytań do serwera.
const EVENTS_MIN_REFRESH_MS = 20 * 1000

export const DashboardProvider = ({ children }) => {
  const lastStatusUpdate = useSocketStore((s) => s.lastStatusUpdate)
  dbg('DashboardProvider')
  useDebugMount('DashboardProvider')
  useProviderRenderCount('DashboardProvider')

  const { user, isAuthChecked } = useAuth()
  const [filteredEvents, setFilteredEvents] = useState({
    center: { latitude: null, longitude: null },
    events: [],
    searchRadius: 5,
    total: 0,
  })

  const [eventsData, setEventsData] = useState({
    ownerEvents: [],
    userEvents: [],
    loading: false,
    error: null,
    lastFetchedAt: 0,
  })
  
  // Ref z ostatnim snapshotem danych.
  // Dzięki temu refreshEventsData może być stabilnym callbackiem ([]) i nadal
  // czytać świeże dane bez dodawania eventsData do dependency array.
  const eventsDataRef = useRef(eventsData)

  // Ref przechowujący aktywny Promise requestu.
  // Jeśli kilka ekranów poprosi o odświeżenie jednocześnie, dostaną ten sam Promise
  // zamiast uruchamiać kilka równoległych requestów.
  const eventsRequestRef = useRef(null)


  // Guard przeciw setState po unmount (bezpieczniej dla długich requestów).
  const isMountedRef = useRef(true)

  useEffect(() => {
    eventsDataRef.current = eventsData
  }, [eventsData])


  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

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
  const updateMapTheme = useCallback(async (newTheme) => {
    if (newTheme === 'light' || newTheme === 'dark') {
      setMapTheme(newTheme)
      try {
        await AsyncStorage.setItem('mapTheme', newTheme)
      } catch (error) {
        console.error('Błąd zapisywania motywu mapy:', error)
      }
    }
  }, [])

  // Świadomie ignorujemy błąd lokalnie, bo globalny stan błędu jest już ustawiony
  // wewnątrz refreshEventsData (error w eventsData). Ten helper zastępuje "gołe"
  // .catch(() => {}), żeby zamiar był czytelny.
  const swallowHandledRefreshError = useCallback(() => {}, [])

  const refreshEventsData = useCallback(async ({ force = false } = {}) => {
      const now = Date.now()
      const currentEventsData = eventsDataRef.current

      // 1) Dedup requestu: jeśli fetch trwa, nie uruchamiamy kolejnego.
      if (eventsRequestRef.current) {
        return eventsRequestRef.current
      }

      // 2) Throttle: jeśli cache jest świeży i nie wymuszono force, pomijamy HTTP.
      if (
        !force &&
        currentEventsData.lastFetchedAt > 0 &&
        now - currentEventsData.lastFetchedAt < EVENTS_MIN_REFRESH_MS
      ) {
        return {
          ownerEvents: currentEventsData.ownerEvents,
          userEvents: currentEventsData.userEvents,
          skipped: true,
        }
      }

      if (isMountedRef.current) {
        setEventsData((prev) => ({ ...prev, loading: true, error: null }))
      }

      const requestPromise = Promise.all([
        customFetch.get('/football-events'),
        customFetch.get('/status/my-events'),
      ])
        .then(([ownerResponse, participantResponse]) => {
          const ownerEvents = ownerResponse?.data?.events || []
          const userEvents = participantResponse?.data?.userEvents || []

          if (isMountedRef.current) {
            setEventsData({
              ownerEvents,
              userEvents,
              loading: false,
              error: null,
              lastFetchedAt: Date.now(),
            })
          }

          return { ownerEvents, userEvents, skipped: false }
        })
        .catch((error) => {
          console.error('Błąd odświeżania danych eventów:', error)
          if (isMountedRef.current) {
            setEventsData((prev) => ({
              ...prev,
              loading: false,
              error: 'Nie udało się pobrać wydarzeń',
            }))
          }
          throw error
        })
        .finally(() => {
          eventsRequestRef.current = null
        })

      eventsRequestRef.current = requestPromise
      return requestPromise
    }, [])

  
  useEffect(() => {
    // dependency array: [refreshEventsData] oznacza uruchomienie przy mount
    // oraz gdy referencja funkcji by się zmieniła.
    // Tu referencja jest stabilna (useCallback + []), więc efekt wykona się raz.
    if (!isAuthChecked || !user?.userID) return
    // Początkowe pobranie eventów dopiero wtedy, gdy mamy potwierdzoną sesję użytkownika.
    refreshEventsData().catch(swallowHandledRefreshError)
  }, [isAuthChecked, refreshEventsData, swallowHandledRefreshError, user?.userID])


  useEffect(() => {
    // Ten efekt reaguje TYLKO na sygnał socketa o zmianie statusu eventu.
    // Wtedy wymuszamy force=true, aby nie czekać na throttle 20s.
    if (!isAuthChecked || !user?.userID || !lastStatusUpdate) return
    refreshEventsData({ force: true }).catch(swallowHandledRefreshError)
  }, [
    isAuthChecked,
    lastStatusUpdate,
    refreshEventsData,
    swallowHandledRefreshError,
    user?.userID,
  ])

  const eventsDataAgeMs = useMemo(() => {
    if (!eventsData.lastFetchedAt) return null
    return Date.now() - eventsData.lastFetchedAt
  }, [eventsData.lastFetchedAt])

  // Optymistyczne usunięcie eventu z lokalnej listy, żeby UI nie pokazywał
  // usuniętego rekordu przez czas throttle'u (20s).
  const removeOwnerEvent = useCallback((eventId) => {
    setEventsData((prev) => ({
      ...prev,
      ownerEvents: prev.ownerEvents.filter((e) => e._id !== eventId),
    }))
  }, [])

  const dashboardContextValue = useMemo(() => ({
    filteredEvents,
    setFilteredEvents,
    mapTheme,
    updateMapTheme,
    eventsData,
    refreshEventsData,
    removeOwnerEvent,
    eventsDataAgeMs,
    eventsMinRefreshMs: EVENTS_MIN_REFRESH_MS,
  }), [
    filteredEvents, mapTheme, updateMapTheme, eventsData,
    refreshEventsData, removeOwnerEvent, eventsDataAgeMs,
  ])

  return (
    <DashboardContext.Provider value={dashboardContextValue}>
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
