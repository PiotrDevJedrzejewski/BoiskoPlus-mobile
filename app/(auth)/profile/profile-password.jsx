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
import { useAuth } from '../../../context/AuthContext'
import { dbg, useDebugMount } from '../../../assets/utils/debugLogger'
import BottomSpacer from '../../../components/BottomSpacer'

import { useThemedStyles } from '../../../context/themeStore'
import { SPACING, BORDER_RADIUS } from '../../../Theme/StyleConstants'
import { verticalScale, moderateScale, scaleFont } from '../../../Theme/ScalableStyles'

const ProfilePassword = () => {
  dbg('ProfilePasswordScreen')
  useDebugMount('ProfilePasswordScreen')
  const router = useRouter()
  const { changePassword } = useAuth()
  const { styles, colors } = useThemedStyles(createStyles)

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
          <Ionicons name='arrow-back' size={moderateScale(24, 0.35)} color={colors.PrimaryGreen} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Ionicons name='key' size={moderateScale(24, 0.35)} color={colors.PrimaryGreen} />
          <Text style={styles.headerText}>Zmiana Hasła</Text>
        </View>
        <View style={{ width: moderateScale(40, 0.35) }} />
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
              placeholderTextColor={colors.thirdText}
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
              placeholderTextColor={colors.thirdText}
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
              placeholderTextColor={colors.thirdText}
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
              <ActivityIndicator size='small' color={colors.background} />
            ) : (
              <>
                <Ionicons name='save' size={moderateScale(20, 0.35)} color={colors.background} />
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
            <Ionicons name='close' size={moderateScale(20, 0.35)} color={colors.primaryText} />
            <Text style={styles.cancelButtonText}>Anuluj</Text>
          </TouchableOpacity>
        </View>
        <BottomSpacer />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

export default ProfilePassword

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: verticalScale(16),
    paddingHorizontal: SPACING.md,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  backIconButton: {
    width: moderateScale(40, 0.35),
    height: moderateScale(40, 0.35),
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    fontSize: scaleFont(22, 0.45),
    fontFamily: 'BarlowCondensed-ExtraBold',
    color: colors.primaryText,
    marginLeft: SPACING.sm,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: verticalScale(40),
  },
  formContainer: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
  },
  inputGroup: {
    marginBottom: verticalScale(20),
  },
  label: {
    fontSize: scaleFont(14, 0.35),
    fontFamily: 'BarlowCondensed-Bold',
    color: colors.PrimaryGreen,
    marginBottom: verticalScale(8),
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: BORDER_RADIUS.md,
    minHeight: verticalScale(40),
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: scaleFont(16, 0.35),
    fontFamily: 'Inter-Regular',
    color: colors.primaryText,
  },
  inputError: {
    borderColor: colors.Danger,
  },
  errorText: {
    fontSize: scaleFont(12, 0.3),
    fontFamily: 'Inter-Regular',
    color: colors.Danger,
    marginTop: verticalScale(4),
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.PrimaryGreen,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: verticalScale(16),
    marginTop: verticalScale(10),
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: scaleFont(16, 0.35),
    fontFamily: 'BarlowCondensed-Bold',
    color: colors.background,
    marginLeft: SPACING.sm,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primaryText,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: verticalScale(14),
    marginTop: verticalScale(12),
  },
  cancelButtonText: {
    fontSize: scaleFont(16, 0.35),
    fontFamily: 'BarlowCondensed-Bold',
    color: colors.primaryText,
    marginLeft: SPACING.sm,
  },
})
