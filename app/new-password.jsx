import { StyleSheet, Text, View } from "react-native";
import React from "react";
import { useThemedStyles } from "../context/themeStore";
import { SPACING } from "../Theme/StyleConstants";
import { verticalScale, scaleFont } from "../Theme/ScalableStyles";
import { dbg, useDebugMount } from "../assets/utils/debugLogger";

const NewPassword = () => {
  dbg("NewPasswordScreen");
  useDebugMount("NewPasswordScreen");
  const { styles } = useThemedStyles(createStyles);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nowe Hasło</Text>
      <Text style={styles.description}>
        Ekran ustawiania nowego hasła jest przygotowany do dalszego
        developmentu.
      </Text>
    </View>
  );
};

export default NewPassword;

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      justifyContent: "center",
      alignItems: "center",
      padding: SPACING.lg,
    },
    title: {
      fontSize: scaleFont(28, 0.45),
      fontFamily: "Montserrat-Bold",
      color: colors.primaryText,
      textAlign: "center",
    },
    description: {
      marginTop: verticalScale(12),
      fontSize: scaleFont(15, 0.35),
      fontFamily: "Lato-Regular",
      color: colors.thirdText,
      textAlign: "center",
    },
  });
