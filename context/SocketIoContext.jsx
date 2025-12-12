import {
  createContext,
  useContext,
  useRef,
  useEffect,
  useCallback,
  useState,
} from 'react'
import { useAudioPlayer } from 'expo-audio'
import Constants from 'expo-constants'
import io from 'socket.io-client'
import { useAuth } from './AuthContext'
import { useNotification } from './NotificationContext'
import customFetch from '../assets/utils/customFetch'

const SocketIoContext = createContext()

export const SocketIoProvider = ({ children }) => {
  const joinedRoomsRef = useRef(new Set())
  const { user, isAuthChecked } = useAuth()
  const { shouldShowNotification } = useNotification()
  const [socket, setSocket] = useState(null)

  // Nowe API expo-audio - hook do odtwarzania dźwięku
  const notificationPlayer = useAudioPlayer(
    require('../assets/sounds/notification-alert-269289.mp3')
  )

  // State: pokoje i nieprzeczytane wiadomości
  // roomsState: [{ roomId, unreadCount, ...roomData }]
  const [roomsState, setRoomsState] = useState([])
  // State: aktualnie wybrany pokój
  const [activeRoomId, setActiveRoomId] = useState(null)
  // State: nieprzeczytane powiadomienia o eventach
  const [unreadEventsCount, setUnreadEventsCount] = useState(0)
  const [unreadEventsList, setUnreadEventsList] = useState([])

  // Pobierz URL socketa z konfiguracji
  const getSocketUrl = () => {
    return (
      Constants.expoConfig?.extra?.socketUrl ||
      process.env.EXPO_PUBLIC_SOCKET_URL ||
      'http://localhost:3000'
    )
  }

  // Funkcja do odtwarzania dźwięku powiadomienia (nowe API expo-audio)
  const playNotificationSound = () => {
    try {
      if (notificationPlayer) {
        notificationPlayer.seekTo(0)
        notificationPlayer.play()
      }
    } catch (error) {
      console.error('Błąd odtwarzania dźwięku:', error)
    }
  }

  // Inicjalizacja socketa gdy user się zaloguje
  useEffect(() => {
    // Skopiuj ref na początku efektu dla cleanup
    const joinedRooms = joinedRoomsRef.current

    if (isAuthChecked && user.userID) {
      // Utwórz socket tylko jeśli użytkownik jest zalogowany
      const newSocket = io(getSocketUrl(), {
        // W React Native nie używamy withCredentials, używamy tokena
        transports: ['websocket'],
        autoConnect: true,
      })

      setSocket(newSocket)

      // Cleanup: rozłącz socket przy wylogowaniu
      return () => {
        newSocket.disconnect()
        setSocket(null)
        joinedRooms.clear()
      }
    } else {
      // Jeśli user został wylogowany, rozłącz socket
      setSocket((prevSocket) => {
        if (prevSocket) {
          prevSocket.disconnect()
          joinedRooms.clear()
        }
        return null
      })
    }
  }, [isAuthChecked])

  const joinRoom = useCallback(
    (roomId) => {
      if (socket && !joinedRoomsRef.current.has(roomId)) {
        socket.emit('joinRoom', roomId)
        joinedRoomsRef.current.add(roomId)
      }
    },
    [socket]
  )

  const joinAllRooms = useCallback(
    (roomIds) => {
      roomIds.forEach((roomId) => joinRoom(roomId))
    },
    [joinRoom]
  )

  const leaveRoom = (roomId) => {
    if (socket) {
      socket.emit('leaveRoom', roomId)
      joinedRoomsRef.current.delete(roomId)
    }
  }

  const sendMessage = (roomId, message, senderId) => {
    if (socket) {
      socket.emit('sendMessage', { roomId, message, senderId })
    }
  }

  // Dołącz do pokoi użytkownika po zalogowaniu
  useEffect(() => {
    const fetchAndJoinRooms = async () => {
      // Nie wykonuj zapytania jeśli user nie jest zalogowany
      if (!isAuthChecked || !user?.userID) {
        setRoomsState([])
        return
      }

      try {
        const response = await customFetch.get('/chat/rooms')
        const rooms = (response.data.chatRooms || []).map((r) =>
          JSON.parse(JSON.stringify(r))
        )
        joinAllRooms(rooms.map((room) => room.roomId))

        // Pobierz nieprzeczytane wiadomości dla każdego pokoju
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
        const roomsWithUnread = await Promise.all(unreadPromises)
        setRoomsState(roomsWithUnread)
      } catch (error) {
        console.error('Błąd pobierania pokoi do joinAllRooms:', error)
        setRoomsState([])
      }
    }
    fetchAndJoinRooms()
  }, [isAuthChecked, joinAllRooms])

  // Pobierz nieprzeczytane powiadomienia o eventach
  useEffect(() => {
    const fetchUnreadEvents = async () => {
      // Nie wykonuj zapytania jeśli user nie jest zalogowany
      if (!isAuthChecked || !user?.userID) {
        setUnreadEventsCount(0)
        setUnreadEventsList([])
        return
      }

      try {
        const response = await customFetch.get('/notifications/unread')
        const unreadEvents = response.data.unreadNotifications || []
        setUnreadEventsCount(unreadEvents.length)
        setUnreadEventsList(unreadEvents)
      } catch (error) {
        console.error('Błąd pobierania nieprzeczytanych eventów:', error)
        setUnreadEventsCount(0)
        setUnreadEventsList([])
      }
    }

    fetchUnreadEvents()
  }, [isAuthChecked])

  // Aktualizuj roomsState po otrzymaniu nowej wiadomości
  useEffect(() => {
    if (!socket) return

    const handleNewMessage = async (msg) => {
      // Nie inkrementuj jeśli to moja wiadomość lub jestem w tym pokoju
      if (msg.sender?._id === user?._id || msg.roomId === activeRoomId) return

      // Sprawdź czy pokazać powiadomienie (dźwięk + unread count)
      const shouldNotify = shouldShowNotification('chatMessages', msg.roomId)

      if (shouldNotify) {
        // Odtwórz dźwięk powiadomienia
        await playNotificationSound()

        // Zwiększ licznik nieprzeczytanych tylko jeśli powiadomienia są włączone
        setRoomsState((prev) =>
          prev.map((room) =>
            room.roomId === msg.roomId
              ? { ...room, unreadCount: (room.unreadCount || 0) + 1 }
              : room
          )
        )
      }
    }
    socket.on('newMessage', handleNewMessage)
    return () => {
      socket.off('newMessage', handleNewMessage)
    }
  }, [socket, user, activeRoomId, shouldShowNotification])

  // Nasłuchuj powiadomień o zmianie statusu wydarzeń
  useEffect(() => {
    if (!socket) return

    const handleStatusUpdate = async (data) => {
      // Sprawdź czy powiadomienie jest dla aktualnego użytkownika
      if (data.userId !== user?._id) return

      // Sprawdź czy pokazać powiadomienie
      const shouldNotify = shouldShowNotification(
        'eventStatusUpdates',
        null,
        data.eventId
      )

      if (shouldNotify) {
        // Odtwórz dźwięk powiadomienia
        await playNotificationSound()

        // Zaktualizuj listę nieprzeczytanych eventów
        setUnreadEventsList((prev) => {
          // Sprawdź czy event już istnieje na liście
          const existingIndex = prev.findIndex(
            (event) => event.eventID._id === data.eventId
          )

          if (existingIndex !== -1) {
            // Event już jest na liście, zaktualizuj jego status (bez zmiany licznika)
            const updated = [...prev]
            updated[existingIndex] = {
              ...updated[existingIndex],
              status: data.newStatus,
            }
            return updated
          } else {
            // Event nie istnieje, dodaj go
            const newList = [
              ...prev,
              {
                eventID: { _id: data.eventId, eventName: data.eventName },
                status: data.newStatus,
                readBy: false,
              },
            ]
            // Zwiększ licznik dla nowego eventu
            setUnreadEventsCount(newList.length)
            return newList
          }
        })
      }
    }

    socket.on('statusUpdate', handleStatusUpdate)
    return () => {
      socket.off('statusUpdate', handleStatusUpdate)
    }
  }, [socket, user, shouldShowNotification])

  // Funkcja do resetowania unreadCount dla pokoju
  const setRoomAsRead = (roomId) => {
    setRoomsState((prev) =>
      prev.map((room) =>
        room.roomId === roomId ? { ...room, unreadCount: 0 } : room
      )
    )
  }

  // Funkcja do oznaczania eventów jako przeczytane
  const markEventAsRead = async (eventId) => {
    try {
      await customFetch.patch(`/status/events/${eventId}/mark-read`)
      // Usuń event z listy nieprzeczytanych
      setUnreadEventsList((prev) => {
        const filtered = prev.filter((event) => event.eventID._id !== eventId)
        // Ustaw licznik na podstawie długości listy
        setUnreadEventsCount(filtered.length)
        return filtered
      })
    } catch (error) {
      console.error('Błąd oznaczania eventu jako przeczytany:', error)
    }
  }

  // Funkcja do resetowania wszystkich nieprzeczytanych eventów
  const resetUnreadEvents = () => {
    setUnreadEventsCount(0)
    setUnreadEventsList([])
  }

  // Funkcja do sprawdzania czy event ma nieprzeczytane powiadomienia
  const hasUnreadNotifications = (eventId) => {
    return unreadEventsList.some((event) => event.eventID._id === eventId)
  }

  return (
    <SocketIoContext.Provider
      value={{
        socket,
        joinRoom,
        joinAllRooms,
        leaveRoom,
        sendMessage,
        roomsState,
        setRoomsState,
        setRoomAsRead,
        activeRoomId,
        setActiveRoomId,
        unreadEventsCount,
        setUnreadEventsCount,
        unreadEventsList,
        setUnreadEventsList,
        markEventAsRead,
        resetUnreadEvents,
        hasUnreadNotifications,
      }}
    >
      {children}
    </SocketIoContext.Provider>
  )
}

export const useSocketIo = () => {
  const context = useContext(SocketIoContext)
  if (!context) {
    throw new Error('useSocketIo must be used within SocketIoProvider')
  }
  return context
}
