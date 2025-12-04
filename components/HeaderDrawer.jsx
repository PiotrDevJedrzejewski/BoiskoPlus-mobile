import { Image, Text, View, Pressable, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation, useRouter } from 'expo-router'
import { DrawerActions } from '@react-navigation/native'
import LogoBoiskoPlus from '../assets/images/LogoBoiskoPlus.png'
import { COLORS } from '../constants/colors'
import { Ionicons } from '@expo/vector-icons'

const HeaderDrawer = () => {
  const insets = useSafeAreaInsets()
  const navigation = useNavigation()
  const router = useRouter()

  const openDrawer = () => {
    navigation.dispatch(DrawerActions.openDrawer())
  }

  const openNotifications = () => {
    // TODO: Nawiguj do ekranu powiadomień
    router.push('/(main)/(tabs)/(hidden)/notifications')
  }

  return (
    <>
      <View
        style={{
          height: insets.top,
          backgroundColor: '#000000',
        }}
      />
      <View style={styles.headerContainer}>
        {/* Hamburger Menu - lewa strona */}
        <Pressable
          onPress={openDrawer}
          style={styles.iconButton}
          android_ripple={{
            color: COLORS.backgroundSecondary,
            borderless: true,
          }}
        >
          <Ionicons name='menu' size={28} color={COLORS.secondary} />
        </Pressable>

        {/* Logo - środek */}
        <View style={styles.logoContainer}>
          <Image
            source={LogoBoiskoPlus}
            style={{ width: 40, height: 40 }}
            resizeMode='contain'
          />
          <Text style={styles.logoTextPrimary} numberOfLines={1}>
            Boisko
          </Text>
          <Text style={styles.logoTextSecondary}>+</Text>
        </View>

        {/* Powiadomienia - prawa strona */}
        <Pressable
          onPress={openNotifications}
          style={styles.iconButton}
          android_ripple={{
            color: COLORS.backgroundSecondary,
            borderless: true,
          }}
        >
          <View>
            <Ionicons name='notifications' size={26} color={COLORS.secondary} />
            {/* Badge dla nieprzeczytanych powiadomień */}
            {/* <View style={styles.notificationBadge}>
              <Text style={styles.badgeText}>3</Text>
            </View> */}
          </View>
        </Pressable>
      </View>
    </>
  )
}

export default HeaderDrawer

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: COLORS.background,
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.backgroundSecondary,
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  logoContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  logoTextPrimary: {
    color: COLORS.primary,
    fontSize: 18,
    fontFamily: 'ObjectFont',
  },
  logoTextSecondary: {
    color: COLORS.secondary,
    fontSize: 18,
    fontFamily: 'ObjectFont',
  },
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontFamily: 'Montserrat-Bold',
  },
})
