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
import { COLORS } from '../../../../../constants/colors'
import { useResponsiveScale } from '../../../../../assets/utils/scaleUI.UX'

const defaultAvatar = require('../../../../../assets/images/defaultAvatar.png')

// router.push(`/(main)/(tabs)/(hidden)/profile/profile-user?id=${userId}`)
// Mock data - inny użytkownik
const MOCK_USERS = {
  user1: {
    _id: 'user1',
    nickName: 'SportyJohn',
    name: 'Adam',
    surname: 'Nowak',
    avatarUrl: null,
  },
  user2: {
    _id: 'user2',
    nickName: 'FootballFan99',
    name: 'Piotr',
    surname: 'Wiśniewski',
    avatarUrl: null,
  },
}

const MOCK_USER_STATS = {
  user1: {
    gamesPlayed: 67,
    eventsOrganized: 12,
    totalLikes: 45,
    points: 2150,
  },
  user2: {
    gamesPlayed: 23,
    eventsOrganized: 3,
    totalLikes: 11,
    points: 890,
  },
}

const StatItem = ({ label, value, styles }) => (
  <View style={styles.statItem}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
)

const ProfileUser = () => {
  const router = useRouter()
  const { id } = useLocalSearchParams()
  const ui = useResponsiveScale()
  const styles = createStyles(ui)

  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [userStats, setUserStats] = useState(null)
  const [isLiked, setIsLiked] = useState(false)
  const [likeLoading, setLikeLoading] = useState(false)

  useEffect(() => {
    // Symulacja ładowania danych
    const fetchUserData = async () => {
      setLoading(true)
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Mock: pobierz dane użytkownika na podstawie id
      const userData = MOCK_USERS[id] || MOCK_USERS.user1
      const statsData = MOCK_USER_STATS[id] || MOCK_USER_STATS.user1

      setUser(userData)
      setUserStats(statsData)
      setLoading(false)
    }

    fetchUserData()
  }, [id])

  const avatar = user?.avatarUrl ? { uri: user.avatarUrl } : defaultAvatar

  const handleLike = async () => {
    setLikeLoading(true)
    // Symulacja API call
    await new Promise((resolve) => setTimeout(resolve, 300))
    setIsLiked(!isLiked)
    setLikeLoading(false)
  }

  const handleReport = () => {
    Alert.alert(
      'Zgłoś użytkownika',
      'Czy na pewno chcesz zgłosić tego użytkownika?',
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Zgłoś',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Zgłoszenie wysłane', 'Dziękujemy za zgłoszenie.')
          },
        },
      ]
    )
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
        <View style={styles.buttonsSection}>
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
                  color={isLiked ? COLORS.error : COLORS.primary}
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

          <TouchableOpacity
            style={styles.reportButton}
            onPress={handleReport}
            activeOpacity={0.8}
          >
            <Ionicons name='flag-outline' size={ui.moderateScale(20, 0.35)} color={COLORS.error} />
            <Text style={styles.reportButtonText}>Zgłoś użytkownika</Text>
          </TouchableOpacity>
        </View>
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
    borderColor: COLORS.error,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
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
    color: COLORS.error,
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
})
