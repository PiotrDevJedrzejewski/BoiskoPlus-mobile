import { StyleSheet, Text, View, ScrollView } from 'react-native'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { COLORS } from '../../../../constants/colors'

const Premium = () => {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name='diamond' size={26} color={COLORS.secondary} />
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
            size={120}
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
              <Ionicons name='star' size={20} color={COLORS.secondary} />
              <Text style={styles.featureText}>Brak reklam</Text>
            </View>

            <View style={styles.featureItem}>
              <Ionicons name='infinite' size={20} color={COLORS.secondary} />
              <Text style={styles.featureText}>
                Nieograniczona liczba wydarzeń
              </Text>
            </View>

            <View style={styles.featureItem}>
              <Ionicons
                name='color-palette'
                size={20}
                color={COLORS.secondary}
              />
              <Text style={styles.featureText}>Ekskluzywne motywy</Text>
            </View>

            <View style={styles.featureItem}>
              <Ionicons name='trophy' size={20} color={COLORS.secondary} />
              <Text style={styles.featureText}>Odznaka Premium w rankingu</Text>
            </View>

            <View style={styles.featureItem}>
              <Ionicons name='analytics' size={20} color={COLORS.secondary} />
              <Text style={styles.featureText}>Zaawansowane statystyki</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

export default Premium

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  headerText: {
    fontSize: 24,
    fontFamily: 'Montserrat-Bold',
    color: COLORS.primary,
    marginLeft: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  comingSoonContainer: {
    alignItems: 'center',
  },
  comingSoonTitle: {
    fontSize: 24,
    fontFamily: 'Montserrat-Bold',
    color: COLORS.primary,
    marginBottom: 24,
    textAlign: 'center',
  },
  toolsIcon: {
    marginBottom: 24,
  },
  comingSoonText: {
    fontSize: 16,
    fontFamily: 'Lato-Regular',
    color: COLORS.primary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 10,
  },
  featuresPreview: {
    width: '100%',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 16,
    padding: 20,
  },
  featuresTitle: {
    fontSize: 18,
    fontFamily: 'Montserrat-Bold',
    color: COLORS.secondary,
    marginBottom: 16,
    textAlign: 'center',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  featureText: {
    fontSize: 16,
    fontFamily: 'Lato-Regular',
    color: COLORS.primary,
    marginLeft: 12,
  },
})
