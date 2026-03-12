import { StyleSheet, Text, View, TouchableOpacity, Switch } from 'react-native'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { COLORS } from '../../constants/colors'
import { useResponsiveScale } from '../../assets/utils/scaleUI.UX'

const SettingRow = ({
  icon,
  iconFamily = 'ionicons',
  label,
  value,
  onPress,
  isSwitch = false,
  switchValue,
  onSwitchChange,
  disabled = false,
  danger = false,
}) => {
  const ui = useResponsiveScale()
  const styles = createStyles(ui)
  const IconComponent =
    iconFamily === 'material' ? MaterialCommunityIcons : Ionicons

  const RowContainer = isSwitch ? View : TouchableOpacity
  const containerProps = isSwitch
    ? {}
    : { onPress, activeOpacity: 1, disabled }

  return (
    <RowContainer
      style={[styles.settingRow, disabled && styles.settingRowDisabled]}
      {...containerProps}
    >
      <View style={styles.settingRowLeft}>
        <IconComponent
          name={icon}
          size={ui.moderateScale(22, 0.35)}
          color={danger ? COLORS.error : COLORS.secondary}
        />
        <Text style={[styles.settingRowLabel, danger && styles.dangerText]}>
          {label}
        </Text>
      </View>
      {isSwitch ? (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          trackColor={{ false: '#555', true: COLORS.third }}
          thumbColor={switchValue ? COLORS.secondary : '#f4f3f4'}
          disabled={disabled}
        />
      ) : (
        <View style={styles.settingRowRight}>
          {value && <Text style={styles.settingRowValue}>{value}</Text>}
          <Ionicons name='chevron-forward' size={ui.moderateScale(20, 0.35)} color={COLORS.gray} />
        </View>
      )}
    </RowContainer>
  )
}

export default SettingRow

const createStyles = (ui) => StyleSheet.create({
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: ui.moderateScale(12, 0.35),
    paddingVertical: ui.verticalScale(14),
    paddingHorizontal: ui.spacing(16),
    marginBottom: ui.verticalScale(8),
  },
  settingRowDisabled: {
    opacity: 0.5,
  },
  settingRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingRowLabel: {
    fontSize: ui.scaleFont(16, 0.35),
    fontFamily: 'Lato-Regular',
    color: COLORS.primary,
    marginLeft: ui.spacing(12, 0.35),
  },
  dangerText: {
    color: COLORS.error,
  },
  settingRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingRowValue: {
    fontSize: ui.scaleFont(14, 0.35),
    fontFamily: 'Lato-Regular',
    color: COLORS.gray,
    marginRight: ui.spacing(8, 0.35),
  },
})
