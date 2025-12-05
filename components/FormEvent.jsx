import { useState } from 'react'
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native'
import { Picker } from '@react-native-picker/picker'
import { COLORS } from '../constants/colors'

const GAME_TYPES = [
  { label: 'Wybierz typ gry', value: '' },
  { label: 'Piłka nożna', value: 'football' },
  { label: 'Siatkówka', value: 'volleyball' },
  { label: 'Koszykówka', value: 'basketball' },
  { label: 'Piłka ręczna', value: 'handball' },
  { label: 'Rugby', value: 'rugby' },
  { label: 'Hokej', value: 'hockey' },
  { label: 'Tenis', value: 'tennis' },
  { label: 'Badminton', value: 'badminton' },
  { label: 'Tenis stołowy', value: 'table tennis' },
  { label: 'Kręgle', value: 'bowling' },
  { label: 'Karty', value: 'cards' },
  { label: 'Planszówki', value: 'board games' },
  { label: 'Inne', value: 'other' },
]

const FIELD_TYPES = [
  { label: 'Orlik', value: 'field' },
  { label: 'Hala', value: 'hall' },
  { label: 'Inne', value: 'other' },
]

const LEVELS = [
  { label: 'Początkujący', value: 'beginner' },
  { label: 'Średniozaawansowany', value: 'intermediate' },
  { label: 'Zaawansowany', value: 'advanced' },
  { label: 'Profesjonalny', value: 'professional' },
  { label: 'Inny', value: 'other' },
]

const defaultEventData = {
  eventName: '',
  gameType: 'football',
  startDate: new Date().toISOString().split('T')[0],
  startHour: new Date().toLocaleTimeString('pl-PL', {
    hour: '2-digit',
    minute: '2-digit',
  }),
  duration: '90',
  address: {
    city: '',
    street: '',
    addressNumber: '',
    postalCode: '',
  },
  fieldType: 'field',
  playerCount: '0',
  level: 'beginner',
  price: '0',
  paymentMethod: 'Na miejscu',
  eventDescription: '',
  phoneNumber: '',
  isParticipating: false,
  isPrivate: false,
  isRecurring: false,
}

const FormEvent = ({ mode = 'add', initialData = null, onSubmit }) => {
  const [eventData, setEventData] = useState(initialData || defaultEventData)
  const [loading, setLoading] = useState(false)

  const handleChange = (name, value) => {
    if (name.includes('.')) {
      const [parent, child] = name.split('.')
      setEventData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }))
    } else {
      setEventData((prev) => ({
        ...prev,
        [name]: value,
      }))
    }
  }

  const handlePostalCodeChange = (value) => {
    // Pozwól tylko cyfry i myślnik, max 6 znaków
    if (/^[\d-]{0,6}$/.test(value)) {
      handleChange('address.postalCode', value)
    }
  }

  const validateForm = () => {
    if (!eventData.eventName.trim()) {
      Alert.alert('Błąd', 'Podaj nazwę wydarzenia')
      return false
    }
    if (!eventData.gameType) {
      Alert.alert('Błąd', 'Wybierz typ gry')
      return false
    }
    if (!eventData.address.city.trim()) {
      Alert.alert('Błąd', 'Podaj miasto')
      return false
    }
    if (!eventData.address.street.trim()) {
      Alert.alert('Błąd', 'Podaj ulicę')
      return false
    }
    if (!/^\d{2}-\d{3}$/.test(eventData.address.postalCode)) {
      Alert.alert('Błąd', 'Kod pocztowy musi być w formacie XX-XXX')
      return false
    }
    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setLoading(true)

    try {
      const startDateTime = new Date(
        `${eventData.startDate}T${eventData.startHour}`
      )
      const endDateTime = new Date(
        startDateTime.getTime() + parseInt(eventData.duration) * 60000
      )

      const dataToSend = {
        ...eventData,
        duration: parseInt(eventData.duration),
        playerCount: parseInt(eventData.playerCount),
        price: parseInt(eventData.price),
        startDateTime: startDateTime.toISOString(),
        endDateTime: endDateTime.toISOString(),
        addressString: `${eventData.address.street} ${eventData.address.addressNumber}, ${eventData.address.city}, ${eventData.address.postalCode}`,
      }

      if (dataToSend.price === 0) {
        dataToSend.paymentMethod = ''
      }

      if (onSubmit) {
        await onSubmit(dataToSend)
      } else {
        // Mock - w przyszłości API call
        console.log('Submit event:', dataToSend)
        Alert.alert(
          'Sukces',
          mode === 'add'
            ? 'Wydarzenie zostało dodane!'
            : 'Wydarzenie zostało zaktualizowane!'
        )
      }
    } catch (error) {
      console.error('Błąd:', error)
      Alert.alert('Błąd', 'Wystąpił błąd podczas zapisywania wydarzenia')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Nazwa wydarzenia */}
      <Text style={styles.label}>Nazwa wydarzenia</Text>
      <TextInput
        style={styles.input}
        value={eventData.eventName}
        onChangeText={(value) => handleChange('eventName', value)}
        placeholder='Np. Mecz towarzyski na orliku'
        placeholderTextColor={COLORS.gray}
      />

      {/* Typ gry */}
      <Text style={styles.label}>Typ rozgrywki</Text>
      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={eventData.gameType}
          onValueChange={(value) => handleChange('gameType', value)}
          style={styles.picker}
          dropdownIconColor={COLORS.secondary}
        >
          {GAME_TYPES.map((type) => (
            <Picker.Item
              key={type.value}
              label={type.label}
              value={type.value}
              color={COLORS.background}
            />
          ))}
        </Picker>
      </View>

      {/* Data i godzina */}
      <View style={styles.row}>
        <View style={styles.halfColumn}>
          <Text style={styles.label}>Data</Text>
          <TextInput
            style={styles.input}
            value={eventData.startDate}
            onChangeText={(value) => handleChange('startDate', value)}
            placeholder='RRRR-MM-DD'
            placeholderTextColor={COLORS.gray}
          />
        </View>
        <View style={styles.halfColumn}>
          <Text style={styles.label}>Godzina</Text>
          <TextInput
            style={styles.input}
            value={eventData.startHour}
            onChangeText={(value) => handleChange('startHour', value)}
            placeholder='HH:MM'
            placeholderTextColor={COLORS.gray}
          />
        </View>
      </View>

      {/* Czas trwania */}
      <Text style={styles.label}>Czas trwania (minuty)</Text>
      <TextInput
        style={styles.input}
        value={eventData.duration}
        onChangeText={(value) => handleChange('duration', value)}
        keyboardType='numeric'
        placeholder='90'
        placeholderTextColor={COLORS.gray}
      />

      {/* Adres - Miasto */}
      <Text style={styles.label}>Miasto</Text>
      <TextInput
        style={styles.input}
        value={eventData.address.city}
        onChangeText={(value) => {
          if (!/\d/.test(value)) {
            handleChange('address.city', value)
          }
        }}
        placeholder='Np. Łódź'
        placeholderTextColor={COLORS.gray}
      />

      {/* Adres - Ulica i numer */}
      <View style={styles.row}>
        <View style={[styles.halfColumn, { flex: 2 }]}>
          <Text style={styles.label}>Ulica</Text>
          <TextInput
            style={styles.input}
            value={eventData.address.street}
            onChangeText={(value) => {
              if (!/\d/.test(value)) {
                handleChange('address.street', value)
              }
            }}
            placeholder='Np. Sportowa'
            placeholderTextColor={COLORS.gray}
          />
        </View>
        <View style={[styles.halfColumn, { flex: 1 }]}>
          <Text style={styles.label}>Numer</Text>
          <TextInput
            style={styles.input}
            value={eventData.address.addressNumber}
            onChangeText={(value) => {
              if (/^\d*$/.test(value)) {
                handleChange('address.addressNumber', value)
              }
            }}
            keyboardType='numeric'
            placeholder='15'
            placeholderTextColor={COLORS.gray}
          />
        </View>
      </View>

      {/* Kod pocztowy */}
      <Text style={styles.label}>Kod pocztowy</Text>
      <TextInput
        style={[styles.input, { width: 150 }]}
        value={eventData.address.postalCode}
        onChangeText={handlePostalCodeChange}
        placeholder='XX-XXX'
        placeholderTextColor={COLORS.gray}
        maxLength={6}
      />

      {/* Typ boiska */}
      <Text style={styles.label}>Typ boiska</Text>
      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={eventData.fieldType}
          onValueChange={(value) => handleChange('fieldType', value)}
          style={styles.picker}
          dropdownIconColor={COLORS.secondary}
        >
          {FIELD_TYPES.map((type) => (
            <Picker.Item
              key={type.value}
              label={type.label}
              value={type.value}
              color={COLORS.background}
            />
          ))}
        </Picker>
      </View>

      {/* Liczba graczy */}
      <Text style={styles.label}>Ilu graczy szukasz</Text>
      <TextInput
        style={styles.input}
        value={eventData.playerCount}
        onChangeText={(value) => handleChange('playerCount', value)}
        keyboardType='numeric'
        placeholder='0'
        placeholderTextColor={COLORS.gray}
      />

      {/* Poziom */}
      <Text style={styles.label}>Poziom</Text>
      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={eventData.level}
          onValueChange={(value) => handleChange('level', value)}
          style={styles.picker}
          dropdownIconColor={COLORS.secondary}
        >
          {LEVELS.map((level) => (
            <Picker.Item
              key={level.value}
              label={level.label}
              value={level.value}
              color={COLORS.background}
            />
          ))}
        </Picker>
      </View>

      {/* Cena i płatność */}
      <View style={styles.row}>
        <View style={styles.halfColumn}>
          <Text style={styles.label}>Cena (zł)</Text>
          <TextInput
            style={styles.input}
            value={eventData.price}
            onChangeText={(value) => handleChange('price', value)}
            keyboardType='numeric'
            placeholder='0'
            placeholderTextColor={COLORS.gray}
          />
        </View>
        <View style={styles.halfColumn}>
          <Text style={styles.label}>Płatność</Text>
          <TextInput
            style={styles.input}
            value={eventData.paymentMethod}
            onChangeText={(value) => handleChange('paymentMethod', value)}
            placeholder='Na miejscu'
            placeholderTextColor={COLORS.gray}
          />
        </View>
      </View>

      {/* Opis */}
      <Text style={styles.label}>Opis wydarzenia</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={eventData.eventDescription}
        onChangeText={(value) => handleChange('eventDescription', value)}
        placeholder='Opisz swoje wydarzenie...'
        placeholderTextColor={COLORS.gray}
        multiline
        numberOfLines={4}
        textAlignVertical='top'
      />

      {/* Telefon */}
      <Text style={styles.label}>Nr telefonu (opcjonalnie)</Text>
      <TextInput
        style={styles.input}
        value={eventData.phoneNumber}
        onChangeText={(value) => handleChange('phoneNumber', value)}
        keyboardType='phone-pad'
        placeholder='123 456 789'
        placeholderTextColor={COLORS.gray}
      />

      {/* Checkboxy */}
      <View style={styles.checkboxContainer}>
        <View style={styles.checkboxRow}>
          <Switch
            value={eventData.isParticipating}
            onValueChange={(value) => handleChange('isParticipating', value)}
            trackColor={{ false: COLORS.gray, true: COLORS.third }}
            thumbColor={
              eventData.isParticipating ? COLORS.secondary : COLORS.grayLight
            }
          />
          <Text style={styles.checkboxLabel}>
            Biorę udział w tym wydarzeniu
          </Text>
        </View>

        <View style={styles.checkboxRow}>
          <Switch
            value={eventData.isRecurring}
            onValueChange={(value) => handleChange('isRecurring', value)}
            trackColor={{ false: COLORS.gray, true: COLORS.third }}
            thumbColor={
              eventData.isRecurring ? COLORS.secondary : COLORS.grayLight
            }
          />
          <Text style={styles.checkboxLabel}>Wydarzenie cykliczne</Text>
        </View>
      </View>

      {/* Przycisk submit */}
      <TouchableOpacity
        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
        activeOpacity={0.8}
      >
        <Text style={styles.submitButtonText}>
          {loading
            ? 'Zapisywanie...'
            : mode === 'add'
            ? 'Dodaj wydarzenie'
            : 'Zapisz zmiany'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

export default FormEvent

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  label: {
    fontSize: 16,
    fontFamily: 'Montserrat-Bold',
    color: COLORS.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 1,
    borderColor: COLORS.secondary,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Lato-Regular',
    color: COLORS.primary,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  pickerWrapper: {
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 1,
    borderColor: COLORS.secondary,
    borderRadius: 16,
    overflow: 'hidden',
  },
  picker: {
    color: COLORS.primary,
    height: 50,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfColumn: {
    flex: 1,
  },
  checkboxContainer: {
    marginTop: 24,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkboxLabel: {
    fontSize: 16,
    fontFamily: 'Lato-Regular',
    color: COLORS.primary,
    marginLeft: 12,
  },
  submitButton: {
    backgroundColor: COLORS.secondary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 18,
    fontFamily: 'Montserrat-Bold',
    color: COLORS.background,
  },
})
