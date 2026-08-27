import { StyleSheet, Text, View, Image, Pressable } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import Entypo from "@expo/vector-icons/Entypo";

import { useThemedStyles } from "../../context/themeStore";
import { SPACING, BORDER_RADIUS } from "../../Theme/StyleConstants";
import { scaleFont } from "../../Theme/ScalableStyles";
import {
  formatEventDateLabel,
  formatEventFormat,
  getEventDistanceLabel,
  getEventOccupancy,
  getEventTitle,
  getParticipationBadge,
} from "../../assets/utils/eventDisplay";

import BasketballCardBG from "../../assets/images/V2/basketball.png";
import FootballCardBG from "../../assets/images/V2/football.png";
import OtherCardBG from "../../assets/images/V2/other.png";
import VolleyballCardBG from "../../assets/images/V2/volleyball.png";

const getRecommendCardBackground = (gameType) => {
  switch (gameType) {
    case "basketball":
      return BasketballCardBG;
    case "football":
      return FootballCardBG;
    case "volleyball":
      return VolleyballCardBG;
    default:
      return OtherCardBG;
  }
};

const EventSimpleCard = ({ event, myStatus, onPress, highlighted = false }) => {
  const { styles, colors } = useThemedStyles(createStyles);

  const occupancy = getEventOccupancy(event);
  const distanceLabel = getEventDistanceLabel(event);
  const badge = getParticipationBadge(myStatus);
  const date = formatEventDateLabel(event);

  return (
    <Pressable
      style={[styles.event_card, highlighted && styles.event_card_highlighted]}
      onPress={onPress}
      android_ripple={{ color: colors.GlowGreen }}
    >
      <Image
        source={getRecommendCardBackground(event.gameType)}
        style={styles.event_card_backgroundImage}
      />
      <View style={styles.event_card_status}>
        <Ionicons
          name={badge.icon}
          size={scaleFont(12)}
          color={colors[badge.colorKey]}
        />
        <Text style={styles.event_card_status_text}>{badge.text}</Text>
      </View>
      <View style={styles.event_card_content}>
        {!!date && <Text style={styles.event_card_date}>{date}</Text>}
        <Text style={styles.event_card_titel} numberOfLines={1}>
          {getEventTitle(event)}
        </Text>
        {!!event.address?.city && (
          <Text style={styles.event_card_city} numberOfLines={1}>
            {event.address.city}
          </Text>
        )}
        <View style={styles.event_card_footer}>
          <Ionicons
            name="person-outline"
            size={scaleFont(14)}
            color={colors.PrimaryGreen}
          />
          <Text style={styles.event_card_footer_players}>
            {occupancy.current}/{occupancy.max} Graczy
          </Text>
          {!!distanceLabel && (
            <>
              <Entypo
                name="location-pin"
                size={scaleFont(14)}
                color={colors.PrimaryGreen}
              />
              <Text style={styles.event_card_footer_distance}>
                {distanceLabel}
              </Text>
            </>
          )}
        </View>
      </View>
      <View style={styles.event_card_AdditionalContent}>
        <View style={styles.event_card_format}>
          <Text style={styles.event_card_format_text}>
            {formatEventFormat(event.format)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

export default EventSimpleCard;

const createStyles = (colors) =>
  StyleSheet.create({
    event_card: {
      flex: 1,
      overflow: "hidden",
      borderRadius: BORDER_RADIUS.lg,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: SPACING.md,
      backgroundColor: colors.secondaryCard,
      flexDirection: "row",
      justifyContent: "flex-start",
      position: "relative",
    },
    // Nieprzeczytane powiadomienie dot. eventu — wyróżnienie ramką
    event_card_highlighted: {
      borderColor: colors.StatusOpen,
      borderWidth: 1,
    },
    event_card_backgroundImage: {
      height: "100%",
      width: "33%",
      resizeMode: "cover",
      borderRadius: BORDER_RADIUS.lg,
    },
    event_card_content: {
      padding: SPACING.sm,
      justifyContent: "center",
      alignItems: "flex-start",
      gap: SPACING.xs,
      width: "50%",
    },
    event_card_date: {
      fontSize: scaleFont(12, 0.3),
      color: colors.PrimaryGreen,
    },
    event_card_titel: {
      fontSize: scaleFont(14, 0.35),
      color: colors.primaryText,
      fontFamily: "BarlowCondensed-Bold",
    },
    event_card_city: {
      fontSize: scaleFont(12, 0.3),
      color: colors.Placeholder,
    },
    event_card_footer: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.xs,
      marginTop: SPACING.sm,
    },
    event_card_footer_players: {
      fontSize: scaleFont(10, 0.3),
      color: colors.primaryText,
    },
    event_card_footer_distance: {
      fontSize: scaleFont(10, 0.3),
      color: colors.primaryText,
    },

    event_card_AdditionalContent: {
      width: "17%",
      justifyContent: "flex-end",
    },
    event_card_format: {
      marginRight: SPACING.xs,
      marginBottom: SPACING.sm,
      justifyContent: "center",
      alignItems: "center",
    },
    event_card_format_text: {
      fontSize: scaleFont(10, 0.3),
      color: colors.primaryText,
      backgroundColor: colors.NeutralButton,
      paddingHorizontal: SPACING.sm,
      paddingVertical: SPACING.xs,
      borderRadius: BORDER_RADIUS.xs,
      borderWidth: 1,
      borderColor: colors.border,
    },
    event_card_status: {
      marginRight: SPACING.sm,
      marginTop: SPACING.sm,
      justifyContent: "center",
      alignItems: "center",
      gap: SPACING.xs,
      flexDirection: "row",
      position: "absolute",
      top: 0,
      right: 0,
    },
    event_card_status_text: {
      fontSize: scaleFont(10, 0.3),
      color: colors.primaryText,
      textAlign: "center",
    },
  });
