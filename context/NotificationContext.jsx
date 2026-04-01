import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'
import { Platform, AppState } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import Constants from 'expo-constants'
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


///////////////////////////////////////////////////////////////////////////
//// PUSH NOTIFICATIONS + Preferencje, Context wrapper                 ////
////                                                                   ////
//// ARCHITEKTURA (Messenger/WhatsApp-like):                           ////
//// 1. Rejestracja push tokenu przy logowaniu                         ////
//// 2. Foreground handler - in-app notification (dźwięk z SocketCtx)  ////
//// 3. Background handler - system push notification                  ////
//// 4. Tap handler - nawigacja do odpowiedniego ekranu                ////
//// 5. Preferencje - globalne + per chat/event mute                   ////
//// 6. Token refresh przy każdym starcie aplikacji                    ////
///////////////////////////////////////////////////////////////////////////

// ─────────────────────────────────────────────────
// KONFIGURACJA KANAŁÓW (Android)
// ─────────────────────────────────────────────────

/**
 * Foreground notification handler
 * Gdy aplikacja jest na pierwszym planie, push jest odbierany ale NIE wyświetlany
 * jako system notification (bo mamy in-app notification przez Socket.IO).
 * Wyjątek: jeśli chcemy wyświetlić np. banner - ustawiamy shouldShowAlert.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false, // In-app obsługuje SocketIoContext
    shouldPlaySound: false, // Dźwięk obsługuje SocketIoContext (expo-audio)
    shouldSetBadge: true,   // Badge zawsze aktualizuj
  }),
})

/**
 * Rejestracja kanałów Android
 * Musi być wywołane przed wysyłaniem powiadomień
 */
const setupNotificationChannels = async () => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('chat-messages', {
      name: 'Wiadomości czatu',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default',
    })
    await Notifications.setNotificationChannelAsync('event-updates', {
      name: 'Aktualizacje wydarzeń',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    })
    await Notifications.setNotificationChannelAsync('friend-requests', {
      name: 'Zaproszenia do znajomych',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
    })
    await Notifications.setNotificationChannelAsync('event-reminders', {
      name: 'Przypomnienia o wydarzeniach',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    })
  }
}

/**
 * Pobierz Expo Push Token
 * Wymaga fizycznego urządzenia (nie działa na emulatorze iOS)
 */
const getExpoPushToken = async () => {
  if (!Device.isDevice) {
    console.warn('[Push] Push notifications nie działają na emulatorze')
    return null
  }

  // Sprawdź/poproś o uprawnienia
  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  if (finalStatus !== 'granted') {
    console.warn('[Push] Brak uprawnień na powiadomienia push')
    return null
  }

  // Pobierz token
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ||
    Constants.easConfig?.projectId

  if (!projectId) {
    console.error('[Push] Brak projectId dla Expo Push Token')
    return null
  }

  const tokenData = await Notifications.getExpoPushTokenAsync({ projectId })
  return tokenData.data
}

/**
 * Pobierz unikalny identyfikator urządzenia
 * Używany do mapowania token → device na serwerze
 */
const getDeviceId = () => {
  // Device.modelId + osBuildId daje stabilny fingerprint
  return `${Device.modelName || 'unknown'}_${Device.osInternalBuildId || Device.osBuildId || 'unknown'}_${Platform.OS}`
}


export const NotificationProvider = ({ children }) => {
  const { user, isAuthChecked } = useAuth()
  const [preferences, setPreferences] = useState(null)
  const [loading, setLoading] = useState(true)

  // Push notification state
  const [expoPushToken, setExpoPushToken] = useState(null)
  const [pushPermissionStatus, setPushPermissionStatus] = useState(null)

  // Refs
  const notificationResponseListener = useRef()
  const appStateRef = useRef(AppState.currentState)

  // ─────────────────────────────────────────────────
  // EFFECT: Setup notification channels (Android)
  // ─────────────────────────────────────────────────
  useEffect(() => {
    setupNotificationChannels()
  }, [])

  // ─────────────────────────────────────────────────
  // EFFECT: Rejestracja push tokenu przy logowaniu
  // ─────────────────────────────────────────────────
  useEffect(() => {
    const registerPushToken = async () => {
      if (!isAuthChecked || !user?.userID) return

      try {
        const token = await getExpoPushToken()
        if (!token) return

        setExpoPushToken(token)

        // Wyślij token na serwer
        const deviceId = getDeviceId()
        await customFetch.post('/notifications/push-token', {
          token,
          deviceId,
          platform: Platform.OS,
        })

        console.log('[Push] Token zarejestrowany:', token.substring(0, 30) + '...')
      } catch (error) {
        console.error('[Push] Błąd rejestracji tokenu:', error)
      }
    }

    registerPushToken()
  }, [isAuthChecked, user?.userID])

  // ─────────────────────────────────────────────────
  // EFFECT: Sprawdź status uprawnień
  // ─────────────────────────────────────────────────
  useEffect(() => {
    const checkPermissions = async () => {
      const { status } = await Notifications.getPermissionsAsync()
      setPushPermissionStatus(status)
    }
    checkPermissions()

    // Sprawdź ponownie gdy app wraca z background (user mógł zmienić w ustawieniach)
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        checkPermissions()
      }
      appStateRef.current = nextAppState
    })

    return () => subscription.remove()
  }, [])

  // ─────────────────────────────────────────────────
  // EFFECT: Listener na tap w powiadomienie
  // Nawigacja do odpowiedniego ekranu
  // ─────────────────────────────────────────────────
  useEffect(() => {
    // Handler dla tapu w powiadomienie (app w tle lub zamknięta)
    notificationResponseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data

        // Nawigacja w zależności od typu powiadomienia
        // Router jest dostępny globalnie przez expo-router
        try {
          const { router: navRouter } = require('expo-router')
          if (data?.screen === 'chat' && data?.roomId) {
            navRouter.push(`/(auth)/chat/${data.roomId}`)
          } else if (data?.screen === 'notifications') {
            navRouter.push('/(auth)/notifications')
          } else if (data?.screen === 'friends') {
            navRouter.push('/(auth)/friends')
          }
        } catch (error) {
          console.error('[Push] Błąd nawigacji:', error)
        }
      })

    return () => {
      if (notificationResponseListener.current) {
        Notifications.removeNotificationSubscription(
          notificationResponseListener.current
        )
      }
    }
  }, [])

  // ─────────────────────────────────────────────────
  // Pobierz preferencje powiadomień przy starcie
  // ─────────────────────────────────────────────────
  useEffect(() => {
    const fetchPreferences = async () => {
      // Nie wykonuj zapytania jeśli user nie jest zalogowany
      if (!isAuthChecked || !user?.userID) {
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
  }, [isAuthChecked])


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

  // ─────────────────────────────────────────────────
  // Funkcja sprawdzająca czy pokazać powiadomienie
  // ─────────────────────────────────────────────────
  const shouldShowNotification = useCallback((type, chatRoomID = null, eventId = null) => {
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
  }, [preferences])

  // ─────────────────────────────────────────────────
  // Aktualizuj preferencje
  // ─────────────────────────────────────────────────
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

  // ─────────────────────────────────────────────────
  // Push-specific helpers
  // ─────────────────────────────────────────────────

  /**
   * Poproś o uprawnienia push (do wywołania z UI np. w ustawieniach)
   */
  const requestPushPermission = useCallback(async () => {
    const { status } = await Notifications.requestPermissionsAsync()
    setPushPermissionStatus(status)
    if (status === 'granted') {
      // Zarejestruj token po uzyskaniu uprawnień
      const token = await getExpoPushToken()
      if (token) {
        setExpoPushToken(token)
        const deviceId = getDeviceId()
        await customFetch.post('/notifications/push-token', {
          token,
          deviceId,
          platform: Platform.OS,
        })
      }
    }
    return status
  }, [])

  /**
   * Wyrejestruj push token (przy wylogowaniu)
   */
  const unregisterPushToken = useCallback(async () => {
    try {
      const deviceId = getDeviceId()
      await customFetch.delete('/notifications/push-token', {
        data: { deviceId },
      })
      setExpoPushToken(null)
    } catch (error) {
      console.error('[Push] Błąd wyrejestrowywania tokenu:', error)
    }
  }, [])

  /**
   * Ustaw badge count (np. łączna liczba nieprzeczytanych)
   */
  const setBadgeCount = useCallback(async (count) => {
    try {
      await Notifications.setBadgeCountAsync(count)
    } catch (error) {
      // Niektóre urządzenia nie obsługują badge
    }
  }, [])

 
  return (
    <NotificationContext.Provider
      value={{
        // Preferencje (istniejące API)
        preferences,
        setPreferences,
        loading,
        shouldShowNotification,
        updatePreferences,
        muteChatRoom,
        unmuteChatRoom,
        muteEvent,
        unmuteEvent,
        // Push notification (nowe API)
        expoPushToken,
        pushPermissionStatus,
        requestPushPermission,
        unregisterPushToken,
        setBadgeCount,
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
