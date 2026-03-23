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
import { useResponsiveScale } from '../assets/utils/scaleUI.UX'

const defaultAvatar = require('../assets/images/defaultAvatar.png')

const ChatRoomListItem = ({
  room,
  currentUser,
  onPress,
  isSelected,
  unreadCount = 0,
  isUserOnline = () => false,
}) => {
  const ui = useResponsiveScale()
  const styles = createStyles(ui)
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
        <View style={[styles.avatarWrapper, room.roomType === 'group' && styles.avatarGroupBorder]}>
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
        <Ionicons name='chevron-forward' size={ui.moderateScale(20, 0.35)} color={COLORS.gray} />
      </View>
    </TouchableOpacity>
  )
}

export default ChatRoomListItem

const createStyles = (ui) => StyleSheet.create({
  item: {
    paddingHorizontal: ui.spacing(16),
    paddingVertical: ui.verticalScale(8),
  },
  itemSelected: {
    backgroundColor: 'rgba(255, 207, 0, 0.1)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: ui.moderateScale(16, 0.35),
    padding: ui.spacing(12, 0.35),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.secondary,
  },
  notification: {
    position: 'absolute',
    top: '50%',
    right: ui.spacing(40, 0.45),
    backgroundColor: 'red',
    borderRadius: ui.moderateScale(12.5, 0.3),
    width: ui.moderateScale(25, 0.35),
    height: ui.moderateScale(25, 0.35),
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    marginTop: -ui.moderateScale(12.5, 0.35),
  },
  notificationText: {
    color: COLORS.white,
    fontSize: ui.scaleFont(14, 0.35),
    fontWeight: 'bold',
  },
  avatarWrapper: {
    position: 'relative',
    width: ui.scale(52),
    height: ui.scale(52),
    marginRight: ui.spacing(12, 0.35),
  },
  avatar: {
    width: ui.scale(50),
    height: ui.scale(50),
    borderRadius: ui.moderateScale(12, 0.35),
  },
  gameTypeIconWrapper: {
    position: 'absolute',
    bottom: -ui.verticalScale(18),
    right: -ui.spacing(18, 0.25),
    transform: [{ scale: 0.55 }],
    backgroundColor: "#292929",
    borderRadius: ui.moderateScale(18, 0.35),
    padding: ui.spacing(2, 0.35),
    
  },
  avatarGroupBorder: {
    borderWidth: 1,
    borderColor: COLORS.secondary,
    borderRadius: ui.moderateScale(12, 0.35),
  },
  onlineStatus: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: ui.scale(12),
    height: ui.scale(12),
    borderRadius: ui.moderateScale(6, 0.25),
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
    fontSize: ui.scaleFont(16, 0.35),
    fontFamily: 'Montserrat-Bold',
    color: COLORS.secondary,
    marginBottom: ui.verticalScale(2),
  },
  ownerName: {
    fontSize: ui.scaleFont(11, 0.3),
    fontFamily: 'Lato-Regular',
    color: COLORS.gray,
    marginBottom: ui.verticalScale(2),
  },
  lastMessage: {
    fontSize: ui.scaleFont(12, 0.3),
    fontFamily: 'Lato-Regular',
    color: COLORS.primary,
  },
})
