import { Drawer } from 'expo-router/drawer'
import { COLORS } from '../../constants/colors'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { DrawerContentScrollView } from '@react-navigation/drawer'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import HeaderDrawer from '../../components/HeaderDrawer'
import { MapProvider } from '../../context/MapContext'

const MainLayout = () => {
  const router = useRouter()

  // TODO: Replace with real auth check
  const isAuthenticated = true // Get from AuthContext

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    router.replace('/login')
    return null
  }

  return (
    <MapProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={styles.contentContainer}>
          <Drawer
            screenOptions={{
              drawerStyle: {
                minWidth: 280,
                maxWidth: 320,
              },
              header: () => <HeaderDrawer />,
            }}
            drawerContent={(props) => <CustomDrawerContent {...props} />}
          >
            <Drawer.Screen
              name='(tabs)'
              options={{
                headerShown: true,
                drawerLabel: () => null,
                drawerItemStyle: { display: 'none' },
              }}
            />
          </Drawer>
        </View>
      </GestureHandlerRootView>
    </MapProvider>
  )
}

// Custom Drawer Content Component
function CustomDrawerContent(props) {
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const navigateTo = (path) => {
    router.push(path)
    props.navigation.closeDrawer()
  }

  const closeDrawer = () => {
    props.navigation.closeDrawer()
  }

  return (
    <LinearGradient
      colors={[COLORS.third, COLORS.background]}
      start={{ x: 1, y: 0 }}
      end={{ x: 0, y: 0 }}
      style={styles.gradientContainer}
    >
      <View
        style={{
          height: insets.top,
          backgroundColor: '#000',
        }}
      />

      {/* Przycisk X do zamknięcia (prawy górny róg) */}
      <Pressable
        style={styles.closeButtonX}
        onPress={closeDrawer}
        android_ripple={{ color: COLORS.background }}
      >
        <Ionicons name='close' size={28} color={COLORS.primary} />
      </Pressable>

      <DrawerContentScrollView {...props} style={styles.drawerContainer}>
        {/* Ekrany widoczne w Tabs + homepage*/}
        <DrawerItem
          icon='home'
          label='Panel Główny'
          onPress={() => navigateTo('/(main)/(tabs)/dashboard-home')}
        />
        <DrawerItem
          icon='map'
          label='Mapa'
          onPress={() => navigateTo('/(main)/(tabs)/show-map')}
        />
        <DrawerItem
          icon='search'
          label='Szukaj'
          onPress={() => navigateTo('/(main)/(tabs)/find-event')}
        />
        <DrawerItem
          icon='chatbubbles'
          label='Czat'
          onPress={() => navigateTo('/(main)/(tabs)/chat')}
        />
        <DrawerItem
          icon='calendar'
          label='Moje Wydarzenia'
          onPress={() => navigateTo('/(main)/(tabs)/(hidden)/my-events')}
        />

        {/* Ekrany ukryte w Tabs (tylko w sidebar) */}
        <DrawerItem
          icon='add-circle'
          label='Stwórz Wydarzenie'
          onPress={() => navigateTo('/(main)/(tabs)/(hidden)/add-event')}
        />
        <DrawerItem
          icon='trophy'
          label='Ranking'
          onPress={() => navigateTo('/(main)/(tabs)/(hidden)/ranking')}
        />
        <DrawerItem
          icon='star'
          label='Premium'
          onPress={() => navigateTo('/(main)/(tabs)/(hidden)/premium')}
        />
        <DrawerItem
          icon='person'
          label='Profil'
          onPress={() => navigateTo('/(main)/(tabs)/(hidden)/profile')}
        />
        <DrawerItem
          icon='settings-sharp'
          label='Ustawienia'
          onPress={() => navigateTo('/(main)/(tabs)/(hidden)/settings')}
        />

        {/* Przycisk ze strzałkami do zamknięcia (dolna część) */}
        <View style={styles.closeButtonContainer}>
          <Pressable
            style={styles.closeButtonArrows}
            onPress={closeDrawer}
            android_ripple={{ color: COLORS.background }}
          >
            <Ionicons name='chevron-back' size={32} color={COLORS.primary} />
            <Ionicons
              name='chevron-back'
              size={32}
              color={COLORS.primary}
              style={{ marginLeft: -16 }}
            />
          </Pressable>
        </View>

        {/* Logout Button */}
        <Pressable
          style={styles.logoutButton}
          onPress={() => {
            // TODO: Add logout logic
            router.replace('/')
          }}
        >
          <Ionicons name='log-out' size={24} color={COLORS.error} />
          <Text style={styles.logoutText}>Wyloguj się</Text>
        </Pressable>
      </DrawerContentScrollView>
    </LinearGradient>
  )
}

// Drawer Item Component
function DrawerItem({ icon, label, onPress }) {
  return (
    <Pressable
      style={styles.drawerItem}
      onPress={onPress}
      android_ripple={{ color: COLORS.background }}
    >
      <View style={styles.drawerItemContainer}>
        <Ionicons name={icon} size={28} color={COLORS.secondary} />
        <Text style={styles.drawerItemText}>{label}</Text>
      </View>
      <LinearGradient
        colors={[COLORS.third, COLORS.primary]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0, y: 0 }}
        style={styles.separator}
      />
    </Pressable>
  )
}

export default MainLayout

const styles = StyleSheet.create({
  contentContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  gradientContainer: {
    flex: 1,
  },
  closeButtonX: {
    position: 'absolute',
    top: 30,
    right: 10,
    zIndex: 100,
    padding: 8,
    borderRadius: 20,
  },
  closeButtonContainer: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 10,
  },
  closeButtonArrows: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 16,
  },
  drawerContainer: {
    flex: 1,
  },

  drawerItem: {
    alignItems: 'center',
    gap: 5,
  },
  drawerItemContainer: {
    width: '100%',
    paddingVertical: 19,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  drawerItemText: {
    fontSize: 18,
    marginLeft: 20,
    fontFamily: 'Montserrat-Regular',
    color: COLORS.primary,
  },
  separator: {
    height: 2,
    // 10% fix for full width line
    width: '110%',
    opacity: 0.2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.background,
    marginTop: 10,
  },
  logoutText: {
    fontSize: 16,
    fontFamily: 'Montserrat-Bold',
    color: COLORS.error,
  },
})
