import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Slot } from 'expo-router'
import LottieView from 'lottie-react-native'
import { useMap } from '../../../context/MapContext'
import { COLORS } from '../../../constants/colors'
import MapboxMobile from '../../../components/MapboxMobile'
import spinner from '../../../assets/utils/spinner.json'
import { dbg, useDebugMount } from '../../../assets/utils/debugLogger'

// Map background — only renders here, not under chat or other screens
const MapBackground = React.memo(function MapBackground() {
  dbg('MapBackground')
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
})

// Fullscreen loading overlay — hides map loading + Poland repositioning jank
const MapLoadingScreen = React.memo(function MapLoadingScreen() {
  dbg('MapLoadingScreen')
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
})

export default function MapScreensLayout() {
  dbg('MapScreensLayout')
  useDebugMount('MapScreensLayout')
  return (
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
