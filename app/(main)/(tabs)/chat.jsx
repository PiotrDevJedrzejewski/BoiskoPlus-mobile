import { StyleSheet, Text, View, ScrollView } from 'react-native'
import { COLORS } from '../../../constants/colors'

const Chat = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Czat</Text>
        <Text style={styles.subtitle}>Wiadomości z innymi graczami 💬</Text>
      </View>
    </ScrollView>
  )
}

export default Chat

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
