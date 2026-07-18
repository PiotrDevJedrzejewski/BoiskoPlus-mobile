import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useThemedStyles } from '../context/themeStore'
import { SPACING } from '../Theme/StyleConstants'
import { scale, verticalScale, moderateScale, scaleFont } from '../Theme/ScalableStyles'
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
  const { styles } = useThemedStyles(createStyles)
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
  const { styles } = useThemedStyles(createStyles)
  return (
    <View style={styles.playerCardWrapper}>
      <PlayerCard playerInfo={player} />
      {actions.length > 0 && <ActionButtons actions={actions} />}
    </View>
  )
}

export default PlayerCardWithActions

const createStyles = (colors) => StyleSheet.create({
	playerCardWrapper: {
		position: 'relative',
		paddingBottom: verticalScale(6),
	},
	buttonWrapper: {
		position: 'absolute',
		right: SPACING.xs,
		bottom: verticalScale(-3),
		flexDirection: 'row',
		alignItems: 'center',
	},
	actionChip: {
		minWidth: scale(88),
		paddingVertical: verticalScale(7),
		paddingHorizontal: SPACING.md,
		borderRadius: moderateScale(999, 0.35),
		backgroundColor: 'rgba(0, 0, 0, 0.28)',
		borderWidth: 1,
		borderColor: 'rgba(255, 255, 255, 0.15)',
		alignItems: 'center',
        marginLeft: SPACING.md,
	},
	actionChipPrimary: {
		backgroundColor: colors.PrimaryGreen,
		borderColor: colors.PrimaryGreen,
	},
    actionChipSecondary: {
        backgroundColor: colors.primaryText,
        borderColor: colors.primaryText,
    },
	actionChipText: {
		fontSize: scaleFont(12, 0.3),
		fontFamily: 'Lato-Regular',
		color: colors.background,
	},
	actionChipTextPrimary: {
		color: colors.background,
	},
    actionChipTextSecondary: {
        color: '#000000',
    },
})
