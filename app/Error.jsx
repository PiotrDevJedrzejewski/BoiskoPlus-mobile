import { StyleSheet, Text, View } from "react-native";
import React from "react";
import { useThemedStyles } from "../context/themeStore";
import { SPACING } from "../Theme/StyleConstants";
import { verticalScale, scaleFont } from "../Theme/ScalableStyles";
import { dbg, useDebugMount } from "../assets/utils/debugLogger";

const Error = () => {
  dbg("ErrorScreen");
  useDebugMount("ErrorScreen");
  const { styles } = useThemedStyles(createStyles);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Wystąpił Błąd</Text>
      <Text style={styles.description}>
        Ten ekran błędu ma już responsywny layout i można go później rozbudować
        o retry lub powrót.
      </Text>
    </View>
  );
};

export default Error;

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
      fontFamily: "BarlowCondensed-ExtraBold",
      color: colors.Danger,
      textAlign: "center",
    },
    description: {
      marginTop: verticalScale(12),
      fontSize: scaleFont(15, 0.35),
      fontFamily: "Inter-Regular",
      color: colors.primaryText,
      textAlign: "center",
    },
  });
