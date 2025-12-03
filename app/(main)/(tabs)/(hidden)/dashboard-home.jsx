import { StyleSheet, Text, View, ScrollView } from 'react-native'
import { COLORS } from '../../../../constants/colors'

const DashboardHome = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Dashboard Home</Text>
        <Text style={styles.subtitle}>Witaj w BoiskoPlus! 🎉</Text>
      </View>
    </ScrollView>
  )
}

export default DashboardHome

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
