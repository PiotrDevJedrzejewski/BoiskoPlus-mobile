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
// import { getGameTypeIcon } from '../assets/utils/gameTypeIcons'

const EventMarkerEventList = ({ events, onClose }) => {
  const router = useRouter()

  const handleEventPress = (eventId) => {
    onClose();
    // hack - w modalu pushowanie jest w innym stacku, a replace powoduje błąd w single-event, timeout pozwala na zamknięcie modala przed nawigacją
    setTimeout(() => {
      router.push(`/(main)/(tabs)/(hidden)/single-event?id=${eventId}`);
    }, 100);
  }

  // Mniejsza wersja ikony dla listy
  const getSmallGameTypeIcon = (gameType) => {
    const iconMap = {
      football: (
        <MaterialCommunityIcons
          name='soccer'
          size={28}
          color={COLORS.secondary}
        />
      ),
      volleyball: (
        <MaterialCommunityIcons
          name='volleyball'
          size={28}
          color={COLORS.secondary}
        />
      ),
      basketball: (
        <MaterialCommunityIcons
          name='basketball'
          size={28}
          color={COLORS.secondary}
        />
      ),
      handball: (
        <MaterialCommunityIcons
          name='handball'
          size={28}
          color={COLORS.secondary}
        />
      ),
      rugby: (
        <MaterialCommunityIcons
          name='rugby'
          size={28}
          color={COLORS.secondary}
        />
      ),
      hockey: (
        <MaterialCommunityIcons
          name='hockey-sticks'
          size={28}
          color={COLORS.secondary}
        />
      ),
      tennis: (
        <MaterialCommunityIcons
          name='tennis'
          size={28}
          color={COLORS.secondary}
        />
      ),
      badminton: (
        <MaterialCommunityIcons
          name='badminton'
          size={28}
          color={COLORS.secondary}
        />
      ),
      'table tennis': (
        <MaterialCommunityIcons
          name='table-tennis'
          size={28}
          color={COLORS.secondary}
        />
      ),
      bowling: (
        <MaterialCommunityIcons
          name='bowling'
          size={28}
          color={COLORS.secondary}
        />
      ),
      cards: (
        <MaterialCommunityIcons
          name='cards'
          size={28}
          color={COLORS.secondary}
        />
      ),
      'board games': (
        <MaterialCommunityIcons
          name='chess-knight'
          size={28}
          color={COLORS.secondary}
        />
      ),
    }
    return (
      iconMap[gameType] || (
        <Ionicons name='help-circle' size={28} color={COLORS.secondary} />
      )
    )
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
              Wydarzenia ({events?.length || 0})
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name='close' size={24} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          {/* Lista eventów */}
          <ScrollView
            style={styles.listWrapper}
            showsVerticalScrollIndicator={false}
          >
            {events?.map((event, index) => (
              <TouchableOpacity
                key={event._id || event.eventId || index}
                style={styles.item}
                onPress={() => handleEventPress(event._id || event.eventId)}
                activeOpacity={0.7}
              >
                {/* Ikona i typ gry */}
                <View style={styles.iconSection}>
                  {getSmallGameTypeIcon(event.gameType)}
                  <Text style={styles.gameType}>
                    {event.gameType?.toUpperCase()}
                  </Text>
                </View>

                {/* Informacje o evencie */}
                <View style={styles.infoSection}>
                  <Text style={styles.eventName} numberOfLines={1}>
                    {event.eventName}
                  </Text>
                  <View style={styles.detailsRow}>
                    <View style={styles.detailItem}>
                      <MaterialCommunityIcons
                        name='cash'
                        size={14}
                        color={COLORS.secondary}
                      />
                      <Text style={styles.detailText}>{event.price}zł</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Ionicons
                        name='time'
                        size={14}
                        color={COLORS.secondary}
                      />
                      <Text style={styles.detailText}>{event.duration}min</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Ionicons
                        name='people'
                        size={14}
                        color={COLORS.secondary}
                      />
                      <Text style={styles.detailText}>{event.playerCount}</Text>
                    </View>
                  </View>
                </View>

                {/* Strzałka */}
                <Ionicons
                  name='chevron-forward'
                  size={20}
                  color={COLORS.grayLight}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  )
}

export default EventMarkerEventList

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
    marginRight: 12,
    minWidth: 50,
  },
  gameType: {
    fontSize: 8,
    fontFamily: 'Montserrat-Bold',
    color: COLORS.secondary,
    marginTop: 4,
    textAlign: 'center',
  },
  infoSection: {
    flex: 1,
    marginRight: 8,
  },
  eventName: {
    fontSize: 14,
    fontFamily: 'Montserrat-Bold',
    color: COLORS.primary,
    marginBottom: 6,
  },
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    fontFamily: 'Lato-Regular',
    color: COLORS.primary,
    opacity: 0.9,
  },
})
