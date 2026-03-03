import {
  StyleSheet,
  Text,
  View,
  Image,
  TextInput,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native'
import { COLORS } from '../constants/colors'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'expo-router'
import { useAuth } from '../context/AuthContext'
import Button1 from '../components/Button1'
import spinner from '../assets/utils/spinner.json'
import LottieView from 'lottie-react-native'

import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth'
import { auth } from '../assets/utils/firebase'
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin'
import Constants from 'expo-constants'

const Login = () => {
  const router = useRouter()
  const { login, loginWithGoogle } = useAuth()

  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: Constants.expoConfig?.extra?.googleWebClientId,
      iosClientId: Constants.expoConfig?.extra?.googleIosClientId,
    })
  }, [])

  // Funkcja logowania przez Google
  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    try {
      await GoogleSignin.hasPlayServices()
      const userInfo = await GoogleSignin.signIn()
      const idToken = userInfo.data?.idToken

      if (!idToken) {
        Alert.alert('Błąd', 'Nie udało się uzyskać tokena Google')
        return
      }

      console.log('[Google Sign-in] Creating Firebase credential...')
      const credential = GoogleAuthProvider.credential(idToken)
      const userCredential = await signInWithCredential(auth, credential)
      const user = userCredential.user
      console.log('[Google Sign-in] Firebase auth successful, email:', user.email)

      const firebaseToken = await user.getIdToken()
      console.log('[Google Sign-in] Got Firebase token, sending to backend...')

      const result = await loginWithGoogle(user.email, firebaseToken)
      console.log('[Google Sign-in] Backend response:', result)

      if (result.success) {
        console.log('[Google Sign-in] Login successful, redirecting...')
        router.replace('/(main)/(tabs)/dashboard-home')
      } else {
        if (
          result.error?.includes('nie istnieje') ||
          result.error?.includes('complete')
        ) {
          console.log('[Google Sign-in] User needs to complete registration')
          router.push({
            pathname: '/register-with-oauth',
            params: {
              email: user.email,
              name: user.displayName?.split(' ')[0] || '',
              surname: user.displayName?.split(' ').slice(1).join(' ') || '',
              googleIdToken: firebaseToken,
              avatarUrl: user.photoURL || '',
            },
          })
        } else {
          console.error('[Google Sign-in] Backend error:', result.error)
          Alert.alert('Błąd logowania', result.error)
        }
      }
    } catch (error) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('[Google Sign-in] User cancelled')
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log('[Google Sign-in] Sign in already in progress')
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert('Błąd', 'Google Play Services niedostępne')
      } else {
        console.error('[Google Sign-in] Exception:', error)
        Alert.alert('Błąd', 'Wystąpił błąd podczas logowania przez Google')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Obsługa zmiany wartości w formularzu
  const handleChange = (name, value) => {
    setFormData({ ...formData, [name]: value })
  }

  // Obsługa logowania email/hasło
  const handleSubmit = async () => {
    if (!formData.email || !formData.password) {
      Alert.alert('Błąd', 'Wypełnij wszystkie pola')
      return
    }

    setIsLoading(true)
    try {
      const result = await login(formData.email, formData.password)

      if (result.status) {
        setFormData({ email: '', password: '' })
      } else {
        if (result.isEmailNotVerified) {
          Alert.alert(
            'Weryfikacja email',
            'Musisz najpierw zweryfikować swój adres email. Sprawdź swoją skrzynkę pocztową.'
          )
        } else {
          Alert.alert('Błąd logowania', result.error)
        }
      }
    } catch (error) {
      console.error('Login failed:', error)
      Alert.alert('Błąd', 'Wystąpił błąd podczas logowania')
    } finally {
      setIsLoading(false)
    }
  }

  // Przejście do zapomniałem hasła
  const handleForgotPassword = () => {
    router.push('/forget-password')
  }

  // Przejście do rejestracji
  const handleGoToRegister = () => {
    router.push('/register')
  }

  return (
    <ScrollView contentContainerStyle={styles.auth}>
      <View style={styles.authMask} />
      <View style={styles.authFormContainer}>
        <Text style={styles.authFormTitle}>Login</Text>

        <View style={styles.authForm}>
          {/* Email Input */}
          <View style={styles.authFormGroup}>
            <Text style={styles.label}>Email lub Nick</Text>
            <TextInput
              style={styles.input}
              placeholder='Wprowadź email lub nick'
              placeholderTextColor='#999'
              value={formData.email}
              onChangeText={(value) => handleChange('email', value)}
              autoCapitalize='none'
              keyboardType='email-address'
              editable={!isLoading}
            />
          </View>

          {/* Password Input */}
          <View style={styles.authFormGroup}>
            <Text style={styles.label}>Hasło</Text>
            <TextInput
              style={styles.input}
              placeholder='Wprowadź hasło'
              placeholderTextColor='#999'
              secureTextEntry={!showPassword}
              value={formData.password}
              onChangeText={(value) => handleChange('password', value)}
              editable={!isLoading}
            />
            <View style={styles.authFormGroupButtons}>
              <Pressable
                style={styles.authFormShow}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text style={styles.showButtonText}>
                  {showPassword ? 'Ukryj' : 'Pokaż'}
                </Text>
              </Pressable>
              <Pressable
                style={styles.authFormShow}
                onPress={handleForgotPassword}
              >
                <Text style={styles.showButtonText}>Zapomniałeś hasła?</Text>
              </Pressable>
            </View>
          </View>

          {/* Submit Button */}
          {/* isLoading */}
          {isLoading ? (
            <LottieView source={spinner} autoPlay loop style={styles.loader} />
          ) : (
            <Button1
              text='Zaloguj się'
              width={'100%'}
              height={50}
              fontSize={20}
              lineColor='#fff'
              backgroundColor={COLORS.secondary}
              color={COLORS.background}
              onPress={handleSubmit}
            />
          )}
        </View>

        {/* Alternate Options */}
        <View style={styles.authFormAlternate}>
          <Text style={styles.authFormAlternateText}>
            Nie masz konta?{'    '}
            <Text style={styles.link} onPress={handleGoToRegister}>
              Zarejestruj się
            </Text>
          </Text>
          {/* TODO: Google Auth - do implementacji później */}
          <Pressable
            style={styles.authFormAlternateIcon}
            onPress={handleGoogleSignIn}
            disabled={isLoading}
          >
            <Image
              source={require('../assets/images/google-icon.png')}
              style={styles.googleIconImage}
            />
          </Pressable>
          <Text style={styles.googleText}>Zaloguj się za pomocą Google</Text>
        </View>
      </View>
    </ScrollView>
  )
}

export default Login

const styles = StyleSheet.create({
  auth: {
    flexGrow: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  authMask: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
    opacity: 0.6,
  },
  authFormContainer: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 30,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  authFormTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 30,
  },
  authForm: {
    width: '100%',
  },
  authFormGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: COLORS.background,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  authFormGroupButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  authFormShow: {
    padding: 5,
  },
  showButtonText: {
    color: COLORS.secondary,
    fontSize: 14,
    fontWeight: '600',
  },
  authFormAlternate: {
    marginTop: 30,
    alignItems: 'center',
  },
  authFormAlternateText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  link: {
    color: COLORS.secondary,
    fontWeight: 'bold',
  },
  authFormAlternateIcon: {
    width: 50,
    height: 50,
    borderRadius: '100%',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  googleIconImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  googleText: {
    fontSize: 14,
    color: COLORS.primary,
  },
  loader: {
    width: 50,
    height: 50,
    alignSelf: 'center',
  },
})
