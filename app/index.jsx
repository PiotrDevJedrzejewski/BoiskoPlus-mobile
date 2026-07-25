import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Text, View, ImageBackground, StyleSheet, Image } from "react-native";
import Button1 from "../components/Button1";
import LottieView from "lottie-react-native";
import spinner from "../assets/utils/spinner.json";
import { useAuth } from "../context/AuthContext";
import CookiesAndRules from "../components/popup/CookiesAndRules";
import { useEffect } from "react";
import { useThemedStyles } from "../context/themeStore";
import { SPACING } from "../Theme/StyleConstants";
import { scale, scaleFont, verticalScale } from "../Theme/ScalableStyles";
import { dbg, useDebugMount } from "../assets/utils/debugLogger";

const background = require("../assets/images/BoiskoPlusMain.png");

const Home = () => {
  dbg("IndexScreen");
  useDebugMount("IndexScreen");
  const router = useRouter();
  const { styles, colors } = useThemedStyles(createStyles);
  const { needsConsent, user, loading } = useAuth();

  // Przekieruj zalogowanego użytkownika do dashboard
  useEffect(() => {
    if (!loading && user) {
      router.replace("/(auth)/dashboard-home");
    }
  }, [user, loading]);

  const buttonSettings = {
    height: verticalScale(50),
    width: scale(220),
    fontSize: scaleFont(18),
    backgroundColor: colors.PrimaryGreen,
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LottieView
          source={spinner}
          autoPlay
          loop
          style={{ width: scale(80), height: scale(80) }}
        />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <ImageBackground
        source={background}
        style={styles.imageBackground}
        resizeMode="cover"
      >
        {needsConsent && <CookiesAndRules />}
        {/* Maska */}
        <View style={styles.filter}>
          <View style={styles.textContainer}>
            <Text style={styles.title}>Znajdź i stwórz grę zespołową</Text>
            <Text style={styles.description}>
              Aplikacja Boisko+ pozwala umawiać się na wspólne uprawianie
              sportów drużynowych.
            </Text>
          </View>
          <View style={styles.buttonContainer}>
            <Button1
              text="Zaloguj się"
              {...buttonSettings}
              onPress={() => router.push("/login")}
            />
            <Button1
              text="Zarejestruj się"
              {...buttonSettings}
              onPress={() => router.push("/register")}
            />
            <Text
              onPress={() => router.push("/rules")}
              style={styles.description}
            >
              Regulamin i Polityka Prywatności
            </Text>
          </View>
        </View>
      </ImageBackground>
    </>
  );
};

export default Home;

const createStyles = (colors) =>
  StyleSheet.create({
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.background,
    },
    imageBackground: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      position: "relative",
    },
    filter: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    textContainer: {
      padding: SPACING.lg,
    },
    title: {
      color: colors.primaryText,
      fontSize: scaleFont(32, 0.5),
      fontFamily: "ObjectFont",
      textAlign: "center",
    },
    description: {
      color: colors.primaryText,
      fontSize: scaleFont(16, 0.4),
      marginTop: verticalScale(10),
      textAlign: "center",
      fontFamily: "ObjectFont",
    },
    buttonContainer: {
      flex: 1,
      justifyContent: "flex-end",
      alignItems: "center",
      marginBottom: verticalScale(80),
      gap: SPACING.lg,
    },
  });
