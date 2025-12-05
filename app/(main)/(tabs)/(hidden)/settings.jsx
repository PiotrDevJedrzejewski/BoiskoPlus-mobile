import { useState } from 'react'
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
} from 'react-native'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { COLORS } from '../../../../constants/colors'

const SettingSection = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
)

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

  return (
    <TouchableOpacity
      style={[styles.settingRow, disabled && styles.settingRowDisabled]}
      onPress={isSwitch ? undefined : onPress}
      activeOpacity={isSwitch ? 1 : 0.7}
      disabled={disabled}
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
    </TouchableOpacity>
  )
}

const Settings = () => {
  const router = useRouter()

  // Ustawienia powiadomień
  const [chatNotifications, setChatNotifications] = useState(true)
  const [eventNotifications, setEventNotifications] = useState(true)

  // Ustawienia mapy
  const [mapTheme, setMapTheme] = useState('dark') // 'light' | 'dark'

  // Loading states
  const [isClearing, setIsClearing] = useState(false)

  const handleMapThemeChange = () => {
    Alert.alert('Wybierz motyw mapy', '', [
      {
        text: 'Jasny',
        onPress: () => setMapTheme('light'),
      },
      {
        text: 'Ciemny',
        onPress: () => setMapTheme('dark'),
      },
      { text: 'Anuluj', style: 'cancel' },
    ])
  }

  const handleClearLocation = () => {
    Alert.alert(
      'Usuń lokalizację',
      'Czy na pewno chcesz usunąć zapisaną lokalizację?',
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Usuń',
          style: 'destructive',
          onPress: () => {
            // W przyszłości: API call
            Alert.alert('Sukces', 'Lokalizacja została usunięta')
          },
        },
      ]
    )
  }

  const handleClearChatHistory = () => {
    Alert.alert(
      'Wyczyść historię czatu',
      'Czy na pewno chcesz usunąć całą historię czatu? Ta operacja jest nieodwracalna.',
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Wyczyść',
          style: 'destructive',
          onPress: async () => {
            setIsClearing(true)
            // Symulacja API call
            await new Promise((resolve) => setTimeout(resolve, 500))
            setIsClearing(false)
            Alert.alert('Sukces', 'Historia czatu została wyczyszczona')
          },
        },
      ]
    )
  }

  const handleReportBug = () => {
    // W przyszłości: ekran zgłaszania błędów
    Alert.alert('Zgłoś błąd', 'Funkcja w przygotowaniu')
  }

  const handleOpenRules = () => {
    router.push('/rules')
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name='settings' size={26} color={COLORS.secondary} />
        <Text style={styles.headerText}>Ustawienia</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Motyw mapy */}
        <SettingSection title='Wygląd'>
          <SettingRow
            icon='map'
            label='Motyw mapy'
            value={mapTheme === 'light' ? 'Jasny' : 'Ciemny'}
            onPress={handleMapThemeChange}
          />
        </SettingSection>

        {/* Powiadomienia */}
        <SettingSection title='Powiadomienia'>
          <SettingRow
            icon='chatbubble'
            label='Powiadomienia czatu'
            isSwitch
            switchValue={chatNotifications}
            onSwitchChange={setChatNotifications}
          />
          <SettingRow
            icon='calendar'
            label='Powiadomienia wydarzeń'
            isSwitch
            switchValue={eventNotifications}
            onSwitchChange={setEventNotifications}
          />
        </SettingSection>

        {/* Prywatność i dane */}
        <SettingSection title='Prywatność i dane'>
          <SettingRow
            icon='location'
            label='Usuń lokalizację'
            onPress={handleClearLocation}
          />
          <SettingRow
            icon='trash'
            label='Wyczyść historię czatu'
            onPress={handleClearChatHistory}
            danger
          />
        </SettingSection>

        {/* Pomoc */}
        <SettingSection title='Pomoc'>
          <SettingRow icon='bug' label='Zgłoś błąd' onPress={handleReportBug} />
          <SettingRow
            icon='document-text'
            label='Regulamin'
            onPress={handleOpenRules}
          />
        </SettingSection>

        {/* Wersja aplikacji */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>BoiskoPlus Mobile v1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  )
}

export default Settings

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  headerText: {
    fontSize: 24,
    fontFamily: 'Montserrat-Bold',
    color: COLORS.primary,
    marginLeft: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Montserrat-Bold',
    color: COLORS.secondary,
    textTransform: 'uppercase',
    marginBottom: 12,
    marginLeft: 4,
  },
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
  versionContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  versionText: {
    fontSize: 12,
    fontFamily: 'Lato-Regular',
    color: COLORS.gray,
  },
})
