import { useState, useEffect } from 'react'
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '../../constants/colors'

const FullScreenAd = ({ visible, onClose, onPremiumPress }) => {
  const [countdown, setCountdown] = useState(5)
  const [canClose, setCanClose] = useState(false)

  useEffect(() => {
    if (!visible) {
      setCountdown(5)
      setCanClose(false)
      return
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          setCanClose(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [visible])

  const handlePremiumPress = () => {
    if (onPremiumPress) {
      onPremiumPress()
    }
    onClose()
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType='fade'
      onRequestClose={canClose ? onClose : undefined}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Premium info */}
          <TouchableOpacity
            style={styles.premiumBanner}
            onPress={handlePremiumPress}
            activeOpacity={0.8}
          >
            <Ionicons name='diamond' size={20} color={COLORS.secondary} />
            <Text style={styles.premiumText}>
              Męczą Cię reklamy? Kup premium za 9.99zł + VAT
            </Text>
          </TouchableOpacity>

          {/* Ad placeholder */}
          <View style={styles.adContainer}>
            <Ionicons name='megaphone' size={64} color={COLORS.gray} />
            <Text style={styles.adPlaceholder}>REKLAMA</Text>
            <Text style={styles.adSubtext}>Tutaj wyświetli się reklama</Text>
          </View>

          {/* Close button */}
          <View style={styles.buttonWrapper}>
            {canClose ? (
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <Ionicons name='close' size={20} color={COLORS.background} />
                <Text style={styles.closeButtonText}>Zamknij reklamę</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.countdownButton}>
                <Text style={styles.countdownText}>
                  Prośba w trakcie wysyłania... ({countdown}s)
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  )
}

export default FullScreenAd

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  premiumBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  premiumText: {
    fontSize: 14,
    fontFamily: 'Lato-Regular',
    color: COLORS.primary,
    marginLeft: 10,
    textAlign: 'center',
  },
  adContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: COLORS.gray,
    borderStyle: 'dashed',
  },
  adPlaceholder: {
    fontSize: 24,
    fontFamily: 'Montserrat-Bold',
    color: COLORS.gray,
    marginTop: 12,
  },
  adSubtext: {
    fontSize: 12,
    fontFamily: 'Lato-Regular',
    color: COLORS.gray,
    marginTop: 4,
  },
  buttonWrapper: {
    width: '100%',
  },
  closeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.secondary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  closeButtonText: {
    fontSize: 16,
    fontFamily: 'Montserrat-Bold',
    color: COLORS.background,
    marginLeft: 8,
  },
  countdownButton: {
    backgroundColor: COLORS.backgroundSecondary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  countdownText: {
    fontSize: 14,
    fontFamily: 'Lato-Regular',
    color: COLORS.gray,
  },
})
