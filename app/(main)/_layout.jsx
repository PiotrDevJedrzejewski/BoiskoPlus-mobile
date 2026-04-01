import { useCallback } from 'react'
import { Drawer } from 'expo-router/drawer'
import { useRouter } from 'expo-router'
import HeaderDrawer from '../../components/HeaderDrawer'
import CustomDrawerContent from '../../components/CustomDrawerContent'
import { MapProvider } from '../../context/MapContext'
import { useAuth } from '../../context/AuthContext'

// Stabilna referencja — nie tworzy nowego komponentu co render
const renderHeader = () => <HeaderDrawer />

const MainLayout = () => {
  const router = useRouter()
  const { user, isAuthChecked } = useAuth()

  // Stabilna referencja dla drawerContent
  const renderDrawerContent = useCallback(
    (props) => <CustomDrawerContent {...props} />,
    []
  )

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
            header: renderHeader,
            sceneContainerStyle: { backgroundColor: 'transparent' },
            swipeEnabled: true,
          }}
          
          drawerContent={renderDrawerContent}
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
