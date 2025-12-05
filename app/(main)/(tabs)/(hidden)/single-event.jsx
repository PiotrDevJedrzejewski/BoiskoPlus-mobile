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
import ConfirmModal from '../../../(Popup)/ConfirmModal'
import FullScreenAd from '../../../(Popup)/FullScreenAd'

// Mock data - wydarzenie
const MOCK_EVENT = {
  _id: 'event1',
  eventName: 'Mecz na Orliku - Piłka nożna',
  addressString: 'ul. Sportowa 15, Łódź',
  startDate: '2025-12-10',
  startHour: '18:00',
  eventDescription:
    'Szukamy graczy do meczu towarzyskiego na orliku. Poziom średnio-zaawansowany.',
  duration: '2 godziny',
  fieldType: 'Orlik (sztuczna trawa)',
  gameType: 'Piłka nożna',
  level: 'Średnio-zaawansowany',
  playerCount: 4,
  price: '10 zł/os',
  paymentMethod: 'Gotówka na miejscu',
  phoneNumber: '123456789',
  isRecurring: false,
  eventStatus: 'active',
  createdBy: 'owner1',
}

const MOCK_OWNER = {
  _id: 'owner1',
  nickName: 'SportyJohn',
  name: 'Jan',
  surname: 'Kowalski',
  avatarUrl: null,
  userStats: {
    gamesPlayed: 45,
    eventsOrganized: 12,
    totalLikes: 34,
  },
}

const MOCK_PLAYERS = [
  {
    _id: 'player1',
    nickName: 'FastRunner',
    name: 'Adam',
    surname: 'Nowak',
    avatarUrl: null,
    userStats: { gamesPlayed: 23, eventsOrganized: 2, totalLikes: 15 },
  },
  {
    _id: 'player2',
    nickName: 'GoalMaster',
    name: 'Piotr',
    surname: 'Wiśniewski',
    avatarUrl: null,
    userStats: { gamesPlayed: 67, eventsOrganized: 8, totalLikes: 42 },
  },
]

const ActionButton = ({ icon, label, onPress, muted = false }) => (
  <TouchableOpacity
    style={styles.actionButton}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Ionicons
      name={icon}
      size={28}
      color={muted ? COLORS.gray : COLORS.primary}
    />
    <Text style={[styles.actionButtonText, muted && styles.actionButtonMuted]}>
      {label}
    </Text>
  </TouchableOpacity>
)

const ExpandableSection = ({ title, expanded, onToggle, badge, children }) => (
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
        size={24}
        color={COLORS.secondary}
      />
    </TouchableOpacity>
    {expanded && <View style={styles.expandableContent}>{children}</View>}
  </View>
)

const InfoRow = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}:</Text>
    <Text style={styles.infoValue}>{value || '---'}</Text>
  </View>
)

const SingleEvent = () => {
  const router = useRouter()
  const { id } = useLocalSearchParams()

  const [loading, setLoading] = useState(true)
  const [event, setEvent] = useState(null)
  const [owner, setOwner] = useState(null)
  const [players, setPlayers] = useState([])
  const [userStatus, setUserStatus] = useState(null) // null | 'interested' | 'accepted' | 'rejected'
  const [statusLoading, setStatusLoading] = useState(false)

  const [showInfo, setShowInfo] = useState(false)
  const [showPlayers, setShowPlayers] = useState(false)

  const [isChatMuted, setIsChatMuted] = useState(false)
  const [isNotificationsMuted, setIsNotificationsMuted] = useState(false)

  const [showAd, setShowAd] = useState(false)
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)

  useEffect(() => {
    // Symulacja pobierania danych
    const fetchData = async () => {
      setLoading(true)
      await new Promise((resolve) => setTimeout(resolve, 500))

      setEvent(MOCK_EVENT)
      setOwner(MOCK_OWNER)
      setPlayers(MOCK_PLAYERS)
      setUserStatus(null) // Brak statusu = nie dołączył
      setLoading(false)
    }

    fetchData()
  }, [id])

  const handleJoinRequest = async () => {
    if (userStatus === 'interested' || userStatus === 'accepted') {
      Alert.alert('Info', 'Już masz status dla tego wydarzenia')
      return
    }

    // Pokaż reklamę
    setShowAd(true)
  }

  const handleAfterAd = () => {
    setShowAd(false)
    setUserStatus('interested')
    Alert.alert('Sukces', 'Prośba o dołączenie została wysłana')
  }

  const handleLeave = () => {
    setShowLeaveConfirm(true)
  }

  const confirmLeave = async () => {
    setShowLeaveConfirm(false)
    setUserStatus(null)
    Alert.alert('Sukces', 'Pomyślnie wycofano z wydarzenia')
  }

  const handleToggleChatMute = () => {
    setIsChatMuted(!isChatMuted)
    Alert.alert(
      'Sukces',
      isChatMuted
        ? 'Powiadomienia z czatu włączone'
        : 'Powiadomienia z czatu wyciszone'
    )
  }

  const handleToggleNotificationsMute = () => {
    setIsNotificationsMuted(!isNotificationsMuted)
    Alert.alert(
      'Sukces',
      isNotificationsMuted
        ? 'Powiadomienia wydarzenia włączone'
        : 'Powiadomienia wydarzenia wyciszone'
    )
  }

  const handleReport = () => {
    Alert.alert('Zgłoś wydarzenie', 'Funkcja w przygotowaniu')
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
        <Ionicons name='alert-circle' size={64} color={COLORS.error} />
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
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleGoBack}
          style={styles.backIconButton}
          activeOpacity={0.7}
        >
          <Ionicons name='arrow-back' size={24} color={COLORS.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerText} numberOfLines={1}>
          {event.eventName}
        </Text>
        <View style={{ width: 40 }} />
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
          />
          <ActionButton
            icon='flag-outline'
            label='Zgłoś'
            onPress={handleReport}
          />
          <ActionButton
            icon='close-circle-outline'
            label='Opuść'
            onPress={handleLeave}
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
        >
          <InfoRow label='Nazwa' value={event.eventName} />
          <InfoRow label='Adres' value={event.addressString} />
          <InfoRow
            label='Data'
            value={`${event.startDate} ${event.startHour}`}
          />
          <InfoRow label='Opis' value={event.eventDescription} />
          <InfoRow label='Czas trwania' value={event.duration} />
          <InfoRow label='Typ boiska' value={event.fieldType} />
          <InfoRow label='Typ gry' value={event.gameType} />
          <InfoRow label='Poziom' value={event.level} />
          <InfoRow label='Szuka graczy' value={event.playerCount} />
          <InfoRow label='Cena' value={event.price} />
          <InfoRow label='Płatność' value={event.paymentMethod} />
          <InfoRow label='Telefon' value={event.phoneNumber} />
          <InfoRow
            label='Typ'
            value={event.isRecurring ? 'Cykliczne' : 'Jednorazowe'}
          />
          <InfoRow label='Status' value={event.eventStatus} />
        </ExpandableSection>

        {/* Players */}
        <ExpandableSection
          title='Lista uczestników'
          expanded={showPlayers}
          onToggle={() => setShowPlayers(!showPlayers)}
          badge={`${players.length} zaakceptowanych`}
        >
          {players.length > 0 ? (
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

const styles = StyleSheet.create({
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
    padding: 40,
  },
  notFoundText: {
    fontSize: 16,
    fontFamily: 'Lato-Regular',
    color: COLORS.primary,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: COLORS.secondary,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 10,
  },
  backButtonText: {
    fontSize: 14,
    fontFamily: 'Montserrat-Bold',
    color: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  backIconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
    fontSize: 18,
    fontFamily: 'Montserrat-Bold',
    color: COLORS.primary,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  joinButton: {
    backgroundColor: COLORS.secondary,
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 20,
  },
  joinButtonWithStatus: {
    backgroundColor: COLORS.third,
  },
  joinButtonText: {
    fontSize: 16,
    fontFamily: 'Montserrat-Bold',
    color: COLORS.background,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
    paddingVertical: 12,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
  },
  actionButton: {
    alignItems: 'center',
    padding: 8,
  },
  actionButtonText: {
    fontSize: 10,
    fontFamily: 'Lato-Regular',
    color: COLORS.primary,
    marginTop: 4,
    textAlign: 'center',
  },
  actionButtonMuted: {
    color: COLORS.gray,
  },
  sectionLabel: {
    fontSize: 16,
    fontFamily: 'Montserrat-Bold',
    color: COLORS.secondary,
    marginBottom: 8,
  },
  expandableContainer: {
    marginTop: 16,
  },
  expandableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
  },
  expandableTitle: {
    fontSize: 14,
    fontFamily: 'Montserrat-Bold',
    color: COLORS.primary,
  },
  badge: {
    color: COLORS.gray,
    fontFamily: 'Lato-Regular',
  },
  expandableContent: {
    marginTop: 12,
    paddingHorizontal: 4,
  },
  infoRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  infoLabel: {
    fontSize: 14,
    fontFamily: 'Lato-Regular',
    color: COLORS.gray,
    width: 120,
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Lato-Regular',
    color: COLORS.primary,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Lato-Regular',
    color: COLORS.gray,
    textAlign: 'center',
    paddingVertical: 20,
  },
})
