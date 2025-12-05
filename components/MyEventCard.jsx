import { StyleSheet, Text, View, TouchableOpacity } from 'react-native'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { COLORS } from '../constants/colors'
import { getGameTypeIcon } from '../assets/utils/gameTypeIcons'

const MyEventCard = ({ event, status, onPress, showNotification = false }) => {
  if (!event) return null

  const icon = getGameTypeIcon(event.gameType)

  // Kolory w zależności od statusu
  const getStatusColor = () => {
    switch (status) {
      case 'owner':
        return '#931f1d' // czerwony
      case 'accepted':
        return '#0082ce' // niebieski
      case 'interested':
        return COLORS.third // zielony
      case 'rejected':
        return '#4b4b4b' // szary
      case 'finished':
      case 'completed':
        return '#d6e5e3' // jasny
      case 'cancelled':
        return '#4b4b4b' // szary
      default:
        return COLORS.backgroundSecondary
    }
  }

  const getStatusLabel = () => {
    switch (status) {
      case 'owner':
        return 'Twoje wydarzenie'
      case 'accepted':
        return 'Zaakceptowany'
      case 'interested':
        return 'Zainteresowany'
      case 'rejected':
        return 'Odrzucony'
      case 'finished':
        return 'Zakończone'
      case 'completed':
        return 'Zakończone'
      case 'cancelled':
        return 'Anulowane'
      default:
        return ''
    }
  }

  const isDisabled = [
    'rejected',
    'finished',
    'completed',
    'cancelled',
  ].includes(status)

  return (
    <TouchableOpacity
      style={[styles.card, { opacity: isDisabled ? 0.6 : 1 }]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={isDisabled}
    >
      {/* Status badge */}
      <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
        <Text
          style={[
            styles.statusText,
            {
              color:
                status === 'finished' || status === 'completed'
                  ? COLORS.background
                  : COLORS.primary,
            },
          ]}
        >
          {getStatusLabel()}
        </Text>
      </View>

      {/* Notification badge */}
      {showNotification && (
        <View style={styles.notificationBadge}>
          <Text style={styles.notificationText}>New</Text>
        </View>
      )}

      <View style={styles.content}>
        {/* Ikona i typ gry */}
        <View style={styles.iconWrapper}>
          <Text style={styles.gameType}>{event.gameType?.toUpperCase()}</Text>
          {icon}
        </View>

        {/* Informacje */}
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
      </View>

      {/* Dodatkowe informacje */}
      <View style={styles.footer}>
        <View style={styles.footerItem}>
          <Ionicons name='time' size={14} color={COLORS.secondary} />
          <Text style={styles.footerText}>{event.duration} min</Text>
        </View>
        <View style={styles.footerItem}>
          <MaterialCommunityIcons
            name='cash'
            size={14}
            color={COLORS.secondary}
          />
          <Text style={styles.footerText}>{event.price}zł</Text>
        </View>
        <View style={styles.footerItem}>
          <Ionicons name='people' size={14} color={COLORS.secondary} />
          <Text style={styles.footerText}>{event.playerCount}</Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}

export default MyEventCard

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  statusBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 12,
    zIndex: 10,
  },
  statusText: {
    fontSize: 11,
    fontFamily: 'Montserrat-Bold',
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'red',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    zIndex: 10,
  },
  notificationText: {
    fontSize: 10,
    fontFamily: 'Montserrat-Bold',
    color: COLORS.white,
  },
  content: {
    padding: 16,
    paddingTop: 12,
  },
  iconWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  gameType: {
    fontSize: 11,
    fontFamily: 'Montserrat-Bold',
    color: COLORS.secondary,
    marginRight: 12,
  },
  info: {
    marginTop: 4,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Montserrat-Bold',
    color: COLORS.primary,
    marginBottom: 4,
    paddingRight: 100, // Miejsce na status badge
  },
  address: {
    fontSize: 13,
    fontFamily: 'Lato-Regular',
    color: COLORS.primary,
    opacity: 0.7,
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
    paddingHorizontal: 10,
    borderRadius: 6,
    marginRight: -8,
    zIndex: 2,
  },
  dateHour: {
    backgroundColor: '#4682B4',
    paddingVertical: 4,
    paddingHorizontal: 10,
    paddingLeft: 16,
    borderRadius: 6,
    zIndex: 1,
  },
  dateText: {
    fontSize: 12,
    fontFamily: 'Montserrat-Bold',
    color: COLORS.primary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.secondary,
    paddingVertical: 10,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    fontFamily: 'Lato-Regular',
    color: COLORS.primary,
    marginLeft: 4,
  },
})
