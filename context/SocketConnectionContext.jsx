/**
 * =====================================================
 * SOCKET CONNECTION CONTEXT
 * =====================================================
 *
 * Zarządza surowym połączeniem WebSocket (2 namespace'y: /chat i /notifications).
 * NIE zawiera logiki biznesowej (wiadomości, pokoje, powiadomienia).
 * Te odpowiedzialności są w ChatContext i NotificationsSocketContext.
 *
 * Zmiana stanu połączenia jest rzadka → minimalne re-rendery konsumentów.
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

const SocketConnectionContext = createContext()

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

const getSocketOptions = (authToken) => ({
  transports: ['polling', 'websocket'],
  upgrade: true,
  auth: {
    token: authToken,
  },
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 30000,
  randomizationFactor: 0.5,
  timeout: 20000,
  autoConnect: true,
  secure: true,
})

// =====================================================
// CONNECTION STATE ENUM
// =====================================================

export const ConnectionState = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  RECONNECTING: 'reconnecting',
  ERROR: 'error',
}

// =====================================================
// PROVIDER
// =====================================================

export const SocketConnectionProvider = ({ children }) => {
  const { user, isAuthChecked } = useAuth()

  // Audio — współdzielony między ChatContext i NotificationsSocketContext
  const notificationPlayer = useAudioPlayer(
    require('../assets/sounds/notification-alert-269289.mp3')
  )

  const isMountedRef = useRef(true)

  // Sockety
  const [chatSocket, setChatSocket] = useState(null)
  const [notificationSocket, setNotificationSocket] = useState(null)

  // Stan połączeń
  const [chatConnectionState, setChatConnectionState] = useState(
    ConnectionState.DISCONNECTED
  )
  const [notificationConnectionState, setNotificationConnectionState] =
    useState(ConnectionState.DISCONNECTED)

  // ─────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────

  const safeSetState = useCallback((setter) => {
    if (isMountedRef.current) {
      setter()
    }
  }, [])

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

  // ─────────────────────────────────────────────────
  // DISCONNECT
  // ─────────────────────────────────────────────────

  const disconnectSockets = useCallback(() => {
    if (chatSocket) {
      chatSocket.removeAllListeners()
      chatSocket.disconnect()
      setChatSocket(null)
      setChatConnectionState(ConnectionState.DISCONNECTED)
    }
    if (notificationSocket) {
      notificationSocket.removeAllListeners()
      notificationSocket.disconnect()
      setNotificationSocket(null)
      setNotificationConnectionState(ConnectionState.DISCONNECTED)
    }
  }, [chatSocket, notificationSocket])

  const disconnectSocketsRef = useRef(disconnectSockets)
  useEffect(() => {
    disconnectSocketsRef.current = disconnectSockets
  }, [disconnectSockets])

  // ═════════════════════════════════════════════════
  // EFFECT: Inicjalizacja socketów
  // ═════════════════════════════════════════════════

  useEffect(() => {
    isMountedRef.current = true

    const initSockets = async () => {
      if (!isAuthChecked) return

      const isAuthenticated = user && user.userID && user.userID !== null
      if (!isAuthenticated) {
        disconnectSocketsRef.current()
        return
      }

      if (chatSocket?.connected && notificationSocket?.connected) return

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

      // ── Chat socket ──
      setChatConnectionState(ConnectionState.CONNECTING)
      const newChatSocket = io(`${socketUrl}/chat`, socketOptions)

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
        safeSetState(() => setChatConnectionState(ConnectionState.ERROR))
      })

      setChatSocket(newChatSocket)

      // ── Notification socket ──
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
        safeSetState(() =>
          setNotificationConnectionState(ConnectionState.ERROR)
        )
      })

      setNotificationSocket(newNotificationSocket)
    }

    initSockets()

    return () => {
      isMountedRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.userID, isAuthChecked])

  // ═════════════════════════════════════════════════
  // EFFECT: Rozłącz sockety przy wylogowaniu
  // ═════════════════════════════════════════════════

  const prevUserIdRef = useRef(user?.userID ?? null)
  useEffect(() => {
    const prevId = prevUserIdRef.current
    const currentId = user?.userID ?? null
    prevUserIdRef.current = currentId

    if (prevId && !currentId) {
      disconnectSocketsRef.current()
    }
  }, [user?.userID])

  // Cleanup przy odmontowaniu lub zmianie referencji socketów
  useEffect(() => {
    return () => {
      if (chatSocket) {
        chatSocket.removeAllListeners()
        chatSocket.disconnect()
      }
      if (notificationSocket) {
        notificationSocket.removeAllListeners()
        notificationSocket.disconnect()
      }
    }
  }, [chatSocket, notificationSocket])

  // ═════════════════════════════════════════════════
  // COMPUTED
  // ═════════════════════════════════════════════════

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
      chatSocket,
      notificationSocket,
      chatConnectionState,
      notificationConnectionState,
      isConnected,
      ConnectionState,
      disconnectSockets,
      playNotificationSound,
      safeSetState,
    }),
    [
      chatSocket,
      notificationSocket,
      chatConnectionState,
      notificationConnectionState,
      isConnected,
      disconnectSockets,
      playNotificationSound,
      safeSetState,
    ]
  )

  return (
    <SocketConnectionContext.Provider value={contextValue}>
      {children}
    </SocketConnectionContext.Provider>
  )
}

export const useSocketConnection = () => {
  const context = useContext(SocketConnectionContext)
  if (!context) {
    throw new Error(
      'useSocketConnection must be used within SocketConnectionProvider'
    )
  }
  return context
}
