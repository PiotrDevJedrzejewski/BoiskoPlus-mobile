import { memo, useMemo } from 'react'
import { StyleSheet, FlatList, View, Text, TouchableOpacity } from 'react-native'
import { COLORS } from '../constants/colors'

const CitySuggestions = ({ suggestions, onSuggestionClick }) => {
  const flatItems = useMemo(() => {
    if (!suggestions || suggestions.length === 0) {
      return []
    }

    const items = []
    suggestions.forEach(({ province, cities }) => {
      if (!cities || cities.length === 0) {
        return
      }

      items.push({
        type: 'header',
        key: `header-${province}`,
        province,
      })

      cities.forEach((city) => {
        items.push({
          type: 'city',
          key: `city-${province}-${city}`,
          province,
          city,
        })
      })
    })

    return items
  }, [suggestions])

  if (!suggestions || suggestions.length === 0) {
    return null
  }

  const renderItem = ({ item }) => {
    if (item.type === 'header') {
      return (
        <View style={styles.provinceHeader}>
          <Text style={styles.provinceText}>{item.province}</Text>
        </View>
      )
    }

    return (
      <TouchableOpacity
        style={styles.suggestionItem}
        onPress={() => onSuggestionClick(item.city, item.province)}
      >
        <Text style={styles.suggestionCity}>{item.city}</Text>
      </TouchableOpacity>
    )
  }

  return (
    <FlatList
      style={styles.suggestionsContainer}
      data={flatItems}
      renderItem={renderItem}
      keyExtractor={(item) => item.key}
      keyboardShouldPersistTaps='handled'
      initialNumToRender={12}
      maxToRenderPerBatch={16}
      windowSize={5}
      removeClippedSubviews
    />
  )
}

export default memo(CitySuggestions)

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
