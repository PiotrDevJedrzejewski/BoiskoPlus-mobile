import { useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { COLORS } from '../constants/colors'
import PlayerCardWithActions from './PlayerCardWithActions'
import { useResponsiveScale } from '../assets/utils/scaleUI.UX'

const STATUS_LABELS = {
  accepted: 'Zaakceptowany',
  rejected: 'Odrzucony',
  interested: 'Zainteresowany',
  finished: 'Zakończono',
}

const EditEventUserCard = ({
  user,
  stats,
  status,
  onAccept,
  onReject,
  loading = false,
}) => {
  const ui = useResponsiveScale()
  const styles = useMemo(() => createStyles(ui), [ui])
  const isFinished = status === 'finished'

  const player = {
    ...user,
    userStats: {
      gamesPlayed: stats?.gamesPlayed || 0,
      eventsOrganized: stats?.eventsOrganized || 0,
      totalLikes: stats?.totalLikes || 0,
    },
  }

  const actions = isFinished
    ? []
    : [
        {
          text: 'Odrzuć',
          type: 'secondary',
          handler: status === 'rejected' || loading ? () => {} : onReject,
        },
        {
          text: 'Akceptuj',
          type: 'primary',
          handler: status === 'accepted' || loading ? () => {} : onAccept,
        },
      ]

  return (
    <View style={styles.container}>
      <PlayerCardWithActions player={player} actions={actions} />
      {status ? (
        <View style={styles.footer}>
          <Text
            style={[
              styles.statusText,
              status === 'accepted' && styles.statusAccepted,
              status === 'rejected' && styles.statusRejected,
              status === 'interested' && styles.statusInterested,
              status === 'finished' && styles.statusFinished,
            ]}
          >
            {STATUS_LABELS[status]}
          </Text>
        </View>
      ) : null}
    </View>
  )
}

export default EditEventUserCard

const createStyles = (ui) => StyleSheet.create({
  container: {
    marginBottom: ui.verticalScale(10),
  },
  footer: {
    marginTop: ui.verticalScale(-5),
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
  statusFinished: {
    backgroundColor: 'rgba(136, 136, 136, 0.22)',
  },
  statusText: {
    alignSelf: 'flex-start',
    fontSize: ui.scaleFont(12, 0.25),
    fontFamily: 'Lato-Regular',
    color: COLORS.primary,
    paddingHorizontal: ui.spacing(8, 0.35),
    paddingVertical: ui.verticalScale(4),
    borderRadius: ui.moderateScale(8, 0.35),
  },
})
