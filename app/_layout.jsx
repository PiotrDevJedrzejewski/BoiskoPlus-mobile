import { Stack } from 'expo-router'
import { COLORS } from '../constants/colors'
import { useFonts } from 'expo-font'
import HeaderStack from '../components/HeaderStack'

const Layout = () => {
  const [fontsLoaded] = useFonts({
    'Montserrat-Bold': require('../assets/fonts/Montserrat-Bold.ttf'),
    'Montserrat-Regular': require('../assets/fonts/Montserrat-Regular.ttf'),
    'Montserrat-Italic': require('../assets/fonts/Montserrat-Italic.ttf'),
    'Lato-Bold': require('../assets/fonts/Lato-Bold.ttf'),
    'Lato-Regular': require('../assets/fonts/Lato-Regular.ttf'),
    ObjectFont: require('../assets/fonts/object.ttf'),
  })
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.background }, // kolor tła paska
        headerTintColor: COLORS.secondary, // kolor tekstu i ikon
        headerTitleStyle: {
          fontSize: 16, // zmniejszony rozmiar czcionki tytułu
        },
        header: (props) => <HeaderStack {...props} />,
      }}
    >
      <Stack.Screen name='index' options={{ headerShown: true }} />
      <Stack.Screen
        name='Login'
        options={{ headerShown: true, title: 'Login' }}
      />
      <Stack.Screen
        name='Register'
        options={{ headerShown: true, title: 'Register' }}
      />
    </Stack>
  )
}
export default Layout
