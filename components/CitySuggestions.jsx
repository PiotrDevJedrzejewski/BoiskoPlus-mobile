import { memo, useMemo } from 'react'
import { StyleSheet, FlatList, View, Text, TouchableOpacity } from 'react-native'
import { COLORS } from '../constants/colors'
import { useResponsiveScale } from '../assets/utils/scaleUI.UX'

const CitySuggestions = ({ suggestions, onSuggestionClick }) => {
  const ui = useResponsiveScale()
  const styles = createStyles(ui)

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

const createStyles = (ui) => StyleSheet.create({
  suggestionsContainer: {
    maxHeight: ui.verticalScale(300),
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 1,
    borderColor: COLORS.secondary,
    borderRadius: ui.moderateScale(8, 0.35),
    marginTop: ui.verticalScale(4),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  provinceHeader: {
    backgroundColor: COLORS.background,
    paddingHorizontal: ui.spacing(12, 0.35),
    paddingVertical: ui.verticalScale(6),
  },
  provinceText: {
    color: COLORS.secondary,
    fontSize: ui.scaleFont(14, 0.35),
    fontWeight: 'bold',
  },
  suggestionItem: {
    paddingVertical: ui.verticalScale(8),
    paddingHorizontal: ui.spacing(16),
  },
  suggestionCity: {
    fontSize: ui.scaleFont(14, 0.35),
    color: COLORS.primary,
  },
})
