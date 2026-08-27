import "react-native-gesture-handler"; // MUST be at the top!
import { useCallback, useEffect, useState } from "react";
import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import HeaderStack from "../Navigation/HeaderStack";
import AnimatedSplash from "../components/AnimatedSplash";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import ToastManager from "toastify-react-native";
import {
  dbg,
  useDebugMount,
  scheduleSummary,
} from "../assets/utils/debugLogger";
import { useThemeStore } from "../context/themeStore";

// Only AuthProvider at root — all other providers scoped to (auth) layout
import { AuthProvider, useAuth } from "../context/AuthContext";

// Natywny splash zostaje na ekranie, dopóki nie zamontuje się <AnimatedSplash />
SplashScreen.preventAutoHideAsync().catch(() => {});
SplashScreen.setOptions({ duration: 300, fade: true });

// Bezpiecznik — gdyby sprawdzanie sesji trwało zbyt długo (np. zimny start
// backendu), splash i tak zniknie i pokaże się własny loader ekranu.
const MAX_SPLASH_WAIT = 6000;

// Przekazuje w górę informację, że AuthContext skończył sprawdzać sesję.
// Dzięki temu <AnimatedSplash /> może zostać zamontowany na stałe w rootcie
// (bez restartu animacji Lottie), a mimo to czekać na dane z AuthProvider.
const AuthReadyBridge = ({ onResolved }) => {
  const { loading } = useAuth();

  useEffect(() => {
    if (!loading) onResolved();
  }, [loading]);

  return null;
};

const Layout = () => {
  dbg("RootLayout");
  useDebugMount("RootLayout");
  scheduleSummary(5);

  const colors = useThemeStore((s) => s.theme.colors);
  const themeMode = useThemeStore((s) => s.theme.mode);
  const isThemeReady = useThemeStore((s) => s.isReady);
  const initTheme = useThemeStore((s) => s.initTheme);

  const [isSplashVisible, setIsSplashVisible] = useState(true);
  const [isAuthResolved, setIsAuthResolved] = useState(false);

  useEffect(() => {
    initTheme();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => setIsAuthResolved(true), MAX_SPLASH_WAIT);
    return () => clearTimeout(timeout);
  }, []);

  const [fontsLoaded] = useFonts({
    "BarlowCondensed-Bold": require("../assets/fonts/Barlow_Condensed/BarlowCondensed-Bold.ttf"),
    "BarlowCondensed-ExtraBold": require("../assets/fonts/Barlow_Condensed/BarlowCondensed-ExtraBold.ttf"),
    "Inter-Regular": require("../assets/fonts/Inter/static/Inter_18pt-Regular.ttf"),
    "Inter-Medium": require("../assets/fonts/Inter/static/Inter_18pt-Medium.ttf"),
    "Inter-SemiBold": require("../assets/fonts/Inter/static/Inter_18pt-SemiBold.ttf"),
    ObjectFont: require("../assets/fonts/object.ttf"),
  });

  // Nawigacja może się montować, gdy mamy czcionki i motyw...
  const areAssetsReady = fontsLoaded && isThemeReady;
  // ...ale splash trzymamy do końca sprawdzania sesji, żeby zasłonić
  // pierwsze przejście na /(auth) (montowanie headera, tab baru itd.).
  const isAppReady = areAssetsReady && isAuthResolved;

  const handleAuthResolved = useCallback(() => setIsAuthResolved(true), []);

  // Natywny splash chowamy dopiero, gdy nasz pełnoekranowy splash jest już
  // wyrenderowany — dzięki temu nie ma przebłysku pustego ekranu.
  const handleSplashLayout = useCallback(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* Jeden globalny StatusBar — bez niego po opuszczeniu ekranu, który
          ustawia własny styl (np. index), ikony wracają do trybu systemowego
          i "migają" przy przejściu na /(auth). */}
      <StatusBar
        style={isSplashVisible || themeMode === "dark" ? "light" : "dark"}
      />

      {areAssetsReady && (
        <KeyboardProvider>
          <AuthProvider>
            <AuthReadyBridge onResolved={handleAuthResolved} />
            <Stack
              screenOptions={{
                headerStyle: { backgroundColor: colors.background },
                headerTintColor: colors.secondary,
                headerTitleStyle: {
                  fontSize: 16,
                },
                header: (props) => <HeaderStack {...props} />,
                gestureEnabled: false,
              }}
            >
              {/* Public screens */}
              <Stack.Screen name="index" options={{ headerShown: true }} />
              <Stack.Screen name="login" options={{ headerShown: true }} />
              <Stack.Screen name="register" options={{ headerShown: true }} />
              <Stack.Screen name="rules" options={{ headerShown: true }} />
              {/* Protected screens — providers are inside (auth)/_layout.jsx */}
              <Stack.Screen
                name="(auth)"
                options={{ headerShown: false, gestureEnabled: false }}
              />
            </Stack>
            <ToastManager />
          </AuthProvider>
        </KeyboardProvider>
      )}

      {isSplashVisible && (
        <AnimatedSplash
          isAppReady={isAppReady}
          onLayout={handleSplashLayout}
          onFinish={() => setIsSplashVisible(false)}
        />
      )}
    </GestureHandlerRootView>
  );
};
export default Layout;
