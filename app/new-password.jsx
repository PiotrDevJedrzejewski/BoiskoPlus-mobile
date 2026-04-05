import { useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { COLORS } from '../constants/colors'
import { useResponsiveScale } from '../assets/utils/scaleUI.UX'
import { dbg, useDebugMount } from '../assets/utils/debugLogger'

const NewPassword = () => {
  dbg('NewPasswordScreen')
  useDebugMount('NewPasswordScreen')
  const ui = useResponsiveScale()
  const styles = useMemo(() => createStyles(ui), [ui])

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nowe Hasło</Text>
      <Text style={styles.description}>Ekran ustawiania nowego hasła jest przygotowany do dalszego developmentu.</Text>
    </View>
  )
}

export default NewPassword

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
    color: COLORS.primary,
    textAlign: 'center',
  },
  description: {
    marginTop: ui.verticalScale(12),
    fontSize: ui.scaleFont(15, 0.35),
    fontFamily: 'Lato-Regular',
    color: COLORS.gray,
    textAlign: 'center',
  },
})
