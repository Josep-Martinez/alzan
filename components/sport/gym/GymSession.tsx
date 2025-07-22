// components/sport/GymSession.tsx - Versión mejorada con mejor integración de superseries
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import ExerciseReorderModal from '../ExerciseReorderModal';
import {
  EXERCISE_TYPE_COLORS,
  EXERCISE_TYPE_ICONS,
  EXERCISE_TYPE_TRANSLATIONS,
  ExerciseType,
  GymExercise,
  GymSet,
  SUPERSET_TYPE_CONFIG,
  SuperSet,
  SupersetType,
  createEmptySet,
  getSupersetProgress,
  isSupersetComplete
} from '../common/sports';
import ActiveWorkoutSession from './ActiveWorkoutSession';
import ExerciseSelector from './ExerciseSelector';
import SupersetBuilder from './SupersetBuilder';

/**
 * Interfaz para ejercicio manual
 */
interface ManualExercise {
  id: string;
  name: string;
  muscleGroup?: string;
  specificMuscle?: string;
  equipment?: string;
  difficulty?: string;
  exerciseType?: ExerciseType;
  description?: string;
}

/**
 * Props del componente GymSession
 */
interface GymSessionProps {
  exercises: GymExercise[];
  onUpdateExercises: (exercises: GymExercise[]) => void;
  onStartRestTimer: (duration: number) => void;
  onCompleteWorkout?: () => void;
  isCompleted?: boolean;
  workoutName?: string;
}

/**
 * Componente principal para entrenamientos de gimnasio mejorado
 */
export default function GymSession({ 
  exercises, 
  onUpdateExercises, 
  onStartRestTimer,
  onCompleteWorkout,
  isCompleted = false,
  workoutName = 'Entrenamiento de Gimnasio'
}: GymSessionProps) {
  // ===== ESTADOS PRINCIPALES =====
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [showSupersetBuilder, setShowSupersetBuilder] = useState(false);
  const [openExerciseIdx, setOpenExerciseIdx] = useState<number | null>(null);
  const [superSets, setSuperSets] = useState<SuperSet[]>([]);
  const [showActiveWorkout, setShowActiveWorkout] = useState(false);
  const [showReorderModal, setShowReorderModal] = useState(false);

  /**
   * Añade un nuevo ejercicio individual
   */
  const addExercise = (exercise: ManualExercise) => {
    if (isCompleted) return;
    
    const newGymExercise: GymExercise = {
      id: `gym_ex_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      exerciseId: exercise.id,
      name: exercise.name,
      sets: [createEmptySet(exercise.exerciseType || 'Repeticiones')], // Crear con una serie por defecto
      restTime: '60',
      notes: '',
      muscleGroup: exercise.muscleGroup,
      specificMuscle: exercise.specificMuscle,
      equipment: exercise.equipment,
      difficulty: exercise.difficulty,
      exerciseType: exercise.exerciseType || 'Repeticiones',
      description: exercise.description
    };
    onUpdateExercises([...exercises, newGymExercise]);
  };

  /**
   * Crea una nueva superserie desde el builder
   */
  const createSuperset = (supersetData: {
    name: string;
    type: SupersetType;
    exercises: GymExercise[];
    rounds: number;
    restTime: string;
    restTimeBetweenExercises?: string;
    useTimeForAll?: boolean;
    defaultTime?: string;
  }) => {
    if (isCompleted) return;
    
    const newSuperset: SuperSet = {
      id: `superset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: supersetData.name,
      exercises: supersetData.exercises,
      type: supersetData.type,
      currentRound: 1,
      totalRounds: supersetData.rounds,
      roundCompleted: Array(supersetData.rounds).fill(false),
      restTimeBetweenRounds: supersetData.restTime,
      restTimeBetweenExercises: supersetData.restTimeBetweenExercises,
      currentExerciseIndex: 0,
      useTimeForAll: supersetData.useTimeForAll,
      defaultTime: supersetData.defaultTime
    };
    
    setSuperSets([...superSets, newSuperset]);
    
    // Remover ejercicios individuales que ahora están en superserie
    const exerciseIdsInSuperset = supersetData.exercises.map(ex => ex.id);
    const remainingExercises = exercises.filter(ex => 
      !exerciseIdsInSuperset.includes(ex.id)
    );
    onUpdateExercises(remainingExercises);
    
    setShowSupersetBuilder(false);
  };

  /**
   * Actualiza una superserie
   */
  const updateSuperset = (supersetIdx: number, updatedSuperset: SuperSet) => {
    if (isCompleted) return;
    
    const updatedSuperSets = superSets.map((ss, i) =>
      i === supersetIdx ? updatedSuperset : ss
    );
    setSuperSets(updatedSuperSets);
  };

  /**
   * Elimina una superserie y devuelve sus ejercicios
   */
  const deleteSuperset = (supersetIdx: number) => {
    if (isCompleted) return;
    
    const superset = superSets[supersetIdx];
    if (!superset) return;
    
    Alert.alert(
      "Eliminar Superserie",
      `¿Estás seguro de que quieres eliminar "${superset.name}"? Los ejercicios volverán a la lista individual.`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Eliminar", 
          style: "destructive",
          onPress: () => {
            // Devolver ejercicios a la lista individual
            onUpdateExercises([...exercises, ...superset.exercises]);
            
            // Remover superserie
            setSuperSets(superSets.filter((_, i) => i !== supersetIdx));
          }
        }
      ]
    );
  };

  /**
   * Elimina un ejercicio individual
   */
  const removeExercise = (idx: number) => {
    if (isCompleted) return;
    
    const exercise = exercises[idx];
    Alert.alert(
      "Eliminar Ejercicio",
      `¿Estás seguro de que quieres eliminar "${exercise.name}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Eliminar", 
          style: "destructive",
          onPress: () => {
            onUpdateExercises(exercises.filter((_, i) => i !== idx));
          }
        }
      ]
    );
  };

  /**
   * Maneja el reordenamiento de ejercicios desde el modal
   */
  const handleReorderExercises = (reorderedExercises: GymExercise[]) => {
    onUpdateExercises(reorderedExercises);
    setShowReorderModal(false);
  };
  /**
   * Actualiza un ejercicio específico
   */
  const updateExercise = (idx: number, updatedExercise: GymExercise) => {
    if (isCompleted) return;
    
    const updatedExercises = exercises.map((ex, i) =>
      i === idx ? updatedExercise : ex
    );
    onUpdateExercises(updatedExercises);
  };

  /**
   * Añade una serie a un ejercicio
   */
  const addSet = (idx: number) => {
    if (isCompleted) return;
    
    const exercise = exercises[idx];
    const lastSet = exercise.sets[exercise.sets.length - 1];
    
    // Crear nueva serie basada en la anterior o vacía
    const newSet = lastSet ? {
      ...createEmptySet(exercise.exerciseType || 'Repeticiones'),
      reps: lastSet.reps,
      weight: lastSet.weight,
      duration: lastSet.duration
    } : createEmptySet(exercise.exerciseType || 'Repeticiones');
    
    const updatedExercise = {
      ...exercise,
      sets: [...exercise.sets, newSet]
    };
    updateExercise(idx, updatedExercise);
  };

  /**
   * Actualiza una serie específica
   */
  const updateSet = (exIdx: number, setIdx: number, field: keyof GymSet, val: string | boolean | number) => {
    if (isCompleted) return;
    
    const exercise = exercises[exIdx];
    const updatedSets = exercise.sets.map((s, j) =>
      j === setIdx ? { ...s, [field]: val } : s
    );
    
    const updatedExercise = { ...exercise, sets: updatedSets };
    updateExercise(exIdx, updatedExercise);
  };

  /**
   * Elimina una serie específica
   */
  const removeSet = (exIdx: number, setIdx: number) => {
    if (isCompleted) return;
    
    const exercise = exercises[exIdx];
    if (exercise.sets.length <= 1) return; // No permitir eliminar la única serie
    
    const updatedSets = exercise.sets.filter((_, j) => j !== setIdx);
    const updatedExercise = { ...exercise, sets: updatedSets };
    updateExercise(exIdx, updatedExercise);
  };

  /**
   * Duplica una serie
   */
  const duplicateSet = (exIdx: number, setIdx: number) => {
    if (isCompleted) return;
    
    const exercise = exercises[exIdx];
    const setToDuplicate = exercise.sets[setIdx];
    const duplicatedSet = { 
      ...setToDuplicate, 
      completed: false,
      actualDuration: undefined 
    };
    
    const updatedSets = [
      ...exercise.sets.slice(0, setIdx + 1),
      duplicatedSet,
      ...exercise.sets.slice(setIdx + 1)
    ];
    
    const updatedExercise = { ...exercise, sets: updatedSets };
    updateExercise(exIdx, updatedExercise);
  };

  /**
   * Abre la pantalla de entrenamiento activo
   */
  const startActiveWorkout = () => {
    if (isCompleted) return;
    
    const hasExercisesReady = exercises.some(ex => ex.sets.length > 0) || 
                             superSets.some(ss => ss.exercises.every(ex => ex.sets.length > 0));
    
    if (!hasExercisesReady) {
      Alert.alert(
        "Entrenamiento vacío",
        "Añade ejercicios y configura al menos una serie antes de comenzar el entrenamiento.",
        [{ text: "Entendido" }]
      );
      return;
    }
    
    setShowActiveWorkout(true);
  };

  /**
   * Calcula estadísticas del entrenamiento
   */
  const getWorkoutStats = () => {
    const individualSets = exercises.reduce((total, ex) => total + ex.sets.length, 0);
    const supersetSets = superSets.reduce((total, ss) => total + ss.totalRounds, 0);
    const totalSets = individualSets + supersetSets;
    
    const completedIndividualSets = exercises.reduce((total, ex) => 
      total + ex.sets.filter(set => set.completed).length, 0
    );
    const completedSupersetRounds = superSets.reduce((total, ss) => 
      total + ss.roundCompleted.filter(completed => completed).length, 0
    );
    const completedSets = completedIndividualSets + completedSupersetRounds;
    
    const progressPercentage = totalSets > 0 ? (completedSets / totalSets) * 100 : 0;
    
    return {
      totalExercises: exercises.length,
      totalSupersets: superSets.length,
      totalSets,
      completedSets,
      progressPercentage
    };
  };

  const stats = getWorkoutStats();

  return (
    <View style={styles.container}>
      {/* ===== ESTADÍSTICAS Y BOTÓN INICIAR ===== */}
      {(exercises.length > 0 || superSets.length > 0) && (
        <View style={styles.workoutHeader}>
          <LinearGradient
            colors={
              isCompleted 
                ? ["rgba(0, 212, 170, 0.2)", "rgba(0, 184, 148, 0.1)"]
                : ["#2D2D5F", "#3D3D7F"]
            }
            style={styles.workoutHeaderGradient}
          >
            {/* Estadísticas */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.totalExercises + stats.totalSupersets}</Text>
                <Text style={styles.statLabel}>Ejercicios</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.completedSets}/{stats.totalSets}</Text>
                <Text style={styles.statLabel}>Series</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{Math.round(stats.progressPercentage)}%</Text>
                <Text style={styles.statLabel}>Progreso</Text>
              </View>
            </View>

            {/* Barra de progreso */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBackground}>
                <View 
                  style={[
                    styles.progressBar, 
                    { width: `${stats.progressPercentage}%` }
                  ]} 
                />
              </View>
            </View>

            {/* Botón iniciar entrenamiento */}
            {!isCompleted && (
              <Pressable onPress={startActiveWorkout} style={styles.startWorkoutBtn}>
                <LinearGradient
                  colors={["#00D4AA", "#00B894"]}
                  style={styles.startWorkoutGradient}
                >
                  <MaterialCommunityIcons name="play-circle" size={24} color="#FFFFFF" />
                  <Text style={styles.startWorkoutText}>Iniciar Entrenamiento</Text>
                  <MaterialCommunityIcons name="chevron-right" size={20} color="#FFFFFF" />
                </LinearGradient>
              </Pressable>
            )}

            {/* Mensaje de completado */}
            {isCompleted && (
              <View style={styles.completedBadge}>
                <MaterialCommunityIcons name="trophy" size={20} color="#00D4AA" />
                <Text style={styles.completedText}>Entrenamiento Completado</Text>
              </View>
            )}
          </LinearGradient>
        </View>
      )}

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* ===== SUPERSERIES Y CIRCUITOS ===== */}
        {superSets.map((superset, ssIdx) => {
          const typeConfig = SUPERSET_TYPE_CONFIG[superset.type];
          const progress = getSupersetProgress(superset);
          const isComplete = isSupersetComplete(superset);
          
          return (
            <View key={superset.id} style={styles.supersetCard}>
              <LinearGradient
                colors={
                  isCompleted || isComplete
                    ? [typeConfig.color + '40', typeConfig.color + '20']
                    : [typeConfig.color + '33', typeConfig.color + '1A']
                }
                style={styles.supersetGradient}
              >
                {/* Header de la superserie */}
                <View style={styles.supersetHeader}>
                  <View style={styles.supersetHeaderLeft}>
                    <View style={[styles.supersetIcon, { backgroundColor: typeConfig.color }]}>
                      <MaterialCommunityIcons
                        name={typeConfig.icon as any}
                        size={20}
                        color="#FFFFFF"
                      />
                    </View>
                    <View style={styles.supersetInfo}>
                      <Text style={styles.supersetName}>{superset.name}</Text>
                      <Text style={styles.supersetType}>{typeConfig.name}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.supersetHeaderRight}>
                    <View style={styles.supersetStats}>
                      <Text style={styles.supersetProgress}>{Math.round(progress)}%</Text>
                      <Text style={styles.supersetProgressLabel}>Progreso</Text>
                    </View>
                    {!isCompleted && (
                      <Pressable
                        onPress={() => deleteSuperset(ssIdx)}
                        style={styles.deleteBtn}
                      >
                        <MaterialCommunityIcons name="trash-can" size={20} color="#FF6B6B" />
                      </Pressable>
                    )}
                  </View>
                </View>

                {/* Progreso de rondas */}
                <View style={styles.roundsProgress}>
                  <View style={styles.roundsIndicators}>
                    {Array.from({ length: superset.totalRounds }).map((_, idx) => (
                      <View
                        key={idx}
                        style={[
                          styles.roundIndicator,
                          superset.roundCompleted[idx] && styles.roundIndicatorCompleted,
                          idx === superset.currentRound - 1 && styles.roundIndicatorCurrent
                        ]}
                      >
                        <Text style={[
                          styles.roundIndicatorText,
                          superset.roundCompleted[idx] && styles.roundIndicatorTextCompleted
                        ]}>
                          {idx + 1}
                        </Text>
                      </View>
                    ))}
                  </View>
                  <Text style={styles.roundsLabel}>
                    Ronda {superset.currentRound} de {superset.totalRounds}
                  </Text>
                </View>

                {/* Lista de ejercicios */}
                <View style={styles.supersetExercisesList}>
                  {superset.exercises.map((exercise, exIdx) => (
                    <View key={exercise.id} style={styles.supersetExerciseItem}>
                      <View style={styles.supersetExerciseHeader}>
                        <Text style={styles.supersetExerciseNumber}>
                          {String.fromCharCode(65 + exIdx)}.
                        </Text>
                        <Text style={styles.supersetExerciseName}>
                          {exercise.name}
                        </Text>
                        <View style={styles.supersetExerciseType}>
                          <MaterialCommunityIcons 
                            name={EXERCISE_TYPE_ICONS[exercise.exerciseType || 'Repeticiones'] as any}
                            size={12} 
                            color={EXERCISE_TYPE_COLORS[exercise.exerciseType || 'Repeticiones']} 
                          />
                          <Text style={[styles.supersetExerciseTypeText, { 
                            color: EXERCISE_TYPE_COLORS[exercise.exerciseType || 'Repeticiones'] 
                          }]}>
                            {EXERCISE_TYPE_TRANSLATIONS[exercise.exerciseType || 'Repeticiones']}
                          </Text>
                        </View>
                      </View>
                      
                      {/* Configuración del ejercicio */}
                      <View style={styles.supersetExerciseConfig}>
                        {exercise.sets.map((set, setIdx) => (
                          <Text key={setIdx} style={styles.supersetSetConfig}>
                            {exercise.exerciseType === 'Tiempo' 
                              ? `⏱️ ${set.duration}s${set.weight ? ` • ${set.weight}kg` : ''}`
                              : `${set.reps} reps${set.weight ? ` • ${set.weight}kg` : ''}`
                            }
                          </Text>
                        ))}
                      </View>
                    </View>
                  ))}
                </View>

                {/* Información de descanso */}
                <View style={styles.supersetRestInfo}>
                  <View style={styles.restInfoItem}>
                    <MaterialCommunityIcons name="refresh" size={14} color="#4ECDC4" />
                    <Text style={styles.restInfoText}>
                      Entre rondas: {superset.restTimeBetweenRounds}s
                    </Text>
                  </View>
                  {superset.restTimeBetweenExercises && parseInt(superset.restTimeBetweenExercises) > 0 && (
                    <View style={styles.restInfoItem}>
                      <MaterialCommunityIcons name="timer" size={14} color="#FFB84D" />
                      <Text style={styles.restInfoText}>
                        Entre ejercicios: {superset.restTimeBetweenExercises}s
                      </Text>
                    </View>
                  )}
                </View>
              </LinearGradient>
            </View>
          );
        })}

        {/* ===== EJERCICIOS INDIVIDUALES ===== */}
        {exercises.map((exercise, idx) => (
          <View key={exercise.id} style={styles.exerciseCard}>
            <LinearGradient
              colors={
                isCompleted 
                  ? ["rgba(0, 212, 170, 0.15)", "rgba(0, 184, 148, 0.1)"]
                  : ["#2D2D5F", "#3D3D7F"]
              }
              style={styles.exerciseGradient}
            >
              {/* Header del ejercicio */}
              <Pressable
                style={styles.exerciseHeader}
                onPress={() => setOpenExerciseIdx(openExerciseIdx === idx ? null : idx)}
              >
                <View style={styles.exerciseHeaderLeft}>
                  <View style={[styles.exerciseIcon, { 
                    backgroundColor: EXERCISE_TYPE_COLORS[exercise.exerciseType || 'Repeticiones'] 
                  }]}>
                    <MaterialCommunityIcons 
                      name={EXERCISE_TYPE_ICONS[exercise.exerciseType || 'Repeticiones'] as any}
                      size={16} 
                      color="#FFFFFF" 
                    />
                  </View>
                  <View style={styles.exerciseInfo}>
                    <Text style={[styles.exerciseName, isCompleted && styles.exerciseNameCompleted]}>
                      {exercise.name}
                    </Text>
                    <View style={styles.exerciseMetadata}>
                      <Text style={styles.exerciseStats}>
                        {exercise.sets.length} {exercise.sets.length === 1 ? "serie" : "series"}
                        {exercise.sets.length > 0 &&
                          ` • ${exercise.sets.filter((s) => s.completed).length} completadas`}
                      </Text>
                      {(exercise.muscleGroup || exercise.specificMuscle) && (
                        <View style={styles.muscleInfo}>
                          {exercise.muscleGroup && (
                            <Text style={styles.primaryMuscleTag}>
                              {exercise.muscleGroup}
                            </Text>
                          )}
                          {exercise.specificMuscle && (
                            <Text style={styles.secondaryMuscleTag}>
                              {exercise.specificMuscle}
                            </Text>
                          )}
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                <View style={styles.exerciseHeaderRight}>
                  {!isCompleted && (
                    <Pressable
                      onPress={() => removeExercise(idx)}
                      style={styles.deleteBtn}
                    >
                      <MaterialCommunityIcons name="trash-can" size={20} color="#FF6B6B" />
                    </Pressable>
                  )}
                  
                  <MaterialCommunityIcons
                    name={openExerciseIdx === idx ? "chevron-up" : "chevron-down"}
                    size={24}
                    color="#B0B0C4"
                  />
                </View>
              </Pressable>

              {/* Contenido expandido del ejercicio */}
              {openExerciseIdx === idx && (
                <View style={styles.exerciseBody}>
                  {/* Tiempo de descanso */}
                  <View style={styles.restTimeContainer}>
                    <MaterialCommunityIcons name="timer" size={16} color="#FFB84D" />
                    <Text style={styles.restTimeLabel}>Descanso:</Text>
                    <TextInput
                      value={exercise.restTime || "60"}
                      onChangeText={(val) => {
                        const updatedExercise = { ...exercise, restTime: val };
                        updateExercise(idx, updatedExercise);
                      }}
                      keyboardType="numeric"
                      style={[styles.restTimeInput, isCompleted && styles.inputDisabled]}
                      editable={!isCompleted}
                    />
                    <Text style={styles.restTimeUnit}>seg</Text>
                  </View>

                  {/* Series */}
                  <View style={styles.setsContainer}>
                    <Text style={styles.setsTitle}>Series</Text>
                    {exercise.sets.map((set, setIdx) => (
                      <View key={setIdx} style={styles.setRow}>
                        <LinearGradient
                          colors={
                            set.completed
                              ? ["rgba(0, 212, 170, 0.3)", "rgba(0, 184, 148, 0.2)"]
                              : ["rgba(255,255,255,0.05)", "rgba(255,255,255,0.02)"]
                          }
                          style={styles.setRowGradient}
                        >
                          <View style={styles.setHeader}>
                            <Text style={[styles.setNumber, set.completed && styles.setNumberCompleted]}>
                              {setIdx + 1}
                            </Text>
                            {set.completed && (
                              <MaterialCommunityIcons name="check-circle" size={16} color="#00D4AA" />
                            )}
                          </View>

                          <View style={styles.setInputs}>
                            {exercise.exerciseType === 'Tiempo' ? (
                              <>
                                <View style={styles.inputGroup}>
                                  <Text style={styles.inputLabel}>Tiempo</Text>
                                  <TextInput
                                    value={set.duration || ''}
                                    onChangeText={(v) => updateSet(idx, setIdx, "duration", v)}
                                    keyboardType="numeric"
                                    style={[styles.setInput, isCompleted && styles.inputDisabled]}
                                    editable={!isCompleted}
                                    placeholder="45"
                                  />
                                  <Text style={styles.inputUnit}>s</Text>
                                </View>
                                
                                <View style={styles.inputGroup}>
                                  <Text style={styles.inputLabel}>Peso</Text>
                                  <TextInput
                                    value={set.weight || ''}
                                    onChangeText={(v) => updateSet(idx, setIdx, "weight", v)}
                                    keyboardType="numeric"
                                    style={[styles.setInput, isCompleted && styles.inputDisabled]}
                                    editable={!isCompleted}
                                    placeholder="0"
                                  />
                                  <Text style={styles.inputUnit}>kg</Text>
                                </View>
                              </>
                            ) : (
                              <>
                                <View style={styles.inputGroup}>
                                  <Text style={styles.inputLabel}>Reps</Text>
                                  <TextInput
                                    value={set.reps || ''}
                                    onChangeText={(v) => updateSet(idx, setIdx, "reps", v)}
                                    keyboardType="numeric"
                                    style={[styles.setInput, isCompleted && styles.inputDisabled]}
                                    editable={!isCompleted}
                                    placeholder="12"
                                  />
                                </View>

                                <View style={styles.inputGroup}>
                                  <Text style={styles.inputLabel}>Peso</Text>
                                  <TextInput
                                    value={set.weight || ''}
                                    onChangeText={(v) => updateSet(idx, setIdx, "weight", v)}
                                    keyboardType="numeric"
                                    style={[styles.setInput, isCompleted && styles.inputDisabled]}
                                    editable={!isCompleted}
                                    placeholder="20"
                                  />
                                  <Text style={styles.inputUnit}>kg</Text>
                                </View>
                              </>
                            )}
                          </View>

                          {!isCompleted && (
                            <View style={styles.setActions}>
                              <Pressable
                                onPress={() => duplicateSet(idx, setIdx)}
                                style={styles.setActionBtn}
                              >
                                <MaterialCommunityIcons name="content-copy" size={16} color="#4ECDC4" />
                              </Pressable>
                              {exercise.sets.length > 1 && (
                                <Pressable
                                  onPress={() => removeSet(idx, setIdx)}
                                  style={styles.setActionBtn}
                                >
                                  <MaterialCommunityIcons name="close" size={16} color="#FF6B6B" />
                                </Pressable>
                              )}
                            </View>
                          )}
                        </LinearGradient>
                      </View>
                    ))}

                    {/* Botón añadir serie */}
                    {!isCompleted && (
                      <Pressable onPress={() => addSet(idx)} style={styles.addSetBtn}>
                        <MaterialCommunityIcons name="plus" size={16} color="#00D4AA" />
                        <Text style={styles.addSetText}>Añadir Serie</Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              )}
            </LinearGradient>
          </View>
        ))}

        {/* ===== BOTONES DE ACCIÓN ===== */}
        {!isCompleted && (
          <View style={styles.actionButtons}>
            {/* Botón reordenar ejercicios */}
            {exercises.length > 1 && (
              <Pressable 
                onPress={() => setShowReorderModal(true)}
                style={styles.actionBtn}
              >
                <MaterialCommunityIcons 
                  name="sort" 
                  size={20} 
                  color="#FFB84D" 
                />
                <Text style={styles.actionBtnText}>Reordenar</Text>
              </Pressable>
            )}
            
            <Pressable 
              onPress={() => setShowExerciseSelector(true)} 
              style={styles.actionBtn}
            >
              <MaterialCommunityIcons name="plus" size={20} color="#FFB84D" />
              <Text style={styles.actionBtnText}>Añadir Ejercicio</Text>
            </Pressable>

            {exercises.length >= 2 && (
              <Pressable 
                onPress={() => setShowSupersetBuilder(true)} 
                style={styles.actionBtn}
              >
                <MaterialCommunityIcons name="lightning-bolt" size={20} color="#FF6B6B" />
                <Text style={styles.actionBtnText}>Crear Superserie</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* ===== ESTADO VACÍO ===== */}
        {exercises.length === 0 && superSets.length === 0 && (
          <View style={styles.emptyState}>
            <LinearGradient
              colors={
                isCompleted 
                  ? ["rgba(0, 212, 170, 0.2)", "rgba(0, 184, 148, 0.1)"]
                  : ["#2D2D5F", "#3D3D7F"]
              }
              style={styles.emptyStateGradient}
            >
              <MaterialCommunityIcons
                name={isCompleted ? "check-circle" : "dumbbell"}
                size={48}
                color={isCompleted ? "#00D4AA" : "#B0B0C4"}
              />
              <Text style={styles.emptyTitle}>
                {isCompleted ? "Entrenamiento Vacío" : "¡Comienza tu entrenamiento!"}
              </Text>
              <Text style={styles.emptySubtitle}>
                {isCompleted 
                  ? "Este entrenamiento se completó sin ejercicios."
                  : "Añade ejercicios individuales o crea superseries/circuitos"
                }
              </Text>
            </LinearGradient>
          </View>
        )}
      </ScrollView>

      {/* ===== MODALES ===== */}
      
      {/* Modal selector de ejercicios */}
      {!isCompleted && (
        <ExerciseSelector
          visible={showExerciseSelector}
          onClose={() => setShowExerciseSelector(false)}
          onSelectExercise={addExercise}
        />
      )}

      {/* Modal constructor de superseries */}
      {!isCompleted && (
        <SupersetBuilder
          visible={showSupersetBuilder}
          exercises={exercises}
          onClose={() => setShowSupersetBuilder(false)}
          onCreateSuperset={createSuperset}
        />
      )}

      {/* Modal de reordenamiento de ejercicios */}
      {!isCompleted && (
        <ExerciseReorderModal
          visible={showReorderModal}
          exercises={exercises}
          onClose={() => setShowReorderModal(false)}
          onReorder={handleReorderExercises}
          title="Reordenar Ejercicios"
        />
      )}

      {/* Pantalla de entrenamiento activo */}
      {!isCompleted && (
        <ActiveWorkoutSession
          visible={showActiveWorkout}
          exercises={exercises}
          supersets={superSets}
          workoutName={workoutName}
          onUpdateExercises={onUpdateExercises}
          onUpdateSuperset={updateSuperset}
          onCompleteWorkout={() => {
            setShowActiveWorkout(false);
            onCompleteWorkout?.();
          }}
          onClose={() => setShowActiveWorkout(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  scrollContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },

  // ===== HEADER DEL ENTRENAMIENTO =====
  workoutHeader: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },

  workoutHeaderGradient: {
    padding: 20,
    borderRadius: 20,
  },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },

  statItem: {
    alignItems: 'center',
  },

  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#00D4AA',
  },

  statLabel: {
    fontSize: 12,
    color: '#B0B0C4',
    marginTop: 4,
  },

  progressContainer: {
    marginBottom: 16,
  },

  progressBackground: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
  },

  progressBar: {
    height: 8,
    backgroundColor: '#00D4AA',
    borderRadius: 4,
  },

  startWorkoutBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },

  startWorkoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 12,
  },

  startWorkoutText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },

  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },

  completedText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#00D4AA',
  },

  // ===== SUPERSERIES =====
  supersetCard: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },

  supersetGradient: {
    padding: 20,
    borderRadius: 20,
  },

  supersetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  supersetHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },

  supersetIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  supersetInfo: {
    flex: 1,
  },

  supersetName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },

  supersetType: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
  },

  supersetHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  supersetStats: {
    alignItems: 'center',
  },

  supersetProgress: {
    fontSize: 16,
    fontWeight: '700',
    color: '#00D4AA',
  },

  supersetProgressLabel: {
    fontSize: 10,
    color: '#B0B0C4',
  },

  roundsProgress: {
    alignItems: 'center',
    marginBottom: 16,
  },

  roundsIndicators: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },

  roundIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },

  roundIndicatorCompleted: {
    backgroundColor: '#00D4AA',
    borderColor: '#00D4AA',
  },

  roundIndicatorCurrent: {
    backgroundColor: '#FFB84D',
    borderColor: '#FFB84D',
  },

  roundIndicatorText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#B0B0C4',
  },

  roundIndicatorTextCompleted: {
    color: '#FFFFFF',
  },

  roundsLabel: {
    fontSize: 12,
    color: '#B0B0C4',
    fontWeight: '600',
  },

  supersetExercisesList: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },

  supersetExerciseItem: {
    marginBottom: 12,
  },

  supersetExerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },

  supersetExerciseNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFB84D',
    minWidth: 24,
  },

  supersetExerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },

  supersetExerciseType: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },

  supersetExerciseTypeText: {
    fontSize: 10,
    fontWeight: '600',
  },

  supersetExerciseConfig: {
    marginLeft: 32,
    gap: 4,
  },

  supersetSetConfig: {
    fontSize: 12,
    color: '#B0B0C4',
    fontWeight: '500',
  },

  supersetRestInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
  },

  restInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  restInfoText: {
    fontSize: 12,
    color: '#B0B0C4',
    fontWeight: '600',
  },

  // ===== EJERCICIOS INDIVIDUALES =====
  exerciseCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 12,
  },

  exerciseGradient: {
    borderRadius: 20,
  },

  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },

  exerciseHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },

  exerciseIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },

  exerciseInfo: {
    flex: 1,
  },

  exerciseName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },

  exerciseNameCompleted: {
    color: '#00D4AA',
  },

  exerciseMetadata: {
    gap: 8,
  },

  exerciseStats: {
    fontSize: 14,
    color: '#B0B0C4',
  },

  muscleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },

  primaryMuscleTag: {
    fontSize: 11,
    fontWeight: '600',
    color: '#00D4AA',
    backgroundColor: 'rgba(0, 212, 170, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },

  secondaryMuscleTag: {
    fontSize: 10,
    fontWeight: '500',
    color: '#4ECDC4',
    backgroundColor: 'rgba(78, 205, 196, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },

  exerciseHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  deleteBtn: {
    padding: 4,
  },

  exerciseBody: {
    padding: 16,
    paddingTop: 0,
    gap: 16,
  },

  restTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 184, 77, 0.1)',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },

  restTimeLabel: {
    fontSize: 14,
    color: '#FFB84D',
    fontWeight: '600',
  },

  restTimeInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    color: '#FFFFFF',
    fontSize: 14,
    minWidth: 40,
    textAlign: 'center',
  },

  restTimeUnit: {
    fontSize: 14,
    color: '#FFB84D',
  },

  inputDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: '#6B7280',
  },

  setsContainer: {
    gap: 8,
  },

  setsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },

  setRow: {
    borderRadius: 12,
    overflow: 'hidden',
  },

  setRowGradient: {
    padding: 12,
    borderRadius: 12,
  },

  setHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },

  setNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#B0B0C4',
  },

  setNumberCompleted: {
    color: '#FFFFFF',
  },

  setInputs: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    flex: 1,
  },

  inputGroup: {
    flex: 1,
  },

  inputLabel: {
    fontSize: 12,
    color: '#B0B0C4',
    marginBottom: 4,
    fontWeight: '600',
  },

  setInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
  },

  inputUnit: {
    fontSize: 12,
    color: '#B0B0C4',
    marginTop: 4,
    textAlign: 'center',
  },

  setActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 12,
  },

  setActionBtn: {
    padding: 4,
  },

  addSetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 212, 170, 0.1)',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 170, 0.3)',
    borderStyle: 'dashed',
  },

  addSetText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00D4AA',
  },

  // ===== BOTONES DE ACCIÓN =====
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
    marginBottom: 20,
  },

  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 184, 77, 0.1)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 77, 0.3)',
    gap: 8,
    minWidth: 100,
  },

  actionBtnActive: {
    backgroundColor: 'rgba(0, 212, 170, 0.2)',
    borderColor: 'rgba(0, 212, 170, 0.5)',
  },

  actionBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFB84D',
  },

  actionBtnTextActive: {
    color: '#00D4AA',
  },

  // ===== ESTADO VACÍO =====
  emptyState: {
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },

  emptyStateGradient: {
    padding: 40,
    alignItems: 'center',
    borderRadius: 20,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },

  emptySubtitle: {
    fontSize: 14,
    color: '#B0B0C4',
    textAlign: 'center',
  },
});