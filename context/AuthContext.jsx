import { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react'
import * as SecureStore from 'expo-secure-store'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { GoogleSignin } from '@react-native-google-signin/google-signin'
import Constants from 'expo-constants'
import customFetch, {
  setAuthToken,
  removeAuthToken,
  hasAuthToken,
  setOnUnauthorized,
} from '../assets/utils/customFetch'
import { router } from 'expo-router'
import { storage } from '../assets/utils/firebase'
import { deleteObject } from 'firebase/storage'
import { getStorageRefFromUrlOrPath } from '../assets/utils/firebaseStorage'
import { dbg, useDebugMount, useProviderRenderCount } from '../assets/utils/debugLogger'

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
  dbg('AuthProvider')
  useDebugMount('AuthProvider')
  useProviderRenderCount('AuthProvider')

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

  // Konfiguracja Google Sign-In raz przy starcie aplikacji
  useEffect(() => {
    GoogleSignin.configure({
      webClientId: Constants.expoConfig?.extra?.googleWebClientId,
      iosClientId: Constants.expoConfig?.extra?.googleIosClientId,
    })
  }, [])

  const clearLocalStorageAndState = useCallback(async () => {
    // Usuń lokalną sesję i dane cache aplikacji po wylogowaniu/usunięciu konta.
    await removeAuthToken()
    await SecureStore.deleteItemAsync(CONSENTS_KEY)
    await AsyncStorage.clear()

    setUser(null)
    setUserStats(null)
    setIsAuthChecked(false)
    setConsents({ ...defaultConsents })
    setPendingConsents({
      rulesAccepted: false,
      marketingAccepted: false,
      locationAccepted: false,
    })
    setSystemPermissionsGeo({ status: 'undetermined' })
  }, [])

  // Register 401 interceptor → auto-logout
  useEffect(() => {
    setOnUnauthorized(() => {
      console.warn('[Auth] 401 received — auto-logout')
      clearLocalStorageAndState()
      router.replace('/')
    })
    return () => setOnUnauthorized(null)
  }, [clearLocalStorageAndState])

  const authorized = useCallback(async () => {
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
        router.replace('/(auth)/(map-screens)/dashboard-home')
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
  }, [])

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
  const login = useCallback(async (email, password) => {
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
  }, [authorized])

  // Funkcja do logowania przez Google OAuth
  const loginWithGoogle = useCallback(async (email, googleIdToken) => {
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
  }, [authorized])

  // Funkcja do dokończenia rejestracji OAuth (Google)
  const completeOAuth = useCallback(async ({
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
  }, [authorized])

  // Funkcja do logowania przez Apple Sign-In
  const loginWithApple = useCallback(async (identityToken, appleUserId) => {
    if (__DEV__) console.log('[Apple Sign-In] loginWithApple called, appleUserId:', appleUserId)
    try {
      const response = await customFetch.post('/auth-mobile/login-apple', {
        identityToken,
        appleUserId,
      })
      if (__DEV__) console.log('[Apple Sign-In] loginWithApple success')
      if (response.data.token) {
        await setAuthToken(response.data.token)
        await authorized()
      }
      return { success: true }
    } catch (error) {
      if (__DEV__) console.log('[Apple Sign-In] loginWithApple error:', error.response?.data?.msg)
      const msg = error.response?.data?.msg || 'Błąd logowania przez Apple'
      const userNotFound =
        error.response?.status === 409 &&
        error.response?.data?.code === 'APPLE_SIGNUP_REQUIRED'
      return { success: false, error: msg, userNotFound }
    }
  }, [authorized])

  // Funkcja do dokończenia rejestracji przez Apple Sign-In
  const completeAppleOAuth = useCallback(async ({
    identityToken,
    appleUserId,
    nick,
    birthDate,
    email,
    name,
    surname,
    avatarUrl,
  }) => {
    if (__DEV__) console.log('[Apple Sign-In] completeAppleOAuth called, nick:', nick)
    try {
      const response = await customFetch.post('/auth-mobile/register-apple', {
        identityToken,
        appleUserId,
        nick,
        birthDate,
        email,
        name,
        surname,
        avatarUrl: avatarUrl || '',
      })
      if (__DEV__) console.log('[Apple Sign-In] completeAppleOAuth success')
      if (response.data.token) {
        await setAuthToken(response.data.token)
        await authorized()
      }
      return { success: true }
    } catch (error) {
      if (__DEV__) console.log('[Apple Sign-In] completeAppleOAuth error:', error.response?.data?.msg)
      return {
        success: false,
        error: error.response?.data?.msg || 'Błąd podczas rejestracji przez Apple',
      }
    }
  }, [authorized])

  // Funkcja do rejestracji (nie loguje automatycznie - wymaga weryfikacji email)
  const register = useCallback(async (userData) => {
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
  }, [])

  // Funkcja do wysłania emaila z linkiem do resetowania hasła
  const forgotPassword = useCallback(async (email) => {
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
  }, [])

  // Funkcja do resetowania hasła (z tokenem z emaila)
  const resetPassword = useCallback(async (token, password) => {
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
  }, [])

  // Funkcja do zmiany hasła dla zalogowanego użytkownika
  const changePassword = useCallback(async ({ oldPassword, newPassword }) => {
    if (!user?.email) {
      return {
        success: false,
        error: 'Brak danych użytkownika. Zaloguj się ponownie.',
      }
    }

    if (!oldPassword || !newPassword) {
      return {
        success: false,
        error: 'Uzupełnij wszystkie wymagane pola hasła',
      }
    }

    if (newPassword.length < 6 || newPassword.length > 20) {
      return {
        success: false,
        error: 'Nowe hasło musi mieć od 6 do 20 znaków',
      }
    }

    try {
      const response = await customFetch.patch('/auth-mobile/change-password', {
        email: user.email,
        oldPassword,
        newPassword,
      })

      // Token po zmianie hasła może zostać zrotowany przez backend.
      if (response.data?.token) {
        await setAuthToken(response.data.token)
      }

      return {
        success: true,
        message: response.data?.msg || 'Hasło zostało zmienione',
      }
    } catch (error) {
      console.error('Błąd zmiany hasła:', error)
      return {
        success: false,
        error: error.response?.data?.msg || 'Wystąpił błąd podczas zmiany hasła',
      }
    }
  }, [user?.email])

  // Funkcja do odświeżenia danych użytkownika
  const refetchUser = useCallback(async () => {
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
  }, [])

  const updateProfile = useCallback(async (updates) => {
    try {
      const response = await customFetch.patch(
        '/users/current-user/update-user',
        updates
      )

      const requestedAvatarUrl = updates?.avatarUrl
      if (requestedAvatarUrl) {
        const verifyRes = await customFetch.get('/users/current-user')
        const verifiedUser = verifyRes?.data?.user
        const persistedAvatarUrl = verifiedUser?.avatarUrl

        if (persistedAvatarUrl !== requestedAvatarUrl) {
          console.error('Avatar URL mismatch after update', {
            requestedAvatarUrl,
            persistedAvatarUrl,
          })

          return {
            success: false,
            error: 'Backend nie zapisał avatarUrl w bazie danych',
          }
        }

        const normalizedVerifiedUser = {
          ...verifiedUser,
          userID: verifiedUser?.userID || verifiedUser?._id,
        }
        setUser(normalizedVerifiedUser)
      } else if (response?.data?.user) {
        const updatedUser = {
          ...response.data.user,
          userID: response.data.user.userID || response.data.user._id,
        }
        setUser(updatedUser)
      }

      return {
        success: true,
        user: response?.data?.user || null,
        message: response?.data?.msg || 'Profil został zaktualizowany',
      }
    } catch (error) {
      console.error('Błąd podczas aktualizacji profilu:', error)
      return {
        success: false,
        error:
          error.response?.data?.msg ||
          'Wystąpił błąd podczas aktualizacji profilu',
      }
    }
  }, [])

  // Funkcja wylogowania
  const logout = useCallback(async () => {
    try {
      await customFetch.get('/auth-mobile/logout')
    } catch (error) {
      console.error('Błąd podczas wylogowania na serwerze:', error)
    } finally {
      // Wyloguj z Google jeśli sesja jest aktywna
      try {
        const isSignedIn = await GoogleSignin.getCurrentUser()
        if (isSignedIn) {
          await GoogleSignin.signOut()
          console.log('Wylogowano z Google')
        }
      } catch (googleError) {
        console.error('Błąd podczas wylogowania z Google:', googleError)
      }

      // Zawsze wyczyść lokalny stan
      await clearLocalStorageAndState()
      router.replace('/')
    }
  }, [clearLocalStorageAndState])

  const deleteAccount = useCallback(async () => {
    try {
      const response = await customFetch.delete('/users/current-user/delete')

      if (
        response?.data?.avatarUrlToDelete &&
        user?.avatarUrl === response.data.avatarUrlToDelete &&
        storage
      ) {
        try {
          const avatarRef = getStorageRefFromUrlOrPath(
            storage,
            response.data.avatarUrlToDelete
          )
          if (avatarRef) {
            await deleteObject(avatarRef)
          }
        } catch (firebaseError) {
          // Konto jest już usunięte w backendzie, więc nie blokujemy flow przez błąd storage.
          console.error('Błąd usuwania avatara z Firebase Storage:', firebaseError)
        }
      }

      if (response.status === 200) {
        // Konto zostało usunięte po stronie backendu, czyścimy lokalne dane i sesję Google.
        try {
          const isSignedIn = await GoogleSignin.getCurrentUser()
          if (isSignedIn) {
            await GoogleSignin.signOut()
          }
        } catch (googleError) {
          console.error('Błąd podczas wylogowania z Google:', googleError)
        }

        await clearLocalStorageAndState()
        router.replace('/')

        return {
          success: true,
          message:
            response.data?.msg || 'Konto użytkownika zostało usunięte',
        }
      }

      return {
        success: false,
        error: 'Nie udało się usunąć konta użytkownika',
      }
    } catch (error) {
      console.error('Błąd podczas usuwania konta:', error)
      return {
        success: false,
        error: error.response?.data?.msg || 'Wystąpił błąd podczas usuwania konta',
      }
    }
  }, [clearLocalStorageAndState, user?.avatarUrl])

  const updateConsents = useCallback(async (updates) => {
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
  }, [consents])

  const setRulesAccepted = useCallback((value) => {
    setPendingConsents((prev) => ({
      ...prev,
      rulesAccepted: value,
    }))
  }, [])

  const setMarketingAccepted = useCallback((value) => {
    setPendingConsents((prev) => ({
      ...prev,
      marketingAccepted: value,
    }))
  }, [])

  const setLocationAccepted = useCallback((value) => {
    setPendingConsents((prev) => ({
      ...prev,
      locationAccepted: value,
    }))
  }, [])

  const needsConsent =
    !consentsLoading && (!consents || !consents.rulesAccepted)

  const saveConsents = useCallback(async () => {
    if (!pendingConsents.rulesAccepted) {
      return { success: false, error: 'Akceptacja regulaminu jest wymagana.' }
    }
    return await updateConsents({ ...pendingConsents })
  }, [pendingConsents, updateConsents])

  const acceptAllConsents = useCallback(async () => {
    const nextConsents = {
      rulesAccepted: true,
      marketingAccepted: true,
      locationAccepted: true,
    }
    setPendingConsents(nextConsents)
    return await updateConsents(nextConsents)
  }, [updateConsents])

  // Funkcja do pobrania lokalizacji z throttlingiem
  // Pobiera z AsyncStorage, a jeśli brak - używa expo-location + reverse geocoding
  const getThrottledLocation = useCallback(async () => {
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
  }, [pendingConsents.locationAccepted, consents?.locationAccepted])

  // Funkcja do zapisania lokalizacji w AsyncStorage
  const saveLocation = useCallback(async (location) => {
    try {
      await AsyncStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(location))
      return { success: true }
    } catch (error) {
      console.error('Błąd zapisywania lokalizacji:', error)
      return { success: false, error: error.message }
    }
  }, [])

  // Funkcja do pobrania zapisanej lokalizacji (bez throttlingu)
  const getSavedLocation = useCallback(async () => {
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
  }, [])

  // Funkcja do usunięcia zapisanej lokalizacji
  const clearSavedLocation = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(LOCATION_STORAGE_KEY)
      await AsyncStorage.removeItem(LOCATION_THROTTLE_KEY)
      return { success: true }
    } catch (error) {
      console.error('Błąd usuwania lokalizacji:', error)
      return { success: false, error: error.message }
    }
  }, [])

  // Funkcja do reverse geocoding (współrzędne -> miasto/region)
  const reverseGeocode = useCallback(async (latitude, longitude) => {
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
  }, [])

  const authContextValue = useMemo(() => ({
    user,
    setUser,
    loading,
    userStats,
    setUserStats,
    login,
    loginWithGoogle,
    completeOAuth,
    loginWithApple,
    completeAppleOAuth,
    register,
    forgotPassword,
    resetPassword,
    changePassword,
    updateProfile,
    refetchUser,
    logout,
    deleteAccount,
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
    setSystemPermissionsGeo,
  }), [
    user, loading, userStats, login, loginWithGoogle, completeOAuth, loginWithApple, completeAppleOAuth, register,
    forgotPassword, resetPassword, changePassword, updateProfile, refetchUser,
    logout, deleteAccount, isAuthChecked, consents, consentsLoading, updateConsents,
    pendingConsents, setRulesAccepted, setMarketingAccepted, setLocationAccepted,
    needsConsent, saveConsents, acceptAllConsents, getThrottledLocation,
    saveLocation, getSavedLocation, clearSavedLocation, reverseGeocode,
    systemPermissionsGeo,
  ])

  return (
    <AuthContext.Provider value={authContextValue}>
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
