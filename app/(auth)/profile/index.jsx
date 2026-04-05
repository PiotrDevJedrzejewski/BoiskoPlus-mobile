import { useState, useMemo} from 'react'
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
import { COLORS } from '../../../constants/colors'
import { useAuth } from '../../../context/AuthContext'
import ConfirmModal from '../../../components/popup/ConfirmModal'
import ProfileAvatarSection from '../../../components/profile/ProfileAvatarSection'
import { useResponsiveScale } from '../../../assets/utils/scaleUI.UX'
import { dbg, useDebugMount } from '../../../assets/utils/debugLogger'

const StatItem = ({ label, value, styles }) => (
  <View style={styles.statItem}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
)

const Profile = () => {
  dbg('ProfileScreen')
  useDebugMount('ProfileScreen')
  const router = useRouter()
  const ui = useResponsiveScale()
  const styles = useMemo(() => createStyles(ui), [ui])
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
    router.push('/(auth)/profile/profile-edit')
  }

  const handleChangePassword = () => {
    router.push('/(auth)/profile/profile-password')
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
        <Ionicons name='person-circle' size={ui.moderateScale(26, 0.35)} color={COLORS.secondary} />
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
            <StatItem label='Rozegrane gry' value={stats.gamesPlayed} styles={styles} />
            <StatItem label='Utworzone gry' value={stats.eventsOrganized} styles={styles} />
            <StatItem label='Polubienia' value={stats.totalLikes} styles={styles} />
            <StatItem label='Punkty' value={stats.points} styles={styles} />
          </View>
        </View>

        {/* Przyciski */}
        <View style={styles.buttonsSection}>
          <TouchableOpacity
            style={styles.button}
            onPress={handleEditProfile}
            activeOpacity={0.8}
          >
            <Ionicons name='create-outline' size={ui.moderateScale(20, 0.35)} color={COLORS.primary} />
            <Text style={styles.buttonText}>Edytuj profil</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={handleChangePassword}
            activeOpacity={0.8}
          >
            <Ionicons name='key-outline' size={ui.moderateScale(20, 0.35)} color={COLORS.primary} />
            <Text style={styles.buttonText}>Zmień hasło</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.dangerButton]}
            onPress={handleDeleteAccount}
            activeOpacity={0.8}
          >
            <Ionicons name='trash-outline' size={ui.moderateScale(20, 0.35)} color={COLORS.error} />
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: ui.spacing(20, 0.45),
    paddingBottom: ui.verticalScale(40),
    alignItems: 'center',
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
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 1,
    borderColor: COLORS.secondary,
    borderRadius: ui.moderateScale(12, 0.35),
    paddingVertical: ui.verticalScale(14),
    paddingHorizontal: ui.spacing(20, 0.45),
  },
  buttonText: {
    fontSize: ui.scaleFont(16, 0.35),
    fontFamily: 'Montserrat-Bold',
    color: COLORS.primary,
    marginLeft: ui.spacing(10, 0.35),
  },
  dangerButton: {
    borderColor: COLORS.error,
  },
  dangerButtonText: {
    color: COLORS.error,
  },
})
