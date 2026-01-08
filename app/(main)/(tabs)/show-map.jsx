import { StyleSheet, View, TouchableOpacity } from 'react-native'
import { useEffect } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { useMap } from '../../../context/MapContext'
import { COLORS } from '../../../constants/colors'
import MapboxMobile from '../../../components/MapboxMobile'
import { useDashboard } from '../../../context/DashboardContext'

const ShowMap = () => {
  const { flyTo, setShowMarkers, showMarkers, setMapComponent } = useMap()
  const { userLocation, geolocationAccepted } = useDashboard()

  // Zapisz mapę w kontekście gdy komponent się montuje
  useEffect(() => {
    setMapComponent(<MapboxMobile />)
    
    // Cleanup - usuń mapę z kontekstu gdy ekran jest unmountowany
    return () => {
      setMapComponent(null)
    }
  }, [setMapComponent])

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
    <View style={styles.container}>
      {/* Prawdziwa, interaktywna mapa */}
      <View style={styles.mapContainer} pointerEvents='auto'>
        <MapboxMobile />
      </View>

      {/* UI Controls - zawsze nad mapą */}
      <View style={styles.controlsWrapper} pointerEvents='box-none'>
        {/* Kontrolki na mapie */}
        <View style={styles.controlsContainer}>
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
  },
  mapContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  controlsWrapper: {
    flex: 1,
    zIndex: 10,
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
