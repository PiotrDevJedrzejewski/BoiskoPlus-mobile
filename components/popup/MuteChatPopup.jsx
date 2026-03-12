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

const MUTE_OPTIONS = [
  { key: '1h', label: 'Wycisz na 1 godzinę', icon: 'time-outline' },
  { key: '12h', label: 'Wycisz na 12 godzin', icon: 'time-outline' },
  { key: '24h', label: 'Wycisz na 24 godziny', icon: 'today-outline' },
  { key: '1w', label: 'Wycisz na tydzień', icon: 'calendar-outline' },
  { key: 'permanent', label: 'Wycisz na stałe', icon: 'infinite-outline' },
]

{
  /* <MuteChatModal
  visible={showMuteModal}
  onClose={() => setShowMuteModal(false)}
  onMute={(duration) => handleMuteChat(duration)}
  onUnmute={handleUnmuteChat}
  isMuted={isChatMuted}
  roomName="Czat z Adam"
/> */
}

const MuteChatModal = ({
  visible,
  onClose,
  onMute,
  onUnmute,
  isMuted = false,
  loading = false,
  roomName = 'Czat',
}) => {
  const ui = useResponsiveScale()
  const styles = createStyles(ui)

  const handleMute = (duration) => {
    if (onMute) {
      onMute(duration)
    }
  }

  const handleUnmute = () => {
    if (onUnmute) {
      onUnmute()
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType='slide'
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.container}>
              {/* Header */}
              <View style={styles.header}>
                <Ionicons
                  name={isMuted ? 'notifications-off' : 'notifications'}
                  size={ui.moderateScale(24, 0.35)}
                  color={COLORS.secondary}
                />
                <Text style={styles.headerText}>Ustawienia powiadomień</Text>
              </View>

              {/* Room name */}
              <Text style={styles.roomName} numberOfLines={1}>
                {roomName}
              </Text>

              {/* Loading */}
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size='large' color={COLORS.secondary} />
                  <Text style={styles.loadingText}>Zapisywanie...</Text>
                </View>
              ) : (
                <>
                  {/* Mute options */}
                  <View style={styles.optionsContainer}>
                    {MUTE_OPTIONS.map((option) => (
                      <TouchableOpacity
                        key={option.key}
                        style={styles.optionItem}
                        onPress={() => handleMute(option.key)}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name={option.icon}
                          size={ui.moderateScale(20, 0.35)}
                          color={COLORS.primary}
                        />
                        <Text style={styles.optionText}>{option.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Separator */}
                  <View style={styles.separator} />

                  {/* Unmute option */}
                  <TouchableOpacity
                    style={[
                      styles.unmuteButton,
                      !isMuted && styles.unmuteButtonDisabled,
                    ]}
                    onPress={handleUnmute}
                    disabled={!isMuted}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name='notifications'
                      size={ui.moderateScale(20, 0.35)}
                      color={isMuted ? COLORS.third : COLORS.gray}
                    />
                    <Text
                      style={[
                        styles.unmuteText,
                        !isMuted && styles.unmuteTextDisabled,
                      ]}
                    >
                      Włącz powiadomienia
                    </Text>
                    {isMuted && (
                      <View style={styles.mutedBadge}>
                        <Text style={styles.mutedBadgeText}>Wyciszono</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </>
              )}

              {/* Cancel button */}
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>Anuluj</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  )
}

export default MuteChatModal

const createStyles = (ui) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: COLORS.backgroundSecondary,
    borderTopLeftRadius: ui.moderateScale(24, 0.35),
    borderTopRightRadius: ui.moderateScale(24, 0.35),
    padding: ui.spacing(20, 0.45),
    paddingBottom: ui.verticalScale(40),
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ui.verticalScale(12),
  },
  headerText: {
    fontSize: ui.scaleFont(18, 0.4),
    fontFamily: 'Montserrat-Bold',
    color: COLORS.primary,
    marginLeft: ui.spacing(10, 0.35),
  },
  roomName: {
    fontSize: ui.scaleFont(14, 0.35),
    fontFamily: 'Lato-Regular',
    color: COLORS.gray,
    marginBottom: ui.verticalScale(20),
    paddingLeft: ui.spacing(34, 0.4),
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: ui.verticalScale(40),
  },
  loadingText: {
    fontSize: ui.scaleFont(14, 0.35),
    fontFamily: 'Lato-Regular',
    color: COLORS.gray,
    marginTop: ui.verticalScale(12),
  },
  optionsContainer: {
    gap: ui.spacing(8, 0.35),
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: ui.moderateScale(12, 0.35),
    padding: ui.spacing(16),
  },
  optionText: {
    fontSize: ui.scaleFont(15, 0.35),
    fontFamily: 'Lato-Regular',
    color: COLORS.primary,
    marginLeft: ui.spacing(12, 0.35),
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: ui.verticalScale(16),
  },
  unmuteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: ui.moderateScale(12, 0.35),
    padding: ui.spacing(16),
    borderWidth: 1,
    borderColor: COLORS.third,
  },
  unmuteButtonDisabled: {
    borderColor: 'rgba(255,255,255,0.1)',
  },
  unmuteText: {
    fontSize: ui.scaleFont(15, 0.35),
    fontFamily: 'Montserrat-Bold',
    color: COLORS.third,
    marginLeft: ui.spacing(12, 0.35),
    flex: 1,
  },
  unmuteTextDisabled: {
    color: COLORS.gray,
  },
  mutedBadge: {
    backgroundColor: COLORS.error,
    borderRadius: ui.moderateScale(8, 0.35),
    paddingVertical: ui.verticalScale(4),
    paddingHorizontal: ui.spacing(8, 0.35),
  },
  mutedBadgeText: {
    fontSize: ui.scaleFont(10, 0.25),
    fontFamily: 'Montserrat-Bold',
    color: '#fff',
  },
  cancelButton: {
    marginTop: ui.verticalScale(16),
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: ui.moderateScale(12, 0.35),
    paddingVertical: ui.verticalScale(14),
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: ui.scaleFont(14, 0.35),
    fontFamily: 'Montserrat-Bold',
    color: COLORS.primary,
  },
})
