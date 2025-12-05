import { StyleSheet, View } from 'react-native'
import Mapbox, { MapView, Camera } from '@rnmapbox/maps'
import { useMap } from '../context/MapContext'
import { COLORS } from '../constants/colors'

// Ustaw token Mapbox
Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN)

const MapBackground = () => {
  const { mapRef, isInteractive, camera, overlayOpacity, showMarkers } =
    useMap()

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        styleURL='mapbox://styles/mapbox/dark-v11' // Ciemny styl jak na web
        zoomEnabled={isInteractive}
        scrollEnabled={isInteractive}
        pitchEnabled={isInteractive}
        rotateEnabled={isInteractive}
      >
        <Camera
          centerCoordinate={camera.centerCoordinate}
          zoomLevel={camera.zoomLevel}
          animationMode='flyTo'
          animationDuration={1000}
        />

        {/* TODO: Dodaj markery wydarzeń gdy showMarkers === true */}
        {showMarkers &&
          // <EventMarkers />
          null}
      </MapView>

      {/* Overlay - przyciemnienie mapy gdy nieinteraktywna */}
      {overlayOpacity > 0 && (
        <View
          style={[
            styles.overlay,
            { backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})` },
          ]}
          pointerEvents='none'
        />
      )}
    </View>
  )
}

export default MapBackground

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  map: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
})
