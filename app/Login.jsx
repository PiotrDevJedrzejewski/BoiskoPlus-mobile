import {
  StyleSheet,
  Text,
  View,
  Image,
  TextInput,
  ScrollView,
  Pressable,
  Alert,
  Platform,
} from "react-native";
import React, { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";
import Button1 from "../components/Button1";
import spinner from "../assets/utils/spinner.json";
import LottieView from "lottie-react-native";

import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { auth } from "../assets/utils/firebase";
import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import Constants from "expo-constants";
import { useThemedStyles } from "../context/themeStore";
import { SPACING, BORDER_RADIUS } from "../Theme/StyleConstants";
import {
  scale,
  verticalScale,
  moderateScale,
  scaleFont,
} from "../Theme/ScalableStyles";
import { dbg, useDebugMount } from "../assets/utils/debugLogger";
import * as AppleAuthentication from "expo-apple-authentication";
import AsyncStorage from "@react-native-async-storage/async-storage";

const Login = () => {
  dbg("LoginScreen");
  useDebugMount("LoginScreen");
  const router = useRouter();
  const { login, loginWithGoogle, loginWithApple } = useAuth();
  const { styles, colors } = useThemedStyles(createStyles);

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: Constants.expoConfig?.extra?.googleWebClientId,
      iosClientId: Constants.expoConfig?.extra?.googleIosClientId,
    });
  }, []);

  // Funkcja logowania przez Google
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken;

      if (!idToken) {
        Alert.alert("Błąd", "Nie udało się uzyskać tokena Google");
        return;
      }

      console.log("[Google Sign-in] Creating Firebase credential...");
      const credential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(auth, credential);
      const user = userCredential.user;
      console.log(
        "[Google Sign-in] Firebase auth successful, email:",
        user.email,
      );

      // Send the original Google ID token to backend (not Firebase token)
      // Backend uses OAuth2Client.verifyIdToken() which expects a Google ID token
      console.log("[Google Sign-in] Sending Google ID token to backend...");

      const result = await loginWithGoogle(user.email, idToken);
      console.log("[Google Sign-in] Backend response:", result);

      if (result.success) {
        console.log("[Google Sign-in] Login successful, redirecting...");
        // Redirect is handled inside loginWithGoogle → authorized() in AuthContext
      } else {
        if (
          result.error?.includes("nie istnieje") ||
          result.error?.includes("complete")
        ) {
          console.log("[Google Sign-in] User needs to complete registration");
          router.push({
            pathname: "/register-with-oauth",
            params: {
              email: user.email,
              name: user.displayName?.split(" ")[0] || "",
              surname: user.displayName?.split(" ").slice(1).join(" ") || "",
              googleIdToken: idToken,
              avatarUrl: user.photoURL || "",
            },
          });
        } else {
          console.error("[Google Sign-in] Backend error:", result.error);
          Alert.alert("Błąd logowania", result.error);
        }
      }
    } catch (error) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log("[Google Sign-in] User cancelled");
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log("[Google Sign-in] Sign in already in progress");
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert("Błąd", "Google Play Services niedostępne");
      } else {
        console.error("[Google Sign-in] Exception:", error);
        Alert.alert("Błąd", "Wystąpił błąd podczas logowania przez Google");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Obsługa zmiany wartości w formularzu
  const handleChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  // Obsługa logowania email/hasło
  const handleSubmit = async () => {
    if (!formData.email || !formData.password) {
      Alert.alert("Błąd", "Wypełnij wszystkie pola");
      return;
    }

    setIsLoading(true);
    try {
      const result = await login(formData.email, formData.password);

      if (result.status) {
        setFormData({ email: "", password: "" });
      } else {
        if (result.isEmailNotVerified) {
          Alert.alert(
            "Weryfikacja email",
            "Musisz najpierw zweryfikować swój adres email. Sprawdź swoją skrzynkę pocztową.",
          );
        } else {
          Alert.alert("Błąd logowania", result.error);
        }
      }
    } catch (error) {
      console.error("Login failed:", error);
      Alert.alert("Błąd", "Wystąpił błąd podczas logowania");
    } finally {
      setIsLoading(false);
    }
  };

  // Przejście do zapomniałem hasła
  const handleForgotPassword = () => {
    router.push("/forget-password");
  };

  // Przejście do rejestracji
  const handleGoToRegister = () => {
    router.push("/register");
  };

  // Apple Sign-In
  const handleAppleSignIn = async () => {
    if (__DEV__) console.log("[Apple Sign-In] Starting flow from login");
    setIsLoading(true);
    try {
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      if (__DEV__) console.log("[Apple Sign-In] isAvailable:", isAvailable);
      if (!isAvailable) {
        Alert.alert(
          "Niedostępne",
          "Logowanie przez Apple nie jest dostępne na tym urządzeniu.",
        );
        return;
      }

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (__DEV__)
        console.log(
          "[Apple Sign-In] Credential received, appleUserId:",
          credential.user,
        );
      if (__DEV__)
        console.log(
          "[Apple Sign-In] email:",
          credential.email,
          "givenName:",
          credential.fullName?.givenName,
        );

      const { identityToken, user: appleUserId, email, fullName } = credential;
      if (!identityToken) {
        Alert.alert("Błąd", "Nie udało się uzyskać tokena Apple.");
        return;
      }

      // Cache key per user — Apple zwraca email/imię tylko przy pierwszym logowaniu
      const CACHE_KEY = `apple_user_cache_${appleUserId}`;
      let cachedData = {};
      try {
        const stored = await AsyncStorage.getItem(CACHE_KEY);
        if (stored) cachedData = JSON.parse(stored);
        if (__DEV__) console.log("[Apple Sign-In] Cache loaded:", cachedData);
      } catch {}

      const resolvedEmail = email || cachedData.email || null;
      const resolvedName = fullName?.givenName || cachedData.name || "";
      const resolvedSurname = fullName?.familyName || cachedData.surname || "";

      if (email || fullName?.givenName) {
        try {
          await AsyncStorage.setItem(
            CACHE_KEY,
            JSON.stringify({
              email: resolvedEmail,
              name: resolvedName,
              surname: resolvedSurname,
            }),
          );
          if (__DEV__) console.log("[Apple Sign-In] Cache saved");
        } catch {}
      }

      const result = await loginWithApple(identityToken, appleUserId);
      if (__DEV__) console.log("[Apple Sign-In] Result:", result);

      if (!result.success && result.userNotFound) {
        if (__DEV__)
          console.log(
            "[Apple Sign-In] User not found, redirecting to registration",
          );
        router.push({
          pathname: "/register-with-oauth",
          params: {
            email: resolvedEmail || "",
            name: resolvedName,
            surname: resolvedSurname,
            appleIdentityToken: identityToken,
            appleUserId,
          },
        });
      } else if (!result.success) {
        Alert.alert("Błąd logowania", result.error);
      }
      // sukces: redirect handled by loginWithApple → authorized() in AuthContext
    } catch (error) {
      if (error.code === "ERR_REQUEST_CANCELED") {
        if (__DEV__) console.log("[Apple Sign-In] Cancelled by user");
        return;
      }
      if (__DEV__) console.error("[Apple Sign-In] Exception:", error);
      Alert.alert("Błąd", "Wystąpił błąd podczas logowania przez Apple.");
    } finally {
      setIsLoading(false);
    }
  };

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
              placeholder="Wprowadź email lub nick"
              placeholderTextColor="#999"
              value={formData.email}
              onChangeText={(value) => handleChange("email", value)}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!isLoading}
            />
          </View>

          {/* Password Input */}
          <View style={styles.authFormGroup}>
            <Text style={styles.label}>Hasło</Text>
            <TextInput
              style={styles.input}
              placeholder="Wprowadź hasło"
              placeholderTextColor="#999"
              secureTextEntry={!showPassword}
              value={formData.password}
              onChangeText={(value) => handleChange("password", value)}
              editable={!isLoading}
            />
            <View style={styles.authFormGroupButtons}>
              <Pressable
                style={styles.authFormShow}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text style={styles.showButtonText}>
                  {showPassword ? "Ukryj" : "Pokaż"}
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
              text="Zaloguj się"
              width={"100%"}
              height={verticalScale(50)}
              fontSize={scaleFont(20, 0.4)}
              lineColor="#fff"
              backgroundColor={colors.PrimaryGreen}
              color={colors.background}
              onPress={handleSubmit}
            />
          )}
        </View>

        {/* Alternate Options */}
        <View style={styles.authFormAlternate}>
          <Text style={styles.authFormAlternateText}>
            Nie masz konta?{"    "}
            <Text style={styles.link} onPress={handleGoToRegister}>
              Zarejestruj się
            </Text>
          </Text>
          <View style={styles.oauthRow}>
            <Pressable
              style={styles.authFormAlternateIcon}
              onPress={handleAppleSignIn}
              disabled={isLoading || Platform.OS !== "ios"}
            >
              <Image
                source={require("../assets/images/appleWhite.png")}
                style={styles.appleIconImage}
              />
              {Platform.OS !== "ios" && <View style={styles.disabledOverlay} />}
            </Pressable>
            <Pressable
              style={styles.authFormAlternateIcon}
              onPress={handleGoogleSignIn}
              disabled={isLoading}
            >
              <Image
                source={require("../assets/images/google-icon.png")}
                style={styles.googleIconImage}
              />
            </Pressable>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default Login;

const createStyles = (colors) =>
  StyleSheet.create({
    auth: {
      flexGrow: 1,
      backgroundColor: colors.backgroundSecondary,
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: verticalScale(40),
    },
    authMask: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "#000",
      opacity: 0.6,
    },
    authFormContainer: {
      backgroundColor: colors.background,
      borderRadius: BORDER_RADIUS.lg,
      padding: SPACING.xl,
      width: "90%",
      maxWidth: 400,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 5,
    },
    authFormTitle: {
      fontSize: scaleFont(32, 0.5),
      fontWeight: "bold",
      color: colors.primaryText,
      textAlign: "center",
      marginBottom: verticalScale(30),
    },
    authForm: {
      width: "100%",
    },
    authFormGroup: {
      marginBottom: verticalScale(20),
    },
    label: {
      fontSize: scaleFont(16, 0.35),
      fontWeight: "600",
      color: colors.primaryText,
      marginBottom: verticalScale(8),
    },
    input: {
      backgroundColor: "#f5f5f5",
      borderRadius: BORDER_RADIUS.lg,
      minHeight: verticalScale(44),
      paddingHorizontal: SPACING.md,
      paddingVertical: verticalScale(10),
      fontSize: scaleFont(16, 0.35),
      color: colors.background,
      borderWidth: 1,
      borderColor: "#e0e0e0",
    },
    authFormGroupButtons: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: verticalScale(10),
    },
    authFormShow: {
      padding: SPACING.xs,
    },
    showButtonText: {
      color: colors.PrimaryGreen,
      fontSize: scaleFont(14, 0.35),
      fontWeight: "600",
    },
    authFormAlternate: {
      marginTop: verticalScale(30),
      alignItems: "center",
    },
    authFormAlternateText: {
      fontSize: scaleFont(14, 0.35),
      color: colors.thirdText,
      marginBottom: verticalScale(15),
    },
    link: {
      color: colors.PrimaryGreen,
      fontWeight: "bold",
    },
    oauthRow: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: SPACING.md,
    },
    authFormAlternateIcon: {
      width: moderateScale(50, 0.35),
      height: moderateScale(50, 0.35),
      borderRadius: moderateScale(25, 0.35),
      backgroundColor: "#fff",
      justifyContent: "center",
      alignItems: "center",
    },
    googleIconImage: {
      width: "100%",
      height: "100%",
      resizeMode: "contain",
    },
    appleIconImage: {
      width: "100%",
      height: "100%",
      borderRadius: moderateScale(25, 0.35),
      resizeMode: "contain",
    },
    disabledOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.45)",
      borderRadius: moderateScale(25, 0.35),
    },
    loader: {
      width: scale(50),
      height: scale(50),
      alignSelf: "center",
    },
  });
