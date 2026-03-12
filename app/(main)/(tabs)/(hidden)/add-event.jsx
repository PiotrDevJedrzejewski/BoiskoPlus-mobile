import { StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '../../../../constants/colors'
import FormEvent from '../../../../components/FormEvent'
import { useLocalSearchParams } from 'expo-router'
import { useResponsiveScale } from '../../../../assets/utils/scaleUI.UX'

const AddEvent = () => {
  const ui = useResponsiveScale()
  const styles = createStyles(ui)
  const params = useLocalSearchParams()
  const predefinedPlace = params.predefinedPlace ? JSON.parse(params.predefinedPlace) : null

  return (
    <View style={styles.container} pointerEvents='box-none'>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name='add-circle' size={ui.moderateScale(26, 0.35)} color={COLORS.secondary} />
        <Text style={styles.headerText}>Stwórz Wydarzenie</Text>
      </View>

      {/* Formularz */}
      <FormEvent mode='add' predefinedPlace={predefinedPlace} />
    </View>
  )
}

export default AddEvent

const createStyles = (ui) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: ui.verticalScale(20),
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  headerText: {
    fontSize: ui.scaleFont(24, 0.45),
    fontFamily: 'Montserrat-Bold',
    color: COLORS.primary,
    marginLeft: ui.spacing(12, 0.35),
  },
})
