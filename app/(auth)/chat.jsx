import { useState, useEffect, useMemo, useRef } from 'react'
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '../../constants/colors'
import ChatRoomListItem from '../../components/ChatRoomListItem'
import customFetch from '../../assets/utils/customFetch'
import { useSocketStore } from '../../context/socketStore'
import { useAuth } from '../../context/AuthContext'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useResponsiveScale } from '../../assets/utils/scaleUI.UX'
import { dbg, useDebugMount } from '../../assets/utils/debugLogger'

const Chat = () => {
  dbg('ChatRoomsList')
  useDebugMount('ChatRoomsList')
  const ui = useResponsiveScale()
  const styles = useMemo(() => createStyles(ui), [ui])
  const router = useRouter()
  const { user } = useAuth()
  const { openChatWith } = useLocalSearchParams()

  const roomsState = useSocketStore((s) => s.roomsState)
  const isUserOnline = useSocketStore((s) => s.isUserOnline)
  const addRoom = useSocketStore((s) => s.addRoom)
  const joinRoom = useSocketStore((s) => s.joinRoom)

  const [filterType, setFilterType] = useState('all')
  const [loadingRooms, setLoadingRooms] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const openChatWithHandledRef = useRef(null)

  // Bootstrap rooms if socket hasn't loaded yet
  useEffect(() => {
    const fetchChatRooms = async () => {
      setLoadingRooms(true)
      try {
        const response = await customFetch.get('/chat/rooms')
        const rooms = response.data.chatRooms || []
        if (useSocketStore.getState().roomsState.length === 0) {
          useSocketStore.getState().setRoomsState(rooms)
        }
      } catch (error) {
        console.error('Błąd pobierania pokoi:', error)
      } finally {
        setLoadingRooms(false)
      }
    }

    if (user) fetchChatRooms()
  }, [user])

  // Auto-open conversation when arriving from another screen (e.g. player profile)
  useEffect(() => {
    if (!openChatWith || loadingRooms || openChatWithHandledRef.current === openChatWith) return
    openChatWithHandledRef.current = openChatWith
    router.push({ pathname: '/(auth)/chat-room', params: { otherUserId: openChatWith } })
  }, [openChatWith, loadingRooms])

  // Filter rooms
  const filteredRooms = roomsState.filter((room) => {
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

  const getUnreadCount = (roomId) => {
    const roomData = roomsState.find((r) => r.roomId === roomId)
    return roomData?.unreadCount || 0
  }

  const handleRoomSelect = (room) => {
    router.push({ pathname: '/(auth)/chat-room', params: { roomId: room.roomId } })
  }

  const headerIconSize = ui.moderateScale(26, 0.35)
  const filterIconSize = ui.moderateScale(14, 0.3)
  const stateIconSize = ui.moderateScale(50, 0.3)
  const searchIconSize = ui.moderateScale(20, 0.35)

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name='chatbubbles' size={headerIconSize} color={COLORS.secondary} />
        <Text style={styles.headerText}>Czat</Text>
      </View>

      {/* Filters */}
      <View style={styles.filters}>
        <TouchableOpacity
          style={[styles.filterButton, filterType === 'all' && styles.filterButtonActive]}
          onPress={() => setFilterType('all')}
        >
          <Text style={[styles.filterText, filterType === 'all' && styles.filterTextActive]}>
            Wszystkie
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filterType === 'private' && styles.filterButtonActive]}
          onPress={() => setFilterType('private')}
        >
          <Ionicons
            name='chatbubble'
            size={filterIconSize}
            color={filterType === 'private' ? COLORS.background : COLORS.primary}
          />
          <Text style={[styles.filterText, filterType === 'private' && styles.filterTextActive]}>
            Prywatne
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filterType === 'group' && styles.filterButtonActive]}
          onPress={() => setFilterType('group')}
        >
          <Ionicons
            name='people'
            size={filterIconSize}
            color={filterType === 'group' ? COLORS.background : COLORS.primary}
          />
          <Text style={[styles.filterText, filterType === 'group' && styles.filterTextActive]}>
            Grupowe
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder='Szukaj...'
          placeholderTextColor={COLORS.gray}
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
        <Ionicons name='search' size={searchIconSize} color={COLORS.gray} style={styles.searchIcon} />
      </View>

      {/* Room list */}
      <ScrollView style={styles.roomList} showsVerticalScrollIndicator={false}>
        {filteredRooms.length > 0 ? (
          filteredRooms.map((room) => (
            <ChatRoomListItem
              key={room.roomId}
              room={room}
              currentUser={user}
              onPress={() => handleRoomSelect(room)}
              isSelected={false}
              unreadCount={getUnreadCount(room.roomId)}
              isUserOnline={isUserOnline}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name='chatbubbles-outline' size={stateIconSize} color={COLORS.gray} />
            <Text style={styles.emptyText}>
              Pusto? Znajdź swoich znajomych lub dołącz do wydarzenia!
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  )
}

export default Chat

const createStyles = (ui) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: COLORS.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: ui.verticalScale(20),
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
    headerText: {
      fontSize: ui.scaleFont(24, 0.45),
      fontFamily: 'Montserrat-Bold',
      color: COLORS.primary,
      marginLeft: ui.spacing(12, 0.35),
    },
    filters: {
      flexDirection: 'row',
      justifyContent: 'center',
      paddingHorizontal: ui.spacing(16),
      paddingVertical: ui.verticalScale(12),
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      gap: ui.spacing(8, 0.35),
    },
    filterButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: ui.spacing(12, 0.35),
      paddingVertical: ui.verticalScale(8),
      borderRadius: ui.moderateScale(16, 0.35),
      backgroundColor: '#494949',
      gap: ui.spacing(6, 0.35),
    },
    filterButtonActive: {
      backgroundColor: COLORS.secondary,
    },
    filterText: {
      fontSize: ui.scaleFont(13, 0.35),
      fontFamily: 'Lato-Regular',
      color: COLORS.primary,
    },
    filterTextActive: {
      color: COLORS.background,
      fontFamily: 'Montserrat-Bold',
    },
    searchContainer: {
      paddingHorizontal: ui.spacing(16),
      paddingVertical: ui.verticalScale(12),
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
    searchInput: {
      backgroundColor: COLORS.backgroundSecondary,
      borderRadius: ui.controlRadius,
      minHeight: ui.controlMinHeight,
      paddingHorizontal: ui.controlPaddingHorizontal,
      paddingVertical: ui.controlPaddingVertical,
      paddingRight: ui.spacing(40, 0.35),
      fontSize: ui.scaleFont(16, 0.35),
      fontFamily: 'Lato-Regular',
      color: COLORS.primary,
      borderWidth: 1,
      borderColor: COLORS.secondary,
    },
    searchIcon: {
      position: 'absolute',
      right: ui.spacing(28, 0.35),
      top: ui.verticalScale(24),
    },
    roomList: {
      flex: 1,
    },
    emptyState: {
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
  })
