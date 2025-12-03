import { Image, Text, View, Pressable, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import LogoBoiskoPlus from '../assets/images/LogoBoiskoPlus.png'
import { COLORS } from '../constants/colors'
import { Ionicons } from '@expo/vector-icons'

const HeaderStack = ({ navigation, route, options, back }) => {
  const insets = useSafeAreaInsets()
  return (
    <>
      <View
        style={{
          height: insets.top,
          backgroundColor: '#000',
        }}
      />
      <View style={styles.headerContainer}>
        {/* Przycisk cofania */}
        {back ? (
          <Pressable
            onPress={navigation.goBack}
            style={{
              width: 64,
              height: '100%',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
            }}
          >
            <Ionicons name='chevron-back' size={28} color={COLORS.secondary} />
            <Text style={styles.title}>
              {options.title ? options.title : 'Forgotten'}
            </Text>
          </Pressable>
        ) : (
          <View style={{ width: 64 }} />
        )}

        <View style={styles.logoContainer}>
          <Image
            source={LogoBoiskoPlus}
            style={{ width: 40, height: 40 }}
            resizeMode='contain'
          />
          <Text
            style={{
              color: COLORS.primary,
              fontSize: 18,
              fontFamily: 'ObjectFont',
            }}
            numberOfLines={1}
          >
            Boisko
          </Text>
          <Text
            style={{
              color: COLORS.secondary,
              fontSize: 18,
              fontFamily: 'ObjectFont',
            }}
          >
            +
          </Text>
        </View>

        {/* Pusty view po prawej dla balansu */}
        <View style={{ width: 64 }} />
      </View>
    </>
  )
}

export default HeaderStack

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: COLORS.background,
    justifyContent: 'space-between',
  },
  logoContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    alignSelf: 'center',
  },
  title: {
    color: COLORS.secondary,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
    fontFamily: 'Montserrat-Bold',
    textAlign: 'center',
    includeFontPadding: false,
  },
})
