import { useMemo, useRef, useState, useEffect } from 'react'
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  FlatList,
  Animated,
  Dimensions,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useThemedStyles } from '../../context/themeStore'
import { SPACING, BORDER_RADIUS } from '../../Theme/StyleConstants'
import { scale, verticalScale, moderateScale, scaleFont } from '../../Theme/ScalableStyles'

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const MINUTES = Array.from({ length: 60 }, (_, i) => i)
const pad2 = (v) => String(v).padStart(2, '0')
const PANEL_HEIGHT = Dimensions.get('window').height * 0.55
const ITEM_HEIGHT = 44

const parseTime = (value) => {
  if (!value || !/^\d{1,2}:\d{2}$/.test(value)) return null
  const [h, m] = value.split(':').map(Number)
  if (h < 0 || h > 23 || m < 0 || m > 59) return null
  return { h, m }
}

const getItemLayout = (_, index) => ({
  length: ITEM_HEIGHT,
  offset: ITEM_HEIGHT * index,
  index,
})

const HourPicker = ({ value, onChange, disabled = false }) => {
  const insets = useSafeAreaInsets()
  const { styles, colors } = useThemedStyles(createStyles)
  const parsed = parseTime(value)
  const anim = useRef(new Animated.Value(0)).current
  const isMounted = useRef(true)
  const hourListRef = useRef(null)
  const minuteListRef = useRef(null)

  const [showModal, setShowModal] = useState(false)
  const [tempHour, setTempHour] = useState(parsed?.h ?? 12)
  const [tempMinute, setTempMinute] = useState(parsed?.m ?? 0)

  useEffect(() => {
    return () => {
      isMounted.current = false
    }
  }, [])

  // Auto-scroll to selected values after modal animates in
  useEffect(() => {
    if (!showModal) return
    const timer = setTimeout(() => {
      hourListRef.current?.scrollToIndex({
        index: tempHour,
        animated: false,
        viewPosition: 0.5,
      })
      minuteListRef.current?.scrollToIndex({
        index: tempMinute,
        animated: false,
        viewPosition: 0.5,
      })
    }, 320)
    return () => clearTimeout(timer)
  }, [showModal])

  const openModal = () => {
    const p = parseTime(value)
    setTempHour(p?.h ?? 12)
    setTempMinute(p?.m ?? 0)
    anim.setValue(0)
    setShowModal(true)
    Animated.timing(anim, {
      toValue: 1,
      duration: 280,
      useNativeDriver: true,
    }).start()
  }

  const close = () => {
    Animated.timing(anim, {
      toValue: 0,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      if (isMounted.current) setShowModal(false)
    })
  }

  const confirm = () => {
    onChange?.(`${pad2(tempHour)}:${pad2(tempMinute)}`)
    close()
  }

  const displayHour = parsed ? pad2(parsed.h) : 'GG'
  const displayMinute = parsed ? pad2(parsed.m) : 'MM'
  const hasValue = parsed !== null

  const renderHour = ({ item }) => (
    <Pressable
      style={[styles.item, tempHour === item && styles.itemSelected]}
      onPress={() => setTempHour(item)}
      android_ripple={{ color: colors.background }}
    >
      <Text style={[styles.itemText, tempHour === item && styles.itemTextSelected]}>
        {pad2(item)}
      </Text>
    </Pressable>
  )

  const renderMinute = ({ item }) => (
    <Pressable
      style={[styles.item, tempMinute === item && styles.itemSelected]}
      onPress={() => setTempMinute(item)}
      android_ripple={{ color: colors.background }}
    >
      <Text style={[styles.itemText, tempMinute === item && styles.itemTextSelected]}>
        {pad2(item)}
      </Text>
    </Pressable>
  )

  return (
    <>
      <Pressable
        style={[styles.trigger, disabled && styles.disabled]}
        onPress={openModal}
        disabled={disabled}
      >
        <View style={styles.timeBox}>
          <Text style={[styles.timeText, !hasValue && styles.timePlaceholder]}>
            {displayHour}
          </Text>
          <Text style={styles.timeLabel}>Godzina</Text>
        </View>
        <View style={styles.timeSeparator}>
          <Text style={styles.timeSeparatorText}>:</Text>
        </View>
        <View style={styles.timeBox}>
          <Text style={[styles.timeText, !hasValue && styles.timePlaceholder]}>
            {displayMinute}
          </Text>
          <Text style={styles.timeLabel}>Minuta</Text>
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
                  <Text style={styles.title}>Wybierz godzinę</Text>
                  <Pressable style={styles.closeBtn} onPress={close} android_ripple={{ color: colors.background }}>
                    <Ionicons name='close' size={moderateScale(22, 0.35)} color={colors.primaryText} />
                  </Pressable>
                </View>

                <View style={styles.columnsContainer}>
                  {/* Hours */}
                  <View style={styles.columnWrapper}>
                    <Text style={styles.columnLabel}>Godzina</Text>
                    <FlatList
                      ref={hourListRef}
                      data={HOURS}
                      keyExtractor={(item) => `h-${item}`}
                      renderItem={renderHour}
                      getItemLayout={getItemLayout}
                      showsVerticalScrollIndicator={false}
                      style={styles.columnList}
                    />
                  </View>

                  <View style={styles.columnDivider} />

                  {/* Minutes */}
                  <View style={styles.columnWrapper}>
                    <Text style={styles.columnLabel}>Minuta</Text>
                    <FlatList
                      ref={minuteListRef}
                      data={MINUTES}
                      keyExtractor={(item) => `m-${item}`}
                      renderItem={renderMinute}
                      getItemLayout={getItemLayout}
                      showsVerticalScrollIndicator={false}
                      style={styles.columnList}
                    />
                  </View>
                </View>

                <View style={[styles.buttonsRow, { paddingBottom: SPACING.md + insets.bottom }]}>
                  <Pressable style={[styles.btn, styles.cancelBtn]} onPress={close}>
                    <Text style={styles.cancelBtnText}>Anuluj</Text>
                  </Pressable>
                  <Pressable style={[styles.btn, styles.confirmBtn]} onPress={confirm}>
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

export default HourPicker

const createStyles = (colors) => StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  disabled: {
    opacity: 0.6,
  },
  timeBox: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  timeText: {
    fontSize: scaleFont(16, 0.35),
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: colors.primaryText,
  },
  timePlaceholder: {
    color: colors.thirdText,
  },
  timeLabel: {
    fontSize: scaleFont(10, 0.25),
    color: colors.thirdText,
    marginTop: SPACING.xs,
  },
  timeSeparator: {
    paddingHorizontal: SPACING.xs,
  },
  timeSeparatorText: {
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
    paddingBottom: 0,
  },
  titleRow: {
    marginBottom: SPACING.md,
    paddingBottom: SPACING.md,
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
    borderRadius: BORDER_RADIUS.sm,
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
