import { createContext, useContext, useEffect, useState } from 'react'
import * as SecureStore from 'expo-secure-store'
import AsyncStorage from '@react-native-async-storage/async-storage'
import customFetch, {
  setAuthToken,
  removeAuthToken,
  hasAuthToken,
} from '../assets/utils/customFetch'
import { router } from 'expo-router'

const AuthContext = createContext()

const CONSENTS_KEY = 'bp_consents_v1'
const LOCATION_THROTTLE_KEY = 'last_location_request_time'
const LOCATION_STORAGE_KEY = 'bp_user_location_v1'
const THROTTLE_DURATION = 5 * 60 * 1000 // 5 minut w milisekundach

const defaultConsents = {
  rulesAccepted: false,
  marketingAccepted: false,
  locationAccepted: false,
  updatedAt: null,
}

export const AuthProvider = ({ children }) => {
  // Początkowo null - inne konteksty sprawdzają user?.userID
  const [user, setUser] = useState(null)
  const [userStats, setUserStats] = useState(null) // Statystyki użytkownika
  const [loading, setLoading] = useState(true) // Czy w trakcie sprawdzania

  const [consents, setConsents] = useState(null)
  const [consentsLoading, setConsentsLoading] = useState(true)
  const [pendingConsents, setPendingConsents] = useState({
    rulesAccepted: false,
    marketingAccepted: false,
    locationAccepted: false,
  })
 // undetermined | granted | denied
  const [systemPermissionsGeo, setSystemPermissionsGeo] = useState({status: 'undetermined'})




  //Nowy state dla asynchronizacji pomiędzy użytkownikiem a SecureStore
  const [isAuthChecked, setIsAuthChecked] = useState(false)

  const authorized = async () => {
    setLoading(true)
    try {
      const token = await hasAuthToken()
      if (token) {
        const userResponse = await customFetch.get('/users/current-user')
        const userStatsResponse = await customFetch.get('/user-stats/current')

        // Ustaw dane użytkownika z response (jak w webowej wersji)
        // POPRAWKA: Pobierz user z response.data.user (nie response.data)
        const userData = {
          ...userResponse.data.user, // Spread na .user
          _id: userResponse.data.user._id, // _id jest w .user
          userID: userResponse.data.user._id, // Dla kompatybilności
        }
        setUser(userData)
        setUserStats(userStatsResponse.data.stats)
        setIsAuthChecked(true)
        setLoading(false)
        router.replace('/(main)/(tabs)/dashboard-home')
        return
      } else {
        setUser(null)
        setUserStats(null)
        setLoading(false)
        return
      }
    } catch (error) {
      console.error('Błąd autoryzacji:', error)
      setUser(null)
      setUserStats(null)
      setLoading(false)
      return
    }
  }

  // Sprawdź czy użytkownik był zalogowany przy starcie aplikacji
  useEffect(() => {
    const userWasLoggedIn = async () => {
      return await authorized()
    }
    userWasLoggedIn()
  }, [])

  // Wczytaj zapisane zgody z urządzenia
  useEffect(() => {
    const loadConsents = async () => {
      setConsentsLoading(true)
      try {
        const stored = await SecureStore.getItemAsync(CONSENTS_KEY)
        if (stored) {
          const parsed = JSON.parse(stored)
          setConsents({ ...defaultConsents, ...parsed })
        } else {
          setConsents({ ...defaultConsents })
        }
      } catch (error) {
        console.error('Błąd wczytywania zgód:', error)
        setConsents({ ...defaultConsents })
      } finally {
        setConsentsLoading(false)
      }
    }
    loadConsents()
  }, [])

  useEffect(() => {
    if (!consentsLoading && consents) {
      setPendingConsents({
        rulesAccepted: !!consents.rulesAccepted,
        marketingAccepted: !!consents.marketingAccepted,
        locationAccepted: !!consents.locationAccepted,
      })
    }
  }, [consentsLoading, consents])

  // Funkcja do logowania (email/nick + hasło)
  const login = async (email, password) => {
    try {
      const response = await customFetch.post('/auth-mobile/login', {
        email,
        password,
      })

      // Zapisz token jeśli backend go zwraca
      if (response.data.token) {
        await setAuthToken(response.data.token)
        await authorized()
      }

      return { status: true }
    } catch (error) {
      console.error('Błąd logowania:', error)

      // Sprawdź czy błąd dotyczy niezweryfikowanego emaila
      const errorMsg = error.response?.data?.msg || 'Błąd logowania'
      const isEmailNotVerified = errorMsg.includes(
        'zweryfikować swój adres email',
      )

      return {
        status: false,
        error: errorMsg,
        isEmailNotVerified,
      }
    }
  }

  // Funkcja do logowania przez Google OAuth
  const loginWithGoogle = async (email, googleIdToken) => {
    try {
      const response = await customFetch.post('/auth-mobile/login-oauth', {
        email,
        googleIdToken,
      })

      // Zapisz token jeśli backend go zwraca
      if (response.data.token) {
        await setAuthToken(response.data.token)
        await authorized()
      }

      return { success: true }
    } catch (error) {
      console.error('Błąd logowania przez Google:', error)
      return {
        success: false,
        error: error.response?.data?.msg || 'Błąd logowania przez Google',
      }
    }
  }

  // Funkcja do dokończenia rejestracji OAuth (Google)
  const completeOAuth = async ({
    nick,
    birthDate,
    email,
    name,
    surname,
    googleIdToken,
    avatarUrl,
  }) => {
    try {
      const response = await customFetch.post('/auth-mobile/complete-oauth', {
        nick,
        birthDate,
        email,
        name,
        surname,
        googleIdToken,
        avatarUrl,
      })

      // Zapisz token jeśli backend go zwraca
      if (response.data.token) {
        await setAuthToken(response.data.token)
        await authorized()
      }

      return { success: true }
    } catch (error) {
      console.error('Błąd dokończenia rejestracji OAuth:', error)
      return {
        success: false,
        error: error.response?.data?.msg || 'Błąd podczas rejestracji',
      }
    }
  }

  // Funkcja do rejestracji (nie loguje automatycznie - wymaga weryfikacji email)
  const register = async (userData) => {
    // Walidacja hasła (6-20 znaków)
    if (userData.password.length < 6 || userData.password.length > 20) {
      return {
        success: false,
        error: 'Hasło musi mieć od 6 do 20 znaków',
      }
    }

    // Sprawdź czy hasła są identyczne
    if (userData.password !== userData.passwordConfirm) {
      return {
        success: false,
        error: 'Hasła nie są identyczne',
      }
    }

    try {
      await customFetch.post('/auth-mobile/register', userData)

      // Rejestracja zakończona - użytkownik musi zweryfikować email
      return { success: true }
    } catch (error) {
      console.error('Błąd rejestracji:', error)

      // Obsługa błędów walidacji z backendu
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors
        const firstError = Object.values(errors)[0]
        return {
          success: false,
          error: firstError?.msg || firstError || 'Błąd walidacji',
        }
      }

      return {
        success: false,
        error: error.response?.data?.msg || 'Błąd rejestracji',
      }
    }
  }

  // Funkcja do wysłania emaila z linkiem do resetowania hasła
  const forgotPassword = async (email) => {
    try {
      const response = await customFetch.post('/auth-mobile/forgot-password', {
        email,
      })
      return {
        success: true,
        message:
          response.data.msg || 'Link do resetowania hasła został wysłany',
      }
    } catch (error) {
      console.error('Błąd wysyłania emaila resetowania hasła:', error)
      return {
        success: false,
        error:
          error.response?.data?.msg || 'Wystąpił błąd podczas wysyłania emaila',
      }
    }
  }

  // Funkcja do resetowania hasła (z tokenem z emaila)
  const resetPassword = async (token, password) => {
    // Walidacja hasła
    if (password.length < 6 || password.length > 20) {
      return {
        success: false,
        error: 'Hasło musi mieć od 6 do 20 znaków',
      }
    }

    try {
      const response = await customFetch.post(
        `/auth-mobile/reset-password/${token}`,
        {
          password,
        },
      )
      return {
        success: true,
        message: response.data.msg || 'Hasło zostało pomyślnie zresetowane',
      }
    } catch (error) {
      console.error('Błąd resetowania hasła:', error)
      return {
        success: false,
        error:
          error.response?.data?.msg ||
          'Wystąpił błąd podczas resetowania hasła',
      }
    }
  }

  // Funkcja do odświeżenia danych użytkownika
  const refetchUser = async () => {
    try {
      const userRes = await customFetch.get('/users/current-user')
      setUser(userRes.data.user)

      try {
        const statsRes = await customFetch.get('/user-stats/current')
        setUserStats(statsRes.data.stats)
      } catch (statsErr) {
        console.error('Error fetching user stats:', statsErr)
      }

      return { success: true }
    } catch (error) {
      console.error('Błąd podczas pobierania danych użytkownika:', error)
      return { success: false, error: error.message }
    }
  }

  // Funkcja wylogowania
  const logout = async () => {
    try {
      await customFetch.get('/auth-mobile/logout')
    } catch (error) {
      console.error('Błąd podczas wylogowania na serwerze:', error)
    } finally {
      // Zawsze wyczyść lokalny stan
      await removeAuthToken()
      setUser(null)
      setUserStats(null)
      setIsAuthChecked(false)
      router.replace('/')
    }
  }

  const updateConsents = async (updates) => {
    const nextConsents = {
      ...(consents || defaultConsents),
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    setConsents(nextConsents)
    try {
      await SecureStore.setItemAsync(CONSENTS_KEY, JSON.stringify(nextConsents))
      return { success: true }
    } catch (error) {
      console.error('Błąd zapisu zgód:', error)
      return { success: false, error: error.message }
    }
  }

  const setRulesAccepted = (value) => {
    setPendingConsents((prev) => ({
      ...prev,
      rulesAccepted: value,
    }))
  }

  const setMarketingAccepted = (value) => {
    setPendingConsents((prev) => ({
      ...prev,
      marketingAccepted: value,
    }))
  }

  const setLocationAccepted = (value) => {
    setPendingConsents((prev) => ({
      ...prev,
      locationAccepted: value,
    }))
  }

  const needsConsent =
    !consentsLoading && (!consents || !consents.rulesAccepted)

  const saveConsents = async () => {
    if (!pendingConsents.rulesAccepted) {
      return { success: false, error: 'Akceptacja regulaminu jest wymagana.' }
    }
    return await updateConsents({ ...pendingConsents })
  }

  const acceptAllConsents = async () => {
    const nextConsents = {
      rulesAccepted: true,
      marketingAccepted: true,
      locationAccepted: true,
    }
    setPendingConsents(nextConsents)
    return await updateConsents(nextConsents)
  }

  // Funkcja do pobrania lokalizacji z throttlingiem
  // Pobiera z AsyncStorage, a jeśli brak - używa expo-location + reverse geocoding
  const getThrottledLocation = async () => {
    // Sprawdź zgodę na lokalizację
    if (!pendingConsents.locationAccepted && !consents?.locationAccepted) {
      return {
        success: false,
        error: 'Brak zgody na lokalizację',
      }
    }

    // Sprawdź throttling - ostatnie użycie (raz na 5 minut)
    try {
      const lastRequestTime = await AsyncStorage.getItem(LOCATION_THROTTLE_KEY)
      const now = Date.now()

      if (lastRequestTime) {
        const timeSinceLastRequest = now - parseInt(lastRequestTime, 10)

        if (timeSinceLastRequest < THROTTLE_DURATION) {
          const remainingMinutes = Math.ceil((THROTTLE_DURATION - timeSinceLastRequest) / 60000)
          return {
            success: false,
            throttled: true,
            remainingMinutes,
            error: `Możesz odświeżyć lokalizację za ${remainingMinutes} min.`,
          }
        }
      }

      // Pobierz lokalizację z AsyncStorage
      const storedLocation = await AsyncStorage.getItem(LOCATION_STORAGE_KEY)
      
      if (storedLocation) {
        const location = JSON.parse(storedLocation)
        
        // Zapisz czas ostatniego żądania
        await AsyncStorage.setItem(LOCATION_THROTTLE_KEY, now.toString())

        return {
          success: true,
          location,
        }
      } else {
        return {
          success: false,
          error: 'Brak zapisanej lokalizacji',
        }
      }
    } catch (error) {
      console.error('Błąd pobierania lokalizacji:', error)
      return {
        success: false,
        error: 'Wystąpił błąd podczas pobierania lokalizacji',
      }
    }
  }

  // Funkcja do zapisania lokalizacji w AsyncStorage
  const saveLocation = async (location) => {
    try {
      await AsyncStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(location))
      return { success: true }
    } catch (error) {
      console.error('Błąd zapisywania lokalizacji:', error)
      return { success: false, error: error.message }
    }
  }

  // Funkcja do pobrania zapisanej lokalizacji (bez throttlingu)
  const getSavedLocation = async () => {
    try {
      const storedLocation = await AsyncStorage.getItem(LOCATION_STORAGE_KEY)
      if (storedLocation) {
        return {
          success: true,
          location: JSON.parse(storedLocation),
        }
      }
      return {
        success: false,
        error: 'Brak zapisanej lokalizacji',
      }
    } catch (error) {
      console.error('Błąd pobierania lokalizacji:', error)
      return { success: false, error: error.message }
    }
  }

  // Funkcja do usunięcia zapisanej lokalizacji
  const clearSavedLocation = async () => {
    try {
      await AsyncStorage.removeItem(LOCATION_STORAGE_KEY)
      await AsyncStorage.removeItem(LOCATION_THROTTLE_KEY)
      return { success: true }
    } catch (error) {
      console.error('Błąd usuwania lokalizacji:', error)
      return { success: false, error: error.message }
    }
  }

  // Funkcja do reverse geocoding (współrzędne -> miasto/region)
  const reverseGeocode = async (latitude, longitude) => {
    try {
      const response = await customFetch.post('/location-mobile/reverse-geocode', {
        latitude,
        longitude,
      })
      return {
        success: true,
        location: response.data,
      }
    } catch (error) {
      console.error('Błąd reverse geocoding:', error)
      return {
        success: false,
        error: 'Nie udało się określić lokalizacji',
      }
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        userStats,
        setUserStats,
        login,
        loginWithGoogle,
        completeOAuth,
        register,
        forgotPassword,
        resetPassword,
        refetchUser,
        logout,
        isAuthChecked,
        consents,
        consentsLoading,
        updateConsents,
        pendingConsents,
        setRulesAccepted,
        setMarketingAccepted,
        setLocationAccepted,
        needsConsent,
        saveConsents,
        acceptAllConsents,
        getThrottledLocation,
        saveLocation,
        getSavedLocation,
        clearSavedLocation,
        reverseGeocode,
        systemPermissionsGeo, 
        setSystemPermissionsGeo
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// Hook ułatwiający korzystanie z contextu
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
