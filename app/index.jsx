import { useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { Text, View, ImageBackground, StyleSheet, Image } from 'react-native'
import Button1 from '../components/Button1'
import { COLORS } from '../constants/colors'
import LottieView from 'lottie-react-native'
import spinner from '../assets/utils/spinner.json'
import { useAuth } from '../context/AuthContext'
import CookiesAndRules from '../components/popup/CookiesAndRules'
import { useEffect } from 'react'
import {
  moderateScale,
  scale,
  scaleFont,
  verticalScale,
} from '../assets/utils/scaleUI.UX'
import { dbg, useDebugMount } from '../assets/utils/debugLogger'

const LogoBoiskoPlus = require('../assets/images/LogoBoiskoPlus.png')
const background = require('../assets/images/pexels-jsalamanca-61143.jpg')

const Home = () => {
  dbg('IndexScreen')
  useDebugMount('IndexScreen')
  const router = useRouter()
  const { needsConsent, user, loading } = useAuth()

  // Przekieruj zalogowanego użytkownika do dashboard
  useEffect(() => {
    if (!loading && user) {
      router.replace('/(auth)/(map-screens)/dashboard-home')
    }
  }, [user, loading])

  const buttonSettings = {
    height: verticalScale(50),
    width: scale(220),
    fontSize: scaleFont(18),
  }

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: COLORS.background,
        }}
      >
        <LottieView
          source={spinner}
          autoPlay
          loop
          style={{ width: scale(80), height: scale(80) }}
        />
      </View>
    )
  }

  return (
    <>
      <StatusBar style='light' />
      <ImageBackground
        source={background}
        style={styles.imageBackground}
        resizeMode='cover'
      >
        {needsConsent && <CookiesAndRules />}
        <View style={styles.logoContainer}>
          <Image source={LogoBoiskoPlus} style={styles.logo} />
        </View>
        {/* Maska */}
        <View style={styles.filter}>
          <View style={styles.textContainer}>
            <Text style={styles.title}>Znajdź i stwórz grę zespołową</Text>
            <Text style={styles.description}>
              Aplikacja Boisko+ pozwala umawiać się na wspólne uprawianie
              sportów drużynowych.
            </Text>
          </View>
          <View style={styles.buttonContainer}>
            <Button1
              text='Zaloguj się'
              {...buttonSettings}
              onPress={() => router.push('/login')}
            />
            <Button1
              text='Zarejestruj się'
              {...buttonSettings}
              onPress={() => router.push('/register')}
            />
            <Text
              onPress={() => router.push('/rules')}
              style={styles.description}
            >
              Regulamin
            </Text>
          </View>
        </View>
      </ImageBackground>
    </>
  )
}

export default Home

const styles = StyleSheet.create({
  imageBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  filter: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  textContainer: {
    padding: moderateScale(20, 0.45),
  },
  title: {
    color: 'white',
    fontSize: scaleFont(32, 0.5),
    fontFamily: 'ObjectFont',
    textAlign: 'center',
  },
  description: {
    color: 'white',
    fontSize: scaleFont(16, 0.4),
    marginTop: verticalScale(10),
    textAlign: 'center',
    fontFamily: 'ObjectFont',
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: verticalScale(80),
    gap: moderateScale(20, 0.45),
  },
  logoContainer: {
    flex: 1,
    position: 'absolute',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: moderateScale(20, 0.45),
    paddingBottom: verticalScale(50),
  },
  logo: {
    width: '100%',
    resizeMode: 'contain',
  },
})
