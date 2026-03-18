import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { COLORS } from '../constants/colors'
import { useResponsiveScale } from '../assets/utils/scaleUI.UX'
import PlayerCard from './PlayerCard'

const getChipStyles = (type, styles) => {
  switch (type) {
    case 'primary':
      return { chip: styles.actionChipPrimary, text: styles.actionChipTextPrimary }
    case 'secondary':
      return { chip: styles.actionChipSecondary, text: styles.actionChipTextSecondary }
    default:
      return { chip: {}, text: {} }
  }
}

const ActionButtons = ({ actions = [] }) => {
  const ui = useResponsiveScale()
  const styles = createStyles(ui)
  return (
    <View style={styles.buttonWrapper}>
      {actions.map((action) => {
        const { chip, text } = getChipStyles(action.type, styles)
        return (
          <TouchableOpacity
            key={action.text}
            style={[styles.actionChip, chip]}
            onPress={action.handler}
            activeOpacity={0.8}
          >
            <Text style={[styles.actionChipText, text]}>{action.text}</Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

const PlayerCardWithActions = ({ player, actions = [] }) => {
  const ui = useResponsiveScale()
  const styles = createStyles(ui)
  return (
    <View style={styles.playerCardWrapper}>
      <PlayerCard playerInfo={player} />
      {actions.length > 0 && <ActionButtons actions={actions} />}
    </View>
  )
}

export default PlayerCardWithActions

const createStyles = (ui) => StyleSheet.create({
	playerCardWrapper: {
		position: 'relative',
		paddingBottom: ui.verticalScale(6),
	},
	buttonWrapper: {
		position: 'absolute',
		right: ui.spacing(6, 0.35),
		bottom: ui.verticalScale(-3),
		flexDirection: 'row',
		alignItems: 'center',
        // backgroundColor: 'red'
	},
	actionChip: {
		minWidth: ui.scale(88),
		paddingVertical: ui.verticalScale(7),
		paddingHorizontal: ui.spacing(14, 0.35),
		borderRadius: ui.moderateScale(999, 0.35),
		backgroundColor: 'rgba(0, 0, 0, 0.28)',
		borderWidth: 1,
		borderColor: 'rgba(255, 255, 255, 0.15)',
		alignItems: 'center',
        marginLeft: ui.spacing(15, 0.35),
	},
	actionChipPrimary: {
		backgroundColor: COLORS.secondary,
		borderColor: COLORS.secondary,
	},
    actionChipSecondary: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
	actionChipText: {
		fontSize: ui.scaleFont(12, 0.3),
		fontFamily: 'ObjectFont',
		color: COLORS.background,
	},
	actionChipTextPrimary: {
		color: COLORS.background,
	},
    actionChipTextSecondary: {
        color: COLORS.black,
    },
})
