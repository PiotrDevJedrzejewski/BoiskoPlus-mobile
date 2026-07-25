import React, { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  useWindowDimensions,
} from "react-native";
import { useRouter, usePathname } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useSocketStore,
  selectTotalUnreadMessages,
} from "../context/socketStore";
import { dbg } from "../assets/utils/debugLogger";
import Svg, { Path } from "react-native-svg";
import {
  scale,
  verticalScale,
  moderateScale,
  scaleFont,
} from "../Theme/ScalableStyles";

import { useThemedStyles } from "../context/themeStore";

// Layout constants (design spec)
const TAB_BAR_HEIGHT = 64;
const NOTCH_RADIUS = 44;
const NOTCH_DEPTH = 18;
const FLOATING_BUTTON_SIZE = 64;
const BUTTON_RADIUS = 32;
const ICON_SIZE = 22;
const PLUS_ICON_SIZE = 28;
const PADDING_HORIZONTAL = 24;
const BUTTON_CLEARANCE = 41; // px odstępu między krawędzią przycisku a krawędzią wcięcia

// Builds the notch path for a given track width
const buildBackgroundPath = (width, height) => {
  const centerX = width / 2;
  const half = FLOATING_BUTTON_SIZE / 2 + BUTTON_CLEARANCE; // promień przycisku + zapas
  return `
M0 26
Q0 0 26 0
H${centerX - half}
C${centerX - half + 22} 0 ${centerX - half + 30} 8 ${centerX - half + 38} 22
C${centerX - half + 46} 42 ${centerX - half + 54} 48 ${centerX} 48
C${centerX + half - 54} 48 ${centerX + half - 46} 42 ${centerX + half - 38} 22
C${centerX + half - 30} 8 ${centerX + half - 22} 0 ${centerX + half} 0
H${width - 26}
Q${width} 0 ${width} 26
V${height}
H0
Z
`;
};

// Custom TabBar as absolute overlay
const CustomTabBar = React.memo(function CustomTabBar() {
  dbg("CustomTabBar");
  const { styles, colors } = useThemedStyles(createStyles);

  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const totalUnreadMessages = useSocketStore(selectTotalUnreadMessages);

  // Hide tab bar on chat-room screen
  const hidden = pathname.includes("chat-room");

  const handlePress = useCallback(
    (path) => {
      router.navigate(`/(auth)/${path}`);
    },
    [router],
  );

  const isTabActive = useCallback(
    (match) => {
      return pathname.includes(match);
    },
    [pathname],
  );

  const handleAddPress = useCallback(() => {
    handlePress("add-event");
  }, [handlePress]);

  const startActive = isTabActive("dashboard-home");
  const mapActive = isTabActive("show-map");
  const findEventActive = isTabActive("find-event");
  const chatActive = isTabActive("chat");

  if (hidden) return null;

  const barHeight = TAB_BAR_HEIGHT + insets.bottom;
  const pathHeight = TAB_BAR_HEIGHT;

  return (
    <View style={[styles.tabBar, { height: barHeight }]}>
      <View style={[styles.bottomBackground, { height: insets.bottom }]} />
      <Svg width={width} height={pathHeight} style={styles.svgBackground}>
        <Path
          d={buildBackgroundPath(width, pathHeight)}
          fill={colors.backgroundSecondary}
        />
      </Svg>

      <View style={styles.row}>
        <Pressable
          style={styles.tabItem}
          onPress={() => handlePress("dashboard-home")}
        >
          <Ionicons
            name={startActive ? "home" : "home-outline"}
            size={ICON_SIZE}
            color={startActive ? colors.primaryText : colors.thirdText}
          />
          <Text
            style={[
              styles.tabLabel,
              { color: startActive ? colors.primaryText : colors.thirdText },
            ]}
          >
            Start
          </Text>
        </Pressable>

        <Pressable
          style={styles.tabItem}
          onPress={() => handlePress("find-event")}
        >
          <Ionicons
            name={findEventActive ? "calendar" : "calendar-outline"}
            size={ICON_SIZE}
            color={findEventActive ? colors.primaryText : colors.thirdText}
          />
          <Text
            style={[
              styles.tabLabel,
              {
                color: findEventActive ? colors.primaryText : colors.thirdText,
              },
            ]}
          >
            Wydarzenia
          </Text>
        </Pressable>

        {/* Spacer for the floating center button */}
        <View style={styles.centerSpacer} />

        <Pressable
          style={styles.tabItem}
          onPress={() => handlePress("show-map")}
        >
          <Ionicons
            name={mapActive ? "football" : "football-outline"}
            size={ICON_SIZE}
            color={mapActive ? colors.primaryText : colors.thirdText}
          />
          <Text
            style={[
              styles.tabLabel,
              { color: mapActive ? colors.primaryText : colors.thirdText },
            ]}
          >
            MAPA
          </Text>
        </Pressable>

        <Pressable style={styles.tabItem} onPress={() => handlePress("chat")}>
          <View>
            <Ionicons
              name={chatActive ? "chatbubbles" : "chatbubbles-outline"}
              size={ICON_SIZE}
              color={chatActive ? colors.primaryText : colors.thirdText}
            />
            {totalUnreadMessages > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {totalUnreadMessages > 9 ? "9+" : totalUnreadMessages}
                </Text>
              </View>
            )}
          </View>
          <Text
            style={[
              styles.tabLabel,
              { color: chatActive ? colors.primaryText : colors.thirdText },
            ]}
          >
            Czat
          </Text>
        </Pressable>
      </View>

      <Pressable style={styles.floatingButtonWrapper} onPress={handleAddPress}>
        <View style={styles.floatingButton}>
          <Ionicons name="add" size={PLUS_ICON_SIZE} color="#171B20" />
        </View>
      </Pressable>
    </View>
  );
});

export default CustomTabBar;

const createStyles = (colors) =>
  StyleSheet.create({
    tabBar: {
      width: "100%",
      backgroundColor: "transparent",
    },
    svgBackground: {
      position: "absolute",
      top: 0,
      left: 0,
      zIndex: 10,
    },
    bottomBackground: {
      position: "absolute",
      bottom: 0,
      left: 0,
      width: "100%",
      backgroundColor: "#000",
      zIndex: 5,
    },

    row: {
      flexDirection: "row",
      paddingTop: 8,
      zIndex: 20,
    },
    tabItem: {
      flex: 1,
      width: 72,
      alignItems: "center",
      justifyContent: "center",
    },
    centerSpacer: {
      width: 72,
    },
    tabLabel: {
      fontFamily: "ObjectFont",
      fontSize: scaleFont(11, 0.35),
      marginTop: 6,
    },
    floatingButtonWrapper: {
      position: "absolute",
      top: -(FLOATING_BUTTON_SIZE - NOTCH_DEPTH) / 2,
      left: "50%",
      marginLeft: -FLOATING_BUTTON_SIZE / 2,
      width: FLOATING_BUTTON_SIZE,
      height: FLOATING_BUTTON_SIZE,
      zIndex: 100,
    },
    floatingButton: {
      width: FLOATING_BUTTON_SIZE,
      height: FLOATING_BUTTON_SIZE,
      borderRadius: BUTTON_RADIUS,
      backgroundColor: colors.PrimaryGreen,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "rgba(0,0,0,.45)",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 12,
      elevation: 18,
    },
    badge: {
      position: "absolute",
      right: -6,
      top: -3,
      backgroundColor: colors.Danger,
      borderRadius: 8,
      width: 16,
      height: 16,
      justifyContent: "center",
      alignItems: "center",
    },
    badgeText: {
      color: "#fff",
      fontSize: 10,
      fontWeight: "bold",
    },
  });
