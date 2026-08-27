import { useCallback, useEffect, useMemo } from "react";
import {
  BackHandler,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import {
  useSocketStore,
  selectTotalUnreadMessages,
} from "../../context/socketStore";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useThemedStyles } from "../../context/themeStore";
import { SPACING, BORDER_RADIUS } from "../../Theme/StyleConstants";
import {
  scale,
  verticalScale,
  moderateScale,
  scaleFont,
} from "../../Theme/ScalableStyles";

const ANIMATION_DURATION = 200;

const QuickNavModal = ({ visible, onClose }) => {
  const router = useRouter();

  const insets = useSafeAreaInsets();
  const { styles, colors } = useThemedStyles(createStyles);

  const unreadFriendRequestsCount = useSocketStore(
    (s) => s.unreadFriendRequestsCount,
  );
  const unreadEventsCount = useSocketStore((s) => s.unreadEventsCount);
  const unreadInvitesCount = useSocketStore((s) => s.unreadInvitesCount);
  const totalUnreadMessages = useSocketStore(selectTotalUnreadMessages);

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

  const navigate = useCallback(
    (path) => {
      onClose();
      router.push(path);
    },
    [onClose, router],
  );

  const buttons = [
    {
      key: "friends",
      label: "Znajomi",
      icon: "people",
      count: unreadFriendRequestsCount,
      path: "/(auth)/friends",
    },
    {
      key: "events",
      label: "Eventy",
      icon: "calendar",
      count: unreadEventsCount + unreadInvitesCount,
      path: "/(auth)/events-managment/events-dashboard",
    },
    {
      key: "chat",
      label: "Chat",
      icon: "chatbubbles",
      count: totalUnreadMessages,
      path: "/(auth)/chat",
    },
  ];

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

  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      animationType="none"
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
    >
      <GestureDetector gesture={backdropTap}>
        <Animated.View style={[styles.overlay, overlayAnimatedStyle]}>
          <Animated.View
            style={[
              styles.container,
              containerAnimatedStyle,
              { marginTop: SPACING.md + insets.top },
            ]}
          >
            {/* Header label */}
            <View style={styles.header}>
              <Ionicons
                name="notifications"
                size={18}
                color={colors.secondaryText}
              />
              <Text style={styles.headerText}>Powiadomienia</Text>
            </View>

            {/* Buttons row */}
            <View style={styles.buttonsRow}>
              {buttons.map((btn) => (
                <View key={btn.key} style={styles.buttonWrapper}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.roundButton,
                      pressed && styles.roundButtonPressed,
                    ]}
                    onPress={() => navigate(btn.path)}
                    android_ripple={{
                      color: colors.backgroundSecondary,
                      borderless: false,
                    }}
                  >
                    <Ionicons
                      name={btn.icon}
                      size={26}
                      color={colors.primaryText}
                    />
                    {/* Badge - position absolute top-right */}
                    {btn.count > 0 && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>
                          {btn.count > 9 ? "9+" : btn.count}
                        </Text>
                      </View>
                    )}
                  </Pressable>
                  <Text style={styles.buttonLabel}>{btn.label}</Text>
                </View>
              ))}
            </View>
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </Modal>
  );
};

export default QuickNavModal;

const createStyles = (colors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.65)",
      justifyContent: "flex-start",
      alignItems: "flex-end",
      zIndex: 80,
    },
    container: {
      marginRight: SPACING.md,
      backgroundColor: colors.backgroundSecondary,
      borderRadius: BORDER_RADIUS.md,
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.md,
      borderWidth: 1,
      borderColor: colors.border,
      minWidth: scale(240),
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
    buttonsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: SPACING.sm,
    },
    buttonWrapper: {
      alignItems: "center",
      gap: SPACING.xs,
    },
    roundButton: {
      width: scale(58),
      height: scale(58),
      borderRadius: scale(29),
      backgroundColor: colors.background,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    roundButtonPressed: {
      backgroundColor: colors.backgroundSecondary,
    },
    buttonLabel: {
      color: colors.primaryText,
      fontSize: scaleFont(11, 0.3),
      fontFamily: "BarlowCondensed-Bold",
      textAlign: "center",
    },
    badge: {
      position: "absolute",
      top: -4,
      right: -4,
      backgroundColor: colors.Danger,
      borderRadius: BORDER_RADIUS.xxl,
      minWidth: scale(18),
      height: scale(18),
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: SPACING.xs,
    },
    badgeText: {
      color: "#fff",
      fontSize: scaleFont(10, 0.25),
      fontFamily: "BarlowCondensed-Bold",
    },
  });
