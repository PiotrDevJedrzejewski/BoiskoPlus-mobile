import { useState } from 'react'
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
import { useThemedStyles } from '../../context/themeStore'
import { SPACING, BORDER_RADIUS } from '../../Theme/StyleConstants'
import { verticalScale, moderateScale, scaleFont } from '../../Theme/ScalableStyles'
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
  const { styles, colors } = useThemedStyles(createStyles)
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
              <Ionicons name='close' size={moderateScale(22, 0.35)} color={colors.PrimaryGreen} />
            </TouchableOpacity>
            <Text style={styles.headerText}>Zaproś znajomego</Text>
            <View style={{ width: moderateScale(36, 0.35) }} />
          </View>

          {/* Content */}
          {friendsLoading ? (
            <View style={styles.centerState}>
              <ActivityIndicator size='large' color={colors.PrimaryGreen} />
              <Text style={styles.stateText}>Ładowanie znajomych...</Text>
            </View>
          ) : friends.length === 0 ? (
            <View style={styles.centerState}>
              <Ionicons name='people-outline' size={moderateScale(48, 0.35)} color={colors.thirdText} />
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

const createStyles = (colors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'flex-end',
      paddingHorizontal: SPACING.md,
      paddingBottom: verticalScale(24),
    },
    modalContainer: {
      height: '70%',
      backgroundColor: colors.background,
      borderRadius: BORDER_RADIUS.lg,
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: verticalScale(14),
      paddingHorizontal: SPACING.md,
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
    closeButton: {
      width: moderateScale(36, 0.35),
      height: moderateScale(36, 0.35),
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerText: {
      fontSize: scaleFont(16, 0.45),
      fontFamily: 'BarlowCondensed-ExtraBold',
      color: colors.primaryText,
    },
    listContent: {
      padding: SPACING.sm,
      paddingBottom: verticalScale(24),
    },
    centerState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: verticalScale(12),
    },
    stateText: {
      fontSize: scaleFont(14, 0.35),
      fontFamily: 'Inter-Regular',
      color: colors.thirdText,
    },
  })
