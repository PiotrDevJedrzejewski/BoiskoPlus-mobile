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
import React, { useState } from "react";
import { useRouter } from "expo-router";
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

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ForgetPassword = () => {
  dbg("ForgetPasswordScreen");
  useDebugMount("ForgetPasswordScreen");

  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { forgotPassword } = useAuth();
  const { styles, colors } = useThemedStyles(createStyles);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      Toast.error("Podaj adres e-mail");
      return;
    }

    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      Toast.error("Podaj prawidłowy adres e-mail");
      return;
    }

    setIsLoading(true);
    try {
      const result = await forgotPassword(normalizedEmail);

      if (!result.success) {
        Toast.error(result.error);
        return;
      }

      setEmail("");
      Toast.success(result.message);
    } finally {
      setIsLoading(false);
    }
  };

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
          <Text style={styles.title}>Resetowanie hasła</Text>
          <Text style={styles.description}>
            Podaj adres e-mail konta. Wyślemy link, który otworzy ekran
            ustawienia nowego hasła.
          </Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>E-mail</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Wprowadź adres e-mail"
              placeholderTextColor={colors.Placeholder}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              keyboardType="email-address"
              returnKeyType="send"
              editable={!isLoading}
              onSubmitEditing={handleSubmit}
            />
          </View>

          {isLoading ? (
            <LottieView source={spinner} autoPlay loop style={styles.loader} />
          ) : (
            <Button1
              text="Wyślij link"
              width="100%"
              height={verticalScale(50)}
              fontSize={scaleFont(18, 0.4)}
              lineColor="#fff"
              backgroundColor={colors.PrimaryGreen}
              color={colors.background}
              onPress={handleSubmit}
            />
          )}

          <Pressable
            style={styles.backButton}
            onPress={() => router.replace("/login")}
            disabled={isLoading}
          >
            <Text style={styles.backButtonText}>Wróć do logowania</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ForgetPassword;

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
      marginBottom: verticalScale(20),
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
    loader: {
      width: scale(50),
      height: scale(50),
      alignSelf: "center",
    },
    backButton: {
      alignSelf: "center",
      marginTop: verticalScale(20),
      padding: SPACING.sm,
    },
    backButtonText: {
      color: colors.PrimaryGreen,
      fontSize: scaleFont(14, 0.35),
      fontFamily: "Inter-SemiBold",
    },
  });
