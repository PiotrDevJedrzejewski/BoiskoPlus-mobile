import { View, StyleSheet } from 'react-native'
import { useMap } from '../context/MapContext'

/**
 * Komponent renderujący mapę jako tło
 * Używany na ekranach gdzie mapa ma być widoczna ale nieinteraktywna
 */
const MapRenderer = () => {
  const { mapComponent, overlayOpacity } = useMap()

  if (!mapComponent) {
    return null
  }

  return (
    <>
      {/* Mapa z kontekstu jako tło */}
      <View style={styles.mapContainer} pointerEvents='none'>
        {mapComponent}
      </View>

      {/* Overlay dla przyciemnienia */}
      {overlayOpacity > 0 && (
        <View
          style={[
            styles.overlay,
            { backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})` },
          ]}
          pointerEvents='none'
        />
      )}
    </>
  )
}

const styles = StyleSheet.create({
  mapContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
})

export default MapRenderer
