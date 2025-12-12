import { useState, useEffect } from 'react'
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
import { useRouter, useLocalSearchParams } from 'expo-router'
import { COLORS } from '../../../../constants/colors'
import FormEvent from '../../../../components/FormEvent'
import EditEventUserCard from '../../../../components/EditEventUserCard'
import ConfirmModal from '../../../(Popup)/ConfirmModal'
import customFetch from '../../../../assets/utils/customFetch'

const StatBadge = ({ count, label, color }) => (
  <View style={[styles.statBadge, { borderColor: color }]}>
    <Text style={[styles.statCount, { color }]}>{count}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
)

const EditEvent = () => {
  const router = useRouter()
  const { id } = useLocalSearchParams()

  const [loading, setLoading] = useState(true)
  const [event, setEvent] = useState(null)
  const [users, setUsers] = useState([])
  const [showEditForm, setShowEditForm] = useState(false)

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showFinishModal, setShowFinishModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  // Statystyki
  const interestedCount = users.filter((u) => u.status === 'interested').length
  const acceptedCount = users.filter((u) => u.status === 'accepted').length
  const rejectedCount = users.filter((u) => u.status === 'rejected').length

  // Pobierz dane wydarzenia
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await customFetch.get(`/football-events/${id}`)
        setEvent(response.data.event)
      } catch (error) {
        console.error('Błąd pobierania wydarzenia:', error)
        Alert.alert('Błąd', 'Nie udało się pobrać danych wydarzenia')
      }
    }

    if (id) fetchEvent()
  }, [id])

  // Pobierz listę użytkowników powiązanych z wydarzeniem
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true)
      try {
        const response = await customFetch.get(`/status/events/${id}/users`)
        const eventUsers = response.data.eventUsers || []

        // Pobierz statystyki dla użytkowników
        if (eventUsers.length > 0) {
          const userIds = eventUsers.map((u) => u.userID._id)
          try {
            const statsResponse = await customFetch.post(
              '/user-stats/multiple',
              {
                userIds,
              }
            )

            // Połącz użytkowników ze statystykami
            const usersWithStats = eventUsers.map((user) => {
              const userStats = statsResponse.data.stats?.find(
                (stat) =>
                  stat.userID?.toString() === user.userID._id?.toString()
              )
              return {
                ...user,
                stats: userStats || {
                  gamesPlayed: 0,
                  eventsOrganized: 0,
                  totalLikes: 0,
                },
              }
            })
            setUsers(usersWithStats)
          } catch (statsError) {
            console.error('Błąd pobierania statystyk:', statsError)
            setUsers(eventUsers)
          }
        } else {
          setUsers([])
        }
      } catch (error) {
        console.error('Błąd pobierania użytkowników:', error)
        setUsers([])
      } finally {
        setLoading(false)
      }
    }

    if (id) fetchUsers()
  }, [id])

  const handleChangeUserStatus = async (userId, newStatus) => {
    try {
      await customFetch.patch(`/status/events/${id}/users/${userId}/status`, {
        status: newStatus,
      })
      // Odśwież listę użytkowników po zmianie
      const response = await customFetch.get(`/status/events/${id}/users`)
      const eventUsers = response.data.eventUsers || []

      // Pobierz statystyki dla użytkowników
      if (eventUsers.length > 0) {
        const userIds = eventUsers.map((u) => u.userID._id)
        try {
          const statsResponse = await customFetch.post('/user-stats/multiple', {
            userIds,
          })
          const usersWithStats = eventUsers.map((user) => {
            const userStats = statsResponse.data.stats?.find(
              (stat) => stat.userID?.toString() === user.userID._id?.toString()
            )
            return {
              ...user,
              stats: userStats || {
                gamesPlayed: 0,
                eventsOrganized: 0,
                totalLikes: 0,
              },
            }
          })
          setUsers(usersWithStats)
        } catch {
          setUsers(eventUsers)
        }
      }
      Alert.alert('Sukces', `Status zmieniony na: ${newStatus}`)
    } catch (error) {
      console.error('Błąd zmiany statusu:', error)
      Alert.alert('Błąd', 'Nie udało się zmienić statusu')
    }
  }

  const handleDeleteEvent = async () => {
    setActionLoading(true)
    try {
      await customFetch.delete(`/football-events/${id}`)
      setShowDeleteModal(false)
      Alert.alert('Sukces', 'Wydarzenie zostało usunięte')
      router.back()
    } catch (error) {
      console.error('Błąd usuwania wydarzenia:', error)
      Alert.alert('Błąd', 'Nie udało się usunąć wydarzenia')
    } finally {
      setActionLoading(false)
    }
  }

  const handleFinishEvent = async () => {
    setActionLoading(true)
    try {
      await customFetch.patch(`/football-events/${id}/finish`)
      setShowFinishModal(false)
      Alert.alert('Sukces', 'Wydarzenie zostało zakończone')
      router.back()
    } catch (error) {
      console.error('Błąd kończenia wydarzenia:', error)
      Alert.alert('Błąd', 'Nie udało się zakończyć wydarzenia')
    } finally {
      setActionLoading(false)
    }
  }

  const handleFormSubmit = async (formData) => {
    try {
      await customFetch.patch(`/football-events/${id}`, formData)
      setEvent({ ...event, ...formData })
      setShowEditForm(false)
      Alert.alert('Sukces', 'Wydarzenie zostało zaktualizowane')
    } catch (error) {
      console.error('Błąd aktualizacji wydarzenia:', error)
      Alert.alert('Błąd', 'Nie udało się zaktualizować wydarzenia')
    }
  }

  const handleGoBack = () => {
    router.back()
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' color={COLORS.secondary} />
        <Text style={styles.loadingText}>Ładowanie wydarzenia...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleGoBack}
          style={styles.backIconButton}
          activeOpacity={0.7}
        >
          <Ionicons name='arrow-back' size={24} color={COLORS.secondary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Ionicons name='create' size={22} color={COLORS.secondary} />
          <Text style={styles.headerText} numberOfLines={1}>
            {event?.eventName || 'Edycja wydarzenia'}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => setShowEditForm(!showEditForm)}
            activeOpacity={0.8}
          >
            <Ionicons name='pencil' size={18} color={COLORS.background} />
            <Text style={styles.actionButtonText}>
              {showEditForm ? 'Anuluj' : 'Edytuj'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.finishButton]}
            onPress={() => setShowFinishModal(true)}
            activeOpacity={0.8}
          >
            <Ionicons
              name='checkmark-done'
              size={18}
              color={COLORS.background}
            />
            <Text style={styles.actionButtonText}>Zakończ</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => setShowDeleteModal(true)}
            activeOpacity={0.8}
          >
            <Ionicons name='trash' size={18} color='#fff' />
            <Text style={[styles.actionButtonText, { color: '#fff' }]}>
              Usuń
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatBadge
            count={interestedCount}
            label='Zainteresowani'
            color={COLORS.secondary}
          />
          <StatBadge
            count={acceptedCount}
            label='Zaakceptowani'
            color={COLORS.third}
          />
          <StatBadge
            count={rejectedCount}
            label='Odrzuceni'
            color={COLORS.error}
          />
        </View>

        {/* Content - Form or User List */}
        {showEditForm ? (
          <View style={styles.formContainer}>
            <FormEvent
              mode='edit'
              initialData={event}
              onSubmit={handleFormSubmit}
            />
          </View>
        ) : (
          <View style={styles.usersContainer}>
            <Text style={styles.sectionTitle}>Lista uczestników</Text>
            {users.length > 0 ? (
              users.map((userStatus) => (
                <EditEventUserCard
                  key={userStatus._id}
                  user={userStatus.userID}
                  stats={userStatus.stats}
                  status={userStatus.status}
                  onAccept={() =>
                    handleChangeUserStatus(userStatus.userID._id, 'accepted')
                  }
                  onReject={() =>
                    handleChangeUserStatus(userStatus.userID._id, 'rejected')
                  }
                />
              ))
            ) : (
              <Text style={styles.emptyText}>
                Brak użytkowników do wyświetlenia
              </Text>
            )}
          </View>
        )}
      </ScrollView>

      {/* Delete Modal */}
      <ConfirmModal
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteEvent}
        title='Czy na pewno chcesz usunąć to wydarzenie?'
        actionText='USUŃ'
        actionType='danger'
        loading={actionLoading}
      />

      {/* Finish Modal */}
      <ConfirmModal
        visible={showFinishModal}
        onClose={() => setShowFinishModal(false)}
        onConfirm={handleFinishEvent}
        title='Czy na pewno chcesz zakończyć to wydarzenie?'
        actionText='ZAKOŃCZ'
        actionType='warning'
        loading={actionLoading}
      />
    </View>
  )
}

export default EditEvent

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
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  backIconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  headerText: {
    fontSize: 16,
    fontFamily: 'Montserrat-Bold',
    color: COLORS.primary,
    marginLeft: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 6,
  },
  editButton: {
    backgroundColor: COLORS.secondary,
  },
  finishButton: {
    backgroundColor: COLORS.third,
  },
  deleteButton: {
    backgroundColor: COLORS.error,
  },
  actionButtonText: {
    fontSize: 13,
    fontFamily: 'Montserrat-Bold',
    color: COLORS.background,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statBadge: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    marginHorizontal: 4,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 10,
    borderWidth: 1,
  },
  statCount: {
    fontSize: 20,
    fontFamily: 'Montserrat-Bold',
  },
  statLabel: {
    fontSize: 10,
    fontFamily: 'Lato-Regular',
    color: COLORS.gray,
    marginTop: 2,
  },
  formContainer: {
    marginTop: 10,
  },
  usersContainer: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Montserrat-Bold',
    color: COLORS.secondary,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Lato-Regular',
    color: COLORS.gray,
    textAlign: 'center',
    paddingVertical: 40,
  },
})
