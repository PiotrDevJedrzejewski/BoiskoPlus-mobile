import { useEffect, useRef } from "react";
import { Animated, ImageBackground, StyleSheet } from "react-native";
import LottieView from "lottie-react-native";
import spinner from "../assets/utils/spinner.json";
import splashImage from "../assets/images/BoiskoPlusMain.png";

/**
 * Ekran startowy w JS — płynnie przejmuje natywny splash (expo-splash-screen).
 * Natywny splash chowany jest dopiero w `onLayout`, więc użytkownik nie widzi
 * pustej klatki między splashem a tym komponentem.
 *
 * @param {boolean} isAppReady  czcionki + motyw + sprawdzona sesja
 * @param {Function} onFinish   wywoływane po zakończeniu fade-outu (odmontowanie)
 * @param {Function} onLayout   moment na `SplashScreen.hideAsync()`
 */
const FADE_OUT_DURATION = 1000;

const AnimatedSplash = ({ isAppReady, onFinish, onLayout }) => {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isAppReady) return;

    Animated.timing(opacity, {
      toValue: 0,
      duration: FADE_OUT_DURATION,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) onFinish?.();
    });
  }, [isAppReady]);

  return (
    <Animated.View
      onLayout={onLayout}
      pointerEvents={isAppReady ? "none" : "auto"}
      style={[StyleSheet.absoluteFill, styles.container, { opacity }]}
    >
      <ImageBackground
        source={splashImage}
        style={styles.imageStyle}
        resizeMode="cover"
        fadeDuration={0}
      />

      <LottieView source={spinner} autoPlay loop style={styles.spinner} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#010000",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    elevation: 10,
    flex: 1,
  },
  imageStyle: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  spinner: {
    width: 90,
    height: 90,
    position: "absolute",
    bottom: 50,
  },
});

export default AnimatedSplash;
