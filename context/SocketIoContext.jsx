/**
 * =====================================================
 * SOCKET.IO CONTEXT V2 - React Native Version
 * =====================================================
 *
 * KLUCZOWE ULEPSZENIA względem V1:
 * 1. Podział na 2 sockety: chat i notifications (namespace'y)
 * 2. Prawidłowe czyszczenie listenerów przy unmount
 * 3. Automatyczny reconnect z re-join pokoi
 * 4. Batch join rooms (1 event zamiast N)
 * 5. Redukcja zapytań HTTP - używamy WebSocket gdzie możliwe
 * 6. Exponential backoff dla reconnect
 * 7. Connection state management
 * 8. Online users tracking
 *
 * REDUKCJA HTTP vs TCP:
 * ──────────────────────────────────────────────────────
 * V1 Problem: Dla każdego pokoju osobne HTTP dla unreadCount
 * V2 Rozwiązanie: Jedno zapytanie batch lub przez WebSocket
 *
 * V1 Problem: joinRoom wysyłany osobno dla każdego pokoju
 * V2 Rozwiązanie: joinRoomsBatch - jeden event dla wszystkich pokoi
 */

import {
  createContext,
  useContext,
  useRef,
  useEffect,
  useCallback,
  useState,
  useMemo,
} from 'react'
import { useAudioPlayer } from 'expo-audio'
import Constants from 'expo-constants'
import * as SecureStore from 'expo-secure-store'
import io from 'socket.io-client'
import { useAuth } from './AuthContext'
import { useNotification } from './NotificationContext'
import customFetch from '../assets/utils/customFetch'

const SocketIoContext = createContext()

// =====================================================
// KONFIGURACJA
// =====================================================

const getSocketUrl = () => {
  const url =
    Constants.expoConfig?.extra?.socketUrl ||
    process.env.EXPO_PUBLIC_SERVER_URL_SOCKET ||
    'http://localhost:3000'
  return url
}

// Konfiguracja reconnect z exponential backoff
const getSocketOptions = (authToken) => ({
  transports: ['polling', 'websocket'], // W React Native polling działa lepiej na start
  upgrade: true,
  auth: {
    token: authToken,
  },

  // RECONNECT CONFIG
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000, // Start: 1s
  reconnectionDelayMax: 30000, // Max: 30s
  randomizationFactor: 0.5, // Jitter: 0-50%

  // TIMEOUT CONFIG
  timeout: 20000, // 20s timeout na połączenie

  // Wyłącz automatyczne łączenie (łączymy ręcznie)
  autoConnect: true,

  // Dla HTTPS używaj secure connection
  secure: true,
})

// =====================================================
// CONNECTION STATE ENUM
// =====================================================

const ConnectionState = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  RECONNECTING: 'reconnecting',
  ERROR: 'error',
}

// =====================================================
// PROVIDER COMPONENT
// =====================================================

export const SocketIoProvider = ({ children }) => {
  const { user, isAuthChecked } = useAuth()
  const { shouldShowNotification } = useNotification()

  // ─────────────────────────────────────────────────
  // AUDIO - expo-audio hook
  // ─────────────────────────────────────────────────
  const notificationPlayer = useAudioPlayer(
    require('../assets/sounds/notification-alert-269289.mp3')
  )

  // ─────────────────────────────────────────────────
  // REFS - przechowują wartości między renderami
  // ─────────────────────────────────────────────────

  /**
   * Ref do śledzenia dołączonych pokoi
   * Używamy Set dla szybkiego lookup O(1)
   */
  const joinedRoomsRef = useRef(new Set())

  /**
   * Ref do przechowywania listenerów dla łatwego cleanup
   * Struktura: Map<eventName, handler>
   */
  const chatListenersRef = useRef(new Map())
  const notificationListenersRef = useRef(new Map())

  /**
   * Ref do śledzenia czy komponent jest zamontowany
   * Zapobiega setState po unmount
   */
  const isMountedRef = useRef(true)

  // ─────────────────────────────────────────────────
  // STATE
  // ─────────────────────────────────────────────────

  // Sockety dla dwóch namespace'ów
  const [chatSocket, setChatSocket] = useState(null)
  const [notificationSocket, setNotificationSocket] = useState(null)

  // Stan połączeń
  const [chatConnectionState, setChatConnectionState] = useState(
    ConnectionState.DISCONNECTED
  )
  const [notificationConnectionState, setNotificationConnectionState] =
    useState(ConnectionState.DISCONNECTED)

  // Pokoje i wiadomości
  const [roomsState, setRoomsState] = useState([])
  const [activeRoomId, setActiveRoomId] = useState(null)

  // Ref do activeRoomId - używany w handlerach socket aby uniknąć stale closure
  const activeRoomIdRef = useRef(null)
  useEffect(() => {
    activeRoomIdRef.current = activeRoomId
  }, [activeRoomId])

  // Powiadomienia o eventach
  const [unreadEventsCount, setUnreadEventsCount] = useState(0)
  const [unreadEventsList, setUnreadEventsList] = useState([])

  // Powiadomienia o zaproszeniach do znajomych
  const [unreadFriendRequestsCount, setUnreadFriendRequestsCount] = useState(0)

  // Ostatnia aktualizacja statusu - używane do triggerowania re-renderów w komponentach
  const [lastStatusUpdate, setLastStatusUpdate] = useState(null)

  // Online users - śledzenie kto jest online
  const [onlineUsers, setOnlineUsers] = useState(new Set())

  // ─────────────────────────────────────────────────
  // HELPER: Bezpieczny setState (tylko gdy mounted)
  // ─────────────────────────────────────────────────

  const safeSetState = useCallback((setter) => {
    if (isMountedRef.current) {
      setter()
    }
  }, [])

  // ─────────────────────────────────────────────────
  // HELPER: Dodaj listener z automatycznym cleanup
  // ─────────────────────────────────────────────────

  const addChatListener = useCallback(
    (event, handler) => {
      if (!chatSocket) return

      // Usuń poprzedni listener jeśli istnieje
      const existingHandler = chatListenersRef.current.get(event)
      if (existingHandler) {
        chatSocket.off(event, existingHandler)
      }

      // Dodaj nowy listener
      chatSocket.on(event, handler)
      chatListenersRef.current.set(event, handler)
    },
    [chatSocket]
  )

  const addNotificationListener = useCallback(
    (event, handler) => {
      if (!notificationSocket) return

      const existingHandler = notificationListenersRef.current.get(event)
      if (existingHandler) {
        notificationSocket.off(event, existingHandler)
      }

      notificationSocket.on(event, handler)
      notificationListenersRef.current.set(event, handler)
    },
    [notificationSocket]
  )

  // ─────────────────────────────────────────────────
  // HELPER: Odtwórz dźwięk powiadomienia (expo-audio)
  // ─────────────────────────────────────────────────

  const playNotificationSound = useCallback(() => {
    try {
      if (notificationPlayer) {
        notificationPlayer.seekTo(0)
        notificationPlayer.play()
      }
    } catch (error) {
      console.error('[Audio] Błąd odtwarzania dźwięku:', error)
    }
  }, [notificationPlayer])

  // ═════════════════════════════════════════════════
  // EFFECT: Inicjalizacja socketów
  // ═════════════════════════════════════════════════

  useEffect(() => {
    isMountedRef.current = true

    const initSockets = async () => {
      // Czekaj na zakończenie sprawdzania auth
      if (!isAuthChecked) {
        return
      }

      // Sprawdź czy user jest zalogowany
      const isAuthenticated = user && user.userID && user.userID !== null

      if (!isAuthenticated) {
        // User wylogowany - rozłącz sockety
        if (chatSocket) {
          for (const [event, handler] of chatListenersRef.current.entries()) {
            chatSocket.off(event, handler)
          }
          chatListenersRef.current.clear()
          chatSocket.disconnect()
          setChatSocket(null)
          setChatConnectionState(ConnectionState.DISCONNECTED)
        }
        if (notificationSocket) {
          for (const [
            event,
            handler,
          ] of notificationListenersRef.current.entries()) {
            notificationSocket.off(event, handler)
          }
          notificationListenersRef.current.clear()
          notificationSocket.disconnect()
          setNotificationSocket(null)
          setNotificationConnectionState(ConnectionState.DISCONNECTED)
        }

        // Reset state
        joinedRoomsRef.current.clear()
        setRoomsState([])
        setUnreadEventsCount(0)
        setUnreadEventsList([])
        setUnreadFriendRequestsCount(0)
        setOnlineUsers(new Set())

        return
      }

      // Jeśli sockety już istnieją i są połączone, nie twórz nowych
      if (chatSocket?.connected && notificationSocket?.connected) {
        return
      }

      // Pobierz token z SecureStore
      let authToken = null
      try {
        authToken = await SecureStore.getItemAsync('authToken')
      } catch (error) {
        console.error('[Socket] Błąd pobierania tokena:', error)
      }

      if (!authToken) {
        console.warn('[Socket] Brak tokena - sockety nie zostaną połączone')
        return
      }

      const socketUrl = getSocketUrl()
      const socketOptions = getSocketOptions(authToken)

      // ─────────────────────────────────────────────────
      // Utwórz socket dla namespace /chat
      // ─────────────────────────────────────────────────
      setChatConnectionState(ConnectionState.CONNECTING)

      const newChatSocket = io(`${socketUrl}/chat`, socketOptions)

      // Connection event handlers
      newChatSocket.on('connect', () => {
        safeSetState(() => setChatConnectionState(ConnectionState.CONNECTED))
      })

      newChatSocket.on('disconnect', (reason) => {
        safeSetState(() => {
          if (reason === 'io server disconnect') {
            setChatConnectionState(ConnectionState.DISCONNECTED)
          } else {
            setChatConnectionState(ConnectionState.RECONNECTING)
          }
        })
      })

      newChatSocket.on('connect_error', (error) => {
        console.error('[Chat] Connection error:', error.message)
        console.error('[Chat] Error details:', {
          type: error.type,
          description: error.description,
          context: error.context,
        })
        safeSetState(() => setChatConnectionState(ConnectionState.ERROR))
      })

      /**
       * ROOMS RESTORED - serwer automatycznie przywrócił pokoje po reconnect
       * Serwer śledzi które pokoje user miał dołączone i przywraca je po reconnect.
       */
      newChatSocket.on('roomsRestored', (rooms) => {
        rooms.forEach((roomId) => joinedRoomsRef.current.add(roomId))
      })

      setChatSocket(newChatSocket)

      // ─────────────────────────────────────────────────
      // Utwórz socket dla namespace /notifications
      // ─────────────────────────────────────────────────
      setNotificationConnectionState(ConnectionState.CONNECTING)

      const newNotificationSocket = io(
        `${socketUrl}/notifications`,
        socketOptions
      )

      newNotificationSocket.on('connect', () => {
        safeSetState(() =>
          setNotificationConnectionState(ConnectionState.CONNECTED)
        )
      })

      newNotificationSocket.on('disconnect', (reason) => {
        safeSetState(() => {
          if (reason === 'io server disconnect') {
            setNotificationConnectionState(ConnectionState.DISCONNECTED)
          } else {
            setNotificationConnectionState(ConnectionState.RECONNECTING)
          }
        })
      })

      newNotificationSocket.on('connect_error', (error) => {
        console.error('[Notifications] Connection error:', error.message)
        console.error('[Notifications] Error details:', {
          type: error.type,
          description: error.description,
          context: error.context,
        })
        safeSetState(() =>
          setNotificationConnectionState(ConnectionState.ERROR)
        )
      })

      setNotificationSocket(newNotificationSocket)
    }

    initSockets()

    // ─────────────────────────────────────────────────
    // CLEANUP przy unmount lub zmianie usera
    // ─────────────────────────────────────────────────

    return () => {
      isMountedRef.current = false
      // Cleanup jest obsługiwany w initSockets przy zmianie usera
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.userID, isAuthChecked])

  // Osobny cleanup effect
  useEffect(() => {
    return () => {
      if (chatSocket) {
        for (const [event, handler] of chatListenersRef.current.entries()) {
          chatSocket.off(event, handler)
        }
        chatListenersRef.current.clear()
        chatSocket.disconnect()
      }
      if (notificationSocket) {
        for (const [
          event,
          handler,
        ] of notificationListenersRef.current.entries()) {
          notificationSocket.off(event, handler)
        }
        notificationListenersRef.current.clear()
        notificationSocket.disconnect()
      }
      joinedRoomsRef.current.clear()
    }
  }, [chatSocket, notificationSocket])

  // ═════════════════════════════════════════════════
  // EFFECT: Pobierz pokoje i dołącz (BATCH)
  // WebSocket-first z HTTP fallback
  // ═════════════════════════════════════════════════

  useEffect(() => {
    if (!chatSocket || chatConnectionState !== ConnectionState.CONNECTED) return
    if (!user?.userID) return

    let cancelled = false
    let timeoutId = null

    // ── Funkcja do dołączania do pokoi (wspólna dla WebSocket i HTTP) ──
    const joinAndSetRooms = (rooms) => {
      if (cancelled) return

      if (rooms.length === 0) {
        safeSetState(() => setRoomsState([]))
        return
      }

      const roomIds = rooms.map((room) => room.roomId)

      // joinRoomsBatch - serwerowe dołączenie do Socket.IO rooms dla newMessage eventów
      chatSocket.emit('joinRoomsBatch', roomIds, (joinResult) => {
        if (joinResult?.success) {
          joinResult.joined.forEach((roomId) =>
            joinedRoomsRef.current.add(roomId)
          )
        }
      })

      safeSetState(() => setRoomsState(rooms))
    }

    // ── HTTP fallback (używany gdy WebSocket handler getRoomsWithUnreadCounts nie odpowiada) ──
    // UWAGA: Na Render free tier ten WebSocket handler może timeout'ować przez heavy DB queries.
    // HTTP endpoint jest lżejszy i bardziej niezawodny jako fallback.
    const fetchRoomsHTTP = async () => {
      if (cancelled) return
      try {
        const response = await customFetch.get('/chat/rooms')
        const rooms = response.data.chatRooms || []

        // HTTP może nie zwracać unreadCount - socket aktualizuje je na bieżąco przez newMessage
        const roomsWithUnread = rooms.map((room) => ({
          ...room,
          unreadCount: room.unreadCount || 0,
        }))

        joinAndSetRooms(roomsWithUnread)
      } catch (error) {
        console.error('[fetchAndJoinRooms] HTTP fallback failed:', error.message)
        if (!cancelled) {
          safeSetState(() => setRoomsState([]))
        }
      }
    }

    // ── WebSocket-first z 8s timeout i HTTP fallback ──
    // Preferujemy WebSocket bo zwraca unreadCount z DB.
    // Jeśli serwer nie odpowie w 8s (np. Render free tier timeout), fallback na HTTP.
    let webSocketResolved = false

    timeoutId = setTimeout(() => {
      if (!webSocketResolved && !cancelled) {
        fetchRoomsHTTP()
      }
    }, 8000)

    chatSocket.emit('getRoomsWithUnreadCounts', (result) => {
      webSocketResolved = true
      if (timeoutId) clearTimeout(timeoutId)
      if (cancelled) return

      if (!result?.success) {
        fetchRoomsHTTP()
        return
      }

      const rooms = result.chatRooms || []
      joinAndSetRooms(rooms)
    })

    return () => {
      cancelled = true
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [chatSocket, chatConnectionState, user?.userID, safeSetState])

  // ═════════════════════════════════════════════════
  // EFFECT: Pobierz nieprzeczytane powiadomienia
  // ═════════════════════════════════════════════════

  useEffect(() => {
    if (!user?.userID) {
      setUnreadEventsCount(0)
      setUnreadEventsList([])
      return
    }

    const fetchUnreadEvents = () => {
      // Preferuj WebSocket jeśli połączony
      if (
        notificationSocket &&
        notificationConnectionState === ConnectionState.CONNECTED
      ) {
        // Preferuj WebSocket - brak dodatkowego HTTP request
        notificationSocket.emit('getUnreadNotifications', (result) => {
          if (result.success) {
            safeSetState(() => {
              setUnreadEventsCount(result.count)
              setUnreadEventsList(result.unreadNotifications)
            })
          } else {
            console.error(
              '[Notifications] WebSocket fetch failed:',
              result.error
            )
            fetchUnreadEventsHTTP()
          }
        })
      } else {
        fetchUnreadEventsHTTP()
      }
    }

    // Fallback HTTP - gdy socket nie jest połączony
    const fetchUnreadEventsHTTP = async () => {
      try {
        const response = await customFetch.get('/notifications/unread')
        const unreadEvents = response.data.unreadNotifications || []

        safeSetState(() => {
          setUnreadEventsCount(unreadEvents.length)
          setUnreadEventsList(unreadEvents)
        })
      } catch (error) {
        console.error('[Notifications] HTTP fetch error:', error)
        safeSetState(() => {
          setUnreadEventsCount(0)
          setUnreadEventsList([])
        })
      }
    }

    fetchUnreadEvents()
  }, [
    user?.userID,
    notificationSocket,
    notificationConnectionState,
    safeSetState,
  ])

  // ═════════════════════════════════════════════════
  // EFFECT: Listener dla nowych wiadomości
  // ═════════════════════════════════════════════════

  // Ref do shouldShowNotification - unikamy re-subscribe przy każdym renderze NotificationContext
  const shouldShowNotificationRef = useRef(shouldShowNotification)
  useEffect(() => {
    shouldShowNotificationRef.current = shouldShowNotification
  }, [shouldShowNotification])

  // Ref do user._id - stabilna referencja
  const userIdRef = useRef(user?._id)
  useEffect(() => {
    userIdRef.current = user?._id
  }, [user?._id])

  useEffect(() => {
    if (!chatSocket) return

    const handleNewMessage = (msg) => {
      // Ignoruj własne wiadomości (używamy ref - zawsze aktualna wartość)
      if (msg.sender?._id === userIdRef.current) return

      // Ignoruj jeśli to aktywny pokój (ref - brak stale closure)
      // WZORZEC: activeRoomIdRef zamiast activeRoomId w zależnościach eliminuje
      // niepotrzebne re-subscribe przy każdej zmianie aktywnego pokoju.
      if (msg.roomId === activeRoomIdRef.current) return

      // ZAWSZE zwiększ licznik nieprzeczytanych (niezależnie od preferencji powiadomień)
      // Badge musi reagować nawet gdy powiadomienia są wyciszone.
      safeSetState(() => {
        setRoomsState((prev) =>
          prev.map((room) =>
            room.roomId === msg.roomId
              ? { ...room, unreadCount: (room.unreadCount || 0) + 1 }
              : room
          )
        )
      })

      // Dźwięk i powiadomienie push tylko jeśli preferencje na to pozwalają
      const shouldNotify = shouldShowNotificationRef.current('chatMessages', msg.roomId)
      if (shouldNotify) {
        playNotificationSound()
      }
    }

    addChatListener('newMessage', handleNewMessage)

    return () => {
      chatSocket.off('newMessage', handleNewMessage)
      chatListenersRef.current.delete('newMessage')
    }
    // Zredukowane zależności - activeRoomId, shouldShowNotification i user._id
    // są w refach, więc nie powodują re-subscribe przy każdej zmianie tych wartości.
  }, [chatSocket, addChatListener, safeSetState, playNotificationSound])

  // ═════════════════════════════════════════════════
  // EFFECT: Online users tracking
  // ═════════════════════════════════════════════════

  useEffect(() => {
    if (!chatSocket || chatConnectionState !== ConnectionState.CONNECTED) return

    // Pobierz aktualną listę online users przy połączeniu
    chatSocket.emit('getOnlineUsers', (result) => {
      if (result.success) {
        safeSetState(() => {
          setOnlineUsers(new Set(result.onlineUsers))
        })
      }
    })

    // Nasłuchuj na nowych online users
    const handleUserOnline = ({ userId }) => {
      safeSetState(() => {
        setOnlineUsers((prev) => new Set(prev).add(userId))
      })
    }

    // Nasłuchuj na offline users
    const handleUserOffline = ({ userId }) => {
      safeSetState(() => {
        setOnlineUsers((prev) => {
          const next = new Set(prev)
          next.delete(userId)
          return next
        })
      })
    }

    addChatListener('userOnline', handleUserOnline)
    addChatListener('userOffline', handleUserOffline)

    return () => {
      chatSocket.off('userOnline', handleUserOnline)
      chatSocket.off('userOffline', handleUserOffline)
      chatListenersRef.current.delete('userOnline')
      chatListenersRef.current.delete('userOffline')
    }
  }, [chatSocket, chatConnectionState, addChatListener, safeSetState])

  // ═════════════════════════════════════════════════
  // EFFECT: Listener dla statusu eventów
  // ═════════════════════════════════════════════════

  useEffect(() => {
    if (!notificationSocket) return

    const handleStatusUpdate = (data) => {
      // Socket emituje do pokoju user:${userId}, więc powiadomienie jest już adresowane do nas
      // Nie ma potrzeby sprawdzać userId - jeśli dostaliśmy event, to jest dla nas

      // Zawsze aktualizuj lastStatusUpdate - pozwala komponentom reagować na zmiany
      safeSetState(() => {
        setLastStatusUpdate({
          timestamp: Date.now(),
          eventId: data.eventId,
          newStatus: data.newStatus,
        })
      })

      const shouldNotify = shouldShowNotification(
        'eventStatusUpdates',
        null,
        data.eventId
      )

      if (shouldNotify) {
        playNotificationSound()

        safeSetState(() => {
          setUnreadEventsList((prev) => {
            const existingIndex = prev.findIndex(
              (event) => event.eventID._id === data.eventId
            )

            if (existingIndex !== -1) {
              const updated = [...prev]
              updated[existingIndex] = {
                ...updated[existingIndex],
                status: data.newStatus,
              }
              return updated
            } else {
              const newList = [
                ...prev,
                {
                  eventID: { _id: data.eventId, eventName: data.eventName },
                  status: data.newStatus,
                  readBy: false,
                },
              ]
              setUnreadEventsCount(newList.length)
              return newList
            }
          })
        })
      }
    }

    addNotificationListener('statusUpdate', handleStatusUpdate)

    return () => {
      notificationSocket.off('statusUpdate', handleStatusUpdate)
      notificationListenersRef.current.delete('statusUpdate')
    }
  }, [
    notificationSocket,
    shouldShowNotification,
    playNotificationSound,
    addNotificationListener,
    safeSetState,
  ])

  // ═════════════════════════════════════════════════
  // EFFECT: Listener dla zaproszeń do znajomych
  // ═════════════════════════════════════════════════

  useEffect(() => {
    if (!notificationSocket) return

    const handleFriendRequest = (data) => {
      const shouldNotify = shouldShowNotificationRef.current('chatMessages')
      // chatMessages to globalny przełącznik dźwięku; można też dodać osobny klucz
      if (shouldNotify !== false) {
        playNotificationSound()
      }
      safeSetState(() => {
        setUnreadFriendRequestsCount((prev) => prev + 1)
      })
    }

    addNotificationListener('friendRequest', handleFriendRequest)

    return () => {
      notificationSocket.off('friendRequest', handleFriendRequest)
      notificationListenersRef.current.delete('friendRequest')
    }
  }, [notificationSocket, addNotificationListener, playNotificationSound, safeSetState])

  // ═════════════════════════════════════════════════
  // API FUNCTIONS
  // ═════════════════════════════════════════════════

  /**
   * Dołącz do pokoju czatu
   * Używa callback-based API dla lepszej obsługi błędów
   */
  const joinRoom = useCallback(
    (roomId) => {
      return new Promise((resolve, reject) => {
        if (!chatSocket) {
          reject(new Error('Chat socket not connected'))
          return
        }

        if (joinedRoomsRef.current.has(roomId)) {
          resolve({ success: true, alreadyJoined: true })
          return
        }

        chatSocket.emit('joinRoom', roomId, (result) => {
          if (result.success) {
            joinedRoomsRef.current.add(roomId)
            resolve(result)
          } else {
            reject(new Error(result.error))
          }
        })
      })
    },
    [chatSocket]
  )

  /**
   * Dołącz do wielu pokoi naraz (batch)
   */
  const joinAllRooms = useCallback(
    (roomIds) => {
      return new Promise((resolve, reject) => {
        if (!chatSocket) {
          reject(new Error('Chat socket not connected'))
          return
        }

        // Filtruj pokoje, do których już dołączyliśmy
        const newRoomIds = roomIds.filter(
          (id) => !joinedRoomsRef.current.has(id)
        )

        if (newRoomIds.length === 0) {
          resolve({ success: true, joined: [], failed: [] })
          return
        }

        chatSocket.emit('joinRoomsBatch', newRoomIds, (result) => {
          if (result.success) {
            result.joined.forEach((roomId) =>
              joinedRoomsRef.current.add(roomId)
            )
          }
          resolve(result)
        })
      })
    },
    [chatSocket]
  )

  /**
   * Opuść pokój czatu
   */
  const leaveRoom = useCallback(
    (roomId) => {
      if (!chatSocket) return

      chatSocket.emit('leaveRoom', roomId)
      joinedRoomsRef.current.delete(roomId)
    },
    [chatSocket]
  )

  /**
   * Wyślij wiadomość
   * Używa callback-based API dla potwierdzenia dostarczenia
   */
  const sendMessage = useCallback(
    (roomId, message) => {
      return new Promise((resolve, reject) => {
        if (!chatSocket) {
          reject(new Error('Chat socket not connected'))
          return
        }

        chatSocket.emit('sendMessage', { roomId, message }, (result) => {
          if (result.success) {
            resolve(result.message)
          } else {
            reject(new Error(result.error))
          }
        })
      })
    },
    [chatSocket]
  )

  /**
   * Wyślij informację o pisaniu
   */
  const sendTyping = useCallback(
    (roomId) => {
      if (chatSocket) {
        chatSocket.emit('typing', roomId)
      }
    },
    [chatSocket]
  )

  const sendStopTyping = useCallback(
    (roomId) => {
      if (chatSocket) {
        chatSocket.emit('stopTyping', roomId)
      }
    },
    [chatSocket]
  )

  /**
   * Oznacz pokój jako przeczytany
   */
  const setRoomAsRead = useCallback(
    (roomId) => {
      safeSetState(() => {
        setRoomsState((prev) =>
          prev.map((room) =>
            room.roomId === roomId ? { ...room, unreadCount: 0 } : room
          )
        )
      })
    },
    [safeSetState]
  )

  /**
   * Oznacz event jako przeczytany
   * OPTYMALIZACJA: Używa WebSocket gdy dostępny, HTTP jako fallback.
   */
  const markEventAsRead = useCallback(
    (eventId) => {
      return new Promise((resolve, reject) => {
        // Optimistic update - aktualizuj UI natychmiast
        safeSetState(() => {
          setUnreadEventsList((prev) => {
            const filtered = prev.filter(
              (event) => event.eventID._id !== eventId
            )
            setUnreadEventsCount(filtered.length)
            return filtered
          })
        })

        // Preferuj WebSocket
        if (
          notificationSocket &&
          notificationConnectionState === ConnectionState.CONNECTED
        ) {
          notificationSocket.emit('markAsRead', { eventId }, (result) => {
            if (result.success) {
              resolve(result)
            } else {
              console.error(
                '[Notifications] WebSocket markAsRead failed:',
                result.error
              )
              reject(new Error(result.error))
            }
          })
        } else {
          // Fallback do HTTP
          customFetch
            .patch(`/status/events/${eventId}/mark-read`)
            .then(() => {
              resolve({ success: true })
            })
            .catch((error) => {
              console.error('[Notifications] HTTP markAsRead error:', error)
              reject(error)
            })
        }
      })
    },
    [notificationSocket, notificationConnectionState, safeSetState]
  )

  /**
   * Oznacz wszystkie eventy jako przeczytane
   * NOWA FUNKCJA: Batch operacja przez WebSocket
   */
  const markAllEventsAsRead = useCallback(
    (eventIds = null) => {
      return new Promise((resolve, reject) => {
        // Optimistic update
        safeSetState(() => {
          if (eventIds && eventIds.length > 0) {
            setUnreadEventsList((prev) => {
              const filtered = prev.filter(
                (event) => !eventIds.includes(event.eventID._id)
              )
              setUnreadEventsCount(filtered.length)
              return filtered
            })
          } else {
            // Wszystkie
            setUnreadEventsCount(0)
            setUnreadEventsList([])
          }
        })

        if (
          notificationSocket &&
          notificationConnectionState === ConnectionState.CONNECTED
        ) {
          notificationSocket.emit(
            'markAllAsRead',
            { eventIds: eventIds || [] },
            (result) => {
              if (result.success) {
                resolve(result)
              } else {
                reject(new Error(result.error))
              }
            }
          )
        } else {
          console.warn(
            '[Notifications] No WebSocket, batch marking not available'
          )
          resolve({ success: true, markedCount: 0 })
        }
      })
    },
    [notificationSocket, notificationConnectionState, safeSetState]
  )

  /**
   * Resetuj wszystkie nieprzeczytane eventy (tylko UI, bez zapisu do DB)
   */
  const resetUnreadEvents = useCallback(() => {
    safeSetState(() => {
      setUnreadEventsCount(0)
      setUnreadEventsList([])
    })
  }, [safeSetState])

  /**
   * Resetuj licznik nieprzeczytanych zaproszeń do znajomych
   */
  const resetFriendRequestCount = useCallback(() => {
    safeSetState(() => {
      setUnreadFriendRequestsCount(0)
    })
  }, [safeSetState])

  /**
   * Sprawdź czy event ma nieprzeczytane powiadomienia
   */
  const hasUnreadNotifications = useCallback(
    (eventId) => {
      return unreadEventsList.some((event) => event.eventID._id === eventId)
    },
    [unreadEventsList]
  )

  /**
   * Subskrybuj powiadomienia o evencie
   */
  const subscribeToEvent = useCallback(
    (eventId) => {
      if (notificationSocket) {
        notificationSocket.emit('subscribeToEvent', eventId)
      }
    },
    [notificationSocket]
  )

  /**
   * Odsubskrybuj powiadomienia o evencie
   */
  const unsubscribeFromEvent = useCallback(
    (eventId) => {
      if (notificationSocket) {
        notificationSocket.emit('unsubscribeFromEvent', eventId)
      }
    },
    [notificationSocket]
  )

  /**
   * Sprawdź czy użytkownik jest online
   */
  const isUserOnline = useCallback(
    (userId) => {
      return onlineUsers.has(userId)
    },
    [onlineUsers]
  )

  // ═════════════════════════════════════════════════
  // COMPUTED VALUES
  // ═════════════════════════════════════════════════

  /**
   * Łączna liczba nieprzeczytanych wiadomości
   */
  const totalUnreadMessages = useMemo(() => {
    return roomsState.reduce((sum, room) => sum + (room.unreadCount || 0), 0)
  }, [roomsState])

  /**
   * Łączna liczba wszystkich nieprzeczytanych powiadomień (eventy + zaproszenia)
   */
  const totalNotificationsCount = useMemo(() => {
    return unreadEventsCount + unreadFriendRequestsCount
  }, [unreadEventsCount, unreadFriendRequestsCount])

  /**
   * Czy jesteśmy połączeni?
   */
  const isConnected = useMemo(() => {
    return (
      chatConnectionState === ConnectionState.CONNECTED &&
      notificationConnectionState === ConnectionState.CONNECTED
    )
  }, [chatConnectionState, notificationConnectionState])

  // ═════════════════════════════════════════════════
  // CONTEXT VALUE
  // ═════════════════════════════════════════════════

  const contextValue = useMemo(
    () => ({
      // Sockety (dla zaawansowanych use case)
      chatSocket,
      notificationSocket,

      // Stan połączenia
      chatConnectionState,
      notificationConnectionState,
      isConnected,
      ConnectionState, // Enum do porównań

      // Pokoje i wiadomości
      roomsState,
      setRoomsState,
      activeRoomId,
      setActiveRoomId,
      setRoomAsRead,
      totalUnreadMessages,

      // Funkcje czatu
      joinRoom,
      joinAllRooms,
      leaveRoom,
      sendMessage,
      sendTyping,
      sendStopTyping,

      // Powiadomienia o eventach
      unreadEventsCount,
      setUnreadEventsCount,
      unreadEventsList,
      setUnreadEventsList,
      markEventAsRead,
      markAllEventsAsRead,
      resetUnreadEvents,
      hasUnreadNotifications,
      lastStatusUpdate,

      // Powiadomienia o zaproszeniach
      unreadFriendRequestsCount,
      setUnreadFriendRequestsCount,
      resetFriendRequestCount,
      totalNotificationsCount,

      // Subskrypcje eventów
      subscribeToEvent,
      unsubscribeFromEvent,

      // Online users
      onlineUsers,
      isUserOnline,

      // Kompatybilność wsteczna z V1
      // (dla istniejącego kodu - deprecated, użyj chatSocket)
      socket: chatSocket,
    }),
    [
      chatSocket,
      notificationSocket,
      chatConnectionState,
      notificationConnectionState,
      isConnected,
      roomsState,
      activeRoomId,
      setRoomAsRead,
      totalUnreadMessages,
      joinRoom,
      joinAllRooms,
      leaveRoom,
      sendMessage,
      sendTyping,
      sendStopTyping,
      unreadEventsCount,
      unreadEventsList,
      markEventAsRead,
      markAllEventsAsRead,
      resetUnreadEvents,
      hasUnreadNotifications,
      lastStatusUpdate,
      unreadFriendRequestsCount,
      setUnreadFriendRequestsCount,
      resetFriendRequestCount,
      totalNotificationsCount,
      subscribeToEvent,
      unsubscribeFromEvent,
      onlineUsers,
      isUserOnline,
    ]
  )

  return (
    <SocketIoContext.Provider value={contextValue}>
      {children}
    </SocketIoContext.Provider>
  )
}

// =====================================================
// HOOK
// =====================================================

export const useSocketIo = () => {
  const context = useContext(SocketIoContext)
  if (!context) {
    throw new Error('useSocketIo must be used within SocketIoProvider')
  }
  return context
}

// =====================================================
// MIGRATION NOTES (V1 -> V2)
// =====================================================

/**
 * ZMIANY DLA ISTNIEJĄCEGO KODU:
 *
 * 1. socket -> chatSocket (lub użyj socket dla kompatybilności wstecznej)
 *
 * 2. sendMessage(roomId, message, senderId) ->
 *    sendMessage(roomId, message) // senderId nie jest już potrzebny
 *
 * 3. Nowe funkcje:
 *    - sendTyping(roomId)
 *    - sendStopTyping(roomId)
 *    - subscribeToEvent(eventId)
 *    - unsubscribeFromEvent(eventId)
 *    - totalUnreadMessages
 *    - isConnected
 *    - markAllEventsAsRead(eventIds?)
 *    - isUserOnline(userId)
 *
 * 4. joinRoom teraz zwraca Promise (można await)
 *    Stary sposób: joinRoom(roomId)
 *    Nowy sposób: await joinRoom(roomId)
 *
 * 5. Stan połączenia:
 *    - chatConnectionState
 *    - notificationConnectionState
 *    - ConnectionState enum
 *
 * 6. Online users:
 *    - onlineUsers (Set)
 *    - isUserOnline(userId)
 */
