import { StyleSheet, Text, View, Pressable } from 'react-native'
import { COLORS } from '../constants/colors'

const CardDashboard = ({ icon, title, desc, onPress }) => {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.iconContainer}>{icon}</View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.desc}>{desc}</Text>
      </View>
    </Pressable>
  )
}

export default CardDashboard

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.backgroundSecondary,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 16,
    width: '100%',
    marginBottom: 16,
  },
  iconContainer: {
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Montserrat-Bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  desc: {
    fontSize: 14,
    fontFamily: 'Lato-Regular',
    color: COLORS.primary,
    opacity: 0.7,
  },
})
