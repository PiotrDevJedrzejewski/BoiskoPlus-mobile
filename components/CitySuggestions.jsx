import { memo, useMemo } from 'react'
import { StyleSheet, FlatList, View, Text, Pressable } from 'react-native'

import { useThemedStyles } from '../context/themeStore'
import { SPACING, BORDER_RADIUS } from '../Theme/StyleConstants'
import { scale, verticalScale, moderateScale, scaleFont } from '../Theme/ScalableStyles'

const CitySuggestions = ({ suggestions, onSuggestionClick, style }) => {
  const { styles, colors } = useThemedStyles(createStyles)

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
      <Pressable
        style={styles.suggestionItem}
        onPress={() => onSuggestionClick(item.city, item.province)}
      >
        <Text style={styles.suggestionCity}>{item.city}</Text>
      </Pressable>
    )
  }

  return (
    <FlatList
      style={[styles.suggestionsContainer, style]}
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

const createStyles = (colors) =>
  StyleSheet.create({
    suggestionsContainer: {
      maxHeight: verticalScale(300),
      backgroundColor: colors.backgroundSecondary,
      borderWidth: 1,
      borderColor: colors.border,
      marginTop: verticalScale(4),
      marginHorizontal: scale(8),
      borderRadius: BORDER_RADIUS.md,
    },
    provinceHeader: {
      backgroundColor: colors.primaryCard,
      paddingHorizontal: scale(12),
      paddingVertical: verticalScale(6),
    },
    provinceText: {
      color: colors.PrimaryGreen,
      fontSize: scaleFont(14),
      fontWeight: 'bold',
      fontFamily: 'Inter-SemiBold',
    },
    suggestionItem: {
      paddingVertical: verticalScale(8),
      paddingHorizontal: scale(16),
    },
    suggestionCity: {
      fontSize: scaleFont(14),
      color: colors.primaryText,
    },
  })
