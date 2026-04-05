import { useState, useMemo } from 'react'
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '../../constants/colors'
import { useResponsiveScale } from '../../assets/utils/scaleUI.UX'
import { useFriendship } from '../../context/FriendshipContext'
import PlayerCardWithActions from '../PlayerCardWithActions'
import customFetch from '../../assets/utils/customFetch'

// <InviteModal
//   visible={showInviteModal}
//   onClose={() => setShowInviteModal(false)}
//   eventId={id}
//   invitedUserIds={['userId1', 'userId2']}
// />

const InviteModal = ({ visible, onClose, eventId, invitedUserIds = [] }) => {
  const ui = useResponsiveScale()
  const styles = useMemo(() => createStyles(ui), [ui])
  const { friends, friendsLoading } = useFriendship()
  const [pendingIds, setPendingIds] = useState(new Set())
  const [localInvitedIds, setLocalInvitedIds] = useState(new Set(invitedUserIds))

  // Sync localInvitedIds when modal opens with fresh invitedUserIds
  const handleOpen = () => {
    setLocalInvitedIds(new Set(invitedUserIds))
  }

  const handleInvite = async (friendId) => {
    setPendingIds((prev) => new Set([...prev, friendId]))
    try {
      await customFetch.post(`/status/events/${eventId}/invite/${friendId}`)
      setLocalInvitedIds((prev) => new Set([...prev, friendId]))
    } catch (error) {
      Alert.alert('Błąd', error?.response?.data?.msg || 'Nie udało się wysłać zaproszenia')
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev)
        next.delete(friendId)
        return next
      })
    }
  }

  const handleCancelInvite = async (friendId) => {
    setPendingIds((prev) => new Set([...prev, friendId]))
    try {
      await customFetch.delete(`/status/events/${eventId}/invite/${friendId}`)
      setLocalInvitedIds((prev) => {
        const next = new Set(prev)
        next.delete(friendId)
        return next
      })
    } catch (error) {
      Alert.alert('Błąd', error?.response?.data?.msg || 'Nie udało się anulować zaproszenia')
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev)
        next.delete(friendId)
        return next
      })
    }
  }

  const renderFriend = ({ item }) => {
    const friendId = item.friend?._id
    const isInvited = localInvitedIds.has(friendId)
    const isPending = pendingIds.has(friendId)

    const actions = isPending
      ? []
      : isInvited
      ? [{ text: 'Anuluj', type: 'secondary', handler: () => handleCancelInvite(friendId) }]
      : [{ text: 'Zaproś', type: 'primary', handler: () => handleInvite(friendId) }]

    return <PlayerCardWithActions player={item.friend} actions={actions} />
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType='slide'
      onRequestClose={onClose}
      onShow={handleOpen}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Ionicons name='close' size={ui.moderateScale(22, 0.35)} color={COLORS.secondary} />
            </TouchableOpacity>
            <Text style={styles.headerText}>Zaproś znajomego</Text>
            <View style={{ width: ui.moderateScale(36, 0.35) }} />
          </View>

          {/* Content */}
          {friendsLoading ? (
            <View style={styles.centerState}>
              <ActivityIndicator size='large' color={COLORS.secondary} />
              <Text style={styles.stateText}>Ładowanie znajomych...</Text>
            </View>
          ) : friends.length === 0 ? (
            <View style={styles.centerState}>
              <Ionicons name='people-outline' size={ui.moderateScale(48, 0.35)} color={COLORS.gray} />
              <Text style={styles.stateText}>Brak znajomych do zaproszenia</Text>
            </View>
          ) : (
            <FlatList
              data={friends}
              keyExtractor={(item) => item.friend?._id || item.friendshipID}
              renderItem={renderFriend}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </View>
    </Modal>
  )
}

export default InviteModal

const createStyles = (ui) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'flex-end',
      paddingHorizontal: ui.spacing(16),
      paddingBottom: ui.verticalScale(24),
    },
    modalContainer: {
      height: '70%',
      backgroundColor: COLORS.background,
      borderRadius: ui.moderateScale(16, 0.35),
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: ui.verticalScale(14),
      paddingHorizontal: ui.spacing(16),
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
    closeButton: {
      width: ui.moderateScale(36, 0.35),
      height: ui.moderateScale(36, 0.35),
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerText: {
      fontSize: ui.scaleFont(16, 0.45),
      fontFamily: 'Montserrat-Bold',
      color: COLORS.primary,
    },
    listContent: {
      padding: ui.spacing(12),
      paddingBottom: ui.verticalScale(24),
    },
    centerState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: ui.verticalScale(12),
    },
    stateText: {
      fontSize: ui.scaleFont(14, 0.35),
      fontFamily: 'Lato-Regular',
      color: COLORS.gray,
    },
  })
