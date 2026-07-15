import { StyleSheet, Text, View, Image } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import Entypo from '@expo/vector-icons/Entypo'

import { useThemedStyles } from '../../context/themeStore'
import { SPACING, BORDER_RADIUS } from '../../Theme/StyleConstants'
import { moderateScale, scaleFont } from '../../Theme/ScalableStyles'

import RecommendCardBG from '../../assets/images/V2/IMG_2313.png'

const EventSimpleCard = ({ date, title, playersCurrent = 0, playersMax = 0, geoDistance = 0 }) => {
    const { styles, colors } = useThemedStyles(createStyles)

    return (
        <View style={styles.event_card}>
            <Image source={RecommendCardBG} style={styles.event_card_backgroundImage} />
            <View style={styles.event_card_content}>
                <Text style={styles.event_card_content_date}>{date}</Text>
                <Text style={styles.event_card_content_title}>{title}</Text>
                <View style={styles.event_card_content_players}>
                    <Ionicons name="person" size={14} color={colors.PrimaryGreen} />
                    <Text style={styles.event_card_content_players_text}>{playersCurrent}/{playersMax} GRACZY</Text>
                </View>
                <View style={styles.event_card_additionalInfo}>
                    <Entypo name="location-pin" size={14} color={colors.PrimaryGreen} />
                    <Text style={styles.event_card_additionalInfo_text}>{geoDistance} KM</Text>
                </View>
            </View>
        </View>
    )
}

export default EventSimpleCard

const createStyles = (colors) =>
    StyleSheet.create({
        event_card: {
            flex: 1,
            position: 'relative',
            overflow: 'hidden',
            height: moderateScale(80),
            borderRadius: BORDER_RADIUS.lg,
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: SPACING.md,
            backgroundColor: colors.secondaryCard,
        },
        event_card_backgroundImage: {
            position: 'absolute',
            height: '100%',
            width: '33%',
            left: 0,
            top: 0,
            resizeMode: 'cover',
            borderRadius: BORDER_RADIUS.lg,
            zIndex: 1,
        },
        event_card_content: {
            flex: 1,
            marginLeft: '33%',
            padding: SPACING.md,
            justifyContent: 'center',
            alignItems: 'flex-start',
        },
        event_card_content_date: {
            fontSize: scaleFont(12),
            color: colors.PrimaryGreen,
        },
        event_card_content_title: {
            fontSize: scaleFont(14),
            color: colors.primaryText,
            fontWeight: 'bold',
        },
        event_card_content_players: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: SPACING.sm,
            marginTop: SPACING.sm,
        },
        event_card_content_players_text: {
            fontSize: scaleFont(12),
            color: colors.secondaryText,
        },
        event_card_additionalInfo: {
            position: 'absolute',
            right: SPACING.md,
            bottom: SPACING.md,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: SPACING.xs,
        },
        event_card_additionalInfo_text: {
            fontSize: scaleFont(12),
            color: colors.secondaryText,
        },
    })
