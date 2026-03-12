import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '../constants/colors'
import { useResponsiveScale } from '../assets/utils/scaleUI.UX'

const defaultAvatar = require('../assets/images/defaultAvatar.png')

const EditEventUserCard = ({
  user,
  stats,
  status,
  onAccept,
  onReject,
  loading = false,
}) => {
  const ui = useResponsiveScale()
  const styles = createStyles(ui)
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
            size={ui.moderateScale(20, 0.35)}
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
            size={ui.moderateScale(20, 0.35)}
            color={status === 'rejected' ? COLORS.gray : '#fff'}
          />
        </TouchableOpacity>
      </View>
    </View>
  )
}

export default EditEventUserCard

const createStyles = (ui) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: ui.moderateScale(12, 0.35),
    padding: ui.spacing(12, 0.35),
    marginBottom: ui.verticalScale(10),
  },
  avatar: {
    width: ui.scale(50),
    height: ui.scale(50),
    borderRadius: ui.moderateScale(10, 0.35),
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  infoContainer: {
    flex: 1,
    marginLeft: ui.spacing(12, 0.35),
  },
  nickname: {
    fontSize: ui.scaleFont(14, 0.35),
    fontFamily: 'Montserrat-Bold',
    color: COLORS.primary,
  },
  name: {
    fontSize: ui.scaleFont(12, 0.3),
    fontFamily: 'Lato-Regular',
    color: COLORS.gray,
    marginTop: ui.verticalScale(2),
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: ui.verticalScale(6),
    gap: ui.spacing(10, 0.35),
  },
  statText: {
    fontSize: ui.scaleFont(11, 0.3),
    fontFamily: 'Lato-Regular',
    color: COLORS.gray,
  },
  statusBadge: {
    paddingHorizontal: ui.spacing(8, 0.35),
    paddingVertical: ui.verticalScale(4),
    borderRadius: ui.moderateScale(8, 0.35),
    marginRight: ui.spacing(8, 0.35),
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
    fontSize: ui.scaleFont(10, 0.25),
    fontFamily: 'Lato-Regular',
    color: COLORS.primary,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: ui.spacing(8, 0.35),
  },
  button: {
    width: ui.moderateScale(36, 0.35),
    height: ui.moderateScale(36, 0.35),
    borderRadius: ui.moderateScale(8, 0.35),
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
