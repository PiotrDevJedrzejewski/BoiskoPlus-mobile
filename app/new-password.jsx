import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import React, { useEffect, useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import LottieView from "lottie-react-native";
import { Toast } from "toastify-react-native";
import { useAuth } from "../context/AuthContext";
import { useThemedStyles } from "../context/themeStore";
import Button1 from "../components/Button1";
import spinner from "../assets/utils/spinner.json";
import { SPACING, BORDER_RADIUS } from "../Theme/StyleConstants";
import { scale, verticalScale, scaleFont } from "../Theme/ScalableStyles";
import { dbg, useDebugMount } from "../assets/utils/debugLogger";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const NewPassword = () => {
  dbg("NewPasswordScreen");
  useDebugMount("NewPasswordScreen");

  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const token = Array.isArray(params.token) ? params.token[0] : params.token;
  const { resetPassword } = useAuth();
  const { styles, colors } = useThemedStyles(createStyles);
  const redirectTimer = useRef(null);

  const [password, setPassword] = useState("");
  const [confirmedPassword, setConfirmedPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(
    () => () => {
      if (redirectTimer.current) clearTimeout(redirectTimer.current);
    },
    [],
  );

  const handleSubmit = async () => {
    if (!password || !confirmedPassword) {
      Toast.error("Wypełnij oba pola hasła");
      return;
    }

    if (password.length < 6 || password.length > 20) {
      Toast.error("Hasło musi mieć od 6 do 20 znaków");
      return;
    }

    if (password !== confirmedPassword) {
      Toast.error("Hasła nie są identyczne");
      return;
    }

    if (!token) {
      Toast.error("Brak tokenu resetowania hasła");
      return;
    }

    setIsLoading(true);
    let resetSucceeded = false;
    try {
      const result = await resetPassword(token, password);

      if (!result.success) {
        Toast.error(result.error);
        return;
      }

      resetSucceeded = true;
      Toast.success(result.message);
      redirectTimer.current = setTimeout(() => {
        router.replace("/login");
      }, 1500);
    } finally {
      if (!resetSucceeded) setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <View
        style={[
          styles.invalidScreen,
          { paddingBottom: SPACING.lg + insets.bottom },
        ]}
      >
        <View style={styles.formContainer}>
          <Text style={styles.title}>Nieprawidłowy link</Text>
          <Text style={styles.description}>
            Otwórz link otrzymany w wiadomości e-mail lub poproś o wysłanie
            nowego linku do resetowania hasła.
          </Text>
          <Button1
            text="Wyślij nowy link"
            width="100%"
            height={verticalScale(50)}
            fontSize={scaleFont(18, 0.4)}
            lineColor="#fff"
            backgroundColor={colors.PrimaryGreen}
            color={colors.background}
            onPress={() => router.replace("/forget-password")}
          />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[
          styles.screen,
          { paddingBottom: SPACING.lg + insets.bottom },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
      >
        <View style={styles.formContainer}>
          <Text style={styles.title}>Nowe hasło</Text>
          <Text style={styles.description}>
            Ustaw nowe hasło do swojego konta. Link jest jednorazowy i ważny
            przez godzinę.
          </Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Nowe hasło</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="6–20 znaków"
              placeholderTextColor={colors.Placeholder}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="new-password"
              textContentType="newPassword"
              maxLength={20}
              editable={!isLoading}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Powtórz nowe hasło</Text>
            <TextInput
              style={styles.input}
              value={confirmedPassword}
              onChangeText={setConfirmedPassword}
              placeholder="Wpisz hasło ponownie"
              placeholderTextColor={colors.Placeholder}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="new-password"
              textContentType="newPassword"
              maxLength={20}
              returnKeyType="done"
              editable={!isLoading}
              onSubmitEditing={handleSubmit}
            />
          </View>

          <Pressable
            style={styles.showButton}
            onPress={() => setShowPassword((current) => !current)}
            disabled={isLoading}
          >
            <Text style={styles.showButtonText}>
              {showPassword ? "Ukryj hasła" : "Pokaż hasła"}
            </Text>
          </Pressable>

          {isLoading ? (
            <LottieView source={spinner} autoPlay loop style={styles.loader} />
          ) : (
            <Button1
              text="Zmień hasło"
              width="100%"
              height={verticalScale(50)}
              fontSize={scaleFont(18, 0.4)}
              lineColor="#fff"
              backgroundColor={colors.PrimaryGreen}
              color={colors.background}
              onPress={handleSubmit}
            />
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default NewPassword;

const createStyles = (colors) =>
  StyleSheet.create({
    keyboardView: {
      flex: 1,
      backgroundColor: colors.backgroundSecondary,
    },
    screen: {
      flexGrow: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: SPACING.lg,
      backgroundColor: colors.backgroundSecondary,
    },
    invalidScreen: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: SPACING.lg,
      backgroundColor: colors.backgroundSecondary,
    },
    formContainer: {
      width: "100%",
      maxWidth: 400,
      padding: SPACING.xl,
      borderRadius: BORDER_RADIUS.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
      elevation: 5,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 10,
    },
    title: {
      color: colors.primaryText,
      fontSize: scaleFont(30, 0.5),
      fontFamily: "BarlowCondensed-ExtraBold",
      textAlign: "center",
    },
    description: {
      marginTop: verticalScale(10),
      marginBottom: verticalScale(24),
      color: colors.secondaryText,
      fontSize: scaleFont(14, 0.35),
      fontFamily: "Inter-Regular",
      lineHeight: verticalScale(21),
      textAlign: "center",
    },
    formGroup: {
      marginBottom: verticalScale(16),
    },
    label: {
      marginBottom: verticalScale(8),
      color: colors.primaryText,
      fontSize: scaleFont(16, 0.35),
      fontFamily: "Inter-Medium",
    },
    input: {
      minHeight: verticalScale(48),
      paddingHorizontal: SPACING.md,
      paddingVertical: verticalScale(10),
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: BORDER_RADIUS.lg,
      backgroundColor: colors.backgroundSecondary,
      color: colors.primaryText,
      fontSize: scaleFont(16, 0.35),
      fontFamily: "Inter-Regular",
    },
    showButton: {
      alignSelf: "flex-end",
      marginTop: verticalScale(-8),
      marginBottom: verticalScale(16),
      padding: SPACING.xs,
    },
    showButtonText: {
      color: colors.PrimaryGreen,
      fontSize: scaleFont(14, 0.35),
      fontFamily: "Inter-SemiBold",
    },
    loader: {
      width: scale(50),
      height: scale(50),
      alignSelf: "center",
    },
  });
