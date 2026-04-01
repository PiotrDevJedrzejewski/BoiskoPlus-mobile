/**
 * =====================================================
 * SOCKET.IO CONTEXT - COMPATIBILITY WRAPPER (V3)
 * =====================================================
 *
 * Ten plik został zastąpiony przez 3 osobne konteksty:
 * - SocketConnectionContext (połączenia WebSocket)
 * - ChatContext (pokoje, wiadomości, online users)
 * - NotificationsSocketContext (powiadomienia o eventach/znajomych)
 *
 * useSocketIo() jest zachowany dla kompatybilności wstecznej,
 * ale nowy kod powinien używać useChat(), useNotificationsSocket()
 * lub useSocketConnection() bezpośrednio.
 *
 * WAŻNE: Ten wrapper łączy wartości ze wszystkich 3 kontekstów,
 * więc KAŻDA zmiana w dowolnym kontekście spowoduje re-render.
 * Dlatego migruj konsumentów do dedykowanych hooków.
 */

export {
  SocketConnectionProvider,
  useSocketConnection,
  ConnectionState,
} from './SocketConnectionContext'

export { ChatProvider, useChat } from './ChatContext'

export {
  NotificationsSocketProvider,
  useNotificationsSocket,
} from './NotificationsSocketContext'

// =====================================================
// DEPRECATED: Stary provider - użyj nowych providerów w _layout.jsx
// =====================================================
// SocketIoProvider nie jest już eksportowany.
// Zamiast tego użyj:
//   <SocketConnectionProvider>
//     <ChatProvider>
//       <NotificationsSocketProvider>
//         {children}
//       </NotificationsSocketProvider>
//     </ChatProvider>
//   </SocketConnectionProvider>

// =====================================================
// DEPRECATED: Compatibility hook
// =====================================================

// useSocketIo jest usunięty — import powinien być zmieniony na:
// - useChat() dla czatu (roomsState, sendMessage, totalUnreadMessages, isUserOnline)
// - useNotificationsSocket() dla powiadomień (unreadEventsCount, markEventAsRead, lastStatusUpdate)
// - useSocketConnection() dla surowych socketów (chatSocket, notificationSocket, isConnected)
