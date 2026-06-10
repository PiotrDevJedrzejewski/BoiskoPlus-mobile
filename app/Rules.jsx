import { useMemo, useState } from 'react'
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native'
import { COLORS } from '../constants/colors'
import { useResponsiveScale } from '../assets/utils/scaleUI.UX'
import { dbg, useDebugMount } from '../assets/utils/debugLogger'
import { regulaminSections, regulaminMeta } from '../assets/data/regulaminData'
import { cookiesSections, cookiesMeta } from '../assets/data/cookiesData'
import { privacySections, privacyMeta } from '../assets/data/privacyData'

const TABS = [
  { label: 'Regulamin', sections: regulaminSections, meta: regulaminMeta },
  { label: 'Prywatność', sections: privacySections, meta: privacyMeta },
  { label: 'Cookies', sections: cookiesSections, meta: cookiesMeta },
]

const Rules = () => {
  dbg('RulesScreen')
  useDebugMount('RulesScreen')
  const ui = useResponsiveScale()
  const styles = useMemo(() => createStyles(ui), [ui])
  const [activeTab, setActiveTab] = useState(0)

  const { sections, meta } = TABS[activeTab]

  return (
    <ScrollView style={styles.rulesContainer}>
      <View style={styles.rulesContent}>
        <View style={styles.tabRow}>
          {TABS.map((tab, index) => (
            <TouchableOpacity
              key={tab.label}
              style={[styles.tabButton, activeTab === index && styles.tabButtonActive]}
              onPress={() => setActiveTab(index)}
              activeOpacity={0.75}
            >
              <Text style={[styles.tabButtonText, activeTab === index && styles.tabButtonTextActive]}>
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
              <Text key={p} style={styles.paragraph}>{p}</Text>
            ))}

            {section.items?.map((item) => (
              <View key={item} style={styles.itemRow}>
                <Text style={styles.bullet}>{'\u2022'}</Text>
                <Text style={styles.itemText}>{item}</Text>
              </View>
            ))}

            {section.paragraphsAfter?.map((p) => (
              <Text key={p} style={styles.paragraph}>{p}</Text>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  )
}

export default Rules

const createStyles = (ui) => StyleSheet.create({
  rulesContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  rulesContent: {
    padding: ui.spacing(20, 0.45),
    paddingBottom: ui.verticalScale(40),
  },
  tabRow: {
    flexDirection: 'row',
    marginBottom: ui.verticalScale(24),
    gap: ui.spacing(8, 0.4),
  },
  tabButton: {
    flex: 1,
    paddingVertical: ui.verticalScale(8),
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.third,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.secondary,
  },
  tabButtonText: {
    fontSize: ui.scaleFont(13, 0.35),
    fontFamily: 'Montserrat-Bold',
    color: COLORS.primary,
  },
  tabButtonTextActive: {
    color: COLORS.background,
  },
  title: {
    fontSize: ui.scaleFont(28, 0.45),
    fontFamily: 'Montserrat-Bold',
    color: COLORS.secondary,
    marginBottom: ui.verticalScale(8),
    textAlign: 'center',
  },
  subtitle: {
    fontSize: ui.scaleFont(12, 0.35),
    fontFamily: 'Montserrat-Italic',
    color: COLORS.secondary,
    marginBottom: ui.verticalScale(24),
    textAlign: 'center',
    opacity: 0.8,
  },
  section: {
    marginBottom: ui.verticalScale(20),
  },
  sectionTitle: {
    fontSize: ui.scaleFont(15, 0.35),
    fontFamily: 'Montserrat-Bold',
    color: COLORS.secondary,
    marginBottom: ui.verticalScale(8),
  },
  paragraph: {
    fontSize: ui.scaleFont(13, 0.35),
    fontFamily: 'Lato-Regular',
    color: COLORS.primary,
    lineHeight: ui.verticalScale(21),
    marginBottom: ui.verticalScale(8),
    textAlign: 'justify',
  },
  itemRow: {
    flexDirection: 'row',
    marginBottom: ui.verticalScale(6),
    paddingLeft: ui.spacing(4, 0.4),
  },
  bullet: {
    fontSize: ui.scaleFont(13, 0.35),
    color: COLORS.secondary,
    marginRight: ui.spacing(6, 0.4),
    lineHeight: ui.verticalScale(21),
  },
  itemText: {
    flex: 1,
    fontSize: ui.scaleFont(13, 0.35),
    fontFamily: 'Lato-Regular',
    color: COLORS.primary,
    lineHeight: ui.verticalScale(21),
    textAlign: 'justify',
  },
})
