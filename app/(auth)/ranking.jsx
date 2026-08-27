import { useState, useEffect } from 'react'
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Picker } from '@react-native-picker/picker'
import customFetch from '../../assets/utils/customFetch'
import { dbg, useDebugMount } from '../../assets/utils/debugLogger'
import BottomSpacer from '../../components/BottomSpacer'

import { useThemedStyles } from '../../context/themeStore'
import { SPACING, BORDER_RADIUS } from '../../Theme/StyleConstants'
import { scale, verticalScale, moderateScale, scaleFont } from '../../Theme/ScalableStyles'

const defaultAvatar = require('../../assets/images/defaultAvatar.png')

const SORT_OPTIONS = [
  { label: 'Punkty', value: 'points' },
  { label: 'Rozegrane gry', value: 'gamesPlayed' },
  { label: 'Zorganizowane eventy', value: 'eventsOrganized' },
  { label: 'Łączne polubienia', value: 'totalLikes' },
]

const RankingCard = ({ user, rank, sortBy, styles, colors }) => {
  // Zabezpieczenie przed null userID
  if (!user.userID) return null

  const avatar = user.userID.avatarUrl
    ? { uri: user.userID.avatarUrl }
    : defaultAvatar

  // Określ wartość do wyświetlenia na podstawie sortowania
  const getMainValue = () => {
    switch (sortBy) {
      case 'gamesPlayed':
        return { label: 'Gry', value: user.gamesPlayed }
      case 'eventsOrganized':
        return { label: 'Eventy', value: user.eventsOrganized }
      case 'totalLikes':
        return { label: 'Polubienia', value: user.totalLikes }
      case 'points':
      default:
        return { label: 'Punkty', value: user.points }
    }
  }

  const mainValue = getMainValue()

  // Kolor pozycji
  const getRankColor = () => {
    if (rank === 1) return '#FFD700' // Złoto
    if (rank === 2) return '#C0C0C0' // Srebro
    if (rank === 3) return '#CD7F32' // Brąz
    return colors.primaryText
  }

  return (
    <View style={styles.card}>
      {/* Pozycja */}
      <View style={styles.rankContainer}>
        <Text style={[styles.rankText, { color: getRankColor() }]}>{rank}</Text>
      </View>

      {/* Avatar */}
      <Image source={avatar} style={styles.avatar} />

      {/* Nickname */}
      <View style={styles.userInfo}>
        <Text style={styles.nickname} numberOfLines={1}>
          {user.userID.nickName}
        </Text>
        <Text style={styles.mainValueLabel}>{mainValue.label}</Text>
      </View>

      {/* Główna wartość */}
      <View style={styles.valueContainer}>
        <Text style={styles.mainValue}>{mainValue.value}</Text>
      </View>
    </View>
  )
}

const Ranking = () => {
  dbg('RankingScreen')
  useDebugMount('RankingScreen')
  const { styles, colors } = useThemedStyles(createStyles)
  const usePickerOverlay = Platform.OS === 'android'
  const [sortBy, setSortBy] = useState('points')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [leaderboardData, setLeaderboardData] = useState([])
  const selectedSortLabel =
    SORT_OPTIONS.find((option) => option.value === sortBy)?.label || 'Punkty'

  // Pobierz dane rankingu z API
  const fetchLeaderboard = async (sortOption = 'points') => {
    try {
      setLoading(true)
      setError(null)

      const response = await customFetch.get(
        `/user-stats/leaderboard?sortBy=${sortOption}&limit=10`
      )
      const { leaderboard } = response.data

      // Filtruj użytkowników z null userID (usuniętych użytkowników)
      const validLeaderboard = leaderboard.filter(
        (user) => user.userID !== null
      )

      // Dodaj ranking do każdego użytkownika
      const rankedData = validLeaderboard.map((user, index) => ({
        ...user,
        rank: index + 1,
      }))

      setLeaderboardData(rankedData)
    } catch (err) {
      console.error('Błąd podczas pobierania rankingu:', err)
      setError('Nie udało się pobrać danych rankingu')
    } finally {
      setLoading(false)
    }
  }

  // Pobierz dane przy montowaniu i zmianie sortowania
  useEffect(() => {
    fetchLeaderboard(sortBy)
  }, [sortBy])

  // Sortowanie danych
  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy)
  }

  return (
    <View style={styles.container} pointerEvents='box-none'>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name='trophy' size={moderateScale(26, 0.35)} color={colors.PrimaryGreen} />
        <Text style={styles.headerText}>Ranking</Text>
      </View>

      {/* Sortowanie */}
      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Sortuj według:</Text>
        <View style={styles.pickerWrapper}>
          {usePickerOverlay && (
            <View style={styles.pickerValueContainer} pointerEvents='none'>
              <Text style={styles.pickerValue} numberOfLines={1}>
                {selectedSortLabel}
              </Text>
            </View>
          )}
          <Picker
            selectedValue={sortBy}
            onValueChange={handleSortChange}
            style={[styles.picker, usePickerOverlay && styles.androidPicker]}
            dropdownIconColor={colors.PrimaryGreen}
            mode='dropdown'
          >
            {SORT_OPTIONS.map((option) => (
              <Picker.Item
                key={option.value}
                label={option.label}
                value={option.value}
                color={colors.background}
              />
            ))}
          </Picker>
        </View>
      </View>

      {/* Nagłówki kolumn */}
      <View style={styles.columnHeaders}>
        <Text style={styles.columnHeader}>#</Text>
        <Text
          style={[
            styles.columnHeader,
            { flex: 1, textAlign: 'left', marginLeft: 60 },
          ]}
        >
          Gracz
        </Text>
        <Text style={styles.columnHeader}>
          {SORT_OPTIONS.find((o) => o.value === sortBy)?.label}
        </Text>
      </View>

      {/* Lista rankingu */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={colors.PrimaryGreen} />
          <Text style={styles.loadingText}>Ładowanie rankingu...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons
            name='alert-circle-outline'
            size={moderateScale(60, 0.3)}
            color={colors.Danger}
          />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => fetchLeaderboard(sortBy)}
          >
            <Text style={styles.retryButtonText}>Spróbuj ponownie</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {leaderboardData.map((user) => (
            <RankingCard
              key={user.userID?._id || user._id}
              user={user}
              rank={user.rank}
              sortBy={sortBy}
              styles={styles}
              colors={colors}
            />
          ))}

          {leaderboardData.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name='trophy-outline' size={moderateScale(60, 0.3)} color={colors.thirdText} />
              <Text style={styles.emptyText}>Brak danych w rankingu</Text>
            </View>
          )}
          <BottomSpacer />
        </ScrollView>
      )}
    </View>
  )
}

export default Ranking

const createStyles = (colors) => StyleSheet.create({
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
    fontFamily: 'BarlowCondensed-ExtraBold',
    color: colors.primaryText,
    marginLeft: SPACING.md,
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: verticalScale(12),
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  sortLabel: {
    fontSize: scaleFont(16, 0.35),
    fontFamily: 'Inter-Regular',
    color: colors.primaryText,
    marginRight: SPACING.md,
  },
  pickerWrapper: {
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.PrimaryGreen,
    borderRadius: BORDER_RADIUS.md,
    minWidth: scale(180),
    minHeight: verticalScale(40),
    justifyContent: 'center',
    position: 'relative',
  },
  picker: {
    color: colors.primaryText,
  },
  androidPicker: {
    color: 'transparent',
  },
  pickerValueContainer: {
    position: 'absolute',
    left: SPACING.md,
    right: scale(36),
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    zIndex: 1,
  },
  pickerValue: {
    color: colors.primaryText,
    fontSize: scaleFont(16, 0.35),
    fontFamily: 'Inter-Regular',
    includeFontPadding: false,
  },
  columnHeaders: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: verticalScale(12),
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderBottomWidth: 1,
    borderBottomColor: colors.PrimaryGreen,
  },
  columnHeader: {
    fontSize: scaleFont(12, 0.3),
    fontFamily: 'BarlowCondensed-Bold',
    color: colors.PrimaryGreen,
    width: scale(50),
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: verticalScale(12),
    fontSize: scaleFont(16, 0.35),
    fontFamily: 'Inter-Regular',
    color: colors.primaryText,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  errorText: {
    marginTop: verticalScale(16),
    fontSize: scaleFont(16, 0.35),
    fontFamily: 'Inter-Regular',
    color: colors.Danger,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: verticalScale(20),
    backgroundColor: colors.PrimaryGreen,
    paddingHorizontal: SPACING.xl,
    paddingVertical: verticalScale(12),
    borderRadius: BORDER_RADIUS.md,
  },
  retryButtonText: {
    fontSize: scaleFont(16, 0.35),
    fontFamily: 'BarlowCondensed-Bold',
    color: colors.background,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: verticalScale(32),
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: verticalScale(12),
    borderBottomWidth: 1,
    borderBottomColor: colors.PrimaryGreen,
  },
  rankContainer: {
    width: scale(40),
    alignItems: 'center',
  },
  rankText: {
    fontSize: scaleFont(22, 0.45),
    fontFamily: 'BarlowCondensed-Bold',
  },
  avatar: {
    width: scale(50),
    height: scale(50),
    borderRadius: BORDER_RADIUS.sm,
    marginRight: SPACING.md,
  },
  userInfo: {
    flex: 1,
  },
  nickname: {
    fontSize: scaleFont(16, 0.35),
    fontFamily: 'BarlowCondensed-Bold',
    color: colors.primaryText,
    marginBottom: verticalScale(2),
  },
  mainValueLabel: {
    fontSize: scaleFont(11, 0.3),
    fontFamily: 'Inter-Regular',
    color: colors.thirdText,
  },
  valueContainer: {
    alignItems: 'flex-end',
    minWidth: scale(60),
  },
  mainValue: {
    fontSize: scaleFont(18, 0.4),
    fontFamily: 'BarlowCondensed-Bold',
    color: colors.PrimaryGreen,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: verticalScale(60),
  },
  emptyText: {
    marginTop: verticalScale(16),
    fontSize: scaleFont(16, 0.35),
    fontFamily: 'Inter-Regular',
    color: colors.thirdText,
  },
})
