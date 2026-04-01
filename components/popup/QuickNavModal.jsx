import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { COLORS } from '../../constants/colors'
import { useSocketIo } from '../../context/SocketIoContext'
import { useResponsiveScale } from '../../assets/utils/scaleUI.UX'

const QuickNavModal = ({ visible, onClose }) => {
  const router = useRouter()
  const ui = useResponsiveScale()
  const styles = createStyles(ui)

  const { unreadFriendRequestsCount, unreadEventsCount, totalUnreadMessages } =
    useSocketIo()

  const navigate = (path) => {
    onClose()
    router.push(path)
  }

  const buttons = [
    {
      key: 'friends',
      label: 'Znajomi',
      icon: 'people',
      count: unreadFriendRequestsCount,
      path: '/(auth)/friends',
    },
    {
      key: 'events',
      label: 'Eventy',
      icon: 'calendar',
      count: unreadEventsCount,
      path: '/(auth)/my-events',
    },
    {
      key: 'chat',
      label: 'Chat',
      icon: 'chatbubbles',
      count: totalUnreadMessages,
      path: '/(auth)/chat',
    },
  ]

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
              {/* Header label */}
              <View style={styles.header}>
                <Ionicons
                  name='notifications'
                  size={ui.moderateScale(18, 0.35)}
                  color={COLORS.secondary}
                />
                <Text style={styles.headerText}>Powiadomienia</Text>
              </View>

              {/* Buttons row */}
              <View style={styles.buttonsRow}>
                {buttons.map((btn) => (
                  <View key={btn.key} style={styles.buttonWrapper}>
                    <Pressable
                      style={({ pressed }) => [
                        styles.roundButton,
                        pressed && styles.roundButtonPressed,
                      ]}
                      onPress={() => navigate(btn.path)}
                      android_ripple={{
                        color: COLORS.backgroundSecondary,
                        borderless: false,
                      }}
                    >
                      <Ionicons
                        name={btn.icon}
                        size={ui.moderateScale(26, 0.35)}
                        color={COLORS.primary}
                      />
                      {/* Badge - position absolute top-right */}
                      {btn.count > 0 && (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>
                            {btn.count > 9 ? '9+' : btn.count}
                          </Text>
                        </View>
                      )}
                    </Pressable>
                    <Text style={styles.buttonLabel}>{btn.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  )
}

export default QuickNavModal

const createStyles = (ui) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      justifyContent: 'flex-start',
      alignItems: 'flex-end',
    },
    container: {
      marginTop: ui.verticalScale(70),
      marginRight: ui.spacing(12, 0.35),
      backgroundColor: COLORS.backgroundSecondary,
      borderRadius: ui.moderateScale(16, 0.3),
      paddingVertical: ui.verticalScale(16),
      paddingHorizontal: ui.spacing(16, 0.35),
      borderWidth: 1,
      borderColor: COLORS.third,
      minWidth: ui.scale(240),
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 10,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ui.spacing(6, 0.3),
      marginBottom: ui.verticalScale(16),
      paddingBottom: ui.verticalScale(10),
      borderBottomWidth: 1,
      borderBottomColor: COLORS.third,
    },
    headerText: {
      color: COLORS.secondary,
      fontSize: ui.scaleFont(15, 0.35),
      fontFamily: 'Montserrat-Bold',
    },
    buttonsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: ui.spacing(10, 0.3),
    },
    buttonWrapper: {
      alignItems: 'center',
      gap: ui.verticalScale(6),
    },
    roundButton: {
      width: ui.scale(58),
      height: ui.scale(58),
      borderRadius: ui.scale(29),
      backgroundColor: COLORS.background,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: COLORS.third,
    },
    roundButtonPressed: {
      backgroundColor: COLORS.third,
    },
    buttonLabel: {
      color: COLORS.primary,
      fontSize: ui.scaleFont(11, 0.3),
      fontFamily: 'Montserrat-Bold',
      textAlign: 'center',
    },
    badge: {
      position: 'absolute',
      top: -ui.verticalScale(4),
      right: -ui.spacing(4, 0.3),
      backgroundColor: COLORS.error,
      borderRadius: ui.moderateScale(10, 0.25),
      minWidth: ui.scale(18),
      height: ui.scale(18),
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: ui.spacing(3, 0.25),
    },
    badgeText: {
      color: '#fff',
      fontSize: ui.scaleFont(10, 0.25),
      fontFamily: 'Montserrat-Bold',
    },
  })
