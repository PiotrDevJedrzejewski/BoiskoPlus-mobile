import { useState, useEffect } from 'react'
import {
  StyleSheet,
  Text,
  View,
  Image,
  TextInput,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useRouter } from 'expo-router'
import LottieView from 'lottie-react-native'
import Constants from 'expo-constants'
import { COLORS } from '../constants/colors'
import Button1 from '../components/Button1'
import customFetch from '../assets/utils/customFetch'
import spinner from '../assets/utils/spinner.json'
import { Toast } from 'toastify-react-native'
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth'
import { auth } from '../assets/utils/firebase'
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin'
import DatePicker from '../components/DatePicker'
import { useResponsiveScale } from '../assets/utils/scaleUI.UX'
import { dbg, useDebugMount } from '../assets/utils/debugLogger'

const parseIsoDate = (value) => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null
  }

  const [yearStr, monthStr, dayStr] = value.split('-')
  const year = Number(yearStr)
  const month = Number(monthStr)
  const day = Number(dayStr)

  if (!year || !month || !day) {
    return null
  }

  const parsed = new Date(year, month - 1, day)
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() + 1 !== month ||
    parsed.getDate() !== day
  ) {
    return null
  }

  return parsed
}

const Register = () => {
  dbg('RegisterScreen')
  useDebugMount('RegisterScreen')
  const router = useRouter()
  const ui = useResponsiveScale()
  const styles = createStyles(ui)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState([false, false])

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: Constants.expoConfig?.extra?.googleWebClientId,
      iosClientId: Constants.expoConfig?.extra?.googleIosClientId,
    })
  }, [])
  
  const [formData, setFormData] = useState({
    nickName: '',
    name: '',
    surname: '',
    email: '',
    password: '',
    passwordConfirm: '',
    phoneNumber: '',
  })

  // Google OAuth configuration

  // Handle Google Sign In response

  const handleGoogleAuthSuccess = async (idToken, user) => {
    setIsLoading(true)
    try {
      // Use the original Google ID token (not Firebase token)
      // Backend uses OAuth2Client.verifyIdToken() which expects a Google ID token
      try {
        console.log('[Google Auth] Checking if user exists in backend...')
        await customFetch.post('/auth-mobile/login-oauth', {
          email: user.email,
          googleIdToken: idToken,
        })

        console.log('[Google Auth] User exists, logging in...')
        Toast.success('Zalogowano pomyślnie przez Google!')
        router.replace('/(auth)/(map-screens)/dashboard-home')
      } catch (loginError) {
        if (loginError.response?.status === 401 || loginError.response?.status === 404) {
          console.log('[Google Auth] User not found, redirecting to complete registration')
          router.push({
            pathname: '/register-with-oauth',
            params: {
              email: user.email,
              name: user.displayName?.split(' ')[0] || '',
              surname: user.displayName?.split(' ').slice(1).join(' ') || '',
              googleIdToken: idToken,
              avatarUrl: user.photoURL || '',
            },
          })
        } else {
          throw loginError
        }
      }
    } catch (error) {
      console.error('[Google Auth] Exception:', error)
      console.error('[Google Auth] Error details:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
      })
      
      if (error.response?.data?.msg) {
        Toast.error(error.response.data.msg)
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        Toast.error('Konto z tym emailem już istnieje. Użyj innej metody logowania.')
      } else {
        Toast.error('Błąd podczas rejestracji przez Google')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const [birthDate, setBirthDate] = useState('')

  const handleChange = (name, value) => {
    setFormData({ ...formData, [name]: value })
  }

  const getMaxBirthDate = () => {
    const today = new Date()
    today.setFullYear(today.getFullYear() - 7)
    return today
  }

  const handleSubmit = async () => {
    // Walidacje
    if (!formData.nickName || formData.nickName.length < 3 || formData.nickName.length > 20) {
      Toast.error('Nick musi mieć od 3 do 20 znaków')
      return
    }

    if (!formData.name || formData.name.length < 1 || formData.name.length > 20) {
      Toast.error('Imię jest wymagane (max 20 znaków)')
      return
    }

    if (!formData.surname || formData.surname.length < 1 || formData.surname.length > 20) {
      Toast.error('Nazwisko jest wymagane (max 20 znaków)')
      return
    }

    if (!formData.email) {
      Toast.error('Email jest wymagany')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      Toast.error('Podaj poprawny adres email')
      return
    }

    if (!birthDate) {
      Toast.error('Data urodzenia jest wymagana')
      return
    }

    const parsedBirthDate = parseIsoDate(birthDate)
    if (!parsedBirthDate) {
      Toast.error('Podaj prawidlowa date urodzenia')
      return
    }

    if (parsedBirthDate > getMaxBirthDate()) {
      Toast.error('Musisz mieć co najmniej 7 lat')
      return
    }

    if (formData.password.length < 6 || formData.password.length > 20) {
      Toast.error('Hasło musi mieć od 6 do 20 znaków')
      return
    }

    if (formData.password !== formData.passwordConfirm) {
      Toast.error('Hasła nie są identyczne')
      return
    }

    setIsLoading(true)

    try {
      const submitData = {
        ...formData,
        age: birthDate,
      }

      await customFetch.post('/auth/register', submitData)
      
      Toast.success('Rejestracja zakończona pomyślnie! Sprawdź email, aby zweryfikować konto.')
      router.replace('/login')
    } catch (error) {
      console.error('Registration failed:', error.response ? error.response.data : error.message)

      let errorMessage = 'Rejestracja nie powiodła się. Spróbuj ponownie.'

      if (error.response?.data?.msg) {
        errorMessage = error.response.data.msg
      } else if (error.response?.data?.errors) {
        const errors = error.response.data.errors
        errorMessage = Object.values(errors)
          .map((err) => err.msg || err)
          .join('\n')
      }

      Toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    try {
      console.log('[Google OAuth] Starting sign in flow')
      await GoogleSignin.hasPlayServices()
      const userInfo = await GoogleSignin.signIn()
      const idToken = userInfo.data?.idToken

      if (!idToken) {
        Toast.error('Nie udało się uzyskać tokena Google')
        return
      }

      const credential = GoogleAuthProvider.credential(idToken)
      const result = await signInWithCredential(auth, credential)
      await handleGoogleAuthSuccess(idToken, result.user)
    } catch (error) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('[Google Sign-in] User cancelled')
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log('[Google Sign-in] Already in progress')
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Toast.error('Google Play Services niedostępne')
      } else {
        console.error('[Google Sign-in] Exception:', error)
        Toast.error('Błąd podczas logowania przez Google')
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LottieView
          source={spinner}
          autoPlay
          loop
          style={styles.spinner}
        />
        <Text style={styles.loadingText}>Rejestrowanie...</Text>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.auth}>
        <View style={styles.authMask} />
        <View style={styles.authFormContainer}>
          <Text style={styles.authFormTitle}>Register</Text>

          <View style={styles.authForm}>
            {/* Nick Input */}
            <View style={styles.authFormGroup}>
              <Text style={styles.label}>Nazwa użytkownika</Text>
              <TextInput
                style={styles.input}
                placeholder='Nick/login/pseudonim'
                placeholderTextColor='#999'
                value={formData.nickName}
                onChangeText={(value) => handleChange('nickName', value)}
                maxLength={20}
                autoCapitalize='none'
              />
              <Text style={styles.smallText}>3-20 znaków</Text>
            </View>

            {/* Name Input */}
            <View style={styles.authFormGroup}>
              <Text style={styles.label}>Imię</Text>
              <TextInput
                style={styles.input}
                placeholder='Wprowadź imię'
                placeholderTextColor='#999'
                value={formData.name}
                onChangeText={(value) => handleChange('name', value)}
                maxLength={20}
              />
            </View>

            {/* Surname Input */}
            <View style={styles.authFormGroup}>
              <Text style={styles.label}>Nazwisko</Text>
              <TextInput
                style={styles.input}
                placeholder='Wprowadź nazwisko'
                placeholderTextColor='#999'
                value={formData.surname}
                onChangeText={(value) => handleChange('surname', value)}
                maxLength={20}
              />
            </View>

            {/* Email Input */}
            <View style={styles.authFormGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder='Wprowadź email'
                placeholderTextColor='#999'
                value={formData.email}
                onChangeText={(value) => handleChange('email', value)}
                keyboardType='email-address'
                autoCapitalize='none'
                autoCorrect={false}
              />
            </View>

            {/* Phone Number Input */}
            <View style={styles.authFormGroup}>
              <Text style={styles.label}>Numer telefonu (opcjonalnie)</Text>
              <TextInput
                style={styles.input}
                placeholder='Wprowadź numer telefonu'
                placeholderTextColor='#999'
                value={formData.phoneNumber}
                onChangeText={(value) => handleChange('phoneNumber', value)}
                keyboardType='phone-pad'
                maxLength={15}
              />
            </View>

            {/* Birth Date Input */}
            <View style={styles.authFormGroup}>
              <Text style={styles.label}>Data urodzenia</Text>
              <DatePicker
                value={birthDate}
                onChange={setBirthDate}
                minimumDate={new Date(1900, 0, 1)}
                maximumDate={getMaxBirthDate()}
              />
            </View>

            {/* Password Input */}
            <View style={styles.authFormGroup}>
              <Text style={styles.label}>Hasło</Text>
              <TextInput
                style={styles.input}
                placeholder='Wprowadź hasło'
                placeholderTextColor='#999'
                secureTextEntry={!showPassword[0]}
                value={formData.password}
                onChangeText={(value) => handleChange('password', value)}
                maxLength={20}
              />
              <Pressable
                style={styles.authFormShow}
                onPress={() => setShowPassword([!showPassword[0], showPassword[1]])}
              >
                <Text style={styles.showButtonText}>
                  {showPassword[0] ? 'Ukryj' : 'Pokaż'}
                </Text>
              </Pressable>
              <Text style={styles.smallText}>6-20 znaków</Text>
            </View>

            {/* Password Confirm Input */}
            <View style={styles.authFormGroup}>
              <Text style={styles.label}>Potwierdź hasło</Text>
              <TextInput
                style={styles.input}
                placeholder='Potwierdź hasło'
                placeholderTextColor='#999'
                secureTextEntry={!showPassword[1]}
                value={formData.passwordConfirm}
                onChangeText={(value) => handleChange('passwordConfirm', value)}
                maxLength={20}
              />
              <Pressable
                style={styles.authFormShow}
                onPress={() => setShowPassword([showPassword[0], !showPassword[1]])}
              >
                <Text style={styles.showButtonText}>
                  {showPassword[1] ? 'Ukryj' : 'Pokaż'}
                </Text>
              </Pressable>
            </View>

            {/* Submit Button */}
            <Button1
              text='Zarejestruj się'
              width={'100%'}
              height={ui.verticalScale(50)}
              fontSize={ui.scaleFont(20, 0.4)}
              lineColor='#fff'
              backgroundColor={COLORS.secondary}
              color={COLORS.background}
              onPress={handleSubmit}
            />
          </View>

          {/* Alternate Options */}
          <View style={styles.authFormAlternate}>
            <Pressable onPress={() => router.push('/login')}>
              <Text style={styles.authFormAlternateText}>
                Masz już konto? <Text style={styles.link}>Zaloguj się</Text>
              </Text>
            </Pressable>
            <Pressable style={styles.authFormAlternateIcon} onPress={handleGoogleSignIn}>
              <Image
                source={require('../assets/images/google-icon.png')}
                style={styles.googleIconImage}
              />
            </Pressable>
            <Text style={styles.googleText}>
              Zarejestruj się za pomocą Google
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

export default Register

const createStyles = (ui) => StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  spinner: {
    width: ui.scale(150),
    height: ui.scale(150),
  },
  loadingText: {
    marginTop: ui.verticalScale(20),
    fontSize: ui.scaleFont(18, 0.4),
    color: COLORS.primary,
  },
  auth: {
    flexGrow: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: ui.verticalScale(40),
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
    borderRadius: ui.moderateScale(16, 0.35),
    padding: ui.spacing(30, 0.45),
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  authFormTitle: {
    fontSize: ui.scaleFont(32, 0.5),
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: ui.verticalScale(30),
  },
  authForm: {
    width: '100%',
  },
  authFormGroup: {
    marginBottom: ui.verticalScale(20),
  },
  label: {
    fontSize: ui.scaleFont(16, 0.35),
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: ui.verticalScale(8),
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: ui.controlRadius,
    minHeight: ui.controlMinHeight,
    paddingHorizontal: ui.controlPaddingHorizontal,
    paddingVertical: ui.controlPaddingVertical,
    fontSize: ui.scaleFont(16, 0.35),
    color: COLORS.background,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  authFormShow: {
    padding: ui.spacing(5, 0.35),
    marginTop: ui.verticalScale(5),
    alignSelf: 'flex-start',
  },
  showButtonText: {
    color: COLORS.secondary,
    fontSize: ui.scaleFont(14, 0.35),
    fontWeight: '600',
  },
  smallText: {
    color: '#666',
    fontSize: ui.scaleFont(12, 0.3),
    marginTop: ui.verticalScale(4),
  },
  authFormAlternate: {
    marginTop: ui.verticalScale(30),
    alignItems: 'center',
  },
  authFormAlternateText: {
    fontSize: ui.scaleFont(14, 0.35),
    color: '#666',
    marginBottom: ui.verticalScale(15),
  },
  link: {
    color: COLORS.secondary,
    fontWeight: 'bold',
  },
  authFormAlternateIcon: {
    width: ui.moderateScale(50, 0.35),
    height: ui.moderateScale(50, 0.35),
    borderRadius: ui.moderateScale(25, 0.35),
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: ui.verticalScale(10),
  },
  googleIconImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  googleText: {
    fontSize: ui.scaleFont(14, 0.35),
    color: COLORS.primary,
  },
})
