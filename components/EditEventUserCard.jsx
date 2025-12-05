import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '../constants/colors'

const defaultAvatar = require('../assets/images/defaultAvatar.png')

const EditEventUserCard = ({
  user,
  stats,
  status,
  onAccept,
  onReject,
  loading = false,
}) => {
  const avatar = user?.avatarUrl ? { uri: user.avatarUrl } : defaultAvatar

  return (
    <View style={styles.container}>
      {/* Avatar */}
      <Image source={avatar} style={styles.avatar} />

      {/* Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.nickname} numberOfLines={1}>
          {user?.nickName || '?'}
        </Text>
        <Text style={styles.name} numberOfLines={1}>
          {user?.name} {user?.surname}
        </Text>

        {/* Stats */}
        <View style={styles.statsRow}>
          <Text style={styles.statText}>🎮 {stats?.gamesPlayed || 0}</Text>
          <Text style={styles.statText}>📅 {stats?.eventsOrganized || 0}</Text>
          <Text style={styles.statText}>❤️ {stats?.totalLikes || 0}</Text>
        </View>
      </View>

      {/* Status badge */}
      {status && (
        <View
          style={[
            styles.statusBadge,
            status === 'accepted' && styles.statusAccepted,
            status === 'rejected' && styles.statusRejected,
            status === 'interested' && styles.statusInterested,
          ]}
        >
          <Text style={styles.statusText}>
            {status === 'accepted'
              ? 'Zaakceptowany'
              : status === 'rejected'
              ? 'Odrzucony'
              : 'Zainteresowany'}
          </Text>
        </View>
      )}

      {/* Action buttons */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={[
            styles.button,
            styles.acceptButton,
            status === 'accepted' && styles.buttonDisabled,
          ]}
          onPress={onAccept}
          disabled={status === 'accepted' || loading}
          activeOpacity={0.7}
        >
          <Ionicons
            name='checkmark'
            size={20}
            color={status === 'accepted' ? COLORS.gray : COLORS.background}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.rejectButton,
            status === 'rejected' && styles.buttonDisabled,
          ]}
          onPress={onReject}
          disabled={status === 'rejected' || loading}
          activeOpacity={0.7}
        >
          <Ionicons
            name='close'
            size={20}
            color={status === 'rejected' ? COLORS.gray : '#fff'}
          />
        </TouchableOpacity>
      </View>
    </View>
  )
}

export default EditEventUserCard

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  infoContainer: {
    flex: 1,
    marginLeft: 12,
  },
  nickname: {
    fontSize: 14,
    fontFamily: 'Montserrat-Bold',
    color: COLORS.primary,
  },
  name: {
    fontSize: 12,
    fontFamily: 'Lato-Regular',
    color: COLORS.gray,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 6,
    gap: 10,
  },
  statText: {
    fontSize: 11,
    fontFamily: 'Lato-Regular',
    color: COLORS.gray,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
  },
  statusAccepted: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  statusRejected: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  statusInterested: {
    backgroundColor: 'rgba(255, 207, 0, 0.2)',
  },
  statusText: {
    fontSize: 10,
    fontFamily: 'Lato-Regular',
    color: COLORS.primary,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: COLORS.third,
  },
  rejectButton: {
    backgroundColor: COLORS.error,
  },
  buttonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
})
