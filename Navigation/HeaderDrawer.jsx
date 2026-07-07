import { useState, memo, useMemo } from 'react'
import { Image, Text, View, Pressable, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import LogoBoiskoPlus from '../assets/images/NeoBoiskoPlus.png'
import { Ionicons } from '@expo/vector-icons'
import { useSocketStore, selectTotalUnreadMessages } from '../context/socketStore'
import { useDrawer } from '../context/DrawerContext'
import QuickNavModal from '../components/popup/QuickNavModal'
import { useRouter } from 'expo-router'

import { useThemedStyles } from '../context/themeStore'
import { SPACING } from '../Theme/StyleConstants'
import { scale, verticalScale, moderateScale, scaleFont } from '../Theme/ScalableStyles'

const HeaderDrawer = () => {
    const insets = useSafeAreaInsets()
    const { openDrawer } = useDrawer()
    const router = useRouter()
    const unreadEventsCount = useSocketStore((s) => s.unreadEventsCount)
    const unreadInvitesCount = useSocketStore((s) => s.unreadInvitesCount)
    const unreadFriendRequestsCount = useSocketStore((s) => s.unreadFriendRequestsCount)
    const totalUnreadMessages = useSocketStore(selectTotalUnreadMessages)
    const [quickNavVisible, setQuickNavVisible] = useState(false)

    const { styles, colors } = useThemedStyles(createStyles)

    const totalBadge = unreadEventsCount + unreadInvitesCount + unreadFriendRequestsCount + totalUnreadMessages

    return (
        <>
            <View
                style={{
                    height: insets.top,
                    backgroundColor: colors.background,
                }}
            />
            <View style={styles.headerContainer}>
                {/* Hamburger Menu - lewa strona */}
                <Pressable
                    onPress={openDrawer}
                    style={styles.iconButton}
                    android_ripple={{
                        color: colors.background,
                        borderless: true,
                    }}
                >
                    <Ionicons name='menu' size={moderateScale(28, 0.35)} color={colors.primaryText} />
                </Pressable>

                {/* Logo - środek */}
                <Pressable style={styles.logoContainer} onPress={() => router.navigate('/(auth)/dashboard-home')}>
                    <Image
                        source={LogoBoiskoPlus}
                        style={styles.logoImage}
                        resizeMode='contain'
                    />
                    <Text style={styles.logoTextPrimary} numberOfLines={1}>
                        Boisko
                    </Text>
                    <Text style={styles.logoTextSecondary}>+</Text>
                </Pressable>

                {/* Powiadomienia - prawa strona */}
                <Pressable
                    onPress={() => setQuickNavVisible(true)}
                    style={styles.iconButton}
                    android_ripple={{
                        color: colors.background,
                        borderless: true,
                    }}
                >
                    <View>
                        <Ionicons name='notifications' size={moderateScale(26, 0.35)} color={colors.primaryText} />
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

const createStyles = (colors) => StyleSheet.create({
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.md,
        paddingVertical: verticalScale(8),
        backgroundColor: colors.backgroundSecondary,
        justifyContent: 'space-between',
        borderBottomWidth: 1,
    },
    iconButton: {
        width: moderateScale(44, 0.25),
        height: moderateScale(44, 0.25),
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: moderateScale(22, 0.25),
    },
    logoContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.xs,
        backgroundColor: colors.backgroundSecondary,
    },
    logoImage: {
        width: scale(30),
        height: scale(30),
    },
    logoTextPrimary: {
        color: colors.primaryText,
        fontSize: scaleFont(18, 0.35),
        fontFamily: 'ObjectFont',
    },
    logoTextSecondary: {
        color: colors.PrimaryGreen,
        fontSize: scaleFont(18, 0.35),
        fontFamily: 'ObjectFont',
    },
    notificationBadge: {
        position: 'absolute',
        top: -verticalScale(5),
        right: -SPACING.xs,
        backgroundColor: colors.error,
        borderRadius: moderateScale(10, 0.25),
        minWidth: scale(18),
        height: scale(18),
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: scale(4),
    },
    badgeText: {
        color: '#fff',
        fontSize: scaleFont(11, 0.25),
        fontFamily: 'Montserrat-Bold',
    },
})
