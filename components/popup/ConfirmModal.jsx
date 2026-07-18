import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useThemedStyles } from '../../context/themeStore'
import { SPACING, BORDER_RADIUS } from '../../Theme/StyleConstants'
import { verticalScale, moderateScale, scaleFont } from '../../Theme/ScalableStyles'

// <ConfirmModal
//   visible={showDelete}
//   onClose={() => setShowDelete(false)}
//   onConfirm={handleDelete}
//   title='Czy na pewno chcesz usunąć wydarzenie?'
//   actionText='USUŃ'
//   actionType='danger'
// />

const ConfirmModal = ({
  visible,
  onClose,
  onConfirm,
  title = 'Czy na pewno chcesz wykonać tę akcję?',
  actionText = 'POTWIERDŹ',
  actionType = 'danger', // 'danger' | 'warning' | 'success'
  confirmButtonText = 'TAK',
  cancelButtonText = 'NIE',
  loading = false,
}) => {
  const { styles, colors } = useThemedStyles(createStyles)

  const getActionColor = () => {
    switch (actionType) {
      case 'danger':
        return colors.Danger
      case 'warning':
        return colors.PrimaryGreen
      case 'success':
        return colors.border
      default:
        return colors.PrimaryGreen
    }
  }

  const getActionIcon = () => {
    switch (actionType) {
      case 'danger':
        return 'warning'
      case 'warning':
        return 'alert-circle'
      case 'success':
        return 'checkmark-circle'
      default:
        return 'help-circle'
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType='fade'
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.container}>
              {/* Icon */}
              <Ionicons
                name={getActionIcon()}
                size={moderateScale(48, 0.35)}
                color={getActionColor()}
                style={styles.icon}
              />

              {/* Title */}
              <Text style={styles.title}>{title}</Text>

              {/* Action Text */}
              <Text style={[styles.actionText, { color: getActionColor() }]}>
                {actionText}
              </Text>

              {/* Buttons */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.confirmButton,
                    { backgroundColor: getActionColor() },
                  ]}
                  onPress={onConfirm}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator size='small' color={colors.background} />
                  ) : (
                    <Text style={styles.confirmButtonText}>
                      {confirmButtonText}
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={onClose}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <Text style={styles.cancelButtonText}>
                    {cancelButtonText}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  )
}

export default ConfirmModal

const createStyles = (colors) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  container: {
    width: '100%',
    maxWidth: 350,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: colors.PrimaryGreen,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  icon: {
    marginBottom: verticalScale(16),
  },
  title: {
    fontSize: scaleFont(16, 0.35),
    fontFamily: 'Lato-Regular',
    color: colors.primaryText,
    textAlign: 'center',
    marginBottom: verticalScale(12),
  },
  actionText: {
    fontSize: scaleFont(24, 0.45),
    fontFamily: 'Montserrat-Bold',
    textAlign: 'center',
    marginBottom: verticalScale(24),
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: verticalScale(14),
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButton: {
    // backgroundColor set dynamically
  },
  confirmButtonText: {
    fontSize: scaleFont(16, 0.35),
    fontFamily: 'Montserrat-Bold',
    color: colors.background,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primaryText,
  },
  cancelButtonText: {
    fontSize: scaleFont(16, 0.35),
    fontFamily: 'Montserrat-Bold',
    color: colors.primaryText,
  },
})
