import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Stack, Redirect } from 'expo-router'
import { COLORS } from '../../constants/colors'
import { useAuth } from '../../context/AuthContext'
import { SocketIoProvider } from '../../context/SocketIoContext'
import { NotificationProvider } from '../../context/NotificationContext'
import { DashboardProvider } from '../../context/DashboardContext'
import { FriendshipProvider } from '../../context/FriendshipContext'
import { DrawerProvider } from '../../context/DrawerContext'
import { MapProvider } from '../../context/MapContext'
import NetworkGuard from '../../components/NetworkGuard'
import { dbg, useDebugMount } from '../../assets/utils/debugLogger'

// Overlays
import HeaderDrawer from '../../Navigation/HeaderDrawer'
import CustomTabBar from '../../Navigation/CustomTabBar'
import DrawerModal from '../../Navigation/DrawerModal'

export default function AuthLayout() {
  dbg('AuthLayout')
  useDebugMount('AuthLayout')
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


                    <View style={styles.tabBar}>
                      <CustomTabBar />
                    </View>

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
    position: 'relative',
  },
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    // gap filler 
    transform: [{ scaleX: 1.01 }],
  },
  content: {
    flex: 1,
  },
})
