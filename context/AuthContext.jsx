import { createContext, useContext, useEffect, useState } from 'react'
import * as SecureStore from 'expo-secure-store'
import customFetch, {
  setAuthToken,
  removeAuthToken,
  hasAuthToken,
} from '../assets/utils/customFetch'
import { router } from 'expo-router'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  // Początkowo null - inne konteksty sprawdzają user?.userID
  const [user, setUser] = useState(null)
  const [userStats, setUserStats] = useState(null) // Statystyki użytkownika
  const [loading, setLoading] = useState(true) // Czy w trakcie sprawdzania

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
        router.replace('/login')
        setLoading(false)
        return
      }
    } catch (error) {
      console.error('Błąd autoryzacji:', error)
      setUser(null)
      setUserStats(null)
      router.replace('/login')
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
        'zweryfikować swój adres email'
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
        }
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
      router.replace('/login')
    }
  }

  // Funkcja do usunięcia lokalizacji
  const clearUserLocation = async () => {
    try {
      await customFetch.delete('/location/clear')
      return { success: true }
    } catch (error) {
      console.error('Błąd podczas usuwania lokalizacji:', error)
      return { success: false, error: error.message }
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
        clearUserLocation,
        isAuthChecked,
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
