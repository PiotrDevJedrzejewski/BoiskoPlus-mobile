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
import { COLORS } from '../../../../constants/colors'

const Report = () => {
  const router = useRouter()
  const { type, userId, eventId } = useLocalSearchParams()

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
          <Ionicons name='flag' size={22} color={COLORS.secondary} />
          <Text style={styles.headerText}>Zgłaszanie</Text>
        </View>
        <View style={{ width: 40 }} />
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
            size={20}
            color={COLORS.secondary}
          />
          <Text style={styles.infoBannerText}>
            Wypełniasz formularz zgłoszenia na podstawie wybranego elementu
          </Text>
        </View>

        {/* Type display */}
        <View style={styles.typeContainer}>
          <View style={styles.typeIconWrapper}>
            <Ionicons name={getTypeIcon()} size={24} color={COLORS.secondary} />
          </View>
          <Text style={styles.typeText}>{getTypeDisplayName()}</Text>
        </View>

        {/* ID info (if available) */}
        {(userId || eventId) && (
          <View style={styles.idContainer}>
            <Text style={styles.idLabel}>
              {type === 'user' ? 'ID użytkownika:' : 'ID wydarzenia:'}
            </Text>
            <Text style={styles.idValue} numberOfLines={1}>
              {userId || eventId}
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
                <Ionicons name='send' size={18} color={COLORS.background} />
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
    fontSize: 20,
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
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 207, 0, 0.1)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 207, 0, 0.3)',
  },
  infoBannerText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Lato-Regular',
    color: COLORS.primary,
    marginLeft: 10,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  typeIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  typeText: {
    fontSize: 18,
    fontFamily: 'Montserrat-Bold',
    color: COLORS.primary,
  },
  idContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  idLabel: {
    fontSize: 13,
    fontFamily: 'Lato-Regular',
    color: COLORS.gray,
  },
  idValue: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Lato-Regular',
    color: COLORS.primary,
    marginLeft: 8,
  },
  inputContainer: {
    marginBottom: 24,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Montserrat-Bold',
    color: COLORS.secondary,
  },
  charCount: {
    fontSize: 12,
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
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: 'Lato-Regular',
    color: COLORS.primary,
    minHeight: 160,
  },
  textAreaError: {
    borderColor: COLORS.error,
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'Lato-Regular',
    color: COLORS.error,
    marginTop: 6,
  },
  warningText: {
    fontSize: 12,
    fontFamily: 'Lato-Regular',
    color: COLORS.secondary,
    marginTop: 6,
  },
  buttonsContainer: {
    gap: 12,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.secondary,
    borderRadius: 12,
    paddingVertical: 16,
    gap: 10,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 16,
    fontFamily: 'Montserrat-Bold',
    color: COLORS.background,
  },
  cancelButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'Montserrat-Bold',
    color: COLORS.primary,
  },
})
