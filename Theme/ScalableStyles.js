import { Dimensions, PixelRatio } from 'react-native'

// Wymiary bazowe (punkt odniesienia — standardowy telefon).
const BASE_WIDTH = 375
const BASE_HEIGHT = 812

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

const widthRatio = SCREEN_WIDTH / BASE_WIDTH
const heightRatio = SCREEN_HEIGHT / BASE_HEIGHT

const round = (value) => PixelRatio.roundToNearestPixel(value)

// scale — do szerokości, ikon, elementów poziomych.
export const scale = (size) => round(size * widthRatio)

// verticalScale — do wysokości, marginesów i odstępów pionowych.
export const verticalScale = (size) => round(size * heightRatio)

// moderateScale — łagodniejsze skalowanie, dobre dla większości UI.
export const moderateScale = (size, factor = 0.5) =>
    round(size + (scale(size) - size) * factor)

// scaleFont — skalowanie tekstu, łagodniejsze niż kontenerów.
export const scaleFont = (size, factor = 0.3) =>
    round(size + (scale(size) - size) * factor)

// Złoty podział — asymptotyczny stosunek liczb Fibonacciego.
const GOLDEN_RATIO = 1.618

// fibo — zwraca wartość zmniejszoną o kolejne potęgi złotego podziału.
// fiboStart — wartość bazowa (np. wysokość głównego elementu, RecommendCard).
// level — poziom pomniejszenia: 0 = fiboStart, 1 = fiboStart/1.618, 2 = fiboStart/1.618², itd.
export const fibo = (fiboStart, level = 1) =>
    round(fiboStart / Math.pow(GOLDEN_RATIO, level))


export { SCREEN_WIDTH, SCREEN_HEIGHT }

export default {
    SCREEN_WIDTH,
    SCREEN_HEIGHT,
    scale,
    verticalScale,
    moderateScale,
    scaleFont,
    fibo
}
