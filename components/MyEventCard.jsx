import { useState } from 'react'
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { COLORS } from '../constants/colors'
import { getGameTypeIcon } from '../assets/utils/gameTypeIcons'
import { useSocketIo } from '../context/SocketIoContext'
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import Entypo from '@expo/vector-icons/Entypo';




const MyEventCard = ({ event, status, onPress, statusData }) => {
  const { markEventAsRead } = useSocketIo()
  const [isRead, setIsRead] = useState(statusData?.readBy !== false)
  const [isPressed, setIsPressed] = useState(false)

  if (!event) return null

  const icon = getGameTypeIcon(event.gameType)
  const showNotification = statusData && statusData.readBy === false && !isRead

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

  const getStatusIcon = () => {
    switch (status) {
      case 'owner':
        return <FontAwesome5 name="crown" size={40} color='rgba(255, 255, 255, 0.15)' 
        />
      case 'accepted':
        return <FontAwesome name="check" size={40} color='rgba(255, 255, 255, 0.15)' />
      case 'interested':
        return <FontAwesome name="hourglass-2" size={40} color='rgba(255, 255, 255, 0.15)' />
      case 'rejected':
        return <Entypo name="cross" size={40} color='rgba(255, 255, 255, 0.15)' />
      case 'finished':
        return <FontAwesome name="check" size={40} color='rgba(255, 255, 255, 0.15)' />
      case 'completed':
        return <FontAwesome name="check" size={40} color='rgba(255, 255, 255, 0.15)' />
      case 'cancelled':
        return <Entypo name="cross" size={40} color='rgba(255, 255, 255, 0.15)' />
      default:
        return null
    }
  }

  const isDisabled = [
    'rejected',
    'finished',
    'completed',
    'cancelled',
  ].includes(status)

  // Obsługa kliknięcia z oznaczeniem jako przeczytane
  const handlePress = async () => {
    // Oznacz jako przeczytane jeśli readBy jest false
    if (statusData && statusData.readBy === false && !isRead) {
      try {
        await markEventAsRead(event._id)
        setIsRead(true)
      } catch (error) {
        console.error('Błąd podczas oznaczania jako przeczytane:', error)
      }
    }
    // Wywołaj oryginalny onPress
    if (onPress) {
      onPress()
    }
  }

  // Kolory gradientu: normalne i po naciśnięciu
  const gradientColorsNormal = [COLORS.gradientStart, COLORS.gradientEnd]
  const gradientColorsPressed = [COLORS.gradientHoverStart, COLORS.gradientHoverEnd]

  return (
    <TouchableOpacity
      style={[styles.card, { opacity: isDisabled ? 0.6 : 1 }]}
      onPress={handlePress}
      activeOpacity={0.8}
      disabled={isDisabled}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
    >
      <LinearGradient
        colors={isPressed ? gradientColorsPressed : gradientColorsNormal}
        style={styles.container}
      >
        {/* Title */}
        <View style={styles.title}>
          <Text style={styles.titleText}>
            {event.eventName}
          </Text>
        </View>

        {/* Notification badge */}
        {showNotification && (
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationText}>Nowe</Text>
          </View>
        )}

        {/* Owner/Waiting/accepted/denied Icon badge */}
        <View style={styles.iconWrapperStatus}>
          {getStatusIcon()}
        </View>

        <View style={styles.content}>
          {/* Ikona i typ gry */}
          <View style={styles.iconWrapperGameType}>
            {icon}
            <Text style={styles.gameType}>{event.gameType?.toUpperCase()}</Text>
          </View>

          {/* Informacje */}
          <View style={styles.info}>
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
            <Ionicons
              name='speedometer-outline'
              size={14}
              color={COLORS.secondary}
            />
            <Text style={styles.footerText}>{event.level} </Text>
          </View>
          <View style={styles.footerItem}>
            <Ionicons name='people' size={14} color={COLORS.secondary} />
            <Text style={styles.footerText}>{event.playerCount}</Text>
          </View>
        </View>
      </LinearGradient>
      <View style={styles.statusBadgeContainer}>
        <Text style={styles.statusTextLabel}>Twój status: </Text>
        <Text style={styles.statusTextData}>{getStatusLabel()}</Text>
      </View>
    </TouchableOpacity>
  )
}

export default MyEventCard

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  container: {
   borderBottomLeftRadius: 16,
   borderBottomRightRadius: 16,
   flex: 1,
  },
  statusBadgeContainer: {
    height: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginTop: 4,
  },
  statusTextLabel: {
    fontSize: 12,
    fontFamily: 'ObjectFont',
    color: COLORS.gray,
  },
  statusTextData: {
    fontSize: 12,
    fontFamily: 'ObjectFont',
    color: COLORS.primary,
  },
  title: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    justifyContent: 'center',
    // alignItems: 'center',
    marginLeft: 12,

  },
  titleText: {
    fontSize: 18,
    color: COLORS.primary,
    fontFamily: 'ObjectFont',
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 16,
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
    paddingTop: 8,
    width: '70%',
  },
  iconWrapperGameType: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconWrapperStatus: {
    position: 'absolute',
    top: '50%',
    right: 16,
    width: '25%',
    aspectRatio: 1,
    transform: [{ translateY: '-60%' }],
    zIndex: 10,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 6,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    backgroundColor: 'transparent',
  },
  gameType: {
    fontSize: 11,
    fontFamily: 'Montserrat-Bold',
    color: COLORS.secondary,
    marginLeft: 12,
  },
  info: {
    marginTop: 4,
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
