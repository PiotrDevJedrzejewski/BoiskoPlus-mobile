import { StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '../../../../constants/colors'
import FormEvent from '../../../../components/FormEvent'
import { useLocalSearchParams } from 'expo-router'

const AddEvent = () => {
  const params = useLocalSearchParams()
  const predefinedPlace = params.predefinedPlace ? JSON.parse(params.predefinedPlace) : null

  return (
    <View style={styles.container} pointerEvents='box-none'>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name='add-circle' size={26} color={COLORS.secondary} />
        <Text style={styles.headerText}>Stwórz Wydarzenie</Text>
      </View>

      {/* Formularz */}
      <FormEvent mode='add' predefinedPlace={predefinedPlace} />
    </View>
  )
}

export default AddEvent

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  headerText: {
    fontSize: 24,
    fontFamily: 'Montserrat-Bold',
    color: COLORS.primary,
    marginLeft: 12,
  },
})
