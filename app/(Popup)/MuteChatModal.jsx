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
                  size={24}
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
                          size={20}
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
                      size={20}
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

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: COLORS.backgroundSecondary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerText: {
    fontSize: 18,
    fontFamily: 'Montserrat-Bold',
    color: COLORS.primary,
    marginLeft: 10,
  },
  roomName: {
    fontSize: 14,
    fontFamily: 'Lato-Regular',
    color: COLORS.gray,
    marginBottom: 20,
    paddingLeft: 34,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Lato-Regular',
    color: COLORS.gray,
    marginTop: 12,
  },
  optionsContainer: {
    gap: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
  },
  optionText: {
    fontSize: 15,
    fontFamily: 'Lato-Regular',
    color: COLORS.primary,
    marginLeft: 12,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 16,
  },
  unmuteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.third,
  },
  unmuteButtonDisabled: {
    borderColor: 'rgba(255,255,255,0.1)',
  },
  unmuteText: {
    fontSize: 15,
    fontFamily: 'Montserrat-Bold',
    color: COLORS.third,
    marginLeft: 12,
    flex: 1,
  },
  unmuteTextDisabled: {
    color: COLORS.gray,
  },
  mutedBadge: {
    backgroundColor: COLORS.error,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  mutedBadgeText: {
    fontSize: 10,
    fontFamily: 'Montserrat-Bold',
    color: '#fff',
  },
  cancelButton: {
    marginTop: 16,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontFamily: 'Montserrat-Bold',
    color: COLORS.primary,
  },
})
