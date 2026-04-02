/**
 * =====================================================
 * SOCKET.IO MANAGER — React lifecycle wrapper
 * =====================================================
 *
 * Stan socketów żyje w zustand (socketStore.js).
 * Ten komponent odpowiada TYLKO za:
 *   1. Inicjalizację socketów (wymaga useAuth, useNotification)
 *   2. Podpięcie listenerów socket.io → zapis do zustand store
 *   3. Audio (expo-audio hook wymaga React)
 *   4. Cleanup przy unmount / wylogowaniu
 *
 * NIE jest Context Providerem — renderuje po prostu {children}.
 * Konsumenci importują z socketStore.js bezpośrednio.
 */

import { useRef, useEffect } from 'react'
import { useAudioPlayer } from 'expo-audio'
import Constants from 'expo-constants'
import * as SecureStore from 'expo-secure-store'
import io from 'socket.io-client'
import { useAuth } from './AuthContext'
import { useNotification } from './NotificationContext'
import customFetch from '../assets/utils/customFetch'
import {
  useSocketStore,
  ConnectionState,
  _getJoinedRooms,
  _getChatListeners,
  _getNotificationListeners,
} from './socketStore'
import { dbg, useDebugMount, useProviderRenderCount } from '../assets/utils/debugLogger'

// =====================================================
// SOCKET CONFIG
// =====================================================

const getSocketUrl = () => {
  return (
    Constants.expoConfig?.extra?.socketUrl ||
    process.env.EXPO_PUBLIC_SERVER_URL_SOCKET ||
    'http://localhost:3000'
  )
}

const getSocketOptions = (authToken) => ({
  transports: ['polling', 'websocket'],
  upgrade: true,
  auth: { token: authToken },
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
// RE-EXPORTS for backward compatibility
// =====================================================

export { ConnectionState, useSocketStore } from './socketStore'

/**
 * @deprecated Use useSocketStore with selectors instead.
 * Kept for backward compatibility during migration.
 */
export const useSocketIo = () => useSocketStore()

// =====================================================
// MANAGER COMPONENT
// =====================================================

export const SocketIoProvider = ({ children }) => {
  dbg('SocketIoProvider')
  useDebugMount('SocketIoProvider')
  useProviderRenderCount('SocketIoProvider')

  const { user, isAuthChecked } = useAuth()
  const { shouldShowNotification } = useNotification()

  // ─── Audio ──
  const notificationPlayer = useAudioPlayer(
    require('../assets/sounds/notification-alert-269289.mp3')
  )

  // ─── Refs for stable access in socket handlers (avoid stale closures) ──
  const shouldShowNotificationRef = useRef(shouldShowNotification)
  useEffect(() => {
    shouldShowNotificationRef.current = shouldShowNotification
  }, [shouldShowNotification])

  const userIdRef = useRef(user?._id)
  useEffect(() => {
    userIdRef.current = user?._id
  }, [user?._id])

  const notificationPlayerRef = useRef(notificationPlayer)
  useEffect(() => {
    notificationPlayerRef.current = notificationPlayer
  }, [notificationPlayer])

  const playNotificationSound = () => {
    try {
      const player = notificationPlayerRef.current
      if (player) {
        player.seekTo(0)
        player.play()
      }
    } catch (error) {
      console.error('[Audio] Błąd odtwarzania dźwięku:', error)
    }
  }

  // ═════════════════════════════════════════════════
  // EFFECT: Inicjalizacja socketów
  // ═════════════════════════════════════════════════

  useEffect(() => {
    let cancelled = false

    const initSockets = async () => {
      if (!isAuthChecked) return

      const isAuthenticated = user && user.userID && user.userID !== null
      if (!isAuthenticated) {
        useSocketStore.getState().disconnectSockets()
        return
      }

      // Jeśli sockety już połączone, nie twórz nowych
      const { chatSocket: existingChat, notificationSocket: existingNotif } =
        useSocketStore.getState()
      if (existingChat?.connected && existingNotif?.connected) return

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

      if (cancelled) return

      const socketUrl = getSocketUrl()
      const socketOptions = getSocketOptions(authToken)
      const store = useSocketStore.getState()
      const _joinedRooms = _getJoinedRooms()

      // ── Chat socket ──
      store.setChatConnectionState(ConnectionState.CONNECTING)
      const newChatSocket = io(`${socketUrl}/chat`, socketOptions)

      newChatSocket.on('connect', () => {
        useSocketStore.getState().setChatConnectionState(ConnectionState.CONNECTED)
      })
      newChatSocket.on('disconnect', (reason) => {
        useSocketStore.getState().setChatConnectionState(
          reason === 'io server disconnect'
            ? ConnectionState.DISCONNECTED
            : ConnectionState.RECONNECTING
        )
      })
      newChatSocket.on('connect_error', (error) => {
        console.error('[Chat] Connection error:', error.message)
        useSocketStore.getState().setChatConnectionState(ConnectionState.ERROR)
      })
      newChatSocket.on('roomsRestored', (rooms) => {
        rooms.forEach((roomId) => _joinedRooms.add(roomId))
      })

      store.setChatSocket(newChatSocket)

      // ── Notification socket ──
      store.setNotificationConnectionState(ConnectionState.CONNECTING)
      const newNotificationSocket = io(`${socketUrl}/notifications`, socketOptions)

      newNotificationSocket.on('connect', () => {
        useSocketStore.getState().setNotificationConnectionState(ConnectionState.CONNECTED)
      })
      newNotificationSocket.on('disconnect', (reason) => {
        useSocketStore.getState().setNotificationConnectionState(
          reason === 'io server disconnect'
            ? ConnectionState.DISCONNECTED
            : ConnectionState.RECONNECTING
        )
      })
      newNotificationSocket.on('connect_error', (error) => {
        console.error('[Notifications] Connection error:', error.message)
        useSocketStore.getState().setNotificationConnectionState(ConnectionState.ERROR)
      })

      store.setNotificationSocket(newNotificationSocket)
    }

    initSockets()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.userID, isAuthChecked])

  // ═════════════════════════════════════════════════
  // EFFECT: Rozłącz przy wylogowaniu
  // ═════════════════════════════════════════════════

  const prevUserIdRef = useRef(user?.userID ?? null)
  useEffect(() => {
    const prevId = prevUserIdRef.current
    const currentId = user?.userID ?? null
    prevUserIdRef.current = currentId

    if (prevId && !currentId) {
      useSocketStore.getState().disconnectSockets()
    }
  }, [user?.userID])

  // ═════════════════════════════════════════════════
  // EFFECT: Cleanup socketów przy unmount
  // ═════════════════════════════════════════════════

  useEffect(() => {
    return () => {
      const { chatSocket, notificationSocket } = useSocketStore.getState()
      const chatLis = _getChatListeners()
      const notifLis = _getNotificationListeners()

      if (chatSocket) {
        chatLis.forEach((handler, event) => chatSocket.off(event, handler))
        chatLis.clear()
        chatSocket.disconnect()
      }
      if (notificationSocket) {
        notifLis.forEach((handler, event) => notificationSocket.off(event, handler))
        notifLis.clear()
        notificationSocket.disconnect()
      }
      _getJoinedRooms().clear()
    }
  }, [])

  // ═════════════════════════════════════════════════
  // EFFECT: Pobierz pokoje i dołącz (BATCH)
  // ═════════════════════════════════════════════════

  const chatSocket = useSocketStore((s) => s.chatSocket)
  const chatConnectionState = useSocketStore((s) => s.chatConnectionState)

  useEffect(() => {
    if (!chatSocket || chatConnectionState !== ConnectionState.CONNECTED) return
    if (!user?.userID) return

    let cancelled = false
    let timeoutId = null
    const _joinedRooms = _getJoinedRooms()

    const joinAndSetRooms = (rooms) => {
      if (cancelled) return
      if (rooms.length === 0) {
        useSocketStore.getState().setRoomsState([])
        return
      }
      const roomIds = rooms.map((room) => room.roomId)
      chatSocket.emit('joinRoomsBatch', roomIds, (joinResult) => {
        if (joinResult?.success) {
          joinResult.joined.forEach((roomId) => _joinedRooms.add(roomId))
        }
      })
      useSocketStore.getState().setRoomsState(rooms)
    }

    const fetchRoomsHTTP = async () => {
      if (cancelled) return
      try {
        const response = await customFetch.get('/chat/rooms')
        const rooms = response.data.chatRooms || []
        const roomsWithUnread = rooms.map((room) => ({
          ...room,
          unreadCount: room.unreadCount || 0,
        }))
        joinAndSetRooms(roomsWithUnread)
      } catch (error) {
        console.error('[fetchAndJoinRooms] HTTP fallback failed:', error.message)
        if (!cancelled) useSocketStore.getState().setRoomsState([])
      }
    }

    let webSocketResolved = false
    timeoutId = setTimeout(() => {
      if (!webSocketResolved && !cancelled) fetchRoomsHTTP()
    }, 8000)

    chatSocket.emit('getRoomsWithUnreadCounts', (result) => {
      webSocketResolved = true
      if (timeoutId) clearTimeout(timeoutId)
      if (cancelled) return
      if (!result?.success) {
        fetchRoomsHTTP()
        return
      }
      joinAndSetRooms(result.chatRooms || [])
    })

    return () => {
      cancelled = true
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [chatSocket, chatConnectionState, user?.userID])

  // ═════════════════════════════════════════════════
  // EFFECT: Pobierz nieprzeczytane powiadomienia
  // ═════════════════════════════════════════════════

  const notificationSocket = useSocketStore((s) => s.notificationSocket)
  const notificationConnectionState = useSocketStore(
    (s) => s.notificationConnectionState
  )

  useEffect(() => {
    if (!user?.userID) {
      const s = useSocketStore.getState()
      s.setUnreadEventsCount(0)
      s.setUnreadEventsList([])
      return
    }

    const fetchUnreadEventsHTTP = async () => {
      try {
        const response = await customFetch.get('/notifications/unread')
        const unreadEvents = response.data.unreadNotifications || []
        useSocketStore.getState().setUnreadEventsCount(unreadEvents.length)
        useSocketStore.getState().setUnreadEventsList(unreadEvents)
      } catch (error) {
        console.error('[Notifications] HTTP fetch error:', error)
        useSocketStore.getState().setUnreadEventsCount(0)
        useSocketStore.getState().setUnreadEventsList([])
      }
    }

    if (
      notificationSocket &&
      notificationConnectionState === ConnectionState.CONNECTED
    ) {
      notificationSocket.emit('getUnreadNotifications', (result) => {
        if (result.success) {
          useSocketStore.getState().setUnreadEventsCount(result.count)
          useSocketStore.getState().setUnreadEventsList(result.unreadNotifications)
        } else {
          fetchUnreadEventsHTTP()
        }
      })
    } else {
      fetchUnreadEventsHTTP()
    }
  }, [user?.userID, notificationSocket, notificationConnectionState])

  // ═════════════════════════════════════════════════
  // EFFECT: Listener — nowe wiadomości
  // ═════════════════════════════════════════════════

  useEffect(() => {
    if (!chatSocket) return

    const handleNewMessage = (msg) => {
      if (msg.sender?._id === userIdRef.current) return
      if (msg.roomId === useSocketStore.getState().activeRoomId) return

      // Zwiększ unread count
      useSocketStore.getState().setRoomsState((prev) =>
        prev.map((room) =>
          room.roomId === msg.roomId
            ? { ...room, unreadCount: (room.unreadCount || 0) + 1 }
            : room
        )
      )

      // Dźwięk
      const shouldNotify = shouldShowNotificationRef.current(
        'chatMessages',
        msg.roomId
      )
      if (shouldNotify) playNotificationSound()
    }

    useSocketStore.getState()._addChatListener('newMessage', handleNewMessage)

    return () => {
      chatSocket.off('newMessage', handleNewMessage)
      _getChatListeners().delete('newMessage')
    }
  }, [chatSocket])

  // ═════════════════════════════════════════════════
  // EFFECT: Online users tracking
  // ═════════════════════════════════════════════════

  useEffect(() => {
    if (!chatSocket || chatConnectionState !== ConnectionState.CONNECTED) return

    chatSocket.emit('getOnlineUsers', (result) => {
      if (result.success) {
        useSocketStore.getState().setOnlineUsers(new Set(result.onlineUsers))
      }
    })

    const handleUserOnline = ({ userId }) => {
      useSocketStore.getState().setOnlineUsers((prev) => new Set(prev).add(userId))
    }
    const handleUserOffline = ({ userId }) => {
      useSocketStore.getState().setOnlineUsers((prev) => {
        const next = new Set(prev)
        next.delete(userId)
        return next
      })
    }

    const store = useSocketStore.getState()
    store._addChatListener('userOnline', handleUserOnline)
    store._addChatListener('userOffline', handleUserOffline)

    return () => {
      chatSocket.off('userOnline', handleUserOnline)
      chatSocket.off('userOffline', handleUserOffline)
      const cl = _getChatListeners()
      cl.delete('userOnline')
      cl.delete('userOffline')
    }
  }, [chatSocket, chatConnectionState])

  // ═════════════════════════════════════════════════
  // EFFECT: Listener — status eventów
  // ═════════════════════════════════════════════════

  useEffect(() => {
    if (!notificationSocket) return

    const handleStatusUpdate = (data) => {
      const store = useSocketStore.getState()

      store.setLastStatusUpdate({
        timestamp: Date.now(),
        eventId: data.eventId,
        newStatus: data.newStatus,
      })

      const shouldNotify = shouldShowNotificationRef.current(
        'eventStatusUpdates',
        null,
        data.eventId
      )

      if (shouldNotify) {
        playNotificationSound()

        store.setUnreadEventsList((prev) => {
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
            store.setUnreadEventsCount(newList.length)
            return newList
          }
        })
      }
    }

    useSocketStore
      .getState()
      ._addNotificationListener('statusUpdate', handleStatusUpdate)

    return () => {
      notificationSocket.off('statusUpdate', handleStatusUpdate)
      _getNotificationListeners().delete('statusUpdate')
    }
  }, [notificationSocket])

  // ═════════════════════════════════════════════════
  // EFFECT: Listener — zaproszenia do znajomych
  // ═════════════════════════════════════════════════

  useEffect(() => {
    if (!notificationSocket) return

    const handleFriendRequest = () => {
      const shouldNotify =
        shouldShowNotificationRef.current('chatMessages')
      if (shouldNotify !== false) playNotificationSound()

      useSocketStore
        .getState()
        .setUnreadFriendRequestsCount((prev) => prev + 1)
    }

    useSocketStore
      .getState()
      ._addNotificationListener('friendRequest', handleFriendRequest)

    return () => {
      notificationSocket.off('friendRequest', handleFriendRequest)
      _getNotificationListeners().delete('friendRequest')
    }
  }, [notificationSocket])

  // ═════════════════════════════════════════════════
  // RENDER — no context provider, just children
  // ═════════════════════════════════════════════════

  return children
}
