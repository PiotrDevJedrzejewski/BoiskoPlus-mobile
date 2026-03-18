import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import customFetch from '../assets/utils/customFetch'
import { useAuth } from './AuthContext'

const FriendshipContext = createContext()

export const FriendshipProvider = ({ children }) => {
  const { user, isAuthChecked } = useAuth()

  // ─── Stan znajomych ───────────────────────────────────────────────────────
  const [friends, setFriends] = useState([])
  const [friendsLoading, setFriendsLoading] = useState(false)
  const [friendsError, setFriendsError] = useState(null)

  // ─── Stan zaproszeń ───────────────────────────────────────────────────────
  const [incoming, setIncoming] = useState([])
  const [outgoing, setOutgoing] = useState([])
  const [pendingLoading, setPendingLoading] = useState(false)
  const [pendingError, setPendingError] = useState(null)

  // ─── Wyszukiwarka użytkowników ────────────────────────────────────────────
  const [searchResults, setSearchResults] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState(null)
  const [searchHasMore, setSearchHasMore] = useState(false)

  const isMountedRef = useRef(true)
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // ─── Fetch znajomych ──────────────────────────────────────────────────────

  const fetchFriends = useCallback(async () => {
    if (!isMountedRef.current) return
    setFriendsLoading(true)
    setFriendsError(null)
    try {
      const { data } = await customFetch.get('/friendships/friends')
      if (isMountedRef.current) setFriends(data.friends)
    } catch (err) {
      if (isMountedRef.current)
        setFriendsError(err?.response?.data?.msg || 'Błąd pobierania znajomych')
    } finally {
      if (isMountedRef.current) setFriendsLoading(false)
    }
  }, [])

  // ─── Fetch zaproszeń ─────────────────────────────────────────────────────

  const fetchPending = useCallback(async () => {
    if (!isMountedRef.current) return
    setPendingLoading(true)
    setPendingError(null)
    try {
      const { data } = await customFetch.get('/friendships/pending')
      if (isMountedRef.current) {
        setIncoming(data.incoming)
        setOutgoing(data.outgoing)
      }
    } catch (err) {
      if (isMountedRef.current)
        setPendingError(err?.response?.data?.msg || 'Błąd pobierania zaproszeń')
    } finally {
      if (isMountedRef.current) setPendingLoading(false)
    }
  }, [])

  // ─── Ładowanie przy starcie ───────────────────────────────────────────────

  useEffect(() => {
    if (!isAuthChecked || !user?.userID) return
    fetchFriends()
    fetchPending()
  }, [isAuthChecked, user?.userID, fetchFriends, fetchPending])

  // ─── Wyszukiwarka użytkowników ────────────────────────────────────────────

  const searchUsers = useCallback(async (query) => {
    const q = query?.trim()
    if (!q) {
      setSearchResults([])
      setSearchQuery('')
      setSearchHasMore(false)
      return
    }

    setSearchQuery(q)
    setSearchLoading(true)
    setSearchError(null)
    try {
      const { data } = await customFetch.get('/users/search', { params: { q } })
      if (isMountedRef.current) {
        setSearchResults(data.users)
        setSearchHasMore(data.hasMore)
      }
    } catch (err) {
      if (isMountedRef.current)
        setSearchError(err?.response?.data?.msg || 'Błąd wyszukiwania użytkowników')
    } finally {
      if (isMountedRef.current) setSearchLoading(false)
    }
  }, [])

  const clearSearch = useCallback(() => {
    setSearchResults([])
    setSearchQuery('')
    setSearchHasMore(false)
    setSearchError(null)
  }, [])

  // ─── Handlery akcji ───────────────────────────────────────────────────────

  // Aktualizuje obiekt friendship w searchResults dla danego userID
  const patchSearchResult = useCallback((targetUserID, friendshipPatch) => {
    setSearchResults((prev) =>
      prev.map((u) =>
        (u._id?.toString() ?? u.userID?.toString()) === targetUserID.toString()
          ? { ...u, friendship: { ...u.friendship, ...friendshipPatch } }
          : u
      )
    )
  }, [])

  const sendFriendRequest = useCallback(
    async (recipientID, recipientData) => {
      const { data } = await customFetch.post(
        `/friendships/send/${recipientID}`
      )
      const f = data.friendship
      // Optimistic update w wynikach wyszukiwania
      patchSearchResult(recipientID, {
        status: 'pending',
        friendshipID: f._id,
        direction: 'outgoing',
      })
      // Dodaj do outgoing z wypełnionym obiektem recipient
      setOutgoing((prev) => [{ ...f, recipient: recipientData ?? f.recipient }, ...prev])
      return data
    },
    [patchSearchResult]
  )

  const respondToFriendRequest = useCallback(
    async (friendshipID, action) => {
      const { data } = await customFetch.patch(
        `/friendships/${friendshipID}/respond`,
        { action }
      )
      if (action === 'accepted') {
        await fetchFriends()
        setIncoming((prev) => prev.filter((f) => f._id.toString() !== friendshipID))
      } else {
        setIncoming((prev) => prev.filter((f) => f._id.toString() !== friendshipID))
      }
      return data
    },
    [fetchFriends]
  )

  const removeFriendship = useCallback(
    async (friendshipID, otherUserID) => {
      await customFetch.delete(`/friendships/${friendshipID}`)
      setFriends((prev) =>
        prev.filter((f) => f.friendshipID.toString() !== friendshipID)
      )
      setOutgoing((prev) => prev.filter((f) => f._id.toString() !== friendshipID))
      // Aktualizuj status w wynikach wyszukiwania jeśli użytkownik tam jest
      if (otherUserID) {
        patchSearchResult(otherUserID, {
          status: 'none',
          friendshipID: null,
          direction: null,
        })
      }
    },
    [patchSearchResult]
  )

  // Anulowanie oczekującego zaproszenia (requester wycofuje)
  const cancelFriendRequest = useCallback(
    async (friendshipID, recipientID) => {
      await customFetch.delete(`/friendships/${friendshipID}`)
      setOutgoing((prev) => prev.filter((f) => f._id.toString() !== friendshipID))
      if (recipientID) {
        patchSearchResult(recipientID, {
          status: 'none',
          friendshipID: null,
          direction: null,
        })
      }
    },
    [patchSearchResult]
  )

  const incomingCount = incoming.length

  return (
    <FriendshipContext.Provider
      value={{
        // znajomi
        friends,
        friendsLoading,
        friendsError,
        fetchFriends,

        // zaproszenia
        incoming,
        outgoing,
        incomingCount,
        pendingLoading,
        pendingError,
        fetchPending,

        // wyszukiwarka
        searchResults,
        searchQuery,
        searchLoading,
        searchError,
        searchHasMore,
        searchUsers,
        clearSearch,

        // handlery
        sendFriendRequest,
        respondToFriendRequest,
        removeFriendship,
        cancelFriendRequest,
      }}
    >
      {children}
    </FriendshipContext.Provider>
  )
}

export const useFriendship = () => {
  const context = useContext(FriendshipContext)
  if (!context) {
    throw new Error('useFriendship must be used within FriendshipProvider')
  }
  return context
}
