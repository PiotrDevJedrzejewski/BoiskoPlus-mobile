import AsyncStorage from '@react-native-async-storage/async-storage'
import ColorsLight from './ColorsLight'
import ColorsDark from './ColorsDark'
import { SPACING, PADDING, MARGIN, BORDER_RADIUS, FONT_SIZE } from './StyleConstants'
import { scale, verticalScale, moderateScale, scaleFont, SCREEN_WIDTH, SCREEN_HEIGHT } from './ScalableStyles'

// Klucz w AsyncStorage, pod którym trzymany jest wybrany tryb motywu.
export const THEME_STORAGE_KEY = 'appTheme'

export const THEME_MODES = {
    LIGHT: 'light',
    DARK: 'dark',
}

const buildTheme = (mode) => {
    const colors = mode === THEME_MODES.LIGHT ? ColorsLight : ColorsDark

    return {
        mode,
        colors,
        spacing: SPACING,
        padding: PADDING,
        margin: MARGIN,
        borderRadius: BORDER_RADIUS,
        fontSize: FONT_SIZE,
        scale,
        verticalScale,
        moderateScale,
        scaleFont,
        screenWidth: SCREEN_WIDTH,
        screenHeight: SCREEN_HEIGHT,
    }
}

// Motyw domyślny (zanim AsyncStorage zdąży odpowiedzieć).
let activeTheme = buildTheme(THEME_MODES.DARK)

// Wywoływane raz, na starcie aplikacji (pierwszy layout).
// Odczytuje zapisany tryb z AsyncStorage i buduje finalny obiekt motywu.
export const loadTheme = async () => {
    let mode = THEME_MODES.DARK

    try {
        const storedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY)

        if (storedMode === THEME_MODES.LIGHT) {
            mode = THEME_MODES.LIGHT
        } else if (storedMode === THEME_MODES.DARK) {
            mode = THEME_MODES.DARK
        }
    } catch (error) {
        mode = THEME_MODES.DARK
    }

    activeTheme = buildTheme(mode)
    return activeTheme
}

// Zmiana motywu w trakcie działania aplikacji (np. z ekranu ustawień).
export const setTheme = async (mode) => {
    const nextMode = mode === THEME_MODES.LIGHT ? THEME_MODES.LIGHT : THEME_MODES.DARK

    activeTheme = buildTheme(nextMode)

    try {
        await AsyncStorage.setItem(THEME_STORAGE_KEY, nextMode)
    } catch (error) {
        // Motyw zostaje zastosowany w pamięci nawet jeśli zapis się nie uda.
    }

    return activeTheme
}

// Synchroniczny dostęp do aktualnie załadowanego motywu.
export const getTheme = () => activeTheme

export default {
    THEME_STORAGE_KEY,
    THEME_MODES,
    loadTheme,
    setTheme,
    getTheme,
}
