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
import { COLORS } from '../../../../../constants/colors'
import { useDashboard } from '../../../../../context/DashboardContext'
import MyEventCard from '../../../../../components/MyEventCard'
import { parseEventDate } from '../../../../../assets/utils/eventsApi'

const OTHER_USER_STATUSES = ['rejected', 'finished', 'cancelled']
const OTHER_OWNER_STATUSES = ['completed', 'cancelled', 'finished']

const EventsOther = () => {
  const router = useRouter()
  const { eventsData, refreshEventsData } = useDashboard()
  const [ownerEvents, setOwnerEvents] = useState([])
  const [otherUserEvents, setOtherUserEvents] = useState([])

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
            router.push('/(main)/(tabs)/(hidden)/events-managment/events-dashboard')
          }
          activeOpacity={0.8}
        >
          <Ionicons name='arrow-back' size={28} color={COLORS.primary} />
        </TouchableOpacity>
        <Ionicons name='archive-outline' size={26} color={COLORS.secondary} />
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
          <Ionicons name='alert-circle-outline' size={58} color={COLORS.error} />
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
                    router.push(`/(main)/(tabs)/(hidden)/single-event?id=${event._id}`)
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
                    router.push(`/(main)/(tabs)/(hidden)/single-event?id=${item.eventID._id}`)
                  }
                />
              ))}
            </View>
          )}

          {ownerEvents.length === 0 && otherUserEvents.length === 0 && (
            <View style={styles.centered}>
              <Ionicons name='calendar-outline' size={58} color={COLORS.gray} />
              <Text style={styles.emptyText}>Brak eventów z pozostałymi statusami</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  )
}

export default EventsOther

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
    fontSize: 22,
    fontFamily: 'Montserrat-Bold',
    color: COLORS.primary,
    marginLeft: 12,
    textAlign: 'center',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Montserrat-Bold',
    color: COLORS.secondary,
    marginBottom: 12,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontFamily: 'Lato-Regular',
    color: COLORS.primary,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Lato-Regular',
    color: COLORS.error,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 16,
    fontFamily: 'Montserrat-Bold',
    color: COLORS.background,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    fontFamily: 'Montserrat-Bold',
    color: COLORS.gray,
    textAlign: 'center',
  },
})
