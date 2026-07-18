import { StyleSheet, Text, View } from 'react-native'
import { useThemedStyles } from '../../context/themeStore'
import { SPACING } from '../../Theme/StyleConstants'
import { verticalScale, scaleFont } from '../../Theme/ScalableStyles'

const SettingSection = ({ title, children }) => {
  const { styles } = useThemedStyles(createStyles)

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  )
}

export default SettingSection

const createStyles = (colors) => StyleSheet.create({
  section: {
    marginBottom: verticalScale(24),
  },
  sectionTitle: {
    fontSize: scaleFont(14, 0.35),
    fontFamily: 'Montserrat-Bold',
    color: colors.PrimaryGreen,
    textTransform: 'uppercase',
    marginBottom: verticalScale(12),
    marginLeft: SPACING.xs,
  },
})
