import { StyleSheet, Text, View } from 'react-native'
import React from 'react'

const ShowMap = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>ShowMap</Text>
    </View>
  )
}

export default ShowMap

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
  },
})
