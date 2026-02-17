import { useState, useEffect } from 'react'
import {
  StyleSheet,
  Text,
  View,
  Image,
  TextInput,
  ScrollView,
  Pressable,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { Picker } from '@react-native-picker/picker'
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
import * as Google from 'expo-auth-session/providers/google'
import * as WebBrowser from 'expo-web-browser'

WebBrowser.maybeCompleteAuthSession()

const Register = () => {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState([false, false])
  
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
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: Constants.expoConfig?.extra?.googleExpoClientId || process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID,
    iosClientId: Constants.expoConfig?.extra?.googleIosClientId || process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: Constants.expoConfig?.extra?.googleAndroidClientId || process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    webClientId: Constants.expoConfig?.extra?.googleWebClientId || process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  })

  // Handle Google Sign In response
  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params
      handleGoogleAuthSuccess(id_token)
    } else if (response?.type === 'error') {
      Toast.error('Błąd autoryzacji Google: ' + response.error?.message)
    }
  }, [response])

  const handleGoogleAuthSuccess = async (idToken) => {
    setIsLoading(true)
    try {
      const credential = GoogleAuthProvider.credential(idToken)
      const result = await signInWithCredential(auth, credential)
      const user = result.user

      // Sprawdź czy użytkownik już istnieje w bazie
      try {
        const loginResponse = await customFetch.post('/auth-mobile/login-oauth', {
          email: user.email,
          googleIdToken: idToken,
        })

        // Użytkownik już istnieje - zaloguj go
        Toast.success('Zalogowano pomyślnie przez Google!')
        
        // Zapisz token i dane (tutaj możesz użyć SecureStore)
        // await SecureStore.setItemAsync('token', loginResponse.data.token)
        
        router.replace('/(main)/(tabs)/(dashboard)/dashboard')
      } catch (loginError) {
        // Użytkownik nie istnieje - przekieruj do uzupełnienia danych
        if (loginError.response?.status === 401) {
          Toast.info('Uzupełnij dane, aby dokończyć rejestrację')
          
          // Zapisz tymczasowo dane Google do użycia w register-with-oauth
          // await SecureStore.setItemAsync('googleUser', JSON.stringify({
          //   email: user.email,
          //   name: user.displayName || '',
          //   photoURL: user.photoURL,
          //   idToken: idToken
          // }))
          
          router.replace('/register-with-oauth')
        } else {
          throw loginError
        }
      }
    } catch (error) {
      console.error('Google auth error:', error)
      
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

  // Date picker state
  const [birthDate, setBirthDate] = useState(null)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [tempDay, setTempDay] = useState(1)
  const [tempMonth, setTempMonth] = useState(1)
  const [tempYear, setTempYear] = useState(2000)

  const currentYear = new Date().getFullYear()
  const days = Array.from({ length: 31 }, (_, i) => i + 1)
  const months = [
    { value: 1, label: 'Styczeń' },
    { value: 2, label: 'Luty' },
    { value: 3, label: 'Marzec' },
    { value: 4, label: 'Kwiecień' },
    { value: 5, label: 'Maj' },
    { value: 6, label: 'Czerwiec' },
    { value: 7, label: 'Lipiec' },
    { value: 8, label: 'Sierpień' },
    { value: 9, label: 'Wrzesień' },
    { value: 10, label: 'Październik' },
    { value: 11, label: 'Listopad' },
    { value: 12, label: 'Grudzień' },
  ]
  const years = Array.from({ length: currentYear - 1900 + 1 }, (_, i) => currentYear - i)

  const handleChange = (name, value) => {
    setFormData({ ...formData, [name]: value })
  }

  const openDatePicker = () => {
    if (birthDate) {
      setTempDay(birthDate.getDate())
      setTempMonth(birthDate.getMonth() + 1)
      setTempYear(birthDate.getFullYear())
    }
    setShowDatePicker(true)
  }

  const confirmDate = () => {
    setBirthDate(new Date(tempYear, tempMonth - 1, tempDay))
    setShowDatePicker(false)
  }

  const formatDay = (date) => {
    if (!date) return 'DD'
    return date.getDate().toString().padStart(2, '0')
  }

  const formatMonth = (date) => {
    if (!date) return 'MM'
    return (date.getMonth() + 1).toString().padStart(2, '0')
  }

  const formatYear = (date) => {
    if (!date) return 'RRRR'
    return date.getFullYear().toString()
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

    if (birthDate > getMaxBirthDate()) {
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
        age: birthDate.toISOString().split('T')[0], // Format YYYY-MM-DD
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
    try {
      await promptAsync()
    } catch (error) {
      console.error('Google Sign In error:', error)
      Toast.error('Nie udało się uruchomić logowania Google')
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
              <Pressable
                style={styles.datePickerContainer}
                onPress={openDatePicker}
              >
                <View style={styles.dateBox}>
                  <Text style={[styles.dateText, !birthDate && styles.datePlaceholder]}>
                    {formatDay(birthDate)}
                  </Text>
                  <Text style={styles.dateLabel}>Dzień</Text>
                </View>
                <View style={styles.dateSeparator}>
                  <Text style={styles.dateSeparatorText}>/</Text>
                </View>
                <View style={styles.dateBox}>
                  <Text style={[styles.dateText, !birthDate && styles.datePlaceholder]}>
                    {formatMonth(birthDate)}
                  </Text>
                  <Text style={styles.dateLabel}>Miesiąc</Text>
                </View>
                <View style={styles.dateSeparator}>
                  <Text style={styles.dateSeparatorText}>/</Text>
                </View>
                <View style={styles.dateBox}>
                  <Text style={[styles.dateText, !birthDate && styles.datePlaceholder]}>
                    {formatYear(birthDate)}
                  </Text>
                  <Text style={styles.dateLabel}>Rok</Text>
                </View>
              </Pressable>

              {/* Date Picker Modal */}
              <Modal
                visible={showDatePicker}
                transparent={true}
                animationType="slide"
              >
                <View style={styles.modalOverlay}>
                  <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Wybierz datę urodzenia</Text>
                    
                    <View style={styles.pickersContainer}>
                      <View style={styles.pickerWrapper}>
                        <Text style={styles.pickerLabel}>Dzień</Text>
                        <Picker
                          selectedValue={tempDay}
                          onValueChange={setTempDay}
                          style={styles.picker}
                        >
                          {days.map((day) => (
                            <Picker.Item key={day} label={day.toString()} value={day} />
                          ))}
                        </Picker>
                      </View>

                      <View style={styles.pickerWrapper}>
                        <Text style={styles.pickerLabel}>Miesiąc</Text>
                        <Picker
                          selectedValue={tempMonth}
                          onValueChange={setTempMonth}
                          style={styles.picker}
                        >
                          {months.map((month) => (
                            <Picker.Item key={month.value} label={month.label} value={month.value} />
                          ))}
                        </Picker>
                      </View>

                      <View style={styles.pickerWrapper}>
                        <Text style={styles.pickerLabel}>Rok</Text>
                        <Picker
                          selectedValue={tempYear}
                          onValueChange={setTempYear}
                          style={styles.picker}
                        >
                          {years.map((year) => (
                            <Picker.Item key={year} label={year.toString()} value={year} />
                          ))}
                        </Picker>
                      </View>
                    </View>

                    <View style={styles.modalButtons}>
                      <Pressable
                        style={[styles.modalButton, styles.cancelButton]}
                        onPress={() => setShowDatePicker(false)}
                      >
                        <Text style={styles.cancelButtonText}>Anuluj</Text>
                      </Pressable>
                      <Pressable
                        style={[styles.modalButton, styles.confirmButton]}
                        onPress={confirmDate}
                      >
                        <Text style={styles.confirmButtonText}>Potwierdź</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              </Modal>
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
              height={50}
              fontSize={20}
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

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  spinner: {
    width: 150,
    height: 150,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    color: COLORS.primary,
  },
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
  datePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dateBox: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.background,
  },
  datePlaceholder: {
    color: '#999',
  },
  dateLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
  },
  dateSeparator: {
    paddingHorizontal: 2,
  },
  dateSeparatorText: {
    fontSize: 25,
    color: '#999',
    fontWeight: '300',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 30,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: "#333",
    textAlign: 'center',
    marginBottom: 20,
  },
  pickersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pickerWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  pickerLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  picker: {
    width: '100%',
    height: 150,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 10,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: "#4CAF50",
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  authFormShow: {
    padding: 5,
    marginTop: 5,
    alignSelf: 'flex-start',
  },
  showButtonText: {
    color: COLORS.secondary,
    fontSize: 14,
    fontWeight: '600',
  },
  smallText: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
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
    borderRadius: 25,
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
})
