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
import { COLORS } from '../../constants/colors'
import { useResponsiveScale } from '../../assets/utils/scaleUI.UX'

const NotificationsModal = ({
  visible,
  onClose,
  unreadMessages = 0,
  unreadEvents = 0,
}) => {
  const router = useRouter()
  const ui = useResponsiveScale()
  const styles = createStyles(ui)
  const totalUnread = unreadMessages + unreadEvents

  const handleNavigateToChat = () => {
    onClose()
    router.push('/(main)/(tabs)/chat')
  }

  const handleNavigateToEvents = () => {
    onClose()
    router.push('/(main)/(tabs)/(hidden)/events-managment/events-allEvents')
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
                  size={ui.moderateScale(24, 0.35)}
                  color={COLORS.secondary}
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
                      size={ui.moderateScale(24, 0.35)}
                      color={COLORS.primary}
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
                      size={ui.moderateScale(24, 0.35)}
                      color={COLORS.primary}
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
    padding: ui.spacing(20, 0.45),
    borderBottomWidth: 2,
    borderBottomColor: COLORS.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ui.verticalScale(20),
    paddingBottom: ui.verticalScale(16),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerText: {
    fontSize: ui.scaleFont(20, 0.4),
    fontFamily: 'Montserrat-Bold',
    color: COLORS.primary,
    marginLeft: ui.spacing(10, 0.35),
    flex: 1,
  },
  totalBadge: {
    backgroundColor: COLORS.error,
    borderRadius: ui.moderateScale(12, 0.35),
    minWidth: ui.scale(24),
    height: ui.scale(24),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: ui.spacing(8, 0.35),
  },
  totalBadgeText: {
    fontSize: ui.scaleFont(12, 0.3),
    fontFamily: 'Montserrat-Bold',
    color: '#fff',
  },
  listContainer: {
    gap: ui.spacing(12, 0.35),
    marginBottom: ui.verticalScale(20),
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background,
    borderRadius: ui.moderateScale(12, 0.35),
    padding: ui.spacing(16),
  },
  notificationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  notificationText: {
    fontSize: ui.scaleFont(14, 0.35),
    fontFamily: 'Lato-Regular',
    color: COLORS.primary,
    marginLeft: ui.spacing(12, 0.35),
  },
  badge: {
    backgroundColor: COLORS.secondary,
    borderRadius: ui.moderateScale(12, 0.35),
    minWidth: ui.scale(28),
    height: ui.scale(28),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: ui.spacing(8, 0.35),
  },
  badgeEmpty: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  badgeText: {
    fontSize: ui.scaleFont(14, 0.35),
    fontFamily: 'Montserrat-Bold',
    color: COLORS.background,
  },
  badgeTextEmpty: {
    color: COLORS.gray,
  },
  closeButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: ui.moderateScale(10, 0.35),
    paddingVertical: ui.verticalScale(12),
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: ui.scaleFont(14, 0.35),
    fontFamily: 'Montserrat-Bold',
    color: COLORS.primary,
  },
})
