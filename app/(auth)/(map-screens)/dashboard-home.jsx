import { useCallback, useMemo} from 'react'
import { StyleSheet, Text, View, ScrollView, Pressable } from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { COLORS } from '../../../constants/colors'
import CardDashboard from '../../../components/CardDashboard'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import Entypo from '@expo/vector-icons/Entypo'
import { BlurView } from 'expo-blur'
import { useMap } from '../../../context/MapContext'
import { useResponsiveScale } from '../../../assets/utils/scaleUI.UX'
import { dbg, useDebugMount } from '../../../assets/utils/debugLogger'

const DashboardHome = () => {
  dbg('DashboardHomeScreen')
  useDebugMount('DashboardHomeScreen')
  const router = useRouter()
  const ui = useResponsiveScale()
  const styles = useMemo(() => createStyles(ui), [ui])
  const { setIsInteractive, setOverlayOpacity } = useMap()

  useFocusEffect(
    useCallback(() => {
      setIsInteractive(false)
      setOverlayOpacity(0.3)
    }, []),
  )

  const cardIconSize = ui.moderateScale(50, 0.35)
  const mapIconSize = ui.moderateScale(24, 0.35)

  const handleCardPress = (path) => {
    router.push(path)
  }

  return (
    <View style={styles.container} pointerEvents='box-none'>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <BlurView intensity={4} style={styles.blurView}>
            <View style={styles.titleWrapper}>
              {/* Tytuł */}
              <Text style={styles.title}>Znajdź i stwórz grę zespołową</Text>

              {/* Opis */}
              <Text style={styles.desc}>
                Aplikacja Boisko+ pozwala umawiać się na wspólne uprawianie
                sportów drużynowych.
              </Text>
            </View>
            {/* Karty */}

            <View style={styles.cardWrapper}>
              <CardDashboard
                icon={
                  <Entypo name='location' size={cardIconSize} color={COLORS.secondary} />
                }
                title='Znajdź Grę'
                desc='Przeglądaj dostępne gry i zapisuj się na mecze'
                onPress={() => handleCardPress('/(auth)/(map-screens)/find-event')}
              />
                            <CardDashboard
                icon={
                  <Ionicons
                    name='map-sharp'
                    size={cardIconSize}
                    color={COLORS.secondary}
                  />
                }
                title='Pokaż Mapę'
                desc='Zobacz dostępne boiska i swoje lokalizacje na mapie'
                onPress={() => handleCardPress('/(auth)/(map-screens)/show-map')}                            
              />
              <CardDashboard
                icon={
                  <MaterialCommunityIcons
                    name='pencil'
                    size={cardIconSize}
                    color={COLORS.secondary}
                  />
                }
                title='Stwórz Grę'
                desc='Zaproponuj nową grę i zaproś znajomych'
                onPress={() =>
                  handleCardPress('/(auth)/add-event')
                }
              />
              <CardDashboard
                icon={
                  <Ionicons
                    name='calendar-sharp'
                    size={cardIconSize}
                    color={COLORS.secondary}
                  />
                }
                title='Moje Gry'
                desc='Zarządzaj swoimi grami i sprawdzaj statystyki'
                onPress={() =>
                  handleCardPress(
                    '/(auth)/events-managment/events-dashboard'
                  )
                }
              />

              {/* Przycisk Pokaż Mapę */}
              <Pressable
                style={styles.mapButton}
                 onPress={() =>
                  handleCardPress('/(auth)/settings')
                }
              >
                <Ionicons
                  name='settings-sharp'
                  size={mapIconSize}
                  color={COLORS.secondary}
                  style={styles.mapIcon}
                />
                <Text style={styles.mapButtonText}>Ustawienia</Text>
              </Pressable>
            </View>
          </BlurView>
        </View>
      </ScrollView>
    </View>
  )
}

export default DashboardHome

const createStyles = (ui) => StyleSheet.create({
  container: {
    flex: 1,
    zIndex: 5,
    backgroundColor: 'transparent',
  },
  scrollView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: 'transparent',
  },
  content: {
    padding: ui.spacing(10, 0.35),
    paddingTop: ui.verticalScale(20),
    alignItems: 'center',
  },
  title: {
    fontSize: ui.scaleFont(36, 0.5),
    fontFamily: 'ObjectFont',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: ui.verticalScale(16),
    lineHeight: ui.verticalScale(40),
  },
  desc: {
    fontSize: ui.scaleFont(16, 0.35),
    fontFamily: 'ObjectFont',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: ui.verticalScale(32),
    paddingHorizontal: ui.spacing(10, 0.35),
    opacity: 0.9,
  },
  titleWrapper: {
    borderTopStartRadius: ui.moderateScale(16, 0.35),
    borderTopEndRadius: ui.moderateScale(16, 0.35),
  },
  blurView: {
    paddingTop: ui.verticalScale(20),
    width: '100%',
    borderRadius: ui.moderateScale(16, 0.35),
    overflow: 'hidden',
    backgroundColor: 'rgba(18, 115, 64, 0.7)',
  },
  cardWrapper: {
    width: '100%',
    borderBottomEndRadius: ui.moderateScale(16, 0.35),
    borderBottomStartRadius: ui.moderateScale(16, 0.35),
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    borderBottomEndRadius: ui.moderateScale(16, 0.35),
    borderBottomStartRadius: ui.moderateScale(16, 0.35),
    paddingVertical: ui.verticalScale(16),
    paddingHorizontal: ui.spacing(32, 0.45),
    width: '100%',
    marginTop: ui.verticalScale(8),
  },
  mapIcon: {
    marginRight: ui.spacing(10, 0.35),
  },
  mapButtonText: {
    fontSize: ui.scaleFont(20, 0.4),
    fontFamily: 'Montserrat-Bold',
    color: COLORS.primary,
  },
})
