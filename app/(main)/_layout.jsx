import { Drawer } from 'expo-router/drawer'
import { useRouter } from 'expo-router'
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
        <Drawer
          screenOptions={{
            drawerStyle: {
              minWidth: 280,
              maxWidth: 320,
            },
            header: () => <HeaderDrawer />,
            sceneContainerStyle: { backgroundColor: 'transparent' },
            swipeEnabled: true,
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
    </MapProvider>
  )
}

export default MainLayout
