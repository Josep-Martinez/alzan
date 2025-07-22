// components/sport/RestTimerBar.tsx
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import {
    Animated,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    Vibration,
    View
} from 'react-native';

interface RestTimerBarProps {
  duration: number;
  onComplete: () => void;
  onCancel: () => void;
}

export default function RestTimerBar({ duration, onComplete, onCancel }: RestTimerBarProps) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [scaleAnim] = useState(new Animated.Value(0));
  const [opacityAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // Animación emergente tipo POP!
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    setTimeLeft(duration);
    
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          Vibration.vibrate([0, 200, 100, 200]);
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [duration, onComplete, scaleAnim, opacityAnim]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    return ((duration - timeLeft) / duration) * 100;
  };

  const handleClose = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onCancel();
    });
  };

  return (
    <Modal
      visible={true}
      transparent={true}
      animationType="none"
    >
      <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
        <Animated.View 
          style={[
            styles.emergentPopup,
            {
              transform: [{ scale: scaleAnim }],
            }
          ]}
        >
          <LinearGradient
            colors={["#2D2D5F", "#3D3D7F"]}
            style={styles.gradientPopup}
          >
            {/* Close Button */}
            <Pressable onPress={handleClose} style={styles.closeButtonPopup}>
              <MaterialCommunityIcons
                name="close"
                size={20}
                color="#FFFFFF"
              />
            </Pressable>

            {/* Timer Icon */}
            <View style={styles.iconContainerPopup}>
              <View style={styles.iconCirclePopup}>
                <MaterialCommunityIcons
                  name="timer"
                  size={32}
                  color="#FFB84D"
                />
              </View>
            </View>

            {/* Title */}
            <Text style={styles.titlePopup}>¡Serie Completada!</Text>
            <Text style={styles.subtitlePopup}>Tiempo de descanso</Text>

            {/* Time Display */}
            <Text style={styles.timeTextPopup}>{formatTime(timeLeft)}</Text>

            {/* Progress Bar */}
            <View style={styles.progressContainerPopup}>
              <View style={styles.progressBackgroundPopup}>
                <Animated.View 
                  style={[
                    styles.progressBarPopup,
                    { width: `${getProgressPercentage()}%` }
                  ]} 
                />
              </View>
            </View>

            {/* Buttons */}
            <View style={styles.buttonsContainerPopup}>
              <Pressable onPress={handleClose} style={styles.cancelBtnPopup}>
                <Text style={styles.cancelBtnTextPopup}>Saltar Descanso</Text>
              </Pressable>
            </View>
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },

  emergentPopup: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 15,
    },
    shadowOpacity: 0.5,
    shadowRadius: 25,
    elevation: 25,
  },

  gradientPopup: {
    padding: 32,
    alignItems: 'center',
    position: 'relative',
  },

  closeButtonPopup: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },

  iconContainerPopup: {
    marginBottom: 24,
  },

  iconCirclePopup: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 184, 77, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFB84D',
  },

  titlePopup: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },

  subtitlePopup: {
    fontSize: 16,
    color: '#B0B0C4',
    marginBottom: 24,
    textAlign: 'center',
  },

  timeTextPopup: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFB84D',
    marginBottom: 28,
    textAlign: 'center',
  },

  progressContainerPopup: {
    width: '100%',
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 28,
  },

  progressBackgroundPopup: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 184, 77, 0.2)',
  },

  progressBarPopup: {
    height: '100%',
    backgroundColor: '#FFB84D',
    borderRadius: 5,
  },

  buttonsContainerPopup: {
    width: '100%',
  },

  cancelBtnPopup: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: '#00D4AA',
    alignItems: 'center',
  },

  cancelBtnTextPopup: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});