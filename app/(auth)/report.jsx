import { useState, useEffect } from 'react'
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
import { useRouter, useLocalSearchParams } from 'expo-router'
import { dbg, useDebugMount } from '../../assets/utils/debugLogger'
import BottomSpacer from '../../components/BottomSpacer'

import { useThemedStyles } from '../../context/themeStore'
import { SPACING, BORDER_RADIUS } from '../../Theme/StyleConstants'
import { verticalScale, moderateScale, scaleFont } from '../../Theme/ScalableStyles'

const Report = () => {
  dbg('ReportScreen')
  useDebugMount('ReportScreen')
  const router = useRouter()
  const { styles, colors } = useThemedStyles(createStyles)
  const { type, userId, eventId, reportedNickName } = useLocalSearchParams()

  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const maxLength = 500

  useEffect(() => {
    // Sprawdź czy mamy prawidłowy typ
    if (!type || !['user', 'event', 'bug'].includes(type)) {
      Alert.alert('Błąd', 'Nieprawidłowy typ zgłoszenia', [
        { text: 'OK', onPress: () => router.back() },
      ])
    }
  }, [type])

  const getTypeDisplayName = () => {
    switch (type) {
      case 'user':
        return 'Zgłoszenie użytkownika'
      case 'event':
        return 'Zgłoszenie wydarzenia'
      case 'bug':
        return 'Zgłoszenie błędu'
      default:
        return 'Zgłoszenie'
    }
  }

  const getTypeIcon = () => {
    switch (type) {
      case 'user':
        return 'person'
      case 'event':
        return 'calendar'
      case 'bug':
        return 'bug'
      default:
        return 'flag'
    }
  }

  const handleMessageChange = (text) => {
    if (text.length <= maxLength) {
      setMessage(text)
      if (error && text.length >= 10) {
        setError('')
      }
    }
  }

  const validateForm = () => {
    if (!message || message.length < 10) {
      setError('Wiadomość musi mieć co najmniej 10 znaków')
      return false
    }
    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setLoading(true)

    try {
      // Symulacja API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const reportData = {
        type,
        message: message.trim(),
        ...(type === 'user' && userId && { reportedUserId: userId }),
        ...(type === 'event' && eventId && { reportedEventId: eventId }),
      }

      console.log('Report data:', reportData)

      Alert.alert('Sukces', 'Raport został wysłany pomyślnie', [
        { text: 'OK', onPress: () => router.back() },
      ])
    } catch (err) {
      Alert.alert('Błąd', 'Wystąpił błąd podczas wysyłania raportu')
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleGoBack}
          style={styles.backIconButton}
          activeOpacity={0.7}
        >
          <Ionicons name='arrow-back' size={moderateScale(24, 0.35)} color={colors.PrimaryGreen} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Ionicons name='flag' size={moderateScale(22, 0.35)} color={colors.PrimaryGreen} />
          <Text style={styles.headerText}>Zgłaszanie</Text>
        </View>
        <View style={{ width: moderateScale(40, 0.35) }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps='handled'
      >
        {/* Info banner */}
        <View style={styles.infoBanner}>
          <Ionicons
            name='information-circle'
            size={moderateScale(20, 0.35)}
            color={colors.PrimaryGreen}
          />
          <Text style={styles.infoBannerText}>
            Wypełniasz formularz zgłoszenia na podstawie wybranego elementu
          </Text>
        </View>

        {/* Type display */}
        <View style={styles.typeContainer}>
          <View style={styles.typeIconWrapper}>
            <Ionicons name={getTypeIcon()} size={moderateScale(24, 0.35)} color={colors.PrimaryGreen} />
          </View>
          <Text style={styles.typeText}>{getTypeDisplayName()}</Text>
        </View>

        {/* Subject info (if available) */}
        {(reportedNickName || eventId) && (
          <View style={styles.idContainer}>
            <Text style={styles.idLabel}>
              {type === 'user' ? 'Zgłaszany użytkownik:' : 'ID wydarzenia:'}
            </Text>
            <Text style={styles.idValue} numberOfLines={1}>
              {reportedNickName || eventId}
            </Text>
          </View>
        )}

        {/* Message input */}
        <View style={styles.inputContainer}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Opisz problem</Text>
            <Text
              style={[
                styles.charCount,
                message.length > 450 && styles.charCountWarning,
              ]}
            >
              {message.length}/{maxLength}
            </Text>
          </View>

          <TextInput
            style={[styles.textArea, error && styles.textAreaError]}
            value={message}
            onChangeText={handleMessageChange}
            placeholder='Opisz szczegółowo problem, który chcesz zgłosić...'
            placeholderTextColor={colors.thirdText}
            multiline
            numberOfLines={8}
            textAlignVertical='top'
          />

          {error && <Text style={styles.errorText}>{error}</Text>}

          {message.length > 450 && (
            <Text style={styles.warningText}>
              Zbliżasz się do limitu znaków ({maxLength - message.length}{' '}
              pozostało)
            </Text>
          )}
        </View>

        {/* Buttons */}
        <View style={styles.buttonsContainer}>
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
                <Text style={styles.submitButtonText}>Wyślij raport</Text>
                <Ionicons name='send' size={moderateScale(18, 0.35)} color={colors.background} />
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleGoBack}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.cancelButtonText}>Anuluj</Text>
          </TouchableOpacity>
        </View>
        <BottomSpacer />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

export default Report

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
    fontSize: scaleFont(20, 0.4),
    fontFamily: 'Montserrat-Bold',
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
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.GlowGreen,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: verticalScale(20),
    borderWidth: 1,
    borderColor: colors.PrimaryGreen,
  },
  infoBannerText: {
    flex: 1,
    fontSize: scaleFont(13, 0.35),
    fontFamily: 'Lato-Regular',
    color: colors.primaryText,
    marginLeft: SPACING.sm,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: verticalScale(16),
  },
  typeIconWrapper: {
    width: moderateScale(44, 0.35),
    height: moderateScale(44, 0.35),
    borderRadius: moderateScale(22, 0.35),
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  typeText: {
    fontSize: scaleFont(18, 0.4),
    fontFamily: 'Montserrat-Bold',
    color: colors.primaryText,
  },
  idContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(20),
    paddingHorizontal: SPACING.xs,
  },
  idLabel: {
    fontSize: scaleFont(13, 0.35),
    fontFamily: 'Lato-Regular',
    color: colors.thirdText,
  },
  idValue: {
    flex: 1,
    fontSize: scaleFont(13, 0.35),
    fontFamily: 'Lato-Regular',
    color: colors.primaryText,
    marginLeft: SPACING.sm,
  },
  inputContainer: {
    marginBottom: verticalScale(24),
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(10),
  },
  label: {
    fontSize: scaleFont(14, 0.35),
    fontFamily: 'Montserrat-Bold',
    color: colors.PrimaryGreen,
  },
  charCount: {
    fontSize: scaleFont(12, 0.3),
    fontFamily: 'Lato-Regular',
    color: colors.thirdText,
  },
  charCountWarning: {
    color: colors.Danger,
  },
  textArea: {
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: scaleFont(15, 0.35),
    fontFamily: 'Lato-Regular',
    color: colors.primaryText,
    minHeight: verticalScale(160),
  },
  textAreaError: {
    borderColor: colors.Danger,
  },
  errorText: {
    fontSize: scaleFont(12, 0.3),
    fontFamily: 'Lato-Regular',
    color: colors.Danger,
    marginTop: verticalScale(6),
  },
  warningText: {
    fontSize: scaleFont(12, 0.3),
    fontFamily: 'Lato-Regular',
    color: colors.PrimaryGreen,
    marginTop: verticalScale(6),
  },
  buttonsContainer: {
    gap: verticalScale(12),
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.PrimaryGreen,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: verticalScale(16),
    gap: SPACING.sm,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: scaleFont(16, 0.35),
    fontFamily: 'Montserrat-Bold',
    color: colors.background,
  },
  cancelButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primaryText,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: verticalScale(14),
  },
  cancelButtonText: {
    fontSize: scaleFont(16, 0.35),
    fontFamily: 'Montserrat-Bold',
    color: colors.primaryText,
  },
})
