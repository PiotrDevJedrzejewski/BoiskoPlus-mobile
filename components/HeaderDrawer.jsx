import { useState, memo, useMemo} from 'react'
import { Image, Text, View, Pressable, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import LogoBoiskoPlus from '../assets/images/LogoBoiskoPlus.png'
import { COLORS } from '../constants/colors'
import { Ionicons } from '@expo/vector-icons'
import { useSocketStore, selectTotalUnreadMessages } from '../context/socketStore'
import { useDrawer } from '../context/DrawerContext'
import { useResponsiveScale } from '../assets/utils/scaleUI.UX'
import QuickNavModal from './popup/QuickNavModal'

const HeaderDrawer = () => {
  const insets = useSafeAreaInsets()
  const { openDrawer } = useDrawer()
  const unreadEventsCount = useSocketStore((s) => s.unreadEventsCount)
  const unreadFriendRequestsCount = useSocketStore((s) => s.unreadFriendRequestsCount)
  const totalUnreadMessages = useSocketStore(selectTotalUnreadMessages)
  const ui = useResponsiveScale()
  const styles = useMemo(() => createStyles(ui), [ui])
  const [quickNavVisible, setQuickNavVisible] = useState(false)

  const totalBadge = unreadEventsCount + unreadFriendRequestsCount + totalUnreadMessages

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
          <Ionicons name='menu' size={ui.moderateScale(28, 0.35)} color={COLORS.secondary} />
        </Pressable>

        {/* Logo - środek */}
        <View style={styles.logoContainer}>
          <Image
            source={LogoBoiskoPlus}
            style={styles.logoImage}
            resizeMode='contain'
          />
          <Text style={styles.logoTextPrimary} numberOfLines={1}>
            Boisko
          </Text>
          <Text style={styles.logoTextSecondary}>+</Text>
        </View>

        {/* Powiadomienia - prawa strona */}
        <Pressable
          onPress={() => setQuickNavVisible(true)}
          style={styles.iconButton}
          android_ripple={{
            color: COLORS.backgroundSecondary,
            borderless: true,
          }}
        >
          <View>
            <Ionicons name='notifications' size={ui.moderateScale(26, 0.35)} color={COLORS.secondary} />
            {totalBadge > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.badgeText}>
                  {totalBadge > 9 ? '9+' : totalBadge}
                </Text>
              </View>
            )}
          </View>
        </Pressable>
      </View>

      <QuickNavModal
        visible={quickNavVisible}
        onClose={() => setQuickNavVisible(false)}
      />
    </>
  )
}

export default memo(HeaderDrawer)

const createStyles = (ui) => StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ui.spacing(10, 0.35),
    paddingVertical: ui.verticalScale(8),
    backgroundColor: COLORS.background,
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.backgroundSecondary,
  },
  iconButton: {
    width: ui.moderateScale(44, 0.25),
    height: ui.moderateScale(44, 0.25),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: ui.moderateScale(22, 0.25),
  },
  logoContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ui.spacing(2, 0.2),
  },
  logoImage: {
    width: ui.scale(40),
    height: ui.scale(40),
  },
  logoTextPrimary: {
    color: COLORS.primary,
    fontSize: ui.scaleFont(18, 0.35),
    fontFamily: 'ObjectFont',
  },
  logoTextSecondary: {
    color: COLORS.secondary,
    fontSize: ui.scaleFont(18, 0.35),
    fontFamily: 'ObjectFont',
  },
  notificationBadge: {
    position: 'absolute',
    top: -ui.verticalScale(5),
    right: -ui.spacing(5, 0.35),
    backgroundColor: COLORS.error,
    borderRadius: ui.moderateScale(10, 0.25),
    minWidth: ui.scale(18),
    height: ui.scale(18),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: ui.spacing(4, 0.25),
  },
  badgeText: {
    color: '#fff',
    fontSize: ui.scaleFont(11, 0.25),
    fontFamily: 'Montserrat-Bold',
  },
})
