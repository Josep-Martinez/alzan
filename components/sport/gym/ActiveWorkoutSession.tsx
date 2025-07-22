// components/sport/ActiveWorkoutSession.tsx - Pantalla de entrenamiento activo mejorada
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import {
  Animated,
  Keyboard,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  Vibration,
  View
} from 'react-native';
import RestTimerBar from '../common/RestTimerBar';
import {
  GymExercise,
  GymSet,
  isSetComplete,
  SuperSet,
  SupersetType
} from '../common/sports';
import ExerciseTimer from './ExerciseTimer';

/**
 * Props del componente ActiveWorkoutSession
 */
interface ActiveWorkoutSessionProps {
  visible: boolean;
  exercises: GymExercise[];
  supersets: SuperSet[];
  workoutName: string;
  onUpdateExercises: (exercises: GymExercise[]) => void;
  onUpdateSuperset: (supersetIdx: number, superset: SuperSet) => void;
  onCompleteWorkout: () => void;
  onClose: () => void;
}

/**
 * Componente de sesión activa de entrenamiento
 * Interfaz optimizada para usar durante el entrenamiento estilo Hevy
 */
export default function ActiveWorkoutSession({
  visible,
  exercises,
  supersets,
  workoutName,
  onUpdateExercises,
  onUpdateSuperset,
  onCompleteWorkout,
  onClose
}: ActiveWorkoutSessionProps) {
  // ===== ESTADOS PRINCIPALES =====
  const [currentStationIndex, setCurrentStationIndex] = useState(0);
  const [currentExerciseInSuperset, setCurrentExerciseInSuperset] = useState(0);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [restDuration, setRestDuration] = useState(60);
  const [restContext, setRestContext] = useState<'set' | 'exercise' | 'round'>('set');
  const [showExerciseTimer, setShowExerciseTimer] = useState(false);
  const [timerExerciseInfo, setTimerExerciseInfo] = useState<{
    name: string;
    targetDuration?: number;
  } | null>(null);
  
  // ===== ANIMACIONES =====
  const [scaleAnim] = useState(new Animated.Value(1));

  // ===== ESTADOS DE EDICIÓN =====
  const [editingWeight, setEditingWeight] = useState(false);
  const [editingReps, setEditingReps] = useState(false);
  const [editingDuration, setEditingDuration] = useState(false);
  const [tempWeight, setTempWeight] = useState('');
  const [tempReps, setTempReps] = useState('');
  const [tempDuration, setTempDuration] = useState('');

  // ===== CALCULOS AUXILIARES =====
  // Crear lista unificada de "estaciones" (ejercicios individuales + superseries)
  const getWorkoutStations = () => {
    const stations: { type: 'exercise' | 'superset'; data: GymExercise | SuperSet }[] = [];
    
    // Ejercicios individuales (no en superseries)
    const individualExercises = exercises.filter(ex => 
      !supersets.some(ss => ss.exercises.some(ssEx => ssEx.id === ex.id))
    );
    
    individualExercises.forEach(ex => {
      stations.push({ type: 'exercise', data: ex });
    });
    
    // Superseries
    supersets.forEach(ss => {
      stations.push({ type: 'superset', data: ss });
    });
    
    return stations;
  };

  const stations = getWorkoutStations();
  const currentStation = stations[currentStationIndex];
  
  // Obtener ejercicio actual
  const getCurrentExercise = (): GymExercise | null => {
    if (!currentStation) return null;
    
    if (currentStation.type === 'exercise') {
      return currentStation.data as GymExercise;
    } else {
      const superset = currentStation.data as SuperSet;
      return superset.exercises[currentExerciseInSuperset] || null;
    }
  };

  const currentExercise = getCurrentExercise();
  const currentSet = currentExercise?.sets[currentSetIndex];

  // Calcular progreso total
  const calculateProgress = () => {
    let totalSets = 0;
    let completedSets = 0;

    stations.forEach(station => {
      if (station.type === 'exercise') {
        const exercise = station.data as GymExercise;
        totalSets += exercise.sets.length;
        completedSets += exercise.sets.filter(s => s.completed).length;
      } else {
        const superset = station.data as SuperSet;
        totalSets += superset.totalRounds * superset.exercises.length;
        completedSets += superset.roundCompleted.filter(completed => completed).length * superset.exercises.length;
      }
    });

    return totalSets > 0 ? (completedSets / totalSets) * 100 : 0;
  };

  // ===== EFECTOS =====
  useEffect(() => {
    if (visible) {
      // Resetear al primer ejercicio/superserie al abrir
      setCurrentStationIndex(0);
      setCurrentExerciseInSuperset(0);
      setCurrentSetIndex(0);
      setCurrentRound(1);
    }
  }, [visible]);

  // Animación cuando se completa una serie
  const animateComplete = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // ===== FUNCIONES DE NAVEGACIÓN =====
  /**
   * Navega automáticamente después de completar
   */
  const autoNavigateAfterComplete = () => {
    if (!currentStation) return;

    if (currentStation.type === 'superset') {
      const superset = currentStation.data as SuperSet;
      
      // Si quedan más ejercicios en la superserie
      if (currentExerciseInSuperset < superset.exercises.length - 1) {
        setCurrentExerciseInSuperset(currentExerciseInSuperset + 1);
        
        // Descanso entre ejercicios si está configurado
        if (superset.restTimeBetweenExercises && parseInt(superset.restTimeBetweenExercises) > 0) {
          startRestTimer(parseInt(superset.restTimeBetweenExercises), 'exercise');
        }
      } else {
        // Fin de la ronda de superserie
        if (currentRound < superset.totalRounds) {
          // Siguiente ronda
          setCurrentRound(currentRound + 1);
          setCurrentExerciseInSuperset(0);
          
          // Descanso entre rondas
          startRestTimer(parseInt(superset.restTimeBetweenRounds || '90'), 'round');
        } else {
          // Superserie completada, siguiente estación
          if (currentStationIndex < stations.length - 1) {
            setCurrentStationIndex(currentStationIndex + 1);
            setCurrentExerciseInSuperset(0);
            setCurrentSetIndex(0);
            setCurrentRound(1);
          } else {
            // Fin del entrenamiento
            Vibration.vibrate([0, 200, 100, 200, 100, 200]);
          }
        }
      }
    } else {
      // Ejercicio individual
      const exercise = currentStation.data as GymExercise;
      
      if (currentSetIndex < exercise.sets.length - 1) {
        // Siguiente serie
        setCurrentSetIndex(currentSetIndex + 1);
        
        // Descanso entre series
        startRestTimer(parseInt(exercise.restTime || '60'), 'set');
      } else {
        // Ejercicio completado, siguiente estación
        if (currentStationIndex < stations.length - 1) {
          setCurrentStationIndex(currentStationIndex + 1);
          setCurrentExerciseInSuperset(0);
          setCurrentSetIndex(0);
          setCurrentRound(1);
        } else {
          // Fin del entrenamiento
          Vibration.vibrate([0, 200, 100, 200, 100, 200]);
        }
      }
    }
  };

  /**
   * Navegación manual a la estación anterior
   */
  const navigateToPreviousStation = () => {
    if (currentStationIndex > 0) {
      setCurrentStationIndex(currentStationIndex - 1);
      setCurrentExerciseInSuperset(0);
      setCurrentSetIndex(0);
      setCurrentRound(1);
    }
  };

  /**
   * Navegación manual a la siguiente estación
   */
  const navigateToNextStation = () => {
    if (currentStationIndex < stations.length - 1) {
      setCurrentStationIndex(currentStationIndex + 1);
      setCurrentExerciseInSuperset(0);
      setCurrentSetIndex(0);
      setCurrentRound(1);
    }
  };

  // ===== FUNCIONES DE ACTUALIZACIÓN =====
  /**
   * Actualiza un campo de la serie actual
   */
  const updateCurrentSet = (field: keyof GymSet, value: string | boolean | number) => {
    if (!currentExercise || !currentStation) return;

    if (currentStation.type === 'superset') {
      const superset = currentStation.data as SuperSet;
      const supersetIndex = supersets.findIndex(ss => ss.id === superset.id);
      
      const updatedExercises = superset.exercises.map((ex, idx) => {
        if (idx === currentExerciseInSuperset) {
          return {
            ...ex,
            sets: ex.sets.map((set, setIdx) => 
              setIdx === 0 ? { ...set, [field]: value } : set
            )
          };
        }
        return ex;
      });

      const updatedSuperset: SuperSet = {
        ...superset,
        exercises: updatedExercises
      };

      onUpdateSuperset(supersetIndex, updatedSuperset);
    } else {
      // Actualizar ejercicio individual
      const updatedExercises = exercises.map(ex => {
        if (ex.id === currentExercise.id) {
          return {
            ...ex,
            sets: ex.sets.map((set, setIdx) => 
              setIdx === currentSetIndex ? { ...set, [field]: value } : set
            )
          };
        }
        return ex;
      });

      onUpdateExercises(updatedExercises);
    }
  };

  /**
   * Completa la serie/ejercicio actual
   */
  const completeCurrentSet = () => {
    if (!currentExercise || !currentSet || !currentStation) return;

    // Verificar que la serie esté completa
    if (!isSetComplete(currentSet, currentExercise.exerciseType || 'Repeticiones')) {
      Vibration.vibrate(100);
      return;
    }

    // Marcar como completada
    updateCurrentSet('completed', true);
    animateComplete();
    Vibration.vibrate(100);

    // Actualizar ronda completada si es superserie
    if (currentStation.type === 'superset') {
      const superset = currentStation.data as SuperSet;
      
      // Si es el último ejercicio de la ronda
      if (currentExerciseInSuperset === superset.exercises.length - 1) {
        const supersetIndex = supersets.findIndex(ss => ss.id === superset.id);
        const updatedSuperset: SuperSet = {
          ...superset,
          roundCompleted: superset.roundCompleted.map((completed, idx) => 
            idx === currentRound - 1 ? true : completed
          )
        };
        onUpdateSuperset(supersetIndex, updatedSuperset);
        
        // Vibración especial para fin de ronda
        Vibration.vibrate([0, 200, 100, 200]);
      }
    }

    // Navegar automáticamente
    setTimeout(() => {
      autoNavigateAfterComplete();
    }, 300);
  };

  // ===== FUNCIONES DE TIMER =====
  /**
   * Inicia el timer de descanso
   */
  const startRestTimer = (duration: number, context: 'set' | 'exercise' | 'round') => {
    setRestDuration(duration);
    setRestContext(context);
    setShowRestTimer(true);
  };

  /**
   * Inicia el timer de ejercicio
   */
  const startExerciseTimer = () => {
    if (!currentExercise || currentExercise.exerciseType !== 'Tiempo') return;

    const targetDuration = currentSet?.duration ? parseInt(currentSet.duration) : undefined;
    
    setTimerExerciseInfo({
      name: currentExercise.name,
      targetDuration
    });
    setShowExerciseTimer(true);
  };

  /**
   * Completa el timer de ejercicio
   */
  const completeExerciseTimer = (actualDuration: number) => {
    updateCurrentSet('actualDuration', actualDuration);
    setShowExerciseTimer(false);
    setTimerExerciseInfo(null);
    
    // Completar automáticamente
    completeCurrentSet();
  };

  // ===== FUNCIONES DE EDICIÓN RÁPIDA =====
  const startEditWeight = () => {
    setTempWeight(currentSet?.weight || '');
    setEditingWeight(true);
  };

  const startEditReps = () => {
    setTempReps(currentSet?.reps || '');
    setEditingReps(true);
  };

  const startEditDuration = () => {
    setTempDuration(currentSet?.duration || '');
    setEditingDuration(true);
  };

  const saveWeight = () => {
    updateCurrentSet('weight', tempWeight);
    setEditingWeight(false);
    Keyboard.dismiss();
  };

  const saveReps = () => {
    updateCurrentSet('reps', tempReps);
    setEditingReps(false);
    Keyboard.dismiss();
  };

  const saveDuration = () => {
    updateCurrentSet('duration', tempDuration);
    setEditingDuration(false);
    Keyboard.dismiss();
  };

  // ===== FUNCIONES AUXILIARES =====
  const getSupersetTypeName = (type: SupersetType): string => {
    switch (type) {
      case 'superset': return 'Superserie';
      case 'triset': return 'Triserie';
      case 'circuit': return 'Circuito';
      case 'megacircuit': return 'Mega Circuito';
      default: return 'Superserie';
    }
  };

  const getSupersetColor = (type: SupersetType): string => {
    switch (type) {
      case 'superset': return '#FF6B6B';
      case 'triset': return '#FFB84D';
      case 'circuit': return '#4ECDC4';
      case 'megacircuit': return '#E91E63';
      default: return '#FF6B6B';
    }
  };

  const getRestContextText = () => {
    switch (restContext) {
      case 'set': return 'Descanso entre series';
      case 'exercise': return 'Descanso entre ejercicios';
      case 'round': return 'Descanso entre rondas';
      default: return 'Descanso';
    }
  };

  const progress = calculateProgress();

  // Si no hay ejercicio actual, no mostrar nada
  if (!currentExercise || !currentStation) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <LinearGradient
        colors={['#0F0F23', '#1A1A3A', '#2D2D5F']}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea}>
          {/* ===== HEADER ===== */}
          <View style={styles.header}>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="chevron-down" size={28} color="#FFFFFF" />
            </Pressable>

            <View style={styles.headerCenter}>
              <Text style={styles.workoutName} numberOfLines={1}>
                {workoutName}
              </Text>
              <View style={styles.progressInfo}>
                <Text style={styles.progressText}>
                  {Math.round(progress)}% completado
                </Text>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${progress}%` }]} />
                </View>
              </View>
            </View>

            <Pressable onPress={onCompleteWorkout} style={styles.finishBtn}>
              <Text style={styles.finishBtnText}>Finalizar</Text>
            </Pressable>
          </View>

          {/* ===== NAVEGACIÓN ENTRE ESTACIONES ===== */}
          <View style={styles.stationNav}>
            <Pressable 
              onPress={navigateToPreviousStation}
              style={[styles.navBtn, currentStationIndex === 0 && styles.navBtnDisabled]}
              disabled={currentStationIndex === 0}
            >
              <MaterialCommunityIcons name="chevron-left" size={24} color="#FFFFFF" />
            </Pressable>

            <View style={styles.stationInfo}>
              <Text style={styles.stationNumber}>
                Estación {currentStationIndex + 1} de {stations.length}
              </Text>
              {currentStation.type === 'superset' && (
                <Text style={styles.stationType}>
                  {getSupersetTypeName((currentStation.data as SuperSet).type)}
                </Text>
              )}
            </View>

            <Pressable 
              onPress={navigateToNextStation}
              style={[styles.navBtn, currentStationIndex === stations.length - 1 && styles.navBtnDisabled]}
              disabled={currentStationIndex === stations.length - 1}
            >
              <MaterialCommunityIcons name="chevron-right" size={24} color="#FFFFFF" />
            </Pressable>
          </View>

          {/* ===== CONTENIDO PRINCIPAL ===== */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Card principal del ejercicio */}
            <Animated.View style={[
              styles.exerciseCard,
              { transform: [{ scale: scaleAnim }] }
            ]}>
              <LinearGradient
                colors={
                  currentStation.type === 'superset'
                    ? [getSupersetColor((currentStation.data as SuperSet).type) + '33', 
                       getSupersetColor((currentStation.data as SuperSet).type) + '1A']
                    : ['#2D2D5F', '#3D3D7F']
                }
                style={styles.exerciseGradient}
              >
                {/* Header del ejercicio con información de superserie */}
                {currentStation.type === 'superset' && (
                  <View style={styles.supersetHeader}>
                    <View style={styles.supersetHeaderInfo}>
                      <View style={styles.supersetTypeIndicator}>
                        <MaterialCommunityIcons
                          name={
                            (currentStation.data as SuperSet).type === 'superset' ? 'lightning-bolt' :
                            (currentStation.data as SuperSet).type === 'triset' ? 'flash' :
                            (currentStation.data as SuperSet).type === 'circuit' ? 'refresh-circle' :
                            'fire'
                          }
                          size={20}
                          color={getSupersetColor((currentStation.data as SuperSet).type)}
                        />
                        <Text style={[styles.supersetTypeBadge, { 
                          color: getSupersetColor((currentStation.data as SuperSet).type) 
                        }]}>
                          {getSupersetTypeName((currentStation.data as SuperSet).type).toUpperCase()}
                        </Text>
                      </View>
                      <Text style={styles.supersetName}>
                        {(currentStation.data as SuperSet).name}
                      </Text>
                      <Text style={styles.supersetProgress}>
                        Ejercicio {currentExerciseInSuperset + 1} de {(currentStation.data as SuperSet).exercises.length}
                        {' • '}
                        Ronda {currentRound} de {(currentStation.data as SuperSet).totalRounds}
                      </Text>
                    </View>
                    
                    {/* Indicadores de rondas */}
                    <View style={styles.roundIndicators}>
                      {Array.from({ length: (currentStation.data as SuperSet).totalRounds }).map((_, idx) => (
                        <View
                          key={idx}
                          style={[
                            styles.roundDot,
                            (currentStation.data as SuperSet).roundCompleted[idx] && styles.roundDotCompleted,
                            idx === currentRound - 1 && styles.roundDotCurrent
                          ]}
                        />
                      ))}
                    </View>
                  </View>
                )}

                {/* Información del ejercicio */}
                <View style={styles.exerciseHeader}>
                  <Text style={styles.exerciseName}>{currentExercise.name}</Text>
                  <View style={styles.exerciseBadges}>
                    {currentExercise.muscleGroup && (
                      <View style={styles.muscleBadge}>
                        <Text style={styles.muscleBadgeText}>
                          {currentExercise.muscleGroup}
                        </Text>
                      </View>
                    )}
                    <View style={[
                      styles.typeBadge,
                      { backgroundColor: currentExercise.exerciseType === 'Tiempo' ? '#FFB84D' : '#4ECDC4' }
                    ]}>
                      <MaterialCommunityIcons 
                        name={currentExercise.exerciseType === 'Tiempo' ? 'timer' : 'numeric'}
                        size={12}
                        color="#FFFFFF"
                      />
                      <Text style={styles.typeBadgeText}>
                        {currentExercise.exerciseType === 'Tiempo' ? 'TIEMPO' : 'REPS'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Serie actual con controles grandes */}
                <View style={styles.currentSetSection}>
                  {currentStation.type === 'exercise' && (
                    <View style={styles.setIndicators}>
                      <Text style={styles.setLabel}>
                        Serie {currentSetIndex + 1} de {currentExercise.sets.length}
                      </Text>
                      <View style={styles.setDots}>
                        {currentExercise.sets.map((set, idx) => (
                          <View
                            key={idx}
                            style={[
                              styles.setDot,
                              set.completed && styles.setDotCompleted,
                              idx === currentSetIndex && styles.setDotCurrent
                            ]}
                          />
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Controles grandes para edición */}
                  {currentExercise.exerciseType === 'Tiempo' ? (
                    <View style={styles.mainControls}>
                      <View style={styles.mainControl}>
                        <Text style={styles.controlLabel}>Duración</Text>
                        <Pressable onPress={startEditDuration} style={styles.bigValueDisplay}>
                          {editingDuration ? (
                            <TextInput
                              value={tempDuration}
                              onChangeText={setTempDuration}
                              onBlur={saveDuration}
                              onSubmitEditing={saveDuration}
                              style={styles.bigEditInput}
                              keyboardType="numeric"
                              autoFocus
                              selectTextOnFocus
                            />
                          ) : (
                            <Text style={styles.bigValueText}>
                              {currentSet?.duration || '0'}
                            </Text>
                          )}
                          <Text style={styles.bigValueUnit}>seg</Text>
                        </Pressable>
                      </View>

                      <View style={styles.mainControl}>
                        <Text style={styles.controlLabel}>Peso (opcional)</Text>
                        <Pressable onPress={startEditWeight} style={styles.bigValueDisplay}>
                          {editingWeight ? (
                            <TextInput
                              value={tempWeight}
                              onChangeText={setTempWeight}
                              onBlur={saveWeight}
                              onSubmitEditing={saveWeight}
                              style={styles.bigEditInput}
                              keyboardType="numeric"
                              autoFocus
                              selectTextOnFocus
                            />
                          ) : (
                            <Text style={styles.bigValueText}>
                              {currentSet?.weight || '0'}
                            </Text>
                          )}
                          <Text style={styles.bigValueUnit}>kg</Text>
                        </Pressable>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.mainControls}>
                      <View style={styles.mainControl}>
                        <Text style={styles.controlLabel}>Repeticiones</Text>
                        <Pressable onPress={startEditReps} style={styles.bigValueDisplay}>
                          {editingReps ? (
                            <TextInput
                              value={tempReps}
                              onChangeText={setTempReps}
                              onBlur={saveReps}
                              onSubmitEditing={saveReps}
                              style={styles.bigEditInput}
                              keyboardType="numeric"
                              autoFocus
                              selectTextOnFocus
                            />
                          ) : (
                            <Text style={styles.bigValueText}>
                              {currentSet?.reps || '0'}
                            </Text>
                          )}
                        </Pressable>
                      </View>

                      <View style={styles.mainControl}>
                        <Text style={styles.controlLabel}>Peso</Text>
                        <Pressable onPress={startEditWeight} style={styles.bigValueDisplay}>
                          {editingWeight ? (
                            <TextInput
                              value={tempWeight}
                              onChangeText={setTempWeight}
                              onBlur={saveWeight}
                              onSubmitEditing={saveWeight}
                              style={styles.bigEditInput}
                              keyboardType="numeric"
                              autoFocus
                              selectTextOnFocus
                            />
                          ) : (
                            <Text style={styles.bigValueText}>
                              {currentSet?.weight || '0'}
                            </Text>
                          )}
                          <Text style={styles.bigValueUnit}>kg</Text>
                        </Pressable>
                      </View>
                    </View>
                  )}

                  {/* Botones de acción */}
                  <View style={styles.actionButtons}>
                    {currentExercise.exerciseType === 'Tiempo' && !currentSet?.completed && (
                      <Pressable onPress={startExerciseTimer} style={styles.timerBtn}>
                        <LinearGradient
                          colors={['#FFB84D', '#FF9800']}
                          style={styles.timerBtnGradient}
                        >
                          <MaterialCommunityIcons name="timer" size={32} color="#FFFFFF" />
                          <Text style={styles.timerBtnText}>Iniciar Timer</Text>
                        </LinearGradient>
                      </Pressable>
                    )}

                    <Pressable 
                      onPress={completeCurrentSet}
                      style={[
                        styles.completeBtn,
                        (currentSet?.completed || (currentSet ? !isSetComplete(currentSet, currentExercise.exerciseType || 'Repeticiones') : true)) && styles.completeBtnDisabled
                      ]}
                      disabled={currentSet?.completed || (currentSet ? !isSetComplete(currentSet, currentExercise.exerciseType || 'Repeticiones') : true)}
                    >
                      <LinearGradient
                        colors={
                          currentSet?.completed 
                            ? ['#6B7280', '#4B5563']
                            : ['#00D4AA', '#00B894']
                        }
                        style={styles.completeBtnGradient}
                      >
                        <MaterialCommunityIcons 
                          name={currentSet?.completed ? "check" : "check-circle"} 
                          size={32} 
                          color="#FFFFFF" 
                        />
                        <Text style={styles.completeBtnText}>
                          {currentSet?.completed ? 'Completada' : 'Completar'}
                        </Text>
                      </LinearGradient>
                    </Pressable>
                  </View>

                  {/* Información adicional de progreso para ejercicios individuales */}
                  {currentStation.type === 'exercise' && currentExercise.sets.length > 1 && (
                    <View style={styles.exerciseProgressInfo}>
                      <View style={styles.setsProgressBar}>
                        <View 
                          style={[
                            styles.setsProgressFill,
                            { 
                              width: `${((currentExercise.sets.filter(s => s.completed).length) / 
                                         currentExercise.sets.length) * 100}%` 
                            }
                          ]}
                        />
                      </View>
                      <Text style={styles.setsProgressText}>
                        {currentExercise.sets.filter(s => s.completed).length} de {currentExercise.sets.length} series completadas
                      </Text>
                    </View>
                  )}

                  {/* Información de descanso */}
                  <View style={styles.restTimeInfo}>
                    <MaterialCommunityIcons name="timer-sand" size={16} color="#FFB84D" />
                    <Text style={styles.restTimeText}>
                      Descanso después: {currentExercise.restTime || '60'}s
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </Animated.View>

            {/* Próximos ejercicios en superserie con flujo visual */}
            {currentStation.type === 'superset' && (
              <View style={styles.supersetExercisesPreview}>
                <View style={styles.previewHeader}>
                  <Text style={styles.previewTitle}>
                    Flujo del {getSupersetTypeName((currentStation.data as SuperSet).type)}
                  </Text>
                  {(currentStation.data as SuperSet).restTimeBetweenExercises && 
                   parseInt((currentStation.data as SuperSet).restTimeBetweenExercises!) > 0 && (
                    <View style={styles.restIndicator}>
                      <MaterialCommunityIcons name="timer-sand" size={14} color="#FFB84D" />
                      <Text style={styles.restIndicatorText}>
                        {(currentStation.data as SuperSet).restTimeBetweenExercises}s entre ejercicios
                      </Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.supersetExercisesList}>
                  {(currentStation.data as SuperSet).exercises.map((ex, idx) => (
                    <View key={ex.id}>
                      <View 
                        style={[
                          styles.supersetExerciseItem,
                          idx === currentExerciseInSuperset && styles.supersetExerciseItemActive,
                          idx < currentExerciseInSuperset && styles.supersetExerciseItemCompleted
                        ]}
                      >
                        <View style={[
                          styles.exerciseNumber,
                          { backgroundColor: idx === currentExerciseInSuperset ? '#00D4AA' : 
                                             idx < currentExerciseInSuperset ? '#6B7280' : '#B0B0C4' }
                        ]}>
                          {idx < currentExerciseInSuperset ? (
                            <MaterialCommunityIcons name="check" size={16} color="#FFFFFF" />
                          ) : (
                            <Text style={styles.exerciseNumberText}>{idx + 1}</Text>
                          )}
                        </View>
                        <View style={styles.exercisePreviewInfo}>
                          <Text style={[
                            styles.exercisePreviewName,
                            idx === currentExerciseInSuperset && styles.exercisePreviewNameActive
                          ]}>
                            {ex.name}
                          </Text>
                          <Text style={styles.exercisePreviewDetails}>
                            {ex.sets.length > 0 && ex.sets[0].duration 
                              ? `⏱️ ${ex.sets[0].duration}s`
                              : ex.sets.length > 0 && ex.sets[0].reps
                              ? `🔢 ${ex.sets[0].reps} reps`
                              : '❌ Sin configurar'
                            }
                            {ex.sets.length > 0 && ex.sets[0].weight && ` • ${ex.sets[0].weight}kg`}
                          </Text>
                        </View>
                        {idx === currentExerciseInSuperset && (
                          <View style={styles.currentIndicator}>
                            <MaterialCommunityIcons name="chevron-right" size={20} color="#00D4AA" />
                          </View>
                        )}
                      </View>
                      
                      {/* Indicador de descanso entre ejercicios */}
                      {idx < (currentStation.data as SuperSet).exercises.length - 1 && 
                       (currentStation.data as SuperSet).restTimeBetweenExercises && 
                       parseInt((currentStation.data as SuperSet).restTimeBetweenExercises!) > 0 && (
                        <View style={styles.restBetweenIndicator}>
                          <View style={styles.restLine} />
                          <View style={styles.restBadge}>
                            <MaterialCommunityIcons name="timer" size={12} color="#FFB84D" />
                            <Text style={styles.restBadgeText}>
                              {(currentStation.data as SuperSet).restTimeBetweenExercises}s
                            </Text>
                          </View>
                          <View style={styles.restLine} />
                        </View>
                      )}
                    </View>
                  ))}
                </View>
                
                {/* Indicador de descanso entre rondas */}
                <View style={styles.roundRestInfo}>
                  <MaterialCommunityIcons name="refresh" size={16} color="#4ECDC4" />
                  <Text style={styles.roundRestText}>
                    Descanso entre rondas: {(currentStation.data as SuperSet).restTimeBetweenRounds}s
                  </Text>
                </View>
              </View>
            )}

            {/* Vista previa de próximas estaciones */}
            {currentStationIndex < stations.length - 1 && (
              <View style={styles.upcomingSection}>
                <Text style={styles.upcomingTitle}>Próximas estaciones</Text>
                <View style={styles.upcomingList}>
                  {stations.slice(currentStationIndex + 1, currentStationIndex + 3).map((station, idx) => (
                    <View key={idx} style={styles.upcomingItem}>
                      <View style={styles.upcomingNumber}>
                        <Text style={styles.upcomingNumberText}>
                          {currentStationIndex + idx + 2}
                        </Text>
                      </View>
                      <View style={styles.upcomingInfo}>
                        {station.type === 'exercise' ? (
                          <>
                            <Text style={styles.upcomingName}>
                              {(station.data as GymExercise).name}
                            </Text>
                            <Text style={styles.upcomingType}>
                              {(station.data as GymExercise).sets.length} series
                            </Text>
                          </>
                        ) : (
                          <>
                            <Text style={styles.upcomingName}>
                              {(station.data as SuperSet).name}
                            </Text>
                            <Text style={styles.upcomingType}>
                              {getSupersetTypeName((station.data as SuperSet).type)} - 
                              {(station.data as SuperSet).exercises.length} ejercicios × 
                              {(station.data as SuperSet).totalRounds} rondas
                            </Text>
                          </>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Mensaje de último ejercicio */}
            {currentStationIndex === stations.length - 1 && (
              <View style={styles.lastExerciseMessage}>
                <MaterialCommunityIcons name="trophy" size={32} color="#00D4AA" />
                <Text style={styles.lastExerciseText}>¡Última estación!</Text>
                <Text style={styles.lastExerciseSubtext}>
                  Termina fuerte y completa tu entrenamiento
                </Text>
              </View>
            )}
          </ScrollView>

          {/* ===== TIMER DE DESCANSO CON CONTEXTO MEJORADO ===== */}
          {showRestTimer && (
            <Modal
              visible={showRestTimer}
              transparent={true}
              animationType="fade"
            >
              <View style={styles.restTimerModal}>
                <View style={styles.restTimerContent}>
                  <LinearGradient
                    colors={['#2D2D5F', '#3D3D7F']}
                    style={styles.restTimerGradient}
                  >
                    <View style={styles.restTimerHeader}>
                      <MaterialCommunityIcons 
                        name={
                          restContext === 'set' ? 'dumbbell' :
                          restContext === 'exercise' ? 'run' :
                          'refresh'
                        }
                        size={24} 
                        color="#FFB84D" 
                      />
                      <Text style={styles.restTimerTitle}>
                        {getRestContextText()}
                      </Text>
                    </View>
                    
                    {/* Información adicional según contexto */}
                    {restContext === 'exercise' && currentStation.type === 'superset' && (
                      <Text style={styles.restTimerSubtext}>
                        Siguiente: {(currentStation.data as SuperSet).exercises[currentExerciseInSuperset + 1]?.name}
                      </Text>
                    )}
                    
                    {restContext === 'round' && currentStation.type === 'superset' && (
                      <Text style={styles.restTimerSubtext}>
                        Próxima ronda: {currentRound + 1} de {(currentStation.data as SuperSet).totalRounds}
                      </Text>
                    )}
                    
                    <RestTimerBar
                      duration={restDuration}
                      onComplete={() => setShowRestTimer(false)}
                      onCancel={() => setShowRestTimer(false)}
                    />
                  </LinearGradient>
                </View>
              </View>
            </Modal>
          )}

          {/* ===== TIMER DE EJERCICIO ===== */}
          {showExerciseTimer && timerExerciseInfo && (
            <ExerciseTimer
              visible={showExerciseTimer}
              exerciseName={timerExerciseInfo.name}
              targetDuration={timerExerciseInfo.targetDuration}
              onComplete={completeExerciseTimer}
              onCancel={() => {
                setShowExerciseTimer(false);
                setTimerExerciseInfo(null);
              }}
            />
          )}
        </SafeAreaView>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  safeArea: {
    flex: 1,
  },

  // ===== HEADER =====
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },

  closeBtn: {
    padding: 8,
  },

  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },

  workoutName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },

  progressInfo: {
    alignItems: 'center',
    width: '100%',
  },

  progressText: {
    fontSize: 12,
    color: '#00D4AA',
    fontWeight: '600',
    marginBottom: 4,
  },

  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
  },

  progressFill: {
    height: '100%',
    backgroundColor: '#00D4AA',
    borderRadius: 2,
  },

  finishBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 184, 77, 0.2)',
    borderRadius: 8,
  },

  finishBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFB84D',
  },

  // ===== NAVEGACIÓN ESTACIONES =====
  stationNav: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },

  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  navBtnDisabled: {
    opacity: 0.3,
  },

  stationInfo: {
    flex: 1,
    alignItems: 'center',
  },

  stationNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  stationType: {
    fontSize: 12,
    color: '#FFB84D',
    fontWeight: '600',
  },

  // ===== CONTENIDO =====
  content: {
    flex: 1,
  },

  exerciseCard: {
    margin: 16,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },

  exerciseGradient: {
    padding: 24,
  },

  // ===== SUPERSERIE HEADER =====
  supersetHeader: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },

  supersetHeaderInfo: {
    marginBottom: 12,
  },

  supersetTypeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },

  supersetTypeBadge: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },

  supersetName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },

  supersetProgress: {
    fontSize: 14,
    color: '#FFB84D',
    fontWeight: '600',
  },

  roundIndicators: {
    flexDirection: 'row',
    gap: 8,
  },

  roundDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },

  roundDotCompleted: {
    backgroundColor: '#00D4AA',
  },

  roundDotCurrent: {
    backgroundColor: '#FFB84D',
    transform: [{ scale: 1.2 }],
  },

  // ===== EJERCICIO HEADER =====
  exerciseHeader: {
    marginBottom: 24,
  },

  exerciseName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 12,
  },

  exerciseBadges: {
    flexDirection: 'row',
    gap: 8,
  },

  muscleBadge: {
    backgroundColor: 'rgba(0, 212, 170, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },

  muscleBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00D4AA',
  },

  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },

  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // ===== SERIE ACTUAL =====
  currentSetSection: {
    alignItems: 'center',
  },

  setIndicators: {
    alignItems: 'center',
    marginBottom: 20,
  },

  setLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#B0B0C4',
    marginBottom: 8,
  },

  setDots: {
    flexDirection: 'row',
    gap: 6,
  },

  setDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },

  setDotCompleted: {
    backgroundColor: '#00D4AA',
  },

  setDotCurrent: {
    backgroundColor: '#FFB84D',
  },

  // ===== CONTROLES PRINCIPALES =====
  mainControls: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 24,
  },

  mainControl: {
    alignItems: 'center',
  },

  controlLabel: {
    fontSize: 14,
    color: '#B0B0C4',
    marginBottom: 8,
    fontWeight: '600',
  },

  bigValueDisplay: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 32,
    paddingVertical: 20,
    minWidth: 140,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },

  bigValueText: {
    fontSize: 40,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  bigValueUnit: {
    fontSize: 20,
    fontWeight: '600',
    color: '#B0B0C4',
    marginLeft: 4,
  },

  bigEditInput: {
    fontSize: 40,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    minWidth: 60,
  },

  // ===== BOTONES DE ACCIÓN =====
  actionButtons: {
    width: '100%',
    gap: 12,
    marginBottom: 12,
  },

  timerBtn: {
    borderRadius: 20,
    overflow: 'hidden',
  },

  timerBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 12,
  },

  timerBtnText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  completeBtn: {
    borderRadius: 20,
    overflow: 'hidden',
  },

  completeBtnDisabled: {
    opacity: 0.5,
  },

  completeBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 12,
  },

  completeBtnText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  exerciseProgressInfo: {
    width: '100%',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },

  setsProgressBar: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    marginBottom: 8,
  },

  setsProgressFill: {
    height: '100%',
    backgroundColor: '#00D4AA',
    borderRadius: 3,
  },

  setsProgressText: {
    fontSize: 12,
    color: '#B0B0C4',
    textAlign: 'center',
    fontWeight: '600',
  },

  restTimeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },

  restTimeText: {
    fontSize: 14,
    color: '#FFB84D',
    fontWeight: '600',
  },

  // ===== PREVIEW SUPERSERIE =====
  supersetExercisesPreview: {
    margin: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 20,
  },

  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  previewTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  restIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 184, 77, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },

  restIndicatorText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFB84D',
  },

  supersetExercisesList: {
    gap: 0,
  },

  supersetExerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },

  supersetExerciseItemActive: {
    backgroundColor: 'rgba(0, 212, 170, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 170, 0.3)',
  },

  supersetExerciseItemCompleted: {
    opacity: 0.6,
  },

  exerciseNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },

  exerciseNumberText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  exercisePreviewInfo: {
    flex: 1,
  },

  exercisePreviewName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },

  exercisePreviewNameActive: {
    color: '#00D4AA',
  },

  exercisePreviewDetails: {
    fontSize: 14,
    color: '#B0B0C4',
  },

  currentIndicator: {
    padding: 4,
  },

  restBetweenIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },

  restLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 184, 77, 0.2)',
  },

  restBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 184, 77, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginHorizontal: 12,
    gap: 4,
  },

  restBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFB84D',
  },

  roundRestInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    gap: 8,
  },

  roundRestText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4ECDC4',
  },

  // ===== PRÓXIMAS ESTACIONES =====
  upcomingSection: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },

  upcomingTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },

  upcomingList: {
    gap: 8,
  },

  upcomingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },

  upcomingNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  upcomingNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#B0B0C4',
  },

  upcomingInfo: {
    flex: 1,
  },

  upcomingName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },

  upcomingType: {
    fontSize: 12,
    color: '#B0B0C4',
  },

  // ===== ÚLTIMO EJERCICIO =====
  lastExerciseMessage: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },

  lastExerciseText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#00D4AA',
    marginTop: 12,
    marginBottom: 8,
  },

  lastExerciseSubtext: {
    fontSize: 14,
    color: '#B0B0C4',
    textAlign: 'center',
  },

  // ===== REST TIMER MODAL =====
  restTimerModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  restTimerContent: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 24,
    overflow: 'hidden',
  },

  restTimerGradient: {
    padding: 24,
    alignItems: 'center',
  },

  restTimerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },

  restTimerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  restTimerSubtext: {
    fontSize: 16,
    color: '#B0B0C4',
    marginBottom: 20,
    textAlign: 'center',
  },
});