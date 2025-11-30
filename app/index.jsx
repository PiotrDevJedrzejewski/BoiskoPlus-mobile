import { useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { Text, View, ImageBackground, StyleSheet, Image } from 'react-native'
import Button1 from '../components/Button1'
import { useFonts } from 'expo-font'

const LogoBoiskoPlus = require('../assets/images/LogoBoiskoPlus.png')
const background = require('../assets/images/pexels-jsalamanca-61143.jpg')

const Home = () => {
  const router = useRouter()

  const [fontsLoaded] = useFonts({
    ObjectFont: require('../assets/fonts/object.ttf'),
  })

  const buttonSettings = {
    height: 50,
    width: 220,
    fontSize: 18,
  }

  return (
    <>
      <StatusBar style='light' />
      <ImageBackground
        source={background}
        style={styles.imageBackground}
        resizeMode='cover'
      >
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
              onPress={() => router.push('/Login')}
            />
            <Button1
              text='Zarejestruj się'
              {...buttonSettings}
              onPress={() => router.push('/Register')}
            />
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
    padding: 20,
  },
  title: {
    color: 'white',
    fontSize: 32,
    fontFamily: 'ObjectFont',
    textAlign: 'center',
  },
  description: {
    color: 'white',
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
    fontFamily: 'ObjectFont',
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 80,
    gap: 20,
  },
  logoContainer: {
    flex: 1,
    position: 'absolute',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  logo: {
    width: '100%',
    resizeMode: 'contain',
  },
})
