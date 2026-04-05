import { useState, useEffect, useMemo} from 'react'
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
import { useResponsiveScale } from '../../assets/utils/scaleUI.UX'

const FullScreenAd = ({ visible, onClose, onPremiumPress }) => {
  const ui = useResponsiveScale()
  const styles = useMemo(() => createStyles(ui), [ui])
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
            <Ionicons name='diamond' size={ui.moderateScale(20, 0.35)} color={COLORS.secondary} />
            <Text style={styles.premiumText}>
              Zostań wspierającym i korzystaj  bez reklam! Kliknij, aby dowiedzieć się więcej.
            </Text>
          </TouchableOpacity>

          {/* Ad placeholder */}
          <View style={styles.adContainer}>
            <Ionicons name='megaphone' size={ui.moderateScale(64, 0.35)} color={COLORS.gray} />
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
                <Ionicons name='close' size={ui.moderateScale(20, 0.35)} color={COLORS.background} />
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

const createStyles = (ui) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: ui.spacing(20, 0.45),
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
    paddingVertical: ui.verticalScale(12),
    paddingHorizontal: ui.spacing(20, 0.45),
    borderRadius: ui.moderateScale(12, 0.35),
    marginBottom: ui.verticalScale(24),
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  premiumText: {
    fontSize: ui.scaleFont(14, 0.35),
    fontFamily: 'Lato-Regular',
    color: COLORS.primary,
    marginLeft: ui.spacing(10, 0.35),
    textAlign: 'center',
  },
  adContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: ui.moderateScale(16, 0.35),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: ui.verticalScale(24),
    borderWidth: 2,
    borderColor: COLORS.gray,
    borderStyle: 'dashed',
  },
  adPlaceholder: {
    fontSize: ui.scaleFont(24, 0.45),
    fontFamily: 'Montserrat-Bold',
    color: COLORS.gray,
    marginTop: ui.verticalScale(12),
  },
  adSubtext: {
    fontSize: ui.scaleFont(12, 0.3),
    fontFamily: 'Lato-Regular',
    color: COLORS.gray,
    marginTop: ui.verticalScale(4),
  },
  buttonWrapper: {
    width: '100%',
  },
  closeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.secondary,
    paddingVertical: ui.verticalScale(16),
    paddingHorizontal: ui.spacing(24, 0.45),
    borderRadius: ui.moderateScale(12, 0.35),
  },
  closeButtonText: {
    fontSize: ui.scaleFont(16, 0.35),
    fontFamily: 'Montserrat-Bold',
    color: COLORS.background,
    marginLeft: ui.spacing(8, 0.35),
  },
  countdownButton: {
    backgroundColor: COLORS.backgroundSecondary,
    paddingVertical: ui.verticalScale(16),
    paddingHorizontal: ui.spacing(24, 0.45),
    borderRadius: ui.moderateScale(12, 0.35),
    alignItems: 'center',
  },
  countdownText: {
    fontSize: ui.scaleFont(14, 0.35),
    fontFamily: 'Lato-Regular',
    color: COLORS.gray,
  },
})
