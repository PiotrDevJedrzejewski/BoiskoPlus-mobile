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
  const { styles, colors } = useThemedStyles(createStyles)

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
                  size={moderateScale(24, 0.35)}
                  color={colors.PrimaryGreen}
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
                  <ActivityIndicator size='large' color={colors.PrimaryGreen} />
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
                          size={moderateScale(20, 0.35)}
                          color={colors.primaryText}
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
                      size={moderateScale(20, 0.35)}
                      color={isMuted ? colors.border : colors.thirdText}
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

const createStyles = (colors) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.backgroundSecondary,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    paddingBottom: verticalScale(40),
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(12),
  },
  headerText: {
    fontSize: scaleFont(18, 0.4),
    fontFamily: 'BarlowCondensed-ExtraBold',
    color: colors.primaryText,
    marginLeft: SPACING.sm,
  },
  roomName: {
    fontSize: scaleFont(14, 0.35),
    fontFamily: 'Inter-Regular',
    color: colors.thirdText,
    marginBottom: verticalScale(20),
    paddingLeft: SPACING.xl,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: verticalScale(40),
  },
  loadingText: {
    fontSize: scaleFont(14, 0.35),
    fontFamily: 'Inter-Regular',
    color: colors.thirdText,
    marginTop: verticalScale(12),
  },
  optionsContainer: {
    gap: SPACING.sm,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  optionText: {
    fontSize: scaleFont(15, 0.35),
    fontFamily: 'Inter-Regular',
    color: colors.primaryText,
    marginLeft: SPACING.md,
  },
  separator: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: verticalScale(16),
  },
  unmuteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  unmuteButtonDisabled: {
    borderColor: colors.divider,
  },
  unmuteText: {
    fontSize: scaleFont(15, 0.35),
    fontFamily: 'BarlowCondensed-Bold',
    color: colors.border,
    marginLeft: SPACING.md,
    flex: 1,
  },
  unmuteTextDisabled: {
    color: colors.thirdText,
  },
  mutedBadge: {
    backgroundColor: colors.Danger,
    borderRadius: BORDER_RADIUS.sm,
    paddingVertical: verticalScale(4),
    paddingHorizontal: SPACING.sm,
  },
  mutedBadgeText: {
    fontSize: scaleFont(10, 0.25),
    fontFamily: 'BarlowCondensed-Bold',
    color: '#fff',
  },
  cancelButton: {
    marginTop: verticalScale(16),
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primaryText,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: verticalScale(14),
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: scaleFont(14, 0.35),
    fontFamily: 'BarlowCondensed-Bold',
    color: colors.primaryText,
  },
})
