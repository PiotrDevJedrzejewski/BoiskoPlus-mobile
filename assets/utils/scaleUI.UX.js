
import { Dimensions, PixelRatio, Platform } from 'react-native'

// React Native operuje głównie na dp, nie na surowych pikselach urządzenia.
// Dlatego punktem odniesienia nie jest samo 1080x2400 px, tylko rozmiar
// logiczny wynikający z gęstości ekranu emulatora referencyjnego.
const REFERENCE_DEVICE = {
	name: 'Android Medium Phone emulator',
	widthPx: 1080,
	heightPx: 2400,
	densityDpi: 420,
}

const REFERENCE_DENSITY = REFERENCE_DEVICE.densityDpi / 160

// Szerokość i wysokość bazowa w dp.
// To te wartości porównujemy z aktualnym urządzeniem.
export const REFERENCE_WIDTH = REFERENCE_DEVICE.widthPx / REFERENCE_DENSITY
export const REFERENCE_HEIGHT = REFERENCE_DEVICE.heightPx / REFERENCE_DENSITY

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

const round = (value) => PixelRatio.roundToNearestPixel(value)

// Normalizujemy orientację, żeby helper działał stabilnie niezależnie od tego,
// czy telefon jest aktualnie w portrait czy landscape.
const normalizeWindowMetrics = (windowMetrics = Dimensions.get('window')) => {
	const width = Math.min(windowMetrics.width, windowMetrics.height)
	const height = Math.max(windowMetrics.width, windowMetrics.height)

	return {
		width,
		height,
		scale: windowMetrics.scale ?? PixelRatio.get(),
		fontScale: windowMetrics.fontScale ?? PixelRatio.getFontScale(),
	}
}

// Główny generator skali dla bieżącego urządzenia.
// Zwraca zarówno surowe metryki, jak i gotowe funkcje do skalowania.
export const createResponsiveScale = (
	windowMetrics = Dimensions.get('window')
) => {
	const metrics = normalizeWindowMetrics(windowMetrics)
	const widthRatio = metrics.width / REFERENCE_WIDTH
	const heightRatio = metrics.height / REFERENCE_HEIGHT

	// compactRatio jest bezpieczniejszy dla tekstu i odstępów niż czyste widthRatio.
	// Ograniczenie clamp chroni przed zbyt agresywnym zmniejszaniem lub powiększaniem.
	const compactRatio = clamp(Math.min(widthRatio, heightRatio), 0.8, 1.15)

	return {
		...metrics,
		widthRatio,
		heightRatio,
		compactRatio,

		// Prosta flaga pomocnicza przy warunkach typu:
		// isCompactDevice ? mniejszy padding : standardowy padding
		isCompactDevice: metrics.width < 380 || metrics.height < 700,

		// scale:
		// używaj głównie dla szerokości, ikon, poziomych elementów.
		scale: (size) => round(size * widthRatio),

		// verticalScale:
		// używaj dla wysokości, pionowych marginesów i offsetów.
		verticalScale: (size) => round(size * heightRatio),

		// moderateScale:
		// najpraktyczniejszy wybór dla większości UI.
		// Nie skaluje tak agresywnie jak czyste scale.
		moderateScale: (size, factor = 0.5) => {
			const scaledSize = size * widthRatio
			return round(size + (scaledSize - size) * factor)
		},

		// scaleFont:
		// tekst warto skalować łagodniej niż kontenery.
		// W przeciwnym razie na małych telefonach typografia zaczyna "uciekać".
		scaleFont: (size, factor = 0.35) => {
			const scaledSize = size * compactRatio
			return round(size + (scaledSize - size) * factor)
		},

		// spacing:
		// helper semantyczny pod gap, padding i margin.
		// Działa podobnie do scaleFont, ale czytelniej opisuje intencję w kodzie.
		spacing: (size, factor = 0.4) => {
			const scaledSize = size * compactRatio
			return round(size + (scaledSize - size) * factor)
		},

		// Standard pól formularzy oparty o najlepiej czytelny wariant z show-map.
		// Utrzymujemy minimalny baseline, żeby starsze Androidy nie ścinały placeholdera.
		controlMinHeight: round(Math.max(44, 44 * compactRatio)),
		controlRadius: round(Math.max(16, 16 * compactRatio)),
		controlPaddingHorizontal: round(Math.max(12, 12 * compactRatio)),
		controlPaddingVertical: round(Math.max(10, 10 * compactRatio)),
		pickerHeight: round(Math.max(48, 48 * compactRatio)),
		buttonPaddingVertical: round(Math.max(8, 8 * compactRatio)),
	}
}

// Narzędzie diagnostyczne.
// Możesz tymczasowo zrobić console.log(getDeviceProfile()) na fizycznym telefonie
// i od razu zobaczyć, jak bardzo różni się od emulatora referencyjnego.
export const getDeviceProfile = (
	windowMetrics = Dimensions.get('window')
) => {
	const metrics = createResponsiveScale(windowMetrics)

	return {
		platform: Platform.OS,
		referenceDevice: REFERENCE_DEVICE.name,
		width: metrics.width,
		height: metrics.height,
		pixelRatio: metrics.scale,
		fontScale: metrics.fontScale,
		widthRatio: Number(metrics.widthRatio.toFixed(3)),
		heightRatio: Number(metrics.heightRatio.toFixed(3)),
		compactRatio: Number(metrics.compactRatio.toFixed(3)),
		isCompactDevice: metrics.isCompactDevice,
	}
}

// Singleton — obliczany raz przy starcie modułu.
// App jest portrait-only, więc wymiary nigdy się nie zmieniają.
const UI = Object.freeze(createResponsiveScale())

// Wersje funkcyjne delegują do singletona.
export const scale = (size) => UI.scale(size)
export const verticalScale = (size) => UI.verticalScale(size)
export const moderateScale = (size, factor) => UI.moderateScale(size, factor)
export const scaleFont = (size, factor) => UI.scaleFont(size, factor)
export const spacing = (size, factor) => UI.spacing(size, factor)

// Hook zwraca singleton — stabilna referencja, zero obliczeń przy renderze.
export const useResponsiveScale = () => UI

// Krótka ściąga użycia:
// width: scale(220)
// height: verticalScale(50)
// padding: spacing(16)
// borderRadius: moderateScale(20, 0.45)
// fontSize: scaleFont(18)

export default {
	UI,
	REFERENCE_WIDTH,
	REFERENCE_HEIGHT,
	createResponsiveScale,
	getDeviceProfile,
	scale,
	verticalScale,
	moderateScale,
	scaleFont,
	spacing,
	useResponsiveScale,
}
