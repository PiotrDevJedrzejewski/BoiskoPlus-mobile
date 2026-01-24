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

const NotificationsModal = ({
  visible,
  onClose,
  unreadMessages = 0,
  unreadEvents = 0,
}) => {
  const router = useRouter()
  const totalUnread = unreadMessages + unreadEvents

  const handleNavigateToChat = () => {
    onClose()
    router.push('/(main)/(tabs)/chat')
  }

  const handleNavigateToEvents = () => {
    onClose()
    router.push('/(main)/(tabs)/(hidden)/my-events')
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
                  size={24}
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
                      size={24}
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
                      size={24}
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

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 350,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 16,
    padding: 20,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerText: {
    fontSize: 20,
    fontFamily: 'Montserrat-Bold',
    color: COLORS.primary,
    marginLeft: 10,
    flex: 1,
  },
  totalBadge: {
    backgroundColor: COLORS.error,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  totalBadgeText: {
    fontSize: 12,
    fontFamily: 'Montserrat-Bold',
    color: '#fff',
  },
  listContainer: {
    gap: 12,
    marginBottom: 20,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
  },
  notificationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  notificationText: {
    fontSize: 14,
    fontFamily: 'Lato-Regular',
    color: COLORS.primary,
    marginLeft: 12,
  },
  badge: {
    backgroundColor: COLORS.secondary,
    borderRadius: 12,
    minWidth: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  badgeEmpty: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  badgeText: {
    fontSize: 14,
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
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 14,
    fontFamily: 'Montserrat-Bold',
    color: COLORS.primary,
  },
})
