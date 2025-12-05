// Firebase configuration for React Native
// Używa react-native-firebase lub expo-firebase
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getStorage } from 'firebase/storage'
import Constants from 'expo-constants'

const firebaseConfig = {
  apiKey:
    Constants.expoConfig?.extra?.firebaseApiKey ||
    process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain:
    Constants.expoConfig?.extra?.firebaseAuthDomain ||
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:
    Constants.expoConfig?.extra?.firebaseProjectId ||
    process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:
    Constants.expoConfig?.extra?.firebaseStorageBucket ||
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId:
    Constants.expoConfig?.extra?.firebaseMessagingSenderId ||
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:
    Constants.expoConfig?.extra?.firebaseAppId ||
    process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId:
    Constants.expoConfig?.extra?.firebaseMeasurementId ||
    process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

// Inicjalizuj Firebase tylko jeśli config jest kompletny
let app = null
let auth = null
let storage = null

const isConfigValid = () => {
  return firebaseConfig.apiKey && firebaseConfig.projectId
}

if (isConfigValid()) {
  try {
    app = initializeApp(firebaseConfig)
    auth = getAuth(app)
    storage = getStorage(app)
  } catch (error) {
    console.error('Firebase initialization error:', error)
  }
} else {
  console.warn('Firebase config is incomplete. Some features may not work.')
}

export { auth, storage }
export default app
