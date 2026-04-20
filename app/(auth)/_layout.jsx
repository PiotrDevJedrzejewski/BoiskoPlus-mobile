import React, { useCallback, useMemo } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Stack, Redirect, useRouter, usePathname } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { COLORS } from '../../constants/colors'
import { useAuth } from '../../context/AuthContext'
import { SocketIoProvider } from '../../context/SocketIoContext'
import { useSocketStore, selectTotalUnreadMessages } from '../../context/socketStore'
import { NotificationProvider } from '../../context/NotificationContext'
import { DashboardProvider } from '../../context/DashboardContext'
import { FriendshipProvider } from '../../context/FriendshipContext'
import { DrawerProvider } from '../../context/DrawerContext'
import { MapProvider } from '../../context/MapContext'
import NetworkGuard from '../../components/NetworkGuard'
import { dbg, useDebugMount } from '../../assets/utils/debugLogger'

// Overlays
import HeaderDrawer from '../../components/HeaderDrawer'
import DrawerModal from '../../components/DrawerModal'

// Tab definitions
const TABS = [
  { name: 'Start', path: '(map-screens)/dashboard-home', icon: 'home', match: 'dashboard-home' },
  { name: 'Mapa', path: '(map-screens)/show-map', icon: 'map', match: 'show-map' },
  { name: 'Szukaj', path: '(map-screens)/find-event', icon: 'search', match: 'find-event' },
  { name: 'Chat', path: 'chat', icon: 'chatbubbles', match: 'chat', hasDynamicBadge: true },
]

// Custom TabBar as absolute overlay
const CustomTabBar = React.memo(function CustomTabBar() {
  dbg('CustomTabBar')
  const router = useRouter()
  const pathname = usePathname()
  const insets = useSafeAreaInsets()
  const totalUnreadMessages = useSocketStore(selectTotalUnreadMessages)

  // Hide tab bar on chat-room screen
  const hidden = pathname.includes('chat-room')

  const handlePress = useCallback((path) => {
    router.navigate(`/(auth)/${path}`)
  }, [router])

  const isTabActive = useCallback((match) => {
    return pathname.includes(match)
  }, [pathname])

  const tabBarStyle = useMemo(() => ({
    ...styles.tabBar,
    paddingBottom: Math.max(8, insets.bottom),
  }), [insets.bottom])

  if (hidden) return null

  return (
    <View style={tabBarStyle}>
      {TABS.map((tab) => {
        const active = isTabActive(tab.match)
        return (
          <TouchableOpacity
            key={tab.path}
            style={styles.tabItem}
            onPress={() => handlePress(tab.path)}
            activeOpacity={0.7}
          >
            <View>
              <Ionicons
                name={tab.icon}
                size={24}
                color={active ? COLORS.secondary : COLORS.primary}
              />
              {tab.hasDynamicBadge && totalUnreadMessages > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {totalUnreadMessages > 9 ? '9+' : totalUnreadMessages}
                  </Text>
                </View>
              )}
            </View>
            <Text
              style={[
                styles.tabLabel,
                { color: active ? COLORS.secondary : COLORS.primary },
              ]}
            >
              {tab.name}
            </Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
})

export default function AuthLayout() {
  dbg('AuthLayout')
  useDebugMount('AuthLayout')
  const router = useRouter()
  const { user, isAuthChecked } = useAuth()

  // Auth guard — redirect to home if not authenticated
  if (isAuthChecked && !user) {
    return <Redirect href='/' />
  }

  return (
    <NotificationProvider>
      <SocketIoProvider>
        <DashboardProvider>
          <FriendshipProvider>
            <MapProvider>
              <DrawerProvider>
              <NetworkGuard>
              <View style={styles.container}>
                {/* Header at top */}
                <HeaderDrawer />

                {/* Stack content fills the middle */}
                <View style={styles.content}>
                  <Stack
                    screenOptions={{
                      headerShown: false,
                      gestureEnabled: false,
                      contentStyle: { backgroundColor: 'transparent' },
                      animation: 'slide_from_right',
                    }}
                  >
                    <Stack.Screen name='(map-screens)' options={{ animation: 'none' }} />
                    <Stack.Screen name='chat' options={{ animation: 'none' }} />
                    <Stack.Screen name='chat-room' options={{ animation: 'slide_from_right' }} />
                  </Stack>
                </View>

                {/* TabBar at bottom — always visible */}
                <CustomTabBar />

                {/* Drawer overlay — on top of everything */}
                <DrawerModal />
              </View>
              </NetworkGuard>
            </DrawerProvider>
            </MapProvider>
          </FriendshipProvider>
        </DashboardProvider>
      </SocketIoProvider>
    </NotificationProvider>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
  },
  // TabBar styles
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.backgroundSecondary,
    borderTopColor: COLORS.background,
    borderTopWidth: 2,
    paddingTop: 8,
    paddingHorizontal: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontFamily: 'ObjectFont',
    fontSize: 12,
    marginTop: 2,
  },
  badge: {
    position: 'absolute',
    right: -6,
    top: -3,
    backgroundColor: COLORS.error || '#ef4444',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
})
