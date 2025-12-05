import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '../../../constants/colors'

export default function TabsLayout() {
  return (
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
          fontFamily: 'Object',
          fontSize: 12,
        },
        headerShown: false,
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

      {/* Ukryte ekrany - nie widoczne w tab bar, ale mają dostęp do tabs */}
      <Tabs.Screen
        name='(hidden)'
        options={{
          href: null, // Ukrywa z tab bar
        }}
      />
    </Tabs>
  )
}
