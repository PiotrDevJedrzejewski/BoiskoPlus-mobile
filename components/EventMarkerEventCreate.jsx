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
import { useResponsiveScale } from '../assets/utils/scaleUI.UX'

const EventMarkerEventCreate = ({ orlikData, onClose }) => {
  const router = useRouter()
  const ui = useResponsiveScale()
  const styles = createStyles(ui)

  // Obsługa pojedynczego miejsca lub listy miejsc (z klastra)
  const places = Array.isArray(orlikData) ? orlikData : [orlikData]
  const isList = places.length > 1

  const handleCreateEvent = (place) => {
    onClose()
    // Przekazanie całego obiektu orlika jako JSON string
    router.push({
      pathname: '/(main)/(tabs)/(hidden)/add-event',
      params: {
        predefinedPlace: JSON.stringify(place),
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
                    size={ui.moderateScale(32, 0.35)}
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
                  <Ionicons name='add-circle' size={ui.moderateScale(18, 0.35)} color={COLORS.background} />
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

const createStyles = (ui) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
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
    justifyContent: 'center',
    marginRight: ui.spacing(12, 0.35),
    width: ui.moderateScale(44, 0.35),
    height: ui.moderateScale(44, 0.35),
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderRadius: ui.moderateScale(10, 0.35),
  },
  infoSection: {
    flex: 1,
    marginRight: ui.spacing(10, 0.35),
  },
  placeName: {
    fontSize: ui.scaleFont(14, 0.35),
    fontFamily: 'Montserrat-Bold',
    color: COLORS.primary,
    marginBottom: ui.verticalScale(4),
  },
  placeAddress: {
    fontSize: ui.scaleFont(12, 0.3),
    fontFamily: 'Lato-Regular',
    color: COLORS.primary,
    opacity: 0.8,
    lineHeight: ui.verticalScale(16),
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondary,
    paddingHorizontal: ui.spacing(12, 0.35),
    paddingVertical: ui.verticalScale(8),
    borderRadius: ui.moderateScale(8, 0.35),
    gap: ui.spacing(4, 0.25),
  },
  createButtonText: {
    fontSize: ui.scaleFont(12, 0.3),
    fontFamily: 'Montserrat-Bold',
    color: COLORS.background,
  },
  footer: {
    paddingHorizontal: ui.spacing(16),
    paddingVertical: ui.verticalScale(12),
    borderTopWidth: 1,
    borderTopColor: COLORS.third,
    backgroundColor: COLORS.backgroundSecondary,
  },
  footerText: {
    fontSize: ui.scaleFont(11, 0.3),
    fontFamily: 'Lato-Regular',
    color: COLORS.primary,
    opacity: 0.7,
    textAlign: 'center',
  },
})
