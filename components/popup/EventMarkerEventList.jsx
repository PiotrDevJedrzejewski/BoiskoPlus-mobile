import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  Modal,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { COLORS } from '../../constants/colors'
import { useResponsiveScale } from '../../assets/utils/scaleUI.UX'

const getLevelLabel = (level) => {
  switch (level) {
    case 'beginner':
      return 'Junior'
    case 'intermediate':
      return 'Mid'
    case 'advanced':
      return 'High'
    case 'professional':
      return 'Pro'
    case 'other':
      return 'All'
    default:
      return ''
  }
}

const EventMarkerEventList = ({ events, onClose }) => {
  const router = useRouter()
  const ui = useResponsiveScale()
  const styles = createStyles(ui)

  const handleEventPress = (eventId) => {
    onClose()
    // hack - w modalu pushowanie jest w innym stacku, a replace powoduje błąd w single-event, timeout pozwala na zamknięcie modala przed nawigacją
    setTimeout(() => {
      router.push(`/(auth)/single-event?id=${eventId}`)
    }, 100)
  }

  const getSmallGameTypeIcon = (gameType) => {
    const iconMap = {
      football: (
        <MaterialCommunityIcons
          name='soccer'
          size={ui.moderateScale(28, 0.35)}
          color={COLORS.secondary}
        />
      ),
      volleyball: (
        <MaterialCommunityIcons
          name='volleyball'
          size={ui.moderateScale(28, 0.35)}
          color={COLORS.secondary}
        />
      ),
      basketball: (
        <MaterialCommunityIcons
          name='basketball'
          size={ui.moderateScale(28, 0.35)}
          color={COLORS.secondary}
        />
      ),
      handball: (
        <MaterialCommunityIcons
          name='handball'
          size={ui.moderateScale(28, 0.35)}
          color={COLORS.secondary}
        />
      ),
      rugby: (
        <MaterialCommunityIcons
          name='rugby'
          size={ui.moderateScale(28, 0.35)}
          color={COLORS.secondary}
        />
      ),
      hockey: (
        <MaterialCommunityIcons
          name='hockey-sticks'
          size={ui.moderateScale(28, 0.35)}
          color={COLORS.secondary}
        />
      ),
      tennis: (
        <MaterialCommunityIcons
          name='tennis'
          size={ui.moderateScale(28, 0.35)}
          color={COLORS.secondary}
        />
      ),
      badminton: (
        <MaterialCommunityIcons
          name='badminton'
          size={ui.moderateScale(28, 0.35)}
          color={COLORS.secondary}
        />
      ),
      'table tennis': (
        <MaterialCommunityIcons
          name='table-tennis'
          size={ui.moderateScale(28, 0.35)}
          color={COLORS.secondary}
        />
      ),
      bowling: (
        <MaterialCommunityIcons
          name='bowling'
          size={ui.moderateScale(28, 0.35)}
          color={COLORS.secondary}
        />
      ),
      cards: (
        <MaterialCommunityIcons
          name='cards'
          size={ui.moderateScale(28, 0.35)}
          color={COLORS.secondary}
        />
      ),
      'board games': (
        <MaterialCommunityIcons
          name='chess-knight'
          size={ui.moderateScale(28, 0.35)}
          color={COLORS.secondary}
        />
      ),
    }
    return (
      iconMap[gameType] || (
        <Ionicons name='help-circle' size={ui.moderateScale(28, 0.35)} color={COLORS.secondary} />
      )
    )
  }

  return (
    <Modal
      visible={true}
      transparent={true}
      animationType='fade'
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              Wydarzenia ({events?.length || 0})
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name='close' size={ui.moderateScale(24, 0.35)} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          {/* Lista eventów */}
          <ScrollView
            style={styles.listWrapper}
            showsVerticalScrollIndicator={false}
          >
            {events?.map((event, index) => (
              <TouchableOpacity
                key={event._id || event.eventId || index}
                style={styles.item}
                onPress={() => handleEventPress(event._id || event.eventId)}
                activeOpacity={0.7}
              >
                {/* Ikona i typ gry */}
                <View style={styles.iconSection}>
                  {getSmallGameTypeIcon(event.gameType)}
                  <Text style={styles.gameType}>
                    {event.gameType?.toUpperCase()}
                  </Text>
                </View>

                {/* Informacje o evencie */}
                <View style={styles.infoSection}>
                  <Text style={styles.eventName} numberOfLines={1}>
                    {event.eventName}
                  </Text>
                  <Text style={styles.eventAddress} numberOfLines={1}>
                    {event.addressString}
                  </Text>

                  {/* Szczegóły */}
                  <View style={styles.detailsRow}>
                    <View style={styles.detailItem}>
                      <Ionicons name='time' size={ui.moderateScale(13, 0.3)} color={COLORS.secondary} />
                      <Text style={styles.detailText}>{event.duration}min</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <MaterialCommunityIcons name='cash' size={ui.moderateScale(13, 0.3)} color={COLORS.secondary} />
                      <Text style={styles.detailText}>{event.price}zł</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Ionicons name='people' size={ui.moderateScale(13, 0.3)} color={COLORS.secondary} />
                      <Text style={styles.detailText}>{event.playerCount}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Ionicons name='speedometer-outline' size={ui.moderateScale(13, 0.3)} color={COLORS.secondary} />
                      <Text style={styles.detailText}>{getLevelLabel(event.level)}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <MaterialCommunityIcons name='human-cane' size={ui.moderateScale(13, 0.3)} color={COLORS.secondary} />
                      <Text style={styles.detailText}>{event.ageRange?.[0] ?? 0}–{event.ageRange?.[1] ?? 100}l</Text>
                    </View>
                  </View>
                </View>

                {/* Strzałka */}
                <Ionicons
                  name='chevron-forward'
                  size={ui.moderateScale(20, 0.35)}
                  color={COLORS.grayLight}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  )
}

export default EventMarkerEventList

const createStyles = (ui) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: ui.spacing(20, 0.45),
  },
  container: {
    backgroundColor: COLORS.background,
    borderRadius: ui.moderateScale(16, 0.35),
    width: '100%',
    maxHeight: '70%',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.third,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: ui.spacing(16),
    paddingVertical: ui.verticalScale(14),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.third,
    backgroundColor: COLORS.backgroundSecondary,
  },
  headerTitle: {
    fontSize: ui.scaleFont(16, 0.35),
    fontFamily: 'Montserrat-Bold',
    color: COLORS.primary,
  },
  closeButton: {
    padding: ui.spacing(4, 0.25),
  },
  listWrapper: {
    padding: ui.spacing(12, 0.35),
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: ui.moderateScale(12, 0.35),
    padding: ui.spacing(12, 0.35),
    marginBottom: ui.verticalScale(10),
  },
  iconSection: {
    alignItems: 'center',
    marginRight: ui.spacing(12, 0.35),
    minWidth: ui.scale(50),
  },
  gameType: {
    fontSize: ui.scaleFont(8, 0.25),
    fontFamily: 'Montserrat-Bold',
    color: COLORS.secondary,
    marginTop: ui.verticalScale(4),
    textAlign: 'center',
  },
  infoSection: {
    flex: 1,
    marginRight: ui.spacing(5, 0.35),
  },
  eventName: {
    fontSize: ui.scaleFont(14, 0.35),
    fontFamily: 'Montserrat-Bold',
    color: COLORS.primary,
    marginBottom: ui.verticalScale(2),
  },
  eventAddress: {
    fontSize: ui.scaleFont(11, 0.3),
    fontFamily: 'Lato-Regular',
    color: COLORS.primary,
    opacity: 0.7,
    fontStyle: 'italic',
    marginBottom: ui.verticalScale(6),
  },
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ui.spacing(12, 0.3),
    marginBottom: ui.verticalScale(4),
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ui.spacing(6, 0.25),
  },
  detailText: {
    fontSize: ui.scaleFont(12, 0.3),
    fontFamily: 'Lato-Regular',
    color: COLORS.primary,
    opacity: 0.9,
  },
})
