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
import { COLORS } from '../../../../../constants/colors'
import { useAuth } from '../../../../../context/AuthContext'
import { useResponsiveScale } from '../../../../../assets/utils/scaleUI.UX'

const ProfilePassword = () => {
  const router = useRouter()
  const { changePassword } = useAuth()
  const ui = useResponsiveScale()
  const styles = createStyles(ui)

  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword1: '',
    newPassword2: '',
  })
  const [errors, setErrors] = useState({})

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }))
    }
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.oldPassword) {
      newErrors.oldPassword = 'Obecne hasło jest wymagane'
    }

    if (!formData.newPassword1) {
      newErrors.newPassword1 = 'Nowe hasło jest wymagane'
    }

    if (!formData.newPassword2) {
      newErrors.newPassword2 = 'Powtórz nowe hasło'
    } else if (formData.newPassword1 !== formData.newPassword2) {
      newErrors.newPassword2 = 'Nowe hasła muszą być takie same'
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
      const oldPassword = formData.oldPassword
      const newPassword = formData.newPassword1

      const result = await changePassword({ oldPassword, newPassword })

      if (!result.success) {
        Alert.alert('Błąd', result.error || 'Nie udało się zmienić hasła')
        return
      }

      Alert.alert('Sukces', result.message || 'Hasło zostało zmienione', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ])
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
      pointerEvents='box-none'
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleGoBack}
          style={styles.backIconButton}
          activeOpacity={0.7}
        >
          <Ionicons name='arrow-back' size={ui.moderateScale(24, 0.35)} color={COLORS.secondary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Ionicons name='key' size={ui.moderateScale(24, 0.35)} color={COLORS.secondary} />
          <Text style={styles.headerText}>Zmiana Hasła</Text>
        </View>
        <View style={{ width: ui.moderateScale(40, 0.35) }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps='handled'
      >
        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Obecne hasło *</Text>
            <TextInput
              style={[styles.input, errors.oldPassword && styles.inputError]}
              value={formData.oldPassword}
              onChangeText={(value) => handleChange('oldPassword', value)}
              placeholder='Wpisz obecne hasło'
              placeholderTextColor={COLORS.gray}
              secureTextEntry
              autoCapitalize='none'
            />
            {errors.oldPassword && (
              <Text style={styles.errorText}>{errors.oldPassword}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nowe hasło *</Text>
            <TextInput
              style={[styles.input, errors.newPassword1 && styles.inputError]}
              value={formData.newPassword1}
              onChangeText={(value) => handleChange('newPassword1', value)}
              placeholder='Wpisz nowe hasło'
              placeholderTextColor={COLORS.gray}
              secureTextEntry
              autoCapitalize='none'
            />
            {errors.newPassword1 && (
              <Text style={styles.errorText}>{errors.newPassword1}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Powtórz nowe hasło *</Text>
            <TextInput
              style={[styles.input, errors.newPassword2 && styles.inputError]}
              value={formData.newPassword2}
              onChangeText={(value) => handleChange('newPassword2', value)}
              placeholder='Wpisz nowe hasło ponownie'
              placeholderTextColor={COLORS.gray}
              secureTextEntry
              autoCapitalize='none'
            />
            {errors.newPassword2 && (
              <Text style={styles.errorText}>{errors.newPassword2}</Text>
            )}
          </View>

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
                <Ionicons name='save' size={ui.moderateScale(20, 0.35)} color={COLORS.background} />
                <Text style={styles.submitButtonText}>Zapisz zmiany</Text>
              </>
            )}
          </TouchableOpacity>

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

export default ProfilePassword

const createStyles = (ui) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
  inputError: {
    borderColor: COLORS.error,
  },
  errorText: {
    fontSize: ui.scaleFont(12, 0.3),
    fontFamily: 'Lato-Regular',
    color: COLORS.error,
    marginTop: ui.verticalScale(4),
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
