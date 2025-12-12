import { useState, useEffect } from 'react'
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { COLORS } from '../../../../constants/colors'
import { useSocketIo } from '../../../../context/SocketIoContext'
import customFetch from '../../../../assets/utils/customFetch'
import MyEventCard from '../../../../components/MyEventCard'

const FilterButton = ({ icon, label, isActive, onPress, color }) => (
  <TouchableOpacity
    style={[styles.filterButton, isActive && styles.filterButtonActive]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    {icon}
    <Text style={[styles.filterLabel, isActive && styles.filterLabelActive]}>
      {label}
    </Text>
    <View
      style={[
        styles.filterIndicator,
        isActive
          ? { backgroundColor: color || COLORS.secondary }
          : styles.filterIndicatorOff,
      ]}
    />
  </TouchableOpacity>
)

const MyEvents = () => {
  const router = useRouter()
  const { socket } = useSocketIo()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [myEventsOwner, setMyEventsOwner] = useState([])
  const [myEventsUser, setMyEventsUser] = useState([])

  // Filtry statusów
  const [showOwnerEvents, setShowOwnerEvents] = useState(true)
  const [showAcceptedEvents, setShowAcceptedEvents] = useState(true)
  const [showInterestedEvents, setShowInterestedEvents] = useState(true)
  const [showRejectedEvents, setShowRejectedEvents] = useState(true)
  const [showFinishedEvents, setShowFinishedEvents] = useState(true)

  // Pobierz wydarzenia z API
  const fetchAllEvents = async () => {
    setLoading(true)
    setError(null)
    try {
      const [ownerResponse, participantResponse] = await Promise.all([
        customFetch.get('/football-events'),
        customFetch.get('/status/my-events'),
      ])

      setMyEventsOwner(ownerResponse.data.events || [])
      setMyEventsUser(participantResponse.data.userEvents || [])
    } catch (err) {
      console.error('Błąd podczas pobierania wydarzeń:', err)
      setError('Nie udało się pobrać wydarzeń')
    } finally {
      setLoading(false)
    }
  }

  // Pobierz dane przy montowaniu
  useEffect(() => {
    fetchAllEvents()
  }, [])

  // Nasłuchiwanie socketów do odświeżania danych eventów
  useEffect(() => {
    if (!socket) return

    const handleStatusUpdate = async () => {
      // Odśwież dane użytkownika gdy otrzymamy powiadomienie o zmianie statusu
      try {
        const participantResponse = await customFetch.get('/status/my-events')
        setMyEventsUser(participantResponse.data.userEvents || [])
      } catch (error) {
        console.error('Błąd podczas odświeżania danych po statusUpdate:', error)
      }
    }

    socket.on('statusUpdate', handleStatusUpdate)

    return () => {
      socket.off('statusUpdate', handleStatusUpdate)
    }
  }, [socket])

  // Obsługa kliknięcia w wydarzenie
  const handleEventPress = (event, status) => {
    if (status === 'owner') {
      // Edycja wydarzenia
      router.push(`/(main)/(tabs)/(hidden)/edit-event?id=${event._id}`)
    } else {
      // Szczegóły wydarzenia
      router.push(`/(main)/(tabs)/(hidden)/single-event?id=${event._id}`)
    }
  }

  // Filtrowanie wydarzeń właściciela
  const filteredOwnerEvents = myEventsOwner.filter((event) => {
    if (!showOwnerEvents) return false
    if (
      !showFinishedEvents &&
      (event.eventStatus === 'completed' || event.eventStatus === 'cancelled')
    ) {
      return false
    }
    return true
  })

  // Filtrowanie wydarzeń użytkownika
  const filteredUserEvents = myEventsUser.filter((event) => {
    if (!event.eventID) return false // Zabezpieczenie przed null eventID
    if (event.status === 'accepted' && !showAcceptedEvents) return false
    if (event.status === 'interested' && !showInterestedEvents) return false
    if (event.status === 'rejected' && !showRejectedEvents) return false
    if (event.status === 'finished' && !showFinishedEvents) return false
    return true
  })

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name='calendar' size={26} color={COLORS.secondary} />
        <Text style={styles.headerText}>Moje Wydarzenia</Text>
      </View>

      {/* Filtry statusów */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        <FilterButton
          icon={
            <Ionicons
              name='person-add'
              size={16}
              color={showOwnerEvents ? COLORS.secondary : COLORS.primary}
            />
          }
          label='Moje'
          isActive={showOwnerEvents}
          onPress={() => setShowOwnerEvents(!showOwnerEvents)}
        />
        <FilterButton
          icon={
            <Ionicons
              name='checkmark-circle'
              size={16}
              color={showAcceptedEvents ? COLORS.secondary : COLORS.primary}
            />
          }
          label='Zaakceptowane'
          isActive={showAcceptedEvents}
          onPress={() => setShowAcceptedEvents(!showAcceptedEvents)}
        />
        <FilterButton
          icon={
            <Ionicons
              name='heart'
              size={16}
              color={showInterestedEvents ? COLORS.secondary : COLORS.primary}
            />
          }
          label='Zainteresowane'
          isActive={showInterestedEvents}
          onPress={() => setShowInterestedEvents(!showInterestedEvents)}
        />
        <FilterButton
          icon={
            <Ionicons
              name='close-circle'
              size={16}
              color={showRejectedEvents ? COLORS.secondary : COLORS.primary}
            />
          }
          label='Odrzucone'
          isActive={showRejectedEvents}
          onPress={() => setShowRejectedEvents(!showRejectedEvents)}
        />
        <FilterButton
          icon={
            <Ionicons
              name='checkbox'
              size={16}
              color={showFinishedEvents ? COLORS.secondary : COLORS.primary}
            />
          }
          label='Zakończone'
          isActive={showFinishedEvents}
          onPress={() => setShowFinishedEvents(!showFinishedEvents)}
        />
      </ScrollView>

      {/* Loading */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={COLORS.secondary} />
          <Text style={styles.loadingText}>Ładowanie...</Text>
        </View>
      )}

      {/* Error */}
      {error && !loading && (
        <View style={styles.errorContainer}>
          <Ionicons name='alert-circle-outline' size={60} color={COLORS.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchAllEvents}>
            <Text style={styles.retryButtonText}>Spróbuj ponownie</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Lista wydarzeń */}
      {!loading && !error && (
        <ScrollView
          style={styles.eventsList}
          contentContainerStyle={styles.eventsContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Moje wydarzenia (jako właściciel) */}
          {showOwnerEvents && filteredOwnerEvents.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Moje Wydarzenia</Text>
              {filteredOwnerEvents.map((event) => (
                <MyEventCard
                  key={event._id}
                  event={event}
                  status='owner'
                  onPress={() => handleEventPress(event, 'owner')}
                />
              ))}
            </View>
          )}

          {/* Wydarzenia, w których biorę udział */}
          {filteredUserEvents.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Wydarzenia, w których biorę udział
              </Text>
              {filteredUserEvents.map((item) => (
                <MyEventCard
                  key={item._id}
                  event={item.eventID}
                  status={item.status}
                  onPress={() => handleEventPress(item.eventID, item.status)}
                  statusData={item}
                />
              ))}
            </View>
          )}

          {/* Brak wydarzeń */}
          {filteredOwnerEvents.length === 0 &&
            filteredUserEvents.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons
                  name='calendar-outline'
                  size={60}
                  color={COLORS.gray}
                />
                <Text style={styles.emptyText}>Brak wydarzeń</Text>
                <Text style={styles.emptySubtext}>
                  Zmień filtry lub stwórz nowe wydarzenie
                </Text>
              </View>
            )}
        </ScrollView>
      )}
    </View>
  )
}

export default MyEvents

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
  filtersContainer: {
    maxHeight: 80,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  filtersContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    flexDirection: 'row',
  },
  filterButton: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 80,
  },
  filterButtonActive: {
    // aktywny - styl ustawiony przez wskaźnik
  },
  filterLabel: {
    fontSize: 12,
    fontFamily: 'Lato-Regular',
    color: COLORS.primary,
    marginTop: 4,
    opacity: 0.5,
  },
  filterLabelActive: {
    opacity: 1,
  },
  filterIndicator: {
    height: 2,
    width: 30,
    borderRadius: 1,
    marginTop: 6,
  },
  filterIndicatorOff: {
    backgroundColor: '#4b4b4b',
    width: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontFamily: 'Lato-Regular',
    color: COLORS.primary,
  },
  eventsList: {
    flex: 1,
  },
  eventsContent: {
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontFamily: 'Montserrat-Bold',
    color: COLORS.gray,
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: 'Lato-Regular',
    color: COLORS.gray,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
})
