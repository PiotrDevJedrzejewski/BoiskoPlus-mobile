import { Image, Text, View, Pressable, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import LogoBoiskoPlus from '../assets/images/NeoBoiskoPlus.png'
import { Ionicons } from '@expo/vector-icons'
import { useThemedStyles } from '../context/themeStore'
import { SPACING } from '../Theme/StyleConstants'
import { scale, verticalScale, moderateScale, scaleFont } from '../Theme/ScalableStyles'


// Ten komponent jest widoczny w zewnętrznej częsci aplikacji, poza (auth)
// Wewnątrz używany jest HeaderDrawer, który ma własne style

const HeaderStack = ({ navigation, route, options, back }) => {
  const insets = useSafeAreaInsets()
  // Cały boilerplate (subskrypcja colors + useMemo) jest ukryty w hooku.
  const { styles, colors } = useThemedStyles(createStyles)

  return (
    <>
      <View style={[styles.insetsSpacer, { height: insets.top }]} />
      <View style={styles.headerContainer}>
        {/* Przycisk cofania */}
        {back && route.name !== 'index' ? (
          <Pressable
            onPress={() => navigation.navigate('index')}
            style={styles.backButton}
          >
            <Ionicons name='chevron-back' size={moderateScale(28, 0.35)} color={colors.primaryText} />
            <Text style={styles.title}>
              Cofnij
            </Text>
          </Pressable>
        ) : (
          <View style={styles.sideSpacer} />
        )}

        <View style={styles.logoContainer}>
          <Image
            source={LogoBoiskoPlus}
            style={styles.logoImage}
            resizeMode='contain'
          />
          <Text
            style={styles.logoTextPrimary}
            numberOfLines={1}
          >
            Boisko
          </Text>
          <Text style={styles.logoTextSecondary}>
            +
          </Text>
        </View>

        {/* Pusty view po prawej dla balansu */}
        <View style={styles.sideSpacer} />
      </View>
    </>
  )
}

export default HeaderStack

// Ten komponent jest widoczny w zewnętrznej częsci aplikacji, poza (auth)
// Wewnątrz używany jest HeaderDrawer, który ma własne style

// Statyczne tokeny (spacing/scale) obliczane raz przy imporcie modułu.
// Kolory wstrzykiwane dopiero w createStyles(), wywoływanym przez useThemedStyles.

const createStyles = (colors) =>
  StyleSheet.create({
    insetsSpacer: {
      backgroundColor: colors.backgroundSecondary,
      color: colors.primaryText,
    },
    headerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: SPACING.md,
      paddingVertical: verticalScale(5),
      justifyContent: 'space-between',
      backgroundColor: colors.backgroundSecondary,
    },
    backButton: {
      width: scale(64),
      minHeight: verticalScale(44),
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    },
    sideSpacer: {
      width: scale(64),
    },
    logoContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: SPACING.xs,
      alignSelf: 'center',
    },
    logoImage: {
      width: scale(30),
      height: scale(30),
    },
    logoTextPrimary: {
      fontSize: scaleFont(18, 0.35),
      fontFamily: 'ObjectFont',
      color: colors.primaryText,
    },
    logoTextSecondary: {
      fontSize: scaleFont(24, 0.35),
      fontFamily: 'ObjectFont',
      color: colors.PrimaryGreen,
    },
    title: {
      fontSize: scaleFont(14, 0.35),
      fontWeight: '700',
      marginTop: verticalScale(2),
      fontFamily: 'Montserrat-Bold',
      textAlign: 'center',
      includeFontPadding: false,
      color: colors.primaryText,
    },
  })
