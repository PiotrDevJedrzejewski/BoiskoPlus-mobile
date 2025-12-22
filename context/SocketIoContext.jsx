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
  transports: ['websocket', 'polling'], // Preferuj WebSocket
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

  // Powiadomienia o eventach
  const [unreadEventsCount, setUnreadEventsCount] = useState(0)
  const [unreadEventsList, setUnreadEventsList] = useState([])

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
        console.log('[Socket] Waiting for auth check...')
        return
      }

      // Sprawdź czy user jest zalogowany
      const isAuthenticated = user && user.userID && user.userID !== null

      if (!isAuthenticated) {
        console.log('[Socket] User not authenticated, cleaning up sockets...')

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
        setOnlineUsers(new Set())

        return
      }

      // Jeśli sockety już istnieją i są połączone, nie twórz nowych
      if (chatSocket?.connected && notificationSocket?.connected) {
        console.log(
          '[Socket] Sockets already connected, skipping initialization'
        )
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

      console.log('[Chat] Connecting to namespace /chat for user:', user.userID)
      setChatConnectionState(ConnectionState.CONNECTING)

      const newChatSocket = io(`${socketUrl}/chat`, socketOptions)

      // Connection event handlers
      newChatSocket.on('connect', () => {
        console.log('[Chat] Connected:', newChatSocket.id)
        safeSetState(() => setChatConnectionState(ConnectionState.CONNECTED))
      })

      newChatSocket.on('disconnect', (reason) => {
        console.log('[Chat] Disconnected:', reason)
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
        safeSetState(() => setChatConnectionState(ConnectionState.ERROR))
      })

      /**
       * ROOMS RESTORED - serwer automatycznie przywrócił pokoje po reconnect
       */
      newChatSocket.on('roomsRestored', (rooms) => {
        console.log('[Chat] Rooms restored after reconnect:', rooms.length)
        rooms.forEach((roomId) => joinedRoomsRef.current.add(roomId))
      })

      setChatSocket(newChatSocket)

      // ─────────────────────────────────────────────────
      // Utwórz socket dla namespace /notifications
      // ─────────────────────────────────────────────────

      console.log('[Notifications] Connecting to namespace /notifications...')
      setNotificationConnectionState(ConnectionState.CONNECTING)

      const newNotificationSocket = io(
        `${socketUrl}/notifications`,
        socketOptions
      )

      newNotificationSocket.on('connect', () => {
        console.log('[Notifications] Connected:', newNotificationSocket.id)
        safeSetState(() =>
          setNotificationConnectionState(ConnectionState.CONNECTED)
        )
      })

      newNotificationSocket.on('disconnect', (reason) => {
        console.log('[Notifications] Disconnected:', reason)
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
      console.log('[Socket] Cleanup: disconnecting sockets')

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
  // ═════════════════════════════════════════════════

  useEffect(() => {
    if (!chatSocket || chatConnectionState !== ConnectionState.CONNECTED) return
    if (!user?.userID) return

    const fetchAndJoinRooms = async () => {
      try {
        /**
         * OPTYMALIZACJA #1:
         * Pobieramy pokoje + unread counts w jednym zapytaniu HTTP
         */
        const response = await customFetch.get(
          '/chat/rooms?includeUnreadCounts=true'
        )
        const rooms = response.data.chatRooms || []

        if (rooms.length === 0) {
          safeSetState(() => setRoomsState([]))
          return
        }

        /**
         * OPTYMALIZACJA #2:
         * Używamy joinRoomsBatch zamiast N osobnych joinRoom
         */
        const roomIds = rooms.map((room) => room.roomId)

        chatSocket.emit('joinRoomsBatch', roomIds, (result) => {
          if (result.success) {
            console.log(`[Chat] Joined ${result.joined.length} rooms in batch`)
            result.joined.forEach((roomId) =>
              joinedRoomsRef.current.add(roomId)
            )

            if (result.failed.length > 0) {
              console.warn('[Chat] Failed to join some rooms:', result.failed)
            }
          }
        })

        /**
         * Jeśli serwer nie obsługuje includeUnreadCounts,
         * pobierz je osobno (fallback)
         */
        let roomsWithUnread = rooms

        if (!rooms[0]?.hasOwnProperty('unreadCount')) {
          // Fallback: pobierz unread counts dla wszystkich pokoi w jednym zapytaniu
          try {
            const unreadResponse = await customFetch.post(
              '/chat/messages/unreaded/batch',
              { roomIds }
            )

            const unreadMap = new Map(
              (unreadResponse.data.counts || []).map((c) => [c.roomId, c.count])
            )

            roomsWithUnread = rooms.map((room) => ({
              ...room,
              unreadCount: unreadMap.get(room.roomId) || 0,
            }))
          } catch (batchError) {
            // Fallback do starego sposobu (N zapytań)
            console.warn('[Chat] Batch unread not available, using fallback')
            const unreadPromises = rooms.map(async (room) => {
              try {
                const res = await customFetch.get(
                  `/chat/messages/unreaded/count?roomId=${room.roomId}`
                )
                return { ...room, unreadCount: res.data.unreadCount || 0 }
              } catch {
                return { ...room, unreadCount: 0 }
              }
            })
            roomsWithUnread = await Promise.all(unreadPromises)
          }
        }

        safeSetState(() => setRoomsState(roomsWithUnread))
      } catch (error) {
        console.error('[Chat] Error fetching rooms:', error)
        safeSetState(() => setRoomsState([]))
      }
    }

    fetchAndJoinRooms()
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
        console.log('[Notifications] Fetching unread via WebSocket')
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

    // Fallback HTTP
    const fetchUnreadEventsHTTP = async () => {
      try {
        console.log('[Notifications] Fetching unread via HTTP (fallback)')
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

  useEffect(() => {
    if (!chatSocket) return

    const handleNewMessage = (msg) => {
      // Ignoruj własne wiadomości
      if (msg.sender?._id === user?._id) return

      // Ignoruj jeśli to aktywny pokój
      if (msg.roomId === activeRoomId) return

      // Sprawdź preferencje powiadomień
      const shouldNotify = shouldShowNotification('chatMessages', msg.roomId)

      if (shouldNotify) {
        playNotificationSound()

        // Zwiększ licznik nieprzeczytanych
        safeSetState(() => {
          setRoomsState((prev) =>
            prev.map((room) =>
              room.roomId === msg.roomId
                ? { ...room, unreadCount: (room.unreadCount || 0) + 1 }
                : room
            )
          )
        })
      }
    }

    addChatListener('newMessage', handleNewMessage)

    return () => {
      chatSocket.off('newMessage', handleNewMessage)
      chatListenersRef.current.delete('newMessage')
    }
  }, [
    chatSocket,
    user?._id,
    activeRoomId,
    shouldShowNotification,
    playNotificationSound,
    addChatListener,
    safeSetState,
  ])

  // ═════════════════════════════════════════════════
  // EFFECT: Online users tracking
  // ═════════════════════════════════════════════════

  useEffect(() => {
    if (!chatSocket || chatConnectionState !== ConnectionState.CONNECTED) return

    // Pobierz aktualną listę online users przy połączeniu
    chatSocket.emit('getOnlineUsers', (result) => {
      if (result.success) {
        console.log('[Chat] Online users loaded:', result.onlineUsers.length)
        safeSetState(() => {
          setOnlineUsers(new Set(result.onlineUsers))
        })
      }
    })

    // Nasłuchuj na nowych online users
    const handleUserOnline = ({ userId }) => {
      console.log('[Chat] User came online:', userId)
      safeSetState(() => {
        setOnlineUsers((prev) => new Set(prev).add(userId))
      })
    }

    // Nasłuchuj na offline users
    const handleUserOffline = ({ userId }) => {
      console.log('[Chat] User went offline:', userId)
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
      // Sprawdź czy dla aktualnego użytkownika
      if (data.userId !== user?._id) return

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
    user?._id,
    shouldShowNotification,
    playNotificationSound,
    addNotificationListener,
    safeSetState,
  ])

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
              console.log(
                `[Notifications] Marked ${eventId} as read via WebSocket`
              )
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
              console.log(`[Notifications] Marked ${eventId} as read via HTTP`)
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
                console.log(
                  `[Notifications] Marked ${result.markedCount} events as read`
                )
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
