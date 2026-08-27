import { useState, useEffect } from 'react'
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
import { useAuth } from '../../../context/AuthContext'
import customFetch from '../../../assets/utils/customFetch'
import { dbg, useDebugMount } from '../../../assets/utils/debugLogger'
import BottomSpacer from '../../../components/BottomSpacer'

import { useThemedStyles } from '../../../context/themeStore'
import { SPACING, BORDER_RADIUS } from '../../../Theme/StyleConstants'
import { scale, verticalScale, moderateScale, scaleFont } from '../../../Theme/ScalableStyles'

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
  const { styles, colors } = useThemedStyles(createStyles)
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
        <ActivityIndicator size='large' color={colors.PrimaryGreen} />
        <Text style={styles.loadingText}>Ładowanie profilu...</Text>
      </View>
    )
  }

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name='person-outline' size={moderateScale(64, 0.35)} color={colors.thirdText} />
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
          <Ionicons name='arrow-back' size={moderateScale(24, 0.35)} color={colors.PrimaryGreen} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Ionicons name='person-circle' size={moderateScale(26, 0.35)} color={colors.PrimaryGreen} />
          <Text style={styles.headerText}>Profil Gracza</Text>
        </View>
        <View style={{ width: moderateScale(40, 0.35) }} />
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
                  <ActivityIndicator size='small' color={colors.background} />
                ) : (
                  <>
                    <Ionicons name='person-add' size={moderateScale(20, 0.35)} color={colors.background} />
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
                  <ActivityIndicator size='small' color={colors.PrimaryGreen} />
                ) : (
                  <>
                    <Ionicons name='close-circle-outline' size={moderateScale(20, 0.35)} color={colors.PrimaryGreen} />
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
                  <Ionicons name='checkmark' size={moderateScale(18, 0.35)} color={colors.background} />
                  <Text style={styles.acceptButtonText}>Akceptuj</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.rejectButton, friendshipLoading && styles.disabledButton]}
                  onPress={handleRejectRequest}
                  disabled={friendshipLoading}
                  activeOpacity={0.8}
                >
                  <Ionicons name='close' size={moderateScale(18, 0.35)} color={colors.Danger} />
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
                  <ActivityIndicator size='small' color={colors.border} />
                ) : (
                  <>
                    <Ionicons name='people' size={moderateScale(20, 0.35)} color={colors.border} />
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
              <Ionicons name='chatbubble-outline' size={moderateScale(20, 0.35)} color={colors.primaryText} />
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
                <ActivityIndicator size='small' color={colors.primaryText} />
              ) : (
                <>
                  <Ionicons
                    name={isLiked ? 'heart' : 'heart-outline'}
                    size={moderateScale(22, 0.35)}
                    color={isLiked ? '#FF69B4' : colors.primaryText}
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
              <Ionicons name='flag-outline' size={moderateScale(20, 0.35)} color={colors.Danger} />
              <Text style={styles.reportButtonText}>Zgłoś użytkownika</Text>
            </TouchableOpacity>
          </View>
        )}
        <BottomSpacer />
      </ScrollView>
    </View>
  )
}

export default ProfileUser

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: verticalScale(12),
    fontSize: scaleFont(16, 0.35),
    fontFamily: 'Inter-Regular',
    color: colors.primaryText,
  },
  backButton: {
    marginTop: verticalScale(20),
    backgroundColor: colors.PrimaryGreen,
    paddingVertical: verticalScale(10),
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.sm,
  },
  backButtonText: {
    fontSize: scaleFont(14, 0.35),
    fontFamily: 'BarlowCondensed-ExtraBold',
    color: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: verticalScale(16),
    paddingHorizontal: SPACING.md,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  backIconButton: {
    width: moderateScale(40, 0.35),
    height: moderateScale(40, 0.35),
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    fontSize: scaleFont(22, 0.45),
    fontFamily: 'BarlowCondensed-Bold',
    color: colors.primaryText,
    marginLeft: SPACING.sm,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: verticalScale(40),
    alignItems: 'center',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: verticalScale(20),
  },
  avatar: {
    width: scale(150),
    height: scale(150),
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    borderColor: colors.primaryText,
  },
  username: {
    fontSize: scaleFont(28, 0.45),
    fontFamily: 'BarlowCondensed-Bold',
    color: colors.primaryText,
    marginBottom: verticalScale(24),
  },
  infoSection: {
    width: '100%',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: verticalScale(24),
  },
  infoRow: {
    flexDirection: 'row',
    paddingVertical: verticalScale(8),
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  infoLabel: {
    fontSize: scaleFont(16, 0.35),
    fontFamily: 'Inter-Regular',
    color: colors.thirdText,
    width: scale(100),
  },
  infoValue: {
    flex: 1,
    fontSize: scaleFont(16, 0.35),
    fontFamily: 'Inter-Regular',
    color: colors.primaryText,
  },
  statsSection: {
    width: '100%',
    marginBottom: verticalScale(24),
  },
  sectionTitle: {
    fontSize: scaleFont(18, 0.4),
    fontFamily: 'BarlowCondensed-Bold',
    color: colors.PrimaryGreen,
    textAlign: 'center',
    marginBottom: verticalScale(16),
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    marginBottom: verticalScale(12),
  },
  statValue: {
    fontSize: scaleFont(24, 0.45),
    fontFamily: 'BarlowCondensed-Bold',
    color: colors.PrimaryGreen,
  },
  statLabel: {
    fontSize: scaleFont(12, 0.3),
    fontFamily: 'Inter-Regular',
    color: colors.primaryText,
    marginTop: verticalScale(4),
    textAlign: 'center',
  },
  buttonsSection: {
    width: '100%',
    gap: verticalScale(12),
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 2,
    borderColor: colors.PrimaryGreen,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: verticalScale(14),
    paddingHorizontal: SPACING.lg,
  },
  likedButton: {
    borderColor: '#FF69B4',
    backgroundColor: 'rgba(255, 105, 180, 0.1)',
  },
  disabledButton: {
    opacity: 0.7,
  },
  likeButtonText: {
    fontSize: scaleFont(16, 0.35),
    fontFamily: 'BarlowCondensed-Bold',
    color: colors.primaryText,
    marginLeft: SPACING.sm,
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
    borderColor: colors.Danger,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: verticalScale(12),
    paddingHorizontal: SPACING.lg,
  },
  reportButtonText: {
    fontSize: scaleFont(14, 0.35),
    fontFamily: 'BarlowCondensed-Bold',
    color: colors.Danger,
    marginLeft: SPACING.sm,
  },
  friendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.PrimaryGreen,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: verticalScale(14),
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  friendButtonText: {
    fontSize: scaleFont(15, 0.35),
    fontFamily: 'BarlowCondensed-Bold',
    color: colors.background,
  },
  friendButtonPending: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.PrimaryGreen,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: verticalScale(14),
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  friendButtonPendingText: {
    fontSize: scaleFont(15, 0.35),
    fontFamily: 'BarlowCondensed-Bold',
    color: colors.PrimaryGreen,
  },
  friendButtonAccepted: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.SuccessGreen,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: verticalScale(14),
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  friendButtonAcceptedText: {
    fontSize: scaleFont(15, 0.35),
    fontFamily: 'BarlowCondensed-Bold',
    color: colors.border,
  },
  friendResponseRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.PrimaryGreen,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: verticalScale(14),
    gap: SPACING.xs,
  },
  acceptButtonText: {
    fontSize: scaleFont(14, 0.35),
    fontFamily: 'BarlowCondensed-Bold',
    color: colors.background,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.Danger,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: verticalScale(14),
    gap: SPACING.xs,
  },
  rejectButtonText: {
    fontSize: scaleFont(14, 0.35),
    fontFamily: 'BarlowCondensed-Bold',
    color: colors.Danger,
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.border,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: verticalScale(14),
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  chatButtonText: {
    fontSize: scaleFont(15, 0.35),
    fontFamily: 'BarlowCondensed-Bold',
    color: colors.primaryText,
  },
})
