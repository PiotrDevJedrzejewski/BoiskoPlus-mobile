import { Drawer } from 'expo-router/drawer'
import { COLORS } from '../../constants/colors'
import { View, Text, Image, Pressable, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { DrawerContentScrollView } from '@react-navigation/drawer'

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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        screenOptions={{
          drawerStyle: {
            backgroundColor: COLORS.backgroundSecondary,
            width: 280,
          },
          headerStyle: {
            backgroundColor: '#000000',
          },
          headerTintColor: COLORS.secondary,
          headerTitleStyle: {
            fontFamily: 'Montserrat-Bold',
            fontSize: 18,
          },
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
    </GestureHandlerRootView>
  )
}

// Custom Drawer Content Component
function CustomDrawerContent(props) {
  const router = useRouter()

  const navigateTo = (path) => {
    router.push(path)
    props.navigation.closeDrawer()
  }

  return (
    <DrawerContentScrollView {...props} style={styles.drawerContainer}>
      {/* User Profile Section */}
      <View style={styles.profileSection}>
        <Image
          source={{ uri: 'https://via.placeholder.com/80' }}
          style={styles.avatar}
        />
        <Text style={styles.username}>Jan Kowalski</Text>
        <Text style={styles.email}>jan@example.com</Text>
      </View>

      {/* Navigation Items */}
      <View style={styles.navSection}>
        {/* Ekrany widoczne w Tabs */}
        <DrawerItem
          icon='map'
          label='Mapa'
          onPress={() => navigateTo('/(main)/(tabs)/show-map')}
        />
        <DrawerItem
          icon='search'
          label='Szukaj Gier'
          onPress={() => navigateTo('/(main)/(tabs)/find-event')}
        />
        <DrawerItem
          icon='calendar'
          label='Moje Wydarzenia'
          onPress={() => navigateTo('/(main)/(tabs)/my-events')}
        />
        <DrawerItem
          icon='chatbubbles'
          label='Czat'
          onPress={() => navigateTo('/(main)/(tabs)/chat')}
        />

        {/* Separator */}
        <View style={styles.separator} />

        {/* Ekrany ukryte w Tabs (tylko w sidebar) */}
        <DrawerItem
          icon='home'
          label='Panel Główny'
          onPress={() => navigateTo('/(main)/(tabs)/(hidden)/dashboard-home')}
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
      <Ionicons name={icon} size={24} color={COLORS.primary} />
      <Text style={styles.drawerItemText}>{label}</Text>
    </Pressable>
  )
}

export default MainLayout

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
  },
  profileSection: {
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background,
    backgroundColor: COLORS.background,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: COLORS.secondary,
  },
  username: {
    fontSize: 18,
    fontFamily: 'Montserrat-Bold',
    color: COLORS.primary,
    marginTop: 5,
  },
  email: {
    fontSize: 14,
    fontFamily: 'Lato-Regular',
    color: COLORS.gray,
    marginTop: 2,
  },
  navSection: {
    flex: 1,
    paddingVertical: 10,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    gap: 15,
  },
  drawerItemText: {
    fontSize: 16,
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
    marginTop: 'auto',
  },
  logoutText: {
    fontSize: 16,
    fontFamily: 'Montserrat-Bold',
    color: COLORS.error,
  },
})
