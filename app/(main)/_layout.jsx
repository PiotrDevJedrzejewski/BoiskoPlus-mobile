import { Drawer } from 'expo-router/drawer'
import { useRouter } from 'expo-router'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import HeaderDrawer from '../../components/HeaderDrawer'
import CustomDrawerContent from '../../components/CustomDrawerContent'
import { MapProvider } from '../../context/MapContext'
import { useAuth } from '../../context/AuthContext'

const MainLayout = () => {
  const router = useRouter()
  const { user, isAuthChecked } = useAuth()

  // Redirect to home if not authenticated
  if (isAuthChecked && !user) {
    router.replace('/')
    return null
  }

  return (
    <MapProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Drawer
          screenOptions={{
            drawerStyle: {
              minWidth: 280,
              maxWidth: 320,
            },
            header: () => <HeaderDrawer />,
            sceneContainerStyle: { backgroundColor: 'transparent' },
          }}
          drawerContent={(props) => <CustomDrawerContent {...props} />}
        >
          <Drawer.Screen
            name='(tabs)'
            options={{
              headerShown: true,
              drawerLabel: () => null,
              drawerItemStyle: { display: 'none' },
            }}
          />
        </Drawer>
      </GestureHandlerRootView>
    </MapProvider>
  )
}

export default MainLayout
