import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { COLORS } from '../constants/colors'
import { useResponsiveScale } from '../assets/utils/scaleUI.UX'

const FilterButton = ({ icon, label, isActive, onPress, color }) => {
  const ui = useResponsiveScale()
  const styles = createStyles(ui)

  return (
    <TouchableOpacity
      style={[styles.filterButton, isActive && styles.filterButtonActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {icon}
      <Text style={[styles.filterLabel, isActive && styles.filterLabelActive]}>
        {label}
      </Text>
      <View
        style={[
          styles.filterIndicator,
          isActive
            ? { backgroundColor: color || COLORS.secondary }
            : styles.filterIndicatorOff,
        ]}
      />
    </TouchableOpacity>
  )
}

const createStyles = (ui) => StyleSheet.create({
  filterButton: {
    alignItems: 'center',
    paddingHorizontal: ui.spacing(12, 0.35),
    paddingVertical: ui.verticalScale(8),
    minWidth: ui.scale(80),
  },
  filterButtonActive: {},
  filterLabel: {
    fontSize: ui.scaleFont(12, 0.3),
    fontFamily: 'Lato-Regular',
    color: COLORS.primary,
    marginTop: ui.verticalScale(4),
    opacity: 0.5,
  },
  filterLabelActive: {
    opacity: 1,
  },
  filterIndicator: {
    height: ui.verticalScale(2),
    width: ui.scale(30),
    borderRadius: ui.moderateScale(1, 0.2),
    marginTop: ui.verticalScale(6),
  },
  filterIndicatorOff: {
    backgroundColor: '#4b4b4b',
    width: ui.scale(15),
  },
})

export default FilterButton