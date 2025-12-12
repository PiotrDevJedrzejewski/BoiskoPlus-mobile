import { useState } from 'react'
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
import { useRouter } from 'expo-router'
import { COLORS } from '../../../../constants/colors'
import { useAuth } from '../../../../context/AuthContext'

const defaultAvatar = require('../../../../assets/images/defaultAvatar.png')

// Mock data - zalogowany użytkownik
const MOCK_USER = {
  _id: 'currentUser',
  nickName: 'MójNick123',
  name: 'Jan',
  surname: 'Kowalski',
  email: 'jan.kowalski@email.com',
  avatarUrl: null,
}

// Mock data - statystyki użytkownika
const MOCK_USER_STATS = {
  gamesPlayed: 42,
  eventsOrganized: 8,
  totalLikes: 23,
  points: 1250,
}

const StatItem = ({ label, value }) => (
  <View style={styles.statItem}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
)

const Profile = () => {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const { user, userStats } = useAuth()

  const avatar = user.avatarUrl ? { uri: user.avatarUrl } : defaultAvatar

  const handleChangeAvatar = () => {
    // W przyszłości: image picker
    Alert.alert('Zmień avatar', 'Funkcja w przygotowaniu')
  }

  const handleEditProfile = () => {
    router.push('/(main)/(tabs)/(hidden)/profile-edit')
  }

  const handleChangePassword = () => {
    // router.push('/forget-password')
    Alert.alert('Zmień hasło', 'Funkcja w przygotowaniu')
  }

  const handleDeleteAccount = () => {
    Alert.alert(
      'Usuń konto',
      'Czy na pewno chcesz usunąć swoje konto? Ta akcja jest nieodwracalna!',
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Usuń',
          style: 'destructive',
          onPress: () => {
            // W przyszłości: API call
            console.log('Delete account')
          },
        },
      ]
    )
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' color={COLORS.secondary} />
        <Text style={styles.loadingText}>Ładowanie profilu...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name='person-circle' size={26} color={COLORS.secondary} />
        <Text style={styles.headerText}>Profil Gracza</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <Image source={avatar} style={styles.avatar} />
          <Text style={styles.avatarHint}>200x200</Text>
          <TouchableOpacity
            style={styles.changeAvatarButton}
            onPress={handleChangeAvatar}
            activeOpacity={0.8}
          >
            <Ionicons name='camera' size={18} color={COLORS.background} />
            <Text style={styles.changeAvatarText}>Zmień Avatar</Text>
          </TouchableOpacity>
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
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{user.email}</Text>
          </View>
        </View>

        {/* Statystyki */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Statystyki</Text>
          <View style={styles.statsGrid}>
            <StatItem label='Rozegrane gry' value={userStats.gamesPlayed} />
            <StatItem label='Utworzone gry' value={userStats.eventsOrganized} />
            <StatItem label='Polubienia' value={userStats.totalLikes} />
            <StatItem label='Punkty' value={userStats.points} />
          </View>
        </View>

        {/* Przyciski */}
        <View style={styles.buttonsSection}>
          <TouchableOpacity
            style={styles.button}
            onPress={handleEditProfile}
            activeOpacity={0.8}
          >
            <Ionicons name='create-outline' size={20} color={COLORS.primary} />
            <Text style={styles.buttonText}>Edytuj profil</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={handleChangePassword}
            activeOpacity={0.8}
          >
            <Ionicons name='key-outline' size={20} color={COLORS.primary} />
            <Text style={styles.buttonText}>Zmień hasło</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.dangerButton]}
            onPress={handleDeleteAccount}
            activeOpacity={0.8}
          >
            <Ionicons name='trash-outline' size={20} color={COLORS.error} />
            <Text style={[styles.buttonText, styles.dangerButtonText]}>
              Usuń konto
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  )
}

export default Profile

const styles = StyleSheet.create({
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
    marginTop: 12,
    fontSize: 16,
    fontFamily: 'Lato-Regular',
    color: COLORS.primary,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 150,
    height: 150,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  avatarHint: {
    fontSize: 10,
    fontFamily: 'Lato-Regular',
    color: COLORS.gray,
    marginTop: 4,
  },
  changeAvatarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 12,
  },
  changeAvatarText: {
    fontSize: 14,
    fontFamily: 'Montserrat-Bold',
    color: COLORS.background,
    marginLeft: 8,
  },
  username: {
    fontSize: 28,
    fontFamily: 'Montserrat-Bold',
    color: COLORS.primary,
    marginBottom: 24,
  },
  infoSection: {
    width: '100%',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  infoLabel: {
    fontSize: 16,
    fontFamily: 'Lato-Regular',
    color: COLORS.gray,
    width: 100,
  },
  infoValue: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Lato-Regular',
    color: COLORS.primary,
  },
  statsSection: {
    width: '100%',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Montserrat-Bold',
    color: COLORS.secondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Montserrat-Bold',
    color: COLORS.secondary,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Lato-Regular',
    color: COLORS.primary,
    marginTop: 4,
    textAlign: 'center',
  },
  buttonsSection: {
    width: '100%',
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 1,
    borderColor: COLORS.secondary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'Montserrat-Bold',
    color: COLORS.primary,
    marginLeft: 10,
  },
  dangerButton: {
    borderColor: COLORS.error,
  },
  dangerButtonText: {
    color: COLORS.error,
  },
})
