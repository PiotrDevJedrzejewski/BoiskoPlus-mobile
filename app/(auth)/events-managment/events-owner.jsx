import { useEffect, useState, useMemo} from 'react'
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
import { dbg, useDebugMount } from '../../../assets/utils/debugLogger'

const EventsOwner = () => {
  dbg('EventsOwner')
  useDebugMount('EventsOwner')
  const router = useRouter()
  const { eventsData, refreshEventsData } = useDashboard()
  const ui = useResponsiveScale()
  const styles = useMemo(() => createStyles(ui), [ui])
  const [ownerEvents, setOwnerEvents] = useState([])

  const backIconSize = ui.moderateScale(28, 0.35)
  const headerIconSize = ui.moderateScale(26, 0.35)
  const stateIconSize = ui.moderateScale(58, 0.3)

  useEffect(() => {
    refreshEventsData().catch(() => {})
  }, [refreshEventsData])

  useEffect(() => {
    const sorted = [...eventsData.ownerEvents].sort(
      (a, b) => parseEventDate(b) - parseEventDate(a)
    )
    setOwnerEvents(sorted)
  }, [eventsData.ownerEvents])

  const { loading, error } = eventsData

  const openEvent = (event) => {
    const isEnded = ['completed', 'cancelled', 'finished'].includes(event.eventStatus)
    if (isEnded) {
      router.push(`/(auth)/single-event?id=${event._id}`)
      return
    }
    router.push(`/(auth)/edit-event?id=${event._id}`)
  }

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
        <Ionicons name='person' size={headerIconSize} color={COLORS.secondary} />
        <Text style={styles.headerText}>Twoje wydarzenia</Text>
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
          {ownerEvents.map((event) => (
            <MyEventCard
              key={event._id}
              event={event}
              status='owner'
              onPress={() => openEvent(event)}
            />
          ))}

          {ownerEvents.length === 0 && (
            <View style={styles.centered}>
              <Ionicons name='calendar-outline' size={stateIconSize} color={COLORS.gray} />
              <Text style={styles.emptyText}>Nie masz jeszcze swoich eventów</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  )
}

export default EventsOwner

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
  list: {
    flex: 1,
  },
  listContent: {
    padding: ui.spacing(16),
    paddingBottom: ui.verticalScale(32),
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
