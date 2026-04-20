import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { View, Text, StyleSheet, Modal, AppState, BackHandler, TouchableOpacity, Platform } from 'react-native'
import * as Network from 'expo-network'
import LottieView from 'lottie-react-native'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '../constants/colors'
import { useResponsiveScale } from '../assets/utils/scaleUI.UX'
import spinner from '../assets/utils/spinner.json'

const PING_INTERVAL_MS = 10_000
const PING_TIMEOUT_MS = 8_000

/**
 * NetworkGuard — fullscreen blocking overlay when there's no connection.
 *
 * Checks two things:
 *   1. Device has network (expo-network)
 *   2. Server is reachable (GET ping to /health)
 *
 * Props:
 *   serverUrl  – base URL to ping (defaults to env / fallback)
 *   children   – app tree rendered underneath
 */
const NetworkGuard = ({ serverUrl, children }) => {
  const ui = useResponsiveScale()
  const styles = useMemo(() => createStyles(ui), [ui])

  const [isOffline, setIsOffline] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  // 'no_network' | 'server_unreachable' | 'server_error' | null
  const [offlineReason, setOfflineReason] = useState(null)

  const intervalRef = useRef(null)
  const appStateRef = useRef(AppState.currentState)
  const mountedRef = useRef(true)

  // On Android emulators Network.isInternetReachable can return null/false
  // even when connected — skip that check in __DEV__ mode
  const isEmulator = __DEV__

  const pingUrl = serverUrl || (
    process.env.EXPO_PUBLIC_SERVER_URL ||
    'https://boiskoplus-backend.onrender.com/api/v1'
  )

  // ─── Core check ──────────────────────────────
  const checkConnection = useCallback(async () => {
    try {
      const networkState = await Network.getNetworkStateAsync()
      const { isConnected, isInternetReachable, type } = networkState

      console.log('[NetworkGuard] Network state:', { isConnected, isInternetReachable, type })

      // On emulators isInternetReachable is often null — treat null as unknown and continue
      const definitivelyOffline =
        isConnected === false || (!isEmulator && isInternetReachable === false)

      if (definitivelyOffline) {
        console.log('[NetworkGuard] OFFLINE — no network connection')
        if (mountedRef.current) {
          setOfflineReason('no_network')
          setIsOffline(true)
        }
        return false
      }

      // Device says online (or emulator — unknown) — verify server reachability
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), PING_TIMEOUT_MS)

      try {
        console.log(`[NetworkGuard] Pinging server: ${pingUrl}/health`)
        const res = await fetch(`${pingUrl}/health`, {
          method: 'GET',
          signal: controller.signal,
        })
        clearTimeout(timeoutId)

        console.log(`[NetworkGuard] Server responded: ${res.status}`)

        if (mountedRef.current) {
          if (res.ok) {
            setIsOffline(false)
            setOfflineReason(null)
            setRetryCount(0)
          } else {
            setOfflineReason('server_error')
            setIsOffline(true)
          }
        }
        return res.ok
      } catch (fetchErr) {
        clearTimeout(timeoutId)
        const reason = fetchErr?.name === 'AbortError' ? 'server_unreachable' : 'server_unreachable'
        console.log(`[NetworkGuard] Server unreachable:`, fetchErr?.message)
        if (mountedRef.current) {
          setOfflineReason(reason)
          setIsOffline(true)
        }
        return false
      }
    } catch (err) {
      console.log('[NetworkGuard] Network check error:', err?.message)
      if (mountedRef.current) {
        setOfflineReason('no_network')
        setIsOffline(true)
      }
      return false
    }
  }, [pingUrl, isEmulator])

  // ─── Retry loop (only when offline) ──────────
  useEffect(() => {
    if (!isOffline) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    // Immediate first retry
    checkConnection().then((ok) => {
      if (!ok && mountedRef.current) {
        setRetryCount((c) => c + 1)
      }
    })

    intervalRef.current = setInterval(() => {
      checkConnection().then((ok) => {
        if (!ok && mountedRef.current) {
          setRetryCount((c) => c + 1)
        }
      })
    }, PING_INTERVAL_MS)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isOffline, checkConnection])

  // ─── Initial check + AppState listener ───────
  useEffect(() => {
    mountedRef.current = true
    checkConnection()

    const sub = AppState.addEventListener('change', (next) => {
      const wasBackground =
        appStateRef.current === 'background' || appStateRef.current === 'inactive'
      appStateRef.current = next

      if (wasBackground && next === 'active') {
        checkConnection()
      }
    })

    return () => {
      mountedRef.current = false
      sub.remove()
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [checkConnection])

  return (
    <>
      {children}

      <Modal
        visible={isOffline}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <View style={styles.overlay}>
          <View style={styles.card}>
            <Ionicons
              name="cloud-offline-outline"
              size={ui.moderateScale(64, 0.35)}
              color={COLORS.secondary}
            />

            <Text style={styles.title}>Brak połączenia</Text>
            <Text style={styles.subtitle}>
              Nie można połączyć się z serwerem.{'\n'}
              Sprawdź swoje połączenie internetowe.
            </Text>

            <LottieView
              source={spinner}
              autoPlay
              loop
              style={styles.lottie}
            />

            <Text style={styles.reasonText}>
              {offlineReason === 'no_network' && 'Urządzenie nie ma połączenia z internetem.'}
              {offlineReason === 'server_unreachable' && 'Serwer jest niedostępny lub przekroczono limit czasu.'}
              {offlineReason === 'server_error' && 'Serwer zwrócił błąd — trwa ponowna próba.'}
            </Text>

            <Text style={styles.retryText}>
              Ponawiam próbę połączenia...
              {retryCount > 0 ? ` (${retryCount})` : ''}
            </Text>

            <TouchableOpacity
              style={styles.exitButton}
              onPress={() => BackHandler.exitApp()}
              activeOpacity={0.75}
            >
              <Text style={styles.exitButtonText}>Zamknij aplikację</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  )
}

const createStyles = (ui) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 20, 12, 0.95)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    card: {
      alignItems: 'center',
      paddingHorizontal: ui.moderateScale(32, 0.35),
      paddingVertical: ui.verticalScale(40),
    },
    title: {
      fontFamily: 'Montserrat-Bold',
      fontSize: ui.moderateScale(22, 0.35),
      color: COLORS.primary,
      marginTop: ui.verticalScale(16),
      textAlign: 'center',
    },
    subtitle: {
      fontFamily: 'Montserrat-Regular',
      fontSize: ui.moderateScale(14, 0.35),
      color: COLORS.grayLight,
      marginTop: ui.verticalScale(8),
      textAlign: 'center',
      lineHeight: ui.moderateScale(20, 0.35),
    },
    lottie: {
      width: ui.moderateScale(60, 0.35),
      height: ui.moderateScale(60, 0.35),
      marginTop: ui.verticalScale(24),
    },
    reasonText: {
      fontFamily: 'Montserrat-Regular',
      fontSize: ui.moderateScale(12, 0.35),
      color: COLORS.grayLight,
      marginTop: ui.verticalScale(10),
      textAlign: 'center',
      lineHeight: ui.moderateScale(18, 0.35),
    },
    retryText: {
      fontFamily: 'Montserrat-Regular',
      fontSize: ui.moderateScale(12, 0.35),
      color: COLORS.gray,
      marginTop: ui.verticalScale(12),
    },
    exitButton: {
      marginTop: ui.verticalScale(24),
      borderWidth: 1,
      borderColor: COLORS.secondary,
      borderRadius: ui.moderateScale(8, 0.35),
      paddingHorizontal: ui.moderateScale(28, 0.35),
      paddingVertical: ui.verticalScale(10),
    },
    exitButtonText: {
      fontFamily: 'Montserrat-SemiBold',
      fontSize: ui.moderateScale(13, 0.35),
      color: COLORS.secondary,
    },
  })

export default NetworkGuard
