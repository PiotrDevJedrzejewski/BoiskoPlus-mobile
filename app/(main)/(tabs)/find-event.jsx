import { StyleSheet, Text, View, ScrollView } from 'react-native'
import { COLORS } from '../../../constants/colors'

const FindEvent = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Szukaj Wydarzeń</Text>
        <Text style={styles.subtitle}>Znajdź grę dla siebie! 🔍</Text>
      </View>
    </ScrollView>
  )
}

export default FindEvent

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
