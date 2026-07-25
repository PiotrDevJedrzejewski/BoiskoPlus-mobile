import react from "react";
import { StyleSheet, Text, View, Pressable, Image } from "react-native";
// import { Ionicons } from "@expo/vector-icons";

import { useThemedStyles } from "../context/themeStore";
import { SPACING, BORDER_RADIUS } from "../Theme/StyleConstants";
import {
  scale,
  verticalScale,
  moderateScale,
  scaleFont,
} from "../Theme/ScalableStyles";

import badiICON from "../assets/icons/badiICON.png";
import basketballICON from "../assets/icons/basketballICON.png";
import cardsICON from "../assets/icons/cardsICON.png";
import footballICON from "../assets/icons/footballICON.png";
import otherICON from "../assets/icons/otherICON.png";
import tableteICON from "../assets/icons/tableteICON.png";
import tenisICON from "../assets/icons/tenisICON.png";
import voleICON from "../assets/icons/voleICON.png";

const GameTypeButton = ({ title, value, isSelected, pressHandler }) => {
  const { styles, colors } = useThemedStyles(createStyles);

  const getIconIMG = (value) => {
    switch (value) {
      case "football":
        return footballICON;
      case "basketball":
        return basketballICON;
      case "tennis":
        return tenisICON;
      case "volleyball":
        return voleICON;
      case "table tennis":
        return tableteICON;
      case "badminton":
        return badiICON;
      case "cards":
        return cardsICON;
      default:
        return otherICON;
    }
  };

  return (
    <Pressable onPress={pressHandler} style={styles.btn}>
      <Image source={getIconIMG(value)} style={{ width: 30, height: 30 }} />
      <Text style={[styles.btnText, isSelected && styles.selectedBtnText]}>
        {title}
      </Text>
    </Pressable>
  );
};

export default GameTypeButton;

const createStyles = (colors) =>
  StyleSheet.create({
    btn: {
      paddingVertical: SPACING.sm,
      paddingHorizontal: SPACING.xs,
      borderRadius: BORDER_RADIUS.md,
      backgroundColor: colors.neutralButton,
      backgroundColor: colors.primaryCard,
      alignItems: "center",
      justifyContent: "flex-start",
      width: "23%",
      borderWidth: 1,
      borderColor: colors.border,
    },
    selectedBtnText: {
      color: colors.PrimaryGreen,
    },
    btnText: {
      fontSize: scaleFont(14, 0.3),
      fontFamily: "Montserrat-Medium",
      color: colors.primaryText,
      marginTop: SPACING.xs,
      flexShrink: 1,
      textAlign: "center",
    },
  });
