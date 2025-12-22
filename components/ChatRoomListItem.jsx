import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '../constants/colors'
import { getGameTypeIcon } from '../assets/utils/gameTypeIcons'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated'
import { useEffect } from 'react'

const defaultAvatar = require('../assets/images/defaultAvatar.png')

const ChatRoomListItem = ({
  room,
  currentUser,
  onPress,
  isSelected,
  unreadCount = 0,
  isUserOnline = () => false,
}) => {
  let displayName = ''
  let avatar = null
  let gameTypeIcon = null
  let otherUserId = null

  if (room.roomType === 'group') {
    displayName = room.eventName || 'Wydarzenie'
    avatar = room.eventOwnerAvatarUrl
      ? { uri: room.eventOwnerAvatarUrl }
      : defaultAvatar
    const gameType = room.gameType || 'other'
    gameTypeIcon = getGameTypeIcon(gameType)
  } else {
    const otherUser = room.participants?.find(
      (p) => String(p._id) !== String(currentUser?._id)
    )
    otherUserId = otherUser?._id
    displayName = otherUser?.nickName || 'Użytkownik'
    avatar =
      otherUser?.avatarUrl || otherUser?.avatar
        ? { uri: otherUser.avatarUrl || otherUser.avatar }
        : defaultAvatar
  }

  const scale = useSharedValue(1)

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.15, {
          duration: 500,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(1, {
          duration: 500,
          easing: Easing.inOut(Easing.ease),
        })
      ),
      -1,
      false
    )
  }, [])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  return (
    <TouchableOpacity
      style={[styles.item, isSelected && styles.itemSelected]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        {/* Notification badge */}
        {unreadCount > 0 && (
          <Animated.View style={[styles.notification, animatedStyle]}>
            <Text style={styles.notificationText}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </Text>
          </Animated.View>
        )}

        {/* Avatar */}
        <View style={styles.avatarWrapper}>
          <Image source={avatar} style={styles.avatar} />
          {room.roomType === 'group' && (
            <View style={styles.gameTypeIconWrapper}>{gameTypeIcon}</View>
          )}
          {room.roomType === 'private' && otherUserId && (
            <View
              style={[
                styles.onlineStatus,
                isUserOnline(otherUserId) ? styles.online : styles.offline,
              ]}
            />
          )}
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Text style={styles.nickname} numberOfLines={1}>
            {displayName}
          </Text>
          {room.roomType === 'group' && room.eventOwnerNick && (
            <Text style={styles.ownerName}>
              Właściciel: {room.eventOwnerNick}
            </Text>
          )}
          {room.lastMessage && (
            <Text style={styles.lastMessage} numberOfLines={1}>
              Ostatnia: {room.lastMessage.message}
            </Text>
          )}
        </View>

        {/* Arrow */}
        <Ionicons name='chevron-forward' size={20} color={COLORS.gray} />
      </View>
    </TouchableOpacity>
  )
}

export default ChatRoomListItem

const styles = StyleSheet.create({
  item: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  itemSelected: {
    backgroundColor: 'rgba(255, 207, 0, 0.1)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 16,
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.secondary,
  },
  notification: {
    position: 'absolute',
    top: '50%',
    right: 40,
    backgroundColor: 'red',
    borderRadius: '50%',
    width: 25,
    height: 25,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  notificationText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  avatarWrapper: {
    position: 'relative',
    width: 50,
    height: 50,
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 12,
  },
  gameTypeIconWrapper: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    transform: [{ scale: 0.5 }],
    transformOrigin: 'bottom right',
  },
  onlineStatus: {
    position: 'absolute',
    transformOrigin: 'bottom left',
    bottom: 0,
    left: 0,
    width: 12,
    height: 12,
    borderRadius: '50%',
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  online: {
    backgroundColor: '#4caf50',
  },
  offline: {
    backgroundColor: COLORS.gray,
  },
  info: {
    flex: 1,
  },
  nickname: {
    fontSize: 16,
    fontFamily: 'Montserrat-Bold',
    color: COLORS.secondary,
    marginBottom: 2,
  },
  ownerName: {
    fontSize: 11,
    fontFamily: 'Lato-Regular',
    color: COLORS.gray,
    marginBottom: 2,
  },
  lastMessage: {
    fontSize: 12,
    fontFamily: 'Lato-Regular',
    color: COLORS.primary,
  },
})
