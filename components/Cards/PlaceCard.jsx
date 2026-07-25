import { StyleSheet, Text, View, Image } from "react-native";
import Entypo from "@expo/vector-icons/Entypo";

import { useThemedStyles } from "../../context/themeStore";
import { SPACING, BORDER_RADIUS } from "../../Theme/StyleConstants";
import { moderateScale, scaleFont } from "../../Theme/ScalableStyles";
import { formatDistanceKm } from "../../assets/utils/geoDistance";

import RecommendCardBG from "../../assets/images/V2/orlik.png";
import SecondaryCardBG from "../../assets/images/V2/hala.png";

const PlaceCard = ({ type, name, address, geoDistance }) => {
  const { styles, colors } = useThemedStyles(createStyles);
  const safeType = type || "orlik";
  const safeName = name || "Miasto";
  const safeAddress = address || "Miasto";
  const distanceLabel = formatDistanceKm(geoDistance) || "0 KM";

  return (
    <View style={styles.place_card}>
      {safeType === "orlik" ? (
        <Image
          source={RecommendCardBG}
          style={styles.place_card_backgroundImage}
        />
      ) : (
        <Image
          source={SecondaryCardBG}
          style={styles.place_card_backgroundImage}
        />
      )}
      <View style={styles.place_card_content}>
        <Text style={styles.place_card_content_date}>{safeType}</Text>
        <Text style={styles.place_card_content_title}>{safeName}</Text>
        <View style={styles.place_card_content_address}>
          <Text style={styles.place_card_content_address_text}>
            {safeAddress}
          </Text>
        </View>
        <View style={styles.place_card_additionalInfo}>
          <Entypo name="location-pin" size={14} color={colors.PrimaryGreen} />
          <Text style={styles.place_card_additionalInfo_text}>
            {distanceLabel}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default PlaceCard;

const createStyles = (colors) =>
  StyleSheet.create({
    place_card: {
      flex: 1,
      position: "relative",
      overflow: "hidden",
      height: moderateScale(80),
      borderRadius: BORDER_RADIUS.lg,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: SPACING.md,
      backgroundColor: colors.secondaryCard,
    },
    place_card_backgroundImage: {
      position: "absolute",
      height: "100%",
      width: "33%",
      left: 0,
      top: 0,
      resizeMode: "cover",
      borderRadius: BORDER_RADIUS.lg,
      zIndex: 1,
    },
    place_card_content: {
      flex: 1,
      marginLeft: "33%",
      padding: SPACING.md,
      justifyContent: "center",
      alignItems: "flex-start",
    },
    place_card_content_date: {
      fontSize: scaleFont(12),
      color: colors.PrimaryGreen,
      textTransform: "capitalize",
    },
    place_card_content_title: {
      fontSize: scaleFont(14),
      color: colors.primaryText,
      fontWeight: "bold",
    },

    place_card_content_address: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
    },
    place_card_content_address_text: {
      fontSize: scaleFont(12),
      color: colors.secondaryText,
    },
    place_card_additionalInfo: {
      position: "absolute",
      right: SPACING.sm,
      bottom: SPACING.sm,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
      gap: SPACING.xs,
    },
    place_card_additionalInfo_text: {
      fontSize: scaleFont(12),
      color: colors.secondaryText,
    },
  });
