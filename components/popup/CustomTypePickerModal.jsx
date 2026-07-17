import React, { useRef, useEffect } from 'react'
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  Animated,
  Modal,
  Dimensions,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useThemedStyles } from '../../context/themeStore'
import { SPACING, BORDER_RADIUS } from '../../Theme/StyleConstants'
import { moderateScale, scaleFont } from '../../Theme/ScalableStyles'

const PANEL_HEIGHT = Dimensions.get('window').height * 0.65
const ICON_SIZE = moderateScale(24, 0.35)

const CustomTypePickerModal = ({ visible, selectedValue, options, title, iconMap, onSelect, onClose }) => {
  const insets = useSafeAreaInsets()
  const { styles, colors } = useThemedStyles(createStyles)
  const anim = useRef(new Animated.Value(0)).current
  const isMounted = useRef(true)

  useEffect(() => {
    return () => {
      isMounted.current = false
    }
  }, [])

  useEffect(() => {
    if (visible) {
      anim.setValue(0)
      Animated.timing(anim, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }).start()
    }
  }, [visible])

  const close = () => {
    Animated.timing(anim, {
      toValue: 0,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      if (isMounted.current) onClose()
    })
  }

  const handleSelect = (value) => {
    onSelect(value)
    close()
  }

  const renderIcon = (value) => {
    if (!iconMap) return null
    const el = iconMap[value]
    if (!el) {
      return <Ionicons name='apps-outline' size={ICON_SIZE} color={colors.InactiveIcon} />
    }
    return React.cloneElement(el, { size: ICON_SIZE })
  }

  return (
    <Modal
      visible={visible}
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
                <Text style={styles.title}>{title}</Text>
                <Pressable style={styles.closeBtn} onPress={close} android_ripple={{ color: colors.background }}>
                  <Ionicons name='close' size={moderateScale(22, 0.35)} color={colors.primaryText} />
                </Pressable>
              </View>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom }}>
                {options.map((type, index) => (
                  <View key={type.value}>
                    <Pressable
                      style={[
                        styles.item,
                        selectedValue === type.value && styles.itemSelected,
                      ]}
                      onPress={() => handleSelect(type.value)}
                      android_ripple={{ color: colors.background }}
                    >
                      {iconMap && (
                        <View style={styles.itemIcon}>
                          {renderIcon(type.value)}
                        </View>
                      )}
                      <Text
                        style={[
                          styles.itemText,
                          selectedValue === type.value && styles.itemTextSelected,
                        ]}
                      >
                        {type.label}
                      </Text>
                      {selectedValue === type.value && (
                        <Ionicons
                          name='checkmark'
                          size={moderateScale(20, 0.35)}
                          color={colors.PrimaryGreen}
                        />
                      )}
                    </Pressable>
                    {index < options.length - 1 && (
                      <View style={styles.separator} />
                    )}
                  </View>
                ))}
              </ScrollView>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  )
}

export default CustomTypePickerModal

const createStyles = (colors) => StyleSheet.create({
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
    marginBottom: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
  },
  title: {
    fontSize: scaleFont(18, 0.4),
    fontFamily: 'Montserrat-Bold',
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
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },
  itemSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
  },
  itemIcon: {
    width: moderateScale(32, 0.35),
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  itemText: {
    flex: 1,
    fontSize: scaleFont(16, 0.35),
    fontFamily: 'Montserrat-Regular',
    color: colors.primaryText,
  },
  itemTextSelected: {
    color: colors.PrimaryGreen,
    fontFamily: 'Montserrat-Bold',
  },
  separator: {
    height: 1,
    backgroundColor: colors.primaryText,
    opacity: 0.1,
    marginHorizontal: SPACING.md,
  },
})
