import { useState, useEffect } from 'react'
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Picker } from '@react-native-picker/picker'
import { COLORS } from '../../../../constants/colors'
import customFetch from '../../../../assets/utils/customFetch'

const defaultAvatar = require('../../../../assets/images/defaultAvatar.png')

const SORT_OPTIONS = [
  { label: 'Punkty', value: 'points' },
  { label: 'Rozegrane gry', value: 'gamesPlayed' },
  { label: 'Zorganizowane eventy', value: 'eventsOrganized' },
  { label: 'Łączne polubienia', value: 'totalLikes' },
]

const RankingCard = ({ user, rank, sortBy }) => {
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
  const [sortBy, setSortBy] = useState('points')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [leaderboardData, setLeaderboardData] = useState([])

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
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name='trophy' size={26} color={COLORS.secondary} />
        <Text style={styles.headerText}>Ranking</Text>
      </View>

      {/* Sortowanie */}
      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Sortuj według:</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={sortBy}
            onValueChange={handleSortChange}
            style={styles.picker}
            dropdownIconColor={COLORS.secondary}
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
            size={60}
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
            />
          ))}

          {leaderboardData.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name='trophy-outline' size={60} color={COLORS.gray} />
              <Text style={styles.emptyText}>Brak danych w rankingu</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  )
}

export default Ranking

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  headerText: {
    fontSize: 24,
    fontFamily: 'Montserrat-Bold',
    color: COLORS.primary,
    marginLeft: 12,
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  sortLabel: {
    fontSize: 16,
    fontFamily: 'Lato-Regular',
    color: COLORS.primary,
    marginRight: 12,
  },
  pickerWrapper: {
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 1,
    borderColor: COLORS.secondary,
    borderRadius: 12,
    overflow: 'hidden',
    minWidth: 180,
  },
  picker: {
    color: COLORS.primary,
    height: 44,
  },
  columnHeaders: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.secondary,
  },
  columnHeader: {
    fontSize: 12,
    fontFamily: 'Montserrat-Bold',
    color: COLORS.secondary,
    width: 50,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontFamily: 'Lato-Regular',
    color: COLORS.primary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Lato-Regular',
    color: COLORS.error,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 16,
    fontFamily: 'Montserrat-Bold',
    color: COLORS.background,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.secondary,
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 22,
    fontFamily: 'Montserrat-Bold',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 10,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  nickname: {
    fontSize: 16,
    fontFamily: 'Montserrat-Bold',
    color: COLORS.primary,
    marginBottom: 2,
  },
  mainValueLabel: {
    fontSize: 11,
    fontFamily: 'Lato-Regular',
    color: COLORS.gray,
  },
  valueContainer: {
    alignItems: 'flex-end',
    minWidth: 60,
  },
  mainValue: {
    fontSize: 18,
    fontFamily: 'Montserrat-Bold',
    color: COLORS.secondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Lato-Regular',
    color: COLORS.gray,
  },
})
