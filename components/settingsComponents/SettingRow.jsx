import { StyleSheet, Text, View, TouchableOpacity, Switch } from 'react-native'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { COLORS } from '../../constants/colors'

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
          size={22}
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
          <Ionicons name='chevron-forward' size={20} color={COLORS.gray} />
        </View>
      )}
    </RowContainer>
  )
}

export default SettingRow

const styles = StyleSheet.create({
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 8,
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
    fontSize: 16,
    fontFamily: 'Lato-Regular',
    color: COLORS.primary,
    marginLeft: 12,
  },
  dangerText: {
    color: COLORS.error,
  },
  settingRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingRowValue: {
    fontSize: 14,
    fontFamily: 'Lato-Regular',
    color: COLORS.gray,
    marginRight: 8,
  },
})
