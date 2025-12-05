import { useState } from 'react'
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

const defaultAvatar = require('../../../../assets/images/defaultAvatar.png')

// Mock data - ranking użytkowników
const MOCK_LEADERBOARD = [
  {
    userID: { _id: '1', nickName: 'ProPlayer123', avatarUrl: null },
    gamesPlayed: 156,
    eventsOrganized: 23,
    totalLikes: 89,
    points: 2450,
  },
  {
    userID: { _id: '2', nickName: 'SportowiecMax', avatarUrl: null },
    gamesPlayed: 142,
    eventsOrganized: 18,
    totalLikes: 67,
    points: 2180,
  },
  {
    userID: { _id: '3', nickName: 'Pilkarz_Lodzki', avatarUrl: null },
    gamesPlayed: 128,
    eventsOrganized: 31,
    totalLikes: 54,
    points: 1950,
  },
  {
    userID: { _id: '4', nickName: 'TeamLeader', avatarUrl: null },
    gamesPlayed: 98,
    eventsOrganized: 45,
    totalLikes: 112,
    points: 1820,
  },
  {
    userID: { _id: '5', nickName: 'GoalMaster', avatarUrl: null },
    gamesPlayed: 87,
    eventsOrganized: 12,
    totalLikes: 43,
    points: 1650,
  },
  {
    userID: { _id: '6', nickName: 'Siatkarz99', avatarUrl: null },
    gamesPlayed: 76,
    eventsOrganized: 8,
    totalLikes: 38,
    points: 1420,
  },
  {
    userID: { _id: '7', nickName: 'KoszMistrz', avatarUrl: null },
    gamesPlayed: 65,
    eventsOrganized: 15,
    totalLikes: 29,
    points: 1280,
  },
  {
    userID: { _id: '8', nickName: 'Sportowiec2000', avatarUrl: null },
    gamesPlayed: 54,
    eventsOrganized: 6,
    totalLikes: 21,
    points: 980,
  },
  {
    userID: { _id: '9', nickName: 'NowicjuszPL', avatarUrl: null },
    gamesPlayed: 32,
    eventsOrganized: 3,
    totalLikes: 12,
    points: 620,
  },
  {
    userID: { _id: '10', nickName: 'Gracz_Nowy', avatarUrl: null },
    gamesPlayed: 18,
    eventsOrganized: 1,
    totalLikes: 5,
    points: 340,
  },
]

const SORT_OPTIONS = [
  { label: 'Punkty', value: 'points' },
  { label: 'Rozegrane gry', value: 'gamesPlayed' },
  { label: 'Zorganizowane eventy', value: 'eventsOrganized' },
  { label: 'Łączne polubienia', value: 'totalLikes' },
]

const RankingCard = ({ user, rank, sortBy }) => {
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
  const [loading, setLoading] = useState(false)
  const [leaderboardData, setLeaderboardData] = useState(
    MOCK_LEADERBOARD.map((user, index) => ({ ...user, rank: index + 1 }))
  )

  // Sortowanie danych
  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy)
    setLoading(true)

    // Symulacja ładowania + sortowanie
    setTimeout(() => {
      const sorted = [...MOCK_LEADERBOARD].sort(
        (a, b) => b[newSortBy] - a[newSortBy]
      )
      const ranked = sorted.map((user, index) => ({ ...user, rank: index + 1 }))
      setLeaderboardData(ranked)
      setLoading(false)
    }, 300)
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
      ) : (
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {leaderboardData.map((user) => (
            <RankingCard
              key={user.userID._id}
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
