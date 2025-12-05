import { StyleSheet, Text, View, ScrollView, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { COLORS } from '../../../constants/colors'
import CardDashboard from '../../../components/CardDashboard'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'

const DashboardHome = () => {
  const router = useRouter()

  const handleCardPress = (path) => {
    router.push(path)
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Tytuł */}
          <Text style={styles.title}>Znajdź i stwórz grę zespołową</Text>

          {/* Opis */}
          <Text style={styles.desc}>
            Aplikacja Boisko+ pozwala umawiać się na wspólne uprawianie sportów
            drużynowych.
          </Text>

          {/* Karty */}
          <View style={styles.cardWrapper}>
            <CardDashboard
              icon={
                <Ionicons name='location' size={50} color={COLORS.secondary} />
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
                <Ionicons name='calendar' size={50} color={COLORS.secondary} />
              }
              title='Moje Gry'
              desc='Zarządzaj swoimi grami i sprawdzaj statystyki'
              onPress={() =>
                handleCardPress('/(main)/(tabs)/(hidden)/my-events')
              }
            />
            <CardDashboard
              icon={
                <Ionicons name='settings' size={50} color={COLORS.secondary} />
              }
              title='Ustawienia'
              desc='Dostosuj swoje preferencje i powiadomienia'
              onPress={() =>
                handleCardPress('/(main)/(tabs)/(hidden)/settings')
              }
            />
          </View>

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
      </ScrollView>
    </View>
  )
}

export default DashboardHome

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontFamily: 'Montserrat-Bold',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 40,
  },
  desc: {
    fontSize: 16,
    fontFamily: 'Lato-Regular',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 10,
    opacity: 0.9,
  },
  cardWrapper: {
    width: '100%',
    marginBottom: 24,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    borderWidth: 2,
    borderColor: COLORS.secondary,
    borderRadius: 12,
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
