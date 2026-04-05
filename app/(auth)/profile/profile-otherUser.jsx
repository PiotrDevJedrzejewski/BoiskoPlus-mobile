import { useState, useEffect, useMemo} from 'react'
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { COLORS } from '../../../constants/colors'
import { useResponsiveScale } from '../../../assets/utils/scaleUI.UX'
import { useAuth } from '../../../context/AuthContext'
import customFetch from '../../../assets/utils/customFetch'
import { dbg, useDebugMount } from '../../../assets/utils/debugLogger'

const defaultAvatar = require('../../../assets/images/defaultAvatar.png')

const StatItem = ({ label, value, styles }) => (
  <View style={styles.statItem}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
)

const ProfileUser = () => {
  dbg('OtherUserProfileScreen')
  useDebugMount('OtherUserProfileScreen')
  const router = useRouter()
  const { id } = useLocalSearchParams()
  const ui = useResponsiveScale()
  const styles = useMemo(() => createStyles(ui), [ui])
  const { user: currentUser } = useAuth()

  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [userStats, setUserStats] = useState(null)
  const [isLiked, setIsLiked] = useState(false)
  const [likeLoading, setLikeLoading] = useState(false)
  const [friendship, setFriendship] = useState(null)
  const [friendshipLoading, setFriendshipLoading] = useState(false)

  useEffect(() => {
    const fetchUserData = async () => {
      if (!id) {
        setLoading(false)
        return
      }
      setLoading(true)
      try {
        const [userRes, statsRes, friendshipRes] = await Promise.all([
          customFetch.get(`/users/${id}`),
          customFetch.get(`/user-stats/${id}`),
          customFetch.get(`/friendships/status/${id}`),
        ])
        const userData = userRes.data.user
        setUser(userData)
        setUserStats(statsRes.data.stats || { gamesPlayed: 0, eventsOrganized: 0, totalLikes: 0, points: 0 })
        setIsLiked(statsRes.data.isLikedByCurrentUser || false)
        setFriendship(friendshipRes.data)
      } catch (err) {
        console.error('Błąd pobierania danych użytkownika:', err)
        Alert.alert('Błąd', 'Nie udało się pobrać danych użytkownika')
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [id])

  const avatar = user?.avatarUrl ? { uri: user.avatarUrl } : defaultAvatar

  const handleLike = async () => {
    if (!user) return
    setLikeLoading(true)
    try {
      if (isLiked) {
        await customFetch.delete('/user-stats/like', {
          data: { targetUserId: user._id },
        })
        setIsLiked(false)
        setUserStats((prev) => ({
          ...prev,
          totalLikes: Math.max(0, (prev?.totalLikes || 1) - 1),
        }))
      } else {
        await customFetch.post('/user-stats/like', { targetUserId: user._id })
        setIsLiked(true)
        setUserStats((prev) => ({
          ...prev,
          totalLikes: (prev?.totalLikes || 0) + 1,
        }))
      }
    } catch (err) {
      console.error('Błąd podczas polubienia/odpolubienia:', err)
      Alert.alert('Błąd', err.response?.data?.msg || 'Wystąpił błąd podczas operacji')
    } finally {
      setLikeLoading(false)
    }
  }

  const handleSendFriendRequest = async () => {
    setFriendshipLoading(true)
    try {
      const res = await customFetch.post(`/friendships/send/${user._id}`)
      setFriendship({ status: 'pending', friendshipID: res.data.friendship._id, iAmRequester: true })
    } catch (err) {
      Alert.alert('Błąd', err.response?.data?.msg || 'Nie udało się wysłać zaproszenia')
    } finally {
      setFriendshipLoading(false)
    }
  }

  const handleCancelRequest = async () => {
    setFriendshipLoading(true)
    try {
      await customFetch.delete(`/friendships/${friendship.friendshipID}`)
      setFriendship({ status: null, friendshipID: null })
    } catch (err) {
      Alert.alert('Błąd', err.response?.data?.msg || 'Nie udało się anulować zaproszenia')
    } finally {
      setFriendshipLoading(false)
    }
  }

  const handleAcceptRequest = async () => {
    setFriendshipLoading(true)
    try {
      await customFetch.patch(`/friendships/${friendship.friendshipID}/respond`, { action: 'accepted' })
      setFriendship((prev) => ({ ...prev, status: 'accepted' }))
    } catch (err) {
      Alert.alert('Błąd', err.response?.data?.msg || 'Nie udało się zaakceptować zaproszenia')
    } finally {
      setFriendshipLoading(false)
    }
  }

  const handleRejectRequest = async () => {
    setFriendshipLoading(true)
    try {
      await customFetch.patch(`/friendships/${friendship.friendshipID}/respond`, { action: 'rejected' })
      setFriendship({ status: null, friendshipID: null })
    } catch (err) {
      Alert.alert('Błąd', err.response?.data?.msg || 'Nie udało się odrzucić zaproszenia')
    } finally {
      setFriendshipLoading(false)
    }
  }

  const handleRemoveFriend = async () => {
    setFriendshipLoading(true)
    try {
      await customFetch.delete(`/friendships/${friendship.friendshipID}`)
      setFriendship({ status: null, friendshipID: null })
    } catch (err) {
      Alert.alert('Błąd', err.response?.data?.msg || 'Nie udało się usunąć znajomego')
    } finally {
      setFriendshipLoading(false)
    }
  }

  const handleChat = () => {
    router.push({ pathname: '/(auth)/chat', params: { openChatWith: user._id } })
  }

  const handleReport = () => {
    router.push({
      pathname: '/(auth)/report',
      params: { type: 'user', userId: user._id, reportedNickName: user.nickName },
    })
  }

  const handleGoBack = () => {
    router.back()
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' color={COLORS.secondary} />
        <Text style={styles.loadingText}>Ładowanie profilu...</Text>
      </View>
    )
  }

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name='person-outline' size={ui.moderateScale(64, 0.35)} color={COLORS.gray} />
        <Text style={styles.loadingText}>Nie znaleziono użytkownika</Text>
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
        <View style={styles.headerCenter}>
          <Ionicons name='person-circle' size={ui.moderateScale(26, 0.35)} color={COLORS.secondary} />
          <Text style={styles.headerText}>Profil Gracza</Text>
        </View>
        <View style={{ width: ui.moderateScale(40, 0.35) }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <Image source={avatar} style={styles.avatar} />
        </View>

        {/* Username */}
        <Text style={styles.username}>{user.nickName}</Text>

        {/* Informacje */}
        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Imię:</Text>
            <Text style={styles.infoValue}>{user.name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nazwisko:</Text>
            <Text style={styles.infoValue}>{user.surname}</Text>
          </View>
        </View>

        {/* Statystyki */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Statystyki</Text>
          <View style={styles.statsGrid}>
            <StatItem label='Rozegrane gry' value={userStats.gamesPlayed} styles={styles} />
            <StatItem label='Utworzone gry' value={userStats.eventsOrganized} styles={styles} />
            <StatItem label='Polubienia' value={userStats.totalLikes} styles={styles} />
            <StatItem label='Punkty' value={userStats.points} styles={styles} />
          </View>
        </View>

        {/* Przyciski akcji */}
        {currentUser && user && currentUser.userID !== user._id?.toString() && (
          <View style={styles.buttonsSection}>
            {/* Friendship buttons */}
            {friendship && friendship.status === null && (
              <TouchableOpacity
                style={[styles.friendButton, friendshipLoading && styles.disabledButton]}
                onPress={handleSendFriendRequest}
                disabled={friendshipLoading}
                activeOpacity={0.8}
              >
                {friendshipLoading ? (
                  <ActivityIndicator size='small' color={COLORS.background} />
                ) : (
                  <>
                    <Ionicons name='person-add' size={ui.moderateScale(20, 0.35)} color={COLORS.background} />
                    <Text style={styles.friendButtonText}>Dodaj do znajomych</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {friendship && friendship.status === 'pending' && friendship.iAmRequester && (
              <TouchableOpacity
                style={[styles.friendButtonPending, friendshipLoading && styles.disabledButton]}
                onPress={handleCancelRequest}
                disabled={friendshipLoading}
                activeOpacity={0.8}
              >
                {friendshipLoading ? (
                  <ActivityIndicator size='small' color={COLORS.secondary} />
                ) : (
                  <>
                    <Ionicons name='close-circle-outline' size={ui.moderateScale(20, 0.35)} color={COLORS.secondary} />
                    <Text style={styles.friendButtonPendingText}>Anuluj zaproszenie</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {friendship && friendship.status === 'pending' && !friendship.iAmRequester && (
              <View style={styles.friendResponseRow}>
                <TouchableOpacity
                  style={[styles.acceptButton, friendshipLoading && styles.disabledButton]}
                  onPress={handleAcceptRequest}
                  disabled={friendshipLoading}
                  activeOpacity={0.8}
                >
                  <Ionicons name='checkmark' size={ui.moderateScale(18, 0.35)} color={COLORS.background} />
                  <Text style={styles.acceptButtonText}>Akceptuj</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.rejectButton, friendshipLoading && styles.disabledButton]}
                  onPress={handleRejectRequest}
                  disabled={friendshipLoading}
                  activeOpacity={0.8}
                >
                  <Ionicons name='close' size={ui.moderateScale(18, 0.35)} color={COLORS.error} />
                  <Text style={styles.rejectButtonText}>Odrzuć</Text>
                </TouchableOpacity>
              </View>
            )}

            {friendship && friendship.status === 'accepted' && (
              <TouchableOpacity
                style={[styles.friendButtonAccepted, friendshipLoading && styles.disabledButton]}
                onPress={handleRemoveFriend}
                disabled={friendshipLoading}
                activeOpacity={0.8}
              >
                {friendshipLoading ? (
                  <ActivityIndicator size='small' color={COLORS.third} />
                ) : (
                  <>
                    <Ionicons name='people' size={ui.moderateScale(20, 0.35)} color={COLORS.third} />
                    <Text style={styles.friendButtonAcceptedText}>Znajomy ✓</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {/* Chat button */}
            <TouchableOpacity
              style={styles.chatButton}
              onPress={handleChat}
              activeOpacity={0.8}
            >
              <Ionicons name='chatbubble-outline' size={ui.moderateScale(20, 0.35)} color={COLORS.primary} />
              <Text style={styles.chatButtonText}>Napisz</Text>
            </TouchableOpacity>

            {/* Like button */}
            <TouchableOpacity
              style={[
                styles.likeButton,
                isLiked && styles.likedButton,
                likeLoading && styles.disabledButton,
              ]}
              onPress={handleLike}
              disabled={likeLoading}
              activeOpacity={0.8}
            >
              {likeLoading ? (
                <ActivityIndicator size='small' color={COLORS.primary} />
              ) : (
                <>
                  <Ionicons
                    name={isLiked ? 'heart' : 'heart-outline'}
                    size={ui.moderateScale(22, 0.35)}
                    color={isLiked ? '#FF69B4' : COLORS.primary}
                  />
                  <Text
                    style={[
                      styles.likeButtonText,
                      isLiked && styles.likedButtonText,
                    ]}
                  >
                    {isLiked ? 'Polubiono' : 'Polub gracza'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Report button */}
            <TouchableOpacity
              style={styles.reportButton}
              onPress={handleReport}
              activeOpacity={0.8}
            >
              <Ionicons name='flag-outline' size={ui.moderateScale(20, 0.35)} color={COLORS.error} />
              <Text style={styles.reportButtonText}>Zgłoś użytkownika</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  )
}

export default ProfileUser

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
    marginTop: ui.verticalScale(12),
    fontSize: ui.scaleFont(16, 0.35),
    fontFamily: 'Lato-Regular',
    color: COLORS.primary,
  },
  backButton: {
    marginTop: ui.verticalScale(20),
    backgroundColor: COLORS.secondary,
    paddingVertical: ui.verticalScale(10),
    paddingHorizontal: ui.spacing(24, 0.45),
    borderRadius: ui.moderateScale(8, 0.35),
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
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    fontSize: ui.scaleFont(22, 0.45),
    fontFamily: 'Montserrat-Bold',
    color: COLORS.primary,
    marginLeft: ui.spacing(10, 0.35),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: ui.spacing(20, 0.45),
    paddingBottom: ui.verticalScale(40),
    alignItems: 'center',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: ui.verticalScale(20),
  },
  avatar: {
    width: ui.scale(150),
    height: ui.scale(150),
    borderRadius: ui.moderateScale(16, 0.35),
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  username: {
    fontSize: ui.scaleFont(28, 0.45),
    fontFamily: 'Montserrat-Bold',
    color: COLORS.primary,
    marginBottom: ui.verticalScale(24),
  },
  infoSection: {
    width: '100%',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: ui.moderateScale(16, 0.35),
    padding: ui.spacing(16),
    marginBottom: ui.verticalScale(24),
  },
  infoRow: {
    flexDirection: 'row',
    paddingVertical: ui.verticalScale(8),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  infoLabel: {
    fontSize: ui.scaleFont(16, 0.35),
    fontFamily: 'Lato-Regular',
    color: COLORS.gray,
    width: ui.scale(100),
  },
  infoValue: {
    flex: 1,
    fontSize: ui.scaleFont(16, 0.35),
    fontFamily: 'Lato-Regular',
    color: COLORS.primary,
  },
  statsSection: {
    width: '100%',
    marginBottom: ui.verticalScale(24),
  },
  sectionTitle: {
    fontSize: ui.scaleFont(18, 0.4),
    fontFamily: 'Montserrat-Bold',
    color: COLORS.secondary,
    textAlign: 'center',
    marginBottom: ui.verticalScale(16),
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: ui.moderateScale(12, 0.35),
    padding: ui.spacing(16),
    alignItems: 'center',
    marginBottom: ui.verticalScale(12),
  },
  statValue: {
    fontSize: ui.scaleFont(24, 0.45),
    fontFamily: 'Montserrat-Bold',
    color: COLORS.secondary,
  },
  statLabel: {
    fontSize: ui.scaleFont(12, 0.3),
    fontFamily: 'Lato-Regular',
    color: COLORS.primary,
    marginTop: ui.verticalScale(4),
    textAlign: 'center',
  },
  buttonsSection: {
    width: '100%',
    gap: ui.verticalScale(12),
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 2,
    borderColor: COLORS.secondary,
    borderRadius: ui.moderateScale(12, 0.35),
    paddingVertical: ui.verticalScale(14),
    paddingHorizontal: ui.spacing(20, 0.45),
  },
  likedButton: {
    borderColor: '#FF69B4',
    backgroundColor: 'rgba(255, 105, 180, 0.1)',
  },
  disabledButton: {
    opacity: 0.7,
  },
  likeButtonText: {
    fontSize: ui.scaleFont(16, 0.35),
    fontFamily: 'Montserrat-Bold',
    color: COLORS.primary,
    marginLeft: ui.spacing(10, 0.35),
  },
  likedButtonText: {
    color: '#FF69B4',
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.error,
    borderRadius: ui.moderateScale(12, 0.35),
    paddingVertical: ui.verticalScale(12),
    paddingHorizontal: ui.spacing(20, 0.45),
  },
  reportButtonText: {
    fontSize: ui.scaleFont(14, 0.35),
    fontFamily: 'Montserrat-Bold',
    color: COLORS.error,
    marginLeft: ui.spacing(8, 0.35),
  },
  friendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.secondary,
    borderRadius: ui.moderateScale(12, 0.35),
    paddingVertical: ui.verticalScale(14),
    paddingHorizontal: ui.spacing(20, 0.45),
    gap: ui.spacing(8, 0.35),
  },
  friendButtonText: {
    fontSize: ui.scaleFont(15, 0.35),
    fontFamily: 'Montserrat-Bold',
    color: COLORS.background,
  },
  friendButtonPending: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.secondary,
    borderRadius: ui.moderateScale(12, 0.35),
    paddingVertical: ui.verticalScale(14),
    paddingHorizontal: ui.spacing(20, 0.45),
    gap: ui.spacing(8, 0.35),
  },
  friendButtonPendingText: {
    fontSize: ui.scaleFont(15, 0.35),
    fontFamily: 'Montserrat-Bold',
    color: COLORS.secondary,
  },
  friendButtonAccepted: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(18, 115, 64, 0.15)',
    borderWidth: 1,
    borderColor: COLORS.third,
    borderRadius: ui.moderateScale(12, 0.35),
    paddingVertical: ui.verticalScale(14),
    paddingHorizontal: ui.spacing(20, 0.45),
    gap: ui.spacing(8, 0.35),
  },
  friendButtonAcceptedText: {
    fontSize: ui.scaleFont(15, 0.35),
    fontFamily: 'Montserrat-Bold',
    color: COLORS.third,
  },
  friendResponseRow: {
    flexDirection: 'row',
    gap: ui.spacing(8, 0.35),
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.secondary,
    borderRadius: ui.moderateScale(12, 0.35),
    paddingVertical: ui.verticalScale(14),
    gap: ui.spacing(6, 0.25),
  },
  acceptButtonText: {
    fontSize: ui.scaleFont(14, 0.35),
    fontFamily: 'Montserrat-Bold',
    color: COLORS.background,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.error,
    borderRadius: ui.moderateScale(12, 0.35),
    paddingVertical: ui.verticalScale(14),
    gap: ui.spacing(6, 0.25),
  },
  rejectButtonText: {
    fontSize: ui.scaleFont(14, 0.35),
    fontFamily: 'Montserrat-Bold',
    color: COLORS.error,
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.third,
    borderRadius: ui.moderateScale(12, 0.35),
    paddingVertical: ui.verticalScale(14),
    paddingHorizontal: ui.spacing(20, 0.45),
    gap: ui.spacing(8, 0.35),
  },
  chatButtonText: {
    fontSize: ui.scaleFont(15, 0.35),
    fontFamily: 'Montserrat-Bold',
    color: COLORS.primary,
  },
})
