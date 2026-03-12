import { Image, Text, View, Pressable, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import LogoBoiskoPlus from '../assets/images/LogoBoiskoPlus.png'
import { COLORS } from '../constants/colors'
import { Ionicons } from '@expo/vector-icons'
import { useResponsiveScale } from '../assets/utils/scaleUI.UX'

const HeaderStack = ({ navigation, route, options, back }) => {
  const insets = useSafeAreaInsets()
  const ui = useResponsiveScale()
  const styles = createStyles(ui)
  return (
    <>
      <View
        style={{
          height: insets.top,
          backgroundColor: COLORS.black,
        }}
      />
      <View style={styles.headerContainer}>
        {/* Przycisk cofania */}
        {back && route.name !== 'index' ? (
          <Pressable
            onPress={() => navigation.navigate('index')}
            style={styles.backButton}
          >
            <Ionicons name='chevron-back' size={ui.moderateScale(28, 0.35)} color={COLORS.secondary} />
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
          <Text
            style={styles.logoTextSecondary}
          >
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

const createStyles = (ui) => StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ui.spacing(10, 0.35),
    paddingVertical: ui.verticalScale(5),
    justifyContent: 'space-between',
    backgroundColor: COLORS.background,
  },
  backButton: {
    width: ui.scale(64),
    minHeight: ui.verticalScale(44),
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  sideSpacer: {
    width: ui.scale(64),
  },
  logoContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ui.spacing(2, 0.2),
    alignSelf: 'center',
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
  title: {
    color: COLORS.secondary,
    fontSize: ui.scaleFont(14, 0.35),
    fontWeight: '700',
    marginTop: ui.verticalScale(2),
    fontFamily: 'Montserrat-Bold',
    textAlign: 'center',
    includeFontPadding: false,
  },
})
