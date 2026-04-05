import { useCallback, useEffect, useMemo } from 'react'
import {
  BackHandler,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { COLORS } from '../../constants/colors'
import { useSocketStore, selectTotalUnreadMessages } from '../../context/socketStore'
import { useResponsiveScale } from '../../assets/utils/scaleUI.UX'

const ANIMATION_DURATION = 200

const QuickNavModal = ({ visible, onClose }) => {
  const router = useRouter()
  const ui = useResponsiveScale()
  const styles = useMemo(() => createStyles(ui), [ui])

  const unreadFriendRequestsCount = useSocketStore((s) => s.unreadFriendRequestsCount)
  const unreadEventsCount = useSocketStore((s) => s.unreadEventsCount)
  const totalUnreadMessages = useSocketStore(selectTotalUnreadMessages)

  const progress = useSharedValue(0)

  useEffect(() => {
    progress.value = withTiming(visible ? 1 : 0, {
      duration: ANIMATION_DURATION,
      easing: Easing.out(Easing.cubic),
    })
  }, [visible, progress])

  // Android back button support
  useEffect(() => {
    if (!visible) return
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose()
      return true
    })
    return () => sub.remove()
  }, [visible, onClose])

  const navigate = useCallback((path) => {
    onClose()
    router.push(path)
  }, [onClose, router])

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

  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    pointerEvents: progress.value > 0 ? 'auto' : 'none',
  }))

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { translateY: withTiming(visible ? 0 : -8, { duration: ANIMATION_DURATION }) },
      { scale: 0.95 + 0.05 * progress.value },
    ],
  }))

  const backdropTap = Gesture.Tap().onEnd(() => {
    runOnJS(onClose)()
  })

  return (
    <GestureDetector gesture={backdropTap}>
      <Animated.View style={[styles.overlay, overlayAnimatedStyle]}>
        <Animated.View style={[styles.container, containerAnimatedStyle]}>
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
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  )
}

export default QuickNavModal

const createStyles = (ui) =>
  StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      justifyContent: 'flex-start',
      alignItems: 'flex-end',
      zIndex: 80,
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
