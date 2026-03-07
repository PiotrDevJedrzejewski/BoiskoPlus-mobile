/**
 * Utility functions for city search and suggestions
 * Adapted for React Native from web version
 */

const normalizedPlacesCache = new WeakMap()

const getNormalizedPlaces = (places) => {
  if (!places || typeof places !== 'object') {
    return []
  }

  const cached = normalizedPlacesCache.get(places)
  if (cached) {
    return cached
  }

  const normalized = Object.entries(places).map(([province, cities]) => ({
    province,
    cities,
    citiesLower: cities.map((city) => city.toLowerCase()),
  }))

  normalizedPlacesCache.set(places, normalized)
  return normalized
}

/**
 * Filtruje podpowiedzi miast na podstawie wpisanego tekstu
 * @param {string} input - Wpisany tekst przez użytkownika
 * @param {Object} places - Obiekt z miejscowościami pogrupowanymi według województw
 * @param {number} minLength - Minimalna długość tekstu do uruchomienia podpowiedzi
 * @param {number} maxResults - Maksymalna liczba zwracanych miast
 * @returns {Array} - Tablica obiektów z województwami i pasującymi miastami
 */
export const filterCitySuggestions = (
  input,
  places,
  minLength = 2,
  maxResults = 30,
) => {
  const normalizedInput = input?.trim().toLowerCase()
  if (!normalizedInput || normalizedInput.length < minLength) {
    return []
  }

  const normalizedPlaces = getNormalizedPlaces(places)
  const result = []
  let totalMatches = 0

  for (const { province, cities, citiesLower } of normalizedPlaces) {
    if (totalMatches >= maxResults) {
      break
    }

    const provinceMatches = []

    for (let i = 0; i < citiesLower.length; i += 1) {
      if (citiesLower[i].startsWith(normalizedInput)) {
        provinceMatches.push(cities[i])
        totalMatches += 1

        if (totalMatches >= maxResults) {
          break
        }
      }
    }

    if (provinceMatches.length > 0) {
      result.push({ province, cities: provinceMatches })
    }
  }

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

  const normalizedInput = cityInput.trim().toLowerCase()
  const normalizedPlaces = getNormalizedPlaces(places)

  // Znajdź wszystkie pasujące województwa
  const matches = normalizedPlaces
    .filter(({ citiesLower }) => citiesLower.includes(normalizedInput))
    .map(({ province }) => province)

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
  const flattened = []

  suggestions.forEach(({ province, cities }) => {
    cities.forEach((city) => {
      flattened.push({
      city,
      province,
      key: `${city}-${province}`,
      })
    })
  })

  return flattened
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
