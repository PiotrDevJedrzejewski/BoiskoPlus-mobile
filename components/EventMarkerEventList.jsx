import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
} from 'react-native'
import { useRouter } from 'expo-router'
import { gameTypeIcons } from '../assets/utils/gameTypeIcons'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '../constants/colors'

const EventMarkerEventList = ({ events, onClose }) => {
  const router = useRouter()

  const handleEventPress = (eventId) => {
    router.push(`/(main)/(hidden)/event/${eventId}`)
    onClose()
  }

  return (
    <View style={styles.container}>
      <View style={styles.popup}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>Zamknij</Text>
        </TouchableOpacity>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
        >
          {events.map((event) => (
            <Pressable
              key={event.eventId || event._id}
              style={({ pressed }) => [
                styles.eventItem,
                pressed && styles.eventItemPressed,
              ]}
              onPress={() => handleEventPress(event._id)}
            >
              <View style={styles.eventHeader}>
                <Text style={styles.gameType}>{event.gameType}</Text>
                <View style={styles.iconContainer}>
                  {gameTypeIcons[event.gameType] ? (
                    React.cloneElement(gameTypeIcons[event.gameType], {
                      size: 40,
                    })
                  ) : (
                    <Ionicons
                      name='help-circle'
                      size={40}
                      color={COLORS.secondary}
                    />
                  )}
                </View>
              </View>

              <Text style={styles.eventName} numberOfLines={2}>
                {event.eventName}
              </Text>

              <View style={styles.eventDetails}>
                <Text style={styles.detailText}>Cena: {event.price} zł</Text>
                <Text style={styles.detailText}>
                  Czas: {event.duration} min
                </Text>
                <Text style={styles.detailText}>
                  Szuka: {event.playerCount} os.
                </Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 1000,
  },
  popup: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 16,
    padding: 16,
    maxHeight: 400,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  closeButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'center',
    marginBottom: 12,
  },
  closeButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontFamily: 'ObjectFont',
    fontWeight: '600',
  },
  scrollView: {
    maxHeight: 320,
  },
  scrollContent: {
    gap: 12,
  },
  eventItem: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  eventItemPressed: {
    backgroundColor: COLORS.primary,
    opacity: 0.8,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  gameType: {
    fontSize: 14,
    fontFamily: 'ObjectFont',
    color: COLORS.secondary,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  iconContainer: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventName: {
    fontSize: 16,
    fontFamily: 'ObjectFont',
    color: COLORS.white,
    fontWeight: '700',
    marginBottom: 8,
  },
  eventDetails: {
    gap: 4,
  },
  detailText: {
    fontSize: 13,
    fontFamily: 'ObjectFont',
    color: COLORS.textSecondary || '#aaa',
  },
})

export default EventMarkerEventList
