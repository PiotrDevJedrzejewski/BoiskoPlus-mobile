import { useMemo } from 'react'
import { useRouter, usePathname } from 'expo-router'
import { useAuth } from '../../context/AuthContext'
import Button1 from '../../components/Button1'
import React from 'react'
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { COLORS } from '../../constants/colors'
import FontAwesome6 from '@expo/vector-icons/FontAwesome6'
import { useResponsiveScale } from '../../assets/utils/scaleUI.UX'

const CookiesAndRules = () => {
  const router = useRouter()
  const pathname = usePathname()
  const ui = useResponsiveScale()
  const styles = useMemo(() => createStyles(ui), [ui])
  const {
    needsConsent,
    pendingConsents,
    setRulesAccepted,
    setMarketingAccepted,
    setLocationAccepted,
    saveConsents,
    acceptAllConsents,
  } = useAuth()

  const isReadyToSave = pendingConsents.rulesAccepted
  const isOnIndexScreen = pathname === '/'

  return (
    <Modal visible={needsConsent && isOnIndexScreen} transparent animationType='fade'>
      <View style={styles.modalBackdrop}>
        <LinearGradient
          colors={[COLORS.third, COLORS.background]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 0.75 }}
          style={styles.modalCard}
        >
          <View style={styles.modalHeader}>
            <FontAwesome6
              name='cookie-bite'
              size={ui.moderateScale(24, 0.35)}
              color={COLORS.secondary}
              style={styles.modalIcon}
            />
            <Text style={styles.modalTitle}>Zgody i regulamin</Text>
          </View>
          <Text style={styles.modalDescription}>
            Aby korzystać z aplikacji, zaakceptuj regulamin oraz wybierz zgodę
            na zbieranie informacji marketingowych.
          </Text>

          <View style={styles.modalSection}>
            <Text style={styles.modalSectionTitle}>Regulamin</Text>
            <Pressable
              style={styles.optionRow}
              onPress={() => setRulesAccepted(!pendingConsents.rulesAccepted)}
            >
              <View
                style={[
                  styles.checkbox,
                  pendingConsents.rulesAccepted && styles.checkboxChecked,
                ]}
              />
              <Text style={styles.optionText}>
                *Akceptuję regulamin (wymagane)
              </Text>
            </Pressable>
            <Pressable
              style={styles.optionRow}
              onPress={() =>
                setMarketingAccepted(!pendingConsents.marketingAccepted)
              }
            >
              <View
                style={[
                  styles.checkbox,
                  pendingConsents.marketingAccepted && styles.checkboxChecked,
                ]}
              />
              <Text style={styles.optionText}>
                Akceptuję zbieranie danych marketingowych
              </Text>
            </Pressable>
            <Pressable
              style={styles.optionRow}
              onPress={() =>
                setLocationAccepted(!pendingConsents.locationAccepted)
              }
            >
              <View
                style={[
                  styles.checkbox,
                  pendingConsents.locationAccepted && styles.checkboxChecked,
                ]}
              />
              <Text style={styles.optionText}>
                Akceptuję udostępnianie mojej lokalizacji
              </Text>
            </Pressable>
            <Pressable onPress={() => router.push('/rules')}>
              <Text style={styles.rulesLink}>Zobacz regulamin</Text>
            </Pressable>
          </View>

          <View style={styles.modalButtons}>
            <Button1
              text='Akceptuj wszystko'
              height={ui.moderateScale(46, 0.35)}
              width={ui.scale(220)}
              fontSize={ui.scaleFont(16, 0.35)}
              padding={ui.spacing(12, 0.35)}
              backgroundColor='#ffcf00'
              color='#003b22'
              onPress={acceptAllConsents}
            />
          </View>
          <View style={styles.modalButtons}>
            <Button1
              text='Zapisz wybrane'
              height={ui.moderateScale(46, 0.35)}
              width={ui.scale(220)}
              fontSize={ui.scaleFont(16, 0.35)}
              backgroundColor={isReadyToSave ? '#ffcf00' : '#5b5b5b'}
              color='#003b22'
              onPress={isReadyToSave ? saveConsents : undefined}
            />
            {!pendingConsents.rulesAccepted && (
              <Text style={styles.validationText}>
                Akceptacja regulaminu jest wymagana.
              </Text>
            )}
          </View>
        </LinearGradient>
      </View>
    </Modal>
  )
}

export default CookiesAndRules

const createStyles = (ui) => StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: ui.spacing(20, 0.45),
  },
  modalCard: {
    width: '98%',
    maxWidth: 420,
    borderRadius: ui.moderateScale(18, 0.35),
    padding: ui.spacing(20, 0.45),
    //shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ui.spacing(12, 0.35),
    marginBottom: ui.verticalScale(10),
  },
  modalIcon: {
    fontSize: ui.scaleFont(28, 0.45),
  },
  modalTitle: {
    color: '#ffcf00',
    fontSize: ui.scaleFont(20, 0.4),
    fontFamily: 'ObjectFont',
  },
  modalDescription: {
    color: '#ffffff',
    fontSize: ui.scaleFont(14, 0.35),
    lineHeight: ui.verticalScale(20),
    marginBottom: ui.verticalScale(16),
  },
  modalSection: {
    marginBottom: ui.verticalScale(16),
  },
  modalSectionTitle: {
    color: '#ffcf00',
    fontSize: ui.scaleFont(16, 0.35),
    marginBottom: ui.verticalScale(8),
    fontFamily: 'ObjectFont',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ui.spacing(10, 0.35),
    marginBottom: ui.verticalScale(18),
  },
  checkbox: {
    width: ui.scale(18),
    height: ui.scale(18),
    borderRadius: ui.moderateScale(4, 0.25),
    borderWidth: 1,
    borderColor: '#ffcf00',
  },
  checkboxChecked: {
    backgroundColor: '#ffcf00',
  },
  optionText: {
    color: '#ffffff',
    fontSize: ui.scaleFont(13, 0.35),
  },
  rulesLink: {
    color: '#ffcf00',
    textDecorationLine: 'underline',
    fontSize: ui.scaleFont(13, 0.35),
  },
  choiceRow: {
    flexDirection: 'row',
    gap: 10,
  },
  choiceButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ffcf00',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  choiceButtonActive: {
    backgroundColor: '#ffcf00',
  },
  choiceButtonText: {
    color: '#003b22',
    fontWeight: 'bold',
    fontSize: 13,
  },
  modalButtons: {
    alignItems: 'center',
    gap: ui.spacing(8, 0.35),
    marginBottom: ui.verticalScale(12),
  },
  validationText: {
    color: '#ff9b9b',
    fontSize: ui.scaleFont(12, 0.3),
    textAlign: 'center',
  },
})
