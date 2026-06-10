import 'dotenv/config'

export default {
  expo: {
    name: 'BoiskoPlus',
    slug: 'boiskoplus',
    version: '1.0.4',
    orientation: 'portrait',
    icon: './assets/images/BoiskoPlusNewLogoForMobile.png',
    scheme: 'boiskoplusmobile',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    splash: {
      image: './assets/images/BoiskoPlusNewLogoForMobile.png',
      resizeMode: 'contain',
      backgroundColor: '#012115',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.boiskoplusmobile.app',
      usesAppleSignIn: true,
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSLocationWhenInUseUsageDescription:
          'Aplikacja potrzebuje jednorazowego dostępu do lokalizacji, aby wskazać Twoje położenie na mapie.',
        NSPhotoLibraryUsageDescription:
          'Aplikacja potrzebuje dostępu do galerii, aby umożliwić zmianę zdjęcia profilowego.',
      },
      googleServicesFile: './GoogleService-Info.plist',
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/images/BoiskoPlusNewLogoForMobileSmaller.png',
        backgroundColor: '#012115',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: 'com.boiskoplusmobile.app',
      permissions: ['ACCESS_FINE_LOCATION', 'ACCESS_COARSE_LOCATION'],
      googleServicesFile: './google-services.json',
    },
    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/images/favicon.ico',
    },
    plugins: [
      'expo-router',
      'expo-secure-store',
      'expo-asset',
      'expo-audio',
      'expo-font',
      'expo-web-browser',
      'expo-location',
      'expo-image-picker',
      'expo-apple-authentication',
      '@react-native-google-signin/google-signin',
      [
        'expo-notifications',
        {
          icon: './assets/images/BoiskoPlusNewLogoForMobile.png',
          color: '#012115',
          defaultChannel: 'default',
        },
      ],
      [
        '@rnmapbox/maps',
        {
          RNMapboxMapsPublicToken: process.env.EXPO_PUBLIC_MAPBOX_TOKEN,
          RNMapboxMapsDownloadToken:
            process.env.EXPO_PUBLIC_MAPBOX_DOWNLOAD_TOKEN,
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      // Mapbox
      mapboxToken: process.env.EXPO_PUBLIC_MAPBOX_TOKEN,
      mapboxDownloadToken: process.env.EXPO_PUBLIC_MAPBOX_DOWNLOAD_TOKEN,

      // Firebase config
      firebaseApiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
      firebaseAuthDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
      firebaseProjectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
      firebaseStorageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
      firebaseMessagingSenderId:
        process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      firebaseAppId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
      firebaseMeasurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,

      // Google OAuth Client IDs
      googleExpoClientId: process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID,
      googleIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
      googleAndroidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
      googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,

      // EAS
      eas: {
        projectId:
          process.env.EXPO_PUBLIC_EAS_PROJECT_ID ||
          '826ce042-408b-47a0-b6f6-5718e63e52b3',
      },
    },
  },
}
