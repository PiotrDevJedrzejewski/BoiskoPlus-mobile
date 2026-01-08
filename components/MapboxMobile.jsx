import React, { useState, useEffect, useMemo, useRef } from 'react'
import { View, StyleSheet, Image, Text } from 'react-native'
import Mapbox from '@rnmapbox/maps'
import { useDashboard } from '../context/DashboardContext'
import { useMap } from '../context/MapContext'
import EventMarkerEventList from './EventMarkerEventList'
import EventMarkerEventCreate from './EventMarkerEventCreate'

// Konfiguracja Mapbox (wymaga custom buildu)
Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN || '')

// Komponent markera dla klastra
const ClusterMarker = ({ cluster, onPress, isSelected }) => {
  const isCluster = cluster.properties.cluster
  const pointCount = cluster.properties.point_count_abbreviated

  return (
    <Mapbox.MarkerView
      id={
        isCluster ? `cluster-${cluster.id}` : `event-${cluster.properties._id}`
      }
      coordinate={cluster.geometry.coordinates}
      anchor={{ x: 0.5, y: 1 }}
    >
      <View style={styles.markerContainer}>
        {isSelected && (
          <View style={styles.popupContainer}>
            {/* Popup będzie renderowany osobno */}
          </View>
        )}
        <View style={styles.markerButton}>
          <Image
            source={require('../assets/images/favicon-32x32.png')}
            style={styles.markerIcon}
            resizeMode='contain'
          />
          {isCluster && (
            <View style={styles.clusterBadge}>
              <Text style={styles.clusterText}>{pointCount}</Text>
            </View>
          )}
        </View>
      </View>
    </Mapbox.MarkerView>
  )
}

// Komponent markera dla predefiniowanych miejsc (Orliki)
const PredefinedPlaceMarker = ({ feature, index, onPress, isSelected }) => {
  const [longitude, latitude] = feature.geometry.coordinates

  return (
    <Mapbox.MarkerView
      id={`predefined-place-${index}`}
      coordinate={[longitude, latitude]}
      anchor={{ x: 0.5, y: 0.5 }}
    >
      <View style={styles.predefinedMarkerContainer}>
        {/* Soccer field icon - tutaj możesz użyć @expo/vector-icons */}
        <View
          style={[
            styles.predefinedMarker,
            isSelected && styles.predefinedMarkerSelected,
          ]}
        >
          <Text style={styles.predefinedMarkerText}>⚽</Text>
        </View>
      </View>
    </Mapbox.MarkerView>
  )
}

const MapboxMobile = () => {
  const { filteredEvents, mapTheme, userLocation, geolocationAccepted } =
    useDashboard()
  const { mapRef, camera, setCamera, overlayOpacity } = useMap()

  // State
  const [selectedClusterEvents, setSelectedClusterEvents] = useState(null)
  const [predefinedPlaces, setPredefinedPlaces] = useState([])
  const [selectedPlace, setSelectedPlace] = useState(null)
  const [selectedPlaceId, setSelectedPlaceId] = useState(null)
  const shapeSourceRef = useRef(null)

  // Załaduj dane predefiniowanych miejsc (Orliki)
  useEffect(() => {
    try {
      const orlikData = require('../assets/data/orliki_lodzkie_z_geolokalizacja.json')
      if (orlikData.features) {
        setPredefinedPlaces(orlikData.features)
      }
    } catch (err) {
      console.error('Error loading predefined places:', err)
    }
  }, [])

  // Ustaw początkową pozycję kamery na podstawie geolokalizacji użytkownika
  useEffect(() => {
    if (
      geolocationAccepted &&
      userLocation.latitude &&
      userLocation.longitude
    ) {
      setCamera({
        centerCoordinate: [userLocation.longitude, userLocation.latitude],
        zoomLevel: 14,
      })
    }
  }, [geolocationAccepted, userLocation])

  // Aktualizuj kamerę gdy zmieni się centrum filtrowanych eventów
  useEffect(() => {
    if (filteredEvents.center.latitude && filteredEvents.center.longitude) {
      setCamera({
        centerCoordinate: [
          filteredEvents.center.longitude,
          filteredEvents.center.latitude,
        ],
        zoomLevel: camera.zoomLevel || 14,
      })
    }
  }, [filteredEvents.center])

  // Przygotuj dane GeoJSON dla eventów
  const geojson = useMemo(
    () => ({
      type: 'FeatureCollection',
      features: filteredEvents.events.map((event) => ({
        type: 'Feature',
        properties: {
          ...event,
          _id: event._id,
        },
        geometry: {
          type: 'Point',
          coordinates: event.geolocation.coordinates,
        },
      })),
    }),
    [filteredEvents.events]
  )

  // Obsługa kliknięcia w marker
  const handleMarkerPress = async (feature) => {
    const { cluster, point_count } = feature.properties

    if (cluster && shapeSourceRef.current) {
      // To jest klaster - pobierz wszystkie eventy w klastrze
      const collection = await shapeSourceRef.current.getClusterLeaves(
        feature.properties.cluster_id,
        point_count,
        0
      )
      const events = collection.features.map((f) => f.properties)
      setSelectedClusterEvents(events)
    } else {
      // To jest pojedynczy event
      setSelectedClusterEvents([feature.properties])
    }
  }

  const handleClosePopup = () => {
    setSelectedClusterEvents(null)
  }

  const handlePredefinedPlacePress = (feature, index) => {
    setSelectedPlace(feature)
    setSelectedPlaceId(index)
  }

  const handleClosePlacePopup = () => {
    setSelectedPlace(null)
    setSelectedPlaceId(null)
  }

  // Filtrowane predefined places dla optymalizacji
  const visiblePredefinedPlaces = useMemo(() => {
    if (!predefinedPlaces.length || !camera.centerCoordinate) return []

    const [centerLng, centerLat] = camera.centerCoordinate
    const buffer = 0.2

    return predefinedPlaces.filter((feature) => {
      const [lng, lat] = feature.geometry.coordinates
      return (
        lng >= centerLng - buffer &&
        lng <= centerLng + buffer &&
        lat >= centerLat - buffer &&
        lat <= centerLat + buffer
      )
    })
  }, [predefinedPlaces, camera.centerCoordinate])

  // Style mapy (light/dark)
  const mapStyleURL = {
    light: 'mapbox://styles/jdevsky/cmhlx096g002i01sa03tt5ld1',
    dark: 'mapbox://styles/jdevsky/cmhlwzxjd002h01sa290x0rwi',
  }

  return (
    <View style={styles.container}>
      <Mapbox.MapView
        ref={mapRef}
        style={styles.map}
        styleURL={mapStyleURL[mapTheme]}
        logoEnabled={false}
        attributionEnabled={false}
        compassEnabled={false}
      >
        <Mapbox.Camera
          zoomLevel={camera.zoomLevel}
          centerCoordinate={camera.centerCoordinate}
          animationDuration={1000}
        />

        {/* User location marker */}
        {geolocationAccepted &&
          userLocation.latitude &&
          userLocation.longitude && (
            <Mapbox.MarkerView
              id='user-location'
              coordinate={[userLocation.longitude, userLocation.latitude]}
            >
              <View style={styles.userLocationMarker}>
                <View style={styles.userLocationDot} />
              </View>
            </Mapbox.MarkerView>
          )}

        {/* Predefined places markers (Orliki) */}
        {visiblePredefinedPlaces.map((feature, index) => (
          <PredefinedPlaceMarker
            key={`predefined-${index}`}
            feature={feature}
            index={index}
            onPress={() => handlePredefinedPlacePress(feature, index)}
            isSelected={selectedPlaceId === index}
          />
        ))}

        {/* Event markers with clustering using ShapeSource */}
        <Mapbox.ShapeSource
          ref={shapeSourceRef}
          id='events-source'
          shape={geojson}
          cluster
          clusterRadius={50}
          clusterMaxZoomLevel={16}
          onPress={(event) => {
            if (event.features && event.features[0]) {
              handleMarkerPress(event.features[0])
            }
          }}
        >
          <Mapbox.SymbolLayer
            id='clusters-count'
            filter={['has', 'point_count']}
            style={{
              textField: ['get', 'point_count_abbreviated'],
              textSize: 13,
              textColor: '#ffffff',
              textFont: ['DIN Offc Pro Bold', 'Arial Unicode MS Bold'],
              iconImage: require('../assets/images/favicon-32x32.png'),
              iconSize: 1,
              iconAllowOverlap: true,
              textAllowOverlap: true,
              textOffset: [1.5, -0.5],
            }}
          />
          <Mapbox.SymbolLayer
            id='single-events'
            filter={['!', ['has', 'point_count']]}
            style={{
              iconImage: require('../assets/images/favicon-32x32.png'),
              iconSize: 1,
              iconAllowOverlap: true,
            }}
          />
        </Mapbox.ShapeSource>
      </Mapbox.MapView>

      {/* Overlay dla przyciemnienia mapy */}
      {/* {overlayOpacity > 0 && (
        <View
          style={[
            styles.overlay,
            { backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})` },
          ]}
          pointerEvents='none'
        />
      )} */}

      {/* Popup dla wybranych eventów */}
      {selectedClusterEvents && (
        <EventMarkerEventList
          events={selectedClusterEvents}
          onClose={handleClosePopup}
        />
      )}

      {/* Popup dla wybranego miejsca */}
      {selectedPlace && (
        <EventMarkerEventCreate
          orlikData={selectedPlace}
          onClose={handleClosePlacePopup}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  map: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  markerContainer: {
    alignItems: 'center',
  },
  markerButton: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerIcon: {
    width: 32,
    height: 32,
  },
  clusterBadge: {
    position: 'absolute',
    top: -10,
    right: -5,
    backgroundColor: '#e7153f',
    borderRadius: 11,
    minWidth: 22,
    minHeight: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    paddingHorizontal: 4,
  },
  clusterText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  predefinedMarkerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  predefinedMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5,
  },
  predefinedMarkerSelected: {
    transform: [{ scale: 1.2 }],
  },
  predefinedMarkerText: {
    fontSize: 16,
  },
  userLocationMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userLocationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3b82f6',
    borderWidth: 2,
    borderColor: '#fff',
  },
  popupContainer: {
    position: 'absolute',
    bottom: '100%',
    marginBottom: 20,
    zIndex: 10,
  },
})

export default MapboxMobile
