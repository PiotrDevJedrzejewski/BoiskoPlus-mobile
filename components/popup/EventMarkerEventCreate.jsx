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
import { verticalScale, moderateScale, scaleFont } from '../../Theme/ScalableStyles'

const EventMarkerEventCreate = ({ orlikData, onClose }) => {
  const router = useRouter()
  const { styles, colors } = useThemedStyles(createStyles)

  // Obsługa pojedynczego miejsca lub listy miejsc (z klastra)
  const places = Array.isArray(orlikData) ? orlikData : [orlikData]
  const isList = places.length > 1

  const handleCreateEvent = (place) => {
    onClose()
    // Przekazanie całego obiektu orlika jako JSON string
    router.push({
      pathname: '/(auth)/add-event',
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
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {isList ? `Boiska (${places.length})` : 'Boisko'}
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name='close' size={24} color={colors.primaryText} />
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
                    size={moderateScale(32, 0.35)}
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
                  <Ionicons name='add-circle' size={moderateScale(18, 0.35)} color={colors.background} />
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
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  )
}

export default EventMarkerEventCreate

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
    justifyContent: 'center',
    marginRight: SPACING.md,
    width: moderateScale(44, 0.35),
    height: moderateScale(44, 0.35),
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderRadius: BORDER_RADIUS.sm,
  },
  infoSection: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  placeName: {
    fontSize: scaleFont(14, 0.35),
    fontFamily: 'Montserrat-Bold',
    color: colors.primaryText,
    marginBottom: verticalScale(4),
  },
  placeAddress: {
    fontSize: scaleFont(12, 0.3),
    fontFamily: 'Lato-Regular',
    color: colors.primaryText,
    opacity: 0.8,
    lineHeight: verticalScale(16),
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.PrimaryGreen,
    paddingHorizontal: SPACING.sm,
    paddingVertical: verticalScale(8),
    borderRadius: BORDER_RADIUS.sm,
    gap: SPACING.xs,
  },
  createButtonText: {
    fontSize: scaleFont(12, 0.3),
    fontFamily: 'Montserrat-Bold',
    color: colors.background,
  },
  footer: {
    paddingHorizontal: SPACING.md,
    paddingVertical: verticalScale(12),
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.backgroundSecondary,
  },
  footerText: {
    fontSize: scaleFont(11, 0.3),
    fontFamily: 'Lato-Regular',
    color: colors.primaryText,
    opacity: 0.7,
    textAlign: 'center',
  },
})
