import { StyleSheet, Text, View, Pressable, Image } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { getGameTypeIcon } from '../assets/utils/gameTypeIcons'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated'
import { useEffect, useMemo} from 'react'

import { useThemedStyles } from '../context/themeStore'
import { SPACING, BORDER_RADIUS } from '../Theme/StyleConstants'
import { scale, verticalScale, moderateScale, scaleFont } from '../Theme/ScalableStyles'

const defaultAvatar = require('../assets/images/defaultAvatar.png')

const ChatRoomListItem = ({
  room,
  currentUser,
  onPress,
  isSelected,
  unreadCount = 0,
  isUserOnline = () => false,
}) => {

  const { styles, colors } = useThemedStyles(createStyles)

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
    gameTypeIcon = getGameTypeIcon(gameType, 16, colors.PrimaryGreen)
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
    <Pressable
      style={[styles.item, isSelected && styles.itemSelected]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        {/* Notification badge */}
        {unreadCount > 0 && (
          <Animated.View style={[styles.notification, animatedStyle]} pointerEvents='box-none'>
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
        <Ionicons name='chevron-forward' size={moderateScale(20, 0.35)} color={colors.thirdText} />
      </View>
    </Pressable>
  )
}

export default ChatRoomListItem

const createStyles = (colors) =>
  StyleSheet.create({
  item: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  itemSelected: {
    backgroundColor: 'rgba(255, 207, 0, 0.1)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.GlowGreen,
  },
  notification: {
    position: 'absolute',
    right: "15%",
    backgroundColor: colors.Danger,
    borderRadius: "50%",
    width: moderateScale(25, 0.35),
    height: moderateScale(25, 0.35),
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  notificationText: {
    color: colors.primaryText,
    fontSize: scaleFont(14, 0.35),
    fontWeight: 'bold',
  },
  avatarWrapper: {
    position: 'relative',
    width: scale(52),
    height: scale(52),
    marginRight: SPACING.md,
  },
  avatar: {
    width: scale(50),
    height: scale(50),
    borderRadius: moderateScale(12, 0.35),
  },
  gameTypeIconWrapper: {
    position: 'absolute',
    bottom: 0,
    right:  0,
    width: scale(24),
    height: scale(24),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: "#292929",
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.xs,

  },
  avatarGroupBorder: {
    borderWidth: 1,
    // borderColor: COLORS.secondary,
    borderRadius: BORDER_RADIUS.md,
  },
  onlineStatus: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: scale(12),
    height: scale(12),
    borderRadius: "50%",
    borderWidth: 1,
    borderColor: colors.thirdText,
  },
  online: {
    backgroundColor: colors.OnlineDot,
  },
  offline: {
    backgroundColor: colors.StarEmpty,
  },
  info: {
    flex: 1,
  },
  nickname: {
    fontSize: scaleFont(16, 0.35),
    fontFamily: 'Montserrat-Bold',
    color: colors.primaryText,
    marginBottom: SPACING.xs,
  },
  ownerName: {
    fontSize: scaleFont(11, 0.3),
    fontFamily: 'Lato-Regular',
    color: colors.thirdText,
    marginBottom: SPACING.xs,
  },
  lastMessage: {
    fontSize: scaleFont(12, 0.3),
    fontFamily: 'Lato-Regular',
    color: colors.primaryText,
  },
})
