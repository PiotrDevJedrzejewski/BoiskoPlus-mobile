import { createContext, useCallback, useContext, useEffect, useRef } from 'react'
import { useSharedValue } from 'react-native-reanimated'

const DrawerContext = createContext()

export const DrawerProvider = ({ children }) => {
  const renderCountRef = useRef(0)
  renderCountRef.current += 1
  console.log('[DrawerContext] render #' + renderCountRef.current)

  // 0 = closed, 1 = open — animated with reanimated
  const drawerOpen = useSharedValue(0)

  const openDrawer = useCallback(() => {
    drawerOpen.value = 1
  }, [drawerOpen])

  useEffect(() => {
    console.log('[DrawerContext] MOUNTED')
    return () => console.log('[DrawerContext] UNMOUNTED')
  }, [])

  const closeDrawer = useCallback(() => {
    drawerOpen.value = 0
  }, [drawerOpen])

  const toggleDrawer = useCallback(() => {
    drawerOpen.value = drawerOpen.value === 0 ? 1 : 0
  }, [drawerOpen])

  return (
    <DrawerContext.Provider value={{ drawerOpen, openDrawer, closeDrawer, toggleDrawer }}>
      {children}
    </DrawerContext.Provider>
  )
}

export const useDrawer = () => {
  const context = useContext(DrawerContext)
  if (!context) {
    throw new Error('useDrawer must be used within DrawerProvider')
  }
  return context
}
