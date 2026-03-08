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

const EventsActive = () => {
  const router = useRouter()
  const { eventsData, refreshEventsData } = useDashboard()
  const [activeEvents, setActiveEvents] = useState([])

  useEffect(() => {
    refreshEventsData().catch(() => {})
  }, [refreshEventsData])

  useEffect(() => {
    const filtered = eventsData.userEvents
      .filter(
        (item) => item.eventID && ['accepted', 'interested'].includes(item.status)
      )
      .sort((a, b) => parseEventDate(a.eventID) - parseEventDate(b.eventID))

    setActiveEvents(filtered)
  }, [eventsData.userEvents])

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
        <Ionicons name='time' size={26} color={COLORS.secondary} />
        <Text style={styles.headerText}>Zaakceptowane i Zainteresowane</Text>
      </View>

      <Text style={styles.infoText}>
        Lista posortowana po dacie wydarzenia (od najbliższego).
      </Text>

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
          {activeEvents.map((item) => (
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

          {activeEvents.length === 0 && (
            <View style={styles.centered}>
              <Ionicons name='calendar-outline' size={58} color={COLORS.gray} />
              <Text style={styles.emptyText}>Brak zaakceptowanych i zainteresowanych</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  )
}

export default EventsActive

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
  infoText: {
    fontSize: 13,
    fontFamily: 'Lato-Regular',
    color: COLORS.primary,
    opacity: 0.8,
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 2,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
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
