import { Pressable, Text, StyleSheet, Animated, View } from 'react-native'
import { useRef } from 'react'

const Button1 = ({
  text = '',
  height = 80,
  width = 300,
  backgroundColor = '#ffcf00', // $color-secondary
  color = '#003b22', // $color-background
  fontSize = 36,
  lineColor = '#edf9e5', // $color-primary
  padding = 0,
  margin = 0,
  fontFamily = 'Montserrat-Bold',
  weight = 'bold',
  borderRadius = 20,
  children = null,
  ...rest
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current
  const lineScaleAnim = useRef(new Animated.Value(0.2)).current
  const lineOpacityAnim = useRef(new Animated.Value(0)).current
  const pulseAnim = useRef(new Animated.Value(0.7)).current

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.7,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start()
  }

  const stopPulse = () => {
    pulseAnim.stopAnimation(() => {
      pulseAnim.setValue(0.7)
    })
  }

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.95, // jak :active w webie
        useNativeDriver: true,
        friction: 5,
        tension: 200,
      }),
      Animated.timing(lineScaleAnim, {
        toValue: 1, // pasek rozszerza się jak scaleX(1)
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(lineOpacityAnim, {
        toValue: 1, // pasek się pojawia
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      startPulse() // pulsowanie jak @keyframes pulse-line
    })
  }

  const handlePressOut = () => {
    stopPulse()
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 5,
        tension: 200,
      }),
      Animated.timing(lineScaleAnim, {
        toValue: 0.2, // powrót do startowego scaleX(0.2)
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(lineOpacityAnim, {
        toValue: 0, // pasek znika
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start()
  }

  return (
    <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} {...rest}>
      <Animated.View
        style={[
          styles.button,
          {
            height,
            width,
            backgroundColor,
            padding,
            margin,
            borderRadius,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.textWrapper}>
          {children}
          <Text
            style={[
              styles.text,
              {
                color,
                fontSize,
                fontFamily,
                fontWeight: weight,
              },
            ]}
          >
            {text}
          </Text>
        </View>

        <Animated.View
          style={[
            styles.line,
            {
              backgroundColor: lineColor,
              opacity: Animated.multiply(lineOpacityAnim, pulseAnim),
              transform: [{ scaleX: lineScaleAnim }],
            },
          ]}
        />
      </Animated.View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  textWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  line: {
    position: 'absolute',
    bottom: '12%',
    width: '80%',
    height: 4,
    borderRadius: 2,
  },
})

export default Button1
