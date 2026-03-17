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
import { useSocketIo } from './SocketIoContext'
import { useAuth } from './AuthContext'

const DashboardContext = createContext()
// Minimalny odstęp między odświeżeniami HTTP, aby przełączanie ekranów
// nie powodowało lawiny zapytań do serwera.
const EVENTS_MIN_REFRESH_MS = 20 * 1000
const FRIENDSHIPS_MIN_REFRESH_MS = 20 * 1000

// Przy Reactowym state bezpieczniej jest mieć pewność, że reset stanu buduje nowy obiekt,
// bo łatwiej uniknąć przypadkowego współdzielenia danych i problemów z porównywaniem referencji.
const createInitialFriendshipsData = () => ({
  friends: [],
  // Lista zaproszeń, które bieżący użytkownik wysłał i nadal czekają na odpowiedź.
  outgoingRequests: [],
  // Lista zaproszeń, które inni użytkownicy wysłali do nas i czekają na naszą decyzję.
  incomingRequests: [],
  loading: false,
  error: null,
  lastFetchedAt: 0,
})

const mapFriendshipToPlayer = (friendship) => {
  // Backend zwraca całą relację znajomości, ale UI karty gracza potrzebuje głównie
  // danych "tej drugiej osoby". Dlatego wybieramy pole `friend`, które kontroler
  // backendowy już przygotował specjalnie pod aktualnego użytkownika.
  // Fallback do recipient/requester zostawiamy defensywnie, gdyby shape odpowiedzi
  // kiedyś był niepełny albo jakiś endpoint zwrócił trochę inny obiekt.
  const friend = friendship?.friend || friendship?.recipient || friendship?.requester

  return {
    // Rozsypujemy podstawowe dane użytkownika, np. nick, imię, nazwisko, avatar.
    ...(friend || {}),
    // Zachowujemy też ID samej relacji, bo jest potrzebne do akcji typu:
    // zaakceptuj, odrzuć, anuluj, usuń znajomego.
    friendshipId: friendship?._id || null,
    // Dodatkowe pola relacji dokładamy obok danych użytkownika,
    // żeby komponent UI miał wszystko pod ręką w jednym obiekcie.
    friendshipStatus: friendship?.status || null,
    friendshipDirection: friendship?.direction || null,
    friendshipCreatedAt: friendship?.createdAt || null,
    friendshipUpdatedAt: friendship?.updatedAt || null,
  }
}

export const DashboardProvider = ({ children }) => {
  const { lastStatusUpdate } = useSocketIo()
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
  const [friendshipsData, setFriendshipsData] = useState(
    // Od razu inicjalizujemy stan przez funkcję-fabrykę,
    // żeby dostać świeży obiekt startowy.
    createInitialFriendshipsData()
  )
  // Ref z ostatnim snapshotem danych.
  // Dzięki temu refreshEventsData może być stabilnym callbackiem ([]) i nadal
  // czytać świeże dane bez dodawania eventsData do dependency array.
  const eventsDataRef = useRef(eventsData)
  // Ten ref przechowuje najnowszy snapshot stanu znajomych.
  // Dzięki temu callback może być stabilny, a mimo to czytać świeże dane.
  const friendshipsDataRef = useRef(friendshipsData)

  // Ref przechowujący aktywny Promise requestu.
  // Jeśli kilka ekranów poprosi o odświeżenie jednocześnie, dostaną ten sam Promise
  // zamiast uruchamiać kilka równoległych requestów.
  const eventsRequestRef = useRef(null)
  // Jeśli odświeżanie znajomych już trwa, trzymamy Promise tutaj,
  // żeby kolejne miejsca aplikacji mogły podpiąć się pod ten sam request.
  const friendshipsRequestRef = useRef(null)

  // Guard przeciw setState po unmount (bezpieczniej dla długich requestów).
  const isMountedRef = useRef(true)

  useEffect(() => {
    eventsDataRef.current = eventsData
  }, [eventsData])

  useEffect(() => {
    // Synchronizujemy ref z aktualnym stanem po każdym renderze,
    // żeby później w callbackach mieć zawsze najnowsze dane.
    friendshipsDataRef.current = friendshipsData
  }, [friendshipsData])

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

  // Świadomie ignorujemy błąd lokalnie, bo globalny stan błędu jest już ustawiony
  // wewnątrz refreshEventsData (error w eventsData). Ten helper zastępuje "gołe"
  // .catch(() => {}), żeby zamiar był czytelny.
  const swallowHandledRefreshError = useCallback(() => {}, [])

  const resetFriendshipsData = useCallback(() => {
    // Zerujemy referencję do trwającego requestu, bo po resecie nie chcemy
    // trzymać starego Promise jako "aktywnego".
    friendshipsRequestRef.current = null

    if (isMountedRef.current) {
      // Wracamy do czystego stanu początkowego np. po wylogowaniu użytkownika.
      setFriendshipsData(createInitialFriendshipsData())
    }
  }, [])

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

  const refreshFriendshipsData = useCallback(
    async ({ force = false } = {}) => {
      // Jeśli AuthContext jeszcze sprawdza sesję, nic nie pobieramy.
      // To chroni przed requestem wysłanym "w próżnię" zanim poznamy użytkownika.
      if (!isAuthChecked) {
        return {
          friends: [],
          outgoingRequests: [],
          incomingRequests: [],
          skipped: true,
        }
      }

      // Jeśli użytkownik nie jest zalogowany, to czyścimy dane znajomych,
      // bo nie mają już biznesowego sensu w pamięci aplikacji.
      if (!user?.userID) {
        resetFriendshipsData()
        return {
          friends: [],
          outgoingRequests: [],
          incomingRequests: [],
          skipped: true,
        }
      }

      const now = Date.now()
      // Czytamy snapshot z refa zamiast bezpośrednio ze state,
      // żeby callback nie musiał zależeć od całego `friendshipsData`.
      const currentFriendshipsData = friendshipsDataRef.current

      // Dedup requestu: jeśli pobieranie już trwa, zwracamy to samo Promise.
      // Dzięki temu dwa ekrany/efekty nie wyślą trzech identycznych requestów.
      if (friendshipsRequestRef.current) {
        return friendshipsRequestRef.current
      }

      // Throttle: jeśli dane są jeszcze świeże i nikt nie wymusił `force`,
      // pomijamy HTTP i zwracamy to, co już mamy w pamięci.
      if (
        !force &&
        currentFriendshipsData.lastFetchedAt > 0 &&
        now - currentFriendshipsData.lastFetchedAt < FRIENDSHIPS_MIN_REFRESH_MS
      ) {
        return {
          friends: currentFriendshipsData.friends,
          outgoingRequests: currentFriendshipsData.outgoingRequests,
          incomingRequests: currentFriendshipsData.incomingRequests,
          skipped: true,
        }
      }

      if (isMountedRef.current) {
        // Ustawiamy loading przed requestem i czyścimy poprzedni błąd,
        // żeby UI wiedziało, że trwa nowe pobieranie.
        setFriendshipsData((prev) => ({ ...prev, loading: true, error: null }))
      }

      // Pobieramy wszystkie trzy listy równolegle, bo są niezależne.
      // To skraca czas oczekiwania względem sekwencyjnego awaitowania.
      const requestPromise = Promise.all([
        customFetch.get('/friendships/friends'),
        customFetch.get('/friendships/requests/outgoing'),
        customFetch.get('/friendships/requests/incoming'),
      ])
        .then(([friendsResponse, outgoingResponse, incomingResponse]) => {
          // Każdą odpowiedź mapujemy do jednego, prostego shape pod UI.
          const friends = (friendsResponse?.data?.friends || []).map(
            mapFriendshipToPlayer
          )
          const outgoingRequests = (outgoingResponse?.data?.requests || []).map(
            mapFriendshipToPlayer
          )
          const incomingRequests = (incomingResponse?.data?.requests || []).map(
            mapFriendshipToPlayer
          )

          if (isMountedRef.current) {
            // Po sukcesie zapisujemy komplet danych i timestamp pobrania.
            setFriendshipsData({
              friends,
              outgoingRequests,
              incomingRequests,
              loading: false,
              error: null,
              lastFetchedAt: Date.now(),
            })
          }

          // Zwracamy dane także z funkcji, żeby kod wywołujący mógł ich użyć
          // bez konieczności czekania na kolejny render Reacta.
          return {
            friends,
            outgoingRequests,
            incomingRequests,
            skipped: false,
          }
        })
        .catch((error) => {
          console.error('Błąd odświeżania danych znajomych:', error)
          if (isMountedRef.current) {
            // Przy błędzie nie kasujemy istniejących list.
            // Dzięki temu użytkownik dalej widzi poprzednie dane zamiast pustego ekranu.
            setFriendshipsData((prev) => ({
              ...prev,
              loading: false,
              error: 'Nie udało się pobrać znajomych i zaproszeń',
            }))
          }
          throw error
        })
        .finally(() => {
          // Niezależnie od sukcesu lub błędu zdejmujemy znacznik aktywnego requestu,
          // żeby kolejne odświeżenie mogło wystartować normalnie.
          friendshipsRequestRef.current = null
        })

      // Zapisujemy Promise od razu przed `return`, żeby równoległe wywołania
      // mogły go współdzielić.
      friendshipsRequestRef.current = requestPromise
      return requestPromise
    },
    [isAuthChecked, resetFriendshipsData, user?.userID]
  )

  const mutateFriendship = useCallback(
    async (requestFactory, fallbackErrorMessage) => {
      try {
        // `requestFactory` to funkcja przekazana z zewnątrz.
        // Dzięki temu ta jedna metoda obsługuje wiele akcji: accept, reject, cancel, remove.
        const response = await requestFactory()
        // Po udanej mutacji odświeżamy listy, żeby UI dostało aktualny stan z backendu.
        // Jeśli samo odświeżenie chwilowo się nie uda, nie psujemy sukcesu głównej operacji.
        await refreshFriendshipsData({ force: true }).catch(() => null)

        return {
          success: true,
          message: response?.data?.msg || null,
          friendship: response?.data?.friendship
            ? mapFriendshipToPlayer(response.data.friendship)
            : null,
        }
      } catch (error) {
        console.error('Błąd operacji na znajomych:', error)
        return {
          // Preferujemy komunikat z backendu, bo zwykle jest bardziej biznesowy i czytelny.
          success: false,
          error: error.response?.data?.msg || fallbackErrorMessage,
        }
      }
    },
    [refreshFriendshipsData]
  )

  const sendFriendRequest = useCallback(
    // Cienki wrapper na konkretny endpoint.
    // Dzięki temu komponenty nie muszą znać URL-i backendu.
    async (recipientId) =>
      mutateFriendship(
        () => customFetch.post(`/friendships/requests/${recipientId}`),
        'Nie udało się wysłać zaproszenia do znajomych'
      ),
    [mutateFriendship]
  )

  const respondToFriendRequest = useCallback(
    // Ten handler jest wspólny dla accept i reject.
    // Różni się tylko wartością `status` przekazaną do backendu.
    async (friendshipId, status) =>
      mutateFriendship(
        () =>
          customFetch.patch(`/friendships/requests/${friendshipId}/respond`, {
            status,
          }),
        'Nie udało się zaktualizować zaproszenia do znajomych'
      ),
    [mutateFriendship]
  )

  const acceptFriendRequest = useCallback(
    // Wygodny alias dla UI: komponent mówi "accept",
    // a nie musi pamiętać jaka dokładnie wartość statusu idzie do API.
    async (friendshipId) => respondToFriendRequest(friendshipId, 'accepted'),
    [respondToFriendRequest]
  )

  const rejectFriendRequest = useCallback(
    // Analogiczny alias dla odrzucenia zaproszenia.
    async (friendshipId) => respondToFriendRequest(friendshipId, 'rejected'),
    [respondToFriendRequest]
  )

  const cancelFriendRequest = useCallback(
    // Anulowanie dotyczy zaproszenia wysłanego przez bieżącego użytkownika.
    async (friendshipId) =>
      mutateFriendship(
        () => customFetch.delete(`/friendships/requests/${friendshipId}/cancel`),
        'Nie udało się anulować zaproszenia do znajomych'
      ),
    [mutateFriendship]
  )

  const removeFriend = useCallback(
    // Usuwanie dotyczy już zaakceptowanej relacji znajomości.
    async (friendshipId) =>
      mutateFriendship(
        () => customFetch.delete(`/friendships/friends/${friendshipId}`),
        'Nie udało się usunąć znajomego'
      ),
    [mutateFriendship]
  )

  const fetchFriendshipStatus = useCallback(async (userId) => {
    try {
      // Ten endpoint przydaje się np. na profilu innego użytkownika,
      // gdy trzeba ustalić jaki przycisk pokazać: Dodaj, Cofnij, Usuń itd.
      const response = await customFetch.get(`/friendships/status/${userId}`)

      return {
        success: true,
        status: response?.data?.status || 'none',
        friendship: response?.data?.friendship
          ? mapFriendshipToPlayer(response.data.friendship)
          : null,
      }
    } catch (error) {
      console.error('Błąd pobierania statusu znajomości:', error)
      return {
        success: false,
        error: error.response?.data?.msg || 'Nie udało się pobrać statusu znajomości',
      }
    }
  }, [])

  const fetchFriendshipById = useCallback(async (friendshipId) => {
    try {
      // Pobieramy pojedynczą relację po jej ID, jeśli jakiś ekran potrzebuje pełnego odczytu.
      const response = await customFetch.get(`/friendships/${friendshipId}`)

      return {
        success: true,
        friendship: response?.data?.friendship
          ? mapFriendshipToPlayer(response.data.friendship)
          : null,
      }
    } catch (error) {
      console.error('Błąd pobierania relacji znajomości:', error)
      return {
        success: false,
        error: error.response?.data?.msg || 'Nie udało się pobrać relacji znajomości',
      }
    }
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
    // Gdy użytkownik znika z sesji, czyścimy dane znajomych,
    // żeby kolejna osoba na tym samym urządzeniu nie zobaczyła starego cache.
    if (user?.userID) return
    resetFriendshipsData()
  }, [resetFriendshipsData, user?.userID])

  useEffect(() => {
    // Początkowe pobranie znajomych po potwierdzeniu autoryzacji.
    if (!isAuthChecked || !user?.userID) return
    refreshFriendshipsData().catch(swallowHandledRefreshError)
  }, [
    isAuthChecked,
    refreshFriendshipsData,
    swallowHandledRefreshError,
    user?.userID,
  ])

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

  const friendshipsDataAgeMs = useMemo(() => {
    // To prosty wskaźnik "wieku" danych, np. pod przyszłe decyzje UI albo debugowanie.
    if (!friendshipsData.lastFetchedAt) return null
    return Date.now() - friendshipsData.lastFetchedAt
  }, [friendshipsData.lastFetchedAt])

  return (
    <DashboardContext.Provider
      value={{
        filteredEvents,
        setFilteredEvents,
        mapTheme,
        updateMapTheme,
        eventsData,
        refreshEventsData,
        eventsDataAgeMs,
        eventsMinRefreshMs: EVENTS_MIN_REFRESH_MS,
        // Wystawiamy cały moduł znajomych z jednego miejsca,
        // żeby komponenty nie musiały znać szczegółów backendu ani logiki cache.
        friendshipsData,
        refreshFriendshipsData,
        sendFriendRequest,
        respondToFriendRequest,
        acceptFriendRequest,
        rejectFriendRequest,
        cancelFriendRequest,
        removeFriend,
        fetchFriendshipStatus,
        fetchFriendshipById,
        friendshipsDataAgeMs,
        friendshipsMinRefreshMs: FRIENDSHIPS_MIN_REFRESH_MS,
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
