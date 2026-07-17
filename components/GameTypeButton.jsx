import react from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { getGameTypeIcon } from '../assets/utils/gameTypeIcons'

import { useThemedStyles } from '../context/themeStore'
import { SPACING, BORDER_RADIUS } from '../Theme/StyleConstants'
import { scale, verticalScale, moderateScale, scaleFont } from '../Theme/ScalableStyles'

const GameTypeButton = ({ title, value, isSelected, pressHandler }) => {

  const { styles, colors } = useThemedStyles(createStyles)

  return (
    <Pressable
      onPress={pressHandler}
      style={styles.btn}
    >
      {getGameTypeIcon(value, 30, isSelected ? colors.PrimaryGreen : colors.neutralText)}
      <Text
        style={[styles.btnText, isSelected && styles.selectedBtnText]}>{title}</Text>
    </Pressable>
  );
};

export default GameTypeButton;

const createStyles = (colors) =>
  StyleSheet.create({
    btn: {
      paddingVertical: SPACING.sm,
      paddingHorizontal: SPACING.xs,
      borderRadius: BORDER_RADIUS.md,
      backgroundColor: colors.neutralButton,
      backgroundColor: colors.primaryCard,
      alignItems: 'center',
      justifyContent: 'flex-start',
      width: "23%",
      borderWidth: 1,
      borderColor: colors.border,

    },
    selectedBtnText: {
      color: colors.PrimaryGreen,
    },
    btnText: {
      fontSize: scaleFont(14, 0.3),
      fontFamily: 'Montserrat-Medium',
      color: colors.primaryText,
      marginTop: SPACING.xs,
      flexShrink: 1,
      textAlign: 'center',
    }
  })
