import { StyleSheet, ScrollView, View, Text, TouchableOpacity } from 'react-native'
import { COLORS } from '../constants/colors'

const CitySuggestions = ({ suggestions, onSuggestionClick }) => {
  if (!suggestions || suggestions.length === 0) {
    return null
  }

  return (
    <ScrollView style={styles.suggestionsContainer}>
      {suggestions.map(({ province, cities }) => (
        <View key={province}>
          <View style={styles.provinceHeader}>
            <Text style={styles.provinceText}>{province}</Text>
          </View>
          {cities.map((city) => (
            <TouchableOpacity
              key={city}
              style={styles.suggestionItem}
              onPress={() => onSuggestionClick(city, province)}
            >
              <Text style={styles.suggestionCity}>{city}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </ScrollView>
  )
}

export default CitySuggestions

const styles = StyleSheet.create({
  suggestionsContainer: {
    maxHeight: 300,
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 1,
    borderColor: COLORS.secondary,
    borderRadius: 8,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  provinceHeader: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  provinceText: {
    color: COLORS.secondary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  suggestionItem: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  suggestionCity: {
    fontSize: 14,
    color: COLORS.primary,
  },
})
