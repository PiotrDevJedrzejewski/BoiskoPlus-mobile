import { StyleSheet, Text, View, TouchableOpacity, Switch } from 'react-native'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { useThemedStyles } from '../../context/themeStore'
import { SPACING, BORDER_RADIUS } from '../../Theme/StyleConstants'
import { verticalScale, moderateScale, scaleFont } from '../../Theme/ScalableStyles'

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
  const { styles, colors } = useThemedStyles(createStyles)
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
          size={moderateScale(22, 0.35)}
          color={danger ? colors.Danger : colors.PrimaryGreen}
        />
        <Text style={[styles.settingRowLabel, danger && styles.dangerText]}>
          {label}
        </Text>
      </View>
      {isSwitch ? (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          trackColor={{ false: '#555', true: colors.border }}
          thumbColor={switchValue ? colors.PrimaryGreen : '#f4f3f4'}
          disabled={disabled}
        />
      ) : (
        <View style={styles.settingRowRight}>
          {value && <Text style={styles.settingRowValue}>{value}</Text>}
          <Ionicons name='chevron-forward' size={moderateScale(20, 0.35)} color={colors.thirdText} />
        </View>
      )}
    </RowContainer>
  )
}

export default SettingRow

const createStyles = (colors) => StyleSheet.create({
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: verticalScale(14),
    paddingHorizontal: SPACING.md,
    marginBottom: verticalScale(8),
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
    fontSize: scaleFont(16, 0.35),
    fontFamily: 'Lato-Regular',
    color: colors.primaryText,
    marginLeft: SPACING.md,
  },
  dangerText: {
    color: colors.Danger,
  },
  settingRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingRowValue: {
    fontSize: scaleFont(14, 0.35),
    fontFamily: 'Lato-Regular',
    color: colors.thirdText,
    marginRight: SPACING.sm,
  },
})
