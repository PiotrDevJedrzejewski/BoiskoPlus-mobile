import { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useThemedStyles } from "../context/themeStore";
import { SPACING, BORDER_RADIUS } from "../Theme/StyleConstants";
import { verticalScale, scaleFont } from "../Theme/ScalableStyles";
import { dbg, useDebugMount } from "../assets/utils/debugLogger";
import { regulaminSections, regulaminMeta } from "../assets/data/regulaminData";
import { cookiesSections, cookiesMeta } from "../assets/data/cookiesData";
import { privacySections, privacyMeta } from "../assets/data/privacyData";

const TABS = [
  { label: "Regulamin", sections: regulaminSections, meta: regulaminMeta },
  { label: "Prywatność", sections: privacySections, meta: privacyMeta },
  { label: "Cookies", sections: cookiesSections, meta: cookiesMeta },
];

const Rules = () => {
  dbg("RulesScreen");
  useDebugMount("RulesScreen");
  const { styles, colors } = useThemedStyles(createStyles);
  const [activeTab, setActiveTab] = useState(0);

  const { sections, meta } = TABS[activeTab];

  return (
    <ScrollView style={styles.rulesContainer}>
      <View style={styles.rulesContent}>
        <View style={styles.tabRow}>
          {TABS.map((tab, index) => (
            <TouchableOpacity
              key={tab.label}
              style={[
                styles.tabButton,
                activeTab === index && styles.tabButtonActive,
              ]}
              onPress={() => setActiveTab(index)}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.tabButtonText,
                  activeTab === index && styles.tabButtonTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.title}>{meta.title}</Text>
        <Text style={styles.subtitle}>{meta.subtitle}</Text>

        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>

            {section.paragraphs?.map((p) => (
              <Text key={p} style={styles.paragraph}>
                {p}
              </Text>
            ))}

            {section.items?.map((item) => (
              <View key={item} style={styles.itemRow}>
                <Text style={styles.bullet}>{"\u2022"}</Text>
                <Text style={styles.itemText}>{item}</Text>
              </View>
            ))}

            {section.paragraphsAfter?.map((p) => (
              <Text key={p} style={styles.paragraph}>
                {p}
              </Text>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

export default Rules;

const createStyles = (colors) =>
  StyleSheet.create({
    rulesContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    rulesContent: {
      padding: SPACING.lg,
      paddingBottom: verticalScale(40),
    },
    tabRow: {
      flexDirection: "row",
      marginBottom: verticalScale(24),
      gap: SPACING.sm,
    },
    tabButton: {
      flex: 1,
      paddingVertical: verticalScale(8),
      borderRadius: BORDER_RADIUS.sm,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
    },
    tabButtonActive: {
      backgroundColor: colors.PrimaryGreen,
      borderColor: colors.PrimaryGreen,
    },
    tabButtonText: {
      fontSize: scaleFont(13, 0.35),
      fontFamily: "Inter-SemiBold",
      color: colors.primaryText,
    },
    tabButtonTextActive: {
      color: colors.background,
    },
    title: {
      fontSize: scaleFont(28, 0.45),
      fontFamily: "BarlowCondensed-ExtraBold",
      color: colors.PrimaryGreen,
      marginBottom: verticalScale(8),
      textAlign: "center",
    },
    subtitle: {
      fontSize: scaleFont(12, 0.35),
      fontFamily: "Inter-Regular",
      color: colors.PrimaryGreen,
      marginBottom: verticalScale(24),
      textAlign: "center",
      opacity: 0.8,
    },
    section: {
      marginBottom: verticalScale(20),
    },
    sectionTitle: {
      fontSize: scaleFont(15, 0.35),
      fontFamily: "BarlowCondensed-Bold",
      color: colors.PrimaryGreen,
      marginBottom: verticalScale(8),
    },
    paragraph: {
      fontSize: scaleFont(13, 0.35),
      fontFamily: "Inter-Regular",
      color: colors.primaryText,
      lineHeight: verticalScale(21),
      marginBottom: verticalScale(8),
      textAlign: "justify",
    },
    itemRow: {
      flexDirection: "row",
      marginBottom: verticalScale(6),
      paddingLeft: SPACING.xs,
    },
    bullet: {
      fontSize: scaleFont(13, 0.35),
      color: colors.PrimaryGreen,
      marginRight: SPACING.xs,
      lineHeight: verticalScale(21),
      fontFamily: "Inter-Regular",
    },
    itemText: {
      flex: 1,
      fontSize: scaleFont(13, 0.35),
      fontFamily: "Inter-Regular",
      color: colors.primaryText,
      lineHeight: verticalScale(21),
      textAlign: "justify",
    },
  });
