import { useState, useEffect } from "react";
import { StyleSheet, Text, View, ScrollView, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../../context/AuthContext";
import { checkSystemLocationPermissions } from "../../assets/utils/getUserLocation";
import { useMapStore } from "../../context/mapStore";
import SettingSection from "../../components/settingsComponents/SettingSection";
import SettingRow from "../../components/settingsComponents/SettingRow";
import { dbg, useDebugMount } from "../../assets/utils/debugLogger";
import BottomSpacer from "../../components/BottomSpacer";

import { useThemedStyles } from "../../context/themeStore";
import { SPACING, BORDER_RADIUS } from "../../Theme/StyleConstants";
import {
  verticalScale,
  moderateScale,
  scaleFont,
} from "../../Theme/ScalableStyles";

const LOCATION_STORAGE_KEY = "bp_user_location_v1";
const LOCATION_THROTTLE_KEY = "last_location_request_time";

const Settings = () => {
  dbg("SettingsScreen");
  useDebugMount("SettingsScreen");
  const router = useRouter();
  const { styles, colors } = useThemedStyles(createStyles);
  const [userLocation, setUserLocation] = useState(null);
  const {
    consents,
    updateConsents,
    systemPermissionsGeo,
    setSystemPermissionsGeo,
    consentsLoading,
  } = useAuth();

  // Load location from AsyncStorage on mount
  useEffect(() => {
    const loadLocation = async () => {
      try {
        const stored = await AsyncStorage.getItem(LOCATION_STORAGE_KEY);
        if (stored) setUserLocation(JSON.parse(stored));
      } catch {}
    };
    loadLocation();
  }, []);

  // Ustawienia powiadomień
  const [chatNotifications, setChatNotifications] = useState(true);
  const [eventNotifications, setEventNotifications] = useState(true);

  // Ustawienia mapy
  const [mapTheme, setMapTheme] = useState("dark"); // 'light' | 'dark'

  // Loading states
  const [isClearing, setIsClearing] = useState(false);

  const handleMapThemeChange = () => {
    Alert.alert("Wybierz motyw mapy", "", [
      {
        text: "Jasny",
        onPress: () => setMapTheme("light"),
      },
      {
        text: "Ciemny",
        onPress: () => setMapTheme("dark"),
      },
      { text: "Anuluj", style: "cancel" },
    ]);
  };

  const handleClearLocation = () => {
    Alert.alert(
      "Usuń lokalizację",
      "Czy na pewno chcesz usunąć zapisaną lokalizację?",
      [
        { text: "Anuluj", style: "cancel" },
        {
          text: "Usuń",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(LOCATION_STORAGE_KEY);
              await AsyncStorage.removeItem(LOCATION_THROTTLE_KEY);
              setUserLocation(null);
              // Zresetuj też źródło prawdy dla mapy/dashboardu, inaczej ekrany
              // dalej pracowałyby na usuniętej lokalizacji do restartu apki.
              useMapStore.getState().clearUserLocation();
              Alert.alert("Sukces", "Lokalizacja została usunięta");
            } catch {
              Alert.alert("Błąd", "Nie udało się usunąć lokalizacji");
            }
          },
        },
      ],
    );
  };

  const handleClearChatHistory = () => {
    Alert.alert(
      "Wyczyść historię czatu",
      "Czy na pewno chcesz usunąć całą historię czatu? Ta operacja jest nieodwracalna.",
      [
        { text: "Anuluj", style: "cancel" },
        {
          text: "Wyczyść",
          style: "destructive",
          onPress: async () => {
            setIsClearing(true);
            // Symulacja API call
            await new Promise((resolve) => setTimeout(resolve, 500));
            setIsClearing(false);
            Alert.alert("Sukces", "Historia czatu została wyczyszczona");
          },
        },
      ],
    );
  };

  const handleReportBug = () => {
    // W przyszłości: ekran zgłaszania błędów
    Alert.alert("Zgłoś błąd", "Funkcja w przygotowaniu");
  };

  const handleOpenRules = () => {
    router.push("/rules");
  };

  const handleMarketingToggle = async (value) => {
    await updateConsents({ marketingAccepted: value });
  };

  const handleLocationToggle = async (value) => {
    if (value) {
      // Użytkownik włącza zgodę - najpierw zaktualizuj naszą zgodę
      await updateConsents({ locationAccepted: true });

      // Następnie sprawdź uprawnienia systemowe
      const result = await checkSystemLocationPermissions({
        consents: { ...consents, locationAccepted: true },
        systemPermissionsGeo,
        setSystemPermissionsGeo,
        updateConsents,
        consentsLoading,
      });

      // Jeśli użytkownik odmówił systemowo, funkcja automatycznie cofa naszą zgodę
      if (!result.success && result.reason === "user_denied") {
        Alert.alert(
          "Brak uprawnień",
          "System blokuje dostęp do lokalizacji. Zgoda została cofnięta.",
        );
      }
    } else {
      // Użytkownik wyłącza zgodę - wystarczy zaktualizować
      await updateConsents({ locationAccepted: false });
    }
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Header */}
      <View style={styles.header}>
        <Ionicons
          name="settings"
          size={moderateScale(26, 0.35)}
          color={colors.PrimaryGreen}
        />
        <Text style={styles.headerText}>Ustawienia</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Motyw mapy */}
        <SettingSection title="Wygląd">
          <SettingRow
            icon="map"
            label="Motyw mapy"
            value={mapTheme === "light" ? "Jasny" : "Ciemny"}
            onPress={handleMapThemeChange}
          />
        </SettingSection>

        {/* Powiadomienia */}
        <SettingSection title="Powiadomienia">
          <SettingRow
            icon="chatbubble"
            label="Powiadomienia czatu"
            isSwitch
            switchValue={chatNotifications}
            onSwitchChange={setChatNotifications}
          />
          <SettingRow
            icon="calendar"
            label="Powiadomienia wydarzeń"
            isSwitch
            switchValue={eventNotifications}
            onSwitchChange={setEventNotifications}
          />
        </SettingSection>

        {/* Prywatność i dane */}
        <SettingSection title="Prywatność i dane">
          <SettingRow
            icon="location-sharp"
            label="Usuń lokalizację"
            onPress={handleClearLocation}
          />

          <View style={styles.locationInfo}>
            <Text style={styles.locationInfoText}>
              Aktualna lokalizacja: {userLocation?.City || "brak"},{" "}
              {userLocation?.Country || ""}
            </Text>
          </View>

          <SettingRow
            icon="navigate"
            label="Zgoda na geolokalizację"
            isSwitch
            switchValue={consents?.locationAccepted || false}
            onSwitchChange={handleLocationToggle}
          />
          <SettingRow
            icon="business"
            label="Zgoda marketingowa"
            isSwitch
            switchValue={consents?.marketingAccepted || false}
            onSwitchChange={handleMarketingToggle}
          />
          <SettingRow
            icon="trash"
            label="Wyczyść historię czatu"
            onPress={handleClearChatHistory}
            danger
          />
        </SettingSection>

        {/* Pomoc */}
        <SettingSection title="Pomoc">
          <SettingRow icon="bug" label="Zgłoś błąd" onPress={handleReportBug} />
          <SettingRow
            icon="document-text"
            label="Regulamin"
            onPress={handleOpenRules}
          />
        </SettingSection>

        {/* Wersja aplikacji */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>BoiskoPlus Mobile v2/.0.0</Text>
        </View>
        <BottomSpacer />
      </ScrollView>
    </View>
  );
};

export default Settings;

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: verticalScale(20),
      backgroundColor: "rgba(0, 0, 0, 0.3)",
    },
    headerText: {
      fontSize: scaleFont(24, 0.45),
      fontFamily: "BarlowCondensed-ExtraBold",
      color: colors.primaryText,
      marginLeft: SPACING.md,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: SPACING.lg,
      paddingBottom: verticalScale(40),
    },
    versionContainer: {
      alignItems: "center",
      marginTop: verticalScale(20),
    },
    versionText: {
      fontSize: scaleFont(12, 0.3),
      fontFamily: "Inter-Regular",
      color: colors.thirdText,
    },
    locationInfo: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: BORDER_RADIUS.md,
      paddingVertical: verticalScale(10),
      paddingHorizontal: SPACING.md,
      marginBottom: verticalScale(8),
      borderWidth: 1,
      borderColor: colors.PrimaryGreen,
    },
    locationInfoText: {
      textAlign: "center",
      fontSize: scaleFont(14, 0.35),
      fontFamily: "Inter-Regular",
      fontStyle: "italic",
      textTransform: "capitalize",
      fontWeight: "bold",
      color: colors.thirdText,
    },
  });
