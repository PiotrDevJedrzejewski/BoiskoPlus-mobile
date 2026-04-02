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
import { COLORS } from '../../constants/colors'
import { useResponsiveScale } from '../../assets/utils/scaleUI.UX'
import { dbg, useDebugMount } from '../../assets/utils/debugLogger'

const Report = () => {
  dbg('ReportScreen')
  useDebugMount('ReportScreen')
  const router = useRouter()
  const ui = useResponsiveScale()
  const styles = createStyles(ui)
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
          <Ionicons name='arrow-back' size={ui.moderateScale(24, 0.35)} color={COLORS.secondary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Ionicons name='flag' size={ui.moderateScale(22, 0.35)} color={COLORS.secondary} />
          <Text style={styles.headerText}>Zgłaszanie</Text>
        </View>
        <View style={{ width: ui.moderateScale(40, 0.35) }} />
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
            size={ui.moderateScale(20, 0.35)}
            color={COLORS.secondary}
          />
          <Text style={styles.infoBannerText}>
            Wypełniasz formularz zgłoszenia na podstawie wybranego elementu
          </Text>
        </View>

        {/* Type display */}
        <View style={styles.typeContainer}>
          <View style={styles.typeIconWrapper}>
            <Ionicons name={getTypeIcon()} size={ui.moderateScale(24, 0.35)} color={COLORS.secondary} />
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
            placeholderTextColor={COLORS.gray}
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
              <ActivityIndicator size='small' color={COLORS.background} />
            ) : (
              <>
                <Text style={styles.submitButtonText}>Wyślij raport</Text>
                <Ionicons name='send' size={ui.moderateScale(18, 0.35)} color={COLORS.background} />
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
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

export default Report

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
    fontSize: ui.scaleFont(20, 0.4),
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
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 207, 0, 0.1)',
    borderRadius: ui.moderateScale(12, 0.35),
    padding: ui.spacing(14, 0.35),
    marginBottom: ui.verticalScale(20),
    borderWidth: 1,
    borderColor: 'rgba(255, 207, 0, 0.3)',
  },
  infoBannerText: {
    flex: 1,
    fontSize: ui.scaleFont(13, 0.35),
    fontFamily: 'Lato-Regular',
    color: COLORS.primary,
    marginLeft: ui.spacing(10, 0.35),
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: ui.moderateScale(12, 0.35),
    padding: ui.spacing(16),
    marginBottom: ui.verticalScale(16),
  },
  typeIconWrapper: {
    width: ui.moderateScale(44, 0.35),
    height: ui.moderateScale(44, 0.35),
    borderRadius: ui.moderateScale(22, 0.35),
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ui.spacing(14, 0.35),
  },
  typeText: {
    fontSize: ui.scaleFont(18, 0.4),
    fontFamily: 'Montserrat-Bold',
    color: COLORS.primary,
  },
  idContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ui.verticalScale(20),
    paddingHorizontal: ui.spacing(4, 0.25),
  },
  idLabel: {
    fontSize: ui.scaleFont(13, 0.35),
    fontFamily: 'Lato-Regular',
    color: COLORS.gray,
  },
  idValue: {
    flex: 1,
    fontSize: ui.scaleFont(13, 0.35),
    fontFamily: 'Lato-Regular',
    color: COLORS.primary,
    marginLeft: ui.spacing(8, 0.35),
  },
  inputContainer: {
    marginBottom: ui.verticalScale(24),
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ui.verticalScale(10),
  },
  label: {
    fontSize: ui.scaleFont(14, 0.35),
    fontFamily: 'Montserrat-Bold',
    color: COLORS.secondary,
  },
  charCount: {
    fontSize: ui.scaleFont(12, 0.3),
    fontFamily: 'Lato-Regular',
    color: COLORS.gray,
  },
  charCountWarning: {
    color: COLORS.error,
  },
  textArea: {
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: ui.controlRadius,
    paddingHorizontal: ui.controlPaddingHorizontal,
    paddingVertical: ui.controlPaddingVertical,
    fontSize: ui.scaleFont(15, 0.35),
    fontFamily: 'Lato-Regular',
    color: COLORS.primary,
    minHeight: ui.verticalScale(160),
  },
  textAreaError: {
    borderColor: COLORS.error,
  },
  errorText: {
    fontSize: ui.scaleFont(12, 0.3),
    fontFamily: 'Lato-Regular',
    color: COLORS.error,
    marginTop: ui.verticalScale(6),
  },
  warningText: {
    fontSize: ui.scaleFont(12, 0.3),
    fontFamily: 'Lato-Regular',
    color: COLORS.secondary,
    marginTop: ui.verticalScale(6),
  },
  buttonsContainer: {
    gap: ui.verticalScale(12),
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.secondary,
    borderRadius: ui.moderateScale(12, 0.35),
    paddingVertical: ui.verticalScale(16),
    gap: ui.spacing(10, 0.35),
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: ui.scaleFont(16, 0.35),
    fontFamily: 'Montserrat-Bold',
    color: COLORS.background,
  },
  cancelButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: ui.moderateScale(12, 0.35),
    paddingVertical: ui.verticalScale(14),
  },
  cancelButtonText: {
    fontSize: ui.scaleFont(16, 0.35),
    fontFamily: 'Montserrat-Bold',
    color: COLORS.primary,
  },
})
