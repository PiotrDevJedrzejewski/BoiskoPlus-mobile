import { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";

import customFetch from "../../assets/utils/customFetch";
import { useAuth } from "../../context/AuthContext";
import { useThemedStyles } from "../../context/themeStore";
import { SPACING, BORDER_RADIUS } from "../../Theme/StyleConstants";
import { scaleFont } from "../../Theme/ScalableStyles";

// Opened from an invitation link: /link-redirect/invite/<token>.
// Resolves the token to an event and replaces itself with the event screen,
// so "back" from the event does not return here.
const EventInvite = () => {
  const { styles, colors } = useThemedStyles(createStyles);

  const router = useRouter();
  const { token } = useLocalSearchParams();
  const { user } = useAuth();

  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!token || !user?._id) return;

    const resolveInvite = async () => {
      try {
        const response = await customFetch.get(
          `/football-events/invite/${token}`,
        );
        const { eventId, invitedBy } = response.data;

        // The organizer opened their own invitation — show the management screen
        if (String(invitedBy) === String(user._id)) {
          router.replace(`/(auth)/events-managment/edit-event?id=${eventId}`);
          return;
        }

        router.replace(`/(auth)/single-event?id=${eventId}&ref=${invitedBy}`);
      } catch (error) {
        console.error("Błąd otwierania zaproszenia:", error);
        setHasError(true);
      }
    };

    resolveInvite();
  }, [token, user?._id, router]);

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(auth)/dashboard-home");
    }
  };

  if (hasError || !token) {
    return (
      <View style={styles.container}>
        <Ionicons
          name="alert-circle"
          size={scaleFont(64, 0.35)}
          color={colors.Danger}
        />
        <Text style={styles.errorText}>
          Zaproszenie jest nieprawidłowe lub wydarzenie zostało usunięte
        </Text>
        <Pressable style={styles.backButton} onPress={handleGoBack}>
          <Text style={styles.backButton_text}>WRÓĆ</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.PrimaryGreen} />
      <Text style={styles.loadingText}>Otwieranie zaproszenia...</Text>
    </View>
  );
};

export default EventInvite;

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      justifyContent: "center",
      alignItems: "center",
      gap: SPACING.md,
      padding: SPACING.lg,
    },
    loadingText: {
      fontSize: scaleFont(14, 0.35),
      color: colors.secondaryText,
    },
    errorText: {
      fontSize: scaleFont(14, 0.35),
      color: colors.primaryText,
      textAlign: "center",
    },
    backButton: {
      backgroundColor: colors.PrimaryGreen,
      borderRadius: BORDER_RADIUS.md,
      paddingVertical: SPACING.sm,
      paddingHorizontal: SPACING.xl,
    },
    backButton_text: {
      fontSize: scaleFont(14, 0.35),
      color: "#000",
      fontWeight: "bold",
      fontFamily: "Inter-SemiBold",
    },
  });
