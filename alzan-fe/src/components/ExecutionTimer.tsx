import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Vibration } from 'react-native';
import { colors, typography, borderRadius, spacing } from '../theme';
import { useTheme } from '../context/ThemeContext';
import { X, Plus, SkipForward, Play } from 'lucide-react-native';
import { LiquidGlassFooter } from './common/LiquidGlassFooter';
import BeepSound from '../../assets/sounds/beep.mp3';

import { createAudioPlayer, setAudioModeAsync, AudioPlayer } from 'expo-audio';
import { useTranslation } from 'react-i18next';

interface ExecutionTimerProps {
  initialSeconds: number;
  onComplete: () => void;
  onDismiss: () => void;
  isVisible: boolean;
  soundEnabled?: boolean;
  vibrationEnabled?: boolean;
  bottomOffset?: number;
}

export const ExecutionTimer: React.FC<ExecutionTimerProps> = ({
  initialSeconds,
  onComplete,
  onDismiss,
  isVisible,
  soundEnabled = true,
  vibrationEnabled = true,
  bottomOffset,
}) => {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playerRef = useRef<AudioPlayer | null>(null);
  const [audioReady, setAudioReady] = useState(false);

  // Initialize audio player imperatively with error handling
  useEffect(() => {
    let isMounted = true;

    const initAudio = async () => {
      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          shouldPlayInBackground: false,
        });

        const player = createAudioPlayer(BeepSound);

        if (isMounted) {
          playerRef.current = player;
          setAudioReady(true);
        } else {
          player.release();
        }
      } catch (error) {
        console.log('Error initializing audio (ExecutionTimer):', error);
      }
    };

    initAudio();

    return () => {
      isMounted = false;
      if (playerRef.current) {
        try {
          playerRef.current.release();
        } catch (e) {
          console.log('Error releasing audio player:', e);
        }
        playerRef.current = null;
      }
    };
  }, []);

  const playSound = async () => {
    if (!audioReady || !playerRef.current) return;
    try {
      playerRef.current.seekTo(0);
      playerRef.current.play();
    } catch (error) {
      console.log('Error playing sound:', error);
    }
  };

  const vibrate = (pattern?: number | number[]) => {
    try {
      Vibration.vibrate(pattern);
    } catch (e) {
      console.log('Vibration error:', e);
    }
  };

  useEffect(() => {
    if (isVisible) {
      setSecondsLeft(initialSeconds);
    }
  }, [isVisible, initialSeconds]);

  const onCompleteRef = useRef(onComplete);
  const soundEnabledRef = useRef(soundEnabled);
  const vibrationEnabledRef = useRef(vibrationEnabled);

  useEffect(() => {
    onCompleteRef.current = onComplete;
    soundEnabledRef.current = soundEnabled;
    vibrationEnabledRef.current = vibrationEnabled;
  }, [onComplete, soundEnabled, vibrationEnabled]);

  useEffect(() => {
    if (!isVisible) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Feedback at START
    if (vibrationEnabledRef.current) {
      vibrate(200);
    }
    if (soundEnabledRef.current) {
      playSound();
    }

    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);

          // Feedback at END
          if (vibrationEnabledRef.current) {
            vibrate([0, 500, 200, 500]);
          }
          if (soundEnabledRef.current) {
            playSound();
          }

          setTimeout(() => {
            onCompleteRef.current();
          }, 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isVisible]);

  const addTime = (amount: number) => {
    setSecondsLeft(prev => prev + amount);
  };

  if (!isVisible) return null;

  const resolvedBottomOffset = bottomOffset ?? 115;

  const dynamicStyles = {
    title: { color: colors.textPrimary },
    timerText: { color: '#FF9500' },
    button: { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' },
    buttonText: { color: '#FF9500' },
  };

  return (
    <View style={[styles.overlay, { bottom: resolvedBottomOffset }]}>
      <LiquidGlassFooter style={styles.card} borderRadius={30}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Play size={18} color="#FF9500" />
            <Text style={[styles.title, dynamicStyles.title]}>{t('common.execution')}</Text>
          </View>
          <TouchableOpacity onPress={onDismiss}>
            <X size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.timerContainer}>
          <Text style={[styles.timerText, dynamicStyles.timerText]}>
            {Math.floor(secondsLeft / 60)}:{(secondsLeft % 60).toString().padStart(2, '0')}
          </Text>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity style={[styles.button, dynamicStyles.button]} onPress={() => addTime(10)}>
            <Plus size={16} color="#FF9500" />
            <Text style={[styles.buttonText, dynamicStyles.buttonText]}>{t('common.add10s')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.skipButton]} onPress={onDismiss}>
            <SkipForward size={16} color={colors.white} />
            <Text style={[styles.buttonText, { color: colors.white }]}>{t('common.skip')}</Text>
          </TouchableOpacity>
        </View>
      </LiquidGlassFooter>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: spacing.m,
    right: spacing.m,
    zIndex: 1001,
  },
  card: {
    width: '100%',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.s,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    ...typography.h4,
    color: colors.textPrimary,
  },
  timerContainer: {
    alignItems: 'center',
    marginVertical: spacing.s,
  },
  timerText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FF9500',
    fontVariant: ['tabular-nums'],
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.s,
    gap: spacing.m,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    padding: spacing.s,
    borderRadius: borderRadius.m,
    gap: 4,
  },
  skipButton: {
    backgroundColor: '#FF9500',
  },
  buttonText: {
    ...typography.button,
    color: '#FF9500',
  },
});
