import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { useThemedStyles } from '../context/themeStore'
import { SPACING, BORDER_RADIUS } from '../Theme/StyleConstants'
import { scale, verticalScale, moderateScale, scaleFont } from '../Theme/ScalableStyles'

const defaultAvatar = require('../assets/images/defaultAvatar.png')

const PlayerCard = ({ playerInfo, onPress }) => {
  const router = useRouter()
  const { styles } = useThemedStyles(createStyles)

  const handlePress = () => {
    if (onPress) {
      onPress()
    } else if (playerInfo?._id) {
      router.push(`/(auth)/profile/profile-otherUser?id=${playerInfo._id}`)
    }
  }

  const avatar = playerInfo?.avatarUrl
    ? { uri: playerInfo.avatarUrl }
    : defaultAvatar

  const stats = playerInfo?.userStats || {
    gamesPlayed: 0,
    eventsOrganized: 0,
    totalLikes: 0,
  }

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        <Image source={avatar} style={styles.avatar} />
      </View>

      {/* Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoText} numberOfLines={1}>
          Nick: {playerInfo?.nickName || '?'}
        </Text>
        <Text style={styles.infoText} numberOfLines={1}>
          Imię: {playerInfo?.name || '?'}
        </Text>
        <Text style={styles.infoText} numberOfLines={1}>
          Nazwisko: {playerInfo?.surname || '?'}
        </Text>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          Zorganizowano: {stats.eventsOrganized}
        </Text>
        <Text style={styles.statsText}>Rozegrane: {stats.gamesPlayed}</Text>
        <Text style={styles.statsText}>Polubień: {stats.totalLikes}</Text>
      </View>
    </TouchableOpacity>
  )
}

export default PlayerCard

const createStyles = (colors) => StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginVertical: verticalScale(8),
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.GlowGreen,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarContainer: {
    marginRight: SPACING.md,
  },
  avatar: {
    width: scale(70),
    height: scale(70),
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    borderColor: colors.primaryText,
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  infoText: {
    fontSize: scaleFont(13, 0.35),
    fontFamily: 'Lato-Regular',
    color: colors.primaryText,
  },
  statsContainer: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: 4,
  },
  statsText: {
    fontSize: scaleFont(12, 0.3),
    fontFamily: 'Lato-Regular',
    color: colors.thirdText,
  },
})
