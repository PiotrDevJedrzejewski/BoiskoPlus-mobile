import { useState } from 'react'
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
import MyEventCard from '../../../../components/MyEventCard'

// Mock data - wydarzenia właściciela
const MOCK_OWNER_EVENTS = [
  {
    _id: 'o1',
    eventName: 'Mecz na orliku - Łódź Bałuty',
    gameType: 'football',
    addressString: 'ul. Bałucki Rynek 5, Łódź',
    startDate: '2025-12-10',
    startHour: '18:00',
    duration: 90,
    price: 10,
    playerCount: 4,
    eventStatus: 'upcoming',
  },
  {
    _id: 'o2',
    eventName: 'Siatkówka wieczorna',
    gameType: 'volleyball',
    addressString: 'Hala sportowa, Warszawa',
    startDate: '2025-12-15',
    startHour: '20:00',
    duration: 120,
    price: 15,
    playerCount: 6,
    eventStatus: 'upcoming',
  },
  {
    _id: 'o3',
    eventName: 'Stary mecz koszykówki',
    gameType: 'basketball',
    addressString: 'Boisko szkolne, Kraków',
    startDate: '2025-11-20',
    startHour: '17:00',
    duration: 60,
    price: 5,
    playerCount: 0,
    eventStatus: 'completed',
  },
]

// Mock data - wydarzenia użytkownika
const MOCK_USER_EVENTS = [
  {
    _id: 'u1',
    eventID: {
      _id: 'e1',
      eventName: 'Piłka nożna - turniej',
      gameType: 'football',
      addressString: 'Orlik przy ul. Sportowej, Poznań',
      startDate: '2025-12-12',
      startHour: '16:00',
      duration: 120,
      price: 20,
      playerCount: 2,
    },
    status: 'accepted',
    readBy: true,
  },
  {
    _id: 'u2',
    eventID: {
      _id: 'e2',
      eventName: 'Koszykówka 3x3',
      gameType: 'basketball',
      addressString: 'Park miejski, Gdańsk',
      startDate: '2025-12-18',
      startHour: '15:00',
      duration: 60,
      price: 0,
      playerCount: 3,
    },
    status: 'interested',
    readBy: false,
  },
  {
    _id: 'u3',
    eventID: {
      _id: 'e3',
      eventName: 'Tenis stołowy',
      gameType: 'table tennis',
      addressString: 'Klub sportowy, Wrocław',
      startDate: '2025-12-08',
      startHour: '19:00',
      duration: 90,
      price: 10,
      playerCount: 1,
    },
    status: 'rejected',
    readBy: true,
  },
  {
    _id: 'u4',
    eventID: {
      _id: 'e4',
      eventName: 'Mecz zakończony',
      gameType: 'football',
      addressString: 'Stadion miejski, Lublin',
      startDate: '2025-11-25',
      startHour: '14:00',
      duration: 90,
      price: 15,
      playerCount: 0,
    },
    status: 'finished',
    readBy: true,
  },
]

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
  const [loading, setLoading] = useState(false)

  // Filtry statusów
  const [showOwnerEvents, setShowOwnerEvents] = useState(true)
  const [showAcceptedEvents, setShowAcceptedEvents] = useState(true)
  const [showInterestedEvents, setShowInterestedEvents] = useState(true)
  const [showRejectedEvents, setShowRejectedEvents] = useState(true)
  const [showFinishedEvents, setShowFinishedEvents] = useState(true)

  // Obsługa kliknięcia w wydarzenie
  const handleEventPress = (event, status) => {
    if (status === 'owner') {
      // Edycja wydarzenia
      console.log('Edit event:', event._id)
      // router.push(`/(main)/(tabs)/(hidden)/edit-event/${event._id}`)
    } else {
      // Szczegóły wydarzenia
      console.log('View event:', event._id)
      // router.push(`/(main)/(tabs)/(hidden)/event/${event._id}`)
    }
  }

  // Filtrowanie wydarzeń właściciela
  const filteredOwnerEvents = MOCK_OWNER_EVENTS.filter((event) => {
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
  const filteredUserEvents = MOCK_USER_EVENTS.filter((event) => {
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

      {/* Lista wydarzeń */}
      {!loading && (
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
                  showNotification={!item.readBy}
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
})
