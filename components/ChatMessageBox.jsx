import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { COLORS } from '../constants/colors'

const ChatMessageBox = ({ message, isOwn, senderName, time }) => {
  return (
    <View style={[styles.messageBox, isOwn && styles.messageBoxOwn]}>
      <Text style={styles.senderName}>{senderName}</Text>
      <Text style={styles.time}>{time}</Text>
      <Text style={styles.messageText}>{message}</Text>
    </View>
  )
}

export default ChatMessageBox

const styles = StyleSheet.create({
  messageBox: {
    maxWidth: '75%',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  messageBoxOwn: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.third,
  },
  senderName: {
    fontSize: 12,
    fontFamily: 'Montserrat-Bold',
    color: COLORS.secondary,
    marginBottom: 2,
  },
  time: {
    fontSize: 10,
    fontFamily: 'Lato-Regular',
    color: COLORS.gray,
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    fontFamily: 'Lato-Regular',
    color: COLORS.primary,
  },
})
