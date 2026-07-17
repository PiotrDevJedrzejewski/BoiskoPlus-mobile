import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'

// Mapowanie typów gier na ikony
export const getGameTypeIcon = (gameType, size = 50, color = "#fff") => {
  switch (gameType) {
    case 'football':
      return <MaterialCommunityIcons name='soccer' size={size} color={color} />
    case 'volleyball':
      return (
        <MaterialCommunityIcons name='volleyball' size={size} color={color} />
      )
    case 'basketball':
      return (
        <MaterialCommunityIcons name='basketball' size={size} color={color} />
      )
    case 'handball':
      return (
        <MaterialCommunityIcons name='handball' size={size} color={color} />
      )
    case 'rugby':
      return <MaterialCommunityIcons name='rugby' size={size} color={color} />
    case 'hockey':
      return (
        <MaterialCommunityIcons
          name='hockey-sticks'
          size={size}
          color={color}
        />
      )
    case 'tennis':
      return <MaterialCommunityIcons name='tennis' size={size} color={color} />
    case 'badminton':
      return (
        <MaterialCommunityIcons name='badminton' size={size} color={color} />
      )
    case 'table tennis':
      return (
        <MaterialCommunityIcons
          name='table-tennis'
          size={size}
          color={color}
        />
      )
    case 'bowling':
      return (
        <MaterialCommunityIcons name='bowling' size={size} color={color} />
      )
    case 'cards':
      return <MaterialCommunityIcons name='cards' size={size} color={color} />
    case 'board games':
      return (
        <MaterialCommunityIcons
          name='chess-knight'
          size={size}
          color={color}
        />
      )
    case 'other':
    default:
      return <Ionicons name='help-circle' size={size} color={color} />
  }
}
