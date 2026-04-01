import { useState, useRef, useEffect } from 'react'
import { StyleSheet, Text, View, TouchableOpacity, Dimensions } from 'react-native'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { COLORS } from '../constants/colors'
import { getGameTypeIcon } from '../assets/utils/gameTypeIcons'
import { useNotificationsSocket } from '../context/NotificationsSocketContext'
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import Entypo from '@expo/vector-icons/Entypo';
import { useResponsiveScale } from '../assets/utils/scaleUI.UX';



const MyEventCard = ({ event, status, onPress, statusData }) => {
  const ui = useResponsiveScale()
  const styles = createStyles(ui)
  const { markEventAsRead } = useNotificationsSocket()
  const needsMarking = statusData?.readBy === false
  const [isRead, setIsRead] = useState(!needsMarking)
  const [isPressed, setIsPressed] = useState(false)
  const cardRef = useRef(null)
  const hasMarkedRead = useRef(!needsMarking)

  useEffect(() => {
    if (hasMarkedRead.current) return

    const checkAndMark = () => {
      if (hasMarkedRead.current || !cardRef.current) return
      cardRef.current.measureInWindow((x, y, width, height) => {
        const screenH = Dimensions.get('window').height
        if (y + height > 0 && y < screenH) {
          hasMarkedRead.current = true
          setIsRead(true)
          markEventAsRead(event._id).catch(() => {})
        }
      })
    }

    const mountTimeout = setTimeout(checkAndMark, 300)
    const interval = setInterval(() => {
      if (hasMarkedRead.current) {
        clearInterval(interval)
        return
      }
      checkAndMark()
    }, 800)

    return () => {
      clearTimeout(mountTimeout)
      clearInterval(interval)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!event) return null

  const icon = getGameTypeIcon(event.gameType)
  const showNotification = statusData && statusData.readBy === false && !isRead

  const getStatusLabel = () => {
    switch (status) {
      case 'owner':
        return 'Organizator'
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

  const getStatusIcon = () => {
    switch (status) {
      case 'owner':
        return <FontAwesome5 name="crown" size={ui.moderateScale(40, 0.35)} color='rgba(255, 255, 255, 0.15)' 
        />
      case 'accepted':
        return <FontAwesome name="check" size={ui.moderateScale(40, 0.35)} color='rgba(255, 255, 255, 0.15)' />
      case 'interested':
        return <FontAwesome name="hourglass-2" size={ui.moderateScale(40, 0.35)} color='rgba(255, 255, 255, 0.15)' />
      case 'rejected':
        return <Entypo name="cross" size={ui.moderateScale(40, 0.35)} color='rgba(255, 255, 255, 0.15)' />
      case 'finished':
        return <FontAwesome5 name="flag-checkered" size={ui.moderateScale(40, 0.35)} color='rgba(255, 255, 255, 0.15)' />
      case 'completed':
        return <FontAwesome5 name="flag-checkered" size={ui.moderateScale(40, 0.35)} color='rgba(255, 255, 255, 0.15)' />
      case 'cancelled':
        return <Entypo name="cross" size={ui.moderateScale(40, 0.35)} color='rgba(255, 255, 255, 0.15)' />
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

  const handlePress = () => {
    if (onPress) onPress()
  }

  // Kolory gradientu: normalne i po naciśnięciu
  const gradientColorsNormal = [COLORS.gradientStart, COLORS.gradientEnd]
  const gradientColorsPressed = [COLORS.gradientHoverStart, COLORS.gradientHoverEnd]

  return (
    <TouchableOpacity
      ref={cardRef}
      style={[styles.card, { opacity: isDisabled ? 0.6 : 1 }]}
      onPress={handlePress}
      activeOpacity={0.8}
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
            <Ionicons name='time' size={ui.moderateScale(14, 0.3)} color={COLORS.secondary} />
            <Text style={styles.footerText}>{event.duration} min</Text>
          </View>
          <View style={styles.footerItem}>
            <MaterialCommunityIcons
              name='cash'
              size={ui.moderateScale(14, 0.3)}
              color={COLORS.secondary}
            />
            <Text style={styles.footerText}>{event.price}zł</Text>
          </View>
          <View style={styles.footerItem}>
            <Ionicons
              name='speedometer-outline'
              size={ui.moderateScale(14, 0.3)}
              color={COLORS.secondary}
            />
            <Text style={styles.footerText}>{getLevelLabel(event.level)} </Text>
          </View>
          <View style={styles.footerItem}>
           
            <MaterialCommunityIcons
              name='human-cane'
              size={ui.moderateScale(14, 0.3)}
              color={COLORS.secondary}
            />
            <Text style={styles.footerText}>{event.ageRange?.[0] ?? 0} – {event.ageRange?.[1] ?? 100} lat</Text>
          </View>
          <View style={styles.footerItem}>
            <Ionicons name='people' size={ui.moderateScale(14, 0.3)} color={COLORS.secondary} />
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

const createStyles = (ui) => StyleSheet.create({
  card: {
    borderRadius: ui.moderateScale(16, 0.35),
    marginBottom: ui.verticalScale(16),
    overflow: 'hidden',
  },
  container: {
   borderBottomLeftRadius: ui.moderateScale(16, 0.35),
   borderBottomRightRadius: ui.moderateScale(16, 0.35),
   flex: 1,
  },
  statusBadgeContainer: {
    height: ui.verticalScale(30),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ui.spacing(8, 0.35),
    marginTop: ui.verticalScale(4),
    // backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  statusTextLabel: {
    fontSize: ui.scaleFont(12, 0.3),
    fontFamily: 'ObjectFont',
    color: COLORS.gray,
  },
  statusTextData: {
    fontSize: ui.scaleFont(12, 0.3),
    fontFamily: 'ObjectFont',
    color: COLORS.primary,
  },
  title: {
    paddingVertical: ui.verticalScale(8),
    paddingHorizontal: ui.spacing(12, 0.35),
    justifyContent: 'center',
    marginLeft: ui.spacing(12, 0.35),

  },
  titleText: {
    fontSize: ui.scaleFont(18, 0.4),
    color: COLORS.primary,
    fontFamily: 'ObjectFont',
  },
  notificationBadge: {
    position: 'absolute',
    top: ui.verticalScale(8),
    right: ui.spacing(16, 0.35),
    backgroundColor: 'red',
    paddingVertical: ui.verticalScale(4),
    paddingHorizontal: ui.spacing(8, 0.35),
    borderRadius: ui.moderateScale(8, 0.35),
    zIndex: 10,
  },
  notificationText: {
    fontSize: ui.scaleFont(10, 0.25),
    fontFamily: 'Montserrat-Bold',
    color: COLORS.white,
  },
  content: {
    padding: ui.spacing(16),
    paddingTop: ui.verticalScale(8),
    width: '70%',
  },
  iconWrapperGameType: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ui.verticalScale(8),
  },
  iconWrapperStatus: {
    position: 'absolute',
    top: '40%',
    right: ui.spacing(16, 0.35),
    width: '25%',
    aspectRatio: 1,
    marginTop: -ui.scale(36),
    zIndex: 10,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: ui.moderateScale(6, 0.25),
    borderColor: 'rgba(255, 255, 255, 0.15)',
    backgroundColor: 'transparent',
  },
  gameType: {
    fontSize: ui.scaleFont(11, 0.3),
    fontFamily: 'Montserrat-Bold',
    color: COLORS.secondary,
    marginLeft: ui.spacing(12, 0.35),
  },
  info: {
    marginTop: ui.verticalScale(4),
  },
  address: {
    fontSize: ui.scaleFont(13, 0.35),
    fontFamily: 'Lato-Regular',
    color: COLORS.primary,
    opacity: 0.7,
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
    paddingHorizontal: ui.spacing(10, 0.35),
    borderRadius: ui.moderateScale(6, 0.35),
    marginRight: -ui.spacing(8, 0.35),
    zIndex: 2,
  },
  dateHour: {
    backgroundColor: '#4682B4',
    paddingVertical: ui.verticalScale(4),
    paddingHorizontal: ui.spacing(10, 0.35),
    paddingLeft: ui.spacing(16),
    borderRadius: ui.moderateScale(6, 0.35),
    zIndex: 1,
  },
  dateText: {
    fontSize: ui.scaleFont(12, 0.3),
    fontFamily: 'Montserrat-Bold',
    color: COLORS.primary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.secondary,
    paddingVertical: ui.verticalScale(10),
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    fontSize: ui.scaleFont(12, 0.3),
    fontFamily: 'Lato-Regular',
    color: COLORS.primary,
    marginLeft: ui.spacing(4, 0.25),
  },
})
