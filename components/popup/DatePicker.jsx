import { useMemo, useRef, useState, useEffect } from 'react'
import { Modal, Pressable, StyleSheet, Text, View, FlatList, Animated, Dimensions } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useThemedStyles } from '../../context/themeStore'
import { SPACING, BORDER_RADIUS } from '../../Theme/StyleConstants'
import { scale, verticalScale, moderateScale, scaleFont } from '../../Theme/ScalableStyles'

const MONTHS = [
  { value: 1, label: 'Sty' },
  { value: 2, label: 'Lut' },
  { value: 3, label: 'Mar' },
  { value: 4, label: 'Kwi' },
  { value: 5, label: 'Maj' },
  { value: 6, label: 'Cze' },
  { value: 7, label: 'Lip' },
  { value: 8, label: 'Sie' },
  { value: 9, label: 'Wrz' },
  { value: 10, label: 'Paź' },
  { value: 11, label: 'Lis' },
  { value: 12, label: 'Gru' },
]

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1)

const PANEL_HEIGHT = Dimensions.get('window').height * 0.6
const ITEM_HEIGHT = 44

const getItemLayout = (_, index) => ({
  length: ITEM_HEIGHT,
  offset: ITEM_HEIGHT * index,
  index,
})

const pad2 = (value) => String(value).padStart(2, '0')

const toDateOnly = (date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate())

const parseIsoDate = (value) => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null
  }

  const [yearStr, monthStr, dayStr] = value.split('-')
  const year = Number(yearStr)
  const month = Number(monthStr)
  const day = Number(dayStr)

  if (!year || !month || !day) {
    return null
  }

  const parsed = new Date(year, month - 1, day)
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() + 1 !== month ||
    parsed.getDate() !== day
  ) {
    return null
  }

  return parsed
}

const toIsoDate = (date) => {
  const year = date.getFullYear()
  const month = pad2(date.getMonth() + 1)
  const day = pad2(date.getDate())
  return `${year}-${month}-${day}`
}

const DatePicker = ({
  value,
  onChange,
  minimumDate,
  maximumDate,
  placeholderDay = 'DD',
  placeholderMonth = 'MM',
  placeholderYear = 'RRRR',
  disabled = false,
}) => {
  const insets = useSafeAreaInsets()

  const { styles, colors } = useThemedStyles(createStyles)

  const parsedValue = parseIsoDate(value)

  const currentYear = new Date().getFullYear()
  const minYear = minimumDate ? minimumDate.getFullYear() : 1900
  const maxYear = maximumDate ? maximumDate.getFullYear() : currentYear
  const years = useMemo(
    () => Array.from({ length: Math.max(1, maxYear - minYear + 1) }, (_, i) => maxYear - i),
    [maxYear, minYear]
  )

  const initialDate = parsedValue || maximumDate || new Date(2000, 0, 1)
  const anim = useRef(new Animated.Value(0)).current
  const isMounted = useRef(true)
  const dayListRef = useRef(null)
  const monthListRef = useRef(null)
  const yearListRef = useRef(null)

  const [showModal, setShowModal] = useState(false)
  const [tempDay, setTempDay] = useState(initialDate.getDate())
  const [tempMonth, setTempMonth] = useState(initialDate.getMonth() + 1)
  const [tempYear, setTempYear] = useState(initialDate.getFullYear())
  const [localError, setLocalError] = useState('')

  useEffect(() => {
    return () => {
      isMounted.current = false
    }
  }, [])

  useEffect(() => {
    if (!showModal) return
    const timer = setTimeout(() => {
      dayListRef.current?.scrollToIndex({ index: tempDay - 1, animated: false, viewPosition: 0.5 })
      monthListRef.current?.scrollToIndex({ index: tempMonth - 1, animated: false, viewPosition: 0.5 })
      const yearIdx = years.indexOf(tempYear)
      if (yearIdx >= 0) {
        yearListRef.current?.scrollToIndex({ index: yearIdx, animated: false, viewPosition: 0.5 })
      }
    }, 320)
    return () => clearTimeout(timer)
  }, [showModal])

  const openDatePicker = () => {
    const sourceDate = parseIsoDate(value) || maximumDate || new Date(2000, 0, 1)
    setTempDay(sourceDate.getDate())
    setTempMonth(sourceDate.getMonth() + 1)
    setTempYear(sourceDate.getFullYear())
    setLocalError('')
    anim.setValue(0)
    setShowModal(true)
    Animated.timing(anim, { toValue: 1, duration: 280, useNativeDriver: true }).start()
  }

  const close = () => {
    setLocalError('')
    Animated.timing(anim, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => {
      if (isMounted.current) setShowModal(false)
    })
  }

  const confirmDate = () => {
    const selected = new Date(tempYear, tempMonth - 1, tempDay)
    if (
      selected.getFullYear() !== tempYear ||
      selected.getMonth() + 1 !== tempMonth ||
      selected.getDate() !== tempDay
    ) {
      setLocalError('Wybierz prawidłową datę')
      return
    }
    const sel = toDateOnly(selected)
    if (minimumDate && sel < toDateOnly(minimumDate)) {
      setLocalError('Wybrana data jest za wcześnie')
      return
    }
    if (maximumDate && sel > toDateOnly(maximumDate)) {
      setLocalError('Wybrana data jest za późna')
      return
    }
    onChange?.(toIsoDate(selected))
    setLocalError('')
    close()
  }

  const selectedDay = parsedValue ? pad2(parsedValue.getDate()) : placeholderDay
  const selectedMonth = parsedValue ? pad2(parsedValue.getMonth() + 1) : placeholderMonth
  const selectedYear = parsedValue ? String(parsedValue.getFullYear()) : placeholderYear
  const hasValue = parsedValue !== null

  const renderDay = ({ item }) => (
    <Pressable
      style={[styles.item, tempDay === item && styles.itemSelected]}
      onPress={() => setTempDay(item)}
      android_ripple={{ color: colors.background }}
    >
      <Text style={[styles.itemText, tempDay === item && styles.itemTextSelected]}>
        {pad2(item)}
      </Text>
    </Pressable>
  )

  const renderMonth = ({ item }) => (
    <Pressable
      style={[styles.item, tempMonth === item.value && styles.itemSelected]}
      onPress={() => setTempMonth(item.value)}
      android_ripple={{ color: colors.background }}
    >
      <Text style={[styles.itemText, tempMonth === item.value && styles.itemTextSelected]}>
        {item.label}
      </Text>
    </Pressable>
  )

  const renderYear = ({ item }) => (
    <Pressable
      style={[styles.item, tempYear === item && styles.itemSelected]}
      onPress={() => setTempYear(item)}
      android_ripple={{ color: colors.background }}
    >
      <Text style={[styles.itemText, tempYear === item && styles.itemTextSelected]}>
        {String(item)}
      </Text>
    </Pressable>
  )

  return (
    <>
      <Pressable
        style={[styles.datePickerContainer, disabled && styles.disabled]}
        onPress={openDatePicker}
        disabled={disabled}
      >
        <View style={styles.dateBox}>
          <Text style={[styles.dateText, !hasValue && styles.datePlaceholder]}>
            {selectedDay}
          </Text>
          <Text style={styles.dateLabel}>Dzień</Text>
        </View>
        <View style={styles.dateSeparator}>
          <Text style={styles.dateSeparatorText}>/</Text>
        </View>
        <View style={styles.dateBox}>
          <Text style={[styles.dateText, !hasValue && styles.datePlaceholder]}>
            {selectedMonth}
          </Text>
          <Text style={styles.dateLabel}>Miesiąc</Text>
        </View>
        <View style={styles.dateSeparator}>
          <Text style={styles.dateSeparatorText}>/</Text>
        </View>
        <View style={styles.dateBox}>
          <Text style={[styles.dateText, !hasValue && styles.datePlaceholder]}>
            {selectedYear}
          </Text>
          <Text style={styles.dateLabel}>Rok</Text>
        </View>
      </Pressable>

      <Modal
        visible={showModal}
        transparent
        animationType='none'
        onRequestClose={close}
        statusBarTranslucent
      >
        <Pressable style={styles.backdrop} onPress={close}>
          <Animated.View
            style={[
              styles.panel,
              {
                transform: [{
                  translateY: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [PANEL_HEIGHT, 0],
                  }),
                }],
              },
            ]}
          >
            <Pressable style={{ flex: 1 }} onPress={() => {}}>
              <LinearGradient
                colors={[colors.thirdText, colors.background]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.panelInner}
              >
                <View style={styles.titleRow}>
                  <Text style={styles.title}>Wybierz datę</Text>
                  <Pressable style={styles.closeBtn} onPress={close} android_ripple={{ color: colors.background }}>
                    <Ionicons name='close' size={24} color={colors.primaryText} />
                  </Pressable>
                </View>

                <View style={styles.columnsContainer}>
                  {/* Dzień */}
                  <View style={styles.columnWrapper}>
                    <Text style={styles.columnLabel}>Dzień</Text>
                    <FlatList
                      ref={dayListRef}
                      data={DAYS}
                      keyExtractor={(item) => `d-${item}`}
                      renderItem={renderDay}
                      getItemLayout={getItemLayout}
                      showsVerticalScrollIndicator={false}
                      style={styles.columnList}
                    />
                  </View>

                  <View style={styles.columnDivider} />

                  {/* Miesiąc */}
                  <View style={[styles.columnWrapper, styles.columnWide]}>
                    <Text style={styles.columnLabel}>Miesiąc</Text>
                    <FlatList
                      ref={monthListRef}
                      data={MONTHS}
                      keyExtractor={(item) => `m-${item.value}`}
                      renderItem={renderMonth}
                      getItemLayout={getItemLayout}
                      showsVerticalScrollIndicator={false}
                      style={styles.columnList}
                    />
                  </View>

                  <View style={styles.columnDivider} />

                  {/* Rok */}
                  <View style={styles.columnWrapper}>
                    <Text style={styles.columnLabel}>Rok</Text>
                    <FlatList
                      ref={yearListRef}
                      data={years}
                      keyExtractor={(item) => `y-${item}`}
                      renderItem={renderYear}
                      getItemLayout={getItemLayout}
                      showsVerticalScrollIndicator={false}
                      style={styles.columnList}
                    />
                  </View>
                </View>

                {!!localError && <Text style={styles.errorText}>{localError}</Text>}

                <View style={[styles.buttonsRow, { paddingBottom: insets.bottom + SPACING.md }]}>
                  <Pressable style={[styles.btn, styles.cancelBtn]} onPress={close}>
                    <Text style={styles.cancelBtnText}>Anuluj</Text>
                  </Pressable>
                  <Pressable style={[styles.btn, styles.confirmBtn]} onPress={confirmDate}>
                    <Text style={styles.confirmBtnText}>Potwierdź</Text>
                  </Pressable>
                </View>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>
    </>
  )
}

export default DatePicker

const createStyles = (colors) =>
  StyleSheet.create({
  datePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  disabled: {
    opacity: 0.6,
  },
  dateBox: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateText: {
    fontSize: scaleFont(16, 0.35),
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: colors.primaryText,
  },
  datePlaceholder: {
    color: colors.thirdText,
  },
  dateLabel: {
    fontSize: scaleFont(10, 0.25),
    color: colors.thirdText,
    marginTop: SPACING.xs,
  },
  dateSeparator: {
    paddingHorizontal: SPACING.sm,
  },
  dateSeparatorText: {
    fontSize: scaleFont(25, 0.4),
    color: colors.thirdText,
    fontWeight: '300',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  panel: {
    height: PANEL_HEIGHT,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
  },
  panelInner: {
    flex: 1,
    paddingTop: SPACING.md,
  },
  titleRow: {
    marginBottom: SPACING.sm,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
  },
  title: {
    fontSize: scaleFont(18, 0.4),
    fontFamily: 'BarlowCondensed-ExtraBold',
    color: colors.primaryText,
    textAlign: 'center',
  },
  closeBtn: {
    position: 'absolute',
    right: 8,
    top: 0,
    bottom: 2,
    justifyContent: 'center',
    padding: 4,
  },
  columnsContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  columnWrapper: {
    flex: 1,
  },
  columnWide: {
    flex: 1.4,
  },
  columnLabel: {
    fontSize: scaleFont(13, 0.3),
    fontFamily: 'BarlowCondensed-Bold',
    color: colors.primaryText,
    opacity: 0.7,
    paddingVertical: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    textAlign: 'center',
  },
  columnList: {
    flex: 1,
  },
  columnDivider: {
    width: 1,
    backgroundColor: colors.primaryText,
    opacity: 0.15,
    marginVertical: SPACING.sm,
  },
  item: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
  },
  itemText: {
    fontSize: scaleFont(18, 0.35),
    fontFamily: 'Inter-Regular',
    color: colors.primaryText,
  },
  itemTextSelected: {
    color: colors.PrimaryGreen,
    fontFamily: 'BarlowCondensed-Bold',
    fontSize: scaleFont(20, 0.35),
  },
  errorText: {
    textAlign: 'center',
    fontSize: scaleFont(13, 0.35),
    color: colors.Danger,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
  },
  buttonsRow: {
    flexDirection: 'row',
    padding: SPACING.md,
    gap: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  btn: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: SPACING.sm,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  cancelBtnText: {
    color: colors.primaryText,
    fontFamily: 'BarlowCondensed-Bold',
    fontSize: scaleFont(14, 0.35),
  },
  confirmBtn: {
    backgroundColor: colors.PrimaryGreen,
  },
  confirmBtnText: {
    color: colors.background,
    fontFamily: 'BarlowCondensed-Bold',
    fontSize: scaleFont(14, 0.35),
  },
})
