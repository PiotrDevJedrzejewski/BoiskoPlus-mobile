import { StyleSheet, Text, View } from "react-native";
import React from "react";
import { useThemedStyles } from "../context/themeStore";
import { SPACING } from "../Theme/StyleConstants";
import { verticalScale, scaleFont } from "../Theme/ScalableStyles";
import { dbg, useDebugMount } from "../assets/utils/debugLogger";

const ForgetPassword = () => {
  dbg("ForgetPasswordScreen");
  useDebugMount("ForgetPasswordScreen");
  const { styles } = useThemedStyles(createStyles);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reset Hasła</Text>
      <Text style={styles.description}>
        Ekran odzyskiwania hasła jest gotowy pod dalszą implementację.
      </Text>
    </View>
  );
};

export default ForgetPassword;

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
