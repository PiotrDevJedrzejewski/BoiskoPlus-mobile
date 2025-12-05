/**
 * Bezpieczne operacje na storage dla React Native
 * Używa expo-secure-store dla wrażliwych danych
 * i @react-native-async-storage/async-storage dla pozostałych
 */
import * as SecureStore from 'expo-secure-store'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Klucze przechowywane w SecureStore (wrażliwe dane)
const SECURE_KEYS = ['authToken', 'refreshToken', 'userCredentials']

// Klucze przechowywane w AsyncStorage (zwykłe preferencje)
const ALLOWED_ASYNC_KEYS = [
  'mapTheme',
  'notificationPreferences',
  'userPreferences',
  'onboardingCompleted',
  'lastSyncDate',
]

/**
 * Sprawdź czy klucz jest dozwolony
 */
const isKeyAllowed = (key) => {
  return SECURE_KEYS.includes(key) || ALLOWED_ASYNC_KEYS.includes(key)
}

/**
 * Sprawdź czy klucz wymaga SecureStore
 */
const isSecureKey = (key) => {
  return SECURE_KEYS.includes(key)
}

/**
 * Bezpieczny zapis do storage
 * @param {string} key - Klucz
 * @param {any} value - Wartość (zostanie skonwertowana do JSON)
 * @returns {Promise<boolean>} - Sukces operacji
 */
export const safeSetItem = async (key, value) => {
  try {
    if (!isKeyAllowed(key)) {
      console.warn(`Unauthorized storage key: ${key}`)
      return false
    }

    const stringValue =
      typeof value === 'string' ? value : JSON.stringify(value)

    if (isSecureKey(key)) {
      await SecureStore.setItemAsync(key, stringValue)
    } else {
      await AsyncStorage.setItem(key, stringValue)
    }

    return true
  } catch (error) {
    console.error(`Error setting storage item [${key}]:`, error)
    return false
  }
}

/**
 * Bezpieczny odczyt z storage
 * @param {string} key - Klucz
 * @param {any} defaultValue - Wartość domyślna
 * @returns {Promise<any>} - Wartość lub defaultValue
 */
export const safeGetItem = async (key, defaultValue = null) => {
  try {
    if (!isKeyAllowed(key)) {
      console.warn(`Unauthorized storage key: ${key}`)
      return defaultValue
    }

    let item

    if (isSecureKey(key)) {
      item = await SecureStore.getItemAsync(key)
    } else {
      item = await AsyncStorage.getItem(key)
    }

    if (item === null) {
      return defaultValue
    }

    // Próba parsowania JSON
    try {
      return JSON.parse(item)
    } catch {
      return item
    }
  } catch (error) {
    console.error(`Error getting storage item [${key}]:`, error)
    return defaultValue
  }
}

/**
 * Bezpieczne usunięcie z storage
 * @param {string} key - Klucz
 * @returns {Promise<boolean>} - Sukces operacji
 */
export const safeRemoveItem = async (key) => {
  try {
    if (!isKeyAllowed(key)) {
      console.warn(`Unauthorized storage key: ${key}`)
      return false
    }

    if (isSecureKey(key)) {
      await SecureStore.deleteItemAsync(key)
    } else {
      await AsyncStorage.removeItem(key)
    }

    return true
  } catch (error) {
    console.error(`Error removing storage item [${key}]:`, error)
    return false
  }
}

/**
 * Wyczyść wszystkie dozwolone klucze (nie SecureStore)
 * @returns {Promise<boolean>} - Sukces operacji
 */
export const safeClearAsync = async () => {
  try {
    await AsyncStorage.multiRemove(ALLOWED_ASYNC_KEYS)
    return true
  } catch (error) {
    console.error('Error clearing async storage:', error)
    return false
  }
}

/**
 * Wyczyść wrażliwe dane (SecureStore)
 * @returns {Promise<boolean>} - Sukces operacji
 */
export const safeClearSecure = async () => {
  try {
    await Promise.all(
      SECURE_KEYS.map((key) => SecureStore.deleteItemAsync(key))
    )
    return true
  } catch (error) {
    console.error('Error clearing secure storage:', error)
    return false
  }
}

/**
 * Wyczyść całe storage (logout)
 * @returns {Promise<boolean>} - Sukces operacji
 */
export const safeClearAll = async () => {
  try {
    await Promise.all([safeClearAsync(), safeClearSecure()])
    return true
  } catch (error) {
    console.error('Error clearing all storage:', error)
    return false
  }
}

export default {
  safeSetItem,
  safeGetItem,
  safeRemoveItem,
  safeClearAsync,
  safeClearSecure,
  safeClearAll,
}
