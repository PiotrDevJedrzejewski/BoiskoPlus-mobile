import { StyleSheet, Text, View } from 'react-native'
import { COLORS } from '../../constants/colors'

const SettingSection = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
)

export default SettingSection

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Montserrat-Bold',
    color: COLORS.secondary,
    textTransform: 'uppercase',
    marginBottom: 12,
    marginLeft: 4,
  },
})
