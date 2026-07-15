import { useRef, useState, useEffect } from 'react'
import {
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
    FlatList,
    Animated,
    Dimensions,
    ScrollView
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useThemedStyles } from '../../context/themeStore'
import { SPACING, BORDER_RADIUS } from '../../Theme/StyleConstants'
import { scaleFont, moderateScale } from '../../Theme/ScalableStyles'
import PlaceCard from '../Cards/PlaceCard'

const PANEL_HEIGHT = Dimensions.get('window').height * 0.75

const PlaceModal = ({ visible = false, closeModal }) => {
    const insets = useSafeAreaInsets()
    const { styles, colors } = useThemedStyles((c) => createStyles(c, insets))


    return (
        <Modal
            visible={visible}
            animationType='none'
            style={styles.modalContainer}
            transparent
        >
            <Pressable style={styles.backdrop} onPress={closeModal}>

            </Pressable>
            <View style={styles.panel}>
                <LinearGradient
                    colors={[colors.backgroundSecondary, colors.background]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={styles.panelInner}
                >
                    <View style={styles.titleRow}>
                        <Text style={styles.title}>Obiekty w okolicy</Text>
                        <Pressable style={styles.closeBtn} onPress={closeModal} android_ripple={{ color: colors.background }}>
                            <Ionicons name='close' size={moderateScale(22)} color={colors.PrimaryGreen} />
                        </Pressable>
                    </View>

                    {/* <FlatList */}
                    <ScrollView>
                        <PlaceCard />
                        <PlaceCard />
                        <PlaceCard />
                        <PlaceCard />
                        <PlaceCard />
                        <PlaceCard />
                        <PlaceCard />
                        <PlaceCard />
                        <PlaceCard />
                        <PlaceCard />
                        <PlaceCard />
                        <PlaceCard />
                        <PlaceCard />
                        <PlaceCard />
                        <PlaceCard />
                        <PlaceCard />
                    </ScrollView>
                </LinearGradient>
            </View>
        </Modal>
    )
}

export default PlaceModal

const createStyles = (colors, insets = { bottom: 0 }) =>
    StyleSheet.create({
        modalContainer: {
            flex: 1,

        },
        backdrop: {
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.55)',
            justifyContent: 'flex-end',

        },
        panel: {
            height: PANEL_HEIGHT,
            borderTopLeftRadius: BORDER_RADIUS.lg,
            borderTopRightRadius: BORDER_RADIUS.lg,
            borderWidth: 1,
            borderColor: colors.border,
            // overflow: 'hidden',
            paddingBottom: insets.bottom,
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
            borderBottomColor: colors.border,
            paddingHorizontal: SPACING.md,
            alignItems: 'center',
        },
        title: {
            fontSize: scaleFont(18),
            fontFamily: 'ObjectFont',
            color: colors.primaryText,
            textAlign: 'center',
        },
        closeBtn: {
            position: 'absolute',
            right: SPACING.md,
            top: 0,
            bottom: 2,
            justifyContent: 'center',
            padding: SPACING.xs,
        },
        list: {
            flex: 1,
        },
        listContent: {
            paddingHorizontal: SPACING.md,
            paddingBottom: SPACING.md + insets.bottom,
        },
    })
