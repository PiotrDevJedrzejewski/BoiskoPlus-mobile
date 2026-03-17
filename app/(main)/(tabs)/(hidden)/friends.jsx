import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '../../../../constants/colors'
import PlayerCardWithActions from '../../../../components/PlayerCardWithActions'
import { useResponsiveScale } from '../../../../assets/utils/scaleUI.UX'
import { useDashboard } from '../../../../context/DashboardContext'

const ExpandableSection = ({ title, expanded, onToggle, children, styles, ui }) => (
  // Mały komponent pomocniczy: sekcja, którą można zwinąć lub rozwinąć.
  // Dzięki temu logika nagłówka zaproszeń nie zaśmieca głównego rendera ekranu.
  <View style={styles.expandableContainer}>
    <TouchableOpacity
      style={styles.expandableHeader}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <Text style={styles.expandableTitle}>{title}</Text>
      <Ionicons
        name={expanded ? 'chevron-up' : 'chevron-down'}
        size={ui.moderateScale(24, 0.35)}
        color={COLORS.secondary}
      />
    </TouchableOpacity>
    {expanded && <View style={styles.expandableContent}>{children}</View>}
  </View>
)

const FriendsScreen = () => {
  const ui = useResponsiveScale()
  const styles = createStyles(ui)
  const [showInvites, setShowInvites] = useState(false)
  const {
    // Dane i akcje bierzemy z DashboardContext,
    // więc ekran jest tylko warstwą prezentacji i wywołań UI.
    friendshipsData,
    refreshFriendshipsData,
    acceptFriendRequest,
    rejectFriendRequest,
    cancelFriendRequest,
    removeFriend,
  } = useDashboard()

  const { friends, outgoingRequests, incomingRequests, loading, error } =
    friendshipsData

  useEffect(() => {
    // Po wejściu na ekran wymuszamy świeże pobranie danych.
    // To pozwala szybko zsynchronizować UI z backendem,
    // nawet jeśli użytkownik wrócił tutaj po akcji z innego widoku.
    refreshFriendshipsData({ force: true }).catch(() => {})
  }, [refreshFriendshipsData])

  const handleManualRefresh = async () => {
    // Pull-to-refresh w ScrollView woła dokładnie ten handler.
    await refreshFriendshipsData({ force: true })
  }

  const showActionError = (fallbackMessage, actionResult) => {
    // Jeden helper do wyświetlania błędów z backendu,
    // żeby nie duplikować Alert.alert w każdej akcji osobno.
    Alert.alert('Błąd', actionResult?.error || fallbackMessage)
  }

  const handleRejectInvite = async (player) => {
    // Do akcji używamy `friendshipId`, bo backend operuje na relacji,
    // a nie bezpośrednio na samym użytkowniku.
    const result = await rejectFriendRequest(player.friendshipId)

    if (!result.success) {
      showActionError('Nie udało się odrzucić zaproszenia', result)
    }
  }

  const handleAcceptInvite = async (player) => {
    // Analogicznie do reject, tylko z akcją accept.
    const result = await acceptFriendRequest(player.friendshipId)

    if (!result.success) {
      showActionError('Nie udało się zaakceptować zaproszenia', result)
    }
  }

  const handleRemoveFriend = (player) => {
    // Przed usunięciem znajomego prosimy o potwierdzenie,
    // bo to akcja destrukcyjna i łatwo kliknąć ją przypadkiem.
    Alert.alert(
      'Usuń znajomego',
      `Czy na pewno chcesz usunąć ${player.nickName} z listy znajomych?`,
      [
        {
          text: 'Nie',
          style: 'cancel',
        },
        {
          text: 'Usuń',
          style: 'destructive',
          onPress: async () => {
            // Faktyczne wywołanie API robimy dopiero po zatwierdzeniu w alercie.
            const result = await removeFriend(player.friendshipId)

            if (!result.success) {
              showActionError('Nie udało się usunąć znajomego', result)
            }
          },
        },
      ]
    )
  }

  const handleWriteToFriend = (player) => {
    // Chatu jeszcze nie podłączamy, więc świadomie pokazujemy placeholder,
    // zamiast zostawiać przycisk, który nic nie robi.
    Alert.alert(
      'Czat jeszcze niedostępny',
      `Rozmowa z ${player.nickName} będzie podłączona w kolejnym kroku.`
    )
  }

  const handleCancelInvite = (player) => {
    // To samo podejście co przy remove: najpierw potwierdzenie, potem delete na backendzie.
    Alert.alert(
      'Anuluj zaproszenie',
      `Czy na pewno chcesz anulować zaproszenie do ${player.nickName}?`,
      [
        {
          text: 'Nie',
          style: 'cancel',
        },
        {
          text: 'Anuluj zaproszenie',
          style: 'destructive',
          onPress: async () => {
            const result = await cancelFriendRequest(player.friendshipId)

            if (!result.success) {
              showActionError('Nie udało się anulować zaproszenia', result)
            }
          },
        },
      ]
    )
  }

  const totalInvites = incomingRequests.length + outgoingRequests.length
  // Loader startowy pokazujemy tylko wtedy, gdy naprawdę nic jeszcze nie mamy.
  // Jeśli trwa kolejne odświeżenie, ale stare dane są na ekranie, lepiej ich nie zasłaniać spinnerem.
  const showInitialLoader = loading && friends.length === 0 && totalInvites === 0

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons
          name='people'
          size={ui.moderateScale(26, 0.35)}
          color={COLORS.secondary}
        />
        <Text style={styles.headerText}>Znajomi</Text>
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            // `refreshing` steruje natywnym spinnerem pull-to-refresh.
            refreshing={loading}
            onRefresh={handleManualRefresh}
            tintColor={COLORS.secondary}
            colors={[COLORS.secondary]}
            progressBackgroundColor={COLORS.backgroundSecondary}
          />
        }
      >
         {/* Globalny komunikat błędu dla sekcji znajomych i zaproszeń. */}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <ExpandableSection
          title={`Zaproszenia do znajomych (${totalInvites})`}
          expanded={showInvites}
          onToggle={() => setShowInvites((current) => !current)}
          styles={styles}
          ui={ui}
        >
          <Text style={styles.invitesLabel}>Otrzymane</Text>
          {/* Gdy lista jest pusta, dajemy użytkownikowi jasny komunikat,
              zamiast zostawiać pustą dziurę w UI. */}
          {incomingRequests.length === 0 ? (
            <Text style={styles.helperText}>Brak oczekujących zaproszeń.</Text>
          ) : null}
          {incomingRequests.map((player) => (
            <PlayerCardWithActions
              key={player.friendshipId}
              player={player}
              actions={[
                {
                  text: 'Odrzuć',
                  type: 'secondary',
                  handler: () => handleRejectInvite(player),
                },
                {
                  text: 'Dodaj',
                  type: 'primary',
                  handler: () => handleAcceptInvite(player),
                },
              ]}
            />
          ))}

          <Text style={styles.invitesLabel}>Wysłane</Text>
          {/* To samo dla zaproszeń wychodzących. */}
          {outgoingRequests.length === 0 ? (
            <Text style={styles.helperText}>Brak wysłanych zaproszeń.</Text>
          ) : null}
          {outgoingRequests.map((player) => (
            <PlayerCardWithActions
              key={player.friendshipId}
              player={player}
              actions={[
                {
                  text: 'Anuluj',
                  type: 'secondary',
                  handler: () => handleCancelInvite(player),
                },
              ]}
            />
          ))}
        </ExpandableSection>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>Zaakceptowani znajomi</Text>
          <Text style={styles.sectionMeta}>{friends.length} osób</Text>
        </View>

        {showInitialLoader ? (
          // Duży loader ma sens tylko przy pierwszym wejściu,
          // kiedy ekran nie ma jeszcze czego wyświetlić.
          <View style={styles.loaderContainer}>
            <ActivityIndicator size='large' color={COLORS.secondary} />
            <Text style={styles.helperText}>Ładowanie znajomych...</Text>
          </View>
        ) : null}

        {!showInitialLoader && friends.length === 0 ? (
          // Jeśli loading już minął i lista dalej jest pusta,
          // to znaczy, że to realny stan biznesowy, a nie chwilowy brak danych.
          <Text style={styles.helperText}>Nie masz jeszcze zaakceptowanych znajomych.</Text>
        ) : null}

        {friends.map((friend) => (
          <PlayerCardWithActions
            key={friend.friendshipId}
            player={friend}
            actions={[
              {
                text: 'Usuń',
                type: 'secondary',
                handler: () => handleRemoveFriend(friend),
              },
              {
                text: 'Napisz',
                type: 'primary',
                handler: () => handleWriteToFriend(friend),
              },
            ]}
          />
        ))}
      </ScrollView>
    </View>
  )
}

export default FriendsScreen

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
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
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
  loaderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: ui.verticalScale(20),
  },
  expandableContainer: {
    marginBottom: ui.verticalScale(20),
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
  expandableContent: {
    marginTop: ui.verticalScale(12),
    paddingHorizontal: ui.spacing(4, 0.25),
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: ui.moderateScale(12, 0.35),
    paddingVertical: ui.verticalScale(10),
  },
  invitesLabel: {
    fontSize: ui.scaleFont(14, 0.35),
    fontFamily: 'Montserrat-Bold',
    color: COLORS.secondary,
    marginTop: ui.verticalScale(6),
    marginBottom: ui.verticalScale(4),
    paddingHorizontal: ui.spacing(8, 0.35),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: ui.verticalScale(8),
  },
  sectionLabel: {
    fontSize: ui.scaleFont(16, 0.35),
    fontFamily: 'Montserrat-Bold',
    color: COLORS.secondary,
  },
  sectionMeta: {
    fontSize: ui.scaleFont(12, 0.3),
    fontFamily: 'Lato-Regular',
    color: COLORS.gray,
  },
  helperText: {
    fontSize: ui.scaleFont(13, 0.35),
    fontFamily: 'Lato-Regular',
    color: COLORS.gray,
    paddingHorizontal: ui.spacing(8, 0.35),
    paddingVertical: ui.verticalScale(6),
  },
  errorText: {
    fontSize: ui.scaleFont(13, 0.35),
    fontFamily: 'Lato-Regular',
    color: COLORS.error,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: ui.moderateScale(12, 0.35),
    padding: ui.spacing(12),
    marginBottom: ui.verticalScale(12),
  },
})