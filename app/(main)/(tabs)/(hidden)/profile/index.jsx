import { useState } from 'react'
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { COLORS } from '../../../../../constants/colors'
import { useAuth } from '../../../../../context/AuthContext'
import ConfirmModal from '../../../../../components/popup/ConfirmModal'
import ProfileAvatarSection from '../../../../../components/profile/ProfileAvatarSection'

const StatItem = ({ label, value }) => (
  <View style={styles.statItem}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
)

const Profile = () => {
  const router = useRouter()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const {
    user,
    userStats,
    deleteAccount,
    updateProfile,
    refetchUser,
    loading: authLoading,
  } = useAuth()

  const stats = userStats || {
    gamesPlayed: 0,
    eventsOrganized: 0,
    totalLikes: 0,
    points: 0,
  }

  const handleEditProfile = () => {
    router.push('/(main)/(tabs)/(hidden)/profile/profile-edit')
  }

  const handleChangePassword = () => {
    router.push('/(main)/(tabs)/(hidden)/profile/profile-password')
  }

  const handleDeleteAccount = () => {
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = async () => {
    if (deleteLoading) {
      return
    }

    setDeleteLoading(true)
    try {
      const result = await deleteAccount()

      if (!result.success) {
        Alert.alert('Błąd usuwania konta', result.error || 'Spróbuj ponownie')
      }
    } finally {
      setDeleteLoading(false)
      setShowDeleteModal(false)
    }
  }

  if (authLoading || !user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' color={COLORS.secondary} />
        <Text style={styles.loadingText}>Ładowanie profilu...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container} pointerEvents='box-none'>
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
        {/* Avatar Section */}
        <ProfileAvatarSection
          user={user}
          updateProfile={updateProfile}
          refetchUser={refetchUser}
        />

        {/* Username */}
        <Text style={styles.username}>{user.nickName || 'Gracz'}</Text>

        {/* Informacje */}
        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Imię:</Text>
            <Text style={styles.infoValue}>{user.name || '-'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nazwisko:</Text>
            <Text style={styles.infoValue}>{user.surname || '-'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{user.email || '-'}</Text>
          </View>
        </View>

        {/* Statystyki */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Statystyki</Text>
          <View style={styles.statsGrid}>
            <StatItem label='Rozegrane gry' value={stats.gamesPlayed} />
            <StatItem label='Utworzone gry' value={stats.eventsOrganized} />
            <StatItem label='Polubienia' value={stats.totalLikes} />
            <StatItem label='Punkty' value={stats.points} />
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

      <ConfirmModal
        visible={showDeleteModal}
        onClose={() => {
          if (!deleteLoading) {
            setShowDeleteModal(false)
          }
        }}
        onConfirm={handleConfirmDelete}
        title='Czy na pewno chcesz usunąć swoje konto? Ta akcja jest nieodwracalna.'
        actionText='USUŃ KONTO'
        actionType='danger'
        confirmButtonText='USUŃ'
        cancelButtonText='ANULUJ'
        loading={deleteLoading}
      />
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
