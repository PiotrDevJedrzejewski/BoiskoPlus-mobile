import { useState, useMemo, useCallback } from "react";
import { StyleSheet, Text, View, TextInput, ScrollView } from "react-native";
import React from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import LottieView from "lottie-react-native";
import { useThemedStyles } from "../context/themeStore";
import { SPACING, BORDER_RADIUS } from "../Theme/StyleConstants";
import {
  scale,
  verticalScale,
  moderateScale,
  scaleFont,
} from "../Theme/ScalableStyles";
import { dbg, useDebugMount } from "../assets/utils/debugLogger";
import { useAuth } from "../context/AuthContext";
import Button1 from "../components/Button1";
import spinner from "../assets/utils/spinner.json";
import { Toast } from "toastify-react-native";
import DatePicker from "../components/popup/DatePicker";

const parseIsoDate = (value) => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [yearStr, monthStr, dayStr] = value.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  if (!year || !month || !day) return null;
  const parsed = new Date(year, month - 1, day);
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() + 1 !== month ||
    parsed.getDate() !== day
  )
    return null;
  return parsed;
};

const RegisterWithOAuth = () => {
  dbg("RegisterWithOAuthScreen");
  useDebugMount("RegisterWithOAuthScreen");
  const router = useRouter();
  const { completeOAuth, completeAppleOAuth } = useAuth();
  const { styles, colors } = useThemedStyles(createStyles);

  const {
    email,
    name: paramName,
    surname: paramSurname,
    googleIdToken,
    avatarUrl,
    appleIdentityToken,
    appleUserId,
  } = useLocalSearchParams();

  const [nick, setNick] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [name, setName] = useState(paramName || "");
  const [surname, setSurname] = useState(paramSurname || "");
  const [isLoading, setIsLoading] = useState(false);

  const maxBirthDate = useMemo(() => {
    const today = new Date();
    today.setFullYear(today.getFullYear() - 7);
    return today;
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!nick || nick.length < 3 || nick.length > 20) {
      Toast.error("Nick musi mieć od 3 do 20 znaków");
      return;
    }

    if (!birthDate) {
      Toast.error("Data urodzenia jest wymagana");
      return;
    }

    const parsedBirthDate = parseIsoDate(birthDate);
    if (!parsedBirthDate) {
      Toast.error("Podaj prawidłową datę urodzenia");
      return;
    }

    if (parsedBirthDate > maxBirthDate) {
      Toast.error("Musisz mieć co najmniej 7 lat");
      return;
    }

    if (!googleIdToken && !appleIdentityToken) {
      Toast.error("Brak danych z Google/Apple. Spróbuj ponownie.");
      return;
    }

    if (!email && !appleIdentityToken) {
      Toast.error("Brak emaila. Spróbuj ponownie.");
      return;
    }

    setIsLoading(true);
    if (__DEV__)
      console.log(
        "[RegisterWithOAuth] submitting, isApple:",
        !!appleIdentityToken,
      );
    try {
      const result = appleIdentityToken
        ? await completeAppleOAuth({
            identityToken: appleIdentityToken,
            appleUserId,
            nick,
            birthDate,
            email,
            name,
            surname,
            avatarUrl: avatarUrl || "",
          })
        : await completeOAuth({
            nick,
            birthDate,
            email,
            name,
            surname,
            googleIdToken,
            avatarUrl: avatarUrl || "",
          });

      if (result.success) {
        Toast.success("Rejestracja zakończona! Możesz korzystać z aplikacji.");
        // AuthContext.completeOAuth calls authorized() which handles redirect
      } else {
        Toast.error(result.error || "Wystąpił błąd podczas rejestracji.");
      }
    } catch (err) {
      console.error("[RegisterWithOAuth] Exception:", err);
      Toast.error("Wystąpił błąd podczas rejestracji.");
    } finally {
      setIsLoading(false);
    }
  }, [
    nick,
    birthDate,
    name,
    surname,
    email,
    googleIdToken,
    appleIdentityToken,
    appleUserId,
    avatarUrl,
    completeOAuth,
    completeAppleOAuth,
    maxBirthDate,
  ]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LottieView source={spinner} autoPlay loop style={styles.spinner} />
        <Text style={styles.loadingText}>Rejestrowanie...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.auth}>
      <View style={styles.authMask} />
      <View style={styles.authFormContainer}>
        <Text style={styles.authFormTitle}>Jeszcze jeden krok</Text>

        <View style={styles.authForm}>
          {/* Nick */}
          <View style={styles.authFormGroup}>
            <Text style={styles.label}>Ustaw swój nick</Text>
            <TextInput
              style={styles.input}
              placeholder="Nick/login/pseudonim"
              placeholderTextColor="#999"
              value={nick}
              onChangeText={setNick}
              maxLength={20}
              autoCapitalize="none"
            />
            <Text style={styles.smallText}>3-20 znaków</Text>
          </View>

          {/* Name */}
          <View style={styles.authFormGroup}>
            <Text style={styles.label}>Imię</Text>
            <TextInput
              style={styles.input}
              placeholder="Wprowadź imię"
              placeholderTextColor="#999"
              value={name}
              onChangeText={setName}
              maxLength={20}
            />
          </View>

          {/* Surname */}
          <View style={styles.authFormGroup}>
            <Text style={styles.label}>Nazwisko</Text>
            <TextInput
              style={styles.input}
              placeholder="Wprowadź nazwisko"
              placeholderTextColor="#999"
              value={surname}
              onChangeText={setSurname}
              maxLength={20}
            />
          </View>

          {/* Birth Date */}
          <View style={styles.authFormGroup}>
            <Text style={styles.label}>Data urodzenia</Text>
            <DatePicker
              value={birthDate}
              onChange={setBirthDate}
              minimumDate={new Date(1900, 0, 1)}
              maximumDate={maxBirthDate}
            />
            <Text style={styles.smallText}>aplikacja dla użytkowników 7+</Text>
          </View>

          {/* Submit */}
          <Button1
            text="Dokończ rejestrację"
            width={"100%"}
            height={verticalScale(50)}
            fontSize={scaleFont(20, 0.4)}
            lineColor="#fff"
            backgroundColor={colors.PrimaryGreen}
            color={colors.background}
            onPress={handleSubmit}
          />
        </View>

        <View style={styles.authFormAlternate}>
          <Text style={styles.authFormAlternateText}>
            Masz już konto?{" "}
            <Text style={styles.link} onPress={() => router.replace("/login")}>
              Zaloguj się
            </Text>
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default RegisterWithOAuth;

const createStyles = (colors) =>
  StyleSheet.create({
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.background,
    },
    spinner: {
      width: scale(150),
      height: scale(150),
    },
    loadingText: {
      marginTop: verticalScale(20),
      fontSize: scaleFont(18, 0.4),
      color: colors.primaryText,
    },
    auth: {
      flexGrow: 1,
      backgroundColor: colors.background,
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
    smallText: {
      color: colors.thirdText,
      fontSize: scaleFont(12, 0.3),
      marginTop: verticalScale(4),
    },
    authFormAlternate: {
      marginTop: verticalScale(30),
      alignItems: "center",
    },
    authFormAlternateText: {
      fontSize: scaleFont(14, 0.35),
      color: colors.thirdText,
    },
    link: {
      color: colors.PrimaryGreen,
      fontWeight: "bold",
    },
  });
