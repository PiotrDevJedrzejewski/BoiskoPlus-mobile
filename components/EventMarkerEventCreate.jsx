import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from 'react-native'
import { useRouter } from 'expo-router'
import { COLORS } from '../constants/colors'

const EventMarkerEventCreate = ({ orlikData, onClose }) => {
  const router = useRouter()

  const handleCreateEvent = () => {
    // Przekazanie danych predefiniowanego miejsca do formularza przez parametry
    const predefinedPlace = {
      city: orlikData.properties.miasto || '',
      address: orlikData.properties.adres || '',
      geolocation_source: orlikData.properties.geolocation_source || '',
      coordinates: orlikData.geometry.coordinates,
    }

    // Nawigacja do formularza tworzenia eventu z danymi miejsca
    router.push({
      pathname: '/(main)/(hidden)/add-event',
      params: {
        predefinedPlace: JSON.stringify(predefinedPlace),
      },
    })

    onClose()
  }

  return (
    <View style={styles.container}>
      <View style={styles.popup}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>Zamknij</Text>
        </TouchableOpacity>

        <View style={styles.content}>
          <View style={styles.placeInfo}>
            <Text style={styles.placeTitle}>
              {orlikData.properties.miasto || 'Boisko'}
            </Text>
            <Text style={styles.placeAddress}>
              {orlikData.properties.adres || 'Brak adresu'}
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.createButton,
              pressed && styles.createButtonPressed,
            ]}
            onPress={handleCreateEvent}
          >
            <Text style={styles.createButtonText}>Stwórz Wydarzenie</Text>
          </Pressable>
        </View>
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
    marginBottom: 16,
  },
  closeButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontFamily: 'ObjectFont',
    fontWeight: '600',
  },
  content: {
    gap: 16,
  },
  placeInfo: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  placeTitle: {
    fontSize: 18,
    fontFamily: 'ObjectFont',
    color: COLORS.white,
    fontWeight: '700',
    marginBottom: 4,
  },
  placeAddress: {
    fontSize: 14,
    fontFamily: 'ObjectFont',
    color: COLORS.textSecondary || '#aaa',
  },
  createButton: {
    backgroundColor: COLORS.secondary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  createButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  createButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontFamily: 'ObjectFont',
    fontWeight: '700',
  },
})

export default EventMarkerEventCreate
