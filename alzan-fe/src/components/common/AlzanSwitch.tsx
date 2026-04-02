import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  interpolateColor,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { colors } from '../../theme';

interface AlzanSwitchProps {
  value?: boolean;
  onValueChange?: (value: boolean) => void;
  disabled?: boolean;
}

// Modern Proportions
const WIDTH = 56;
const HEIGHT = 34;
const PADDING = 3;
const THUMB_SIZE = 28;

// Physics Config - "Teleport Speed"
const SWITCH_SPRING = {
  mass: 0.2, // Casi sin inercia
  damping: 18, // Freno fuerte al llegar
  stiffness: 600, // Tensión extrema
  overshootClamping: false,
};

const SQUISH_SPRING = {
  mass: 0.1,
  damping: 10,
  stiffness: 800,
};

export const AlzanSwitch: React.FC<AlzanSwitchProps> = ({ value = false, onValueChange, disabled = false }) => {
  const progress = useSharedValue(value ? 1 : 0);
  const touchActive = useSharedValue(0);

  useEffect(() => {
    progress.value = withSpring(value ? 1 : 0, SWITCH_SPRING);
  }, [value]);

  const trackStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(progress.value, [0, 1], ['rgba(120, 120, 128, 0.16)', colors.primary]);
    return {
      backgroundColor,
      opacity: disabled ? 0.5 : 1,
    };
  });

  const glowStyle = useAnimatedStyle(() => {
    const opacity = interpolate(progress.value, [0, 1], [0, 0.4]);
    const scale = interpolate(progress.value, [0, 1], [0.95, 1.1]);

    return {
      opacity,
      transform: [{ scale }],
      backgroundColor: colors.primary,
    };
  });

  const thumbStyle = useAnimatedStyle(() => {
    const maxTranslate = WIDTH - THUMB_SIZE - PADDING * 2;
    const translateX = interpolate(progress.value, [0, 1], [0, maxTranslate]);

    const isMoving = interpolate(progress.value, [0, 0.5, 1], [0, 1, 0]);
    // Less deformation for faster perception
    const squish = Math.max(touchActive.value * 0.5, isMoving * 0.3);

    const scaleX = interpolate(squish, [0, 1], [1, 1.25]);
    const scaleY = interpolate(squish, [0, 1], [1, 0.9]);

    return {
      transform: [{ translateX }, { scaleX }, { scaleY }],
    };
  });

  const thumbLightStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(touchActive.value, [0, 1], [0.5, 0.8]),
    };
  });

  const handleToggle = () => {
    'worklet';
    if (!disabled && onValueChange) {
      runOnJS(onValueChange)(!value);
    }
  };

  const gesture = Gesture.Tap()
    .enabled(!disabled)
    .maxDuration(10000)
    .onBegin(() => {
      touchActive.value = withSpring(1, SQUISH_SPRING);
      handleToggle(); // Cambio LÓGICO instantáneo
    })
    .onFinalize(() => {
      touchActive.value = withSpring(0, SQUISH_SPRING);
    });

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={styles.hitArea}>
        <Animated.View style={[styles.glowLayer, glowStyle]} />
        <Animated.View style={[styles.track, trackStyle]}>
          <Animated.View style={[styles.thumbContainer, thumbStyle]}>
            <View style={styles.thumbShadow} />
            <View style={styles.thumb}>
              <Animated.View style={[styles.thumbHighlight, thumbLightStyle]} />
            </View>
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  hitArea: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowLayer: {
    position: 'absolute',
    width: WIDTH - 4,
    height: HEIGHT - 4,
    borderRadius: HEIGHT / 2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  track: {
    width: WIDTH,
    height: HEIGHT,
    borderRadius: HEIGHT / 2,
    padding: PADDING,
    justifyContent: 'center',
    overflow: 'visible',
  },
  thumbContainer: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    position: 'absolute',
    left: PADDING,
    zIndex: 10,
  },
  thumbShadow: {
    position: 'absolute',
    top: 2,
    left: 0,
    right: 0,
    bottom: -2,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: '#000',
    opacity: 0.15,
    transform: [{ scale: 0.9 }],
  },
  thumb: {
    width: '100%',
    height: '100%',
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 3.5,
    elevation: 5,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  thumbHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    borderTopLeftRadius: THUMB_SIZE / 2,
    borderTopRightRadius: THUMB_SIZE / 2,
    backgroundColor: 'rgba(255,255,255,1)',
    opacity: 0.6,
  },
});
