import { createContext, useContext, useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import customFetch from '../assets/utils/customFetch'
import { useAuth } from './AuthContext'

const NotificationContext = createContext()

const defaultPreferences = {
  eventStatusUpdates: true,
  chatMessages: true,
  eventReminders: true,
  newEventInArea: true,
  mutedChatRooms: [],
  mutedEvents: [],
}

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth()
  const [preferences, setPreferences] = useState(null)
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)

  // Pobierz preferencje powiadomień przy starcie
  useEffect(() => {
    const fetchPreferences = async () => {
      // Nie wykonuj zapytania jeśli user nie jest zalogowany
      if (!user || !user.userID) {
        setPreferences(defaultPreferences)
        setLoading(false)
        return
      }

      try {
        const response = await customFetch.get('/notifications/preferences')
        setPreferences(response.data.preferences)

        // Sprawdź AsyncStorage jako backup
        if (!response.data.preferences) {
          const cachedPreferences = await AsyncStorage.getItem(
            'notificationPreferences'
          )
          if (cachedPreferences) {
            setPreferences(JSON.parse(cachedPreferences))
          }
        }
      } catch (error) {
        console.error('Błąd pobierania preferencji powiadomień:', error)

        // Użyj cached lub domyślnych ustawień
        try {
          const cachedPreferences = await AsyncStorage.getItem(
            'notificationPreferences'
          )
          if (cachedPreferences) {
            setPreferences(JSON.parse(cachedPreferences))
          } else {
            setPreferences(defaultPreferences)
          }
        } catch {
          setPreferences(defaultPreferences)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchPreferences()
  }, [user?.userID])

  // Pobierz nieprzeczytane powiadomienia
  useEffect(() => {
    const fetchUnreadCount = async () => {
      // Nie wykonuj zapytania jeśli user nie jest zalogowany
      if (!user || !user.userID) {
        setUnreadCount(0)
        return
      }

      try {
        const response = await customFetch.get('/notifications/unread')
        setUnreadCount(response.data.unreadNotifications.length)
      } catch (error) {
        console.error('Błąd pobierania nieprzeczytanych powiadomień:', error)
        setUnreadCount(0)
      }
    }

    if (!loading && preferences) {
      fetchUnreadCount()
    }
  }, [loading, preferences, user?.userID])

  // Cache preferencje w AsyncStorage
  useEffect(() => {
    const cachePreferences = async () => {
      if (preferences) {
        try {
          await AsyncStorage.setItem(
            'notificationPreferences',
            JSON.stringify(preferences)
          )
        } catch (error) {
          console.error('Błąd cachowania preferencji:', error)
        }
      }
    }

    cachePreferences()
  }, [preferences])

  // Funkcja sprawdzająca czy pokazać powiadomienie
  const shouldShowNotification = (type, chatRoomID = null, eventId = null) => {
    if (!preferences) return false

    // Sprawdź globalne ustawienia dla typu powiadomienia
    if (!preferences[type]) return false

    // Sprawdź wyciszone chat rooms
    if (
      type === 'chatMessages' &&
      chatRoomID &&
      preferences.mutedChatRooms &&
      preferences.mutedChatRooms.some((room) => {
        const isMuted = room.chatRoomId === chatRoomID
        const isExpired =
          room.muteExpiresAt && new Date() > new Date(room.muteExpiresAt)
        return isMuted && !isExpired
      })
    ) {
      return false
    }

    // Sprawdź wyciszone eventy
    if (
      eventId &&
      preferences.mutedEvents &&
      preferences.mutedEvents.some((event) => event.eventId === eventId)
    ) {
      return false
    }

    return true
  }

  // Aktualizuj preferencje
  const updatePreferences = async (newPreferences) => {
    try {
      const response = await customFetch.put(
        '/notifications/preferences',
        newPreferences
      )
      setPreferences(response.data.preferences)
      return { success: true, data: response.data }
    } catch (error) {
      console.error('Błąd aktualizacji preferencji:', error)
      return { success: false, error: error.message }
    }
  }

  // Wycisz chat
  const muteChatRoom = async (chatRoomId, muteExpiresAt = null) => {
    try {
      const response = await customFetch.post(
        `/notifications/mute-chat/${chatRoomId}`,
        {
          muteExpiresAt,
        }
      )
      setPreferences(response.data.preferences)
      return { success: true }
    } catch (error) {
      console.error('Błąd wyciszania chatu:', error)
      return { success: false, error: error.message }
    }
  }

  // Odcisz chat
  const unmuteChatRoom = async (chatRoomId) => {
    try {
      const response = await customFetch.delete(
        `/notifications/mute-chat/${chatRoomId}`
      )
      setPreferences(response.data.preferences)
      return { success: true }
    } catch (error) {
      console.error('Błąd odciszania chatu:', error)
      return { success: false, error: error.message }
    }
  }

  // Wycisz event
  const muteEvent = async (eventId) => {
    try {
      const response = await customFetch.post(
        `/notifications/mute-event/${eventId}`
      )
      setPreferences(response.data.preferences)
      return { success: true }
    } catch (error) {
      console.error('Błąd wyciszania wydarzenia:', error)
      return { success: false, error: error.message }
    }
  }

  // Odcisz event
  const unmuteEvent = async (eventId) => {
    try {
      const response = await customFetch.delete(
        `/notifications/mute-event/${eventId}`
      )
      setPreferences(response.data.preferences)
      return { success: true }
    } catch (error) {
      console.error('Błąd odciszania wydarzenia:', error)
      return { success: false, error: error.message }
    }
  }

  // Oznacz powiadomienie jako przeczytane
  const markAsRead = async (eventId) => {
    try {
      await customFetch.patch(`/notifications/mark-read/${eventId}`)
      setUnreadCount((prev) => Math.max(0, prev - 1))
      return { success: true }
    } catch (error) {
      console.error('Błąd oznaczania jako przeczytane:', error)
      return { success: false, error: error.message }
    }
  }

  return (
    <NotificationContext.Provider
      value={{
        preferences,
        setPreferences,
        loading,
        unreadCount,
        setUnreadCount,
        shouldShowNotification,
        updatePreferences,
        muteChatRoom,
        unmuteChatRoom,
        muteEvent,
        unmuteEvent,
        markAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

// Hook ułatwiający korzystanie z contextu
export const useNotification = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider')
  }
  return context
}
