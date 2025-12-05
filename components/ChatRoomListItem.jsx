import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '../constants/colors'
import { getGameTypeIcon } from '../assets/utils/gameTypeIcons'

const defaultAvatar = require('../assets/images/defaultAvatar.png')

const ChatRoomListItem = ({
  room,
  currentUser,
  onPress,
  isSelected,
  unreadCount = 0,
}) => {
  let displayName = ''
  let avatar = null
  let gameTypeIcon = null

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
    displayName = otherUser?.nickName || 'Użytkownik'
    avatar =
      otherUser?.avatarUrl || otherUser?.avatar
        ? { uri: otherUser.avatarUrl || otherUser.avatar }
        : defaultAvatar
  }

  return (
    <TouchableOpacity
      style={[styles.item, isSelected && styles.itemSelected]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        {/* Notification badge */}
        {unreadCount > 0 && (
          <View style={styles.notification}>
            <Text style={styles.notificationText}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </Text>
          </View>
        )}

        {/* Avatar */}
        <View style={styles.avatarWrapper}>
          <Image source={avatar} style={styles.avatar} />
          {room.roomType === 'group' && (
            <View style={styles.gameTypeIconWrapper}>{gameTypeIcon}</View>
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
    top: 8,
    right: 8,
    backgroundColor: 'red',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  notificationText: {
    color: COLORS.white,
    fontSize: 10,
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
