import { Stack } from 'expo-router'
import { COLORS } from '../../../../constants/colors'

export default function HiddenLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.background,
        },
        headerTintColor: COLORS.primary,
        headerTitleStyle: {
          fontFamily: 'Montserrat-Bold',
        },
        headerShown: false, // Drawer ma swój header
      }}
    />
  )
}
