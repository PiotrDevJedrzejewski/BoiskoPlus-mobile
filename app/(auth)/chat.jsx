import { useState, useEffect, useMemo, useRef } from 'react'
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import ChatRoomListItem from '../../components/ChatRoomListItem'
import customFetch from '../../assets/utils/customFetch'
import { useSocketStore } from '../../context/socketStore'
import { useAuth } from '../../context/AuthContext'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { dbg, useDebugMount } from '../../assets/utils/debugLogger'

import { useThemedStyles } from '../../context/themeStore'
import { SPACING, BORDER_RADIUS } from '../../Theme/StyleConstants'
import { scale, verticalScale, moderateScale, scaleFont } from '../../Theme/ScalableStyles'
import BottomSpacer from '../../components/BottomSpacer'

const Chat = () => {
  dbg('ChatRoomsList')
  useDebugMount('ChatRoomsList')

  const { styles, colors } = useThemedStyles(createStyles)

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


  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTextWrapper}>
          <Text style={styles.headerText}>Czat</Text>
        </View>
        {/* Search */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder='Szukaj...'
            placeholderTextColor={colors.thirdText}
            value={searchTerm}
            onChangeText={setSearchTerm}
            hitSlop={{ top: 12, bottom: 12, left: 16, right: 16 }}
          />
          <Ionicons name='search' size={16} color={colors.PrimaryGreen} style={styles.searchIcon} pointerEvents="box-none"/>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filters}>
        <Pressable
          style={[styles.filterButton, filterType === 'all' && styles.filterButtonActive]}
          onPress={() => setFilterType('all')}
        >
          <Text style={[styles.filterText, filterType === 'all' && styles.filterTextActive]}>
            Wszystkie
          </Text>
        </Pressable>
        <Pressable
          style={[styles.filterButton, filterType === 'private' && styles.filterButtonActive]}
          onPress={() => setFilterType('private')}
        >
          <Text style={[styles.filterText, filterType === 'private' && styles.filterTextActive]}>
            Prywatne
          </Text>
        </Pressable>
        <Pressable
          style={[styles.filterButton, filterType === 'group' && styles.filterButtonActive]}
          onPress={() => setFilterType('group')}
        >
          <Text style={[styles.filterText, filterType === 'group' && styles.filterTextActive]}>
            Grupowe
          </Text>
        </Pressable>
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
            <Ionicons name='chatbubbles-outline' size={20} color={colors.thirdText} />
            <Text style={styles.emptyText}>
              Pusto? Znajdź swoich znajomych lub dołącz do wydarzenia!
            </Text>
          </View>
        )}
        <BottomSpacer />
      </ScrollView>
    </View>
  )
}

export default Chat

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      // backgroundColor: COLORS.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: SPACING.md,
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      paddingHorizontal: SPACING.md,
    },
    headerTextWrapper: {},
    headerText: {
      fontSize: scaleFont(24, 0.45),
      fontFamily: 'Montserrat-Bold',
      color: colors.primaryText,
      marginLeft: SPACING.md,
    },
    filters: {
      flexDirection: 'row',
      justifyContent: 'center',
      paddingHorizontal: SPACING.md,
      paddingVertical: verticalScale(12),
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      gap: SPACING.md,
    },
    filterButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal:SPACING.md,
      paddingVertical: verticalScale(8),
      borderRadius: moderateScale(16, 0.35),
      backgroundColor: '#494949',
      gap: SPACING.md,
    },
    filterButtonActive: {
      backgroundColor: colors.PrimaryGreen,
    },
    filterText: {
      fontSize: scaleFont(13, 0.35),
      fontFamily: 'Lato-Regular',
      // color: COLORS.primary,
    },
    filterTextActive: {
      color: colors.background,
      fontFamily: 'Montserrat-Bold',
    },
    searchContainer: {
      paddingHorizontal: SPACING.md,
      paddingVertical: 2,
      borderRadius: BORDER_RADIUS.md,
      backgroundColor: colors.backgroundSecondary,
      flex: 1,
      marginLeft: SPACING.lg,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'relative',
    },
    searchInput: {
      // backgroundColor: COLORS.backgroundSecondary,
      paddingRight: SPACING.md,
      flex: 1,
      fontSize:scaleFont(16, 0.35),
      fontFamily: 'Lato-Regular',
      color: colors.primaryText,
    },
    searchIcon: {
      position: 'absolute',
      right: SPACING.md,
    },
    roomList: {
      flex: 1,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: SPACING.lg,
    },
    emptyText: {
      marginTop: SPACING.sm,
      fontSize: scaleFont(16, 0.35),
      fontFamily: 'Lato-Regular',
      color: colors.thirdText,
    },
  })
