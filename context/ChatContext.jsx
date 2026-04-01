/**
 * =====================================================
 * CHAT CONTEXT
 * =====================================================
 *
 * Zarządza logiką czatu: pokoje, wiadomości, online users, typing.
 * Konsumuje SocketConnectionContext dla surowych socketów.
 *
 * Re-render konsumentów następuje TYLKO gdy zmieni się:
 * - roomsState (nowa wiadomość / dołączenie do pokoju)
 * - onlineUsers (ktoś się zalogował/wylogował)
 * - activeRoomId
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
import { useAuth } from './AuthContext'
import { useNotification } from './NotificationContext'
import {
  useSocketConnection,
  ConnectionState,
} from './SocketConnectionContext'
import customFetch from '../assets/utils/customFetch'

const ChatContext = createContext()

export const ChatProvider = ({ children }) => {
  const { user } = useAuth()
  const { shouldShowNotification } = useNotification()
  const {
    chatSocket,
    chatConnectionState,
    isConnected,
    playNotificationSound,
    safeSetState,
  } = useSocketConnection()

  // ─────────────────────────────────────────────────
  // REFS
  // ─────────────────────────────────────────────────

  const joinedRoomsRef = useRef(new Set())
  const chatListenersRef = useRef(new Map())
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => { isMountedRef.current = false }
  }, [])

  // ─────────────────────────────────────────────────
  // STATE
  // ─────────────────────────────────────────────────

  const [roomsState, setRoomsState] = useState([])
  const [activeRoomId, setActiveRoomId] = useState(null)
  const [onlineUsers, setOnlineUsers] = useState(new Set())

  // Refs do unikania stale closures w handlerach socket
  const activeRoomIdRef = useRef(null)
  useEffect(() => {
    activeRoomIdRef.current = activeRoomId
  }, [activeRoomId])

  const shouldShowNotificationRef = useRef(shouldShowNotification)
  useEffect(() => {
    shouldShowNotificationRef.current = shouldShowNotification
  }, [shouldShowNotification])

  const userIdRef = useRef(user?._id)
  useEffect(() => {
    userIdRef.current = user?._id
  }, [user?._id])

  // ─────────────────────────────────────────────────
  // HELPER: listener management
  // ─────────────────────────────────────────────────

  const addChatListener = useCallback(
    (event, handler) => {
      if (!chatSocket) return
      const existingHandler = chatListenersRef.current.get(event)
      if (existingHandler) {
        chatSocket.off(event, existingHandler)
      }
      chatSocket.on(event, handler)
      chatListenersRef.current.set(event, handler)
    },
    [chatSocket]
  )

  // ═════════════════════════════════════════════════
  // EFFECT: Pobierz pokoje i dołącz (BATCH)
  // ═════════════════════════════════════════════════

  useEffect(() => {
    if (!chatSocket || chatConnectionState !== ConnectionState.CONNECTED) return
    if (!user?.userID) return

    let cancelled = false
    let timeoutId = null

    const joinAndSetRooms = (rooms) => {
      if (cancelled) return
      if (rooms.length === 0) {
        safeSetState(() => setRoomsState([]))
        return
      }

      const roomIds = rooms.map((room) => room.roomId)
      chatSocket.emit('joinRoomsBatch', roomIds, (joinResult) => {
        if (joinResult?.success) {
          joinResult.joined.forEach((roomId) =>
            joinedRoomsRef.current.add(roomId)
          )
        }
      })
      safeSetState(() => setRoomsState(rooms))
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
        if (!cancelled) {
          safeSetState(() => setRoomsState([]))
        }
      }
    }

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
      joinAndSetRooms(result.chatRooms || [])
    })

    return () => {
      cancelled = true
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [chatSocket, chatConnectionState, user?.userID, safeSetState])

  // ═════════════════════════════════════════════════
  // EFFECT: Listener dla nowych wiadomości
  // ═════════════════════════════════════════════════

  useEffect(() => {
    if (!chatSocket) return

    const handleNewMessage = (msg) => {
      if (msg.sender?._id === userIdRef.current) return
      if (msg.roomId === activeRoomIdRef.current) return

      safeSetState(() => {
        setRoomsState((prev) =>
          prev.map((room) =>
            room.roomId === msg.roomId
              ? { ...room, unreadCount: (room.unreadCount || 0) + 1 }
              : room
          )
        )
      })

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
  }, [chatSocket, addChatListener, safeSetState, playNotificationSound])

  // ═════════════════════════════════════════════════
  // EFFECT: roomsRestored (reconnect)
  // ═════════════════════════════════════════════════

  useEffect(() => {
    if (!chatSocket) return

    const handleRoomsRestored = (rooms) => {
      rooms.forEach((roomId) => joinedRoomsRef.current.add(roomId))
    }

    addChatListener('roomsRestored', handleRoomsRestored)

    return () => {
      chatSocket.off('roomsRestored', handleRoomsRestored)
      chatListenersRef.current.delete('roomsRestored')
    }
  }, [chatSocket, addChatListener])

  // ═════════════════════════════════════════════════
  // EFFECT: Online users tracking
  // ═════════════════════════════════════════════════

  useEffect(() => {
    if (!chatSocket || chatConnectionState !== ConnectionState.CONNECTED) return

    chatSocket.emit('getOnlineUsers', (result) => {
      if (result.success) {
        safeSetState(() => setOnlineUsers(new Set(result.onlineUsers)))
      }
    })

    const handleUserOnline = ({ userId }) => {
      safeSetState(() => {
        setOnlineUsers((prev) => new Set(prev).add(userId))
      })
    }

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
  // CLEANUP: Wyczyść joined rooms przy odmontowaniu / zmianie socketu
  // ═════════════════════════════════════════════════

  useEffect(() => {
    return () => {
      chatListenersRef.current.forEach((handler, event) => {
        if (chatSocket) chatSocket.off(event, handler)
      })
      chatListenersRef.current.clear()
      joinedRoomsRef.current.clear()
    }
  }, [chatSocket])

  // ═════════════════════════════════════════════════
  // API FUNCTIONS
  // ═════════════════════════════════════════════════

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

  const joinAllRooms = useCallback(
    (roomIds) => {
      return new Promise((resolve, reject) => {
        if (!chatSocket) {
          reject(new Error('Chat socket not connected'))
          return
        }
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

  const leaveRoom = useCallback(
    (roomId) => {
      if (!chatSocket) return
      chatSocket.emit('leaveRoom', roomId)
      joinedRoomsRef.current.delete(roomId)
    },
    [chatSocket]
  )

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

  const sendTyping = useCallback(
    (roomId) => {
      if (chatSocket) chatSocket.emit('typing', roomId)
    },
    [chatSocket]
  )

  const sendStopTyping = useCallback(
    (roomId) => {
      if (chatSocket) chatSocket.emit('stopTyping', roomId)
    },
    [chatSocket]
  )

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

  const isUserOnline = useCallback(
    (userId) => onlineUsers.has(userId),
    [onlineUsers]
  )

  // ═════════════════════════════════════════════════
  // COMPUTED
  // ═════════════════════════════════════════════════

  const totalUnreadMessages = useMemo(() => {
    return roomsState.reduce((sum, room) => sum + (room.unreadCount || 0), 0)
  }, [roomsState])

  // ═════════════════════════════════════════════════
  // CONTEXT VALUE
  // ═════════════════════════════════════════════════

  const contextValue = useMemo(
    () => ({
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

      // Online users
      onlineUsers,
      isUserOnline,

      // Socket ref (dla zaawansowanych use case w chat.jsx)
      chatSocket,
      isConnected,

      // Kompatybilność wsteczna
      socket: chatSocket,
    }),
    [
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
      onlineUsers,
      isUserOnline,
      chatSocket,
      isConnected,
    ]
  )

  return (
    <ChatContext.Provider value={contextValue}>{children}</ChatContext.Provider>
  )
}

export const useChat = () => {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error('useChat must be used within ChatProvider')
  }
  return context
}
