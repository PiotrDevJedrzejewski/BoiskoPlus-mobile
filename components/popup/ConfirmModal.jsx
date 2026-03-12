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
import { COLORS } from '../../constants/colors'
import { useResponsiveScale } from '../../assets/utils/scaleUI.UX'

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
  const ui = useResponsiveScale()
  const styles = createStyles(ui)

  const getActionColor = () => {
    switch (actionType) {
      case 'danger':
        return COLORS.error
      case 'warning':
        return COLORS.secondary
      case 'success':
        return COLORS.third
      default:
        return COLORS.secondary
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
                size={ui.moderateScale(48, 0.35)}
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
                    <ActivityIndicator size='small' color={COLORS.background} />
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

const createStyles = (ui) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: ui.spacing(20, 0.45),
  },
  container: {
    width: '100%',
    maxWidth: 350,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: ui.moderateScale(16, 0.35),
    padding: ui.spacing(24, 0.45),
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: COLORS.secondary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  icon: {
    marginBottom: ui.verticalScale(16),
  },
  title: {
    fontSize: ui.scaleFont(16, 0.35),
    fontFamily: 'Lato-Regular',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: ui.verticalScale(12),
  },
  actionText: {
    fontSize: ui.scaleFont(24, 0.45),
    fontFamily: 'Montserrat-Bold',
    textAlign: 'center',
    marginBottom: ui.verticalScale(24),
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: ui.spacing(16),
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: ui.verticalScale(14),
    borderRadius: ui.moderateScale(10, 0.35),
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButton: {
    // backgroundColor set dynamically
  },
  confirmButtonText: {
    fontSize: ui.scaleFont(16, 0.35),
    fontFamily: 'Montserrat-Bold',
    color: COLORS.background,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  cancelButtonText: {
    fontSize: ui.scaleFont(16, 0.35),
    fontFamily: 'Montserrat-Bold',
    color: COLORS.primary,
  },
})
