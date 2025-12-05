import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { COLORS } from '../../constants/colors'

// Mapowanie typów gier na ikony
export const gameTypeIcons = {
  football: (
    <MaterialCommunityIcons name='soccer' size={50} color={COLORS.secondary} />
  ),
  volleyball: (
    <MaterialCommunityIcons
      name='volleyball'
      size={50}
      color={COLORS.secondary}
    />
  ),
  basketball: (
    <MaterialCommunityIcons
      name='basketball'
      size={50}
      color={COLORS.secondary}
    />
  ),
  handball: (
    <MaterialCommunityIcons
      name='handball'
      size={50}
      color={COLORS.secondary}
    />
  ),
  rugby: (
    <MaterialCommunityIcons name='rugby' size={50} color={COLORS.secondary} />
  ),
  hockey: (
    <MaterialCommunityIcons
      name='hockey-sticks'
      size={50}
      color={COLORS.secondary}
    />
  ),
  tennis: (
    <MaterialCommunityIcons name='tennis' size={50} color={COLORS.secondary} />
  ),
  badminton: (
    <MaterialCommunityIcons
      name='badminton'
      size={50}
      color={COLORS.secondary}
    />
  ),
  'table tennis': (
    <MaterialCommunityIcons
      name='table-tennis'
      size={50}
      color={COLORS.secondary}
    />
  ),
  bowling: (
    <MaterialCommunityIcons name='bowling' size={50} color={COLORS.secondary} />
  ),
  cards: (
    <MaterialCommunityIcons name='cards' size={50} color={COLORS.secondary} />
  ),
  'board games': (
    <MaterialCommunityIcons
      name='chess-knight'
      size={50}
      color={COLORS.secondary}
    />
  ),
  other: <Ionicons name='help-circle' size={50} color={COLORS.secondary} />,
}

export const getGameTypeIcon = (gameType) => {
  return gameTypeIcons[gameType] || gameTypeIcons.other
}
