import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '../../../../constants/colors'
import PlayerCardWithActions from '../../../../components/PlayerCardWithActions'
import { useResponsiveScale } from '../../../../assets/utils/scaleUI.UX'
import { useDashboard } from '../../../../context/DashboardContext'
import customFetch from '../../../../assets/utils/customFetch'

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
  const [searchPhrase, setSearchPhrase] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState(null)
  const [searchMessage, setSearchMessage] = useState(null)
  const {
    // Dane i akcje bierzemy z DashboardContext,
    // więc ekran jest tylko warstwą prezentacji i wywołań UI.
    friendshipsData,
    refreshFriendshipsData,
    sendFriendRequest,
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

  const fetchSearchResults = async (phrase) => {
    const normalizedPhrase = phrase.trim()

    if (normalizedPhrase.length < 3) {
      setSearchResults([])
      setSearchMessage(null)
      setSearchError('Wpisz co najmniej 3 znaki nicku, aby rozpocząć wyszukiwanie.')
      return false
    }

    try {
      setSearchLoading(true)
      setSearchError(null)

      const response = await customFetch.get('/users/search', {
        params: { q: normalizedPhrase },
      })

      setSearchResults(response?.data?.users || [])
      setSearchMessage(response?.data?.msg || null)
      return true
    } catch (error) {
      console.error('Błąd wyszukiwania użytkowników:', error)
      setSearchResults([])
      setSearchMessage(null)
      setSearchError(
        error.response?.data?.msg || 'Nie udało się wyszukać użytkowników'
      )
      return false
    } finally {
      setSearchLoading(false)
    }
  }

  const handleSearchUsers = async () => fetchSearchResults(searchPhrase)

  const handleSearchInputChange = (value) => {
    setSearchPhrase(value)

    if (!value.trim()) {
      setSearchResults([])
      setSearchError(null)
      setSearchMessage(null)
    }
  }

  const refreshSearchResults = async () => {
    if (searchPhrase.trim().length < 3) return
    await fetchSearchResults(searchPhrase)
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

  const handleSearchSendRequest = async (player) => {
    const result = await sendFriendRequest(player._id)

    if (!result.success) {
      showActionError('Nie udało się wysłać zaproszenia do znajomych', result)
      return
    }

    await Promise.all([
      refreshFriendshipsData({ force: true }).catch(() => null),
      refreshSearchResults(),
    ])
  }

  const handleSearchAcceptInvite = async (player) => {
    const result = await acceptFriendRequest(player.friendship?.friendshipId)

    if (!result.success) {
      showActionError('Nie udało się zaakceptować zaproszenia', result)
      return
    }

    await Promise.all([
      refreshFriendshipsData({ force: true }).catch(() => null),
      refreshSearchResults(),
    ])
  }

  const handleSearchRejectInvite = async (player) => {
    const result = await rejectFriendRequest(player.friendship?.friendshipId)

    if (!result.success) {
      showActionError('Nie udało się odrzucić zaproszenia', result)
      return
    }

    await Promise.all([
      refreshFriendshipsData({ force: true }).catch(() => null),
      refreshSearchResults(),
    ])
  }

  const handleSearchCancelInvite = async (player) => {
    const result = await cancelFriendRequest(player.friendship?.friendshipId)

    if (!result.success) {
      showActionError('Nie udało się anulować zaproszenia', result)
      return
    }

    await Promise.all([
      refreshFriendshipsData({ force: true }).catch(() => null),
      refreshSearchResults(),
    ])
  }

  const handleSearchRemoveFriend = async (player) => {
    const result = await removeFriend(player.friendship?.friendshipId)

    if (!result.success) {
      showActionError('Nie udało się usunąć znajomego', result)
      return
    }

    await Promise.all([
      refreshFriendshipsData({ force: true }).catch(() => null),
      refreshSearchResults(),
    ])
  }

  const getSearchActions = (player) => {
    const friendship = player.friendship || {}

    if (friendship.canAcceptRequest) {
      return [
        {
          text: 'Odrzuć',
          type: 'secondary',
          handler: () => handleSearchRejectInvite(player),
        },
        {
          text: 'Dodaj',
          type: 'primary',
          handler: () => handleSearchAcceptInvite(player),
        },
      ]
    }

    if (friendship.canCancelRequest) {
      return [
        {
          text: 'Anuluj',
          type: 'secondary',
          handler: () => handleSearchCancelInvite(player),
        },
      ]
    }

    if (friendship.canRemoveFriend) {
      return [
        {
          text: 'Usuń',
          type: 'secondary',
          handler: () => handleSearchRemoveFriend(player),
        },
      ]
    }

    if (friendship.canSendRequest) {
      return [
        {
          text: 'Dodaj',
          type: 'primary',
          handler: () => handleSearchSendRequest(player),
        },
      ]
    }

    return []
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

        <View style={styles.searchSection}>
          <View style={styles.searchBox}>
            <Ionicons
              name='people'
              size={ui.moderateScale(24, 0.35)}
              color={COLORS.secondary}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              value={searchPhrase}
              onChangeText={handleSearchInputChange}
              placeholder='Szukaj po nicku...'
              placeholderTextColor='#999'
              autoCorrect={false}
              autoCapitalize='none'
              returnKeyType='search'
              onSubmitEditing={handleSearchUsers}
            />
            <TouchableOpacity
              style={styles.searchButton}
              onPress={handleSearchUsers}
              disabled={searchLoading}
              activeOpacity={0.8}
            >
              {searchLoading ? (
                <ActivityIndicator size='small' color={COLORS.primary} />
              ) : (
                <Text style={styles.searchButtonText}>Szukaj</Text>
              )}
            </TouchableOpacity>
          </View>

          {searchError ? (
            <Text style={styles.searchFeedbackError}>{searchError}</Text>
          ) : null}

          {searchResults.length > 0 ? (
            <View style={styles.searchResultsContainer}>
              {searchResults.slice(0, 5).map((player) => (
                <PlayerCardWithActions
                  key={player._id}
                  player={player}
                  actions={getSearchActions(player)}
                />
              ))}

              {searchResults.length > 5 ? (
                <ScrollView
                  style={styles.searchResultsScroll}
                  nestedScrollEnabled
                  showsVerticalScrollIndicator={false}
                >
                  {searchResults.slice(5).map((player) => (
                    <PlayerCardWithActions
                      key={player._id}
                      player={player}
                      actions={getSearchActions(player)}
                    />
                  ))}
                </ScrollView>
              ) : null}
            </View>
          ) : null}

          {searchMessage ? (
            <Text style={styles.searchFeedbackMessage}>{searchMessage}</Text>
          ) : null}
        </View>

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
  searchSection: {
    marginBottom: ui.verticalScale(20),
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: ui.controlRadius,
    paddingHorizontal: ui.controlPaddingHorizontal,
    paddingVertical: ui.buttonPaddingVertical,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    marginBottom: ui.verticalScale(12),
  },
  searchIcon: {
    marginRight: ui.spacing(8, 0.35),
  },
  searchInput: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: ui.controlRadius,
    flex: 1,
    fontSize: ui.scaleFont(16, 0.35),
    color: COLORS.primary,
    minHeight: ui.controlMinHeight,
    paddingHorizontal: ui.controlPaddingHorizontal,
    paddingVertical: ui.controlPaddingVertical,
  },
  searchButton: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: ui.controlPaddingHorizontal,
    paddingVertical: ui.buttonPaddingVertical,
    borderRadius: ui.controlRadius,
    marginLeft: ui.spacing(8, 0.35),
    minWidth: ui.scale(70),
    minHeight: ui.controlMinHeight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonText: {
    color: COLORS.background,
    fontFamily: 'ObjectFont',
    fontSize: ui.scaleFont(18, 0.4),
  },
  searchResultsContainer: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: ui.moderateScale(12, 0.35),
    paddingHorizontal: ui.spacing(10, 0.35),
    paddingVertical: ui.verticalScale(10),
  },
  searchResultsScroll: {
    maxHeight: ui.verticalScale(360),
  },
  searchFeedbackError: {
    fontSize: ui.scaleFont(13, 0.35),
    fontFamily: 'Lato-Regular',
    color: COLORS.error,
    paddingHorizontal: ui.spacing(8, 0.35),
    paddingBottom: ui.verticalScale(8),
  },
  searchFeedbackMessage: {
    fontSize: ui.scaleFont(13, 0.35),
    fontFamily: 'Lato-Regular',
    color: COLORS.gray,
    paddingHorizontal: ui.spacing(8, 0.35),
    paddingTop: ui.verticalScale(10),
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