import { useEffect } from "react";
import { BackHandler, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

import { useThemedStyles } from "../../context/themeStore";
import { SPACING, BORDER_RADIUS } from "../../Theme/StyleConstants";
import { scale, scaleFont, verticalScale } from "../../Theme/ScalableStyles";

const ANIMATION_DURATION = 200;

const SingleEventSettings = ({
  visible,
  onClose,
  isChatMuted,
  isNotificationsMuted,
  onToggleChatMute,
  onToggleNotificationsMute,
  onReport,
  title = "Opcje wydarzenia",
  options: optionsProp,
}) => {
  const { styles, colors } = useThemedStyles(createStyles);

  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(visible ? 1 : 0, {
      duration: ANIMATION_DURATION,
      easing: Easing.out(Easing.cubic),
    });
  }, [visible, progress]);

  // Android back button support
  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [visible, onClose]);

  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    pointerEvents: progress.value > 0 ? "auto" : "none",
  }));

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      {
        translateY: withTiming(visible ? 0 : -8, {
          duration: ANIMATION_DURATION,
        }),
      },
      { scale: 0.95 + 0.05 * progress.value },
    ],
  }));

  const backdropTap = Gesture.Tap().onEnd(() => {
    runOnJS(onClose)();
  });

  // Domyślne opcje (single-event); można nadpisać propem `options`
  // (np. ekran zarządzania właściciela) — każda opcja: { key, label, icon, color?, onPress }.
  const options = optionsProp ?? [
    {
      key: "chatMute",
      label: isChatMuted ? "Włącz powiadomienia czatu" : "Wycisz czat",
      icon: isChatMuted ? "chatbubble-ellipses" : "chatbubble-ellipses-outline",
      color: colors.primaryText,
      onPress: onToggleChatMute,
    },
    {
      key: "eventMute",
      label: isNotificationsMuted
        ? "Włącz powiadomienia wydarzenia"
        : "Wycisz wydarzenie",
      icon: isNotificationsMuted
        ? "notifications-off"
        : "notifications-outline",
      color: colors.primaryText,
      onPress: onToggleNotificationsMute,
    },
    {
      key: "report",
      label: "Zgłoś wydarzenie",
      icon: "flag-outline",
      color: colors.Danger,
      onPress: onReport,
    },
  ];

  const resolveColor = (option) => option.color ?? colors.primaryText;

  return (
    <GestureDetector gesture={backdropTap}>
      <Animated.View style={[styles.overlay, overlayAnimatedStyle]}>
        <Animated.View style={[styles.container, containerAnimatedStyle]}>
          {/* Header label */}
          <View style={styles.header}>
            <Ionicons
              name="settings-outline"
              size={18}
              color={colors.secondaryText}
            />
            <Text style={styles.headerText}>{title}</Text>
          </View>

          {options.map((option) => (
            <Pressable
              key={option.key}
              style={({ pressed }) => [
                styles.optionButton,
                pressed && styles.optionButtonPressed,
              ]}
              onPress={() => {
                onClose();
                option.onPress?.();
              }}
              android_ripple={{ color: colors.backgroundSecondary }}
            >
              <Ionicons
                name={option.icon}
                size={20}
                color={resolveColor(option)}
              />
              <Text
                style={[styles.optionLabel, { color: resolveColor(option) }]}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
};

export default SingleEventSettings;

const createStyles = (colors) =>
  StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFill,
      backgroundColor: "rgba(0, 0, 0, 0.65)",
      justifyContent: "flex-start",
      paddingTop: verticalScale(100),
      alignItems: "center",
      zIndex: 80,
    },
    container: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: BORDER_RADIUS.md,
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.md,
      borderWidth: 1,
      borderColor: colors.border,
      minWidth: scale(260),
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 10,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
      marginBottom: SPACING.md,
      paddingBottom: SPACING.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerText: {
      color: colors.primaryText,
      fontSize: scaleFont(15, 0.35),
      fontFamily: "BarlowCondensed-ExtraBold",
    },
    optionButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.md,
      paddingVertical: SPACING.sm,
      paddingHorizontal: SPACING.sm,
      borderRadius: BORDER_RADIUS.sm,
    },
    optionButtonPressed: {
      backgroundColor: colors.background,
    },
    optionLabel: {
      fontSize: scaleFont(13, 0.3),
      fontFamily: "Inter-Regular",
    },
  });
