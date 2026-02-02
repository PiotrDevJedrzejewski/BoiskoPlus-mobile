import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { COLORS } from '../constants/colors'

const EventMarkerEventCreate = ({ orlikData, onClose }) => {
  const router = useRouter()

  console.log('🟢 [OrlikList] Renderowanie listy. Typ danych:', Array.isArray(orlikData) ? 'array' : 'object')
  console.log('🟢 [OrlikList] Dane:', orlikData)

  // Obsługa pojedynczego miejsca lub listy miejsc (z klastra)
  const places = Array.isArray(orlikData) ? orlikData : [orlikData]
  const isList = places.length > 1

  const handleCreateEvent = (place) => {
    console.log('🟢 [OrlikList] Kliknięto Stwórz dla:', place.properties?.miasto, place.properties?.adres)
    onClose()
    // Przekazanie danych predefiniowanego miejsca do formularza przez params
    router.push({
      pathname: '/(main)/(tabs)/(hidden)/add-event',
      params: {
        predefinedCity: place.properties?.miasto || '',
        predefinedAddress: place.properties?.adres || '',
        predefinedGeolocationSource: place.properties?.geolocation_source || '',
        predefinedLongitude: place.geometry?.coordinates?.[0] || '',
        predefinedLatitude: place.geometry?.coordinates?.[1] || '',
      },
    })
  }

  return (
    <Modal
      visible={true}
      transparent={true}
      animationType='fade'
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {isList ? `Boiska (${places.length})` : 'Boisko'}
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name='close' size={24} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          {/* Lista miejsc */}
          <ScrollView
            style={styles.listWrapper}
            showsVerticalScrollIndicator={false}
          >
            {places.map((place, index) => (
              <View
                key={place.id || index}
                style={styles.item}
              >
                {/* Ikona boiska */}
                <View style={styles.iconSection}>
                  <MaterialCommunityIcons
                    name='soccer-field'
                    size={32}
                    color='#22c55e'
                  />
                </View>

                {/* Informacje o miejscu */}
                <View style={styles.infoSection}>
                  <Text style={styles.placeName} numberOfLines={1}>
                    {place.properties?.miasto || 'Boisko'}
                  </Text>
                  <Text style={styles.placeAddress} numberOfLines={2}>
                    {place.properties?.adres || 'Brak adresu'}
                  </Text>
                </View>

                {/* Przycisk tworzenia eventu */}
                <TouchableOpacity
                  style={styles.createButton}
                  onPress={() => handleCreateEvent(place)}
                  activeOpacity={0.7}
                >
                  <Ionicons name='add-circle' size={18} color={COLORS.background} />
                  <Text style={styles.createButtonText}>Stwórz</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>

          {/* Informacja pomocnicza */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Kliknij "Stwórz" aby utworzyć wydarzenie w wybranym miejscu
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  )
}

export default EventMarkerEventCreate

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
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
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.third,
    backgroundColor: COLORS.backgroundSecondary,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'Montserrat-Bold',
    color: COLORS.primary,
  },
  closeButton: {
    padding: 4,
  },
  listWrapper: {
    padding: 12,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  iconSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    width: 44,
    height: 44,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderRadius: 10,
  },
  infoSection: {
    flex: 1,
    marginRight: 10,
  },
  placeName: {
    fontSize: 14,
    fontFamily: 'Montserrat-Bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  placeAddress: {
    fontSize: 12,
    fontFamily: 'Lato-Regular',
    color: COLORS.primary,
    opacity: 0.8,
    lineHeight: 16,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  createButtonText: {
    fontSize: 12,
    fontFamily: 'Montserrat-Bold',
    color: COLORS.background,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.third,
    backgroundColor: COLORS.backgroundSecondary,
  },
  footerText: {
    fontSize: 11,
    fontFamily: 'Lato-Regular',
    color: COLORS.primary,
    opacity: 0.7,
    textAlign: 'center',
  },
})
