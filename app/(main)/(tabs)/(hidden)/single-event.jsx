import { useState, useEffect } from 'react'
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { COLORS } from '../../../../constants/colors'
import PlayerCard from '../../../../components/PlayerCard'
import ConfirmModal from '../../../../components/popup/ConfirmModal'
import FullScreenAd from '../../../../components/popup/FullScreenAd'
import customFetch from '../../../../assets/utils/customFetch'
import { useDashboard } from '../../../../context/DashboardContext'
import { useNotification } from '../../../../context/NotificationContext'
import { useResponsiveScale } from '../../../../assets/utils/scaleUI.UX'

const ActionButton = ({ icon, label, onPress, muted = false, styles, ui }) => (
  <TouchableOpacity
    style={styles.actionButton}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Ionicons
      name={icon}
      size={ui.moderateScale(28, 0.35)}
      color={muted ? COLORS.gray : COLORS.primary}
    />
    <Text style={[styles.actionButtonText, muted && styles.actionButtonMuted]}>
      {label}
    </Text>
  </TouchableOpacity>
)

const ExpandableSection = ({ title, expanded, onToggle, badge, children, styles, ui }) => (
  <View style={styles.expandableContainer}>
    <TouchableOpacity
      style={styles.expandableHeader}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <Text style={styles.expandableTitle}>
        {title} {badge && <Text style={styles.badge}>({badge})</Text>}
      </Text>
      <Ionicons
        name={expanded ? 'chevron-up' : 'chevron-down'}
        size={ui.moderateScale(24, 0.35)}
        color={COLORS.secondary}
      />
    </TouchableOpacity>
    {expanded && <View style={styles.expandableContent}>{children}</View>}
  </View>
)

const InfoRow = ({ label, value, styles }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}:</Text>
    <Text style={styles.infoValue}>{value || '---'}</Text>
  </View>
)

const SingleEvent = () => {
  const router = useRouter()
  const ui = useResponsiveScale()
  const styles = createStyles(ui)
  const { id } = useLocalSearchParams()
  const eventID = id

  const { filteredEvents, adShow, setAdShow } = useDashboard()
  const { muteChatRoom, unmuteChatRoom, muteEvent, unmuteEvent, preferences } =
    useNotification()

  const [loading, setLoading] = useState(true)
  const [event, setEvent] = useState(null)
  const [owner, setOwner] = useState(null)
  const [players, setPlayers] = useState([])
  const [playersLoading, setPlayersLoading] = useState(false)
  const [userStatus, setUserStatus] = useState(null)
  const [statusLoading, setStatusLoading] = useState(false)

  const [showInfo, setShowInfo] = useState(false)
  const [showPlayers, setShowPlayers] = useState(false)

  const [isChatMuted, setIsChatMuted] = useState(false)
  const [isNotificationsMuted, setIsNotificationsMuted] = useState(false)

  const [showAd, setShowAd] = useState(false)
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)

  // Pobierz wydarzenie
  useEffect(() => {
    const fetchEvent = async () => {
      setLoading(true)
      try {
        // Najpierw sprawdź w filteredEvents
        if (filteredEvents?.events) {
          const found = filteredEvents.events.find((e) => e._id === eventID)
          if (found) {
            setEvent(found)
            setLoading(false)
            return
          }
        }
        // Jeśli nie znaleziono, pobierz z backendu
        const response = await customFetch.get(`/football-events/${eventID}`)
        setEvent(response.data.event)
      } catch (error) {
        console.error('Błąd pobierania wydarzenia:', error)
        setEvent(undefined)
      } finally {
        setLoading(false)
      }
    }

    if (eventID) fetchEvent()
  }, [eventID, filteredEvents])

  // Pobierz status użytkownika dla wydarzenia
  useEffect(() => {
    if (!eventID) return
    setStatusLoading(true)

    const fetchStatus = async () => {
      try {
        const response = await customFetch.get(
          `/status/events/${eventID}/my-status`,
        )
        if (response.data?.status) {
          setUserStatus(response.data.status)
        } else {
          setUserStatus(null)
        }
      } catch (error) {
        setUserStatus(null)
      } finally {
        setStatusLoading(false)
      }
    }

    fetchStatus()
  }, [eventID])

  // Pobierz informacje o właścicielu wydarzenia
  useEffect(() => {
    if (!event?.createdBy) return

    const fetchOwnerInfo = async () => {
      try {
        let userId = event.createdBy
        if (typeof event.createdBy === 'object' && event.createdBy._id) {
          userId = event.createdBy._id
        } else if (typeof event.createdBy === 'object') {
          userId = String(event.createdBy)
        }
        const response = await customFetch.get(`/users/${userId}`)
        setOwner(response.data.user)
      } catch (error) {
        console.error('Błąd pobierania właściciela:', error)
      }
    }

    fetchOwnerInfo()
  }, [event])

  // Pobierz zaakceptowanych uczestników
  useEffect(() => {
    if (!eventID) return

    const fetchAcceptedPlayers = async () => {
      setPlayersLoading(true)
      try {
        const response = await customFetch.get(
          `/status/events/${eventID}/users`,
        )
        const acceptedUsers = response.data.usersByStatus?.accepted || []

        if (acceptedUsers.length > 0) {
          const userIds = acceptedUsers.map((user) => user.userID._id)
          const statsResponse = await customFetch.post('/user-stats/multiple', {
            userIds,
          })

          const playersWithStats = acceptedUsers.map((user) => {
            const userStats = statsResponse.data.stats?.find(
              (stat) => stat.userID?.toString() === user.userID._id?.toString(),
            )
            return {
              _id: user.userID._id,
              nickName: user.userID.nickName,
              name: user.userID.name,
              surname: user.userID.surname,
              avatarUrl: user.userID.avatarUrl,
              userStats: userStats || {
                gamesPlayed: 0,
                eventsOrganized: 0,
                totalLikes: 0,
              },
            }
          })
          setPlayers(playersWithStats)
        } else {
          setPlayers([])
        }
      } catch (error) {
        console.error('Błąd pobierania uczestników:', error)
        setPlayers([])
      } finally {
        setPlayersLoading(false)
      }
    }

    fetchAcceptedPlayers()
  }, [eventID])

  // Sprawdzanie czy chat i event są wyciszone
  useEffect(() => {
    if (!preferences || !eventID) return

    const chatRoomId = `group_${eventID}`
    const isChatMutedInPrefs = preferences.mutedChatRooms?.some((room) => {
      const isMuted = room.chatRoomId === chatRoomId
      const isExpired =
        room.muteExpiresAt && new Date() > new Date(room.muteExpiresAt)
      return isMuted && !isExpired
    })
    setIsChatMuted(isChatMutedInPrefs || false)

    const isEventMutedInPrefs = preferences.mutedEvents?.some(
      (mutedEvent) => mutedEvent.eventId === eventID,
    )
    setIsNotificationsMuted(isEventMutedInPrefs || false)
  }, [preferences, eventID])

  const handleJoinRequest = async () => {
    if (userStatus === 'interested' || userStatus === 'accepted') {
      Alert.alert('Info', 'Już masz status dla tego wydarzenia')
      return
    }

    try {
      setShowAd(true)
      setUserStatus('interested')
      await customFetch.post(`/status/events/${eventID}/join`)
    } catch (error) {
      Alert.alert('Info', 'Już masz status dla tego wydarzenia')
      console.error(error)
    }
  }

  const handleAfterAd = () => {
    setShowAd(false)
    if (setAdShow) setAdShow(false)
  }

  const handleLeave = () => {
    setShowLeaveConfirm(true)
  }

  const confirmLeave = async () => {
    try {
      await customFetch.delete(`/status/events/${eventID}/leave`)
      setUserStatus(null)
      setShowLeaveConfirm(false)
      Alert.alert('Sukces', 'Pomyślnie wycofano z wydarzenia')
    } catch (error) {
      Alert.alert('Błąd', 'Nie możesz się wycofać z tego wydarzenia')
      console.error('Błąd podczas wycofywania z wydarzenia:', error)
    }
  }

  const handleToggleChatMute = async () => {
    try {
      const chatRoomId = `group_${eventID}`

      if (isChatMuted) {
        const result = await unmuteChatRoom(chatRoomId)
        if (result.success) {
          setIsChatMuted(false)
          Alert.alert('Sukces', 'Powiadomienia z czatu zostały włączone')
        } else {
          Alert.alert('Błąd', 'Błąd podczas włączania powiadomień z czatu')
        }
      } else {
        const result = await muteChatRoom(chatRoomId)
        if (result.success) {
          setIsChatMuted(true)
          Alert.alert('Sukces', 'Powiadomienia z czatu zostały wyciszone')
        } else {
          Alert.alert('Błąd', 'Błąd podczas wyciszania powiadomień z czatu')
        }
      }
    } catch (error) {
      Alert.alert('Błąd', 'Błąd podczas zmiany ustawień powiadomień z czatu')
      console.error('Błąd handleChatNotifications:', error)
    }
  }

  const handleToggleNotificationsMute = async () => {
    try {
      if (isNotificationsMuted) {
        const result = await unmuteEvent(eventID)
        if (result.success) {
          setIsNotificationsMuted(false)
          Alert.alert('Sukces', 'Powiadomienia z wydarzenia zostały włączone')
        } else {
          Alert.alert('Błąd', 'Błąd podczas włączania powiadomień z wydarzenia')
        }
      } else {
        const result = await muteEvent(eventID)
        if (result.success) {
          setIsNotificationsMuted(true)
          Alert.alert('Sukces', 'Powiadomienia z wydarzenia zostały wyciszone')
        } else {
          Alert.alert(
            'Błąd',
            'Błąd podczas wyciszania powiadomień z wydarzenia',
          )
        }
      }
    } catch (error) {
      Alert.alert(
        'Błąd',
        'Błąd podczas zmiany ustawień powiadomień z wydarzenia',
      )
      console.error('Błąd handleEventNotifications:', error)
    }
  }

  const handleReport = () => {
    router.push({
      pathname: '/(main)/(tabs)/(hidden)/report',
      params: { type: 'event', reportedEventId: eventID },
    })
  }

  const handleGoBack = () => {
    router.back()
  }

  const getStatusText = () => {
    if (statusLoading) return 'Sprawdzanie statusu...'
    if (userStatus) return `Twój status: ${userStatus}`
    return 'Poproś o dołączenie'
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' color={COLORS.secondary} />
        <Text style={styles.loadingText}>Ładowanie wydarzenia...</Text>
      </View>
    )
  }

  if (!event) {
    return (
      <View style={styles.notFoundContainer}>
        <Ionicons name='alert-circle' size={ui.moderateScale(64, 0.35)} color={COLORS.error} />
        <Text style={styles.notFoundText}>
          Nie znaleziono wydarzenia o podanym ID, możliwe że zostało usunięte
        </Text>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Text style={styles.backButtonText}>Wróć</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container} pointerEvents='box-none'>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleGoBack}
          style={styles.backIconButton}
          activeOpacity={0.7}
        >
          <Ionicons name='arrow-back' size={ui.moderateScale(24, 0.35)} color={COLORS.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerText} numberOfLines={1}>
          {event.eventName}
        </Text>
        <View style={{ width: ui.moderateScale(40, 0.35) }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Join Button */}
        <TouchableOpacity
          style={[styles.joinButton, userStatus && styles.joinButtonWithStatus]}
          onPress={handleJoinRequest}
          disabled={statusLoading}
          activeOpacity={0.8}
        >
          <Text style={styles.joinButtonText}>{getStatusText()}</Text>
        </TouchableOpacity>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <ActionButton
            icon={isChatMuted ? 'chatbubbles' : 'chatbubbles-outline'}
            label='Wycisz chat'
            onPress={handleToggleChatMute}
            muted={isChatMuted}
            styles={styles}
            ui={ui}
          />
          <ActionButton
            icon={
              isNotificationsMuted
                ? 'notifications-off'
                : 'notifications-outline'
            }
            label='Wycisz powiadomienia'
            onPress={handleToggleNotificationsMute}
            muted={isNotificationsMuted}
            styles={styles}
            ui={ui}
          />
          <ActionButton
            icon='flag-outline'
            label='Zgłoś'
            onPress={handleReport}
            styles={styles}
            ui={ui}
          />
          <ActionButton
            icon='close-circle-outline'
            label='Opuść'
            onPress={handleLeave}
            styles={styles}
            ui={ui}
          />
        </View>

        {/* Organizer */}
        <Text style={styles.sectionLabel}>Organizator</Text>
        {owner && <PlayerCard playerInfo={owner} />}

        {/* Event Info */}
        <ExpandableSection
          title='Informacje o wydarzeniu'
          expanded={showInfo}
          onToggle={() => setShowInfo(!showInfo)}
          styles={styles}
          ui={ui}
        >
          <InfoRow label='Nazwa' value={event.eventName} styles={styles} />
          <InfoRow label='Adres' value={event.addressString} styles={styles} />
          <InfoRow
            label='Data'
            value={`${event.startDate} ${event.startHour}`}
            styles={styles}
          />
          <InfoRow label='Opis' value={event.eventDescription} styles={styles} />
          <InfoRow label='Czas trwania' value={event.duration} styles={styles} />
          <InfoRow label='Typ boiska' value={event.fieldType} styles={styles} />
          <InfoRow label='Typ gry' value={event.gameType} styles={styles} />
          <InfoRow label='Poziom' value={event.level} styles={styles} />
          <InfoRow label='Szuka graczy' value={event.playerCount} styles={styles} />
          <InfoRow label='Cena' value={event.price} styles={styles} />
          <InfoRow label='Płatność' value={event.paymentMethod} styles={styles} />
          <InfoRow label='Telefon' value={event.phoneNumber} styles={styles} />
          <InfoRow
            label='Typ'
            value={event.isRecurring ? 'Cykliczne' : 'Jednorazowe'}
            styles={styles}
          />
          <InfoRow label='Status' value={event.eventStatus} styles={styles} />
        </ExpandableSection>

        {/* Players */}
        <ExpandableSection
          title='Lista uczestników'
          expanded={showPlayers}
          onToggle={() => setShowPlayers(!showPlayers)}
          badge={`${players.length} zaakceptowanych`}
          styles={styles}
          ui={ui}
        >
          {playersLoading ? (
            <ActivityIndicator size='small' color={COLORS.secondary} />
          ) : players.length > 0 ? (
            players.map((player) => (
              <PlayerCard key={player._id} playerInfo={player} />
            ))
          ) : (
            <Text style={styles.emptyText}>
              Brak zaakceptowanych uczestników
            </Text>
          )}
        </ExpandableSection>
      </ScrollView>

      {/* Modals */}
      <FullScreenAd
        visible={showAd}
        onClose={handleAfterAd}
        onPremiumPress={() => router.push('/(main)/(tabs)/(hidden)/premium')}
      />

      <ConfirmModal
        visible={showLeaveConfirm}
        onClose={() => setShowLeaveConfirm(false)}
        onConfirm={confirmLeave}
        title='Czy na pewno chcesz opuścić to wydarzenie?'
        actionText='OPUŚĆ'
        actionType='warning'
      />
    </View>
  )
}

export default SingleEvent

const createStyles = (ui) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontFamily: 'Lato-Regular',
    color: COLORS.primary,
  },
  notFoundContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: ui.spacing(40, 0.45),
  },
  notFoundText: {
    fontSize: ui.scaleFont(16, 0.35),
    fontFamily: 'Lato-Regular',
    color: COLORS.primary,
    textAlign: 'center',
    marginTop: ui.verticalScale(16),
    marginBottom: ui.verticalScale(24),
  },
  backButton: {
    backgroundColor: COLORS.secondary,
    paddingVertical: ui.verticalScale(12),
    paddingHorizontal: ui.spacing(32, 0.45),
    borderRadius: ui.moderateScale(10, 0.35),
  },
  backButtonText: {
    fontSize: ui.scaleFont(14, 0.35),
    fontFamily: 'Montserrat-Bold',
    color: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: ui.verticalScale(16),
    paddingHorizontal: ui.spacing(16),
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  backIconButton: {
    width: ui.moderateScale(40, 0.35),
    height: ui.moderateScale(40, 0.35),
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
    fontSize: ui.scaleFont(18, 0.4),
    fontFamily: 'Montserrat-Bold',
    color: COLORS.primary,
    textAlign: 'center',
    marginHorizontal: ui.spacing(8, 0.35),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: ui.spacing(20, 0.45),
    paddingBottom: ui.verticalScale(40),
  },
  joinButton: {
    backgroundColor: COLORS.secondary,
    borderRadius: ui.moderateScale(12, 0.35),
    paddingVertical: ui.verticalScale(18),
    alignItems: 'center',
    marginBottom: ui.verticalScale(20),
  },
  joinButtonWithStatus: {
    backgroundColor: COLORS.third,
  },
  joinButtonText: {
    fontSize: ui.scaleFont(16, 0.35),
    fontFamily: 'Montserrat-Bold',
    color: COLORS.background,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: ui.verticalScale(24),
    paddingVertical: ui.verticalScale(12),
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: ui.moderateScale(12, 0.35),
  },
  actionButton: {
    alignItems: 'center',
    padding: ui.spacing(8, 0.35),
  },
  actionButtonText: {
    fontSize: ui.scaleFont(10, 0.25),
    fontFamily: 'Lato-Regular',
    color: COLORS.primary,
    marginTop: ui.verticalScale(4),
    textAlign: 'center',
  },
  actionButtonMuted: {
    color: COLORS.gray,
  },
  sectionLabel: {
    fontSize: ui.scaleFont(16, 0.35),
    fontFamily: 'Montserrat-Bold',
    color: COLORS.secondary,
    marginBottom: ui.verticalScale(8),
  },
  expandableContainer: {
    marginTop: ui.verticalScale(16),
  },
  expandableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: ui.moderateScale(12, 0.35),
    padding: ui.spacing(16),
  },
  expandableTitle: {
    fontSize: ui.scaleFont(14, 0.35),
    fontFamily: 'Montserrat-Bold',
    color: COLORS.primary,
  },
  badge: {
    color: COLORS.gray,
    fontFamily: 'Lato-Regular',
  },
  expandableContent: {
    marginTop: ui.verticalScale(12),
    paddingHorizontal: ui.spacing(4, 0.25),
  },
  infoRow: {
    flexDirection: 'row',
    paddingVertical: ui.verticalScale(10),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  infoLabel: {
    fontSize: ui.scaleFont(14, 0.35),
    fontFamily: 'Lato-Regular',
    color: COLORS.gray,
    width: ui.scale(120),
  },
  infoValue: {
    flex: 1,
    fontSize: ui.scaleFont(14, 0.35),
    fontFamily: 'Lato-Regular',
    color: COLORS.primary,
  },
  emptyText: {
    fontSize: ui.scaleFont(14, 0.35),
    fontFamily: 'Lato-Regular',
    color: COLORS.gray,
    textAlign: 'center',
    paddingVertical: ui.verticalScale(20),
  },
})
