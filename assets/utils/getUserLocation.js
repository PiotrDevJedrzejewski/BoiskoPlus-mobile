/**
 * Pobieranie lokalizacji użytkownika dla React Native
 * Używa expo-location zamiast Mapbox Geocoding API
 */
import * as Location from 'expo-location'
import { regionMap } from './variablesPolandRegion'
import Constants from 'expo-constants'

/**
 * Pobierz uprawnienia i aktualną lokalizację urządzenia
 * @returns {Object|null} - { latitude, longitude } lub null jeśli brak uprawnień
 */
export const getCurrentPosition = async () => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync()

    if (status !== 'granted') {
      console.log('Permission to access location was denied')
      return null
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    })

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    }
  } catch (error) {
    console.error('Error getting current position:', error)
    return null
  }
}

/**
 * Reverse geocoding - zamień współrzędne na adres
 * @param {number} latitude
 * @param {number} longitude
 * @returns {Object|null} - { latitude, longitude, City, Country, region }
 */
export const getLocationFromCoords = async (latitude, longitude) => {
  try {
    const [address] = await Location.reverseGeocodeAsync({
      latitude,
      longitude,
    })

    if (!address) {
      return {
        latitude,
        longitude,
        City: null,
        Country: null,
        region: null,
      }
    }

    // Mapuj region na polską nazwę
    const regionEn = address.region || null
    const region = regionMap[regionEn] || regionEn

    return {
      latitude,
      longitude,
      City: address.city || address.subregion || null,
      Country: address.country || null,
      region: region,
      street: address.street || null,
      streetNumber: address.streetNumber || null,
      postalCode: address.postalCode || null,
    }
  } catch (error) {
    console.error('Error reverse geocoding:', error)
    return null
  }
}

/**
 * Pobierz pełną lokalizację użytkownika (pozycja + adres)
 * @returns {Object|null} - Pełny obiekt lokalizacji
 */
export const getUserLocation = async () => {
  try {
    const position = await getCurrentPosition()

    if (!position) {
      return null
    }

    const locationData = await getLocationFromCoords(
      position.latitude,
      position.longitude
    )

    return locationData
  } catch (error) {
    console.error('Error getting user location:', error)
    return null
  }
}

/**
 * Sprawdź czy usługi lokalizacji są włączone
 * @returns {boolean}
 */
export const isLocationServicesEnabled = async () => {
  try {
    const enabled = await Location.hasServicesEnabledAsync()
    return enabled
  } catch (error) {
    console.error('Error checking location services:', error)
    return false
  }
}

/**
 * Formatuj adres do wyświetlenia
 * @param {Object} location - Obiekt lokalizacji
 * @returns {string} - Sformatowany adres
 */
export const formatAddress = (location) => {
  if (!location) return ''

  const parts = []

  if (location.street) {
    let streetPart = location.street
    if (location.streetNumber) {
      streetPart += ` ${location.streetNumber}`
    }
    parts.push(streetPart)
  }

  if (location.City) {
    parts.push(location.City)
  }

  if (location.region) {
    parts.push(location.region)
  }

  return parts.join(', ')
}

export default {
  getCurrentPosition,
  getLocationFromCoords,
  getUserLocation,
  isLocationServicesEnabled,
  formatAddress,
}
