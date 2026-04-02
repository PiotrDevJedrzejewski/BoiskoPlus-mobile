import { useEffect, useState } from 'react'
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { COLORS } from '../../../constants/colors'
import { useDashboard } from '../../../context/DashboardContext'
import FilterButton from '../../../components/FilterButton'
import MyEventCard from '../../../components/MyEventCard'
import { useResponsiveScale } from '../../../assets/utils/scaleUI.UX'
import { dbg, useDebugMount } from '../../../assets/utils/debugLogger'

const FILTER_DOT_COUNT = 3

const EventsAllEvents = () => {
  dbg('EventsAllEvents')
  useDebugMount('EventsAllEvents')
  const router = useRouter()
  const { eventsData, refreshEventsData } = useDashboard()
  const ui = useResponsiveScale()
  const styles = createStyles(ui)

  const headerIconSize = ui.moderateScale(26, 0.35)
  const backIconSize = ui.moderateScale(28, 0.35)
  const filterIconSize = ui.moderateScale(16, 0.3)
  const stateIconSize = ui.moderateScale(60, 0.3)

  const [showOwnerEvents, setShowOwnerEvents] = useState(true)
  const [showAcceptedEvents, setShowAcceptedEvents] = useState(true)
  const [showInterestedEvents, setShowInterestedEvents] = useState(true)
  const [showRejectedEvents, setShowRejectedEvents] = useState(true)
  const [showFinishedEvents, setShowFinishedEvents] = useState(true)
  const [activeFilterDot, setActiveFilterDot] = useState(0)
  const [filtersContainerWidth, setFiltersContainerWidth] = useState(0)
  const [filtersContentWidth, setFiltersContentWidth] = useState(0)

  useEffect(() => {
    refreshEventsData().catch(() => {})
  }, [refreshEventsData])

  const { ownerEvents: myEventsOwner, userEvents: myEventsUser, loading, error } =
    eventsData

  const handleEventPress = (event, status) => {
    const isEnded = ['completed', 'cancelled', 'finished'].includes(event.eventStatus)
    if (status === 'owner' && !isEnded) {
      router.push(`/(auth)/edit-event?id=${event._id}`)
      return
    }
    router.push(`/(auth)/single-event?id=${event._id}`)
  }

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

  const filteredUserEvents = myEventsUser.filter((event) => {
    if (!event.eventID) return false
    if (event.status === 'accepted' && !showAcceptedEvents) return false
    if (event.status === 'interested' && !showInterestedEvents) return false
    if (event.status === 'rejected' && !showRejectedEvents) return false
    if (event.status === 'finished' && !showFinishedEvents) return false
    return true
  })

  const handleFiltersScroll = ({ nativeEvent }) => {
    const maxScrollOffset = Math.max(filtersContentWidth - filtersContainerWidth, 0)

    if (maxScrollOffset === 0) {
      setActiveFilterDot(0)
      return
    }

    const progress = nativeEvent.contentOffset.x / maxScrollOffset
    const nextDot = Math.min(
      FILTER_DOT_COUNT - 1,
      Math.max(0, Math.round(progress * (FILTER_DOT_COUNT - 1)))
    )

    setActiveFilterDot(nextDot)
  }

  return (
    <View style={styles.container} pointerEvents='box-none'>
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
        <Ionicons name='calendar' size={headerIconSize} color={COLORS.secondary} />
        <Text style={styles.headerText}>Wydarzenia</Text>
      </View>

      <View style={styles.filtersSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersContainer}
          contentContainerStyle={styles.filtersContent}
          onLayout={({ nativeEvent }) => {
            setFiltersContainerWidth(nativeEvent.layout.width)
          }}
          onContentSizeChange={(width) => {
            setFiltersContentWidth(width)
          }}
          onScroll={handleFiltersScroll}
          scrollEventThrottle={16}
        >
          <FilterButton
            icon={
              <Ionicons
                name='person-add'
                size={filterIconSize}
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
                size={filterIconSize}
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
                size={filterIconSize}
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
                size={filterIconSize}
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
                size={filterIconSize}
                color={showFinishedEvents ? COLORS.secondary : COLORS.primary}
              />
            }
            label='Zakończone'
            isActive={showFinishedEvents}
            onPress={() => setShowFinishedEvents(!showFinishedEvents)}
          />
        </ScrollView>

        <View style={styles.filterDotsContainer}>
          {Array.from({ length: FILTER_DOT_COUNT }).map((_, index) => (
            <View
              key={`filter-dot-${index}`}
              style={[
                styles.filterDot,
                index === activeFilterDot && styles.filterDotActive,
              ]}
            />
          ))}
        </View>
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={COLORS.secondary} />
          <Text style={styles.loadingText}>Ładowanie...</Text>
        </View>
      )}

      {error && !loading && (
        <View style={styles.errorContainer}>
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
          style={styles.eventsList}
          contentContainerStyle={styles.eventsContent}
          showsVerticalScrollIndicator={false}
        >
          {showOwnerEvents && filteredOwnerEvents.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Twoje Wydarzenia</Text>
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

          {filteredUserEvents.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Eventy uczestnika</Text>
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

          {filteredOwnerEvents.length === 0 && filteredUserEvents.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name='calendar-outline' size={stateIconSize} color={COLORS.gray} />
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

export default EventsAllEvents

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
    fontSize: ui.scaleFont(24, 0.45),
    fontFamily: 'Montserrat-Bold',
    color: COLORS.primary,
    marginLeft: ui.spacing(12, 0.35),
  },
  filtersSection: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  filtersContainer: {
    maxHeight: ui.verticalScale(80),
  },
  filtersContent: {
    paddingHorizontal: ui.spacing(16),
    paddingVertical: ui.verticalScale(12),
    gap: ui.spacing(12),
    flexDirection: 'row',
  },
  filterDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: ui.spacing(8, 0.35),
    paddingBottom: ui.verticalScale(10),
  },
  filterDot: {
    width: ui.moderateScale(8, 0.35),
    height: ui.moderateScale(8, 0.35),
    borderRadius: 999,
    backgroundColor: 'rgba(237, 249, 229, 0.25)',
  },
  filterDotActive: {
    width: ui.moderateScale(10, 0.35),
    backgroundColor: COLORS.secondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: ui.verticalScale(12),
    fontSize: ui.scaleFont(16, 0.35),
    fontFamily: 'Lato-Regular',
    color: COLORS.primary,
  },
  eventsList: {
    flex: 1,
  },
  eventsContent: {
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
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: ui.verticalScale(60),
  },
  emptyText: {
    marginTop: ui.verticalScale(16),
    fontSize: ui.scaleFont(18, 0.4),
    fontFamily: 'Montserrat-Bold',
    color: COLORS.gray,
  },
  emptySubtext: {
    marginTop: ui.verticalScale(8),
    fontSize: ui.scaleFont(14, 0.35),
    fontFamily: 'Lato-Regular',
    color: COLORS.gray,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: ui.spacing(20, 0.45),
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
})
