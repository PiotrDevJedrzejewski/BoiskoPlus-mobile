import { useMemo } from 'react'
import { StyleSheet, Text, View, Pressable } from 'react-native'
import { COLORS } from '../constants/colors'
import { useResponsiveScale } from '../assets/utils/scaleUI.UX'

const CardDashboard = ({ icon, title, desc, onPress }) => {
  const ui = useResponsiveScale()
  const styles = useMemo(() => createStyles(ui), [ui])

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.iconContainer}>{icon}</View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.desc}>{desc}</Text>
      </View>
    </Pressable>
  )
}

export default CardDashboard

const createStyles = (ui) => StyleSheet.create({
  card: {
    backgroundColor: COLORS.backgroundSecondary,
    flexDirection: 'row',
    alignItems: 'center',
    padding: ui.spacing(16),
    marginBottom: ui.verticalScale(16),
    marginHorizontal: ui.spacing(10, 0.35),
    borderRadius: ui.moderateScale(16, 0.35),
    position: 'relative',
  },
  iconContainer: {
    marginRight: ui.spacing(16),
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: ui.scaleFont(22, 0.45),
    fontFamily: 'BarlowCondensed-Bold',
    color: COLORS.primary,
    marginBottom: ui.verticalScale(4),
  },
  desc: {
    fontSize: ui.scaleFont(14, 0.35),
    fontFamily: 'Inter-Regular',
    color: COLORS.primary,
    opacity: 0.7,
  },
})
