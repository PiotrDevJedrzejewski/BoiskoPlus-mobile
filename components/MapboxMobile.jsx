import React, { useState, useEffect, useMemo, useRef, useCallback, memo } from 'react'
import { View, StyleSheet } from 'react-native'
import Mapbox from '@rnmapbox/maps'
import Supercluster from 'supercluster'
import { useDashboard } from '../context/DashboardContext'
import { useMap } from '../context/MapContext'
import EventMarkerEventList from './popup/EventMarkerEventList'
import EventMarkerEventCreate from './popup/EventMarkerEventCreate'

// Konfiguracja Mapbox (wymaga custom buildu)
Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN || '')

// Throttle helper - ogranicza częstotliwość wywołań funkcji
const throttle = (func, delay) => {
  let lastCall = 0
  let timeoutId = null

  return (...args) => {
    const now = Date.now()
    const timeSinceLastCall = now - lastCall

    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    if (timeSinceLastCall >= delay) {
      lastCall = now
      func(...args)
    } else {
      // Zaplanuj wywołanie po upływie delay (trailing call)
      timeoutId = setTimeout(() => {
        lastCall = Date.now()
        func(...args)
      }, delay - timeSinceLastCall)
    }
  }
}

const MapboxMobile = ({ isInteractive = true }) => {
  const { filteredEvents, mapTheme, userLocation, geolocationAccepted } =
    useDashboard()
  const { mapRef, cameraRef, camera, showMarkers, showEvents, setIsMapReady } = useMap()

  // Reset isMapReady przy unmount — loading screen pokaże się ponownie przy powrocie
  useEffect(() => {
    return () => setIsMapReady(false)
  }, [setIsMapReady])

  // State dla wybranych elementów (musi być state bo wymaga re-renderu przy otwarciu modalu)
  const [selectedClusterEvents, setSelectedClusterEvents] = useState(null)
  const [selectedPlace, setSelectedPlace] = useState(null)

  // Dane orlików - state bo ładowane asynchronicznie i triggerują inicjalizację supercluster
  const [predefinedPlaces, setPredefinedPlaces] = useState([])

  // Ref dla instancji Supercluster - nie wymaga re-renderu przy tworzeniu
  const eventsSuperclusterRef = useRef(null)
  const orlikSuperclusterRef = useRef(null)

  // Ref dla aktualnego regionu mapy - nie wymaga re-renderu przy zmianie
  const mapRegionRef = useRef({
    bounds: null,
    zoom: camera.zoomLevel,
  })

  // State dla klastrów - wymaga re-renderu bo renderujemy je na mapie
  const [eventClusters, setEventClusters] = useState([])
  const [orlikClusters, setOrlikClusters] = useState([])

  // Map dla szybkiego lookup klastrów po ID - O(1) zamiast O(n)
  const eventClustersMapRef = useRef(new Map())
  const orlikClustersMapRef = useRef(new Map())

  // Funkcja aktualizująca klastry - wywoływana ręcznie, nie przez useEffect
  const updateClusters = useCallback(() => {
    const { bounds, zoom } = mapRegionRef.current
    if (!bounds) return

    const zoomLevel = Math.floor(zoom)
    // Format bounds dla Supercluster: [west, south, east, north]
    const boundsArray = [
      bounds.sw[0], // west (min longitude)
      bounds.sw[1], // south (min latitude)
      bounds.ne[0], // east (max longitude)
      bounds.ne[1], // north (max latitude)
    ]

    // Aktualizuj klastry eventów
    if (eventsSuperclusterRef.current) {
      const clusters = eventsSuperclusterRef.current.getClusters(boundsArray, zoomLevel)

      // Zbuduj Map dla szybkiego lookup
      const newMap = new Map()
      clusters.forEach((cluster, index) => {
        const id = cluster.properties.cluster
          ? `cluster-${cluster.properties.cluster_id}`
          : `event-${cluster.properties._id}`
        newMap.set(id, cluster)
      })
      eventClustersMapRef.current = newMap
      setEventClusters(clusters)
    }

    // Aktualizuj klastry orlików
    if (orlikSuperclusterRef.current && showMarkers) {
      const clusters = orlikSuperclusterRef.current.getClusters(boundsArray, zoomLevel)

      // Zbuduj Map dla szybkiego lookup
      const newMap = new Map()
      clusters.forEach((cluster, index) => {
        const id = cluster.properties.cluster
          ? `orlik-cluster-${cluster.properties.cluster_id}`
          : `orlik-${cluster.properties.id}`
        newMap.set(id, cluster)
      })
      orlikClustersMapRef.current = newMap
      setOrlikClusters(clusters)
    } else if (!showMarkers) {
      orlikClustersMapRef.current = new Map()
      setOrlikClusters([])
    }
  }, [showMarkers])

  // Throttled wersja updateClusters - max 1 wywołanie na 100ms
  const throttledUpdateClusters = useMemo(
    () => throttle(updateClusters, 100),
    [updateClusters]
  )

  // Załaduj dane predefiniowanych miejsc (Orliki) z lokalnego pliku JSON
  useEffect(() => {
    try {
      const orlikData = require('../assets/data/orliki_hale_polska.json')
      if (orlikData.features) {
        setPredefinedPlaces(orlikData.features)
      }
    } catch (err) {
      console.error('❌ [Orliki] Error loading predefined places:', err)
    }
  }, [])

  // Przygotuj dane eventów w formacie GeoJSON dla Supercluster
  const eventsGeojson = useMemo(
    () => ({
      type: 'FeatureCollection',
      features: (filteredEvents.events || [])
        .filter((event) => event && event._id && event.geolocation?.coordinates)
        .map((event, index) => ({
          type: 'Feature',
          id: index,
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

  // Inicjalizacja Supercluster dla eventów - używamy ref zamiast state
  useEffect(() => {
    if (eventsGeojson.features.length === 0) {
      eventsSuperclusterRef.current = null
      setEventClusters([])
      eventClustersMapRef.current = new Map()
      return
    }

    const cluster = new Supercluster({
      radius: 30,
      maxZoom: 14,
    })
    cluster.load(eventsGeojson.features)
    eventsSuperclusterRef.current = cluster

    // Aktualizuj klastry po załadowaniu nowych danych
    updateClusters()
  }, [eventsGeojson, updateClusters])

  // Inicjalizacja Supercluster dla orlików - używamy ref zamiast state
  useEffect(() => {
    if (predefinedPlaces.length === 0 || !showMarkers) {
      orlikSuperclusterRef.current = null
      setOrlikClusters([])
      orlikClustersMapRef.current = new Map()
      return
    }

    const orlikFeatures = predefinedPlaces.map((place, index) => ({
      type: 'Feature',
      id: index,
      properties: {
        id: place.id,
        ...place.properties,
      },
      geometry: place.geometry,
    }))

    const cluster = new Supercluster({
      radius: 50,
      maxZoom: 14,
    })
    cluster.load(orlikFeatures)
    orlikSuperclusterRef.current = cluster

    // Aktualizuj klastry po załadowaniu nowych danych
    updateClusters()
  }, [predefinedPlaces, showMarkers, updateClusters])

  // Obsługa zmiany regionu mapy - jeden ref update + throttled clusters update
  const handleRegionChange = useCallback((feature) => {
    const bounds = feature.properties.visibleBounds
    const zoom = feature.properties.zoomLevel

    if (bounds && bounds.length === 2) {
      // Aktualizuj ref (bez re-renderu)
      mapRegionRef.current = {
        bounds: {
          ne: bounds[0],
          sw: bounds[1],
        },
        zoom,
      }

      // Throttled update klastrów
      throttledUpdateClusters()
    }
  }, [throttledUpdateClusters])

  // Obsługa kliknięcia w marker eventu - lookup po ID z Map
  const handleEventMarkerPress = useCallback((featureId) => {
    const cluster = eventClustersMapRef.current.get(featureId)
    if (!cluster) return

    const { cluster: isCluster, cluster_id } = cluster.properties

    if (isCluster && eventsSuperclusterRef.current) {
      const leaves = eventsSuperclusterRef.current.getLeaves(cluster_id, Infinity)
      const events = leaves.map((leaf) => leaf.properties)
      setSelectedClusterEvents(events)
    } else {
      setSelectedClusterEvents([cluster.properties])
    }
  }, [])

  // Obsługa kliknięcia w marker orlika - lookup po ID z Map
  const handleOrlikMarkerPress = useCallback((featureId) => {
    const cluster = orlikClustersMapRef.current.get(featureId)
    if (!cluster) return

    const { cluster: isCluster, cluster_id } = cluster.properties

    if (isCluster && orlikSuperclusterRef.current) {
      const leaves = orlikSuperclusterRef.current.getLeaves(cluster_id, Infinity)
      const places = leaves.map((leaf) => ({
        id: leaf.properties.id,
        properties: leaf.properties,
        geometry: leaf.geometry,
      }))
      setSelectedPlace(places)
    } else {
      const place = {
        id: cluster.properties.id,
        properties: cluster.properties,
        geometry: cluster.geometry,
      }
      setSelectedPlace(place)
    }
  }, [])

  const handleClosePopup = useCallback(() => {
    setSelectedClusterEvents(null)
  }, [])

  const handleClosePlacePopup = useCallback(() => {
    setSelectedPlace(null)
  }, [])

  // Przygotuj dane klastrów w formacie GeoJSON dla ShapeSource
  const eventClustersGeojson = useMemo(() => ({
    type: 'FeatureCollection',
    features: eventClusters.map((cluster) => ({
      ...cluster,
      id: cluster.properties.cluster
        ? `cluster-${cluster.properties.cluster_id}`
        : `event-${cluster.properties._id}`,
    })),
  }), [eventClusters])

  const orlikClustersGeojson = useMemo(() => ({
    type: 'FeatureCollection',
    features: orlikClusters.map((cluster) => ({
      ...cluster,
      id: cluster.properties.cluster
        ? `orlik-cluster-${cluster.properties.cluster_id}`
        : `orlik-${cluster.properties.id}`,
    })),
  }), [orlikClusters])

  // Style mapy (light/dark)
  const mapStyleURL = useMemo(() => ({
    light: 'mapbox://styles/jdevsky/cmhlx096g002i01sa03tt5ld1',
    dark: 'mapbox://styles/jdevsky/cmhlwzxjd002h01sa290x0rwi',
  }), [])

  // Handler dla załadowania mapy - inicjalizacja bounds
  const handleMapLoad = useCallback(() => {
    setIsMapReady(true)
    // Ustaw początkowe bounds
    mapRegionRef.current = {
      bounds: {
        ne: [camera.centerCoordinate[0] + 0.5, camera.centerCoordinate[1] + 0.5],
        sw: [camera.centerCoordinate[0] - 0.5, camera.centerCoordinate[1] - 0.5],
      },
      zoom: camera.zoomLevel,
    }
    // Wywołaj update klastrów
    updateClusters()
  }, [camera.centerCoordinate, camera.zoomLevel, setIsMapReady, updateClusters])

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
        // Wyłącz natywne gesture recognizery mapy gdy mapa jest w tle
        // pointerEvents='none' na View-wrapperze nie wystarczy dla natywnych gestów Mapbox
        scrollEnabled={isInteractive}
        pitchEnabled={isInteractive}
        rotateEnabled={isInteractive}
        zoomEnabled={isInteractive}
        onDidFinishLoadingMap={handleMapLoad}
        onRegionIsChanging={handleRegionChange}
      >
        {/* Kamera sterowana przez MapContext - ref imperatywny dla niezawodnej nawigacji na iOS/Android */}
        <Mapbox.Camera
          ref={cameraRef}
          zoomLevel={camera.zoomLevel}
          centerCoordinate={camera.centerCoordinate}
          animationMode='flyTo'
          animationDuration={1000}
        />

        {/* Definicje obrazków używanych jako ikony markerów */}
        <Mapbox.Images
          images={{
            'event-marker': require('../assets/images/favicon-32x32.png'),
            'event-cluster-marker': require('../assets/images/fav64Circle.png'),
            'orlik-marker': require('../assets/images/soccerfield-testing.png'),
          }}
        />

        {/* Marker lokalizacji użytkownika */}
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

        {/* Markery Orlików - renderowane z Supercluster */}
        {showMarkers && orlikClustersGeojson.features.length > 0 && (
          <Mapbox.ShapeSource
            id='predefined-places-source'
            shape={orlikClustersGeojson}
            onPress={(event) => {
              // Lookup po ID - O(1) zamiast O(n)
              const featureId = event.features?.[0]?.id
              if (featureId) {
                handleOrlikMarkerPress(featureId)
              }
            }}
          >
            {/* Klastery orlików */}
            <Mapbox.SymbolLayer
              id='predefined-places-clusters'
              filter={['has', 'point_count']}
              style={{
                iconImage: 'orlik-marker',
                iconSize: 0.2,
                iconAllowOverlap: true,
                textField: ['get', 'point_count'],
                textSize: 12,
                textColor: '#ffffff',
                textFont: ['DIN Offc Pro Bold', 'Arial Unicode MS Bold'],
                textOffset: [0, -1.4],
                textAllowOverlap: true,
              }}
            />
            {/* Pojedyncze orliki */}
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

        {/* Markery Eventów - renderowane z Supercluster */}
        {showEvents && eventClustersGeojson.features.length > 0 && (
          <Mapbox.ShapeSource
            id='events-source'
            shape={eventClustersGeojson}
            onPress={(event) => {
              // Lookup po ID - O(1) zamiast O(n)
              const featureId = event.features?.[0]?.id
              if (featureId) {
                handleEventMarkerPress(featureId)
              }
            }}
          >
            {/* Klastery eventów */}
            <Mapbox.SymbolLayer
              id='clusters-icon'
              filter={['has', 'point_count']}
              style={{
                iconImage: 'event-cluster-marker',
                iconSize: 1,
                iconAllowOverlap: true,
              }}
            />
            {/* Licznik w klastrze */}
            <Mapbox.SymbolLayer
              id='clusters-count'
              filter={['has', 'point_count']}
              style={{
                textField: ['get', 'point_count'],
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
        )}
      </Mapbox.MapView>

      {/* Modal z listą eventów */}
      {selectedClusterEvents && (
        <EventMarkerEventList
          events={selectedClusterEvents}
          onClose={handleClosePopup}
        />
      )}

      {/* Modal z listą orlików */}
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

export default memo(MapboxMobile)
