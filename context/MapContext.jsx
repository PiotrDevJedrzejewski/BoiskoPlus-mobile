import { createContext, useContext, useState, useRef, useCallback } from 'react'

const MapContext = createContext()

export const MapProvider = ({ children }) => {
  const mapRef = useRef(null)

  // Czy pokazywać markery
  const [showMarkers, setShowMarkers] = useState(true)

  // Opacity overlay (dla przyciemnienia tła)
  const [overlayOpacity, setOverlayOpacity] = useState(0.3)

  // Kamera mapy
  const [camera, setCamera] = useState({
    centerCoordinate: [19.145136, 51.919438], // Polska
    zoomLevel: 5,
  })

  // Komponent mapy do współdzielenia między ekranami
  const [mapComponent, setMapComponent] = useState(null)

  const flyTo = useCallback((coordinates, zoom = 14) => {
    if (mapRef.current) {
      mapRef.current.setCamera({
        centerCoordinate: coordinates,
        zoomLevel: zoom,
        animationDuration: 1000,
      })
    }
  }, [])

  return (
    <MapContext.Provider
      value={{
        mapRef,
        showMarkers,
        setShowMarkers,
        overlayOpacity,
        setOverlayOpacity,
        camera,
        setCamera,
        flyTo,
        mapComponent,
        setMapComponent,
      }}
    >
      {children}
    </MapContext.Provider>
  )
}

export const useMap = () => {
  const context = useContext(MapContext)
  if (!context) {
    throw new Error('useMap must be used within MapProvider')
  }
  return context
}
