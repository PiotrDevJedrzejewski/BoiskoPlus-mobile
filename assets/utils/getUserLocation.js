import * as Location from 'expo-location'

/**
 * Sprawdza i żąda uprawnień systemowych do geolokalizacji
 * @param {Object} params - Parametry funkcji
 * @param {Object} params.consents - Zgody użytkownika
 * @param {Object} params.systemPermissionsGeo - Stan uprawnień systemowych
 * @param {Function} params.setSystemPermissionsGeo - Funkcja do aktualizacji uprawnień systemowych
 * @param {Function} params.updateConsents - Funkcja do aktualizacji zgód
 * @param {boolean} params.consentsLoading - Czy zgody się ładują
 * @returns {Promise<Object>} - Rezultat sprawdzenia uprawnień
 */
export const checkSystemLocationPermissions = async ({
  consents,
  systemPermissionsGeo,
  setSystemPermissionsGeo,
  updateConsents,
  consentsLoading,
}) => {
  try {
    // Pomiń jeśli zgody się jeszcze ładują
    if (consentsLoading) {
      return { success: false, reason: 'consents_loading' }
    }

    // Jeśli nie mamy naszej zgody - nie pytaj o systemową
    if (!consents?.locationAccepted) {
      // Pozostaw undetermined
      if (systemPermissionsGeo.status !== 'undetermined') {
        setSystemPermissionsGeo({ status: 'undetermined' })
      }
      return { success: false, reason: 'no_consent' }
    }

    // Mamy naszą zgodę - sprawdź systemową
    // Najpierw sprawdź obecny stan uprawnień
    const { status: currentStatus } = await Location.getForegroundPermissionsAsync()

    if (currentStatus === 'granted') {
      // Użytkownik już wcześniej przyznał uprawnienia
      if (systemPermissionsGeo.status !== 'granted') {
        setSystemPermissionsGeo({ status: 'granted' })
      }
      return { success: true, status: 'granted', wasAlreadyGranted: true }
    }

    // Jeśli uprawnienia nie są przyznane, poproś użytkownika
    const { status: newStatus } = await Location.requestForegroundPermissionsAsync()

    if (newStatus === 'granted') {
      // Użytkownik przyznał uprawnienia
      if (systemPermissionsGeo.status !== 'granted') {
        setSystemPermissionsGeo({ status: 'granted' })
      }
      return { success: true, status: 'granted', wasAlreadyGranted: false }
    } else {
      // Użytkownik odmówił - zmień status i cofnij naszą zgodę
      if (systemPermissionsGeo.status !== 'denied') {
        setSystemPermissionsGeo({ status: 'denied' })
      }
      await updateConsents({ locationAccepted: false })
      return { success: false, status: 'denied', reason: 'user_denied' }
    }
  } catch (error) {
    console.error('Błąd sprawdzania uprawnień systemowych:', error)
    if (systemPermissionsGeo.status !== 'denied') {
      setSystemPermissionsGeo({ status: 'denied' })
    }
    await updateConsents({ locationAccepted: false })
    return { success: false, status: 'denied', reason: 'error', error }
  }
}

/**
 * Pobiera aktualną lokalizację użytkownika
 * Wymaga wcześniejszego sprawdzenia uprawnień
 * @returns {Promise<Object>} - Lokalizacja użytkownika
 */
export const getCurrentLocation = async () => {
  try {
    const { status } = await Location.getForegroundPermissionsAsync()
    
    if (status !== 'granted') {
      return {
        success: false,
        error: 'Brak uprawnień do lokalizacji',
      }
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    })

    return {
      success: true,
      location: {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
      },
    }
  } catch (error) {
    console.error('Błąd pobierania lokalizacji:', error)
    return {
      success: false,
      error: 'Nie udało się pobrać lokalizacji',
    }
  }
}
