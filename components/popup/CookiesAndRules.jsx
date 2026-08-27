import { useRouter, usePathname } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import Button1 from "../../components/Button1";
import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";

import { useThemedStyles } from "../../context/themeStore";
import { SPACING, BORDER_RADIUS } from "../../Theme/StyleConstants";
import {
  verticalScale,
  moderateScale,
  scaleFont,
  scale,
} from "../../Theme/ScalableStyles";

const CookiesAndRules = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { styles, colors } = useThemedStyles(createStyles);
  const {
    needsConsent,
    pendingConsents,
    setRulesAccepted,
    setMarketingAccepted,
    setLocationAccepted,
    saveConsents,
    acceptAllConsents,
  } = useAuth();

  const isReadyToSave = pendingConsents.rulesAccepted;
  const isOnIndexScreen = pathname === "/";

  return (
    <Modal
      visible={needsConsent && isOnIndexScreen}
      transparent
      animationType="fade"
    >
      <View style={styles.modalBackdrop}>
        <LinearGradient
          colors={[colors.backgroundSecondary, colors.background]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 0.75 }}
          style={styles.modalCard}
        >
          <View style={styles.modalHeader}>
            <FontAwesome6
              name="cookie-bite"
              size={moderateScale(24, 0.35)}
              color={colors.PrimaryGreen}
              style={styles.modalIcon}
            />
            <Text style={styles.modalTitle}>Zgody i regulamin</Text>
          </View>
          <Text style={styles.modalDescription}>
            Aby korzystać z aplikacji, zaakceptuj regulamin oraz wybierz zgodę
            na zbieranie informacji marketingowych.
          </Text>

          <View style={styles.modalSection}>
            <Text style={styles.modalSectionTitle}>Regulamin</Text>
            <Pressable
              style={styles.optionRow}
              onPress={() => setRulesAccepted(!pendingConsents.rulesAccepted)}
            >
              <View
                style={[
                  styles.checkbox,
                  pendingConsents.rulesAccepted && styles.checkboxChecked,
                ]}
              />
              <Text style={styles.optionText}>
                *Akceptuję regulamin i politykę prywatności
              </Text>
            </Pressable>
            <Pressable
              style={styles.optionRow}
              onPress={() =>
                setMarketingAccepted(!pendingConsents.marketingAccepted)
              }
            >
              <View
                style={[
                  styles.checkbox,
                  pendingConsents.marketingAccepted && styles.checkboxChecked,
                ]}
              />
              <Text style={styles.optionText}>
                Akceptuję zbieranie danych marketingowych
              </Text>
            </Pressable>
            <Pressable
              style={styles.optionRow}
              onPress={() =>
                setLocationAccepted(!pendingConsents.locationAccepted)
              }
            >
              <View
                style={[
                  styles.checkbox,
                  pendingConsents.locationAccepted && styles.checkboxChecked,
                ]}
              />
              <Text style={styles.optionText}>
                Akceptuję udostępnianie mojej lokalizacji
              </Text>
            </Pressable>
            <Pressable onPress={() => router.push("/rules")}>
              <Text style={styles.rulesLink}>
                Zobacz regulamin i politykę prywatności
              </Text>
            </Pressable>
          </View>

          <View style={styles.modalButtons}>
            <Button1
              text="Akceptuj wszystko"
              height={moderateScale(46, 0.35)}
              width={scale(220)}
              fontSize={scaleFont(16, 0.35)}
              padding={SPACING.md}
              backgroundColor={colors.PrimaryGreen}
              color={colors.background}
              onPress={acceptAllConsents}
            />
          </View>
          <View style={styles.modalButtons}>
            <Button1
              text="Zapisz wybrane"
              height={moderateScale(46, 0.35)}
              width={scale(220)}
              fontSize={scaleFont(16, 0.35)}
              backgroundColor={
                isReadyToSave ? colors.PrimaryGreen : colors.NeutralButton
              }
              color={isReadyToSave ? colors.background : colors.primaryText}
              onPress={isReadyToSave ? saveConsents : undefined}
            />
            {!pendingConsents.rulesAccepted && (
              <Text style={styles.validationText}>
                Akceptacja regulaminu jest wymagana.
              </Text>
            )}
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
};

export default CookiesAndRules;

const createStyles = (colors) =>
  StyleSheet.create({
    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.65)",
      justifyContent: "center",
      alignItems: "center",
      padding: SPACING.lg,
    },
    modalCard: {
      width: "98%",
      maxWidth: 420,
      borderRadius: BORDER_RADIUS.lg,
      padding: SPACING.lg,
      borderWidth: 1,
      borderColor: colors.border,
      //shadow
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: SPACING.md,
      marginBottom: verticalScale(10),
    },
    modalIcon: {
      fontSize: scaleFont(28, 0.45),
    },
    modalTitle: {
      color: colors.PrimaryGreen,
      fontSize: scaleFont(20, 0.4),
      fontFamily: "BarlowCondensed-ExtraBold",
    },
    modalDescription: {
      color: colors.primaryText,
      fontSize: scaleFont(14, 0.35),
      lineHeight: verticalScale(20),
      marginBottom: verticalScale(16),
    },
    modalSection: {
      marginBottom: verticalScale(16),
    },
    modalSectionTitle: {
      color: colors.PrimaryGreen,
      fontSize: scaleFont(16, 0.35),
      marginBottom: verticalScale(8),
      fontFamily: "BarlowCondensed-Bold",
    },
    optionRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
      marginBottom: verticalScale(18),
    },
    checkbox: {
      width: scale(18),
      height: scale(18),
      borderRadius: BORDER_RADIUS.xs,
      borderWidth: 1,
      borderColor: colors.PrimaryGreen,
    },
    checkboxChecked: {
      backgroundColor: colors.DarkGreen,
    },
    optionText: {
      color: colors.primaryText,
      fontSize: scaleFont(13, 0.35),
    },
    rulesLink: {
      color: colors.PrimaryGreen,
      textDecorationLine: "underline",
      fontSize: scaleFont(13, 0.35),
    },
    modalButtons: {
      alignItems: "center",
      gap: SPACING.xs,
      marginBottom: verticalScale(12),
    },
    validationText: {
      color: colors.Danger,
      fontSize: scaleFont(12, 0.3),
      textAlign: "center",
    },
  });
