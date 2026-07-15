/**
 * =====================================================
 * MAP MANAGER — React lifecycle hook (NIE Provider/Context)
 * =====================================================
 *
 * Stan mapy żyje w zustand (mapStore.js). Ten hook odpowiada TYLKO za
 * efekty zależne od AuthContext (zgody, zapisana lokalizacja):
 *   1. Inicjalizację lokalizacji startowej (raz, przy pierwszym mouncie)
 *   2. Sprawdzanie uprawnień systemowych do geolokalizacji
 *   3. Reakcję na zmianę zgody na lokalizację w ustawieniach
 *
 * Odpowiednik SocketIoContext.jsx (manager, nie Provider), ale w formie
 * hooka zamiast komponentu — bo w przeciwieństwie do socketów, stan mapy
 * potrzebny jest TYLKO wewnątrz show-map.jsx, więc nie ma sensu opasywać
 * nim całego drzewa (auth) tak jak robił to stary <MapProvider>.
 *
 * Użycie: wywołać useMapManager() raz, na górze ShowMap().
 */

import { useRef, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { useMapStore } from './mapStore'
import { checkSystemLocationPermissions } from '../assets/utils/getUserLocation'
import { useDebugEffect } from '../assets/utils/debugLogger'

export const useMapManager = () => {
  const {
    consents,
    consentsLoading,
    getSavedLocation,
    systemPermissionsGeo,
    setSystemPermissionsGeo,
    updateConsents,
  } = useAuth()

  const hasInitializedRef = useRef(false)
  const permissionsCheckedRef = useRef(false)
  const prevLocationAccepted = useRef(consents?.locationAccepted)

  // Inicjalizacja lokalizacji startowej - tylko raz przy pierwszym załadowaniu
  useEffect(() => {
    if (!consentsLoading && consents && !hasInitializedRef.current) {
      hasInitializedRef.current = true
      useMapStore.getState().setStartLocation(consents.locationAccepted, getSavedLocation)
    }
  }, [consentsLoading, consents, getSavedLocation])

  // Sprawdzanie uprawnień systemowych do geolokalizacji — z guardem przeciw infinite loop
  useDebugEffect('useMapManager:checkPermissions',
    [consentsLoading, consents?.locationAccepted],
    ['consentsLoading', 'consents.locationAccepted']
  )
  useEffect(() => {
    if (consentsLoading) return
    if (permissionsCheckedRef.current) return
    permissionsCheckedRef.current = true

    const checkPermissions = async () => {
      await checkSystemLocationPermissions({
        consents,
        systemPermissionsGeo,
        setSystemPermissionsGeo,
        updateConsents,
        consentsLoading,
      })
    }

    checkPermissions()
  }, [consentsLoading, consents?.locationAccepted, systemPermissionsGeo, setSystemPermissionsGeo, updateConsents])

  // Reaguj na zmiany zgody na lokalizację - tylko po inicjalizacji (zmiana w ustawieniach)
  useEffect(() => {
    if (consentsLoading || !hasInitializedRef.current) return
    // Reaguj tylko na faktyczną zmianę zgody (nie na initial mount)
    if (prevLocationAccepted.current === consents?.locationAccepted) return
    prevLocationAccepted.current = consents?.locationAccepted

    const handleLocationConsentChange = async () => {
      if (consents?.locationAccepted) {
        const result = await getSavedLocation()
        if (result.success && result.location) {
          const location = {
            latitude: result.location.latitude,
            longitude: result.location.longitude,
            City: result.location.City || '',
            region: result.location.region || '',
            Country: result.location.Country || 'Poland',
          }
          useMapStore.getState().setUserLocation(location)
          useMapStore.getState().flyTo([result.location.longitude, result.location.latitude], 12)
        }
      } else {
        useMapStore.getState().setUserLocation({
          latitude: 52.0,
          longitude: 19.5,
          City: '',
          Country: 'Poland',
          region: '',
        })
        useMapStore.getState().flyTo([19.5, 52.0], 6)
      }
    }

    handleLocationConsentChange()
  }, [consents?.locationAccepted, consentsLoading, getSavedLocation])
}
