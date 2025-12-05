import { useState } from 'react'
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
import { COLORS } from '../../../../constants/colors'

// Mock data - zalogowany użytkownik
const MOCK_USER = {
  _id: 'currentUser',
  nickName: 'MójNick123',
  name: 'Jan',
  surname: 'Kowalski',
  age: 25,
}

const ProfileEdit = () => {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nickName: MOCK_USER.nickName,
    name: MOCK_USER.name,
    surname: MOCK_USER.surname,
    age: MOCK_USER.age ? String(MOCK_USER.age) : '',
  })
  const [errors, setErrors] = useState({})

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Wyczyść błąd przy edycji
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }))
    }
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.nickName.trim()) {
      newErrors.nickName = 'Nickname jest wymagany'
    } else if (formData.nickName.length < 3) {
      newErrors.nickName = 'Nickname musi mieć min. 3 znaki'
    } else if (formData.nickName.length > 20) {
      newErrors.nickName = 'Nickname może mieć max. 20 znaków'
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Imię jest wymagane'
    }

    if (!formData.surname.trim()) {
      newErrors.surname = 'Nazwisko jest wymagane'
    }

    if (formData.age) {
      const ageNum = parseInt(formData.age, 10)
      if (isNaN(ageNum) || ageNum < 10 || ageNum > 100) {
        newErrors.age = 'Wiek musi być liczbą między 10 a 100'
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
      // Symulacja API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleGoBack}
          style={styles.backIconButton}
          activeOpacity={0.7}
        >
          <Ionicons name='arrow-back' size={24} color={COLORS.secondary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Ionicons name='create' size={24} color={COLORS.secondary} />
          <Text style={styles.headerText}>Edytuj Profil</Text>
        </View>
        <View style={{ width: 40 }} />
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

          {/* Wiek */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Wiek</Text>
            <TextInput
              style={[styles.input, errors.age && styles.inputError]}
              value={formData.age}
              onChangeText={(value) => handleChange('age', value)}
              placeholder='Twój wiek'
              placeholderTextColor={COLORS.gray}
              keyboardType='numeric'
              maxLength={3}
            />
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
            <Ionicons name='close' size={20} color={COLORS.primary} />
            <Text style={styles.cancelButtonText}>Anuluj</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

export default ProfileEdit

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  backIconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 22,
    fontFamily: 'Montserrat-Bold',
    color: COLORS.primary,
    marginLeft: 10,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  formContainer: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 16,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Montserrat-Bold',
    color: COLORS.secondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: 'Lato-Regular',
    color: COLORS.primary,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'Lato-Regular',
    color: COLORS.error,
    marginTop: 4,
  },
  helperText: {
    fontSize: 11,
    fontFamily: 'Lato-Regular',
    color: COLORS.gray,
    marginTop: 4,
    textAlign: 'right',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.secondary,
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 10,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 16,
    fontFamily: 'Montserrat-Bold',
    color: COLORS.background,
    marginLeft: 10,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'Montserrat-Bold',
    color: COLORS.primary,
    marginLeft: 10,
  },
})
