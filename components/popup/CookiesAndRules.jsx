import { useRouter } from 'expo-router'
import { useAuth } from '../../context/AuthContext'
import Button1 from '../../components/Button1'
import React from 'react'
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { COLORS } from '../../constants/colors'
import FontAwesome6 from '@expo/vector-icons/FontAwesome6'

const CookiesAndRules = () => {
  const router = useRouter()
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

  return (
    <Modal visible={needsConsent} transparent animationType='fade'>
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
              size={24}
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
              height={46}
              width={220}
              fontSize={16}
              padding={12}
              backgroundColor='#ffcf00'
              color='#003b22'
              onPress={acceptAllConsents}
            />
          </View>
          <View style={styles.modalButtons}>
            <Button1
              text='Zapisz wybrane'
              height={46}
              width={220}
              fontSize={16}
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

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '98%',
    maxWidth: 420,
    borderRadius: 18,
    padding: 20,
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
    gap: 12,
    marginBottom: 10,
  },
  modalIcon: {
    fontSize: 28,
  },
  modalTitle: {
    color: '#ffcf00',
    fontSize: 20,
    fontFamily: 'ObjectFont',
  },
  modalDescription: {
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  modalSection: {
    marginBottom: 16,
  },
  modalSectionTitle: {
    color: '#ffcf00',
    fontSize: 16,
    marginBottom: 8,
    fontFamily: 'ObjectFont',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 18,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ffcf00',
  },
  checkboxChecked: {
    backgroundColor: '#ffcf00',
  },
  optionText: {
    color: '#ffffff',
    fontSize: 13,
  },
  rulesLink: {
    color: '#ffcf00',
    textDecorationLine: 'underline',
    fontSize: 13,
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
    gap: 8,
    marginBottom: 12,
  },
  validationText: {
    color: '#ff9b9b',
    fontSize: 12,
    textAlign: 'center',
  },
})
