import { StyleSheet, Text, View, ScrollView } from 'react-native'
import { COLORS } from '../../../../constants/colors'

const Settings = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Ustawienia</Text>
        <Text style={styles.subtitle}>Konfiguracja aplikacji ⚙️</Text>
      </View>
    </ScrollView>
  )
}

export default Settings

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Montserrat-Bold',
    color: COLORS.primary,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Lato-Regular',
    color: COLORS.secondary,
  },
})
