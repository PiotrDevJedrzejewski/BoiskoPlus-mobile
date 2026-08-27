import {
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useThemedStyles } from '../context/themeStore'
import { SPACING, BORDER_RADIUS } from '../Theme/StyleConstants'
import { verticalScale, moderateScale, scaleFont } from '../Theme/ScalableStyles'

const ChatMessageBox = ({ message, isOwn, senderName, time }) => {
  const { styles, colors } = useThemedStyles(createStyles)

  return (
    <View style={[styles.messageBox, isOwn && styles.messageBoxOwn]}>
      <Text style={styles.senderName}>{senderName}</Text>
      <Text style={styles.time}>{time}</Text>
      <Text style={styles.messageText}>{message}</Text>
    </View>
  )
}

export default ChatMessageBox

const createStyles = (colors) => StyleSheet.create({
  messageBox: {
    maxWidth: '75%',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: verticalScale(10),
    alignSelf: 'flex-start',
  },
  messageBoxOwn: {
    alignSelf: 'flex-end',
    backgroundColor: colors.border,
  },
  senderName: {
    fontSize: scaleFont(12, 0.3),
    fontFamily: 'BarlowCondensed-Bold',
    color: colors.PrimaryGreen,
    marginBottom: verticalScale(2),
  },
  time: {
    fontSize: scaleFont(10, 0.25),
    fontFamily: 'Inter-Regular',
    color: colors.thirdText,
    marginBottom: verticalScale(4),
  },
  messageText: {
    fontSize: scaleFont(14, 0.35),
    fontFamily: 'Inter-Regular',
    color: colors.primaryText,
  },
})
