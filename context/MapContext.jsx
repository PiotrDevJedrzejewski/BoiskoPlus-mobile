import { createContext, useContext, useState, useRef } from 'react'

const MapContext = createContext()

export const MapProvider = ({ children }) => {
  const mapRef = useRef(null)
  const [isInteractive, setIsInteractive] = useState(true)
  const [showMarkers, setShowMarkers] = useState(true)
  const [overlayOpacity, setOverlayOpacity] = useState(0) // 0 = pełna mapa, 0.7 = przyciemnione tło

  // Kamera mapy
  const [camera, setCamera] = useState({
    centerCoordinate: [19.145136, 51.919438], // Polska
    zoomLevel: 5,
  })

  const flyTo = (coordinates, zoom = 14) => {
    if (mapRef.current) {
      mapRef.current.setCamera({
        centerCoordinate: coordinates,
        zoomLevel: zoom,
        animationDuration: 1000,
      })
    }
  }

  return (
    <MapContext.Provider
      value={{
        mapRef,
        isInteractive,
        setIsInteractive,
        showMarkers,
        setShowMarkers,
        overlayOpacity,
        setOverlayOpacity,
        camera,
        setCamera,
        flyTo,
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
