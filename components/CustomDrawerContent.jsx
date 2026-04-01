import React, { useMemo, useCallback } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { DrawerContentScrollView } from '@react-navigation/drawer'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { COLORS } from '../constants/colors'
import { useAuth } from '../context/AuthContext'
import { useResponsiveScale } from '../assets/utils/scaleUI.UX'

// Stałe kolory gradientu — unikamy tworzenia nowych tablic co render
const GRADIENT_COLORS = [COLORS.third, COLORS.background]
const GRADIENT_START = { x: 1, y: 0 }
const GRADIENT_END = { x: 0, y: 0 }

// Drawer Item Component — React.memo zapobiega re-renderom gdy props się nie zmieniają
const DrawerItem = React.memo(function DrawerItem({ icon, label, onPress, iconSize, styles }) {
  return (
    <Pressable
      style={styles.drawerItem}
      onPress={onPress}
      android_ripple={RIPPLE_BG}
    >
      <View style={styles.drawerItemContainer}>
        <Ionicons name={icon} size={iconSize} color={COLORS.secondary} />
        <Text style={styles.drawerItemText}>{label}</Text>
      </View>
      <View style={styles.separator} />
    </Pressable>
  )
})

const RIPPLE_BG = { color: COLORS.background }

// Custom Drawer Content Component
export default function CustomDrawerContent(props) {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { logout } = useAuth()
  const ui = useResponsiveScale()

  // Memoizujemy styles — przeliczanie tylko gdy ui lub insets się zmienią
  const styles = useMemo(() => createStyles(ui, insets), [ui, insets])
  const iconSize = useMemo(() => ui.moderateScale(28, 0.35), [ui])
  const arrowSize = useMemo(() => ui.moderateScale(32, 0.35), [ui])
  const arrowMargin = useMemo(() => ({ marginLeft: -ui.spacing(16, 0.35) }), [ui])

  const navigateTo = useCallback((path) => {
    router.push(path)
    props.navigation.closeDrawer()
  }, [router, props.navigation])

  const closeDrawer = useCallback(() => {
    props.navigation.closeDrawer()
  }, [props.navigation])

  const handleLogout = useCallback(() => {
    logout()
    router.replace('/')
  }, [logout, router])

  // Stabilne referencje onPress — useCallback z navigateTo
  const navDashboard = useCallback(() => navigateTo('/(main)/(tabs)/dashboard-home'), [navigateTo])
  const navMap = useCallback(() => navigateTo('/(main)/(tabs)/show-map'), [navigateTo])
  const navSearch = useCallback(() => navigateTo('/(main)/(tabs)/find-event'), [navigateTo])
  const navChat = useCallback(() => navigateTo('/(main)/(tabs)/chat'), [navigateTo])
  const navFriends = useCallback(() => navigateTo('/(main)/(tabs)/(hidden)/friends'), [navigateTo])
  const navEvents = useCallback(() => navigateTo('/(main)/(tabs)/(hidden)/events-managment/events-dashboard'), [navigateTo])
  const navAddEvent = useCallback(() => navigateTo('/(main)/(tabs)/(hidden)/add-event'), [navigateTo])
  const navRanking = useCallback(() => navigateTo('/(main)/(tabs)/(hidden)/ranking'), [navigateTo])
  const navPremium = useCallback(() => navigateTo('/(main)/(tabs)/(hidden)/premium'), [navigateTo])
  const navProfile = useCallback(() => navigateTo('/(main)/(tabs)/(hidden)/profile'), [navigateTo])
  const navSettings = useCallback(() => navigateTo('/(main)/(tabs)/(hidden)/settings'), [navigateTo])

  return (
    <LinearGradient
      colors={GRADIENT_COLORS}
      start={GRADIENT_START}
      end={GRADIENT_END}
      style={styles.gradientContainer}
    >
      <View style={[styles.statusBar, { height: insets.top }]} />

      {/* Przycisk X do zamknięcia (prawy górny róg) */}
      <Pressable
        style={styles.closeButtonX}
        onPress={closeDrawer}
        android_ripple={RIPPLE_BG}
      >
        <Ionicons name='close' size={28} color={COLORS.primary} />
      </Pressable>

      <DrawerContentScrollView {...props} style={styles.drawerContainer}>
        {/* Ekrany widoczne w Tabs + homepage*/}
        <DrawerItem icon='home' label='Panel Główny' onPress={navDashboard} iconSize={iconSize} styles={styles} />
        <DrawerItem icon='map' label='Mapa' onPress={navMap} iconSize={iconSize} styles={styles} />
        <DrawerItem icon='search' label='Szukaj' onPress={navSearch} iconSize={iconSize} styles={styles} />
        <DrawerItem icon='chatbubbles' label='Czat' onPress={navChat} iconSize={iconSize} styles={styles} />
        <DrawerItem icon='people' label='Znajomi' onPress={navFriends} iconSize={iconSize} styles={styles} />
        <DrawerItem icon='calendar' label='Moje Wydarzenia' onPress={navEvents} iconSize={iconSize} styles={styles} />

        {/* Ekrany ukryte w Tabs (tylko w sidebar) */}
        <DrawerItem icon='add-circle' label='Stwórz Wydarzenie' onPress={navAddEvent} iconSize={iconSize} styles={styles} />
        <DrawerItem icon='trophy' label='Ranking' onPress={navRanking} iconSize={iconSize} styles={styles} />
        <DrawerItem icon='star' label='Premium' onPress={navPremium} iconSize={iconSize} styles={styles} />
        <DrawerItem icon='person' label='Profil' onPress={navProfile} iconSize={iconSize} styles={styles} />
        <DrawerItem icon='settings-sharp' label='Ustawienia' onPress={navSettings} iconSize={iconSize} styles={styles} />

        {/* Przycisk ze strzałkami do zamknięcia (dolna część) */}
        <View style={styles.closeButtonContainer}>
          <Pressable
            style={styles.closeButtonArrows}
            onPress={closeDrawer}
            android_ripple={RIPPLE_BG}
          >
            <Ionicons name='chevron-back' size={arrowSize} color={COLORS.primary} />
            <Ionicons
              name='chevron-back'
              size={arrowSize}
              color={COLORS.primary}
              style={arrowMargin}
            />
          </Pressable>
        </View>

        {/* Logout Button */}
        <Pressable
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Ionicons name='log-out' size={24} color={COLORS.error} />
          <Text style={styles.logoutText}>Wyloguj się</Text>
        </Pressable>
      </DrawerContentScrollView>
    </LinearGradient>
  )
}

const createStyles = (ui, insets = { top: 0 }) => StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  statusBar: {
    backgroundColor: '#000',
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
