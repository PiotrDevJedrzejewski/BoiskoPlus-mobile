import { useState } from 'react'
import { View, Text, Image, TouchableOpacity, Alert, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as ImageManipulator from 'expo-image-manipulator'
import * as ImagePicker from 'expo-image-picker'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from '../../assets/utils/firebase'
import { getStorageRefFromUrlOrPath } from '../../assets/utils/firebaseStorage'
import { useThemedStyles } from '../../context/themeStore'
import { SPACING, BORDER_RADIUS } from '../../Theme/StyleConstants'
import { scale, verticalScale, moderateScale, scaleFont } from '../../Theme/ScalableStyles'

const defaultAvatar = require('../../assets/images/defaultAvatar.png')

const ProfileAvatarSection = ({ user, updateProfile, refetchUser }) => {
  const [avatarUploading, setAvatarUploading] = useState(false)
  const { styles, colors } = useThemedStyles(createStyles)

  const avatar = user?.avatarUrl ? { uri: user.avatarUrl } : defaultAvatar
  // Keep user id field robust across legacy payload variants.
  const normalizedUserId = user?.userID || user?._id || user?.id

  const handleChangeAvatar = async () => {
    if (avatarUploading) {
      return
    }

    if (!storage) {
      Alert.alert(
        'Błąd konfiguracji',
        'Firebase Storage nie jest skonfigurowany poprawnie.'
      )
      console.error('[Avatar] Firebase storage instance is missing')
      return
    }

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (permission.status !== 'granted') {
        Alert.alert(
          'Brak uprawnień',
          'Aby zmienić avatar, zezwól aplikacji na dostęp do galerii.'
        )
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      })

      if (result.canceled || !result.assets?.length) {
        return
      }

      setAvatarUploading(true)

      const sourceUri = result.assets[0].uri

      // Keep final output aligned with web version: fixed 200x200 jpg.
      const manipulationContext = ImageManipulator.ImageManipulator.manipulate(
        sourceUri
      )
      manipulationContext.resize({ width: 200, height: 200 })
      const renderedImage = await manipulationContext.renderAsync()
      const manipulatedImage = await renderedImage.saveAsync({
        compress: 0.8,
        format: ImageManipulator.SaveFormat.JPEG,
      })

      const imageResponse = await fetch(manipulatedImage.uri)
      const imageBlob = await imageResponse.blob()

      if (!normalizedUserId) {
        Alert.alert('Błąd', 'Brak identyfikatora użytkownika. Zaloguj się ponownie.')
        console.error('[Avatar] Missing normalized user ID in auth payload')
        return
      }

      const fileName = `avatar_${Date.now()}.jpg`
      const storageRef = ref(storage, `avatars/${normalizedUserId}/${fileName}`)

      await uploadBytes(storageRef, imageBlob, {
        contentType: 'image/jpeg',
      })

      const avatarUrl = await getDownloadURL(storageRef)
      const updateResult = await updateProfile({ avatarUrl })

      if (!updateResult.success) {
        try {
          await deleteObject(storageRef)
        } catch (cleanupError) {
          console.warn('Nie udało się usunąć nowego avatara po błędzie API:', cleanupError)
        }
        Alert.alert('Błąd', updateResult.error || 'Nie udało się zapisać avatara')
        return
      }

      if (!updateResult.user && refetchUser) {
        await refetchUser()
      }

      if (user?.avatarUrl) {
        try {
          const oldAvatarRef = getStorageRefFromUrlOrPath(storage, user.avatarUrl)
          if (oldAvatarRef) {
            await deleteObject(oldAvatarRef)
          }
        } catch (deleteError) {
          console.warn('Nie udało się usunąć poprzedniego avatara:', deleteError)
        }
      }

      Alert.alert('Sukces', 'Avatar został zaktualizowany')
    } catch (error) {
      console.error('Błąd podczas zmiany avatara:', error)
      Alert.alert('Błąd', 'Wystąpił problem podczas aktualizacji avatara.')
    } finally {
      setAvatarUploading(false)
    }
  }

  return (
    <View style={styles.avatarSection}>
      <Image source={avatar} style={styles.avatar} />
      <Text style={styles.avatarHint}>200x200</Text>
      <TouchableOpacity
        style={styles.changeAvatarButton}
        onPress={handleChangeAvatar}
        disabled={avatarUploading}
        activeOpacity={0.8}
      >
        <Ionicons name='camera' size={moderateScale(18, 0.35)} color={colors.background} />
        <Text style={styles.changeAvatarText}>
          {avatarUploading ? 'Zapisywanie...' : 'Zmień Avatar'}
        </Text>
      </TouchableOpacity>
    </View>
  )
}

export default ProfileAvatarSection

const createStyles = (colors) => StyleSheet.create({
  avatarSection: {
    alignItems: 'center',
    marginBottom: verticalScale(20),
  },
  avatar: {
    width: scale(150),
    height: scale(150),
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    borderColor: colors.primaryText,
  },
  avatarHint: {
    fontSize: scaleFont(10, 0.25),
    fontFamily: 'Inter-Regular',
    color: colors.thirdText,
    marginTop: verticalScale(4),
  },
  changeAvatarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.PrimaryGreen,
    paddingVertical: verticalScale(10),
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    marginTop: verticalScale(12),
  },
  changeAvatarText: {
    fontSize: scaleFont(14, 0.35),
    fontFamily: 'BarlowCondensed-Bold',
    color: colors.background,
    marginLeft: SPACING.sm,
  },
})
