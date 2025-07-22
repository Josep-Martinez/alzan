// components/sport/ExerciseTimer.tsx - Timer para ejercicios de tiempo
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

interface ExerciseTimerProps {
  visible: boolean;
  exerciseName: string;
  targetDuration?: number;     // Duración objetivo en segundos (opcional)
  onComplete: (actualDuration: number) => void;
  onCancel: () => void;
}

export default function ExerciseTimer({ 
  visible, 
  exerciseName, 
  targetDuration, 
  onComplete, 
  onCancel 
}: ExerciseTimerProps) {
  const [currentTime, setCurrentTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [pausedTime, setPausedTime] = useState(0);
  const [scaleAnim] = useState(new Animated.Value(0));
  const [opacityAnim] = useState(new Animated.Value(0));

  // Animación de entrada al abrir el modal
  useEffect(() => {
    if (visible) {
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
    }
  }, [visible, scaleAnim, opacityAnim]);

  // Timer principal
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (isRunning && !isPaused && startTime) {
      interval = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - startTime + pausedTime) / 1000);
        setCurrentTime(elapsed);
        
        // Vibrar cada 10 segundos si hay duración objetivo
        if (targetDuration && elapsed > 0 && elapsed % 10 === 0) {
          Vibration.vibrate(100);
        }
        
        // Alertar cuando se alcanza el tiempo objetivo
        if (targetDuration && elapsed >= targetDuration) {
          Vibration.vibrate([0, 200, 100, 200, 100, 200]);
        }
      }, 100);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, isPaused, startTime, pausedTime, targetDuration]);

  /**
   * Inicia el timer
   */
  const startTimer = () => {
    if (!isRunning) {
      setStartTime(Date.now());
      setIsRunning(true);
      setIsPaused(false);
      setCurrentTime(0);
      setPausedTime(0);
      Vibration.vibrate(100);
    }
  };

  /**
   * Pausa/reanuda el timer
   */
  const togglePause = () => {
    if (isRunning) {
      if (isPaused) {
        // Reanudar
        setStartTime(Date.now());
        setIsPaused(false);
        Vibration.vibrate(100);
      } else {
        // Pausar
        setPausedTime(prev => prev + (Date.now() - (startTime || 0)));
        setIsPaused(true);
        Vibration.vibrate([0, 100, 50, 100]);
      }
    }
  };

  /**
   * Completa el ejercicio
   */
  const completeExercise = () => {
    if (isRunning && !isPaused) {
      const finalTime = Math.floor((Date.now() - (startTime || 0) + pausedTime) / 1000);
      setCurrentTime(finalTime);
      
      Vibration.vibrate([0, 200, 100, 200]);
      
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
        onComplete(finalTime);
        resetTimer();
      });
    } else {
      // Si no está corriendo, usar el tiempo actual
      onComplete(currentTime);
      resetTimer();
    }
  };

  /**
   * Cancela el timer
   */
  const cancelTimer = () => {
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
      resetTimer();
    });
  };

  /**
   * Resetea el timer
   */
  const resetTimer = () => {
    setIsRunning(false);
    setIsPaused(false);
    setCurrentTime(0);
    setStartTime(null);
    setPausedTime(0);
  };

  /**
   * Formatea el tiempo en MM:SS
   */
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  /**
   * Calcula el progreso si hay duración objetivo
   */
  const getProgress = () => {
    if (!targetDuration) return 0;
    return Math.min((currentTime / targetDuration) * 100, 100);
  };

  /**
   * Determina el color del timer según el estado
   */
  const getTimerColor = () => {
    if (!isRunning) return '#B0B0C4';
    if (isPaused) return '#FF9800';
    if (targetDuration && currentTime >= targetDuration) return '#4CAF50';
    return '#00D4AA';
  };

  /**
   * Determina el estado del timer para mostrar
   */
  const getTimerStatus = () => {
    if (!isRunning) return 'Listo para comenzar';
    if (isPaused) return 'Pausado';
    if (targetDuration && currentTime >= targetDuration) return '¡Tiempo completado!';
    return 'En progreso';
  };

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={cancelTimer}
    >
      <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
        <Animated.View 
          style={[
            styles.timerContainer,
            {
              transform: [{ scale: scaleAnim }],
            }
          ]}
        >
          <LinearGradient
            colors={["#1A1A3A", "#2D2D5F"]}
            style={styles.timerGradient}
          >
            {/* Botón cerrar */}
            <Pressable onPress={cancelTimer} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={24} color="#FFFFFF" />
            </Pressable>

            {/* Header */}
            <View style={styles.timerHeader}>
              <MaterialCommunityIcons name="timer" size={32} color="#00D4AA" />
              <Text style={styles.timerTitle}>Cronometrando Ejercicio</Text>
            </View>

            {/* Nombre del ejercicio */}
            <Text style={styles.exerciseName}>{exerciseName}</Text>

            {/* Tiempo objetivo (si existe) */}
            {targetDuration && (
              <View style={styles.targetInfo}>
                <MaterialCommunityIcons name="target" size={16} color="#FFB84D" />
                <Text style={styles.targetText}>
                  Objetivo: {formatTime(targetDuration)}
                </Text>
              </View>
            )}

            {/* Display del tiempo */}
            <View style={styles.timeDisplay}>
              <Text style={[styles.timeText, { color: getTimerColor() }]}>
                {formatTime(currentTime)}
              </Text>
            </View>

            {/* Barra de progreso (si hay duración objetivo) */}
            {targetDuration && (
              <View style={styles.progressContainer}>
                <View style={styles.progressBackground}>
                  <Animated.View 
                    style={[
                      styles.progressBar,
                      { 
                        width: `${getProgress()}%`,
                        backgroundColor: getTimerColor()
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.progressText}>
                  {Math.round(getProgress())}% completado
                </Text>
              </View>
            )}

            {/* Estado del timer */}
            <View style={styles.statusContainer}>
              <Text style={[styles.statusText, { color: getTimerColor() }]}>
                {getTimerStatus()}
              </Text>
            </View>

            {/* Controles */}
            <View style={styles.controlsContainer}>
              {!isRunning ? (
                // Botón iniciar
                <Pressable onPress={startTimer} style={styles.startButton}>
                  <LinearGradient
                    colors={["#00D4AA", "#00B894"]}
                    style={styles.startButtonGradient}
                  >
                    <MaterialCommunityIcons name="play" size={24} color="#FFFFFF" />
                    <Text style={styles.startButtonText}>Iniciar</Text>
                  </LinearGradient>
                </Pressable>
              ) : (
                // Controles activos
                <View style={styles.activeControls}>
                  <Pressable onPress={togglePause} style={styles.pauseButton}>
                    <MaterialCommunityIcons 
                      name={isPaused ? "play" : "pause"} 
                      size={24} 
                      color="#FF9800" 
                    />
                    <Text style={styles.pauseButtonText}>
                      {isPaused ? 'Reanudar' : 'Pausar'}
                    </Text>
                  </Pressable>

                  <Pressable onPress={completeExercise} style={styles.completeButton}>
                    <LinearGradient
                      colors={["#4CAF50", "#388E3C"]}
                      style={styles.completeButtonGradient}
                    >
                      <MaterialCommunityIcons name="check" size={24} color="#FFFFFF" />
                      <Text style={styles.completeButtonText}>Completar</Text>
                    </LinearGradient>
                  </Pressable>
                </View>
              )}
            </View>

            {/* Información adicional */}
            <View style={styles.infoContainer}>
              <View style={styles.infoItem}>
                <MaterialCommunityIcons name="information-outline" size={12} color="#B0B0C4" />
                <Text style={styles.infoText}>
                  {targetDuration 
                    ? `Mantén el ejercicio hasta alcanzar ${formatTime(targetDuration)}` 
                    : 'Cronometra el ejercicio y completa cuando termines'
                  }
                </Text>
              </View>
              
              {isRunning && (
                <View style={styles.infoItem}>
                  <MaterialCommunityIcons name="vibrate" size={12} color="#FFB84D" />
                  <Text style={styles.infoText}>
                    {targetDuration 
                      ? 'Vibración cada 10s y al completar objetivo'
                      : 'Presiona "Completar" cuando termines el ejercicio'
                    }
                  </Text>
                </View>
              )}
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
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  timerContainer: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.5,
    shadowRadius: 25,
    elevation: 25,
  },

  timerGradient: {
    padding: 24,
    alignItems: 'center',
    position: 'relative',
  },

  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },

  timerHeader: {
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },

  timerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  exerciseName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },

  targetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 184, 77, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 20,
    gap: 6,
  },

  targetText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFB84D',
  },

  timeDisplay: {
    alignItems: 'center',
    marginBottom: 20,
  },

  timeText: {
    fontSize: 56,
    fontWeight: '900',
    fontFamily: 'monospace',
    textAlign: 'center',
  },

  progressContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },

  progressBackground: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },

  progressBar: {
    height: '100%',
    borderRadius: 4,
  },

  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B0B0C4',
  },

  statusContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },

  statusText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },

  controlsContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },

  startButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },

  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },

  startButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  activeControls: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },

  pauseButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 152, 0, 0.2)',
    borderRadius: 16,
    paddingVertical: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 152, 0, 0.5)',
  },

  pauseButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF9800',
  },

  completeButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },

  completeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },

  completeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  infoContainer: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },

  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },

  infoText: {
    flex: 1,
    fontSize: 11,
    color: '#B0B0C4',
    lineHeight: 16,
  },
});