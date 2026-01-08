import { Slot, useRouter, usePathname } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native'
import { COLORS } from '../../../constants/colors'
import { useMap } from '../../../context/MapContext'
import MapboxMobile from '../../../components/MapboxMobile'

// Komponent tła mapy
function MapBackground() {
  const { isInteractive, overlayOpacity } = useMap()

  return (
    <View
      style={styles.mapBackground}
      pointerEvents={isInteractive ? 'auto' : 'none'}
    >
      <MapboxMobile />
      {/* Overlay dla przyciemnienia gdy mapa nieinteraktywna */}
      {!isInteractive && overlayOpacity > 0 && (
        <View
          style={[
            styles.mapOverlay,
            { backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})` },
          ]}
          pointerEvents='none'
        />
      )}
    </View>
  )
}

// Definicja tabów
const TABS = [
  { name: 'Start', path: 'dashboard-home', icon: 'home' },
  { name: 'Mapa', path: 'show-map', icon: 'map' },
  { name: 'Szukaj', path: 'find-event', icon: 'search' },
  { name: 'Chat', path: 'chat', icon: 'chatbubbles', badge: 3 },
]

// Własny komponent paska nawigacji
function CustomTabBar() {
  const router = useRouter()
  const pathname = usePathname()

  const handlePress = (path) => {
    router.push(`/(main)/(tabs)/${path}`)
  }

  // Sprawdzamy czy dany tab jest aktywny
  const isTabActive = (path) => {
    // pathname może być np. "/dashboard-home" lub "/(main)/(tabs)/dashboard-home"
    return pathname.includes(path)
  }

  return (
    <View style={styles.tabBar}>
      {TABS.map((tab) => {
        const active = isTabActive(tab.path)
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
              {tab.badge && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{tab.badge}</Text>
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
}

export default function TabsLayout() {
  const pathname = usePathname()

  // Sprawdź czy jesteśmy w ukrytych ekranach (hidden) - tam nie pokazujemy TabBar
  const isHiddenScreen = pathname.includes('(hidden)')

  return (
    <View style={styles.container} pointerEvents='box-none'>
      {/* 1. Mapa jako tło (zawsze na samym dole) */}
      <MapBackground />

      {/* 2. Slot renderuje aktualny ekran */}
      <View style={styles.contentContainer} pointerEvents='box-none'>
        <Slot />
      </View>

      {/* 3. CustomTabBar na wierzchu - ukryty dla ekranów z (hidden) */}
      {!isHiddenScreen && <CustomTabBar />}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  mapBackground: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  contentContainer: {
    flex: 1,
    zIndex: 1,
    backgroundColor: 'transparent',
  },
  // Style dla CustomTabBar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.backgroundSecondary,
    borderTopColor: COLORS.background,
    borderTopWidth: 2,
    height: 60,
    paddingBottom: 8,
    paddingTop: 8,
    paddingHorizontal: 10,
    zIndex: 10,
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
