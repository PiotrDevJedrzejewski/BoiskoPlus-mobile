import { useMemo } from 'react'
import {
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { COLORS } from '../constants/colors'
import { useResponsiveScale } from '../assets/utils/scaleUI.UX'

const ChatMessageBox = ({ message, isOwn, senderName, time }) => {
  const ui = useResponsiveScale()
  const styles = useMemo(() => createStyles(ui), [ui])

  return (
    <View style={[styles.messageBox, isOwn && styles.messageBoxOwn]}>
      <Text style={styles.senderName}>{senderName}</Text>
      <Text style={styles.time}>{time}</Text>
      <Text style={styles.messageText}>{message}</Text>
    </View>
  )
}

export default ChatMessageBox

const createStyles = (ui) => StyleSheet.create({
  messageBox: {
    maxWidth: '75%',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: ui.moderateScale(16, 0.35),
    padding: ui.spacing(12, 0.35),
    marginBottom: ui.verticalScale(10),
    alignSelf: 'flex-start',
  },
  messageBoxOwn: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.third,
  },
  senderName: {
    fontSize: ui.scaleFont(12, 0.3),
    fontFamily: 'Montserrat-Bold',
    color: COLORS.secondary,
    marginBottom: ui.verticalScale(2),
  },
  time: {
    fontSize: ui.scaleFont(10, 0.25),
    fontFamily: 'Lato-Regular',
    color: COLORS.gray,
    marginBottom: ui.verticalScale(4),
  },
  messageText: {
    fontSize: ui.scaleFont(14, 0.35),
    fontFamily: 'Lato-Regular',
    color: COLORS.primary,
  },
})
