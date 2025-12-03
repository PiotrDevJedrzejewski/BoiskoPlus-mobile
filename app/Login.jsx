import {
  StyleSheet,
  Text,
  View,
  Image,
  TextInput,
  ScrollView,
  Pressable,
} from 'react-native'
import { COLORS } from '../constants/colors'
import React from 'react'
import Button1 from '../components/Button1'

const Login = () => {
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
            />
          </View>

          {/* Password Input */}
          <View style={styles.authFormGroup}>
            <Text style={styles.label}>Hasło</Text>
            <TextInput
              style={styles.input}
              placeholder='Wprowadź hasło'
              placeholderTextColor='#999'
              secureTextEntry={true}
            />
            <View style={styles.authFormGroupButtons}>
              <Pressable style={styles.authFormShow}>
                <Text style={styles.showButtonText}>Pokaż</Text>
              </Pressable>
              <Pressable style={styles.authFormShow}>
                <Text style={styles.showButtonText}>Zapomniałeś hasła?</Text>
              </Pressable>
            </View>
          </View>

          {/* Submit Button */}
          <Button1
            text='Zaloguj się'
            width={'100%'}
            height={50}
            fontSize={20}
            lineColor='#fff'
            backgroundColor={COLORS.secondary}
            color={COLORS.background}
          />
        </View>

        {/* Alternate Options */}
        <View style={styles.authFormAlternate}>
          <Text style={styles.authFormAlternateText}>
            Nie masz konta? <Text style={styles.link}>Zarejestruj się</Text>
          </Text>
          <Pressable style={styles.authFormAlternateIcon}>
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
})
