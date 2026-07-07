/**
 * =====================================================
 * THEME ZUSTAND STORE
 * =====================================================
 *
 * Cienka warstwa dystrybucyjna nad Theme/index.js (single source of truth).
 * Konsumenci subskrybują TYLKO potrzebny wycinek przez selektory,
 * więc zmiana motywu rerenderuje jedynie ekrany, które faktycznie
 * czytają zmienioną wartość.
 *
 * useThemedStyles() chowa boilerplate (subskrypcja colors + useMemo),
 * żeby 30+ ekranów nie musiało powtarzać tego samego kodu — patrz niżej.
 */

import { useMemo } from 'react'
import { create } from 'zustand'
import { loadTheme, setTheme as persistTheme, getTheme } from '../Theme/index'

export const useThemeStore = create((set) => ({
    theme: getTheme(), // domyślny (dark) motyw — gotowy natychmiast, zanim AsyncStorage odpowie
    isReady: false,

    // Wywoływane raz, na starcie aplikacji (root layout).
    initTheme: async () => {
        const theme = await loadTheme()
        set({ theme, isReady: true })
    },

    // Zmiana motywu w trakcie działania aplikacji (np. ekran ustawień).
    setThemeMode: async (mode) => {
        const theme = await persistTheme(mode)
        set({ theme })
    },
}))

// Gotowe selektory — importuj zamiast pisać `s => s.theme.x` w każdym pliku.
export const selectTheme = (s) => s.theme
export const selectColors = (s) => s.theme.colors
export const selectSpacing = (s) => s.theme.spacing
export const selectPadding = (s) => s.theme.padding
export const selectMargin = (s) => s.theme.margin
export const selectBorderRadius = (s) => s.theme.borderRadius
export const selectFontSize = (s) => s.theme.fontSize
export const selectScaling = (s) => ({
    scale: s.theme.scale,
    verticalScale: s.theme.verticalScale,
    moderateScale: s.theme.moderateScale,
    scaleFont: s.theme.scaleFont,
})

// =====================================================
// useThemedStyles — jedyne miejsce z useMemo w całej appce.
// =====================================================
//
// Użycie w ekranie/komponencie:
//
//   const createStyles = (colors) => StyleSheet.create({ ... })
//   // ^ MUSI być zdefiniowane na poziomie modułu (poza komponentem),
//   //   inaczej referencja zmienia się przy każdym renderze i useMemo nic nie da.
//
//   const MyScreen = () => {
//     const { styles, colors } = useThemedStyles(createStyles)
//     ...
//   }
//
// Przelicza się WYŁĄCZNIE gdy zmieni się referencja `colors`
// (czyli przy realnym przełączeniu light/dark), nie przy każdym renderze.
export const useThemedStyles = (createStyles) => {
    const colors = useThemeStore(selectColors)
    const styles = useMemo(() => createStyles(colors), [colors, createStyles])

    return { styles, colors }
}

