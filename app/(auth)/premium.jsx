import { StyleSheet, Text, View, ScrollView } from 'react-native'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { useEffect } from 'react'
import { COLORS } from '../../constants/colors'
import { useResponsiveScale } from '../../assets/utils/scaleUI.UX'

const Premium = () => {
  const ui = useResponsiveScale()
  const styles = createStyles(ui)

  useEffect(() => {
    console.log('[Premium] MOUNTED')
    return () => console.log('[Premium] UNMOUNTED')
  }, [])

  return (
    <View style={styles.container} pointerEvents='box-none'>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name='diamond' size={ui.moderateScale(26, 0.35)} color={COLORS.secondary} />
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
            size={ui.moderateScale(120, 0.35)}
            color={COLORS.gray}
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
              <Ionicons name='star' size={ui.moderateScale(20, 0.35)} color={COLORS.secondary} />
              <Text style={styles.featureText}>Brak reklam</Text>
            </View>

            {/* <View style={styles.featureItem}>
              <Ionicons name='infinite' size={ui.moderateScale(20, 0.35)} color={COLORS.secondary} />
              <Text style={styles.featureText}>
                ,
              </Text>
            </View> */}

            <View style={styles.featureItem}>
              <Ionicons
                name='checkmark-circle'
                size={ui.moderateScale(20, 0.35)}
                color={COLORS.secondary}
              />
              <Text style={styles.featureText}>Odznaka Wspierającego</Text>
            </View>

            <View style={styles.featureItem}>
              <Ionicons name='arrow-up' size={ui.moderateScale(20, 0.35)} color={COLORS.secondary} />
              <Text style={styles.featureText}>Pierwszeństwo w pozycjonowaniu</Text>
            </View>
{/* 
            <View style={styles.featureItem}>
              <Ionicons name='analytics' size={ui.moderateScale(20, 0.35)} color={COLORS.secondary} />
              <Text style={styles.featureText}>,</Text>
            </View> */}
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

export default Premium

const createStyles = (ui) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: ui.verticalScale(20),
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  headerText: {
    fontSize: ui.scaleFont(24, 0.45),
    fontFamily: 'Montserrat-Bold',
    color: COLORS.primary,
    marginLeft: ui.spacing(12, 0.35),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: ui.spacing(20, 0.45),
    paddingBottom: ui.verticalScale(40),
  },
  comingSoonContainer: {
    alignItems: 'center',
  },
  comingSoonTitle: {
    fontSize: ui.scaleFont(24, 0.45),
    fontFamily: 'Montserrat-Bold',
    color: COLORS.primary,
    marginBottom: ui.verticalScale(24),
    textAlign: 'center',
  },
  toolsIcon: {
    marginBottom: ui.verticalScale(24),
  },
  comingSoonText: {
    fontSize: ui.scaleFont(16, 0.35),
    fontFamily: 'Lato-Regular',
    color: COLORS.primary,
    textAlign: 'center',
    lineHeight: ui.verticalScale(24),
    marginBottom: ui.verticalScale(32),
    paddingHorizontal: ui.spacing(10, 0.35),
  },
  featuresPreview: {
    width: '100%',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: ui.moderateScale(16, 0.35),
    padding: ui.spacing(20, 0.45),
  },
  featuresTitle: {
    fontSize: ui.scaleFont(18, 0.4),
    fontFamily: 'Montserrat-Bold',
    color: COLORS.secondary,
    marginBottom: ui.verticalScale(16),
    textAlign: 'center',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: ui.verticalScale(12),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  featureText: {
    fontSize: ui.scaleFont(16, 0.35),
    fontFamily: 'Lato-Regular',
    color: COLORS.primary,
    marginLeft: ui.spacing(12, 0.35),
  },
})
