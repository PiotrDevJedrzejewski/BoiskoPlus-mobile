/**
 * =====================================================
 * SOCKET ZUSTAND STORE
 * =====================================================
 *
 * Cały stan socketów w jednym zustand store.
 * Konsumenci subskrybują TYLKO potrzebne wartości przez selektory,
 * więc zmiana np. roomsState nie rerenderuje komponentu
 * który czyta tylko lastStatusUpdate.
 *
 * Akcje (joinRoom, sendMessage itp.) używają get() do odczytu
 * aktualnej instancji socketa — konsument nie musi subskrybować
 * chatSocket żeby wywołać akcję.
 */

import { create } from 'zustand'
import customFetch from '../assets/utils/customFetch'

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
// INTERNAL (not reactive, not for consumers)
// =====================================================

const joinedRooms = new Set()
const chatListeners = new Map()
const notificationListeners = new Map()

// =====================================================
// STORE
// =====================================================

export const useSocketStore = create((set, get) => ({
  // ── Sockets ──
  chatSocket: null,
  notificationSocket: null,

  // ── Connection state ──
  chatConnectionState: ConnectionState.DISCONNECTED,
  notificationConnectionState: ConnectionState.DISCONNECTED,

  // ── Chat rooms ──
  roomsState: [],
  activeRoomId: null,

  // ── Notifications ──
  unreadEventsCount: 0,
  unreadEventsList: [],
  unreadFriendRequestsCount: 0,
  lastStatusUpdate: null,
  unreadInvitesList: [],
  unreadInvitesCount: 0,

  // ── Online users ──
  onlineUsers: new Set(),

  // ═════════════════════════════════════════════════
  // SETTERS (support functional updaters like useState)
  // ═════════════════════════════════════════════════

  setChatSocket: (v) => set({ chatSocket: v }),
  setNotificationSocket: (v) => set({ notificationSocket: v }),
  setChatConnectionState: (v) => set({ chatConnectionState: v }),
  setNotificationConnectionState: (v) => set({ notificationConnectionState: v }),

  setRoomsState: (valOrFn) =>
    set((s) => ({
      roomsState: typeof valOrFn === 'function' ? valOrFn(s.roomsState) : valOrFn,
    })),

  setActiveRoomId: (v) => set({ activeRoomId: v }),

  setUnreadEventsCount: (valOrFn) =>
    set((s) => ({
      unreadEventsCount:
        typeof valOrFn === 'function' ? valOrFn(s.unreadEventsCount) : valOrFn,
    })),

  setUnreadEventsList: (valOrFn) =>
    set((s) => ({
      unreadEventsList:
        typeof valOrFn === 'function' ? valOrFn(s.unreadEventsList) : valOrFn,
    })),

  setUnreadFriendRequestsCount: (valOrFn) =>
    set((s) => ({
      unreadFriendRequestsCount:
        typeof valOrFn === 'function'
          ? valOrFn(s.unreadFriendRequestsCount)
          : valOrFn,
    })),

  setLastStatusUpdate: (v) => set({ lastStatusUpdate: v }),

  setUnreadInvitesList: (valOrFn) =>
    set((s) => ({
      unreadInvitesList:
        typeof valOrFn === 'function' ? valOrFn(s.unreadInvitesList) : valOrFn,
    })),

  setUnreadInvitesCount: (valOrFn) =>
    set((s) => ({
      unreadInvitesCount:
        typeof valOrFn === 'function' ? valOrFn(s.unreadInvitesCount) : valOrFn,
    })),

  setOnlineUsers: (valOrFn) =>
    set((s) => ({
      onlineUsers:
        typeof valOrFn === 'function' ? valOrFn(s.onlineUsers) : valOrFn,
    })),

  // ═════════════════════════════════════════════════
  // INTERNAL HELPERS (accessed via get() in manager)
  // ═════════════════════════════════════════════════

  /** Add a chat socket listener with auto-cleanup of previous handler */
  _addChatListener: (event, handler) => {
    const { chatSocket } = get()
    if (!chatSocket) return
    const existing = chatListeners.get(event)
    if (existing) chatSocket.off(event, existing)
    chatSocket.on(event, handler)
    chatListeners.set(event, handler)
  },

  /** Add a notification socket listener with auto-cleanup */
  _addNotificationListener: (event, handler) => {
    const { notificationSocket } = get()
    if (!notificationSocket) return
    const existing = notificationListeners.get(event)
    if (existing) notificationSocket.off(event, existing)
    notificationSocket.on(event, handler)
    notificationListeners.set(event, handler)
  },

  // ═════════════════════════════════════════════════
  // CHAT API ACTIONS
  // ═════════════════════════════════════════════════

  joinRoom: (roomId) =>
    new Promise((resolve, reject) => {
      const { chatSocket } = get()
      if (!chatSocket) return reject(new Error('Chat socket not connected'))
      if (joinedRooms.has(roomId))
        return resolve({ success: true, alreadyJoined: true })

      chatSocket.emit('joinRoom', roomId, (result) => {
        if (result.success) {
          joinedRooms.add(roomId)
          resolve(result)
        } else {
          reject(new Error(result.error))
        }
      })
    }),

  joinAllRooms: (roomIds) =>
    new Promise((resolve, reject) => {
      const { chatSocket } = get()
      if (!chatSocket) return reject(new Error('Chat socket not connected'))

      const newRoomIds = roomIds.filter((id) => !joinedRooms.has(id))
      if (newRoomIds.length === 0)
        return resolve({ success: true, joined: [], failed: [] })

      chatSocket.emit('joinRoomsBatch', newRoomIds, (result) => {
        if (result.success) {
          result.joined.forEach((roomId) => joinedRooms.add(roomId))
        }
        resolve(result)
      })
    }),

  leaveRoom: (roomId) => {
    const { chatSocket } = get()
    if (!chatSocket) return
    chatSocket.emit('leaveRoom', roomId)
    joinedRooms.delete(roomId)
  },

  sendMessage: (roomId, message) =>
    new Promise((resolve, reject) => {
      const { chatSocket } = get()
      if (!chatSocket) return reject(new Error('Chat socket not connected'))

      chatSocket.emit('sendMessage', { roomId, message }, (result) => {
        if (result.success) resolve(result.message)
        else reject(new Error(result.error))
      })
    }),

  sendTyping: (roomId) => {
    const { chatSocket } = get()
    if (chatSocket) chatSocket.emit('typing', roomId)
  },

  sendStopTyping: (roomId) => {
    const { chatSocket } = get()
    if (chatSocket) chatSocket.emit('stopTyping', roomId)
  },

  setRoomAsRead: (roomId) => {
    set((s) => ({
      roomsState: s.roomsState.map((room) =>
        room.roomId === roomId ? { ...room, unreadCount: 0 } : room
      ),
    }))
  },

  // ═════════════════════════════════════════════════
  // NOTIFICATION API ACTIONS
  // ═════════════════════════════════════════════════

  markEventAsRead: (eventId) =>
    new Promise((resolve, reject) => {
      // Optimistic update
      set((s) => {
        const filtered = s.unreadEventsList.filter(
          (event) => event.eventID._id !== eventId
        )
        return {
          unreadEventsList: filtered,
          unreadEventsCount: filtered.length,
        }
      })

      const { notificationSocket, notificationConnectionState } = get()

      if (
        notificationSocket &&
        notificationConnectionState === ConnectionState.CONNECTED
      ) {
        notificationSocket.emit('markAsRead', { eventId }, (result) => {
          if (result.success) resolve(result)
          else reject(new Error(result.error))
        })
      } else {
        customFetch
          .patch(`/status/events/${eventId}/mark-read`)
          .then(() => resolve({ success: true }))
          .catch((error) => reject(error))
      }
    }),

  markAllEventsAsRead: (eventIds = null) =>
    new Promise((resolve, reject) => {
      // Optimistic update
      set((s) => {
        if (eventIds && eventIds.length > 0) {
          const filtered = s.unreadEventsList.filter(
            (event) => !eventIds.includes(event.eventID._id)
          )
          return {
            unreadEventsList: filtered,
            unreadEventsCount: filtered.length,
          }
        }
        return { unreadEventsCount: 0, unreadEventsList: [] }
      })

      const { notificationSocket, notificationConnectionState } = get()

      if (
        notificationSocket &&
        notificationConnectionState === ConnectionState.CONNECTED
      ) {
        notificationSocket.emit(
          'markAllAsRead',
          { eventIds: eventIds || [] },
          (result) => {
            if (result.success) resolve(result)
            else reject(new Error(result.error))
          }
        )
      } else {
        resolve({ success: true, markedCount: 0 })
      }
    }),

  resetUnreadEvents: () => set({ unreadEventsCount: 0, unreadEventsList: [] }),

  resetFriendRequestCount: () => set({ unreadFriendRequestsCount: 0 }),

  clearInvite: (eventId) =>
    set((s) => {
      const filtered = s.unreadInvitesList.filter(
        (item) => item.eventID._id !== eventId
      )
      return { unreadInvitesList: filtered, unreadInvitesCount: filtered.length }
    }),

  hasUnreadNotifications: (eventId) => {
    return get().unreadEventsList.some(
      (event) => event.eventID._id === eventId
    )
  },

  subscribeToEvent: (eventId) => {
    const { notificationSocket } = get()
    if (notificationSocket) notificationSocket.emit('subscribeToEvent', eventId)
  },

  unsubscribeFromEvent: (eventId) => {
    const { notificationSocket } = get()
    if (notificationSocket)
      notificationSocket.emit('unsubscribeFromEvent', eventId)
  },

  isUserOnline: (userId) => get().onlineUsers.has(userId),

  addRoom: (room) =>
    set((s) => ({
      roomsState: s.roomsState.some((r) => r.roomId === room.roomId)
        ? s.roomsState
        : [room, ...s.roomsState],
    })),

  removeRoom: (roomId) =>
    set((s) => ({
      roomsState: s.roomsState.filter((r) => r.roomId !== roomId),
    })),

  // ═════════════════════════════════════════════════
  // DISCONNECT (wylogowanie / cleanup)
  // ═════════════════════════════════════════════════

  disconnectSockets: () => {
    const { chatSocket, notificationSocket } = get()

    if (chatSocket) {
      chatListeners.forEach((handler, event) => chatSocket.off(event, handler))
      chatListeners.clear()
      chatSocket.disconnect()
    }

    if (notificationSocket) {
      notificationListeners.forEach((handler, event) =>
        notificationSocket.off(event, handler)
      )
      notificationListeners.clear()
      notificationSocket.disconnect()
    }

    joinedRooms.clear()

    set({
      chatSocket: null,
      notificationSocket: null,
      chatConnectionState: ConnectionState.DISCONNECTED,
      notificationConnectionState: ConnectionState.DISCONNECTED,
      roomsState: [],
      activeRoomId: null,
      unreadEventsCount: 0,
      unreadEventsList: [],
      unreadFriendRequestsCount: 0,
      lastStatusUpdate: null,
      unreadInvitesList: [],
      unreadInvitesCount: 0,
      onlineUsers: new Set(),
    })
  },
}))

// =====================================================
// SELECTORS (re-export for convenience)
// =====================================================

/** Total unread chat messages across all rooms */
export const selectTotalUnreadMessages = (s) =>
  s.roomsState.reduce((sum, room) => sum + (room.unreadCount || 0), 0)

/** Total event + friend-request + invite notification count */
export const selectTotalNotificationsCount = (s) =>
  s.unreadEventsCount + s.unreadFriendRequestsCount + s.unreadInvitesCount

/** Are both sockets connected? */
export const selectIsConnected = (s) =>
  s.chatConnectionState === ConnectionState.CONNECTED &&
  s.notificationConnectionState === ConnectionState.CONNECTED

// =====================================================
// INTERNAL HELPERS (used by SocketIoManager)
// =====================================================

export const _getJoinedRooms = () => joinedRooms
export const _getChatListeners = () => chatListeners
export const _getNotificationListeners = () => notificationListeners
