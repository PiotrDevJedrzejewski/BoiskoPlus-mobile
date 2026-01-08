import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { View, StyleSheet, Pressable } from 'react-native'
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

export default function TabsLayout() {
  return (
    <View style={styles.container} pointerEvents='box-none'>
      {/* Mapa jako tło */}
      <MapBackground />

      {/* Tabs nad mapą */}
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: COLORS.secondary,
          tabBarInactiveTintColor: COLORS.primary,
          tabBarStyle: {
            backgroundColor: COLORS.backgroundSecondary,
            borderTopColor: COLORS.background,
            borderTopWidth: 2,
            height: 60,
            paddingBottom: 8,
            paddingTop: 8,
            paddingHorizontal: 10,
          },
          tabBarLabelStyle: {
            fontFamily: 'ObjectFont',
            fontSize: 12,
          },
          headerShown: false,
          sceneContainerStyle: {
            backgroundColor: 'transparent',
          },
          sceneStyle: {
            backgroundColor: 'transparent',
          },
          contentStyle: {
            backgroundColor: 'transparent',
          },
        }}
      >
        {/* 4 widoczne taby */}
        <Tabs.Screen
          name='dashboard-home'
          options={{
            title: 'Start',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name='home' size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name='show-map'
          options={{
            title: 'Mapa',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name='map' size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name='find-event'
          options={{
            title: 'Szukaj',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name='search' size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name='chat'
          options={{
            title: 'Chat',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name='chatbubbles' size={size} color={color} />
            ),
            tabBarBadge: 3,
          }}
        />
        {/* Ukryte ekrany */}
        <Tabs.Screen
          name='(hidden)'
          options={{
            href: null,
          }}
        />{' '}
      </Tabs>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
  },
  mapBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
})
