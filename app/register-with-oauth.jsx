import { StyleSheet, Text, View } from 'react-native'
import React, { useEffect } from 'react'
import { COLORS } from '../constants/colors'
import { useResponsiveScale } from '../assets/utils/scaleUI.UX'

const RegisterWithOAuth = () => {
  const ui = useResponsiveScale()
  const styles = createStyles(ui)

  useEffect(() => {
    console.log('[RegisterWithOAuth] MOUNTED')
    return () => console.log('[RegisterWithOAuth] UNMOUNTED')
  }, [])

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rejestracja Google</Text>
      <Text style={styles.description}>Dokończ tworzenie konta po logowaniu OAuth.</Text>
    </View>
  )
}

export default RegisterWithOAuth

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
