import { StyleSheet, Text, View, ScrollView } from 'react-native'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { dbg, useDebugMount } from '../../assets/utils/debugLogger'
import BottomSpacer from '../../components/BottomSpacer'

import { useThemedStyles } from '../../context/themeStore'
import { SPACING, BORDER_RADIUS } from '../../Theme/StyleConstants'
import { verticalScale, moderateScale, scaleFont } from '../../Theme/ScalableStyles'

const Premium = () => {
  dbg('PremiumScreen')
  useDebugMount('PremiumScreen')
  const { styles, colors } = useThemedStyles(createStyles)

  return (
    <View style={styles.container} pointerEvents='box-none'>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name='diamond' size={moderateScale(26, 0.35)} color={colors.PrimaryGreen} />
        <Text style={styles.headerText}>Premium</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.comingSoonContainer}>
          <Text style={styles.comingSoonTitle}>Wkrótce dostępne!</Text>

          <MaterialCommunityIcons
            name='tools'
            size={moderateScale(120, 0.35)}
            color={colors.thirdText}
            style={styles.toolsIcon}
          />

          <Text style={styles.comingSoonText}>
            Pracujemy nad dodaniem sklepu do naszej aplikacji. Wkrótce będziesz
            mógł kupować dodatkowe funkcje i ulepszenia, które uczynią Twoje
            doświadczenie jeszcze lepszym!
          </Text>

          {/* Preview funkcji premium */}
          <View style={styles.featuresPreview}>
            <Text style={styles.featuresTitle}>Planowane funkcje:</Text>

            <View style={styles.featureItem}>
              <Ionicons name='star' size={moderateScale(20, 0.35)} color={colors.PrimaryGreen} />
              <Text style={styles.featureText}>Brak reklam</Text>
            </View>

            {/* <View style={styles.featureItem}>
              <Ionicons name='infinite' size={moderateScale(20, 0.35)} color={colors.PrimaryGreen} />
              <Text style={styles.featureText}>
                ,
              </Text>
            </View> */}

            <View style={styles.featureItem}>
              <Ionicons
                name='checkmark-circle'
                size={moderateScale(20, 0.35)}
                color={colors.PrimaryGreen}
              />
              <Text style={styles.featureText}>Odznaka Wspierającego</Text>
            </View>

            <View style={styles.featureItem}>
              <Ionicons name='arrow-up' size={moderateScale(20, 0.35)} color={colors.PrimaryGreen} />
              <Text style={styles.featureText}>Pierwszeństwo w pozycjonowaniu</Text>
            </View>
{/* 
            <View style={styles.featureItem}>
              <Ionicons name='analytics' size={moderateScale(20, 0.35)} color={colors.PrimaryGreen} />
              <Text style={styles.featureText}>,</Text>
            </View> */}
          </View>
        </View>
        <BottomSpacer />
      </ScrollView>
    </View>
  )
}

export default Premium

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(20),
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  headerText: {
    fontSize: scaleFont(24, 0.45),
    fontFamily: 'BarlowCondensed-ExtraBold',
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
  comingSoonContainer: {
    alignItems: 'center',
  },
  comingSoonTitle: {
    fontSize: scaleFont(24, 0.45),
    fontFamily: 'BarlowCondensed-Bold',
    color: colors.primaryText,
    marginBottom: verticalScale(24),
    textAlign: 'center',
  },
  toolsIcon: {
    marginBottom: verticalScale(24),
  },
  comingSoonText: {
    fontSize: scaleFont(16, 0.35),
    fontFamily: 'Inter-Regular',
    color: colors.primaryText,
    textAlign: 'center',
    lineHeight: verticalScale(24),
    marginBottom: verticalScale(32),
    paddingHorizontal: SPACING.sm,
  },
  featuresPreview: {
    width: '100%',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
  },
  featuresTitle: {
    fontSize: scaleFont(18, 0.4),
    fontFamily: 'BarlowCondensed-Bold',
    color: colors.PrimaryGreen,
    marginBottom: verticalScale(16),
    textAlign: 'center',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(12),
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  featureText: {
    fontSize: scaleFont(16, 0.35),
    fontFamily: 'Inter-Regular',
    color: colors.primaryText,
    marginLeft: SPACING.md,
  },
})
