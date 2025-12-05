import { StyleSheet, Text, View, TouchableOpacity } from 'react-native'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { COLORS } from '../constants/colors'
import { getGameTypeIcon } from '../assets/utils/gameTypeIcons'

const FindEventListElement = ({ event, onPress }) => {
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
          <Ionicons name='time' size={16} color={COLORS.secondary} />
          <Text style={styles.infoText}>{event.duration} min</Text>
        </View>
        <View style={styles.infoItem}>
          <MaterialCommunityIcons
            name='cash'
            size={16}
            color={COLORS.secondary}
          />
          <Text style={styles.infoText}>{event.price}zł</Text>
        </View>
        <View style={styles.infoItem}>
          <MaterialCommunityIcons
            name='gauge'
            size={16}
            color={COLORS.secondary}
          />
          <Text style={styles.infoText}>{event.level}</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name='people' size={16} color={COLORS.secondary} />
          <Text style={styles.infoText}>{event.playerCount}</Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}

export default FindEventListElement

const styles = StyleSheet.create({
  element: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  elementLoading: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 16,
    minHeight: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  loadingText: {
    color: COLORS.secondary,
    fontSize: 14,
    fontFamily: 'Lato-Regular',
  },
  iconWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
  },
  gameType: {
    color: COLORS.secondary,
    fontSize: 12,
    fontFamily: 'Montserrat-Bold',
    marginRight: 12,
    textTransform: 'uppercase',
  },
  textWrapper: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  info: {
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Montserrat-Bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  address: {
    fontSize: 14,
    fontFamily: 'Lato-Regular',
    color: COLORS.primary,
    opacity: 0.8,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateDay: {
    backgroundColor: COLORS.third,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginRight: -10,
    zIndex: 2,
  },
  dateHour: {
    backgroundColor: '#4682B4', // steelblue
    paddingVertical: 4,
    paddingHorizontal: 12,
    paddingLeft: 20,
    borderRadius: 8,
    zIndex: 1,
  },
  dateText: {
    color: COLORS.primary,
    fontSize: 14,
    fontFamily: 'Montserrat-Bold',
  },
  description: {
    fontSize: 14,
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
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    color: COLORS.primary,
    fontSize: 12,
    fontFamily: 'Lato-Regular',
    marginLeft: 4,
  },
})
