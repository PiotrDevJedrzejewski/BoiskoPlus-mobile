import { StyleSheet, View, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect } from 'expo-router'
import { useCallback } from 'react'
import { useMap } from '../../../context/MapContext'
import { COLORS } from '../../../constants/colors'
import { useDashboard } from '../../../context/DashboardContext'
import MapboxMobile from '../../../components/MapboxMobile'

const ShowMap = () => {
  const {
    flyTo,
    setShowMarkers,
    showMarkers,
    setIsInteractive,
    setOverlayOpacity,
  } = useMap()
  const { userLocation, geolocationAccepted } = useDashboard()

  // Włącz interaktywność mapy gdy ekran jest aktywny
  useFocusEffect(
    useCallback(() => {
      setIsInteractive(true)
      setOverlayOpacity(0) // Brak przyciemnienia na mapie

      return () => {
        setIsInteractive(false)
        setOverlayOpacity(0.3) // Przywróć przyciemnienie
      }
    }, [])
  )

  const handleMyLocation = () => {
    if (
      geolocationAccepted &&
      userLocation.latitude &&
      userLocation.longitude
    ) {
      flyTo([userLocation.longitude, userLocation.latitude], 14)
    }
  }

  return (
    <View style={styles.container} pointerEvents='box-none'>
      {/* UI Controls - zawsze nad mapą */}
      <View style={styles.controlsWrapper} pointerEvents='box-none'>
        {/* Kontrolki na mapie */}
        <View style={styles.controlsContainer} pointerEvents='box-none'>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={handleMyLocation}
            activeOpacity={0.8}
          >
            <Ionicons name='locate' size={24} color={COLORS.secondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => setShowMarkers(!showMarkers)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={showMarkers ? 'eye' : 'eye-off'}
              size={24}
              color={COLORS.secondary}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

export default ShowMap

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  controlsWrapper: {
    flex: 1,
    zIndex: 10,
    backgroundColor: 'transparent',
  },
  controlsContainer: {
    position: 'absolute',
    right: 16,
    bottom: 100,
    gap: 12,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
})
