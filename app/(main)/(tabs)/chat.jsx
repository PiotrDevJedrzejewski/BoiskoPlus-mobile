import { useState, useRef, useEffect, useCallback } from 'react'
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '../../../constants/colors'
import ChatRoomListItem from '../../../components/ChatRoomListItem'
import ChatMessageBox from '../../../components/ChatMessageBox'
import customFetch from '../../../assets/utils/customFetch'
import { useSocketIo } from '../../../context/SocketIoContext'
import { useAuth } from '../../../context/AuthContext'
import { useNotification } from '../../../context/NotificationContext'

const Chat = () => {
  const { user } = useAuth()
  const {
    socket,
    joinRoom,
    sendMessage: socketSendMessage,
    setRoomAsRead,
    setActiveRoomId,
    roomsState,
  } = useSocketIo()
  const { muteChatRoom, unmuteChatRoom } = useNotification()

  const [filterType, setFilterType] = useState('all') // all | private | group
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingRooms, setLoadingRooms] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [chatRooms, setChatRooms] = useState([])
  const [eventParticipants, setEventParticipants] = useState([])
  const [loadingParticipants, setLoadingParticipants] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  // Infinite scroll state
  const [loadingOlderMessages, setLoadingOlderMessages] = useState(false)
  const [hasMoreMessages, setHasMoreMessages] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [isNearBottom, setIsNearBottom] = useState(true)
  const [isInitialLoad, setIsInitialLoad] = useState(false)

  const scrollViewRef = useRef(null)

  // Pobierz pokoje czatu przy załadowaniu
  useEffect(() => {
    const fetchChatRooms = async () => {
      setLoadingRooms(true)
      try {
        const response = await customFetch.get('/chat/rooms')
        setChatRooms(response.data.chatRooms || [])
      } catch (error) {
        console.error('Błąd pobierania pokoi:', error)
      } finally {
        setLoadingRooms(false)
      }
    }

    if (user) {
      fetchChatRooms()
    }
  }, [user])

  // Pobierz uczestników wydarzeń użytkownika
  useEffect(() => {
    const fetchEventParticipants = async () => {
      setLoadingParticipants(true)
      try {
        const response = await customFetch.get('/chat/event-participants')
        setEventParticipants(response.data.participants || [])
      } catch (error) {
        console.error('Błąd pobierania uczestników wydarzeń:', error)
      } finally {
        setLoadingParticipants(false)
      }
    }

    if (user) {
      fetchEventParticipants()
    }
  }, [user])

  // Obsługa nowych wiadomości z socket
  useEffect(() => {
    if (!socket) return

    const handleNewMessage = (msg) => {
      // Dodaj wiadomość tylko jeśli jesteśmy w tym pokoju
      setMessages((prev) => {
        if (selectedRoom && selectedRoom.roomId === msg.roomId) {
          return [...prev, msg]
        }
        return prev
      })

      // Aktualizuj ostatnią wiadomość w liście pokoi
      setChatRooms((prevRooms) =>
        prevRooms.map((room) =>
          room.roomId === msg.roomId ? { ...room, lastMessage: msg } : room
        )
      )
    }

    socket.on('newMessage', handleNewMessage)
    return () => {
      socket.off('newMessage', handleNewMessage)
    }
  }, [socket, selectedRoom, user?._id])

  // Obsługa nowych pokojów z socket
  useEffect(() => {
    if (!socket) return

    const handleNewChatRoom = (data) => {
      if (data.userId === user?._id) {
        setChatRooms((prevRooms) => {
          const roomExists = prevRooms.some(
            (room) => room.roomId === data.chatRoom.roomId
          )
          if (!roomExists) {
            joinRoom(data.chatRoom.roomId)
            return [data.chatRoom, ...prevRooms]
          }
          return prevRooms
        })
      }
    }

    socket.on('newChatRoom', handleNewChatRoom)
    return () => {
      socket.off('newChatRoom', handleNewChatRoom)
    }
  }, [socket, user?._id, joinRoom])

  // Obsługa usuwania z pokojów
  useEffect(() => {
    if (!socket) return

    const handleRemovedFromChatRoom = (data) => {
      if (data.userId === user?._id) {
        setChatRooms((prevRooms) =>
          prevRooms.filter((room) => room.roomId !== data.roomId)
        )

        if (selectedRoom && selectedRoom.roomId === data.roomId) {
          setSelectedRoom(null)
          setMessages([])
          setActiveRoomId(null)
        }

        socket.emit('leaveRoom', data.roomId)
      }
    }

    socket.on('removedFromChatRoom', handleRemovedFromChatRoom)
    return () => {
      socket.off('removedFromChatRoom', handleRemovedFromChatRoom)
    }
  }, [socket, user?._id, selectedRoom, setActiveRoomId])

  // Reset activeRoomId przy odmontowaniu
  useEffect(() => {
    return () => {
      setActiveRoomId(null)
    }
  }, [setActiveRoomId])

  // Scroll do końca przy nowych wiadomościach
  useEffect(() => {
    if (isInitialLoad) {
      scrollViewRef.current?.scrollToEnd({ animated: false })
      setIsInitialLoad(false)
    } else if (isNearBottom && messages.length > 0) {
      scrollViewRef.current?.scrollToEnd({ animated: true })
    }
  }, [messages, isInitialLoad, isNearBottom])

  // Filtrowanie pokoi
  const filteredRooms = chatRooms.filter((room) => {
    if (filterType === 'private' && room.roomType !== 'private') return false
    if (filterType === 'group' && room.roomType !== 'group') return false

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      if (room.roomType === 'group') {
        return (room.eventName || '').toLowerCase().includes(searchLower)
      } else {
        const otherUser = room.participants?.find(
          (p) => String(p._id) !== String(user?._id)
        )
        return (otherUser?.nickName || '').toLowerCase().includes(searchLower)
      }
    }

    return true
  })

  // Oznaczanie wiadomości jako przeczytane
  const markAllMessagesAsRead = async (roomId) => {
    try {
      await customFetch.patch('/chat/messages/read', { roomId })
    } catch (error) {
      console.error('Błąd oznaczania wiadomości jako przeczytane:', error)
    }
  }

  // Obsługa wyboru pokoju
  const handleRoomSelect = async (room) => {
    setSelectedRoom(room)
    setActiveRoomId(room.roomId)
    setLoading(true)

    // Zresetuj stan paginacji
    setCurrentPage(1)
    setHasMoreMessages(true)
    setLoadingOlderMessages(false)
    setIsNearBottom(true)
    setIsInitialLoad(true)

    // Oznacz wiadomości jako przeczytane
    markAllMessagesAsRead(room.roomId)
    setRoomAsRead(room.roomId)

    try {
      const response = await customFetch.get(`/chat/messages/${room.roomId}`)
      setMessages(response.data.messages || [])

      if ((response.data.messages || []).length < 30) {
        setHasMoreMessages(false)
      }
    } catch (error) {
      console.error('Błąd pobierania wiadomości:', error)
      setMessages([])
    } finally {
      setLoading(false)
    }
  }

  // Ładowanie starszych wiadomości
  const loadOlderMessages = async () => {
    if (loadingOlderMessages || !hasMoreMessages || !selectedRoom) return

    setLoadingOlderMessages(true)

    try {
      const nextPage = currentPage + 1
      const response = await customFetch.get(
        `/chat/messages/${selectedRoom.roomId}?page=${nextPage}&limit=30`
      )

      const olderMessages = response.data.messages || []

      if (olderMessages.length > 0) {
        setMessages((prev) => [...olderMessages, ...prev])
        setCurrentPage(nextPage)

        if (olderMessages.length < 30) {
          setHasMoreMessages(false)
        }
      } else {
        setHasMoreMessages(false)
      }
    } catch (error) {
      console.error('Błąd ładowania starszych wiadomości:', error)
    } finally {
      setLoadingOlderMessages(false)
    }
  }

  // Tworzenie nowego pokoju z użytkownikiem
  const handleStartNewChat = async (otherUserId) => {
    try {
      const response = await customFetch.post('/chat/rooms', { otherUserId })
      const newRoom = response.data.chatRoom

      const roomExists = chatRooms.some(
        (room) => room.roomId === newRoom.roomId
      )
      if (!roomExists) {
        setChatRooms((prev) => [newRoom, ...prev])
        joinRoom(newRoom.roomId)
      }

      handleRoomSelect(newRoom)
    } catch (error) {
      console.error('Błąd tworzenia pokoju:', error)
      Alert.alert('Błąd', 'Nie udało się utworzyć pokoju czatu')
    }
  }

  // Powrót do listy pokojów
  const handleBackToList = () => {
    setSelectedRoom(null)
    setMessages([])
    setActiveRoomId(null)
    setShowSettings(false)
  }

  // Wysyłanie wiadomości
  const handleSend = () => {
    if (!input.trim() || !user || !selectedRoom) {
      if (!selectedRoom) {
        Alert.alert('Info', 'Wybierz pokój czatu, aby wysłać wiadomość')
      }
      return
    }

    if (!socket) {
      Alert.alert('Błąd', 'Brak połączenia z serwerem. Spróbuj ponownie.')
      return
    }

    socketSendMessage(selectedRoom.roomId, input, user._id)
    setInput('')
  }

  // Wyciszanie czatu
  const handleMuteChat = async (duration) => {
    if (!selectedRoom) return

    let muteExpiresAt = null

    if (duration === 'permanent') {
      muteExpiresAt = null
    } else if (duration === '1h') {
      muteExpiresAt = new Date(Date.now() + 1000 * 60 * 60)
    } else if (duration === '12h') {
      muteExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 12)
    } else if (duration === '24h') {
      muteExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24)
    } else if (duration === '1w') {
      muteExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7)
    }

    try {
      const result = await muteChatRoom(selectedRoom.roomId, muteExpiresAt)
      if (result.success) {
        Alert.alert(
          'Sukces',
          `Czat wyciszony na ${duration === 'permanent' ? 'stałe' : duration}`
        )
      } else {
        Alert.alert('Błąd', 'Błąd wyciszania czatu')
      }
    } catch (error) {
      Alert.alert('Błąd', 'Błąd wyciszania czatu')
      console.error('Błąd wyciszania czatu:', error)
    }

    setShowSettings(false)
  }

  const handleUnmuteChat = async () => {
    if (!selectedRoom) return
    try {
      const result = await unmuteChatRoom(selectedRoom.roomId)
      if (result.success) {
        Alert.alert('Sukces', 'Powiadomienia w czacie włączone')
      } else {
        Alert.alert('Błąd', 'Błąd odciszania czatu')
      }
    } catch (error) {
      Alert.alert('Błąd', 'Błąd odciszania czatu')
      console.error('Błąd odciszania czatu:', error)
    }

    setShowSettings(false)
  }

  // Nazwa wybranego pokoju
  const getSelectedRoomName = () => {
    if (!selectedRoom) return ''
    if (selectedRoom.roomType === 'group') {
      return selectedRoom.eventName || 'Wydarzenie grupowe'
    }
    const otherUser = selectedRoom.participants?.find(
      (p) => String(p._id) !== String(user?._id)
    )
    return otherUser?.nickName || 'Użytkownik'
  }

  // Pobierz unreadCount dla pokoju z roomsState
  const getUnreadCount = (roomId) => {
    const roomData = roomsState.find((r) => r.roomId === roomId)
    return roomData?.unreadCount || 0
  }

  // Widok listy pokojów
  if (!selectedRoom) {
    return (
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name='chatbubbles' size={26} color={COLORS.secondary} />
          <Text style={styles.headerText}>Czat</Text>
        </View>

        {/* Filtry */}
        <View style={styles.filters}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filterType === 'all' && styles.filterButtonActive,
            ]}
            onPress={() => setFilterType('all')}
          >
            <Text
              style={[
                styles.filterText,
                filterType === 'all' && styles.filterTextActive,
              ]}
            >
              Wszystkie
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filterType === 'private' && styles.filterButtonActive,
            ]}
            onPress={() => setFilterType('private')}
          >
            <Ionicons
              name='chatbubble'
              size={14}
              color={
                filterType === 'private' ? COLORS.background : COLORS.primary
              }
            />
            <Text
              style={[
                styles.filterText,
                filterType === 'private' && styles.filterTextActive,
              ]}
            >
              Prywatne
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filterType === 'group' && styles.filterButtonActive,
            ]}
            onPress={() => setFilterType('group')}
          >
            <Ionicons
              name='people'
              size={14}
              color={
                filterType === 'group' ? COLORS.background : COLORS.primary
              }
            />
            <Text
              style={[
                styles.filterText,
                filterType === 'group' && styles.filterTextActive,
              ]}
            >
              Grupowe
            </Text>
          </TouchableOpacity>
        </View>

        {/* Wyszukiwarka */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder='Szukaj...'
            placeholderTextColor={COLORS.gray}
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
          <Ionicons
            name='search'
            size={20}
            color={COLORS.gray}
            style={styles.searchIcon}
          />
        </View>

        {/* Lista pokojów */}
        <ScrollView
          style={styles.roomList}
          showsVerticalScrollIndicator={false}
        >
          {filteredRooms.length > 0 ? (
            filteredRooms.map((room) => (
              <ChatRoomListItem
                key={room.roomId}
                room={room}
                currentUser={user}
                onPress={() => handleRoomSelect(room)}
                isSelected={false}
                unreadCount={getUnreadCount(room.roomId)}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons
                name='chatbubbles-outline'
                size={50}
                color={COLORS.gray}
              />
              <Text style={styles.emptyText}>Brak pokojów czatu</Text>
            </View>
          )}
        </ScrollView>
      </View>
    )
  }

  // Widok wiadomości
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header z powrotem */}
      <View style={styles.messageHeader}>
        <TouchableOpacity onPress={handleBackToList} style={styles.backButton}>
          <Ionicons name='arrow-back' size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerUsername} numberOfLines={1}>
            {getSelectedRoomName()}
          </Text>
          {selectedRoom.roomType === 'group' && (
            <Text style={styles.headerSubtitle}>
              {selectedRoom.participants?.length || 0} uczestników
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => setShowSettings(!showSettings)}
        >
          <Ionicons name='settings-outline' size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Settings dropdown */}
      {showSettings && (
        <View style={styles.settingsDropdown}>
          <TouchableOpacity
            style={styles.settingsOption}
            onPress={() => handleMuteChat('1h')}
          >
            <Text style={styles.settingsOptionText}>Wycisz na 1h</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.settingsOption}
            onPress={() => handleMuteChat('12h')}
          >
            <Text style={styles.settingsOptionText}>Wycisz na 12h</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.settingsOption}
            onPress={() => handleMuteChat('24h')}
          >
            <Text style={styles.settingsOptionText}>Wycisz na 24h</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.settingsOption}
            onPress={() => handleMuteChat('1w')}
          >
            <Text style={styles.settingsOptionText}>Wycisz na tydzień</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.settingsOption}
            onPress={() => handleMuteChat('permanent')}
          >
            <Text style={styles.settingsOptionText}>Wycisz na stałe</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.settingsOption, styles.settingsOptionLast]}
            onPress={handleUnmuteChat}
          >
            <Text style={styles.settingsOptionText}>Włącz powiadomienia</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Wiadomości */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={COLORS.secondary} />
          <Text style={styles.loadingText}>Ładowanie wiadomości...</Text>
        </View>
      ) : (
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onScroll={({ nativeEvent }) => {
            const { contentOffset, contentSize, layoutMeasurement } =
              nativeEvent
            const distanceFromBottom =
              contentSize.height - contentOffset.y - layoutMeasurement.height
            setIsNearBottom(distanceFromBottom <= 200)

            // Ładuj starsze wiadomości gdy scroll blisko góry
            if (
              contentOffset.y < 100 &&
              !loadingOlderMessages &&
              hasMoreMessages
            ) {
              loadOlderMessages()
            }
          }}
          scrollEventThrottle={100}
        >
          {loadingOlderMessages && (
            <View style={styles.loadingOlder}>
              <ActivityIndicator size='small' color={COLORS.secondary} />
              <Text style={styles.loadingOlderText}>
                Ładowanie starszych wiadomości...
              </Text>
            </View>
          )}
          {!hasMoreMessages && messages.length > 0 && (
            <Text style={styles.noMoreMessages}>
              To są wszystkie wiadomości w tym pokoju
            </Text>
          )}
          {messages.length > 0 ? (
            messages.map((msg) => (
              <ChatMessageBox
                key={msg._id}
                message={msg.message}
                isOwn={msg.sender?._id === user?._id}
                senderName={msg.sender?.nickName || 'Użytkownik'}
                time={
                  msg.createdAt
                    ? new Date(msg.createdAt).toLocaleTimeString('pl-PL', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : ''
                }
              />
            ))
          ) : (
            <View style={styles.emptyMessages}>
              <Ionicons
                name='chatbubble-outline'
                size={50}
                color={COLORS.gray}
              />
              <Text style={styles.emptyText}>Brak wiadomości</Text>
              <Text style={styles.emptySubtext}>
                Napisz pierwszą wiadomość!
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.messageInput}
          placeholder='Napisz wiadomość...'
          placeholderTextColor={COLORS.gray}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={handleSend}
          returnKeyType='send'
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            !input.trim() && styles.sendButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={!input.trim()}
        >
          <Ionicons
            name='send'
            size={20}
            color={input.trim() ? COLORS.background : COLORS.gray}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

export default Chat

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  headerText: {
    fontSize: 24,
    fontFamily: 'Montserrat-Bold',
    color: COLORS.primary,
    marginLeft: 12,
  },
  filters: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#494949',
    gap: 6,
  },
  filterButtonActive: {
    backgroundColor: COLORS.secondary,
  },
  filterText: {
    fontSize: 13,
    fontFamily: 'Lato-Regular',
    color: COLORS.primary,
  },
  filterTextActive: {
    color: COLORS.background,
    fontFamily: 'Montserrat-Bold',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  searchInput: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 16,
    height: 44,
    paddingHorizontal: 16,
    paddingRight: 40,
    fontSize: 16,
    fontFamily: 'Lato-Regular',
    color: COLORS.primary,
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  searchIcon: {
    position: 'absolute',
    right: 28,
    top: 24,
  },
  roomList: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Lato-Regular',
    color: COLORS.gray,
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: 'Lato-Regular',
    color: COLORS.gray,
    opacity: 0.7,
  },
  // Message view styles
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.third,
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerUsername: {
    fontSize: 16,
    fontFamily: 'Montserrat-Bold',
    color: COLORS.primary,
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: 'Lato-Regular',
    color: COLORS.gray,
    marginTop: 2,
  },
  settingsButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: 'Lato-Regular',
    color: COLORS.primary,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    flexGrow: 1,
  },
  emptyMessages: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderTopWidth: 1,
    borderTopColor: COLORS.third,
  },
  messageInput: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    height: 44,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: 'Lato-Regular',
    color: COLORS.background,
    marginRight: 12,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.backgroundSecondary,
  },
  // Settings dropdown styles
  settingsDropdown: {
    backgroundColor: COLORS.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.third,
  },
  settingsOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  settingsOptionLast: {
    borderBottomWidth: 0,
  },
  settingsOptionText: {
    fontSize: 14,
    fontFamily: 'Lato-Regular',
    color: COLORS.primary,
  },
  // Infinite scroll styles
  loadingOlder: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  loadingOlderText: {
    marginLeft: 8,
    fontSize: 12,
    fontFamily: 'Lato-Regular',
    color: COLORS.gray,
  },
  noMoreMessages: {
    textAlign: 'center',
    paddingVertical: 10,
    fontSize: 12,
    fontFamily: 'Lato-Regular',
    color: COLORS.gray,
    fontStyle: 'italic',
  },
})
