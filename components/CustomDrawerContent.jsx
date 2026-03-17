import { View, Text, Pressable, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { DrawerContentScrollView } from '@react-navigation/drawer'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { COLORS } from '../constants/colors'
import { useAuth } from '../context/AuthContext'
import { useResponsiveScale } from '../assets/utils/scaleUI.UX'

// Custom Drawer Content Component
export default function CustomDrawerContent(props) {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { logout } = useAuth()
  const ui = useResponsiveScale()
  const styles = createStyles(ui, insets)

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
          icon='people'
          label='Znajomi'
          onPress={() => navigateTo('/(main)/(tabs)/(hidden)/friends')}
        />
        <DrawerItem
          icon='calendar'
          label='Moje Wydarzenia'
          onPress={() =>
            navigateTo('/(main)/(tabs)/(hidden)/events-managment/events-dashboard')
          }
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
            <Ionicons name='chevron-back' size={ui.moderateScale(32, 0.35)} color={COLORS.primary} />
            <Ionicons
              name='chevron-back'
              size={ui.moderateScale(32, 0.35)}
              color={COLORS.primary}
              style={{ marginLeft: -ui.spacing(16, 0.35) }}
            />
          </Pressable>
        </View>

        {/* Logout Button */}
        <Pressable
          style={styles.logoutButton}
          onPress={() => {
            logout()
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
  const ui = useResponsiveScale()
  const styles = createStyles(ui)

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
      <LinearGradient
        colors={[COLORS.third, COLORS.primary]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0, y: 0 }}
        style={styles.separator}
      />
    </Pressable>
  )
}

const createStyles = (ui, insets = { top: 0 }) => StyleSheet.create({
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
  drawerContainer: {
    flex: 1,
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
