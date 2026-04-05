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
import { COLORS } from '../../constants/colors'
import { useResponsiveScale } from '../../assets/utils/scaleUI.UX'

const PANEL_HEIGHT = Dimensions.get('window').height * 0.65

const CustomTypePickerModal = ({ visible, selectedValue, options, title, iconMap, onSelect, onClose }) => {
  const ui = useResponsiveScale()
  const styles = React.useMemo(() => createStyles(ui), [ui])
  const anim = useRef(new Animated.Value(0)).current
  const isMounted = useRef(true)
  const iconSize = ui.moderateScale(24, 0.35)

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
      return <Ionicons name='apps-outline' size={iconSize} color={COLORS.gray} />
    }
    return React.cloneElement(el, { size: iconSize })
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
              colors={[COLORS.third, COLORS.background]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.panelInner}
            >
              <View style={styles.handle} />
              <Text style={styles.title}>{title}</Text>
              <ScrollView showsVerticalScrollIndicator={false}>
                {options.map((type, index) => (
                  <View key={type.value}>
                    <Pressable
                      style={[
                        styles.item,
                        selectedValue === type.value && styles.itemSelected,
                      ]}
                      onPress={() => handleSelect(type.value)}
                      android_ripple={{ color: COLORS.background }}
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
                          size={ui.moderateScale(20, 0.35)}
                          color={COLORS.secondary}
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

const createStyles = (ui) => StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  panel: {
    height: PANEL_HEIGHT,
    borderTopLeftRadius: ui.moderateScale(20, 0.35),
    borderTopRightRadius: ui.moderateScale(20, 0.35),
    overflow: 'hidden',
  },
  panelInner: {
    flex: 1,
    paddingTop: ui.verticalScale(12),
  },
  handle: {
    width: ui.scale(40),
    height: ui.verticalScale(4),
    borderRadius: ui.moderateScale(2, 0.35),
    backgroundColor: COLORS.primary,
    opacity: 0.4,
    alignSelf: 'center',
    marginBottom: ui.verticalScale(12),
  },
  title: {
    fontSize: ui.scaleFont(18, 0.4),
    fontFamily: 'Montserrat-Bold',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: ui.verticalScale(8),
    paddingBottom: ui.verticalScale(8),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.15)',
    marginHorizontal: ui.spacing(16, 0.35),
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: ui.verticalScale(14),
    paddingHorizontal: ui.spacing(20, 0.45),
  },
  itemSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
  },
  itemIcon: {
    width: ui.moderateScale(32, 0.35),
    alignItems: 'center',
    marginRight: ui.spacing(14, 0.35),
  },
  itemText: {
    flex: 1,
    fontSize: ui.scaleFont(16, 0.35),
    fontFamily: 'Montserrat-Regular',
    color: COLORS.primary,
  },
  itemTextSelected: {
    color: COLORS.secondary,
    fontFamily: 'Montserrat-Bold',
  },
  separator: {
    height: ui.verticalScale(1),
    backgroundColor: COLORS.primary,
    opacity: 0.1,
    marginHorizontal: ui.spacing(16, 0.35),
  },
})
