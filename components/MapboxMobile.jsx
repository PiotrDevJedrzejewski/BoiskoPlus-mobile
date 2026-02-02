import React, { useState, useEffect, useMemo, useRef } from 'react'
import { View, StyleSheet } from 'react-native'
import Mapbox from '@rnmapbox/maps'
import { useDashboard } from '../context/DashboardContext'
import { useMap } from '../context/MapContext'
import EventMarkerEventList from './EventMarkerEventList'
import EventMarkerEventCreate from './EventMarkerEventCreate'

// Konfiguracja Mapbox (wymaga custom buildu)
Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN || '')

const MapboxMobile = () => {
  const { filteredEvents, mapTheme, userLocation, geolocationAccepted } =
    useDashboard()
  const { mapRef, camera, showMarkers, setIsMapReady } = useMap()

  // State
  const [selectedClusterEvents, setSelectedClusterEvents] = useState(null)
  const [predefinedPlaces, setPredefinedPlaces] = useState([])
  const [selectedPlace, setSelectedPlace] = useState(null)
  const shapeSourceRef = useRef(null)
  const predefinedShapeSourceRef = useRef(null)

  // Załaduj dane predefiniowanych miejsc (Orliki)
  useEffect(() => {
    try {
      const orlikData = require('../assets/data/orliki_lodzkie_z_geolokalizacja.json')
      if (orlikData.features) {
        setPredefinedPlaces(orlikData.features)
        // console.log('📍 [Orliki] Załadowano dane:', orlikData.features.length, 'miejsc')
      }
    } catch (err) {
      console.error('❌ [Orliki] Error loading predefined places:', err)
    }
  }, [])

  // Kamera jest sterowana wyłącznie przez MapContext (flyTo, setCamera)
  // Nie ma tutaj żadnej logiki kamery - wszystko idzie przez context

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
    try {
      const { cluster, point_count } = feature.properties
      console.log('🔵 [Map] Kliknięto marker eventu. Cluster:', cluster, 'Point count:', point_count)

      if (cluster && shapeSourceRef.current) {
        // To jest klaster - pobierz wszystkie eventy w klastrze
        const collection = await shapeSourceRef.current.getClusterLeaves(
          feature.properties.cluster_id,
          point_count,
          0
        )
        const events = collection.features.map((f) => f.properties)
        console.log('🔵 [Map] Pobrano', events.length, 'eventów z klastra')
        setSelectedClusterEvents(events)
      } else {
        // To jest pojedynczy event
        console.log('🔵 [Map] Pojedynczy event:', feature.properties._id || feature.properties.eventId)
        setSelectedClusterEvents([feature.properties])
      }
    } catch (error) {
      console.error('❌ [Map] Błąd w handleMarkerPress:', error)
    }
  }

  const handleClosePopup = () => {
    setSelectedClusterEvents(null)
  }

  // Obsługa kliknięcia w marker predefiniowanego miejsca (ShapeSource)
  const handlePredefinedPlacePress = async (event) => {
    try {
      console.log('🟢 [Map] Kliknięto marker orlika')
      if (event.features && event.features[0]) {
        const feature = event.features[0]
        const { cluster, point_count } = feature.properties
        console.log('🟢 [Map] Cluster:', cluster, 'Point count:', point_count)

        if (cluster && predefinedShapeSourceRef.current) {
          // To jest klaster - pobierz wszystkie miejsca w klastrze
          const collection = await predefinedShapeSourceRef.current.getClusterLeaves(
            feature.properties.cluster_id,
            point_count,
            0
          )
          const places = collection.features.map((f) => ({
            id: f.properties.id,
            properties: f.properties,
            geometry: f.geometry,
          }))
          console.log('🟢 [Map] Pobrano', places.length, 'miejsc z klastra')
          setSelectedPlace(places)
        } else {
          // Pojedyncze miejsce
          const place = predefinedPlaces.find(p => p.id === feature.properties.id)
          console.log('🟢 [Map] Pojedyncze miejsce:', place?.properties?.miasto)
          if (place) {
            setSelectedPlace(place)
          }
        }
      }
    } catch (err) {
      console.error('❌ [Map] Błąd w handlePredefinedPlacePress:', err)
    }
  }

  const handleClosePlacePopup = () => {
    setSelectedPlace(null)
  }

  // GeoJSON dla predefiniowanych miejsc - bez filtrowania, z klastrowaniem
  const predefinedGeojson = useMemo(() => {
    if (!predefinedPlaces.length) {
      return { type: 'FeatureCollection', features: [] }
    }

    return {
      type: 'FeatureCollection',
      features: predefinedPlaces.map((place) => ({
        type: 'Feature',
        id: place.id,
        properties: {
          id: place.id,
          ...place.properties,
        },
        geometry: place.geometry,
      })),
    }
  }, [predefinedPlaces, showMarkers])

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
        scaleBarEnabled={false}
        onDidFinishLoadingMap={() => setIsMapReady(true)}
      >
        <Mapbox.Camera
          zoomLevel={camera.zoomLevel}
          centerCoordinate={camera.centerCoordinate}
          animationDuration={1000}
        />

        {/* Images component for markers */}
        <Mapbox.Images
          images={{
            'event-marker': require('../assets/images/favicon-32x32.png'),
            'event-cluster-marker': require('../assets/images/fav64Circle.png'),
            'orlik-marker': require('../assets/images/soccerfield-testing.png'),
          }}
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

        {/* Predefined places (Orliki) - z klastrowaniem */}
        {showMarkers && predefinedGeojson.features.length > 0 && (
          <Mapbox.ShapeSource
            ref={predefinedShapeSourceRef}
            id='predefined-places-source'
            shape={predefinedGeojson}
            cluster
            clusterRadius={30}
            clusterMaxZoomLevel={14}
            onPress={handlePredefinedPlacePress}
          >
            {/* Klastery - ikona z licznikiem */}
            <Mapbox.SymbolLayer
              id='predefined-places-clusters'
              filter={['has', 'point_count']}
              style={{
                iconImage: 'orlik-marker',
                iconSize: 0.2,
                iconAllowOverlap: true,
                textField: ['get', 'point_count_abbreviated'],
                textSize: 12,
                textColor: '#ffffff',
                textFont: ['DIN Offc Pro Bold', 'Arial Unicode MS Bold'],
                textOffset: [0, -1.4],
                textAllowOverlap: true,
              }}
            />
            {/* Pojedyncze markery */}
            <Mapbox.SymbolLayer
              id='predefined-places-singles'
              filter={['!', ['has', 'point_count']]}
              style={{
                iconImage: 'orlik-marker',
                iconSize: 0.15,
                iconAllowOverlap: true,
                iconAnchor: 'center',
              }}
            />
          </Mapbox.ShapeSource>
        )}

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
          {/* Ikona dla klastrów */}
          <Mapbox.SymbolLayer
            id='clusters-icon'
            filter={['has', 'point_count']}
            style={{
              iconImage: 'event-cluster-marker',
              iconSize: 1,
              iconAllowOverlap: true,
            }}
          />
          {/* Licznik na czerwonym tle */}
          <Mapbox.SymbolLayer
            id='clusters-count'
            filter={['has', 'point_count']}
            style={{
              textField: ['get', 'point_count_abbreviated'],
              textSize: 15,
              textColor: '#ffffff',
              textFont: ['DIN Offc Pro Bold', 'Arial Unicode MS Bold'],
              textAllowOverlap: true,
              textOffset: [1.1, -1.1],
              textJustify: 'center',
              textHaloBlur: 0,
            }}
          />
          {/* Pojedyncze eventy */}
          <Mapbox.SymbolLayer
            id='single-events'
            filter={['!', ['has', 'point_count']]}
            style={{
              iconImage: 'event-marker',
              iconSize: 1,
              iconAllowOverlap: true,
            }}
          />
        </Mapbox.ShapeSource>
      </Mapbox.MapView>

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
})

export default MapboxMobile
