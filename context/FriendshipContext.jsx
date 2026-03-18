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
import { useSocketIo } from './SocketIoContext'

const FriendshipContext = createContext()

export const FriendshipProvider = ({ children }) => {
  const { user, isAuthChecked } = useAuth()
  const { notificationSocket, setUnreadFriendRequestsCount, notificationConnectionState, ConnectionState } = useSocketIo()

  // Czy pierwsze połączenie już odbyło się (login-fetch obsługuje badge same’)
  const initialConnectDoneRef = useRef(false)

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
        // Cicha resync badge'a z DB (bez dźwięku) — poprawna wartość po re-logowaniu
        setUnreadFriendRequestsCount(data.incoming.length)
      }
    } catch (err) {
      if (isMountedRef.current)
        setPendingError(err?.response?.data?.msg || 'Błąd pobierania zaproszeń')
    } finally {
      if (isMountedRef.current) setPendingLoading(false)
    }
  }, [setUnreadFriendRequestsCount])

  // ─── Ładowanie przy starcie ───────────────────────────────────────────────

  useEffect(() => {
    if (!isAuthChecked || !user?.userID) return
    initialConnectDoneRef.current = false // reset przy zmianie usera
    fetchFriends()
    fetchPending()
  }, [isAuthChecked, user?.userID, fetchFriends, fetchPending])

  // ─── Resync po reconnect (bez dźwięku) ───────────────────────────────────
  // Jeśli socket zerwał się i wrócił bez pełnego re-logowania (Render free-tier drop interesuje nas),
  // robimy cichy HTTP-fetch żeby badge odzwierciedlał prawdę z DB.

  useEffect(() => {
    if (!user?.userID) return
    if (notificationConnectionState !== ConnectionState.CONNECTED) return

    if (!initialConnectDoneRef.current) {
      // Pierwsze CONNECTED — fetchPending już uruchomił login-effect powyżej
      initialConnectDoneRef.current = true
      return
    }

    // Każdy kolejny CONNECTED to reconnect — resync z DB (bez dźwięku)
    fetchPending()
  }, [notificationConnectionState, ConnectionState.CONNECTED, user?.userID, fetchPending])

  // ─── Real-time: nowe zaproszenie przez socket ─────────────────────────────

  useEffect(() => {
    if (!notificationSocket) return

    const handleFriendRequest = (friendshipData) => {
      if (!isMountedRef.current) return
      setIncoming((prev) => {
        // Unikaj duplikatów
        const exists = prev.some(
          (f) => f._id?.toString() === friendshipData._id?.toString()
        )
        if (exists) return prev
        return [friendshipData, ...prev]
      })
    }

    notificationSocket.on('friendRequest', handleFriendRequest)
    return () => {
      notificationSocket.off('friendRequest', handleFriendRequest)
    }
  }, [notificationSocket])

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
      }
      setIncoming((prev) => prev.filter((f) => f._id.toString() !== friendshipID))
      setUnreadFriendRequestsCount((prev) => Math.max(0, prev - 1))
      return data
    },
    [fetchFriends, setUnreadFriendRequestsCount]
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
