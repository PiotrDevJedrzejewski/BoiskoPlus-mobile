import { StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import FormEvent from '../../components/FormEvent'
import { useLocalSearchParams } from 'expo-router'
import { dbg, useDebugMount } from '../../assets/utils/debugLogger'

import { useThemedStyles } from '../../context/themeStore'
import { SPACING, BORDER_RADIUS } from '../../Theme/StyleConstants'
import { scale, verticalScale, moderateScale, scaleFont } from '../../Theme/ScalableStyles'


const AddEvent = () => {
  dbg('AddEventScreen')
  useDebugMount('AddEventScreen')

  const { styles, colors } = useThemedStyles(createStyles)

  const params = useLocalSearchParams()
  const predefinedPlace = params.predefinedPlace ? JSON.parse(params.predefinedPlace) : null


  return (
    <View style={styles.container} pointerEvents='box-none'>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name='add-circle' size={moderateScale(26, 0.35)} color={colors.PrimaryGreen} />
        <Text style={styles.headerText}>Stwórz Wydarzenie</Text>
      </View>

      {/* Formularz */}
      <FormEvent mode='add' predefinedPlace={predefinedPlace} />
    </View>
  )
}

export default AddEvent

const createStyles = (colors) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  headerText: {
    fontSize: scaleFont(16, 0.45),
    fontFamily: 'Montserrat-Bold',
    color: colors.primaryText,
    marginLeft: SPACING.md,
  },
})
