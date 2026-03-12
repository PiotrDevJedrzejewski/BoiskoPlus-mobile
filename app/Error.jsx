import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { COLORS } from '../constants/colors'
import { useResponsiveScale } from '../assets/utils/scaleUI.UX'

const Error = () => {
  const ui = useResponsiveScale()
  const styles = createStyles(ui)

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Wystąpił Błąd</Text>
      <Text style={styles.description}>Ten ekran błędu ma już responsywny layout i można go później rozbudować o retry lub powrót.</Text>
    </View>
  )
}

export default Error

const createStyles = (ui) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: ui.spacing(24, 0.45),
  },
  title: {
    fontSize: ui.scaleFont(28, 0.45),
    fontFamily: 'Montserrat-Bold',
    color: COLORS.error,
    textAlign: 'center',
  },
  description: {
    marginTop: ui.verticalScale(12),
    fontSize: ui.scaleFont(15, 0.35),
    fontFamily: 'Lato-Regular',
    color: COLORS.primary,
    textAlign: 'center',
  },
})
