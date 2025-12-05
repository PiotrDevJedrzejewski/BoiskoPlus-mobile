import { useState, useRef, useEffect } from 'react'
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
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '../../../constants/colors'
import ChatRoomListItem from '../../../components/ChatRoomListItem'
import ChatMessageBox from '../../../components/ChatMessageBox'

// Mock data - pokoje czatu
const MOCK_CHAT_ROOMS = [
  {
    roomId: '1',
    roomType: 'private',
    participants: [
      { _id: 'user1', nickName: 'Jan Kowalski', avatarUrl: null },
      { _id: 'currentUser', nickName: 'Ty' },
    ],
    lastMessage: { message: 'Hej, gramy dzisiaj?' },
  },
  {
    roomId: '2',
    roomType: 'group',
    eventName: 'Mecz na orliku - Łódź',
    eventOwnerNick: 'Piotr',
    gameType: 'football',
    participants: [
      { _id: 'user2', nickName: 'Piotr' },
      { _id: 'user3', nickName: 'Adam' },
      { _id: 'currentUser', nickName: 'Ty' },
    ],
    lastMessage: { message: 'Widzimy się o 18:00!' },
  },
  {
    roomId: '3',
    roomType: 'private',
    participants: [
      { _id: 'user4', nickName: 'Anna Nowak', avatarUrl: null },
      { _id: 'currentUser', nickName: 'Ty' },
    ],
    lastMessage: { message: 'Dzięki za grę!' },
  },
  {
    roomId: '4',
    roomType: 'group',
    eventName: 'Siatkówka - Warszawa',
    eventOwnerNick: 'Kasia',
    gameType: 'volleyball',
    participants: [
      { _id: 'user5', nickName: 'Kasia' },
      { _id: 'currentUser', nickName: 'Ty' },
    ],
    lastMessage: { message: 'Mamy już 6 osób!' },
  },
]

// Mock data - wiadomości
const MOCK_MESSAGES = {
  1: [
    {
      _id: 'm1',
      sender: { _id: 'user1', nickName: 'Jan Kowalski' },
      message: 'Hej!',
      createdAt: '2025-12-05T10:00:00',
    },
    {
      _id: 'm2',
      sender: { _id: 'currentUser', nickName: 'Ty' },
      message: 'Cześć, co słychać?',
      createdAt: '2025-12-05T10:01:00',
    },
    {
      _id: 'm3',
      sender: { _id: 'user1', nickName: 'Jan Kowalski' },
      message: 'Wszystko dobrze! Gramy dzisiaj?',
      createdAt: '2025-12-05T10:02:00',
    },
    {
      _id: 'm4',
      sender: { _id: 'currentUser', nickName: 'Ty' },
      message: 'Jasne, o której?',
      createdAt: '2025-12-05T10:03:00',
    },
    {
      _id: 'm5',
      sender: { _id: 'user1', nickName: 'Jan Kowalski' },
      message: 'Hej, gramy dzisiaj?',
      createdAt: '2025-12-05T10:05:00',
    },
  ],
  2: [
    {
      _id: 'm6',
      sender: { _id: 'user2', nickName: 'Piotr' },
      message: 'Witam wszystkich w grupie!',
      createdAt: '2025-12-05T09:00:00',
    },
    {
      _id: 'm7',
      sender: { _id: 'user3', nickName: 'Adam' },
      message: 'Siema!',
      createdAt: '2025-12-05T09:01:00',
    },
    {
      _id: 'm8',
      sender: { _id: 'currentUser', nickName: 'Ty' },
      message: 'Hej, już nie mogę się doczekać!',
      createdAt: '2025-12-05T09:02:00',
    },
    {
      _id: 'm9',
      sender: { _id: 'user2', nickName: 'Piotr' },
      message: 'Widzimy się o 18:00!',
      createdAt: '2025-12-05T09:03:00',
    },
  ],
  3: [
    {
      _id: 'm10',
      sender: { _id: 'user4', nickName: 'Anna Nowak' },
      message: 'Dzięki za grę!',
      createdAt: '2025-12-04T20:00:00',
    },
    {
      _id: 'm11',
      sender: { _id: 'currentUser', nickName: 'Ty' },
      message: 'Również dziękuję, było super!',
      createdAt: '2025-12-04T20:01:00',
    },
  ],
  4: [
    {
      _id: 'm12',
      sender: { _id: 'user5', nickName: 'Kasia' },
      message: 'Szukamy jeszcze graczy!',
      createdAt: '2025-12-05T08:00:00',
    },
    {
      _id: 'm13',
      sender: { _id: 'currentUser', nickName: 'Ty' },
      message: 'Ja jestem!',
      createdAt: '2025-12-05T08:01:00',
    },
    {
      _id: 'm14',
      sender: { _id: 'user5', nickName: 'Kasia' },
      message: 'Mamy już 6 osób!',
      createdAt: '2025-12-05T08:02:00',
    },
  ],
}

const Chat = () => {
  const [filterType, setFilterType] = useState('all') // all | private | group
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const scrollViewRef = useRef(null)

  const currentUser = { _id: 'currentUser', nickName: 'Ty' }

  // Filtrowanie pokoi
  const filteredRooms = MOCK_CHAT_ROOMS.filter((room) => {
    // Filtr po typie
    if (filterType === 'private' && room.roomType !== 'private') return false
    if (filterType === 'group' && room.roomType !== 'group') return false

    // Filtr po wyszukiwaniu
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      if (room.roomType === 'group') {
        return (room.eventName || '').toLowerCase().includes(searchLower)
      } else {
        const otherUser = room.participants?.find(
          (p) => String(p._id) !== String(currentUser._id)
        )
        return (otherUser?.nickName || '').toLowerCase().includes(searchLower)
      }
    }

    return true
  })

  // Obsługa wyboru pokoju
  const handleRoomSelect = (room) => {
    setSelectedRoom(room)
    setLoading(true)

    // Symulacja ładowania wiadomości
    setTimeout(() => {
      setMessages(MOCK_MESSAGES[room.roomId] || [])
      setLoading(false)
    }, 500)
  }

  // Powrót do listy pokojów
  const handleBackToList = () => {
    setSelectedRoom(null)
    setMessages([])
  }

  // Wysyłanie wiadomości
  const handleSend = () => {
    if (!input.trim() || !selectedRoom) return

    const newMessage = {
      _id: `new_${Date.now()}`,
      sender: currentUser,
      message: input.trim(),
      createdAt: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, newMessage])
    setInput('')

    // Scroll do końca
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true })
    }, 100)
  }

  // Scroll do końca przy nowych wiadomościach
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: false })
      }, 100)
    }
  }, [selectedRoom])

  // Nazwa wybranego pokoju
  const getSelectedRoomName = () => {
    if (!selectedRoom) return ''
    if (selectedRoom.roomType === 'group') {
      return selectedRoom.eventName || 'Wydarzenie grupowe'
    }
    const otherUser = selectedRoom.participants?.find(
      (p) => String(p._id) !== String(currentUser._id)
    )
    return otherUser?.nickName || 'Użytkownik'
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
                currentUser={currentUser}
                onPress={() => handleRoomSelect(room)}
                isSelected={false}
                unreadCount={room.roomId === '1' ? 2 : 0} // Mock nieprzeczytanych
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
        <TouchableOpacity style={styles.settingsButton}>
          <Ionicons name='settings-outline' size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

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
        >
          {messages.length > 0 ? (
            messages.map((msg) => (
              <ChatMessageBox
                key={msg._id}
                message={msg.message}
                isOwn={msg.sender?._id === currentUser._id}
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
})
