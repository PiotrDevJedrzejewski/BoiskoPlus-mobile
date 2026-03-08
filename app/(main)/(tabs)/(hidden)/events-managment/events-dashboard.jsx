import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { useEffect } from 'react'
import { useRouter } from 'expo-router'
import { Ionicons, MaterialIcons } from '@expo/vector-icons'
import FontAwesome5 from '@expo/vector-icons/FontAwesome5'
import { COLORS } from '../../../../../constants/colors'
import CardDashboard from '../../../../../components/CardDashboard'
import { useDashboard } from '../../../../../context/DashboardContext'

const DASHBOARD_CARDS = [
  {
    key: 'all-events',
    title: 'Wszystkie wydarzenia',
    desc: 'Lista wszystkich Twoich wydarzeń, niezależnie od statusu.',
    route: '/(main)/(tabs)/(hidden)/events-managment/events-allEvents',
    renderIcon: () => (
      <MaterialIcons name='emoji-events' size={52} color={COLORS.secondary} />
    ),
  },
  {
    key: 'active-events',
    title: 'Aktywne wydarzenia',
    desc: 'Sprawdź czy zostałeś dodany do wydarzenia',
    route: '/(main)/(tabs)/(hidden)/events-managment/events-active',
    renderIcon: () => (
      <Ionicons name='calendar-sharp' size={50} color={COLORS.secondary} />
    ),
  },
  {
    key: 'owner-events',
    title: 'Edytuj wydarzenia',
    desc: '+Dodaj, -usuń gracza lub edytuj swoje wydarzenie.',
    route: '/(main)/(tabs)/(hidden)/events-managment/events-owner',
    renderIcon: () => (
      <FontAwesome5 name="tools" size={50} color={COLORS.secondary} />
    ),
  },
  {
    key: 'other-events',
    title: 'Historia wydarzeń',
    desc: 'Przeglądaj zakończone wydarzenia i ich szczegóły.',
    route: '/(main)/(tabs)/(hidden)/events-managment/events-other',
    renderIcon: () => (
      <Ionicons name='archive' size={50} color={COLORS.secondary} />
    ),
  },
]

const EventsDashboard = () => {
  const router = useRouter()
  const { eventsData, refreshEventsData } = useDashboard()

  useEffect(() => {
    refreshEventsData().catch(() => {})
  }, [refreshEventsData])

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push('/(main)/(tabs)/dashboard-home')}
          activeOpacity={0.8}
        >
          <Ionicons name='arrow-back' size={28} color={COLORS.primary} />
        </TouchableOpacity>
        <Ionicons name='calendar' size={26} color={COLORS.secondary} />
        <Text style={styles.headerText}>Moje Wydarzenia</Text>
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {eventsData.loading && eventsData.lastFetchedAt === 0 && (
          <View style={styles.loadingInline}>
            <ActivityIndicator size='small' color={COLORS.secondary} />
            <Text style={styles.loadingText}>Pobieranie danych...</Text>
          </View>
        )}

        {DASHBOARD_CARDS.map((card) => (
          <CardDashboard
            key={card.key}
            icon={card.renderIcon()}
            title={card.title}
            desc={card.desc}
            onPress={() => router.push(card.route)}
          />
        ))}
      </ScrollView>
    </View>
  )
}

export default EventsDashboard

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 10,
    top: '48%',
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    fontSize: 24,
    fontFamily: 'Montserrat-Bold',
    color: COLORS.primary,
    marginLeft: 12,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingInline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    fontFamily: 'Lato-Regular',
    color: COLORS.primary,
  },
})
