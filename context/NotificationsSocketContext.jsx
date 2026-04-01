/**
 * =====================================================
 * NOTIFICATIONS SOCKET CONTEXT
 * =====================================================
 *
 * Zarządza powiadomieniami socketowymi: statusy eventów, zaproszenia do znajomych,
 * nieprzeczytane powiadomienia.
 * Konsumuje SocketConnectionContext dla surowych socketów.
 *
 * Re-render konsumentów następuje TYLKO gdy zmieni się:
 * - unreadEventsCount / unreadEventsList
 * - unreadFriendRequestsCount
 * - lastStatusUpdate
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

const NotificationsSocketContext = createContext()

export const NotificationsSocketProvider = ({ children }) => {
  const { user } = useAuth()
  const { shouldShowNotification } = useNotification()
  const {
    notificationSocket,
    notificationConnectionState,
    playNotificationSound,
    safeSetState,
  } = useSocketConnection()

  // ─────────────────────────────────────────────────
  // REFS
  // ─────────────────────────────────────────────────

  const notificationListenersRef = useRef(new Map())
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => { isMountedRef.current = false }
  }, [])

  const shouldShowNotificationRef = useRef(shouldShowNotification)
  useEffect(() => {
    shouldShowNotificationRef.current = shouldShowNotification
  }, [shouldShowNotification])

  // ─────────────────────────────────────────────────
  // STATE
  // ─────────────────────────────────────────────────

  const [unreadEventsCount, setUnreadEventsCount] = useState(0)
  const [unreadEventsList, setUnreadEventsList] = useState([])
  const [unreadFriendRequestsCount, setUnreadFriendRequestsCount] = useState(0)
  const [lastStatusUpdate, setLastStatusUpdate] = useState(null)

  // ─────────────────────────────────────────────────
  // HELPER: listener management
  // ─────────────────────────────────────────────────

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
      if (
        notificationSocket &&
        notificationConnectionState === ConnectionState.CONNECTED
      ) {
        notificationSocket.emit('getUnreadNotifications', (result) => {
          if (result.success) {
            safeSetState(() => {
              setUnreadEventsCount(result.count)
              setUnreadEventsList(result.unreadNotifications)
            })
          } else {
            console.error('[Notifications] WebSocket fetch failed:', result.error)
            fetchUnreadEventsHTTP()
          }
        })
      } else {
        fetchUnreadEventsHTTP()
      }
    }

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
  }, [user?.userID, notificationSocket, notificationConnectionState, safeSetState])

  // ═════════════════════════════════════════════════
  // EFFECT: Listener dla statusu eventów
  // ═════════════════════════════════════════════════

  useEffect(() => {
    if (!notificationSocket) return

    const handleStatusUpdate = (data) => {
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

    const handleFriendRequest = () => {
      const shouldNotify = shouldShowNotificationRef.current('chatMessages')
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
  // CLEANUP
  // ═════════════════════════════════════════════════

  useEffect(() => {
    return () => {
      notificationListenersRef.current.forEach((handler, event) => {
        if (notificationSocket) notificationSocket.off(event, handler)
      })
      notificationListenersRef.current.clear()
    }
  }, [notificationSocket])

  // ═════════════════════════════════════════════════
  // API FUNCTIONS
  // ═════════════════════════════════════════════════

  const markEventAsRead = useCallback(
    (eventId) => {
      return new Promise((resolve, reject) => {
        safeSetState(() => {
          setUnreadEventsList((prev) => {
            const filtered = prev.filter(
              (event) => event.eventID._id !== eventId
            )
            setUnreadEventsCount(filtered.length)
            return filtered
          })
        })

        if (
          notificationSocket &&
          notificationConnectionState === ConnectionState.CONNECTED
        ) {
          notificationSocket.emit('markAsRead', { eventId }, (result) => {
            if (result.success) {
              resolve(result)
            } else {
              console.error('[Notifications] WebSocket markAsRead failed:', result.error)
              reject(new Error(result.error))
            }
          })
        } else {
          customFetch
            .patch(`/status/events/${eventId}/mark-read`)
            .then(() => resolve({ success: true }))
            .catch((error) => {
              console.error('[Notifications] HTTP markAsRead error:', error)
              reject(error)
            })
        }
      })
    },
    [notificationSocket, notificationConnectionState, safeSetState]
  )

  const markAllEventsAsRead = useCallback(
    (eventIds = null) => {
      return new Promise((resolve, reject) => {
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
          console.warn('[Notifications] No WebSocket, batch marking not available')
          resolve({ success: true, markedCount: 0 })
        }
      })
    },
    [notificationSocket, notificationConnectionState, safeSetState]
  )

  const resetUnreadEvents = useCallback(() => {
    safeSetState(() => {
      setUnreadEventsCount(0)
      setUnreadEventsList([])
    })
  }, [safeSetState])

  const resetFriendRequestCount = useCallback(() => {
    safeSetState(() => {
      setUnreadFriendRequestsCount(0)
    })
  }, [safeSetState])

  const hasUnreadNotifications = useCallback(
    (eventId) => {
      return unreadEventsList.some((event) => event.eventID._id === eventId)
    },
    [unreadEventsList]
  )

  const subscribeToEvent = useCallback(
    (eventId) => {
      if (notificationSocket) {
        notificationSocket.emit('subscribeToEvent', eventId)
      }
    },
    [notificationSocket]
  )

  const unsubscribeFromEvent = useCallback(
    (eventId) => {
      if (notificationSocket) {
        notificationSocket.emit('unsubscribeFromEvent', eventId)
      }
    },
    [notificationSocket]
  )

  // ═════════════════════════════════════════════════
  // COMPUTED
  // ═════════════════════════════════════════════════

  const totalNotificationsCount = useMemo(() => {
    return unreadEventsCount + unreadFriendRequestsCount
  }, [unreadEventsCount, unreadFriendRequestsCount])

  // ═════════════════════════════════════════════════
  // CONTEXT VALUE
  // ═════════════════════════════════════════════════

  const contextValue = useMemo(
    () => ({
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
    }),
    [
      unreadEventsCount,
      unreadEventsList,
      markEventAsRead,
      markAllEventsAsRead,
      resetUnreadEvents,
      hasUnreadNotifications,
      lastStatusUpdate,
      unreadFriendRequestsCount,
      resetFriendRequestCount,
      totalNotificationsCount,
      subscribeToEvent,
      unsubscribeFromEvent,
    ]
  )

  return (
    <NotificationsSocketContext.Provider value={contextValue}>
      {children}
    </NotificationsSocketContext.Provider>
  )
}

export const useNotificationsSocket = () => {
  const context = useContext(NotificationsSocketContext)
  if (!context) {
    throw new Error(
      'useNotificationsSocket must be used within NotificationsSocketProvider'
    )
  }
  return context
}
