import { StyleSheet, Text, View, ScrollView, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { COLORS } from '../../../constants/colors'
import CardDashboard from '../../../components/CardDashboard'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import Entypo from '@expo/vector-icons/Entypo'
import { BlurView } from 'expo-blur'
import MapRenderer from '../../../components/MapRenderer'

const DashboardHome = () => {
  const router = useRouter()

  const handleCardPress = (path) => {
    router.push(path)
  }

  return (
    <View style={styles.container} pointerEvents='box-none'>
      {/* Mapa jako przyciemnione tło */}
      <MapRenderer />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <BlurView intensity={4} style={styles.blurView}>
            <View style={styles.titleWrapper}>
              {/* Tytuł */}
              <Text style={styles.title}>Znajdź i stwórz grę zespołową</Text>

              {/* Opis */}
              <Text style={styles.desc}>
                Aplikacja Boisko+ pozwala umawiać się na wspólne uprawianie
                sportów drużynowych.
              </Text>
            </View>
            {/* Karty */}

            <View style={styles.cardWrapper}>
              <CardDashboard
                icon={
                  <Entypo name='location' size={50} color={COLORS.secondary} />
                }
                title='Znajdź Grę'
                desc='Przeglądaj dostępne gry i zapisuj się na mecze'
                onPress={() => handleCardPress('/(main)/(tabs)/find-event')}
              />
              <CardDashboard
                icon={
                  <MaterialCommunityIcons
                    name='pencil'
                    size={50}
                    color={COLORS.secondary}
                  />
                }
                title='Stwórz Grę'
                desc='Zaproponuj nową grę i zaproś znajomych'
                onPress={() =>
                  handleCardPress('/(main)/(tabs)/(hidden)/add-event')
                }
              />
              <CardDashboard
                icon={
                  <Ionicons
                    name='calendar-sharp'
                    size={50}
                    color={COLORS.secondary}
                  />
                }
                title='Moje Gry'
                desc='Zarządzaj swoimi grami i sprawdzaj statystyki'
                onPress={() =>
                  handleCardPress('/(main)/(tabs)/(hidden)/my-events')
                }
              />
              <CardDashboard
                icon={
                  <Ionicons
                    name='settings-sharp'
                    size={50}
                    color={COLORS.secondary}
                  />
                }
                title='Ustawienia'
                desc='Dostosuj swoje preferencje i powiadomienia'
                onPress={() =>
                  handleCardPress('/(main)/(tabs)/(hidden)/settings')
                }
              />
              {/* Przycisk Pokaż Mapę */}
              <Pressable
                style={styles.mapButton}
                onPress={() => handleCardPress('/(main)/(tabs)/show-map')}
              >
                <Ionicons
                  name='map'
                  size={24}
                  color={COLORS.secondary}
                  style={styles.mapIcon}
                />
                <Text style={styles.mapButtonText}>Pokaż Mapę</Text>
              </Pressable>
            </View>
          </BlurView>
        </View>
      </ScrollView>
    </View>
  )
}

export default DashboardHome

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: 'transparent',
  },
  content: {
    padding: 10,
    paddingTop: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontFamily: 'ObjectFont',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 40,
  },
  desc: {
    fontSize: 16,
    fontFamily: 'ObjectFont',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 10,
    opacity: 0.9,
  },
  titleWrapper: {
    borderTopStartRadius: 16,
    borderTopEndRadius: 16,
  },
  blurView: {
    paddingTop: 20,
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(18, 115, 64, 0.7)',
  },
  cardWrapper: {
    width: '100%',
    borderBottomEndRadius: 16,
    borderBottomStartRadius: 16,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    borderBottomEndRadius: 16,
    borderBottomStartRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
    marginTop: 8,
  },
  mapIcon: {
    marginRight: 10,
  },
  mapButtonText: {
    fontSize: 20,
    fontFamily: 'Montserrat-Bold',
    color: COLORS.primary,
  },
})
