import { useState, useEffect, useRef, useMemo} from 'react'
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
  Pressable,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Slider } from '@miblanchard/react-native-slider'
import { COLORS } from '../constants/colors'
import customFetch from '../assets/utils/customFetch'
import { Toast } from 'toastify-react-native'
import { useRouter } from 'expo-router'
import { useResponsiveScale } from '../assets/utils/scaleUI.UX'
import { gameTypeIcons } from '../assets/utils/gameTypeIcons'
import CustomTypePickerModal from './popup/CustomTypePickerModal'
import DatePicker from './popup/DatePicker'
import HourPicker from './popup/HourPicker'

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
  playerCount: '',
  level: 'beginner',
  price: '',
  paymentMethod: 'Na miejscu',
  eventDescription: '',
  phoneNumber: '',
  ageRange: [0, 100],
  isParticipating: false,
  isPrivate: false,
  isRecurring: false,
}

// Funkcja parsująca dane z predefined place (orlika)
const parsePredefinedPlace = (predefinedPlace) => {
  if (!predefinedPlace) return null

  const city = predefinedPlace.properties?.miasto || ''
  const address = predefinedPlace.properties?.adres || ''
  const geolocation_source = predefinedPlace.properties?.geolocation_source || ''

  // Wyciągnij kod pocztowy z geolocation_source (przedostatnie pole)
  const geoParts = geolocation_source.split(',').map((s) => s.trim())
  const postalCode = geoParts[geoParts.length - 2] || ''

  // Parsuj adres z pola "adres"
  let street = ''
  let addressNumber = ''

  if (address) {
    // Usuń prefix typu "ul.", "al.", "os." itp.
    const addressWithoutPrefix = address.replace(/^(ul\.|al\.|os\.)\s*/i, '')

    // Podziel na części
    const parts = addressWithoutPrefix.split(/\s+/)

    // Ostatnia część może zawierać numer (może być z literą typu "112A" lub "22/26")
    const lastPart = parts[parts.length - 1]

    // Sprawdź czy ostatnia część zawiera cyfrę
    if (/\d/.test(lastPart)) {
      addressNumber = lastPart
      street = parts.slice(0, -1).join(' ')
    } else {
      street = addressWithoutPrefix
    }
  }

  return {
    city: city || '',
    street: street || '',
    addressNumber: addressNumber || '',
    postalCode: postalCode || '',
  }
}

const FormEvent = ({ mode = 'add', initialData = null, predefinedPlace = null, eventId = null }) => {
  const [eventData, setEventData] = useState(
    initialData
      ? { ...initialData, ageRange: initialData.ageRange ?? [0, 100] }
      : defaultEventData
  )
  const [loading, setLoading] = useState(false)
  const [pickerModal, setPickerModal] = useState(null)
  const router = useRouter()
  const ui = useResponsiveScale()
  const styles = useMemo(() => createStyles(ui), [ui])

  const postalPart2Ref = useRef(null)
  const [postalPart1, setPostalPart1] = useState(() => {
    const code = initialData?.address?.postalCode || ''
    return code.split('-')[0] || ''
  })
  const [postalPart2, setPostalPart2] = useState(() => {
    const code = initialData?.address?.postalCode || ''
    return code.split('-')[1] || ''
  })

  // Wypełnij formularz danymi z predefined place (orlika)
  useEffect(() => {
    if (predefinedPlace && mode === 'add') {
      const parsedAddress = parsePredefinedPlace(predefinedPlace)
      
      if (parsedAddress) {
        setEventData((prev) => ({
          ...prev,
          address: {
            city: parsedAddress.city,
            street: parsedAddress.street,
            addressNumber: parsedAddress.addressNumber,
            postalCode: parsedAddress.postalCode,
          },
        }))
        const code = parsedAddress.postalCode || ''
        const parts = code.includes('-') ? code.split('-') : [code.slice(0, 2), code.slice(2)]
        setPostalPart1(parts[0] || '')
        setPostalPart2(parts[1] || '')
      }
    }
  }, [predefinedPlace, mode])

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
    if (!/^\d{2}-\d{3}$/.test(`${postalPart1}-${postalPart2}`)) {
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

      const postalCode = `${postalPart1}-${postalPart2}`
      let dataToSend = {
        ...eventData,
        address: { ...eventData.address, postalCode },
        duration: parseInt(eventData.duration),
        playerCount: parseInt(eventData.playerCount) || 0,
        price: parseInt(eventData.price) || 0,
        startDateTime: startDateTime.toISOString(),
        endDateTime: endDateTime.toISOString(),
        addressString: `${eventData.address.street} ${eventData.address.addressNumber}, ${eventData.address.city}, ${postalCode}`,
      }

      if (dataToSend.price === 0) {
        dataToSend.paymentMethod = ''
      }

      if (mode === 'add') {
        await customFetch.post('/football-events', dataToSend)
        Toast.success('Wydarzenie zostało dodane pomyślnie!', 'top')
        setEventData(defaultEventData)
        setPostalPart1('')
        setPostalPart2('')
        // Nawigacja powrót po dodaniu
        setTimeout(() => {
          router.replace('/(auth)/events-managment/events-owner')
        }, 1000)
      } else if (mode === 'edit' && eventId) {
        await customFetch.patch(`/football-events/${eventId}`, dataToSend)
        Toast.success('Wydarzenie zostało zaktualizowane!', 'top')
        // Nawigacja powrót po edycji
        setTimeout(() => {
          router.back()
        }, 1000)
      }
    } catch (error) {
      console.error('Błąd podczas zapisywania wydarzenia:', error)
      Toast.error('Błąd podczas zapisywania wydarzenia!', 'top')
      if (error.response?.data?.msg) {
        const messages = error.response.data.msg.split(',')
        messages.forEach((msg) => {
          Toast.error(msg.trim(), 'top')
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const getOptionLabel = (options, value) =>
    options.find((o) => o.value === value)?.label || 'Wybierz...'

  return (
    <>
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
      <Pressable
        style={styles.pickerWrapper}
        onPress={() => setPickerModal({ field: 'gameType', options: GAME_TYPES, title: 'Wybierz typ gry', iconMap: gameTypeIcons })}
      >
        <Text style={styles.pickerButtonText} numberOfLines={1}>
          {getOptionLabel(GAME_TYPES, eventData.gameType)}
        </Text>
        <Ionicons name='chevron-down' size={ui.moderateScale(18, 0.35)} color={COLORS.gray} />
      </Pressable>

      {/* Data i godzina */}
      <Text style={styles.label}>Data</Text>
      <DatePicker
        value={eventData.startDate}
        onChange={(value) => handleChange('startDate', value)}
      />
      <Text style={styles.label}>Godzina</Text>
      <HourPicker
        value={eventData.startHour}
        onChange={(value) => handleChange('startHour', value)}
      />

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
        <View style={styles.streetColumn}>
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
        <View style={styles.numberColumn}>
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
      <View style={styles.postalCodeWrapper}>
        <TextInput
          style={[styles.input, styles.postalPart1Input]}
          value={postalPart1}
          onChangeText={(value) => {
            const digits = value.replace(/\D/g, '').slice(0, 2)
            setPostalPart1(digits)
            if (digits.length === 2) postalPart2Ref.current?.focus()
          }}
          keyboardType='numeric'
          placeholder='XX'
          placeholderTextColor={COLORS.gray}
          maxLength={2}
        />
        <Text style={styles.postalSeparator}>-</Text>
        <TextInput
          ref={postalPart2Ref}
          style={[styles.input, styles.postalPart2Input]}
          value={postalPart2}
          onChangeText={(value) => {
            const digits = value.replace(/\D/g, '').slice(0, 3)
            setPostalPart2(digits)
          }}
          keyboardType='numeric'
          placeholder='XXX'
          placeholderTextColor={COLORS.gray}
          maxLength={3}
        />
      </View>

      {/* Typ boiska */}
      <Text style={styles.label}>Typ boiska</Text>
      <Pressable
        style={styles.pickerWrapper}
        onPress={() => setPickerModal({ field: 'fieldType', options: FIELD_TYPES, title: 'Wybierz typ boiska' })}
      >
        <Text style={styles.pickerButtonText} numberOfLines={1}>
          {getOptionLabel(FIELD_TYPES, eventData.fieldType)}
        </Text>
        <Ionicons name='chevron-down' size={ui.moderateScale(18, 0.35)} color={COLORS.gray} />
      </Pressable>

      {/* Liczba graczy */}
      <Text style={styles.label}>Ilu graczy szukasz</Text>
      <TextInput
        style={styles.input}
        value={eventData.playerCount}
        onChangeText={(value) => {
          const digits = value.replace(/\D/g, '')
          if (digits === '' || parseInt(digits) <= 999) {
            handleChange('playerCount', digits)
          }
        }}
        keyboardType='numeric'
        placeholder='0'
        placeholderTextColor={COLORS.gray}
      />

      {/* Poziom */}
      <Text style={styles.label}>Poziom</Text>
      <Pressable
        style={styles.pickerWrapper}
        onPress={() => setPickerModal({ field: 'level', options: LEVELS, title: 'Wybierz poziom gry' })}
      >
        <Text style={styles.pickerButtonText} numberOfLines={1}>
          {getOptionLabel(LEVELS, eventData.level)}
        </Text>
        <Ionicons name='chevron-down' size={ui.moderateScale(18, 0.35)} color={COLORS.gray} />
      </Pressable>

      {/* Cena i płatność */}
      <View style={styles.row}>
        <View style={styles.halfColumn}>
          <Text style={styles.label}>Cena (zł)</Text>
          <TextInput
            style={styles.input}
            value={eventData.price}
            onChangeText={(value) => {
              const digits = value.replace(/\D/g, '')
              if (digits === '' || parseInt(digits) <= 999) {
                handleChange('price', digits)
              }
            }}
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



      {/* Wiek */}
      <Text style={styles.label}>Wiek</Text>
      <View style={styles.ageRangeContainer}>
        <Text style={styles.ageRangeLabel}>
          {eventData.ageRange?.[0] ?? 0} – {eventData.ageRange?.[1] ?? 100} lat
        </Text>
        <Slider
          value={eventData.ageRange}
          onValueChange={(value) => handleChange('ageRange', value)}
          minimumValue={0}
          maximumValue={100}
          step={1}
          minimumTrackTintColor={COLORS.secondary}
          maximumTrackTintColor={COLORS.gray}
          thumbTintColor={COLORS.secondary}
          trackStyle={styles.sliderTrack}
          thumbStyle={styles.sliderThumb}
        />
        <View style={styles.ageRangeLabels}>
          <Text style={styles.ageRangeMinMax}>0</Text>
          <Text style={styles.ageRangeMinMax}>100</Text>
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

        <View style={styles.checkboxRow}>
          <Switch
            value={eventData.isPrivate}
            onValueChange={(value) => handleChange('isPrivate', value)}
            trackColor={{ false: COLORS.gray, true: COLORS.third }}
            thumbColor={
              eventData.isPrivate ? COLORS.secondary : COLORS.grayLight
            }
          />
          <Text style={styles.checkboxLabel}>Wydarzenie prywatne</Text>
        </View>
        {eventData.isPrivate && (
          <View style={styles.privateWarning}>
            <Text style={styles.privateWarningText}>
              ⚠️ Wydarzenie prywatne nie będzie widoczne na liście wyszukiwań ani na mapie. Tylko zaproszone osoby będą mogły je zobaczyć.
            </Text>
          </View>
        )}
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
      <CustomTypePickerModal
        visible={pickerModal !== null}
        selectedValue={pickerModal ? eventData[pickerModal.field] : ''}
        options={pickerModal?.options || []}
        title={pickerModal?.title || ''}
        iconMap={pickerModal?.iconMap}
        onSelect={(value) => {
          if (pickerModal) handleChange(pickerModal.field, value)
        }}
        onClose={() => setPickerModal(null)}
      />
    </>
  )
}
const createStyles = (ui) => StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: ui.spacing(20, 0.45),
    paddingBottom: ui.verticalScale(40),
  },
  label: {
    fontSize: ui.scaleFont(16, 0.35),
    fontFamily: 'Montserrat-Bold',
    color: COLORS.primary,
    marginTop: ui.verticalScale(16),
    marginBottom: ui.verticalScale(8),
  },
  input: {
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 1,
    borderColor: COLORS.secondary,
    borderRadius: ui.controlRadius,
    minHeight: ui.controlMinHeight,
    paddingHorizontal: ui.controlPaddingHorizontal,
    paddingVertical: ui.controlPaddingVertical,
    fontSize: ui.scaleFont(16, 0.35),
    fontFamily: 'Lato-Regular',
    color: COLORS.primary,
  },
  postalCodeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ui.spacing(8, 0.35),
  },
  postalPart1Input: {
    width: ui.scale(60),
    textAlign: 'center',
  },
  postalSeparator: {
    fontSize: ui.scaleFont(20, 0.4),
    color: COLORS.primary,
    fontFamily: 'Montserrat-Bold',
  },
  postalPart2Input: {
    width: ui.scale(80),
    textAlign: 'center',
  },
  textArea: {
    minHeight: ui.verticalScale(100),
    paddingTop: ui.controlPaddingVertical,
  },
  pickerWrapper: {
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 1,
    borderColor: COLORS.secondary,
    borderRadius: ui.controlRadius,
    minHeight: ui.controlMinHeight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ui.controlPaddingHorizontal,
  },
  pickerButtonText: {
    flex: 1,
    fontSize: ui.scaleFont(16, 0.35),
    fontFamily: 'Lato-Regular',
    color: COLORS.primary,
  },
  row: {
    flexDirection: 'row',
    gap: ui.spacing(12, 0.35),
  },
  halfColumn: {
    flex: 1,
  },
  streetColumn: {
    flex: 2,
  },
  numberColumn: {
    flex: 1,
  },
  checkboxContainer: {
    marginTop: ui.verticalScale(24),
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ui.verticalScale(16),
  },
  checkboxLabel: {
    fontSize: ui.scaleFont(16, 0.35),
    fontFamily: 'Lato-Regular',
    color: COLORS.primary,
    marginLeft: ui.spacing(12, 0.35),
  },
  submitButton: {
    backgroundColor: COLORS.secondary,
    borderRadius: ui.moderateScale(16, 0.35),
    paddingVertical: ui.verticalScale(16),
    alignItems: 'center',
    marginTop: ui.verticalScale(24),
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  ageRangeContainer: {
    marginBottom: ui.verticalScale(4),
  },
  ageRangeLabel: {
    fontSize: ui.scaleFont(15, 0.35),
    fontFamily: 'Lato-Regular',
    color: COLORS.secondary,
    textAlign: 'center',
    marginBottom: ui.verticalScale(4),
  },
  sliderTrack: {
    height: ui.verticalScale(4),
    borderRadius: 2,
  },
  sliderThumb: {
    width: ui.scale(22),
    height: ui.scale(22),
    borderRadius: ui.scale(11),
    backgroundColor: COLORS.secondary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  ageRangeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: ui.verticalScale(2),
  },
  ageRangeMinMax: {
    fontSize: ui.scaleFont(12, 0.3),
    fontFamily: 'Lato-Regular',
    color: COLORS.gray,
  },
  privateWarning: {
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 1,
    borderColor: COLORS.secondary,
    borderRadius: ui.controlRadius,
    padding: ui.spacing(12, 0.4),
    marginBottom: ui.verticalScale(8),
  },
  privateWarningText: {
    fontSize: ui.scaleFont(13, 0.3),
    fontFamily: 'Lato-Regular',
    color: COLORS.secondary,
    lineHeight: ui.scaleFont(20, 0.3),
  },
  submitButtonText: {
    fontSize: ui.scaleFont(18, 0.4),
    fontFamily: 'Montserrat-Bold',
    color: COLORS.background,
  },
})

export default FormEvent
