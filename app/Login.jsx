import {
  StyleSheet,
  Text,
  View,
  Image,
  TextInput,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { COLORS } from '../constants/colors'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'expo-router'
import { useAuth } from '../context/AuthContext'
import Button1 from '../components/Button1'
// import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth'
// import { auth } from '../assets/utils/firebase'
// import * as Google from 'expo-auth-session/providers/google'
// import * as WebBrowser from 'expo-web-browser'
// import Constants from 'expo-constants'

// // Wymagane dla Google Auth
// WebBrowser.maybeCompleteAuthSession()

const Login = () => {
  const router = useRouter()
  const { login, loginWithGoogle } = useAuth()

  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  // TODO: Google Auth - do implementacji później
  // const [request, response, promptAsync] = Google.useAuthRequest({
  //   expoClientId: Constants.expoConfig?.extra?.googleExpoClientId,
  //   iosClientId: Constants.expoConfig?.extra?.googleIosClientId,
  //   androidClientId: Constants.expoConfig?.extra?.googleAndroidClientId,
  //   webClientId: Constants.expoConfig?.extra?.googleWebClientId,
  // })

  // useEffect(() => {
  //   if (response?.type === 'success') {
  //     handleGoogleSignIn(response.authentication)
  //   }
  // }, [response])

  // // Funkcja logowania przez Google
  // const handleGoogleSignIn = async (authentication) => {
  //   if (!authentication?.idToken) {
  //     Alert.alert('Błąd', 'Nie udało się uzyskać tokena Google')
  //     return
  //   }

  //   setIsLoading(true)
  //   try {
  //     // Utwórz credential i zaloguj do Firebase
  //     const credential = GoogleAuthProvider.credential(
  //       authentication.idToken,
  //       authentication.accessToken
  //     )
  //     const userCredential = await signInWithCredential(auth, credential)
  //     const user = userCredential.user
  //     const idToken = await user.getIdToken()

  //     // Wyślij token do backendu
  //     const result = await loginWithGoogle(user.email, idToken)

  //     if (result.success) {
  //       router.replace('/(main)/(tabs)/dashboard-home')
  //     } else {
  //       // Jeśli użytkownik nie istnieje, przekieruj do dokończenia rejestracji
  //       if (
  //         result.error?.includes('nie istnieje') ||
  //         result.error?.includes('complete')
  //       ) {
  //         router.push({
  //           pathname: '/register-with-oauth',
  //           params: {
  //             email: user.email,
  //             name: user.displayName?.split(' ')[0] || '',
  //             surname: user.displayName?.split(' ').slice(1).join(' ') || '',
  //             googleIdToken: idToken,
  //             avatarUrl: user.photoURL || '',
  //           },
  //         })
  //       } else {
  //         Alert.alert('Błąd logowania', result.error)
  //       }
  //     }
  //   } catch (error) {
  //     console.error('Google Sign-in error:', error)
  //     Alert.alert('Błąd', 'Wystąpił błąd podczas logowania przez Google')
  //   } finally {
  //     setIsLoading(false)
  //   }
  // }

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
          {isLoading ? (
            <ActivityIndicator
              size='large'
              color={COLORS.secondary}
              style={styles.loader}
            />
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
            Nie masz konta?{' '}
            <Text style={styles.link} onPress={handleGoToRegister}>
              Zarejestruj się
            </Text>
          </Text>
          {/* TODO: Google Auth - do implementacji później */}
          {/* <Pressable
            style={styles.authFormAlternateIcon}
            onPress={() => promptAsync()}
            disabled={!request || isLoading}
          >
            <Image
              source={require('../assets/images/google-icon.png')}
              style={styles.googleIconImage}
            />
          </Pressable>
          <Text style={styles.googleText}>Zaloguj się za pomocą Google</Text> */}
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
    marginVertical: 10,
  },
})
