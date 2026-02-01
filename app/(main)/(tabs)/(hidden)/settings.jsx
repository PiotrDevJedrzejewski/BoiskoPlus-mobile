import { useState } from 'react'
import { StyleSheet, Text, View, ScrollView, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { COLORS } from '../../../../constants/colors'
import { useMap } from '../../../../context/MapContext'
import { useAuth } from '../../../../context/AuthContext'
import SettingSection from '../../../../components/settingsComponents/SettingSection'
import SettingRow from '../../../../components/settingsComponents/SettingRow'

const Settings = () => {
  const router = useRouter()
  const { userLocation, setStartLocation } = useMap()
  const { consents, updateConsents } = useAuth()

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
          onPress: async () => {
            // Zresetuj lokalizację do domyślnej (cała Polska)
            await setStartLocation(false)
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

  const handleMarketingToggle = async (value) => {
    await updateConsents({ marketingAccepted: value })
  }

  const handleLocationToggle = async (value) => {
    await updateConsents({ locationAccepted: value })
  }

  return (
    <View style={styles.container} pointerEvents='box-none'>
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
            icon='location-sharp'
            label='Usuń lokalizację'
            onPress={handleClearLocation}
          />

            <View style={styles.locationInfo}>
              <Text style={styles.locationInfoText}>
                Aktualna lokalizacja: {userLocation?.City || 'brak'}, {userLocation?.Country || ''}
              </Text>
            </View>

            <SettingRow
              icon='navigate'
              label='Zgoda na geolokalizację'
              isSwitch
              switchValue={consents?.locationAccepted || false}
              onSwitchChange={handleLocationToggle}
            />
          <SettingRow
            icon='business'
            label='Zgoda marketingowa'
            isSwitch
            switchValue={consents?.marketingAccepted || false}
            onSwitchChange={handleMarketingToggle}
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
  versionContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  versionText: {
    fontSize: 12,
    fontFamily: 'Lato-Regular',
    color: COLORS.gray,
  },
  locationInfo: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 8,
    //border 1 px solid color.secondary
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  locationInfoText: {
    textAlign: 'center',
    fontSize: 14,
    fontFamily: 'Lato-Regular',
    fontStyle: 'italic',
    textTransform: 'capitalize',
    fontWeight: 'bold',
    color: COLORS.gray,
  },
})
