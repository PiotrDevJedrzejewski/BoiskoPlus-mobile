import axios from 'axios'
import * as SecureStore from 'expo-secure-store'
import Constants from 'expo-constants'

// Pobierz URL serwera z konfiguracji Expo
const getBaseURL = () => {
  const serverUrl =
    Constants.expoConfig?.extra?.serverUrl ||
    process.env.EXPO_PUBLIC_SERVER_URL ||
    'http://localhost:3000/api/v1'

  return serverUrl
}

const baseURL = getBaseURL()

const customFetch = axios.create({
  baseURL,
  timeout: 60000, // 60 sekund dla rejestracji (email może trwać dłużej)
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor dla requestów - dodaj token autoryzacji
customFetch.interceptors.request.use(
  async (config) => {
    try {
      // Pobierz token z SecureStore
      const token = await SecureStore.getItemAsync('authToken')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    } catch (error) {
      console.error('Błąd pobierania tokena:', error)
    }

    // Debug w trybie development
    if (__DEV__) {
      console.log('Request:', config.method?.toUpperCase(), config.url)
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor dla odpowiedzi - obsługa błędów
customFetch.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    // Obsługa błędu 401 - użytkownik niezalogowany
    if (error.response?.status === 401) {
      // Usuń token z SecureStore
      try {
        await SecureStore.deleteItemAsync('authToken')
      } catch (e) {
        console.error('Błąd usuwania tokena:', e)
      }
    }

    // Obsługa timeout
    if (error.code === 'ECONNABORTED') {
      console.error('Request timeout')
    }

    // Obsługa braku połączenia
    if (!error.response) {
      console.error('Network error - brak połączenia z serwerem')
    }

    return Promise.reject(error)
  }
)

// Helper do zapisywania tokena
export const setAuthToken = async (token) => {
  try {
    await SecureStore.setItemAsync('authToken', token)
  } catch (error) {
    console.error('Błąd zapisywania tokena:', error)
  }
}

// Helper do usuwania tokena
export const removeAuthToken = async () => {
  try {
    await SecureStore.deleteItemAsync('authToken')
  } catch (error) {
    console.error('Błąd usuwania tokena:', error)
  }
}

// Helper do sprawdzania czy token istnieje
export const hasAuthToken = async () => {
  try {
    const token = await SecureStore.getItemAsync('authToken')
    return !!token
  } catch (error) {
    console.error('Błąd sprawdzania tokena:', error)
    return false
  }
}

export default customFetch
