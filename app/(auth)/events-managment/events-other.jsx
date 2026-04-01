import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { COLORS } from '../../../constants/colors'
import { useDashboard } from '../../../context/DashboardContext'
import MyEventCard from '../../../components/MyEventCard'
import { parseEventDate } from '../../../assets/utils/eventsApi'
import { useResponsiveScale } from '../../../assets/utils/scaleUI.UX'

const OTHER_USER_STATUSES = ['rejected', 'finished', 'cancelled']
const OTHER_OWNER_STATUSES = ['completed', 'cancelled', 'finished']

const EventsOther = () => {
  const router = useRouter()
  const { eventsData, refreshEventsData } = useDashboard()
  const ui = useResponsiveScale()
  const styles = createStyles(ui)
  const [ownerEvents, setOwnerEvents] = useState([])
  const [otherUserEvents, setOtherUserEvents] = useState([])

  const backIconSize = ui.moderateScale(28, 0.35)
  const headerIconSize = ui.moderateScale(26, 0.35)
  const stateIconSize = ui.moderateScale(58, 0.3)

  useEffect(() => {
    refreshEventsData().catch(() => {})
  }, [refreshEventsData])

  useEffect(() => {
    const ownerFiltered = eventsData.ownerEvents
      .filter((event) => OTHER_OWNER_STATUSES.includes(event.eventStatus))
      .sort((a, b) => parseEventDate(b) - parseEventDate(a))

    const userFiltered = eventsData.userEvents
      .filter((item) => item.eventID && OTHER_USER_STATUSES.includes(item.status))
      .sort((a, b) => parseEventDate(b.eventID) - parseEventDate(a.eventID))

    setOwnerEvents(ownerFiltered)
    setOtherUserEvents(userFiltered)
  }, [eventsData.ownerEvents, eventsData.userEvents])

  const { loading, error } = eventsData

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() =>
            router.push('/(auth)/events-managment/events-dashboard')
          }
          activeOpacity={0.8}
        >
          <Ionicons name='arrow-back' size={backIconSize} color={COLORS.primary} />
        </TouchableOpacity>
        <Ionicons name='archive-outline' size={headerIconSize} color={COLORS.secondary} />
        <Text style={styles.headerText}>Historia</Text>
      </View>

      {loading && (
        <View style={styles.centered}>
          <ActivityIndicator size='large' color={COLORS.secondary} />
          <Text style={styles.loadingText}>Ładowanie...</Text>
        </View>
      )}

      {error && !loading && (
        <View style={styles.centered}>
          <Ionicons name='alert-circle-outline' size={stateIconSize} color={COLORS.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => refreshEventsData({ force: true })}
          >
            <Text style={styles.retryButtonText}>Spróbuj ponownie</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && !error && (
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {ownerEvents.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Twoje zakończone i anulowane</Text>
              {ownerEvents.map((event) => (
                <MyEventCard
                  key={event._id}
                  event={event}
                  status={event.eventStatus || 'owner'}
                  onPress={() =>
                    router.push(`/(auth)/single-event?id=${event._id}`)
                  }
                />
              ))}
            </View>
          )}

          {otherUserEvents.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Uczestnictwo: odrzucone i zamknięte</Text>
              {otherUserEvents.map((item) => (
                <MyEventCard
                  key={item._id}
                  event={item.eventID}
                  status={item.status}
                  statusData={item}
                  onPress={() =>
                    router.push(`/(auth)/single-event?id=${item.eventID._id}`)
                  }
                />
              ))}
            </View>
          )}

          {ownerEvents.length === 0 && otherUserEvents.length === 0 && (
            <View style={styles.centered}>
              <Ionicons name='calendar-outline' size={stateIconSize} color={COLORS.gray} />
              <Text style={styles.emptyText}>Brak eventów z pozostałymi statusami</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  )
}

export default EventsOther

const createStyles = (ui) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
    fontSize: ui.scaleFont(22, 0.45),
    fontFamily: 'Montserrat-Bold',
    color: COLORS.primary,
    marginLeft: ui.spacing(12, 0.35),
    textAlign: 'center',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: ui.spacing(16),
    paddingBottom: ui.verticalScale(32),
  },
  section: {
    marginBottom: ui.verticalScale(24),
  },
  sectionTitle: {
    fontSize: ui.scaleFont(14, 0.35),
    fontFamily: 'Montserrat-Bold',
    color: COLORS.secondary,
    marginBottom: ui.verticalScale(12),
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: ui.spacing(20, 0.45),
  },
  loadingText: {
    marginTop: ui.verticalScale(12),
    fontSize: ui.scaleFont(16, 0.35),
    fontFamily: 'Lato-Regular',
    color: COLORS.primary,
  },
  errorText: {
    marginTop: ui.verticalScale(16),
    fontSize: ui.scaleFont(16, 0.35),
    fontFamily: 'Lato-Regular',
    color: COLORS.error,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: ui.verticalScale(20),
    backgroundColor: COLORS.secondary,
    paddingHorizontal: ui.spacing(24, 0.45),
    paddingVertical: ui.verticalScale(12),
    borderRadius: ui.moderateScale(12, 0.35),
  },
  retryButtonText: {
    fontSize: ui.scaleFont(16, 0.35),
    fontFamily: 'Montserrat-Bold',
    color: COLORS.background,
  },
  emptyText: {
    marginTop: ui.verticalScale(12),
    fontSize: ui.scaleFont(16, 0.35),
    fontFamily: 'Montserrat-Bold',
    color: COLORS.gray,
    textAlign: 'center',
  },
})
