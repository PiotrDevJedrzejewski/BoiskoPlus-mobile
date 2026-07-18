import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useThemedStyles } from '../../context/themeStore'
import { SPACING, BORDER_RADIUS } from '../../Theme/StyleConstants'
import { scale, verticalScale, moderateScale, scaleFont } from '../../Theme/ScalableStyles'

const NotificationsModal = ({
  visible,
  onClose,
  unreadMessages = 0,
  unreadEvents = 0,
}) => {
  const router = useRouter()
  const { styles, colors } = useThemedStyles(createStyles)
  const totalUnread = unreadMessages + unreadEvents

  const handleNavigateToChat = () => {
    onClose()
    router.push('/(auth)/chat')
  }

  const handleNavigateToEvents = () => {
    onClose()
    router.push('/(auth)/events-managment/events-allEvents')
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
              {/* Header */}
              <View style={styles.header}>
                <Ionicons
                  name='notifications'
                  size={moderateScale(24, 0.35)}
                  color={colors.PrimaryGreen}
                />
                <Text style={styles.headerText}>Powiadomienia</Text>
                {totalUnread > 0 && (
                  <View style={styles.totalBadge}>
                    <Text style={styles.totalBadgeText}>
                      {totalUnread > 99 ? '99+' : totalUnread}
                    </Text>
                  </View>
                )}
              </View>

              {/* Notifications List */}
              <View style={styles.listContainer}>
                {/* Chat notifications */}
                <TouchableOpacity
                  style={styles.notificationItem}
                  onPress={handleNavigateToChat}
                  activeOpacity={0.7}
                >
                  <View style={styles.notificationLeft}>
                    <Ionicons
                      name='chatbubbles'
                      size={moderateScale(24, 0.35)}
                      color={colors.primaryText}
                    />
                    <Text style={styles.notificationText}>Nowe wiadomości</Text>
                  </View>
                  <View
                    style={[
                      styles.badge,
                      unreadMessages === 0 && styles.badgeEmpty,
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        unreadMessages === 0 && styles.badgeTextEmpty,
                      ]}
                    >
                      {unreadMessages}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Event notifications */}
                <TouchableOpacity
                  style={styles.notificationItem}
                  onPress={handleNavigateToEvents}
                  activeOpacity={0.7}
                >
                  <View style={styles.notificationLeft}>
                    <Ionicons
                      name='calendar'
                      size={moderateScale(24, 0.35)}
                      color={colors.primaryText}
                    />
                    <Text style={styles.notificationText}>
                      Powiadomienia wydarzeń
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.badge,
                      unreadEvents === 0 && styles.badgeEmpty,
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        unreadEvents === 0 && styles.badgeTextEmpty,
                      ]}
                    >
                      {unreadEvents}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Close button */}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <Text style={styles.closeButtonText}>Zamknij</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  )
}

export default NotificationsModal

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
    padding: SPACING.lg,
    borderBottomWidth: 2,
    borderBottomColor: colors.PrimaryGreen,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(20),
    paddingBottom: verticalScale(16),
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  headerText: {
    fontSize: scaleFont(20, 0.4),
    fontFamily: 'Montserrat-Bold',
    color: colors.primaryText,
    marginLeft: SPACING.sm,
    flex: 1,
  },
  totalBadge: {
    backgroundColor: colors.Danger,
    borderRadius: BORDER_RADIUS.md,
    minWidth: scale(24),
    height: scale(24),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
  },
  totalBadgeText: {
    fontSize: scaleFont(12, 0.3),
    fontFamily: 'Montserrat-Bold',
    color: '#fff',
  },
  listContainer: {
    gap: SPACING.md,
    marginBottom: verticalScale(20),
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  notificationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  notificationText: {
    fontSize: scaleFont(14, 0.35),
    fontFamily: 'Lato-Regular',
    color: colors.primaryText,
    marginLeft: SPACING.md,
  },
  badge: {
    backgroundColor: colors.PrimaryGreen,
    borderRadius: BORDER_RADIUS.md,
    minWidth: scale(28),
    height: scale(28),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
  },
  badgeEmpty: {
    backgroundColor: colors.divider,
  },
  badgeText: {
    fontSize: scaleFont(14, 0.35),
    fontFamily: 'Montserrat-Bold',
    color: colors.background,
  },
  badgeTextEmpty: {
    color: colors.thirdText,
  },
  closeButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primaryText,
    borderRadius: BORDER_RADIUS.sm,
    paddingVertical: verticalScale(12),
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: scaleFont(14, 0.35),
    fontFamily: 'Montserrat-Bold',
    color: colors.primaryText,
  },
})
