import { useState, useCallback, useRef } from 'react'
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { dbg, useDebugMount } from '../../assets/utils/debugLogger'
import { useFriendship } from '../../context/FriendshipContext'
import PlayerCardWithActions from '../../components/PlayerCardWithActions'
import BottomSpacer from '../../components/BottomSpacer'

import { useThemedStyles } from '../../context/themeStore'
import { SPACING, BORDER_RADIUS } from '../../Theme/StyleConstants'
import { verticalScale, moderateScale, scaleFont } from '../../Theme/ScalableStyles'

const SEARCH_DEBOUNCE_MS = 300
const SCREEN_HEIGHT = Dimensions.get('window').height

const FriendsScreen = () => {
  dbg('FriendsScreen')
  useDebugMount('FriendsScreen')
  const { styles, colors } = useThemedStyles(createStyles)

  const {
    friends,
    friendsLoading,
    incoming,
    outgoing,
    pendingLoading,
    searchResults,
    searchLoading,
    searchQuery,
    searchHasMore,
    searchUsers,
    clearSearch,
    sendFriendRequest,
    respondToFriendRequest,
    removeFriendship,
    cancelFriendRequest,
  } = useFriendship()

  const [searchInput, setSearchInput] = useState('')
  const [pendingFilter, setPendingFilter] = useState('incoming') // 'incoming' | 'outgoing'
  const searchDebounceRef = useRef(null)

  const handleSearchChange = useCallback(
    (text) => {
      setSearchInput(text)
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
      if (!text.trim() || text.trim().length < 3) {
        clearSearch()
        return
      }
      searchDebounceRef.current = setTimeout(() => {
        searchUsers(text)
      }, SEARCH_DEBOUNCE_MS)
    },
    [searchUsers, clearSearch]
  )

  const handleClearSearch = useCallback(() => {
    setSearchInput('')
    clearSearch()
  }, [clearSearch])

  const isSearching = searchInput.length > 0
  const searchTooShort = searchInput.length > 0 && searchInput.trim().length < 3

  const getSearchActions = useCallback(
    (user) => {
      const f = user.friendship
      const userID = user._id || user.userID
      switch (f?.status) {
        case 'pending':
          switch (f.direction) {
            case 'outgoing':
              return [{ text: 'Anuluj', type: 'secondary', handler: () => cancelFriendRequest(f.friendshipID, userID) }]
            case 'incoming':
              return [
                { text: 'Akceptuj', type: 'primary', handler: () => respondToFriendRequest(f.friendshipID, 'accepted') },
                { text: 'Odrzuć', type: 'secondary', handler: () => respondToFriendRequest(f.friendshipID, 'rejected') },
              ]
            default:
              return []
          }
        case 'accepted':
          return [{ text: 'Znajomy ✓', type: 'secondary', handler: () => {} }]
        default:
          return [{ text: 'Dodaj', type: 'primary', handler: () => sendFriendRequest(userID, user) }]
      }
    },
    [sendFriendRequest, cancelFriendRequest, respondToFriendRequest]
  )

  return (
    <View style={styles.container}>
      {/* ─── Nagłówek ─── */}
      <View style={styles.header}>
        <Ionicons name='people' size={moderateScale(26, 0.35)} color={colors.PrimaryGreen} />
        <Text style={styles.headerText}>Znajomi</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps='handled'
      >
        {/* ─── Wyszukiwarka ─── */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <Ionicons
              name='people-outline'
              size={moderateScale(24, 0.35)}
              color={colors.PrimaryGreen}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              value={searchInput}
              onChangeText={handleSearchChange}
              placeholder='Szukaj użytkownika...'
              placeholderTextColor={colors.thirdText}
              autoCorrect={false}
              autoCapitalize='none'
            />
            {searchInput.length > 0 && (
              <TouchableOpacity onPress={handleClearSearch} style={styles.clearButton}>
                <Ionicons name='close-circle' size={moderateScale(20, 0.35)} color={colors.thirdText} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {isSearching ? (
          /* ─── Wyniki wyszukiwania ─── */
          <View>
            {searchTooShort ? (
              <Text style={styles.hintText}>Wpisz co najmniej 3 znaki</Text>
            ) : searchLoading ? (
              <ActivityIndicator color={colors.PrimaryGreen} style={styles.loader} />
            ) : searchResults.length === 0 && searchQuery.length > 0 ? (
              <Text style={styles.emptyText}>Brak użytkowników pasujących do &quot;{searchQuery}&quot;</Text>
            ) : (
              searchResults.map((user) => (
                <PlayerCardWithActions
                  key={user._id || user.userID}
                  player={user}
                  actions={getSearchActions(user)}
                />
              ))
            )}
            {searchHasMore && (
              <Text style={styles.hintText}>Wyświetlono tylko część wyników — doprecyzuj zapytanie.</Text>
            )}
          </View>
        ) : (
          <>
            {/* ─── Sekcja zaproszeń (max 35% ekranu) ─── */}
            <View style={styles.pendingSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Zaproszenia</Text>
                <View style={styles.filterTabs}>
                  <TouchableOpacity
                    style={[styles.filterTab, pendingFilter === 'incoming' && styles.filterTabActive]}
                    onPress={() => setPendingFilter('incoming')}
                  >
                    <Text style={[styles.filterTabText, pendingFilter === 'incoming' && styles.filterTabTextActive]}>
                      Przychodzące{incoming.length > 0 ? ` (${incoming.length})` : ''}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.filterTab, pendingFilter === 'outgoing' && styles.filterTabActive]}
                    onPress={() => setPendingFilter('outgoing')}
                  >
                    <Text style={[styles.filterTabText, pendingFilter === 'outgoing' && styles.filterTabTextActive]}>
                      Wysłane{outgoing.length > 0 ? ` (${outgoing.length})` : ''}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <ScrollView
                style={styles.pendingList}
                nestedScrollEnabled
                showsVerticalScrollIndicator={false}
              >
                {pendingLoading ? (
                  <ActivityIndicator color={colors.PrimaryGreen} style={styles.loader} />
                ) : pendingFilter === 'incoming' ? (
                  incoming.length === 0 ? (
                    <Text style={styles.emptyText}>Brak przychodzących zaproszeń</Text>
                  ) : (
                    incoming.map((item) => (
                      <PlayerCardWithActions
                        key={item._id}
                        player={item.requester}
                        actions={[
                          { text: 'Akceptuj', type: 'primary', handler: () => respondToFriendRequest(item._id, 'accepted') },
                          { text: 'Odrzuć', type: 'secondary', handler: () => respondToFriendRequest(item._id, 'rejected') },
                        ]}
                      />
                    ))
                  )
                ) : outgoing.length === 0 ? (
                  <Text style={styles.emptyText}>Brak wysłanych zaproszeń</Text>
                ) : (
                  outgoing.map((item) => (
                    <PlayerCardWithActions
                      key={item._id}
                      player={item.recipient}
                      actions={[
                        { text: 'Anuluj', type: 'secondary', handler: () => cancelFriendRequest(item._id, item.recipient?._id) },
                      ]}
                    />
                  ))
                )}
              </ScrollView>
            </View>

            {/* ─── Lista znajomych (nieskończony scroll) ─── */}
            {/* TODO: Paginacja — aktualnie ładujemy wszystkich znajomych naraz.
                W przyszłości dodać cursor-based pagination gdy lista urośnie. */}
            <View>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  Znajomi{friends.length > 0 ? ` (${friends.length})` : ''}
                </Text>
              </View>
              {friendsLoading ? (
                <ActivityIndicator color={colors.PrimaryGreen} style={styles.loader} />
              ) : friends.length === 0 ? (
                <Text style={styles.emptyText}>Twoja lista znajomych jest pusta</Text>
              ) : (
                friends.map((item) => (
                  <PlayerCardWithActions
                    key={item.friendshipID}
                    player={item.friend}
                    actions={[
                      { text: 'Usuń', type: 'secondary', handler: () => removeFriendship(item.friendshipID, item.friend?._id) },
                    ]}
                  />
                ))
              )}
            </View>
          </>
        )}
        <BottomSpacer />
      </ScrollView>
    </View>
  )
}

export default FriendsScreen

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: verticalScale(20),
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
    headerText: {
      fontSize: scaleFont(24, 0.45),
      fontFamily: 'Montserrat-Bold',
      color: colors.primaryText,
      marginLeft: SPACING.md,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: SPACING.md,
      paddingBottom: verticalScale(40),
    },

    // ─── Search ───────────────────────────────────────────────────────────────
    searchContainer: {
      marginBottom: verticalScale(16),
    },
    searchBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.backgroundSecondary,
      borderRadius: BORDER_RADIUS.md,
      paddingHorizontal: SPACING.md,
      paddingVertical: verticalScale(10),
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4,
    },
    searchIcon: {
      marginRight: SPACING.sm,
    },
    searchInput: {
      flex: 1,
      fontSize: scaleFont(16, 0.35),
      color: colors.primaryText,
      fontFamily: 'Lato-Regular',
      minHeight: verticalScale(32),
    },
    clearButton: {
      paddingLeft: SPACING.sm,
    },

    // ─── Sekcja zaproszeń ────────────────────────────────────────────────────
    pendingSection: {
      maxHeight: SCREEN_HEIGHT * 0.35,
      marginBottom: verticalScale(20),
      backgroundColor: 'rgba(0, 0, 0, 0.15)',
      borderRadius: BORDER_RADIUS.md,
      overflow: 'hidden',
      paddingHorizontal: SPACING.sm,
      paddingTop: verticalScale(10),
      paddingBottom: verticalScale(8),
    },
    pendingList: {
      flexGrow: 0,
    },

    // ─── Nagłówki sekcji ─────────────────────────────────────────────────────
    sectionHeader: {
      marginBottom: verticalScale(8),
    },
    sectionTitle: {
      fontSize: scaleFont(14, 0.35),
      fontFamily: 'Montserrat-Bold',
      color: colors.PrimaryGreen,
      textTransform: 'uppercase',
      marginBottom: verticalScale(8),
      marginLeft: SPACING.xs,
    },

    // ─── Filter tabs ─────────────────────────────────────────────────────────
    filterTabs: {
      flexDirection: 'row',
      gap: SPACING.sm,
    },
    filterTab: {
      flex: 1,
      paddingVertical: verticalScale(8),
      paddingHorizontal: SPACING.sm,
      borderRadius: BORDER_RADIUS.xxl,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    filterTabActive: {
      backgroundColor: colors.PrimaryGreen,
      borderColor: colors.PrimaryGreen,
    },
    filterTabText: {
      fontSize: scaleFont(12, 0.3),
      fontFamily: 'Lato-Regular',
      color: colors.thirdText,
    },
    filterTabTextActive: {
      color: colors.background,
    },

    // ─── Stany puste / pomocnicze ─────────────────────────────────────────────
    emptyText: {
      textAlign: 'center',
      fontSize: scaleFont(13, 0.3),
      fontFamily: 'Lato-Regular',
      color: colors.thirdText,
      paddingVertical: verticalScale(12),
      fontStyle: 'italic',
    },
    hintText: {
      textAlign: 'center',
      fontSize: scaleFont(12, 0.3),
      fontFamily: 'Lato-Regular',
      color: colors.thirdText,
      paddingTop: verticalScale(8),
      fontStyle: 'italic',
    },
    loader: {
      paddingVertical: verticalScale(16),
    },
  })
