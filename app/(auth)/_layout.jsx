import React from "react";
import { View, StyleSheet } from "react-native";
import { Stack, Redirect } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { SocketIoProvider } from "../../context/SocketIoContext";
import { NotificationProvider } from "../../context/NotificationContext";
import { DashboardProvider } from "../../context/DashboardContext";
import { FriendshipProvider } from "../../context/FriendshipContext";
import { DrawerProvider } from "../../context/DrawerContext";
import { useMapManager } from "../../context/useMapManager";
import NetworkGuard from "../../components/NetworkGuard";
import { dbg, useDebugMount } from "../../assets/utils/debugLogger";

import { useThemedStyles } from "../../context/themeStore";

// Overlays
import HeaderDrawer from "../../Navigation/HeaderDrawer";
import CustomTabBar from "../../Navigation/CustomTabBar";
import DrawerModal from "../../Navigation/DrawerModal";

const AuthLayout = () => {
  dbg("AuthLayout");
  useDebugMount("AuthLayout");
  const { user, isAuthChecked } = useAuth();

  // Bootstrap lokalizacji (systemowy dialog o uprawnienia + odczyt/zapis
  // lokalizacji). Musi żyć na poziomie całego drzewa (auth), a nie tylko
  // w show-map.jsx — inaczej dialog pojawia się dopiero po wejściu na mapę.
  useMapManager();

  const { styles } = useThemedStyles(createStyles);

  // Auth guard — redirect to home if not authenticated
  if (isAuthChecked && !user) {
    return <Redirect href="/" />;
  }

  return (
    <NotificationProvider>
      <SocketIoProvider>
        <DashboardProvider>
          <FriendshipProvider>
            <DrawerProvider>
              <NetworkGuard>
                <View style={styles.container}>
                  {/* Header at top */}
                  <HeaderDrawer />

                  {/* Stack content fills the middle */}
                  <View style={styles.content}>
                    <Stack
                      screenOptions={{
                        headerShown: false,
                        gestureEnabled: false,
                        contentStyle: { backgroundColor: "transparent" },
                        animation: "slide_from_right",
                      }}
                    >
                      <Stack.Screen
                        name="dashboard-home"
                        options={{ animation: "none" }}
                      />
                      <Stack.Screen
                        name="show-map"
                        options={{ animation: "none" }}
                      />
                      <Stack.Screen name="find-event" />
                      <Stack.Screen
                        name="chat"
                        options={{ animation: "none" }}
                      />
                      <Stack.Screen
                        name="chat-room"
                        options={{ animation: "slide_from_right" }}
                      />
                    </Stack>
                  </View>

                  {/* TabBar at bottom — always visible */}

                  <View style={styles.tabBar}>
                    <CustomTabBar />
                  </View>
                  {/* Drawer overlay — on top of everything */}
                  <DrawerModal />
                </View>
              </NetworkGuard>
            </DrawerProvider>
          </FriendshipProvider>
        </DashboardProvider>
      </SocketIoProvider>
    </NotificationProvider>
  );
};

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      position: "relative",
      backgroundColor: colors.background,
    },
    tabBar: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      // gap filler
      transform: [{ scaleX: 1.01 }],
    },
    content: {
      flex: 1,
    },
  });

export default AuthLayout;
