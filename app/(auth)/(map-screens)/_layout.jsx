import { View, StyleSheet } from 'react-native'
import { Slot } from 'expo-router'
import { useEffect } from 'react'
import LottieView from 'lottie-react-native'
import { MapProvider, useMap } from '../../../context/MapContext'
import { COLORS } from '../../../constants/colors'
import MapboxMobile from '../../../components/MapboxMobile'
import spinner from '../../../assets/utils/spinner.json'

// Map background — only renders here, not under chat or other screens
function MapBackground() {
  const { isInteractive, overlayOpacity } = useMap()

  return (
    <View
      style={styles.mapBackground}
      pointerEvents={isInteractive ? 'auto' : 'none'}
    >
      <MapboxMobile isInteractive={isInteractive} />
      {!isInteractive && overlayOpacity > 0 && (
        <View
          style={[
            styles.mapOverlay,
            { backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})` },
          ]}
          pointerEvents='none'
        />
      )}
    </View>
  )
}

// Fullscreen loading overlay — hides map loading + Poland repositioning jank
function MapLoadingScreen() {
  const { isMapReady } = useMap()

  if (isMapReady) return null

  return (
    <View style={styles.loadingOverlay} pointerEvents='none'>
      <LottieView
        source={spinner}
        autoPlay
        loop
        style={styles.spinner}
      />
    </View>
  )
}

export default function MapScreensLayout() {
  useEffect(() => {
    console.log('[MapScreensLayout] MOUNTED')
    return () => console.log('[MapScreensLayout] UNMOUNTED')
  }, [])

  return (
    <MapProvider>
      <View style={styles.container} pointerEvents='box-none'>
        {/* 1. Map as background (always at bottom) */}
        <MapBackground />

        {/* 2. Slot renders current screen (dashboard-home, show-map, find-event) */}
        <View style={styles.contentContainer} pointerEvents='box-none'>
          <Slot />
        </View>

        {/* 3. Loading overlay — covers everything until map is ready */}
        <MapLoadingScreen />
      </View>
    </MapProvider>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  mapBackground: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  contentContainer: {
    flex: 1,
    zIndex: 1,
    backgroundColor: 'transparent',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinner: {
    width: 80,
    height: 80,
  },
})
