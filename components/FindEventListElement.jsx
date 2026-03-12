import { StyleSheet, Text, View, TouchableOpacity } from 'react-native'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { COLORS } from '../constants/colors'
import { getGameTypeIcon } from '../assets/utils/gameTypeIcons'
import { useResponsiveScale } from '../assets/utils/scaleUI.UX'

const FindEventListElement = ({ event, onPress }) => {
  const ui = useResponsiveScale()
  const styles = createStyles(ui)

  if (!event) {
    return (
      <View style={styles.elementLoading}>
        <Text style={styles.loadingText}>Ładowanie wydarzenia...</Text>
      </View>
    )
  }

  const icon = getGameTypeIcon(event.gameType)

  return (
    <TouchableOpacity
      style={styles.element}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Ikona i typ gry */}
      <View style={styles.iconWrapper}>
        <Text style={styles.gameType}>{event.gameType?.toUpperCase()}</Text>
        {icon}
      </View>

      {/* Główne informacje */}
      <View style={styles.textWrapper}>
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>
            {event.eventName}
          </Text>
          <Text style={styles.address} numberOfLines={1}>
            {event.addressString}
          </Text>
          <View style={styles.dateContainer}>
            <View style={styles.dateDay}>
              <Text style={styles.dateText}>{event.startDate}</Text>
            </View>
            <View style={styles.dateHour}>
              <Text style={styles.dateText}>{event.startHour}</Text>
            </View>
          </View>
        </View>
        <Text style={styles.description} numberOfLines={2}>
          {event.eventDescription}
        </Text>
      </View>

      {/* Dodatkowe informacje */}
      <View style={styles.additionalInfo}>
        <View style={styles.infoItem}>
          <Ionicons name='time' size={ui.moderateScale(16, 0.35)} color={COLORS.secondary} />
          <Text style={styles.infoText}>{event.duration} min</Text>
        </View>
        <View style={styles.infoItem}>
          <MaterialCommunityIcons
            name='cash'
            size={ui.moderateScale(16, 0.35)}
            color={COLORS.secondary}
          />
          <Text style={styles.infoText}>{event.price}zł</Text>
        </View>
        <View style={styles.infoItem}>
          <MaterialCommunityIcons
            name='gauge'
            size={ui.moderateScale(16, 0.35)}
            color={COLORS.secondary}
          />
          <Text style={styles.infoText}>{event.level}</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name='people' size={ui.moderateScale(16, 0.35)} color={COLORS.secondary} />
          <Text style={styles.infoText}>{event.playerCount}</Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}

export default FindEventListElement

const createStyles = (ui) => StyleSheet.create({
  element: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: ui.moderateScale(16, 0.35),
    marginBottom: ui.verticalScale(16),
    overflow: 'hidden',
  },
  elementLoading: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: ui.moderateScale(16, 0.35),
    minHeight: ui.verticalScale(120),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: ui.verticalScale(16),
  },
  loadingText: {
    color: COLORS.secondary,
    fontSize: ui.scaleFont(14, 0.35),
    fontFamily: 'Lato-Regular',
  },
  iconWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: ui.spacing(16),
    paddingBottom: ui.verticalScale(8),
  },
  gameType: {
    color: COLORS.secondary,
    fontSize: ui.scaleFont(12, 0.3),
    fontFamily: 'Montserrat-Bold',
    marginRight: ui.spacing(12, 0.35),
    textTransform: 'uppercase',
  },
  textWrapper: {
    paddingHorizontal: ui.spacing(16),
    paddingBottom: ui.verticalScale(12),
  },
  info: {
    marginBottom: ui.verticalScale(8),
  },
  title: {
    fontSize: ui.scaleFont(18, 0.4),
    fontFamily: 'Montserrat-Bold',
    color: COLORS.primary,
    marginBottom: ui.verticalScale(4),
  },
  address: {
    fontSize: ui.scaleFont(14, 0.35),
    fontFamily: 'Lato-Regular',
    color: COLORS.primary,
    opacity: 0.8,
    fontStyle: 'italic',
    marginBottom: ui.verticalScale(8),
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateDay: {
    backgroundColor: COLORS.third,
    paddingVertical: ui.verticalScale(4),
    paddingHorizontal: ui.spacing(12, 0.35),
    borderRadius: ui.moderateScale(8, 0.35),
    marginRight: -ui.spacing(10, 0.35),
    zIndex: 2,
  },
  dateHour: {
    backgroundColor: '#4682B4', // steelblue
    paddingVertical: ui.verticalScale(4),
    paddingHorizontal: ui.spacing(12, 0.35),
    paddingLeft: ui.spacing(20, 0.45),
    borderRadius: ui.moderateScale(8, 0.35),
    zIndex: 1,
  },
  dateText: {
    color: COLORS.primary,
    fontSize: ui.scaleFont(14, 0.35),
    fontFamily: 'Montserrat-Bold',
  },
  description: {
    fontSize: ui.scaleFont(14, 0.35),
    fontFamily: 'Lato-Regular',
    color: COLORS.primary,
    opacity: 0.9,
  },
  additionalInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.secondary,
    paddingVertical: ui.verticalScale(12),
    paddingHorizontal: ui.spacing(8, 0.35),
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    color: COLORS.primary,
    fontSize: ui.scaleFont(12, 0.3),
    fontFamily: 'Lato-Regular',
    marginLeft: ui.spacing(4, 0.25),
  },
})
