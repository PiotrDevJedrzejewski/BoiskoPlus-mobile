import { useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { COLORS } from '../../constants/colors'
import { useResponsiveScale } from '../../assets/utils/scaleUI.UX'

const SettingSection = ({ title, children }) => {
  const ui = useResponsiveScale()
  const styles = useMemo(() => createStyles(ui), [ui])

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  )
}

export default SettingSection

const createStyles = (ui) => StyleSheet.create({
  section: {
    marginBottom: ui.verticalScale(24),
  },
  sectionTitle: {
    fontSize: ui.scaleFont(14, 0.35),
    fontFamily: 'Montserrat-Bold',
    color: COLORS.secondary,
    textTransform: 'uppercase',
    marginBottom: ui.verticalScale(12),
    marginLeft: ui.spacing(4, 0.25),
  },
})
