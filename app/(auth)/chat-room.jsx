import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useGradualAnimation } from '../../assets/hooks/useGradualAnimation'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '../../constants/colors'
import ChatMessageBox from '../../components/ChatMessageBox'
import customFetch from '../../assets/utils/customFetch'
import { useSocketStore, selectIsConnected } from '../../context/socketStore'
import { useAuth } from '../../context/AuthContext'
import { useNotification } from '../../context/NotificationContext'
import LottieView from 'lottie-react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useResponsiveScale } from '../../assets/utils/scaleUI.UX'
import { dbg, useDebugMount } from '../../assets/utils/debugLogger'

const typingAnimation = require('../../assets/utils/typing.json')
const spinnerAnimation = require('../../assets/utils/spinner.json')

const ChatRoom = () => {
  dbg('ChatRoom')
  useDebugMount('ChatRoom')
  const ui = useResponsiveScale()
  const insets = useSafeAreaInsets()
  const styles = useMemo(() => createStyles(ui, insets.bottom), [ui, insets.bottom])
  const router = useRouter()
  const { user } = useAuth()
  const { roomId: paramRoomId, otherUserId } = useLocalSearchParams()

  // Socket
  const chatSocket = useSocketStore((s) => s.chatSocket)
  const isConnected = useSocketStore(selectIsConnected)
  const socketSendMessage = useSocketStore((s) => s.sendMessage)
  const setRoomAsRead = useSocketStore((s) => s.setRoomAsRead)
  const setActiveRoomId = useSocketStore((s) => s.setActiveRoomId)
  const sendTyping = useSocketStore((s) => s.sendTyping)
  const sendStopTyping = useSocketStore((s) => s.sendStopTyping)
  const addRoom = useSocketStore((s) => s.addRoom)
  const joinRoom = useSocketStore((s) => s.joinRoom)

  const { muteChatRoom, unmuteChatRoom } = useNotification()

  // Room resolved from params
  const [room, setRoom] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [showSettings, setShowSettings] = useState(false)

  // Infinite scroll
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)

  // Typing
  const [typingUsers, setTypingUsers] = useState({})
  const typingTimeoutRef = useRef({})

  const scrollViewRef = useRef(null)
  const roomRef = useRef(null)

  useEffect(() => {
    roomRef.current = room
  }, [room])

  // Resolve room — either from roomId param or by creating new room with otherUserId
  useEffect(() => {
    const resolveRoom = async () => {
      setLoading(true)
      try {
        if (paramRoomId) {
          // Fetch room info from roomsState or API
          const existing = useSocketStore.getState().roomsState.find(
            (r) => r.roomId === paramRoomId
          )
          if (existing) {
            setRoom(existing)
          } else {
            // Fallback — fetch from API
            const res = await customFetch.get('/chat/rooms')
            const found = (res.data.chatRooms || []).find(
              (r) => r.roomId === paramRoomId
            )
            if (found) {
              setRoom(found)
            } else {
              Alert.alert('Info', 'Pokój czatu nie istnieje lub został usunięty')
              router.back()
              return
            }
          }
        } else if (otherUserId) {
          const res = await customFetch.post('/chat/rooms', { otherUserId })
          const newRoom = res.data.chatRoom
          const roomExists = useSocketStore.getState().roomsState.some(
            (r) => r.roomId === newRoom.roomId
          )
          if (!roomExists) {
            addRoom(newRoom)
            joinRoom(newRoom.roomId)
          }
          setRoom(newRoom)
        }
      } catch (error) {
        console.error('Błąd rozwiązywania pokoju:', error)
        Alert.alert('Błąd', 'Nie udało się otworzyć pokoju czatu')
        router.back()
      }
    }

    if (user) resolveRoom()
  }, [paramRoomId, otherUserId, user])

  // Fetch messages once room is set
  useEffect(() => {
    if (!room) return

    const fetchMessages = async () => {
      setActiveRoomId(room.roomId)
      setLoading(true)
      setCurrentPage(1)
      setHasMore(true)

      try {
        await customFetch.patch('/chat/messages/read', { roomId: room.roomId })
        setRoomAsRead(room.roomId)
      } catch {}

      try {
        const res = await customFetch.get(`/chat/messages/${room.roomId}`)
        const msgs = res.data.messages || []
        setMessages(msgs)
        if (msgs.length < 30) setHasMore(false)
      } catch (error) {
        console.error('Błąd pobierania wiadomości:', error)
        const status = error?.response?.status
        if (status === 404 || status === 500) {
          // Room was deleted (e.g. event deletion) — clean up and go back
          useSocketStore.getState().removeRoom(room.roomId)
          Alert.alert('Info', 'Pokój czatu nie istnieje lub został usunięty')
          router.back()
          return
        }
        setMessages([])
      } finally {
        setLoading(false)
      }
    }

    fetchMessages()
  }, [room])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setActiveRoomId(null)
      Object.values(typingTimeoutRef.current).forEach(clearTimeout)
      typingTimeoutRef.current = {}
    }
  }, [setActiveRoomId])

  // Socket: new messages
  useEffect(() => {
    if (!chatSocket) return

    const handleNewMessage = (msg) => {
      const currentRoom = roomRef.current
      if (currentRoom && currentRoom.roomId === msg.roomId) {
        // Prepend — FlatList inverted shows newest at bottom
        setMessages((prev) => [msg, ...prev])

        // Mark as read immediately while user is in the room
        customFetch.patch('/chat/messages/read', { roomId: currentRoom.roomId }).catch(() => {})
        setRoomAsRead(currentRoom.roomId)
      }
    }

    chatSocket.on('newMessage', handleNewMessage)
    return () => chatSocket.off('newMessage', handleNewMessage)
  }, [chatSocket, setRoomAsRead])

  // Socket: typing indicators
  useEffect(() => {
    if (!chatSocket) return

    const handleUserTyping = (data) => {
      const { roomId: typingRoomId } = data
      const userId = data.userId || data.userID || data.user_id
      const currentRoom = roomRef.current

      if (currentRoom?.roomId === typingRoomId && userId !== user?._id) {
        let nickName = 'Użytkownik'
        const typingUser = currentRoom.participants?.find(
          (p) => String(p._id) === String(userId)
        )
        if (typingUser) {
          nickName = typingUser.nickName || typingUser.nickname || 'Użytkownik'
        }

        setTypingUsers((prev) => ({ ...prev, [userId]: nickName }))

        if (typingTimeoutRef.current[userId]) {
          clearTimeout(typingTimeoutRef.current[userId])
        }
        typingTimeoutRef.current[userId] = setTimeout(() => {
          setTypingUsers((prev) => {
            const next = { ...prev }
            delete next[userId]
            return next
          })
        }, 3000)
      }
    }

    const handleUserStoppedTyping = (data) => {
      const userId = data.userId || data.userID || data.user_id
      const currentRoom = roomRef.current

      if (currentRoom?.roomId === data.roomId) {
        if (typingTimeoutRef.current[userId]) {
          clearTimeout(typingTimeoutRef.current[userId])
          delete typingTimeoutRef.current[userId]
        }
        setTypingUsers((prev) => {
          const next = { ...prev }
          delete next[userId]
          return next
        })
      }
    }

    chatSocket.on('userTyping', handleUserTyping)
    chatSocket.on('userStoppedTyping', handleUserStoppedTyping)

    return () => {
      chatSocket.off('userTyping', handleUserTyping)
      chatSocket.off('userStoppedTyping', handleUserStoppedTyping)
      Object.values(typingTimeoutRef.current).forEach(clearTimeout)
      typingTimeoutRef.current = {}
    }
  }, [chatSocket, user?._id])

  // Socket: removed from room
  useEffect(() => {
    if (!chatSocket) return

    const handleRemoved = (data) => {
      if (data.userId === user?._id) {
        const currentRoom = roomRef.current
        if (currentRoom?.roomId === data.roomId) {
          Alert.alert('Info', 'Zostałeś usunięty z tego pokoju')
          router.back()
        }
      }
    }

    chatSocket.on('removedFromChatRoom', handleRemoved)
    return () => chatSocket.off('removedFromChatRoom', handleRemoved)
  }, [chatSocket, user?._id, router])

  // Scroll to end on new messages — not needed with inverted FlatList

  // Load older messages — triggered by onEndReached (scrolling up in inverted list)
  const loadOlderMessages = useCallback(async () => {
    if (loadingOlder || !hasMore || !room) return
    setLoadingOlder(true)

    try {
      const nextPage = currentPage + 1
      const res = await customFetch.get(
        `/chat/messages/${room.roomId}?page=${nextPage}&limit=30`
      )
      const older = res.data.messages || []
      if (older.length > 0) {
        // Append to end of array — they're the oldest, appear at top of inverted list
        setMessages((prev) => [...prev, ...older])
        setCurrentPage(nextPage)
        if (older.length < 30) setHasMore(false)
      } else {
        setHasMore(false)
      }
    } catch (error) {
      console.error('Błąd ładowania starszych wiadomości:', error)
    } finally {
      setLoadingOlder(false)
    }
  }, [loadingOlder, hasMore, room, currentPage])

  // Input change — typing events
  const handleInputChange = (text) => {
    setInput(text)
    if (!room || !sendTyping) return
    if (text.trim() && !input.trim()) sendTyping(room.roomId)
    if (!text.trim() && input.trim() && sendStopTyping) sendStopTyping(room.roomId)
  }

  // Send message
  const handleSend = async () => {
    if (!input.trim() || !user || !room) return
    if (!chatSocket || !isConnected) {
      Alert.alert('Błąd', 'Brak połączenia z serwerem. Spróbuj ponownie.')
      return
    }

    try {
      if (sendStopTyping) sendStopTyping(room.roomId)
      await socketSendMessage(room.roomId, input)
      setInput('')
    } catch (error) {
      console.error('Błąd wysyłania wiadomości:', error)
      Alert.alert('Błąd', 'Nie udało się wysłać wiadomości')
    }
  }

  // Mute/unmute
  const handleMuteChat = async (duration) => {
    if (!room) return
    let muteExpiresAt = null
    if (duration === '1h') muteExpiresAt = new Date(Date.now() + 3600000)
    else if (duration === '12h') muteExpiresAt = new Date(Date.now() + 43200000)
    else if (duration === '24h') muteExpiresAt = new Date(Date.now() + 86400000)
    else if (duration === '1w') muteExpiresAt = new Date(Date.now() + 604800000)

    try {
      const result = await muteChatRoom(room.roomId, muteExpiresAt)
      if (result.success) {
        Alert.alert('Sukces', `Czat wyciszony na ${duration === 'permanent' ? 'stałe' : duration}`)
      } else {
        Alert.alert('Błąd', 'Błąd wyciszania czatu')
      }
    } catch {
      Alert.alert('Błąd', 'Błąd wyciszania czatu')
    }
    setShowSettings(false)
  }

  const handleUnmuteChat = async () => {
    if (!room) return
    try {
      const result = await unmuteChatRoom(room.roomId)
      if (result.success) Alert.alert('Sukces', 'Powiadomienia w czacie włączone')
      else Alert.alert('Błąd', 'Błąd odciszania czatu')
    } catch {
      Alert.alert('Błąd', 'Błąd odciszania czatu')
    }
    setShowSettings(false)
  }

  // Room name
  const roomName = useMemo(() => {
    if (!room) return ''
    if (room.roomType === 'group') return room.eventName || 'Wydarzenie grupowe'
    const other = room.participants?.find((p) => String(p._id) !== String(user?._id))
    return other?.nickName || 'Użytkownik'
  }, [room, user?._id])

  // Typing text
  const typingText = useMemo(() => {
    const list = Object.values(typingUsers)
    if (list.length === 0) return null
    if (list.length === 1) return `${list[0]} pisze`
    if (list.length === 2) return `${list[0]} i ${list[1]} piszą`
    return `${list.length} osób pisze`
  }, [typingUsers])

  // Keyboard spacer
  const insetsBottomSV = useSharedValue(insets.bottom)
  useEffect(() => {
    insetsBottomSV.value = insets.bottom
  }, [insets.bottom])
  const { height } = useGradualAnimation()
  const keyboardPadding = useAnimatedStyle(() => ({
    height: height.value > 0 ? Math.max(0, height.value - insetsBottomSV.value) : 0,
  }), [])

  // Sizes
  const backIconSize = ui.moderateScale(24, 0.35)
  const settingsIconSize = ui.moderateScale(22, 0.35)
  const stateIconSize = ui.moderateScale(50, 0.3)
  const sendIconSize = ui.moderateScale(20, 0.35)
  const typingAnimationSize = ui.scale(80)

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.messageHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name='arrow-back' size={backIconSize} color={COLORS.primary} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerUsername} numberOfLines={1}>
            {roomName}
          </Text>
          {room?.roomType === 'group' && (
            <Text style={styles.headerSubtitle}>
              {room.participants?.length || 0} uczestników
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => setShowSettings(!showSettings)}
        >
          <Ionicons name='settings-outline' size={settingsIconSize} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Settings dropdown */}
      {showSettings && (
        <View style={styles.settingsDropdown}>
          {['1h', '12h', '24h', '1w', 'permanent'].map((dur) => (
            <TouchableOpacity
              key={dur}
              style={styles.settingsOption}
              onPress={() => handleMuteChat(dur)}
            >
              <Text style={styles.settingsOptionText}>
                {dur === 'permanent' ? 'Wycisz na stałe' : dur === '1w' ? 'Wycisz na tydzień' : `Wycisz na ${dur}`}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[styles.settingsOption, styles.settingsOptionLast]}
            onPress={handleUnmuteChat}
          >
            <Text style={styles.settingsOptionText}>Włącz powiadomienia</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Messages */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <LottieView
            source={spinnerAnimation}
            autoPlay
            loop
            style={styles.spinner}
          />
        </View>
      ) : (
        <FlatList
          ref={scrollViewRef}
          data={messages}
          keyExtractor={(item) => item._id}
          renderItem={({ item: msg }) => (
            <ChatMessageBox
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
          )}
          inverted
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps='handled'
          onEndReached={loadOlderMessages}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingOlder ? (
              <View style={styles.loadingOlder}>
                <ActivityIndicator size='small' color={COLORS.secondary} />
              </View>
            ) : !hasMore && messages.length > 0 ? (
              <Text style={styles.noMoreMessages}>To są wszystkie wiadomości</Text>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyMessages}>
              <Ionicons name='chatbubble-outline' size={stateIconSize} color={COLORS.gray} />
              <Text style={styles.emptyText}>Brak wiadomości</Text>
              <Text style={styles.emptySubtext}>Napisz pierwszą wiadomość!</Text>
            </View>
          }
        />
      )}

      {/* Typing indicator */}
      {typingText && (
        <View style={styles.typingIndicator}>
          <Text style={styles.typingIndicatorText}>{typingText}</Text>
          <View style={styles.typingAnimationWrapper}>
            <LottieView
              source={typingAnimation}
              autoPlay
              loop
              style={{
                width: typingAnimationSize,
                height: typingAnimationSize,
                position: 'absolute',
                top: '50%',
                left: '50%',
                marginLeft: -typingAnimationSize / 2,
                marginTop: -typingAnimationSize / 2,
              }}
            />
          </View>
        </View>
      )}

      {/* Input — inline flex child, KeyboardAvoidingView handles offset */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.messageInput}
          placeholder='Napisz wiadomość...'
          placeholderTextColor={COLORS.gray}
          value={input}
          onChangeText={handleInputChange}
          onSubmitEditing={handleSend}
          returnKeyType='send'
        />
        <TouchableOpacity
          style={[styles.sendButton, !input.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!input.trim()}
        >
          <Ionicons
            name='send'
            size={sendIconSize}
            color={input.trim() ? COLORS.background : COLORS.gray}
          />
        </TouchableOpacity>
      </View>
      <Animated.View style={keyboardPadding} />
    </View>
  )
}

export default ChatRoom

const createStyles = (ui, insetsBottom = 0) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: COLORS.background,
    },
    // Header
    messageHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: ui.spacing(16),
      paddingVertical: ui.verticalScale(16),
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      borderBottomWidth: 1,
      borderBottomColor: COLORS.third,
    },
    backButton: {
      padding: ui.spacing(4, 0.35),
      marginRight: ui.spacing(12, 0.35),
    },
    headerInfo: {
      flex: 1,
    },
    headerUsername: {
      fontSize: ui.scaleFont(16, 0.35),
      fontFamily: 'Montserrat-Bold',
      color: COLORS.primary,
    },
    headerSubtitle: {
      fontSize: ui.scaleFont(12, 0.3),
      fontFamily: 'Lato-Regular',
      color: COLORS.gray,
      marginTop: ui.verticalScale(2),
    },
    settingsButton: {
      padding: ui.spacing(4, 0.35),
    },
    // Settings
    settingsDropdown: {
      position: 'absolute',
      zIndex: 20,
      top: ui.verticalScale(60),
      right: 0,
      width: '100%',
      borderRadius: ui.moderateScale(8, 0.35),
      backgroundColor: COLORS.backgroundSecondary,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.third,
    },
    settingsOption: {
      paddingVertical: ui.verticalScale(12),
      paddingHorizontal: ui.spacing(16),
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    settingsOptionLast: {
      borderBottomWidth: 0,
    },
    settingsOptionText: {
      fontSize: ui.scaleFont(14, 0.35),
      fontFamily: 'Lato-Regular',
      color: COLORS.primary,
    },
    // Loading
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    spinner: {
      width: ui.scale(120),
      height: ui.scale(120),
    },
    // Messages
    messagesContainer: {
      flex: 1,
    },
    messagesContent: {
      padding: ui.spacing(16),
      flexGrow: 1,
    },
    emptyMessages: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: ui.verticalScale(50),
    },
    emptyText: {
      marginTop: ui.verticalScale(16),
      fontSize: ui.scaleFont(16, 0.35),
      fontFamily: 'Lato-Regular',
      color: COLORS.gray,
    },
    emptySubtext: {
      marginTop: ui.verticalScale(8),
      fontSize: ui.scaleFont(14, 0.35),
      fontFamily: 'Lato-Regular',
      color: COLORS.gray,
      opacity: 0.7,
    },
    // Typing
    typingIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: ui.spacing(16),
      paddingVertical: ui.verticalScale(2),
    },
    typingIndicatorText: {
      fontSize: ui.scaleFont(12, 0.3),
      fontFamily: 'ObjectFont',
      color: COLORS.primary,
    },
    typingAnimationWrapper: {
      width: ui.scale(50),
      height: ui.verticalScale(20),
      overflow: 'hidden',
      position: 'relative',
    },
    // Input — inline, not absolute
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: ui.spacing(16),
      paddingTop: ui.verticalScale(12),
      paddingBottom: ui.verticalScale(12) + insetsBottom,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      borderTopWidth: 1,
      borderTopColor: COLORS.third,
    },
    messageInput: {
      flex: 1,
      backgroundColor: COLORS.white,
      borderRadius: ui.controlRadius,
      minHeight: ui.controlMinHeight,
      paddingHorizontal: ui.controlPaddingHorizontal,
      paddingVertical: ui.controlPaddingVertical,
      fontSize: ui.scaleFont(16, 0.35),
      fontFamily: 'Lato-Regular',
      color: COLORS.background,
      marginRight: ui.spacing(12, 0.35),
    },
    sendButton: {
      width: ui.controlMinHeight,
      height: ui.controlMinHeight,
      borderRadius: ui.controlMinHeight / 2,
      backgroundColor: COLORS.secondary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    sendButtonDisabled: {
      backgroundColor: COLORS.backgroundSecondary,
    },
    // Infinite scroll
    loadingOlder: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: ui.verticalScale(10),
    },
    loadingOlderText: {
      marginLeft: ui.spacing(8, 0.35),
      fontSize: ui.scaleFont(12, 0.3),
      fontFamily: 'Lato-Regular',
      color: COLORS.gray,
    },
    noMoreMessages: {
      textAlign: 'center',
      paddingVertical: ui.verticalScale(10),
      fontSize: ui.scaleFont(12, 0.3),
      fontFamily: 'Lato-Regular',
      color: COLORS.gray,
      fontStyle: 'italic',
    },
  })
