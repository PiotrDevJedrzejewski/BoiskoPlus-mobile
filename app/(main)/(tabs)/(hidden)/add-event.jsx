import { StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '../../../../constants/colors'
import FormEvent from '../../../../components/FormEvent'

const AddEvent = () => {
  const handleSubmit = async (eventData) => {
    // W przyszłości: API call
    console.log('Add event:', eventData)
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name='add-circle' size={26} color={COLORS.secondary} />
        <Text style={styles.headerText}>Stwórz Wydarzenie</Text>
      </View>

      {/* Formularz */}
      <FormEvent mode='add' onSubmit={handleSubmit} />
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
