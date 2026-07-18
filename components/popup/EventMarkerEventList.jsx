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
import { useThemedStyles } from '../../context/themeStore'
import { SPACING, BORDER_RADIUS } from '../../Theme/StyleConstants'
import { scale, verticalScale, moderateScale, scaleFont } from '../../Theme/ScalableStyles'

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
  const { styles, colors } = useThemedStyles(createStyles)

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
          size={moderateScale(28, 0.35)}
          color={colors.PrimaryGreen}
        />
      ),
      volleyball: (
        <MaterialCommunityIcons
          name='volleyball'
          size={moderateScale(28, 0.35)}
          color={colors.PrimaryGreen}
        />
      ),
      basketball: (
        <MaterialCommunityIcons
          name='basketball'
          size={moderateScale(28, 0.35)}
          color={colors.PrimaryGreen}
        />
      ),
      handball: (
        <MaterialCommunityIcons
          name='handball'
          size={moderateScale(28, 0.35)}
          color={colors.PrimaryGreen}
        />
      ),
      rugby: (
        <MaterialCommunityIcons
          name='rugby'
          size={moderateScale(28, 0.35)}
          color={colors.PrimaryGreen}
        />
      ),
      hockey: (
        <MaterialCommunityIcons
          name='hockey-sticks'
          size={moderateScale(28, 0.35)}
          color={colors.PrimaryGreen}
        />
      ),
      tennis: (
        <MaterialCommunityIcons
          name='tennis'
          size={moderateScale(28, 0.35)}
          color={colors.PrimaryGreen}
        />
      ),
      badminton: (
        <MaterialCommunityIcons
          name='badminton'
          size={moderateScale(28, 0.35)}
          color={colors.PrimaryGreen}
        />
      ),
      'table tennis': (
        <MaterialCommunityIcons
          name='table-tennis'
          size={moderateScale(28, 0.35)}
          color={colors.PrimaryGreen}
        />
      ),
      bowling: (
        <MaterialCommunityIcons
          name='bowling'
          size={moderateScale(28, 0.35)}
          color={colors.PrimaryGreen}
        />
      ),
      cards: (
        <MaterialCommunityIcons
          name='cards'
          size={moderateScale(28, 0.35)}
          color={colors.PrimaryGreen}
        />
      ),
      'board games': (
        <MaterialCommunityIcons
          name='chess-knight'
          size={moderateScale(28, 0.35)}
          color={colors.PrimaryGreen}
        />
      ),
    }
    return (
      iconMap[gameType] || (
        <Ionicons name='help-circle' size={moderateScale(28, 0.35)} color={colors.PrimaryGreen} />
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
              <Ionicons name='close' size={moderateScale(24, 0.35)} color={colors.primaryText} />
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
                      <Ionicons name='time' size={moderateScale(13, 0.3)} color={colors.PrimaryGreen} />
                      <Text style={styles.detailText}>{event.duration}min</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <MaterialCommunityIcons name='cash' size={moderateScale(13, 0.3)} color={colors.PrimaryGreen} />
                      <Text style={styles.detailText}>{event.price}zł</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Ionicons name='people' size={moderateScale(13, 0.3)} color={colors.PrimaryGreen} />
                      <Text style={styles.detailText}>{event.playerCount}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Ionicons name='speedometer-outline' size={moderateScale(13, 0.3)} color={colors.PrimaryGreen} />
                      <Text style={styles.detailText}>{getLevelLabel(event.level)}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <MaterialCommunityIcons name='human-cane' size={moderateScale(13, 0.3)} color={colors.PrimaryGreen} />
                      <Text style={styles.detailText}>{event.ageRange?.[0] ?? 0}–{event.ageRange?.[1] ?? 100}l</Text>
                    </View>
                  </View>
                </View>

                {/* Strzałka */}
                <Ionicons
                  name='chevron-forward'
                  size={moderateScale(20, 0.35)}
                  color={colors.thirdText}
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

const createStyles = (colors) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  container: {
    backgroundColor: colors.background,
    borderRadius: BORDER_RADIUS.lg,
    width: '100%',
    maxHeight: '70%',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: verticalScale(14),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.backgroundSecondary,
  },
  headerTitle: {
    fontSize: scaleFont(16, 0.35),
    fontFamily: 'Montserrat-Bold',
    color: colors.primaryText,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  listWrapper: {
    padding: SPACING.sm,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    marginBottom: verticalScale(10),
  },
  iconSection: {
    alignItems: 'center',
    marginRight: SPACING.md,
    minWidth: scale(50),
  },
  gameType: {
    fontSize: scaleFont(8, 0.25),
    fontFamily: 'Montserrat-Bold',
    color: colors.PrimaryGreen,
    marginTop: verticalScale(4),
    textAlign: 'center',
  },
  infoSection: {
    flex: 1,
    marginRight: SPACING.xs,
  },
  eventName: {
    fontSize: scaleFont(14, 0.35),
    fontFamily: 'Montserrat-Bold',
    color: colors.primaryText,
    marginBottom: verticalScale(2),
  },
  eventAddress: {
    fontSize: scaleFont(11, 0.3),
    fontFamily: 'Lato-Regular',
    color: colors.primaryText,
    opacity: 0.7,
    fontStyle: 'italic',
    marginBottom: verticalScale(6),
  },
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: verticalScale(4),
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  detailText: {
    fontSize: scaleFont(12, 0.3),
    fontFamily: 'Lato-Regular',
    color: colors.primaryText,
    opacity: 0.9,
  },
})
