import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { COLORS } from '../constants/colors'

const defaultAvatar = require('../assets/images/defaultAvatar.png')

const PlayerCard = ({ playerInfo, onPress }) => {
  const router = useRouter()

  const handlePress = () => {
    if (onPress) {
      onPress()
    } else if (playerInfo?._id) {
      router.push(`/(main)/(tabs)/(hidden)/profile-user?id=${playerInfo._id}`)
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

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.secondary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  infoText: {
    fontSize: 13,
    fontFamily: 'Lato-Regular',
    color: COLORS.primary,
  },
  statsContainer: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: 4,
  },
  statsText: {
    fontSize: 12,
    fontFamily: 'Lato-Regular',
    color: COLORS.gray,
  },
})
