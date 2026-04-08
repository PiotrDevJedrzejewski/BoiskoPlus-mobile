import { useCallback, useMemo } from 'react'
import { View, Text, Pressable, ScrollView, StyleSheet, Dimensions, InteractionManager } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, {
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { COLORS } from '../constants/colors'
import { useAuth } from '../context/AuthContext'
import { useDrawer } from '../context/DrawerContext'
import { useResponsiveScale } from '../assets/utils/scaleUI.UX'

const DRAWER_WIDTH = 300
const ANIMATION_DURATION = 250
const SWIPE_THRESHOLD = 80

const DrawerModal = () => {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { logout } = useAuth()
  const { drawerOpen, closeDrawer } = useDrawer()
  const ui = useResponsiveScale()
  const styles = useMemo(() => createStyles(ui, insets), [ui, insets])

  const navigateTo = useCallback((path) => {
    closeDrawer()
    // Navigate after drawer close animation finishes (runs on UI thread, no setTimeout)
    InteractionManager.runAfterInteractions(() => router.push(path))
  }, [closeDrawer, router])

  // Animated style for the drawer panel (slide from left)
  const drawerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{
      translateX: withTiming(
        drawerOpen.value === 1 ? 0 : -DRAWER_WIDTH,
        { duration: ANIMATION_DURATION, easing: Easing.out(Easing.cubic) }
      ),
    }],
  }))

  // Animated style for backdrop opacity
  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: withTiming(
      drawerOpen.value === 1 ? 1 : 0,
      { duration: ANIMATION_DURATION }
    ),
    pointerEvents: drawerOpen.value === 1 ? 'auto' : 'none',
  }))

  // Swipe-to-close gesture on the drawer panel
  const swipeGesture = Gesture.Pan()
    .activeOffsetX(-20)
    .onEnd((event) => {
      if (event.translationX < -SWIPE_THRESHOLD) {
        drawerOpen.value = 0
      }
    })

  // Tap backdrop to close
  const backdropTap = Gesture.Tap().onEnd(() => {
    drawerOpen.value = 0
  })

  return (
    <>
      {/* Backdrop */}
      <GestureDetector gesture={backdropTap}>
        <Animated.View style={[styles.backdrop, backdropAnimatedStyle]} />
      </GestureDetector>

      {/* Drawer Panel */}
      <GestureDetector gesture={swipeGesture}>
        <Animated.View style={[styles.drawerPanel, drawerAnimatedStyle]}>
          <LinearGradient
            colors={[COLORS.third, COLORS.background]}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 0 }}
            style={styles.gradientContainer}
          >
            {/* Safe area spacer */}
            <View style={{ height: insets.top, backgroundColor: '#000' }} />

            {/* Close button X */}
            <Pressable
              style={styles.closeButtonX}
              onPress={closeDrawer}
              android_ripple={{ color: COLORS.background }}
            >
              <Ionicons name='close' size={28} color={COLORS.primary} />
            </Pressable>

            <ScrollView style={styles.scrollContainer} contentContainerStyle={{ paddingBottom: insets.bottom }} showsVerticalScrollIndicator={false}>
              {/* Tab screens */}
              <DrawerItem icon='home' label='Panel Główny' onPress={() => navigateTo('/(auth)/(map-screens)/dashboard-home')} styles={styles} ui={ui} />
              <DrawerItem icon='map' label='Mapa' onPress={() => navigateTo('/(auth)/(map-screens)/show-map')} styles={styles} ui={ui} />
              <DrawerItem icon='search' label='Szukaj' onPress={() => navigateTo('/(auth)/(map-screens)/find-event')} styles={styles} ui={ui} />
              <DrawerItem icon='chatbubbles' label='Czat' onPress={() => navigateTo('/(auth)/chat')} styles={styles} ui={ui} />
              <DrawerItem icon='people' label='Znajomi' onPress={() => navigateTo('/(auth)/friends')} styles={styles} ui={ui} />
              <DrawerItem icon='calendar' label='Moje Wydarzenia' onPress={() => navigateTo('/(auth)/events-managment/events-dashboard')} styles={styles} ui={ui} />

              {/* Hidden screens */}
              <DrawerItem icon='add-circle' label='Stwórz Wydarzenie' onPress={() => navigateTo('/(auth)/add-event')} styles={styles} ui={ui} />
              <DrawerItem icon='trophy' label='Ranking' onPress={() => navigateTo('/(auth)/ranking')} styles={styles} ui={ui} />
              <DrawerItem icon='star' label='Premium' onPress={() => navigateTo('/(auth)/premium')} styles={styles} ui={ui} />
              <DrawerItem icon='person' label='Profil' onPress={() => navigateTo('/(auth)/profile')} styles={styles} ui={ui} />
              <DrawerItem icon='settings-sharp' label='Ustawienia' onPress={() => navigateTo('/(auth)/settings')} styles={styles} ui={ui} />

              {/* Close arrows button */}
              <View style={styles.closeButtonContainer}>
                <Pressable
                  style={styles.closeButtonArrows}
                  onPress={closeDrawer}
                  android_ripple={{ color: COLORS.background }}
                >
                  <Ionicons name='chevron-back' size={ui.moderateScale(32, 0.35)} color={COLORS.primary} />
                  <Ionicons name='chevron-back' size={ui.moderateScale(32, 0.35)} color={COLORS.primary} style={{ marginLeft: -ui.spacing(16, 0.35) }} />
                </Pressable>
              </View>

              {/* Logout */}
              <Pressable
                style={styles.logoutButton}
                onPress={() => {
                  closeDrawer()
                  logout()
                }}
              >
                <Ionicons name='log-out' size={24} color={COLORS.error} />
                <Text style={styles.logoutText}>Wyloguj się</Text>
              </Pressable>
            </ScrollView>
          </LinearGradient>
        </Animated.View>
      </GestureDetector>
    </>
  )
}

// Memoized drawer item — no useResponsiveScale hook per item
function DrawerItem({ icon, label, onPress, styles, ui }) {
  return (
    <Pressable
      style={styles.drawerItem}
      onPress={onPress}
      android_ripple={{ color: COLORS.background }}
    >
      <View style={styles.drawerItemContainer}>
        <Ionicons name={icon} size={ui.moderateScale(28, 0.35)} color={COLORS.secondary} />
        <Text style={styles.drawerItemText}>{label}</Text>
      </View>
      <View style={styles.separator} />
    </Pressable>
  )
}

export default DrawerModal

const createStyles = (ui, insets = { top: 0 }) => StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 90,
  },
  drawerPanel: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    zIndex: 100,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  gradientContainer: {
    flex: 1,
  },
  closeButtonX: {
    position: 'absolute',
    top: insets.top + ui.verticalScale(6),
    right: ui.spacing(10, 0.35),
    zIndex: 100,
    padding: ui.spacing(8, 0.35),
    borderRadius: ui.moderateScale(20, 0.35),
  },
  scrollContainer: {
    flex: 1,
  },
  closeButtonContainer: {
    alignItems: 'center',
    marginTop: ui.verticalScale(30),
    marginBottom: ui.verticalScale(10),
  },
  closeButtonArrows: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: ui.spacing(10, 0.35),
    borderRadius: ui.moderateScale(16, 0.35),
  },
  drawerItem: {
    alignItems: 'center',
    gap: ui.verticalScale(5),
  },
  drawerItemContainer: {
    width: '100%',
    paddingVertical: ui.verticalScale(19),
    paddingHorizontal: ui.spacing(20, 0.45),
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  drawerItemText: {
    fontSize: ui.scaleFont(18, 0.4),
    marginLeft: ui.spacing(20, 0.45),
    fontFamily: 'Montserrat-Regular',
    color: COLORS.primary,
  },
  separator: {
    height: ui.verticalScale(2),
    width: '110%',
    opacity: 0.2,
    backgroundColor: COLORS.primary,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: ui.spacing(20, 0.45),
    gap: ui.spacing(10, 0.35),
    borderTopWidth: 1,
    borderTopColor: COLORS.background,
    marginTop: ui.verticalScale(10),
  },
  logoutText: {
    fontSize: ui.scaleFont(16, 0.35),
    fontFamily: 'Montserrat-Bold',
    color: COLORS.error,
  },
})
