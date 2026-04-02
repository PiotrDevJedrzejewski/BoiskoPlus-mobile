import { createContext, useContext, useCallback, useMemo } from 'react'
import { useSharedValue } from 'react-native-reanimated'
import { dbg, useDebugMount } from '../assets/utils/debugLogger'

const DrawerContext = createContext()

export const DrawerProvider = ({ children }) => {
  dbg('DrawerProvider')
  useDebugMount('DrawerProvider')

  // 0 = closed, 1 = open — animated with reanimated
  const drawerOpen = useSharedValue(0)

  const openDrawer = useCallback(() => {
    drawerOpen.value = 1
  }, [drawerOpen])

  const closeDrawer = useCallback(() => {
    drawerOpen.value = 0
  }, [drawerOpen])

  const toggleDrawer = useCallback(() => {
    drawerOpen.value = drawerOpen.value === 0 ? 1 : 0
  }, [drawerOpen])

  const drawerContextValue = useMemo(() => ({
    drawerOpen, openDrawer, closeDrawer, toggleDrawer,
  }), [drawerOpen, openDrawer, closeDrawer, toggleDrawer])

  return (
    <DrawerContext.Provider value={drawerContextValue}>
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
