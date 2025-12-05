/**
 * Utility functions for city search and suggestions
 * Adapted for React Native from web version
 */

/**
 * Filtruje podpowiedzi miast na podstawie wpisanego tekstu
 * @param {string} input - Wpisany tekst przez użytkownika
 * @param {Object} places - Obiekt z miejscowościami pogrupowanymi według województw
 * @param {number} minLength - Minimalna długość tekstu do uruchomienia podpowiedzi
 * @returns {Array} - Tablica obiektów z województwami i pasującymi miastami
 */
export const filterCitySuggestions = (input, places, minLength = 2) => {
  if (!places || !input || input.length < minLength) {
    return []
  }

  const inputLower = input.toLowerCase()
  const result = Object.entries(places).reduce((acc, [province, cities]) => {
    const filtered = cities.filter((city) =>
      city.toLowerCase().startsWith(inputLower)
    )
    if (filtered.length > 0) {
      return [...acc, { province, cities: filtered }]
    }
    return acc
  }, [])

  return result
}

/**
 * Waliduje wprowadzone miasto i sprawdza czy istnieje w bazie
 * @param {string} cityInput - Wprowadzone miasto
 * @param {string} regionInput - Wprowadzone województwo (opcjonalne)
 * @param {Object} places - Obiekt z miejscowościami pogrupowanymi według województw
 * @returns {Object} - { isValid: boolean, region: string|null, error: string|null }
 */
export const validateCityInput = (cityInput, regionInput, places) => {
  if (!places || !cityInput) {
    return { isValid: true, region: null, error: null }
  }

  // Znajdź wszystkie pasujące województwa
  const matches = Object.entries(places)
    .filter(([, cities]) =>
      cities.some((city) => city.toLowerCase() === cityInput.toLowerCase())
    )
    .map(([province]) => province)

  if (matches.length === 0) {
    return {
      isValid: false,
      region: null,
      error:
        'Podane miasto nie istnieje w bazie. Wybierz miasto z podpowiedzi.',
    }
  }

  if (matches.length > 1) {
    // Jeśli jest więcej niż 1 miasto, ale region został wybrany
    if (regionInput && matches.includes(regionInput)) {
      return { isValid: true, region: regionInput, error: null }
    } else {
      return {
        isValid: false,
        region: null,
        error:
          'Znaleziono więcej niż jedno pasujące miasto. Wybierz miasto z podpowiedzi.',
      }
    }
  }

  // Jeśli jest dokładnie jedno miasto, zwróć jego województwo
  return { isValid: true, region: matches[0], error: null }
}

/**
 * Formatuje podpowiedzi do flat listy (lepsze dla FlatList w RN)
 * @param {Array} suggestions - Tablica podpowiedzi z filterCitySuggestions
 * @returns {Array} - Flat lista obiektów { city, province }
 */
export const flattenSuggestions = (suggestions) => {
  return suggestions.reduce((acc, { province, cities }) => {
    const items = cities.map((city) => ({
      city,
      province,
      key: `${city}-${province}`,
    }))
    return [...acc, ...items]
  }, [])
}

/**
 * Limtuje liczbę podpowiedzi (dla wydajności)
 * @param {Array} suggestions - Tablica podpowiedzi
 * @param {number} limit - Maksymalna liczba podpowiedzi
 * @returns {Array} - Ograniczona tablica podpowiedzi
 */
export const limitSuggestions = (suggestions, limit = 10) => {
  return suggestions.slice(0, limit)
}
