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

// Pobiera statystyki dla listy userIds, zwraca Map: userId -> stats
const fetchStatsMap = async (userIds) => {
  if (!userIds.length) return {}
  try {
    const { data } = await customFetch.post('/user-stats/multiple', { userIds })
    const map = {}
    for (const stat of data.stats) {
      if (stat.userID) map[stat.userID.toString()] = stat
    }
    return map
  } catch {
    return {}
  }
}

export const FriendshipProvider = ({ children }) => {
  const renderCountRef = useRef(0)
  renderCountRef.current += 1
  console.log('[FriendshipContext] render #' + renderCountRef.current)

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
    console.log('[FriendshipContext] MOUNTED')
    return () => console.log('[FriendshipContext] UNMOUNTED')
  }, [])

  useEffect(() => {
    console.log('[FriendshipContext] useEffect: mount/unmount isMountedRef (mount-only)')
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
      const userIds = data.friends.map((f) => f.friend?._id?.toString()).filter(Boolean)
      const statsMap = await fetchStatsMap(userIds)
      const friendsWithStats = data.friends.map((f) => ({
        ...f,
        friend: {
          ...f.friend,
          userStats: statsMap[f.friend?._id?.toString()] || { gamesPlayed: 0, eventsOrganized: 0, totalLikes: 0 },
        },
      }))
      if (isMountedRef.current) setFriends(friendsWithStats)
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
      const incomingIds = data.incoming.map((i) => (i.requester?._id ?? i.requester)?.toString()).filter(Boolean)
      const outgoingIds = data.outgoing.map((o) => (o.recipient?._id ?? o.recipient)?.toString()).filter(Boolean)
      const statsMap = await fetchStatsMap([...new Set([...incomingIds, ...outgoingIds])])
      const incomingWithStats = data.incoming.map((i) => {
        const uid = (i.requester?._id ?? i.requester)?.toString()
        return { ...i, requester: { ...i.requester, userStats: statsMap[uid] || { gamesPlayed: 0, eventsOrganized: 0, totalLikes: 0 } } }
      })
      const outgoingWithStats = data.outgoing.map((o) => {
        const uid = (o.recipient?._id ?? o.recipient)?.toString()
        return { ...o, recipient: { ...o.recipient, userStats: statsMap[uid] || { gamesPlayed: 0, eventsOrganized: 0, totalLikes: 0 } } }
      })
      if (isMountedRef.current) {
        setIncoming(incomingWithStats)
        setOutgoing(outgoingWithStats)
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
    console.log('[FriendshipContext] useEffect: isAuthChecked/user changed')
    if (!isAuthChecked || !user?.userID) return
    initialConnectDoneRef.current = false // reset przy zmianie usera
    fetchFriends()
    fetchPending()
  }, [isAuthChecked, user?.userID, fetchFriends, fetchPending])

  // ─── Resync po reconnect (bez dźwięku) ───────────────────────────────────
  // Jeśli socket zerwał się i wrócił bez pełnego re-logowania (Render free-tier drop interesuje nas),
  // robimy cichy HTTP-fetch żeby badge odzwierciedlał prawdę z DB.

  useEffect(() => {
    console.log('[FriendshipContext] useEffect: notificationConnectionState/user changed')
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
    console.log('[FriendshipContext] useEffect: notificationSocket changed')
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

    // userB zaakceptował / odrzucił zaproszenie userA
    // respondedBy = ID userB (osoby której karta może być w searchResults userA)
    const handleFriendRequestResponded = ({ friendshipID, action, respondedBy }) => {
      if (!isMountedRef.current) return
      setOutgoing((prev) => prev.filter((entry) => entry._id?.toString() !== friendshipID?.toString()))
      if (action === 'accepted') {
        // Odśwież listę znajomych — userA widzi nowego znajomego
        fetchFriends()
        // Karta userB w wyszukiwarce → "Znajomy ✓"
        if (respondedBy) patchSearchResult(respondedBy, { status: 'accepted', friendshipID, direction: null })
      } else {
        // Odrzucone — resetuj kartę userB żeby userA mógł zaprosić ponownie
        if (respondedBy) patchSearchResult(respondedBy, { status: 'none', friendshipID: null, direction: null })
      }
    }

    // ktoś usunął znajomość / anulował zaproszenie (druga strona dostaje event)
    // removedBy = ID osoby która usunęła (może być w searchResults odbiorcy eventu)
    const handleFriendshipRemoved = ({ friendshipID, removedBy, wasStatus }) => {
      if (!isMountedRef.current) return
      if (wasStatus === 'accepted') {
        // Usuń z listy znajomych
        setFriends((prev) => prev.filter((entry) => entry.friendshipID?.toString() !== friendshipID?.toString()))
        // Karta usuniętego znajomego w wyszukiwarce → "Dodaj"
        if (removedBy) patchSearchResult(removedBy, { status: 'none', friendshipID: null, direction: null })
      } else {
        // Było pending — usuń z incoming (userB dostaje info że userA wycofał zaproszenie)
        setIncoming((prev) => prev.filter((entry) => entry._id?.toString() !== friendshipID?.toString()))
        setUnreadFriendRequestsCount((prev) => Math.max(0, prev - 1))
        // Karta userA (który anulował) w wyszukiwarce userB → "Dodaj"
        if (removedBy) patchSearchResult(removedBy, { status: 'none', friendshipID: null, direction: null })
      }
    }

    notificationSocket.on('friendRequest', handleFriendRequest)
    notificationSocket.on('friendRequestResponded', handleFriendRequestResponded)
    notificationSocket.on('friendshipRemoved', handleFriendshipRemoved)
    return () => {
      notificationSocket.off('friendRequest', handleFriendRequest)
      notificationSocket.off('friendRequestResponded', handleFriendRequestResponded)
      notificationSocket.off('friendshipRemoved', handleFriendshipRemoved)
    }
  }, [notificationSocket, fetchFriends, setUnreadFriendRequestsCount, patchSearchResult])

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
      const userIds = data.users.map((u) => u._id?.toString()).filter(Boolean)
      const statsMap = await fetchStatsMap(userIds)
      const usersWithStats = data.users.map((u) => ({
        ...u,
        userStats: statsMap[u._id?.toString()] || { gamesPlayed: 0, eventsOrganized: 0, totalLikes: 0 },
      }))
      if (isMountedRef.current) {
        setSearchResults(usersWithStats)
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
      const friendship = data.friendship
      // Optimistic update w wynikach wyszukiwania
      patchSearchResult(recipientID, {
        status: 'pending',
        friendshipID: friendship._id,
        direction: 'outgoing',
      })
      // Dodaj do outgoing, usuwając stary wpis dla tego samego odbiorcy lub tego samego _id
      // (backend może zwrócić ten sam _id przy re-invite, co powoduje duplicate key w React)
      setOutgoing((prev) => {
        const recipientStr = recipientID?.toString()
        const newIdStr = friendship._id?.toString()
        const filtered = prev.filter(
          (existingEntry) =>
            existingEntry._id?.toString() !== newIdStr &&
            (existingEntry.recipient?._id ?? existingEntry.recipient)?.toString() !== recipientStr
        )
        return [{ ...friendship, recipient: recipientData ?? friendship.recipient }, ...filtered]
      })
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
      setIncoming((prev) => {
        const item = prev.find((invite) => invite._id.toString() === friendshipID)
        // Aktualizuj wyniki wyszukiwania dla nadawcy zaproszenia
        if (item?.requester) {
          const requesterID = (item.requester._id ?? item.requester).toString()
          if (action === 'accepted') {
            patchSearchResult(requesterID, { status: 'accepted', friendshipID, direction: null })
          } else {
            patchSearchResult(requesterID, { status: 'none', friendshipID: null, direction: null })
          }
        }
        return prev.filter((invite) => invite._id.toString() !== friendshipID)
      })
      setUnreadFriendRequestsCount((prev) => Math.max(0, prev - 1))
      return data
    },
    [fetchFriends, setUnreadFriendRequestsCount, patchSearchResult]
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
