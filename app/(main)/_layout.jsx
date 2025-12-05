import { Drawer } from 'expo-router/drawer'
import { COLORS } from '../../constants/colors'
import { View, Text, Image, Pressable, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { DrawerContentScrollView } from '@react-navigation/drawer'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import HeaderDrawer from '../../components/HeaderDrawer'
// import MapBackground from '../../components/MapBackground'
// import { MapProvider } from '../../context/MapContext'

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
    // <MapProvider>
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* Mapa jako globalne tło */}
      {/* <MapBackground /> */}

      {/* Drawer i content na wierzchu mapy */}
      <View style={styles.contentContainer}>
        <Drawer
          screenOptions={{
            drawerStyle: {
              backgroundColor: 'transparent',
              width: 280,
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
    // </MapProvider>
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
        {/* Navigation Items */}
        <View style={styles.navSection}>
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
            icon='settings'
            label='Ustawienia'
            onPress={() => navigateTo('/(main)/(tabs)/(hidden)/settings')}
          />
        </View>

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
      <Ionicons name={icon} size={28} color={COLORS.secondary} />
      <Text style={styles.drawerItemText}>{label}</Text>
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
  drawerContainer: {
    flex: 1,
  },
  closeButtonX: {
    position: 'absolute',
    top: 50,
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
  navSection: {
    flex: 1,
    paddingVertical: 10,
    marginTop: 40,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 25,
    gap: 20,
    marginVertical: 2,
  },
  drawerItemText: {
    fontSize: 18,
    fontFamily: 'Montserrat-Regular',
    color: COLORS.primary,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.background,
    marginVertical: 10,
    marginHorizontal: 20,
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
