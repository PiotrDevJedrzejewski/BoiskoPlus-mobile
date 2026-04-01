import 'react-native-gesture-handler' // MUST be at the top!
import { Stack } from 'expo-router'
import { COLORS } from '../constants/colors'
import { useFonts } from 'expo-font'
import HeaderStack from '../components/HeaderStack'
import LottieView from 'lottie-react-native'
import spinner from '../assets/utils/spinner.json'
import { View } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import ToastManager from 'toastify-react-native'

// Only AuthProvider at root — all other providers scoped to (auth) layout
import { AuthProvider } from '../context/AuthContext'

const Layout = () => {
  const [fontsLoaded] = useFonts({
    'Montserrat-Bold': require('../assets/fonts/Montserrat-Bold.ttf'),
    'Montserrat-Regular': require('../assets/fonts/Montserrat-Regular.ttf'),
    'Montserrat-Italic': require('../assets/fonts/Montserrat-Italic.ttf'),
    'Lato-Bold': require('../assets/fonts/Lato-Bold.ttf'),
    'Lato-Regular': require('../assets/fonts/Lato-Regular.ttf'),
    ObjectFont: require('../assets/fonts/object.ttf'),
  })

  if (!fontsLoaded) {
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
          style={{ width: 80, height: 80 }}
        />
      </View>
    )
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: COLORS.background },
            headerTintColor: COLORS.secondary,
            headerTitleStyle: {
              fontSize: 16,
            },
            header: (props) => <HeaderStack {...props} />,
            gestureEnabled: false,
          }}
        >
          {/* Public screens */}
          <Stack.Screen name='index' options={{ headerShown: true }} />
          <Stack.Screen name='login' options={{ headerShown: true }} />
          <Stack.Screen name='register' options={{ headerShown: true }} />
          <Stack.Screen name='rules' options={{ headerShown: true }} />
          {/* Protected screens — providers are inside (auth)/_layout.jsx */}
          <Stack.Screen name='(auth)' options={{ headerShown: false, gestureEnabled: false }} />
        </Stack>
        <ToastManager />
      </AuthProvider>
    </GestureHandlerRootView>
  )
}
export default Layout
