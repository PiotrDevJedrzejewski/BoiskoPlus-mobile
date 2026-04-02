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
import { COLORS } from '../../constants/colors'
import customFetch from '../../assets/utils/customFetch'
import { useResponsiveScale } from '../../assets/utils/scaleUI.UX'
import { dbg, useDebugMount } from '../../assets/utils/debugLogger'

const defaultAvatar = require('../../assets/images/defaultAvatar.png')

const SORT_OPTIONS = [
  { label: 'Punkty', value: 'points' },
  { label: 'Rozegrane gry', value: 'gamesPlayed' },
  { label: 'Zorganizowane eventy', value: 'eventsOrganized' },
  { label: 'Łączne polubienia', value: 'totalLikes' },
]

const RankingCard = ({ user, rank, sortBy, styles, ui }) => {
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
    return COLORS.primary
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
  const ui = useResponsiveScale()
  const styles = createStyles(ui)
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
        <Ionicons name='trophy' size={ui.moderateScale(26, 0.35)} color={COLORS.secondary} />
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
            dropdownIconColor={COLORS.secondary}
            mode='dropdown'
          >
            {SORT_OPTIONS.map((option) => (
              <Picker.Item
                key={option.value}
                label={option.label}
                value={option.value}
                color={COLORS.background}
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
          <ActivityIndicator size='large' color={COLORS.secondary} />
          <Text style={styles.loadingText}>Ładowanie rankingu...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons
            name='alert-circle-outline'
            size={ui.moderateScale(60, 0.3)}
            color={COLORS.error}
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
              ui={ui}
            />
          ))}

          {leaderboardData.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name='trophy-outline' size={ui.moderateScale(60, 0.3)} color={COLORS.gray} />
              <Text style={styles.emptyText}>Brak danych w rankingu</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  )
}

export default Ranking

const createStyles = (ui) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: ui.verticalScale(20),
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  headerText: {
    fontSize: ui.scaleFont(24, 0.45),
    fontFamily: 'Montserrat-Bold',
    color: COLORS.primary,
    marginLeft: ui.spacing(12, 0.35),
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: ui.spacing(16),
    paddingVertical: ui.verticalScale(12),
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  sortLabel: {
    fontSize: ui.scaleFont(16, 0.35),
    fontFamily: 'Lato-Regular',
    color: COLORS.primary,
    marginRight: ui.spacing(12, 0.35),
  },
  pickerWrapper: {
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 1,
    borderColor: COLORS.secondary,
    borderRadius: ui.controlRadius,
    minWidth: ui.scale(180),
    minHeight: ui.controlMinHeight,
    justifyContent: 'center',
    position: 'relative',
  },
  picker: {
    color: COLORS.primary,
    height: ui.pickerHeight,
  },
  androidPicker: {
    color: 'transparent',
  },
  pickerValueContainer: {
    position: 'absolute',
    left: ui.controlPaddingHorizontal,
    right: ui.scale(36),
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    zIndex: 1,
  },
  pickerValue: {
    color: COLORS.primary,
    fontSize: ui.scaleFont(16, 0.35),
    fontFamily: 'Lato-Regular',
    includeFontPadding: false,
  },
  columnHeaders: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ui.spacing(16),
    paddingVertical: ui.verticalScale(12),
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.secondary,
  },
  columnHeader: {
    fontSize: ui.scaleFont(12, 0.3),
    fontFamily: 'Montserrat-Bold',
    color: COLORS.secondary,
    width: ui.scale(50),
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: ui.verticalScale(12),
    fontSize: ui.scaleFont(16, 0.35),
    fontFamily: 'Lato-Regular',
    color: COLORS.primary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: ui.spacing(20, 0.45),
  },
  errorText: {
    marginTop: ui.verticalScale(16),
    fontSize: ui.scaleFont(16, 0.35),
    fontFamily: 'Lato-Regular',
    color: COLORS.error,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: ui.verticalScale(20),
    backgroundColor: COLORS.secondary,
    paddingHorizontal: ui.spacing(24, 0.45),
    paddingVertical: ui.verticalScale(12),
    borderRadius: ui.moderateScale(12, 0.35),
  },
  retryButtonText: {
    fontSize: ui.scaleFont(16, 0.35),
    fontFamily: 'Montserrat-Bold',
    color: COLORS.background,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: ui.spacing(16),
    paddingBottom: ui.verticalScale(32),
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: ui.moderateScale(16, 0.35),
    padding: ui.spacing(12, 0.35),
    marginBottom: ui.verticalScale(12),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.secondary,
  },
  rankContainer: {
    width: ui.scale(40),
    alignItems: 'center',
  },
  rankText: {
    fontSize: ui.scaleFont(22, 0.45),
    fontFamily: 'Montserrat-Bold',
  },
  avatar: {
    width: ui.scale(50),
    height: ui.scale(50),
    borderRadius: ui.moderateScale(10, 0.35),
    marginRight: ui.spacing(12, 0.35),
  },
  userInfo: {
    flex: 1,
  },
  nickname: {
    fontSize: ui.scaleFont(16, 0.35),
    fontFamily: 'Montserrat-Bold',
    color: COLORS.primary,
    marginBottom: ui.verticalScale(2),
  },
  mainValueLabel: {
    fontSize: ui.scaleFont(11, 0.3),
    fontFamily: 'Lato-Regular',
    color: COLORS.gray,
  },
  valueContainer: {
    alignItems: 'flex-end',
    minWidth: ui.scale(60),
  },
  mainValue: {
    fontSize: ui.scaleFont(18, 0.4),
    fontFamily: 'Montserrat-Bold',
    color: COLORS.secondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: ui.verticalScale(60),
  },
  emptyText: {
    marginTop: ui.verticalScale(16),
    fontSize: ui.scaleFont(16, 0.35),
    fontFamily: 'Lato-Regular',
    color: COLORS.gray,
  },
})
