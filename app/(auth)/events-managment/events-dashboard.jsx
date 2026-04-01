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
import { COLORS } from '../../../constants/colors'
import CardDashboard from '../../../components/CardDashboard'
import { useDashboard } from '../../../context/DashboardContext'
import { useResponsiveScale } from '../../../assets/utils/scaleUI.UX'

const EventsDashboard = () => {
  const router = useRouter()
  const { eventsData, refreshEventsData } = useDashboard()
  const ui = useResponsiveScale()
  const styles = createStyles(ui)

  const dashboardCards = [
    {
      key: 'all-events',
      title: 'Wszystkie wydarzenia',
      desc: 'Lista wszystkich Twoich wydarzeń, niezależnie od statusu.',
      route: '/(auth)/events-managment/events-allEvents',
      icon: (
        <MaterialIcons
          name='emoji-events'
          size={ui.moderateScale(52, 0.35)}
          color={COLORS.secondary}
        />
      ),
    },
    {
      key: 'active-events',
      title: 'Aktywne wydarzenia',
      desc: 'Sprawdź czy zostałeś dodany do wydarzenia',
      route: '/(auth)/events-managment/events-active',
      icon: (
        <Ionicons
          name='calendar-sharp'
          size={ui.moderateScale(50, 0.35)}
          color={COLORS.secondary}
        />
      ),
    },
    {
      key: 'owner-events',
      title: 'Edytuj wydarzenia',
      desc: '+Dodaj, -usuń gracza lub edytuj swoje wydarzenie.',
      route: '/(auth)/events-managment/events-owner',
      icon: (
        <FontAwesome5
          name='tools'
          size={ui.moderateScale(50, 0.35)}
          color={COLORS.secondary}
        />
      ),
    },
    {
      key: 'other-events',
      title: 'Historia wydarzeń',
      desc: 'Przeglądaj zakończone wydarzenia i ich szczegóły.',
      route: '/(auth)/events-managment/events-other',
      icon: (
        <Ionicons
          name='archive'
          size={ui.moderateScale(50, 0.35)}
          color={COLORS.secondary}
        />
      ),
    },
  ]

  useEffect(() => {
    console.log('[EventsDashboard] MOUNTED')
    return () => console.log('[EventsDashboard] UNMOUNTED')
  }, [])

  useEffect(() => {
    console.log('[EventsDashboard] useEffect: refreshEventsData')
    refreshEventsData().catch(() => {})
  }, [refreshEventsData])

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push('/(auth)/(map-screens)/dashboard-home')}
          activeOpacity={0.8}
        >
          <Ionicons name='arrow-back' size={ui.moderateScale(28, 0.35)} color={COLORS.primary} />
        </TouchableOpacity>
        <Ionicons name='calendar' size={ui.moderateScale(26, 0.35)} color={COLORS.secondary} />
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

        {dashboardCards.map((card) => (
          <CardDashboard
            key={card.key}
            icon={card.icon}
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

const createStyles = (ui) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: ui.verticalScale(15),
    position: 'relative',
    backgroundColor:'rgba(0, 0, 0, 0.3)',
  },
  backButton: {
    position: 'absolute',
    height: '100%',
    left: ui.spacing(15, 0.35),
    width: ui.moderateScale(46, 0.35),
    height: ui.moderateScale(46, 0.35),
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    fontSize: ui.scaleFont(24, 0.45),
    fontFamily: 'Montserrat-Bold',
    color: COLORS.primary,
    marginLeft: ui.spacing(12, 0.35),
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: ui.spacing(16),
    paddingBottom: ui.verticalScale(32),
  },
  loadingInline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ui.verticalScale(12),
    gap: ui.spacing(8, 0.35),
  },
  loadingText: {
    fontSize: ui.scaleFont(13, 0.35),
    fontFamily: 'Lato-Regular',
    color: COLORS.primary,
  },
})
