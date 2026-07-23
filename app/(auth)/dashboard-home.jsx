import { useState, useEffect, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import AntDesign from "@expo/vector-icons/AntDesign";

import { LinearGradient } from "expo-linear-gradient";
import { dbg, useDebugMount } from "../../assets/utils/debugLogger";
import { useAuth } from "../../context/AuthContext";
import { useDashboard } from "../../context/DashboardContext";
import { fetchNearbyEvents } from "../../assets/utils/eventsApi";
import {
  formatEventDateLabel,
  getEventTitle,
  getEventOccupancy,
  buildUserStatusMap,
} from "../../assets/utils/eventDisplay";

import { useThemedStyles } from "../../context/themeStore";
import { SPACING, BORDER_RADIUS } from "../../Theme/StyleConstants";
import {
  scale,
  verticalScale,
  moderateScale,
  scaleFont,
} from "../../Theme/ScalableStyles";
import BottomSpacer from "../../components/BottomSpacer";

import DashboardProfileBG from "../../assets/images/V2/DBProfileBG.png";
import RecommendCardBG from "../../assets/images/V2/IMG_2313.png";
import PlaceCard from "../../components/Cards/PlaceCard";
import EventSimpleCard from "../../components/Cards/EventSimpleCard";

const DashboardHome = () => {
  dbg("DashboardHomeScreen");
  useDebugMount("DashboardHomeScreen");
  const router = useRouter();

  const { styles, colors } = useThemedStyles(createStyles);

  const { consents, getSavedLocation } = useAuth();
  const { eventsData } = useDashboard();
  const [featuredEvent, setFeaturedEvent] = useState(null);
  const [nearbyEvents, setNearbyEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  useEffect(() => {
    let isActive = true;

    const loadNearbyEvents = async () => {
      if (!consents.locationAccepted) {
        if (isActive) setLoadingEvents(false);
        return;
      }

      const result = await getSavedLocation();
      if (!isActive) return;

      if (!result?.success || !result.location) {
        setLoadingEvents(false);
        return;
      }

      try {
        const data = await fetchNearbyEvents({
          latitude: result.location.latitude,
          longitude: result.location.longitude,
          City: result.location.City,
          region: result.location.region,
          Country: result.location.Country || "Poland",
          distance: 25,
          limit: 4,
        });
        if (!isActive) return;

        const events = data?.events || [];
        setFeaturedEvent(events[0] || null);
        setNearbyEvents(events.slice(1));
      } catch (err) {
        console.error("Błąd pobierania pobliskich wydarzeń:", err);
      } finally {
        if (isActive) setLoadingEvents(false);
      }
    };

    loadNearbyEvents();

    return () => {
      isActive = false;
    };
  }, [consents.locationAccepted, getSavedLocation]);

  const featuredOccupancy = featuredEvent
    ? getEventOccupancy(featuredEvent)
    : null;
  const statusMap = useMemo(
    () => buildUserStatusMap(eventsData.userEvents),
    [eventsData.userEvents],
  );

  const goToEvent = (id) => router.push(`/(auth)/single-event?id=${id}`);
  const goToFind = () => router.push("/(auth)/find-event");

  return (
    <ScrollView style={styles.container}>
      {/* Level card */}
      <View style={styles.LevelCard}>
        <Image
          source={DashboardProfileBG}
          style={styles.LevelCard_backgroundImage}
        />
        <View style={styles.LevelCard_section}>
          <View>
            <View style={styles.LevelCard_section_header}>
              <Text style={styles.LevelCard_section_header_textTitle}>
                CZEŚĆ,
              </Text>
              <Text style={styles.LevelCard_section_header_textNickname}>
                LEGENDA!
              </Text>
            </View>
            <Text style={styles.LevelCard_section_header_textSubtitle}>
              Gotowy na dzisiejszy mecz?
            </Text>
          </View>
          <View style={styles.LevelCard_section_header_level}>
            <Text style={styles.LevelCard_section_header_level_text}>
              Poziom
            </Text>
            <Text style={styles.LevelCard_section_header_level_number}>
              LVL 12
            </Text>
          </View>
        </View>
        {/* fill bar */}
        <View style={styles.LevelCard_fillBar}>
          <Text
            style={[
              styles.LevelCard_section_header_textTitle,
              { paddingLeft: SPACING.md },
            ]}
          >
            1540 PKT
          </Text>
          {/* custom component */}
          <View style={styles.LevelCard_fillBar_custom}></View>
        </View>
      </View>

      {/* Stats card */}
      <View style={styles.StatsCard}>
        <View style={[styles.StatsCard_section]}>
          <FontAwesome5 name="trophy" size={12} color={colors.PrimaryGreen} />
          <Text style={styles.StatsCard_section_text}>14 GIER</Text>
        </View>
        <View style={[styles.StatsCard_section]}>
          <FontAwesome5 name="trophy" size={12} color={colors.PrimaryGreen} />
          <Text style={styles.StatsCard_section_text}>100 ZAGRANYCH</Text>
        </View>
        <View style={styles.StatsCard_section}>
          <FontAwesome5 name="trophy" size={12} color={colors.PrimaryGreen} />
          <Text style={styles.StatsCard_section_text}>6 DNI SERII</Text>
        </View>
      </View>

      {/* Recommend card (najbliższe wydarzenie = proponowane) */}
      {featuredEvent ? (
        <Pressable
          style={styles.RecommendCard}
          onPress={() => goToEvent(featuredEvent._id)}
        >
          <Image
            source={RecommendCardBG}
            style={styles.RecommendCard_backgroundImage}
          />
          <View style={styles.RecommendCard_wrapper}>
            <View style={styles.RecommendCard_date}>
              <AntDesign
                name="clock-circle"
                size={14}
                color={colors.PrimaryGreen}
              />
              <Text style={styles.RecommendCard_date_text}>
                {formatEventDateLabel(featuredEvent)}
              </Text>
            </View>
            <View style={styles.RecommendCard_title}>
              <Text style={styles.RecommendCard_title_text} numberOfLines={2}>
                {getEventTitle(featuredEvent).toUpperCase()}
              </Text>
            </View>
            <View style={styles.RecommendCard_Players}>
              <Ionicons name="person" size={14} color={colors.PrimaryGreen} />
              <Text style={styles.RecommendCard_Players_text}>
                {featuredOccupancy.current}/{featuredOccupancy.max} GRACZY
              </Text>
            </View>
            <View style={styles.RecommendCard_location}>
              <Ionicons name="location" size={14} color={colors.PrimaryGreen} />
              <Text
                style={styles.RecommendCard_location_text}
                numberOfLines={1}
              >
                {(featuredEvent.addressString || "").toUpperCase()}
              </Text>
            </View>
            <View style={styles.RecommendCard_button}>
              <Pressable
                style={styles.RecommendCard_pressable}
                onPress={() => goToEvent(featuredEvent._id)}
              >
                <Text style={styles.RecommendCard_button_text}>DOŁACZ!</Text>
                <AntDesign
                  name="arrow-right"
                  size={12}
                  color="black"
                  style={styles.RecommendCard_button_icon}
                />
              </Pressable>
            </View>
          </View>
        </Pressable>
      ) : (
        !loadingEvents && (
          <Pressable
            style={[styles.RecommendCard, styles.RecommendCard_empty]}
            onPress={goToFind}
          >
            <Ionicons
              name="calendar-outline"
              size={40}
              color={colors.Placeholder}
            />
            <Text style={styles.RecommendCard_empty_text}>
              Brak proponowanych wydarzeń w pobliżu
            </Text>
            <Text style={styles.RecommendCard_empty_cta}>ZNAJDŹ MECZ ►</Text>
          </Pressable>
        )
      )}
      {/* Navigation Boxes */}
      <View style={styles.NavigationBoxes}>
        <Text style={styles.NavigationBoxes_title}>SZYBKIE AKCJE</Text>
        <View style={styles.NavigationBoxes_buttonsWrapper}>
          <LinearGradient
            colors={[colors.backgroundSecondary, "#000"]}
            style={styles.NavigationBoxes_button}
          >
            <AntDesign
              name="arrow-right"
              size={18}
              color={colors.PrimaryGreen}
              style={styles.NavigationBoxes_button_icon}
            />
            <Text style={styles.NavigationBoxes_button_text}>ZNAJDŹ</Text>
            <Text style={styles.NavigationBoxes_button_text}>MECZ</Text>
          </LinearGradient>
          <LinearGradient
            colors={[colors.backgroundSecondary, "#000"]}
            style={styles.NavigationBoxes_button}
          >
            <AntDesign
              name="arrow-right"
              size={18}
              color={colors.PrimaryGreen}
              style={styles.NavigationBoxes_button_icon}
            />
            <Text style={styles.NavigationBoxes_button_text}>STWÓRZ </Text>
            <Text style={styles.NavigationBoxes_button_text}>WYDARZENIE</Text>
          </LinearGradient>
          <LinearGradient
            colors={[colors.backgroundSecondary, "#000"]}
            style={styles.NavigationBoxes_button}
          >
            <AntDesign
              name="arrow-right"
              size={18}
              color={colors.PrimaryGreen}
              style={styles.NavigationBoxes_button_icon}
            />
            <Text style={styles.NavigationBoxes_button_text}>RANKING</Text>
          </LinearGradient>
          <LinearGradient
            colors={[colors.backgroundSecondary, "#000"]}
            style={styles.NavigationBoxes_button}
          >
            <AntDesign
              name="arrow-right"
              size={18}
              color={colors.PrimaryGreen}
              style={styles.NavigationBoxes_button_icon}
            />
            <Text style={styles.NavigationBoxes_button_text}>STATYSTYKI</Text>
          </LinearGradient>
        </View>
      </View>
      {/* Nadchodzące wydarzenia w pobliżu */}
      <View style={styles.NearEvent}>
        <View style={styles.NearEvent_titleWrapper}>
          <Text style={styles.NearEvent_title}>NADCHODZĄCE WYDARZENIA</Text>
          <Pressable onPress={goToFind}>
            <Text style={styles.NearEvent_title_more}>ZOBACZ WIĘCEJ ►</Text>
          </Pressable>
        </View>

        {nearbyEvents.length > 0
          ? nearbyEvents.map((event) => (
              <EventSimpleCard
                key={event._id}
                event={event}
                myStatus={statusMap[event._id]}
                onPress={() => goToEvent(event._id)}
              />
            ))
          : !loadingEvents && (
              <Text style={styles.NearEvent_empty}>
                Brak nadchodzących wydarzeń w okolicy
              </Text>
            )}
      </View>
      {/* 3 close obiekts */}
      {/* <View style={styles.CloseObiekts} /> */}
      <View style={styles.NearEvent}>
        <View style={styles.NearEvent_titleWrapper}>
          <Text style={styles.NearEvent_title}>OBIEKTY W OKOLICY</Text>
          <Text style={styles.NearEvent_title_more}>MAPA ►</Text>
        </View>

        <PlaceCard
          type="Orlik"
          name="Orlik Centrum"
          rating={2.3}
          address="Mszczonowska 2137"
          geoDistance={1.2}
        />
        <PlaceCard
          type="Orlik"
          name="Orlik Centrum"
          rating={3.7}
          address="Mszczonowska 2137"
          geoDistance={1.2}
        />
        <PlaceCard
          type="Orlik"
          name="Orlik Centrum"
          rating={4.5}
          address="Mszczonowska 2137"
          geoDistance={1.2}
        />
        <BottomSpacer />
      </View>
    </ScrollView>
  );
};

export default DashboardHome;

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: SPACING.md,
    },

    LevelCard: {
      borderRadius: BORDER_RADIUS.lg,
      position: "relative",
    },
    LevelCard_backgroundImage: {
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      resizeMode: "cover",
      borderRadius: BORDER_RADIUS.lg,
      zIndex: 1,
      borderWidth: 1,
      borderColor: colors.border,
    },
    LevelCard_section: {
      flex: 1,
      flexDirection: "row",
      justifyContent: "space-between",
      zIndex: 2,
    },
    LevelCard_section_header: {
      flexDirection: "row",
      alignItems: "center",
      paddingLeft: SPACING.md,
      marginTop: SPACING.md,
    },
    LevelCard_section_header_textTitle: {
      fontSize: scaleFont(16),
      color: colors.primaryText,
      marginLeft: SPACING.md,
    },
    LevelCard_section_header_textNickname: {
      fontSize: scaleFont(16),
      color: colors.PrimaryGreen,
      fontWeight: "bold",
      marginLeft: SPACING.sm,
    },
    LevelCard_section_header_textSubtitle: {
      fontSize: scaleFont(14),
      color: colors.secondaryText,
      marginLeft: SPACING.md,
      paddingLeft: SPACING.md,
    },
    LevelCard_section_header_level: {
      paddingRight: SPACING.md,
      marginTop: SPACING.md,
    },
    LevelCard_section_header_level_text: {
      fontSize: scaleFont(14),
      color: colors.secondaryText,
    },
    LevelCard_section_header_level_number: {
      fontSize: scaleFont(16),
      color: colors.PrimaryGreen,
      fontWeight: "bold",
    },

    LevelCard_fillBar: {
      borderRadius: BORDER_RADIUS.sm,
      marginTop: SPACING.md,
      marginBottom: SPACING.md,

      zIndex: 2,
    },
    LevelCard_fillBar_custom: {
      alignSelf: "center",
      height: 5,
      width: "86%",
      marginTop: SPACING.sm,
      backgroundColor: colors.PrimaryGreen,
      borderRadius: BORDER_RADIUS.sm,
    },

    StatsCard: {
      borderRadius: BORDER_RADIUS.lg,
      borderWidth: 1,
      borderColor: colors.border,
      marginTop: SPACING.md,
      marginBottom: SPACING.md,
      paddingTop: SPACING.md,
      paddingBottom: SPACING.md,
      flexDirection: "row",
      justifyContent: "space-between",
    },
    StatsCard_section: {
      flex: 1,
      flexDirection: "row",
      gap: SPACING.sm,
      alignItems: "center",
      justifyContent: "center",
    },
    StatsCard_section_text: {
      fontSize: scaleFont(12),
      color: colors.primaryText,
    },

    RecommendCard: {
      flex: 1,
      position: "relative",
      overflow: "hidden",
      height: moderateScale(300),
      borderRadius: BORDER_RADIUS.lg,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: SPACING.md,
    },
    RecommendCard_backgroundImage: {
      position: "absolute",
      width: "100%",
      left: 0,
      height: "100%",
      transform: [{ scale: 1.05 }],
      resizeMode: "cover",
      top: 0,
      borderRadius: BORDER_RADIUS.lg,
      zIndex: 1,
    },

    RecommendCard_wrapper: {
      flex: 1,
      zIndex: 2,
      paddingLeft: SPACING.xl,
      paddingTop: SPACING.xl,
    },
    RecommendCard_date: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
    },
    RecommendCard_date_text: {
      fontSize: scaleFont(14),
      color: colors.PrimaryGreen,
    },
    RecommendCard_title: {
      marginTop: SPACING.sm,
      maxWidth: "80%",
    },
    RecommendCard_title_text: {
      fontSize: scaleFont(28),
      color: colors.primaryText,
      fontFamily: "ObjectFont",
    },
    RecommendCard_Players: {
      marginTop: SPACING.sm,
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
    },
    RecommendCard_Players_text: {
      fontSize: scaleFont(14),
      color: colors.secondaryText,
    },
    RecommendCard_location: {
      marginTop: SPACING.sm,
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
    },
    RecommendCard_location_text: {
      fontSize: scaleFont(14),
      color: colors.secondaryText,
    },
    RecommendCard_button: {
      marginTop: SPACING.xl,
      maxWidth: "70%",
      borderRadius: BORDER_RADIUS.md,
      backgroundColor: colors.PrimaryYellow,
      paddingVertical: SPACING.sm,
    },
    RecommendCard_pressable: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: SPACING.sm,
      justifyContent: "space-evenly",
      alignItems: "center",
    },
    RecommendCard_button_text: {
      fontSize: scaleFont(16),
      color: colors.background,
      fontWeight: "bold",
    },
    RecommendCard_button_icon: {
      alignSelf: "center",
      justifySelf: "flex-end",
    },
    RecommendCard_empty: {
      justifyContent: "center",
      alignItems: "center",
      padding: SPACING.lg,
      gap: SPACING.sm,
      backgroundColor: colors.secondaryCard,
    },
    RecommendCard_empty_text: {
      fontSize: scaleFont(16),
      color: colors.secondaryText,
      textAlign: "center",
    },
    RecommendCard_empty_cta: {
      fontSize: scaleFont(14),
      color: colors.PrimaryGreen,
      fontWeight: "bold",
    },
    NavigationBoxes: {
      flex: 1,
      marginBottom: SPACING.md,
      // backgroundColor: 'red',
    },
    NavigationBoxes_title: {
      fontSize: scaleFont(12),
      color: colors.primaryText,
      fontWeight: "bold",
      marginBottom: SPACING.sm,
    },
    NavigationBoxes_buttonsWrapper: {
      flex: 1,
      flexDirection: "row",
      width: "100%",
      justifyContent: "space-between",
    },
    NavigationBoxes_button: {
      width: "22%",
      borderRadius: BORDER_RADIUS.md,
      paddingVertical: SPACING.sm,
      justifyContent: "flex-start",
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    NavigationBoxes_button_icon: {
      alignSelf: "center",
      marginBottom: SPACING.md,
    },
    NavigationBoxes_button_text: {
      fontSize: scaleFont(10),
      color: colors.primaryText,
      textAlign: "center",
    },

    NearEvent: {
      flex: 1,
      marginTop: SPACING.md,
    },
    NearEvent_titleWrapper: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: SPACING.sm,
    },
    NearEvent_title: {
      fontSize: scaleFont(12),
      color: colors.primaryText,
      fontWeight: "bold",
    },
    NearEvent_title_more: {
      fontSize: scaleFont(10),
      color: colors.PrimaryGreen,
      fontWeight: "bold",
    },
    NearEvent_empty: {
      fontSize: scaleFont(12),
      color: colors.Placeholder,
      paddingVertical: SPACING.md,
      textAlign: "center",
    },
  });
