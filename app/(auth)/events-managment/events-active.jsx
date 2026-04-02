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
import { dbg, useDebugMount } from '../../../assets/utils/debugLogger'

const EventsActive = () => {
  dbg('EventsActive')
  useDebugMount('EventsActive')
  const router = useRouter()
  const { eventsData, refreshEventsData } = useDashboard()
  const ui = useResponsiveScale()
  const styles = createStyles(ui)
  const [activeEvents, setActiveEvents] = useState([])

  const backIconSize = ui.moderateScale(28, 0.35)
  const headerIconSize = ui.moderateScale(26, 0.35)
  const stateIconSize = ui.moderateScale(58, 0.3)

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
            router.push('/(auth)/events-managment/events-dashboard')
          }
          activeOpacity={0.8}
        >
          <Ionicons name='arrow-back' size={backIconSize} color={COLORS.primary} />
        </TouchableOpacity>
        <Ionicons name='time' size={headerIconSize} color={COLORS.secondary} />
        <Text style={styles.headerText}>Aktywne</Text>
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
          {activeEvents.map((item) => (
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

          {activeEvents.length === 0 && (
            <View style={styles.centered}>
              <Ionicons name='calendar-outline' size={stateIconSize} color={COLORS.gray} />
              <Text style={styles.emptyText}>Brak zaakceptowanych i zainteresowanych</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  )
}

export default EventsActive

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
  infoText: {
    fontSize: ui.scaleFont(13, 0.35),
    fontFamily: 'Lato-Regular',
    color: COLORS.primary,
    opacity: 0.8,
    textAlign: 'center',
    paddingHorizontal: ui.spacing(16),
    paddingTop: ui.verticalScale(10),
    paddingBottom: ui.verticalScale(2),
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
