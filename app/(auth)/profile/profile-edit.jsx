import { useEffect, useMemo, useState } from 'react'
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { COLORS } from '../../../constants/colors'
import { useAuth } from '../../../context/AuthContext'
import DatePicker from '../../../components/DatePicker'
import { useResponsiveScale } from '../../../assets/utils/scaleUI.UX'
import { dbg, useDebugMount } from '../../../assets/utils/debugLogger'

const FORBIDDEN_WORDS = [
  'admin',
  'administrator',
  'mod',
  'moderator',
  'boiskoplus',
  'boisko',
  'support',
  'help',
  'system',
  'root',
  'superuser',
  'owner',
  'official',
]

const NICKNAME_REGEX = /^[a-zA-Z0-9_]+$/
const POLISH_NAME_REGEX = /^[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s-]+$/

const toInputDate = (value) => {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const isValidIsoDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return false
  }

  return date.toISOString().slice(0, 10) === value
}

const parseIsoDate = (value) => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null
  }

  const [yearStr, monthStr, dayStr] = value.split('-')
  const year = Number(yearStr)
  const month = Number(monthStr)
  const day = Number(dayStr)

  if (!year || !month || !day) {
    return null
  }

  const parsed = new Date(year, month - 1, day)
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() + 1 !== month ||
    parsed.getDate() !== day
  ) {
    return null
  }

  return parsed
}

const ProfileEdit = () => {
  dbg('ProfileEditScreen')
  useDebugMount('ProfileEditScreen')
  const router = useRouter()
  const { user, loading: authLoading, updateProfile } = useAuth()
  const ui = useResponsiveScale()
  const styles = createStyles(ui)

  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nickName: '',
    name: '',
    surname: '',
    age: '',
  })
  const [errors, setErrors] = useState({})

  const isInitialLoading = useMemo(() => authLoading || !user, [authLoading, user])

  useEffect(() => {
    if (!user) return

    setFormData({
      nickName: user.nickName || '',
      name: user.name || '',
      surname: user.surname || '',
      age: toInputDate(user.age),
    })
  }, [user])

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Wyczyść błąd przy edycji
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }))
    }
  }

  const validate = () => {
    const newErrors = {}

    const trimmedNickName = formData.nickName.trim()
    const trimmedName = formData.name.trim()
    const trimmedSurname = formData.surname.trim()
    const normalizedNick = trimmedNickName.toLowerCase()

    if (!trimmedNickName) {
      newErrors.nickName = 'Nickname jest wymagany'
    } else if (trimmedNickName.length < 3 || trimmedNickName.length > 20) {
      newErrors.nickName = 'Nickname musi mieć od 3 do 20 znaków'
    } else if (!NICKNAME_REGEX.test(trimmedNickName)) {
      newErrors.nickName =
        'Nick może zawierać tylko litery, cyfry i podkreślenie'
    } else {
      const forbiddenMatch = FORBIDDEN_WORDS.find((word) =>
        normalizedNick.includes(word)
      )
      if (forbiddenMatch) {
        newErrors.nickName = `Nick nie może zawierać słowa "${forbiddenMatch}"`
      }
    }

    if (!trimmedName) {
      newErrors.name = 'Imię jest wymagane'
    } else if (trimmedName.length < 1 || trimmedName.length > 20) {
      newErrors.name = 'Imię musi mieć od 1 do 20 znaków'
    } else if (!POLISH_NAME_REGEX.test(trimmedName)) {
      newErrors.name = 'Imię może zawierać tylko litery'
    }

    if (!trimmedSurname) {
      newErrors.surname = 'Nazwisko jest wymagane'
    } else if (trimmedSurname.length < 1 || trimmedSurname.length > 20) {
      newErrors.surname = 'Nazwisko musi mieć od 1 do 20 znaków'
    } else if (!POLISH_NAME_REGEX.test(trimmedSurname)) {
      newErrors.surname = 'Nazwisko może zawierać tylko litery'
    }

    if (formData.age && !isValidIsoDate(formData.age.trim())) {
      newErrors.age = 'Data urodzenia musi być poprawną datą (YYYY-MM-DD)'
    }

    if (formData.age) {
      const parsedDate = parseIsoDate(formData.age.trim())
      if (parsedDate && parsedDate < new Date(1900, 0, 1)) {
        newErrors.age = 'Podaj prawidłową datę urodzenia'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) {
      return
    }

    setLoading(true)

    try {
      const payload = {
        nickName: formData.nickName.trim(),
        name: formData.name.trim(),
        surname: formData.surname.trim(),
      }

      if (formData.age.trim()) {
        payload.age = formData.age.trim()
      }

      const result = await updateProfile(payload)

      if (!result.success) {
        const backendMessage =
          Array.isArray(result.error) ? result.error.join('\n') : result.error
        Alert.alert('Błąd', backendMessage || 'Nie udało się zaktualizować profilu')
        return
      }

      Alert.alert('Sukces', 'Profil został zaktualizowany', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ])
    } catch (error) {
      Alert.alert('Błąd', 'Nie udało się zaktualizować profilu')
    } finally {
      setLoading(false)
    }
  }

  const handleGoBack = () => {
    router.back()
  }

  if (isInitialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' color={COLORS.secondary} />
        <Text style={styles.loadingText}>Ładowanie danych profilu...</Text>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      pointerEvents='box-none'
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleGoBack}
          style={styles.backIconButton}
          activeOpacity={0.7}
        >
          <Ionicons name='arrow-back' size={ui.moderateScale(24, 0.35)} color={COLORS.secondary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Ionicons name='create' size={ui.moderateScale(24, 0.35)} color={COLORS.secondary} />
          <Text style={styles.headerText}>Edytuj Profil</Text>
        </View>
        <View style={{ width: ui.moderateScale(40, 0.35) }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps='handled'
      >
        {/* Form */}
        <View style={styles.formContainer}>
          {/* Nickname */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nickname *</Text>
            <TextInput
              style={[styles.input, errors.nickName && styles.inputError]}
              value={formData.nickName}
              onChangeText={(value) => handleChange('nickName', value)}
              placeholder='Twój nickname'
              placeholderTextColor={COLORS.gray}
              maxLength={20}
              autoCapitalize='none'
            />
            {errors.nickName && (
              <Text style={styles.errorText}>{errors.nickName}</Text>
            )}
            <Text style={styles.helperText}>
              {formData.nickName.length}/20 znaków
            </Text>
          </View>

          {/* Imię */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Imię *</Text>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              value={formData.name}
              onChangeText={(value) => handleChange('name', value)}
              placeholder='Twoje imię'
              placeholderTextColor={COLORS.gray}
              autoCapitalize='words'
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          {/* Nazwisko */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nazwisko *</Text>
            <TextInput
              style={[styles.input, errors.surname && styles.inputError]}
              value={formData.surname}
              onChangeText={(value) => handleChange('surname', value)}
              placeholder='Twoje nazwisko'
              placeholderTextColor={COLORS.gray}
              autoCapitalize='words'
            />
            {errors.surname && (
              <Text style={styles.errorText}>{errors.surname}</Text>
            )}
          </View>

          {/* Data urodzenia */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Data urodzenia</Text>
            <View style={[styles.inputDateWrapper, errors.age && styles.inputError]}>
              <DatePicker
                value={formData.age}
                onChange={(value) => handleChange('age', value)}
                minimumDate={new Date(1900, 0, 1)}
                maximumDate={new Date()}
              />
            </View>
            {/* Pozostawiamy format jako hint dla spójności z walidacją backendu */}
            {/* value formatujemy do YYYY-MM-DD i taki payload wysyłamy do API */}
            {errors.age && <Text style={styles.errorText}>{errors.age}</Text>}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              loading && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator size='small' color={COLORS.background} />
            ) : (
              <>
                <Ionicons name='save' size={20} color={COLORS.background} />
                
                <Text style={styles.submitButtonText}>Zapisz zmiany</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Cancel Button */}
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleGoBack}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Ionicons name='close' size={ui.moderateScale(20, 0.35)} color={COLORS.primary} />
            <Text style={styles.cancelButtonText}>Anuluj</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

export default ProfileEdit

const createStyles = (ui) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: ui.verticalScale(12),
    fontSize: ui.scaleFont(16, 0.35),
    fontFamily: 'Lato-Regular',
    color: COLORS.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: ui.verticalScale(16),
    paddingHorizontal: ui.spacing(16),
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  backIconButton: {
    width: ui.moderateScale(40, 0.35),
    height: ui.moderateScale(40, 0.35),
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    fontSize: ui.scaleFont(22, 0.45),
    fontFamily: 'Montserrat-Bold',
    color: COLORS.primary,
    marginLeft: ui.spacing(10, 0.35),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: ui.spacing(20, 0.45),
    paddingBottom: ui.verticalScale(40),
  },
  formContainer: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: ui.moderateScale(16, 0.35),
    padding: ui.spacing(20, 0.45),
  },
  inputGroup: {
    marginBottom: ui.verticalScale(20),
  },
  label: {
    fontSize: ui.scaleFont(14, 0.35),
    fontFamily: 'Montserrat-Bold',
    color: COLORS.secondary,
    marginBottom: ui.verticalScale(8),
  },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: ui.controlRadius,
    minHeight: ui.controlMinHeight,
    paddingHorizontal: ui.controlPaddingHorizontal,
    paddingVertical: ui.controlPaddingVertical,
    fontSize: ui.scaleFont(16, 0.35),
    fontFamily: 'Lato-Regular',
    color: COLORS.primary,
  },
  inputDateWrapper: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: ui.controlRadius,
    minHeight: ui.controlMinHeight,
    paddingHorizontal: ui.controlPaddingHorizontal,
    paddingVertical: ui.controlPaddingVertical,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  errorText: {
    fontSize: ui.scaleFont(12, 0.3),
    fontFamily: 'Lato-Regular',
    color: COLORS.error,
    marginTop: ui.verticalScale(4),
  },
  helperText: {
    fontSize: ui.scaleFont(11, 0.3),
    fontFamily: 'Lato-Regular',
    color: COLORS.gray,
    marginTop: ui.verticalScale(4),
    textAlign: 'right',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.secondary,
    borderRadius: ui.moderateScale(12, 0.35),
    paddingVertical: ui.verticalScale(16),
    marginTop: ui.verticalScale(10),
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: ui.scaleFont(16, 0.35),
    fontFamily: 'Montserrat-Bold',
    color: COLORS.background,
    marginLeft: ui.spacing(10, 0.35),
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: ui.moderateScale(12, 0.35),
    paddingVertical: ui.verticalScale(14),
    marginTop: ui.verticalScale(12),
  },
  cancelButtonText: {
    fontSize: ui.scaleFont(16, 0.35),
    fontFamily: 'Montserrat-Bold',
    color: COLORS.primary,
    marginLeft: ui.spacing(10, 0.35),
  },
})
