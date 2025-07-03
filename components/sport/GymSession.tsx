// components/sport/GymSession.tsx - Versión mejorada sin constructor avanzado
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import ExerciseSelector from './ExerciseSelector';
import SupersetBuilder from './SupersetBuilder';
import { GymExercise, GymSet } from './sports';

/**
 * Interfaz para ejercicio manual
 */
interface ManualExercise {
  id: string;
  name: string;
}

/**
 * Interfaz para superseries mejorada
 */
interface SuperSet {
  id: string;
  name: string;
  exercises: GymExercise[];
  restTime: string;
  type: 'superset' | 'circuit' | 'triset';
  currentRound: number;
  totalRounds: number;
  roundCompleted: boolean[];
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
}

/**
 * Componente principal para entrenamientos de gimnasio
 * Maneja ejercicios individuales y superseries con UI mejorada
 */
export default function GymSession({ 
  exercises, 
  onUpdateExercises, 
  onStartRestTimer,
  onCompleteWorkout,
  isCompleted = false
}: GymSessionProps) {
  // ===== ESTADOS PRINCIPALES =====
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [showSupersetBuilder, setShowSupersetBuilder] = useState(false);
  const [openExerciseIdx, setOpenExerciseIdx] = useState<number | null>(null);
  const [superSets, setSuperSets] = useState<SuperSet[]>([]);

  /**
   * Añade un nuevo ejercicio individual
   */
  const addExercise = (exercise: ManualExercise) => {
    if (isCompleted) return;
    
    const newGymExercise: GymExercise = {
      id: `gym_ex_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      exerciseId: exercise.id,
      name: exercise.name,
      sets: [],
      restTime: '60',
      notes: ''
    };
    onUpdateExercises([...exercises, newGymExercise]);
  };

  /**
   * Crea una nueva superserie desde el builder
   */
  const createSuperset = (supersetData: {
    name: string;
    type: 'superset' | 'circuit' | 'triset';
    exercises: GymExercise[];
    rounds: number;
    restTime: string;
  }) => {
    if (isCompleted) return;
    
    const newSuperset: SuperSet = {
      id: `superset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: supersetData.name,
      exercises: supersetData.exercises,
      restTime: supersetData.restTime,
      type: supersetData.type,
      currentRound: 1,
      totalRounds: supersetData.rounds,
      roundCompleted: Array(supersetData.rounds).fill(false)
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
   * Completa una ronda de superserie
   */
  const completeRound = (supersetIdx: number) => {
    if (isCompleted) return;
    
    const superset = superSets[supersetIdx];
    const currentRound = superset.currentRound - 1; // Array es 0-indexed
    
    // Verificar que todos los ejercicios tienen configuración mínima
    const allExercisesConfigured = superset.exercises.every(ex => 
      ex.sets.length > 0 && ex.sets[0].reps && ex.sets[0].weight
    );
    
    if (!allExercisesConfigured) {
      return; // No completar si faltan datos
    }
    
    const updatedSuperSets = superSets.map((ss, i) => {
      if (i === supersetIdx) {
        const newRoundCompleted = [...ss.roundCompleted];
        newRoundCompleted[currentRound] = true;
        
        const nextRound = ss.currentRound < ss.totalRounds ? ss.currentRound + 1 : ss.currentRound;
        
        return {
          ...ss,
          roundCompleted: newRoundCompleted,
          currentRound: nextRound
        };
      }
      return ss;
    });
    
    setSuperSets(updatedSuperSets);
    
    // Iniciar timer de descanso si no es la última ronda
    if (superset.currentRound < superset.totalRounds) {
      const restTime = parseInt(superset.restTime || '90');
      onStartRestTimer(restTime);
    }
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
   * Elimina una superserie y devuelve ejercicios a la lista individual
   */
  const deleteSuperset = (supersetIdx: number) => {
    if (isCompleted) return;
    
    const superset = superSets[supersetIdx];
    
    // Devolver ejercicios a la lista individual
    onUpdateExercises([...exercises, ...superset.exercises]);
    
    // Remover superserie
    setSuperSets(superSets.filter((_, i) => i !== supersetIdx));
  };

  /**
   * Elimina un ejercicio individual
   */
  const removeExercise = (idx: number) => {
    if (isCompleted) return;
    onUpdateExercises(exercises.filter((_, i) => i !== idx));
  };

  /**
   * Añade una serie a un ejercicio
   */
  const addSet = (idx: number) => {
    if (isCompleted) return;
    
    const updatedExercises = exercises.map((ex, i) =>
      i === idx
        ? { ...ex, sets: [...ex.sets, { reps: '', weight: '', completed: false }] }
        : ex
    );
    onUpdateExercises(updatedExercises);
  };

  /**
   * Actualiza una serie específica
   */
  const updateSet = (exIdx: number, setIdx: number, field: keyof GymSet, val: string | boolean) => {
    if (isCompleted) return;
    
    const updatedExercises = exercises.map((ex, i) =>
      i === exIdx
        ? {
            ...ex,
            sets: ex.sets.map((s, j) =>
              j === setIdx ? { ...s, [field]: val } : s
            ),
          }
        : ex
    );
    onUpdateExercises(updatedExercises);

    // Iniciar timer de descanso al completar serie
    if (field === 'completed' && val === true && !isCompleted) {
      const exercise = exercises[exIdx];
      const restTime = parseInt(exercise.restTime || '60');
      onStartRestTimer(restTime);
    }
  };

  /**
   * Elimina una serie específica
   */
  const removeSet = (exIdx: number, setIdx: number) => {
    if (isCompleted) return;
    
    const updatedExercises = exercises.map((ex, i) =>
      i === exIdx
        ? { ...ex, sets: ex.sets.filter((_, j) => j !== setIdx) }
        : ex
    );
    onUpdateExercises(updatedExercises);
  };

  /**
   * Actualiza el tiempo de descanso de un ejercicio
   */
  const updateRestTime = (idx: number, restTime: string) => {
    if (isCompleted) return;
    
    const updatedExercises = exercises.map((ex, i) =>
      i === idx ? { ...ex, restTime } : ex
    );
    onUpdateExercises(updatedExercises);
  };

  /**
   * Verifica si el entrenamiento está listo para completar
   */
  const isWorkoutReadyToComplete = () => {
    // Verificar ejercicios individuales
    const exercisesReady = exercises.length === 0 || exercises.every(ex => 
      ex.sets.length > 0 && ex.sets.every(set => 
        set.reps.trim() !== '' && set.weight.trim() !== ''
      )
    );
    
    // Verificar superseries
    const supersetsReady = superSets.length === 0 || superSets.every(ss =>
      ss.exercises.every(ex => 
        ex.sets.length > 0 && ex.sets.every(set => 
          set.reps.trim() !== '' && set.weight.trim() !== ''
        )
      )
    );
    
    return exercisesReady && supersetsReady && (exercises.length > 0 || superSets.length > 0);
  };

  /**
   * Completa el entrenamiento con validación mejorada
   */
  const handleCompleteWorkout = () => {
    if (!isWorkoutReadyToComplete() || isCompleted) return;
    onCompleteWorkout?.();
  };

  // ===== CÁLCULOS DE ESTADÍSTICAS =====
  const totalSets = exercises.reduce((total, ex) => total + ex.sets.length, 0) + 
                   superSets.reduce((total, ss) => total + ss.totalRounds, 0);
                   
  const completedSets = exercises.reduce((total, ex) => 
    total + ex.sets.filter(set => set.completed).length, 0
  ) + superSets.reduce((total, ss) => 
    total + ss.roundCompleted.filter(completed => completed).length, 0
  );
  
  const progressPercentage = totalSets > 0 ? (completedSets / totalSets) * 100 : 0;
  const workoutReady = isWorkoutReadyToComplete();

  return (
    <View style={styles.container}>
      {/* ===== ESTADÍSTICAS DEL ENTRENAMIENTO ===== */}
      {(exercises.length > 0 || superSets.length > 0) && (
        <View style={styles.statsContainer}>
          <LinearGradient
            colors={
              isCompleted 
                ? ["rgba(0, 212, 170, 0.2)", "rgba(0, 184, 148, 0.1)"]
                : ["#2D2D5F", "#3D3D7F"]
            }
            style={styles.statsGradient}
          >
            <View style={styles.statsHeader}>
              <MaterialCommunityIcons 
                name={isCompleted ? "trophy" : "chart-line"} 
                size={20} 
                color="#00D4AA" 
              />
              <Text style={styles.statsTitle}>
                {isCompleted ? "Entrenamiento Completado" : "Progreso del Entrenamiento"}
              </Text>
            </View>
            
            <View style={styles.statsContent}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{exercises.length + superSets.length}</Text>
                <Text style={styles.statLabel}>Ejercicios</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{completedSets}/{totalSets}</Text>
                <Text style={styles.statLabel}>Series</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{Math.round(progressPercentage)}%</Text>
                <Text style={styles.statLabel}>Completado</Text>
              </View>
            </View>

            {/* Barra de progreso */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBackground}>
                <View 
                  style={[
                    styles.progressBar, 
                    { 
                      width: `${progressPercentage}%`,
                      backgroundColor: isCompleted ? '#00D4AA' : '#00D4AA'
                    }
                  ]} 
                />
              </View>
            </View>

            {/* Mensaje de completado */}
            {isCompleted && (
              <View style={styles.completedMessage}>
                <Text style={styles.completedMessageText}>
                  ✅ Este entrenamiento ya fue completado. Los datos se muestran en modo solo lectura.
                </Text>
              </View>
            )}
          </LinearGradient>
        </View>
      )}

      {/* ===== SUPERSERIES ===== */}
      {superSets.map((superset, ssIdx) => (
        <View key={superset.id} style={styles.supersetCard}>
          <LinearGradient
            colors={[
              getSupersetColor(superset.type) + '33',
              getSupersetColor(superset.type) + '1A'
            ]}
            style={styles.supersetGradient}
          >
            {/* Header de la superserie */}
            <View style={styles.supersetHeader}>
              <View style={styles.supersetInfo}>
                <MaterialCommunityIcons
                  name={getSupersetIcon(superset.type) as any}
                  size={20}
                  color={getSupersetColor(superset.type)}
                />
                <Text style={styles.supersetName}>{superset.name}</Text>
                <View style={styles.supersetBadge}>
                  <Text style={styles.supersetBadgeText}>
                    Ronda {superset.currentRound}/{superset.totalRounds}
                  </Text>
                </View>
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

            {/* Progreso de rondas */}
            <View style={styles.roundProgress}>
              {superset.roundCompleted.map((completed, roundIdx) => (
                <View 
                  key={roundIdx}
                  style={[
                    styles.roundIndicator,
                    completed && styles.roundCompleted,
                    roundIdx === superset.currentRound - 1 && styles.roundCurrent
                  ]}
                >
                  <Text style={[
                    styles.roundNumber,
                    completed && styles.roundNumberCompleted
                  ]}>
                    {roundIdx + 1}
                  </Text>
                </View>
              ))}
            </View>

            {/* Ejercicios de la superserie */}
            <View style={styles.currentRoundContainer}>
              <Text style={styles.currentRoundTitle}>
                Ronda {superset.currentRound}/{superset.totalRounds} - Configura cada ejercicio
              </Text>
              
              {superset.exercises.map((exercise, exIdx) => (
                <View key={exercise.id} style={styles.supersetExercise}>
                  <View style={styles.supersetExerciseHeader}>
                    <Text style={styles.supersetExerciseName}>
                      {String.fromCharCode(65 + exIdx)}. {exercise.name}
                    </Text>
                    <View style={styles.supersetExerciseBadge}>
                      <Text style={styles.supersetExerciseBadgeText}>
                        {superset.roundCompleted[superset.currentRound - 1] ? "✓" : `${superset.currentRound}/${superset.totalRounds}`}
                      </Text>
                    </View>
                  </View>

                  {/* Inputs para reps y peso */}
                  <View style={styles.supersetExerciseInputs}>
                    <View style={styles.supersetInputGroup}>
                      <Text style={styles.supersetInputLabel}>Reps</Text>
                      <TextInput
                        value={exercise.sets[0]?.reps || ''}
                        onChangeText={(text) => {
                          const updatedSuperset = {
                            ...superset,
                            exercises: superset.exercises.map((ex, j) =>
                              j === exIdx ? {
                                ...ex,
                                sets: ex.sets.length > 0 
                                  ? ex.sets.map((set, k) => k === 0 ? { ...set, reps: text } : set)
                                  : [{ reps: text, weight: '', completed: false }]
                              } : ex
                            )
                          };
                          updateSuperset(ssIdx, updatedSuperset);
                        }}
                        style={[
                          styles.supersetInput,
                          isCompleted && styles.inputDisabled
                        ]}
                        placeholder="12"
                        placeholderTextColor="#6B7280"
                        keyboardType="numeric"
                        editable={!isCompleted}
                      />
                    </View>

                    <View style={styles.supersetInputGroup}>
                      <Text style={styles.supersetInputLabel}>Peso (kg)</Text>
                      <TextInput
                        value={exercise.sets[0]?.weight || ''}
                        onChangeText={(text) => {
                          const updatedSuperset = {
                            ...superset,
                            exercises: superset.exercises.map((ex, j) =>
                              j === exIdx ? {
                                ...ex,
                                sets: ex.sets.length > 0 
                                  ? ex.sets.map((set, k) => k === 0 ? { ...set, weight: text } : set)
                                  : [{ reps: exercise.sets[0]?.reps || '', weight: text, completed: false }]
                              } : ex
                            )
                          };
                          updateSuperset(ssIdx, updatedSuperset);
                        }}
                        style={[
                          styles.supersetInput,
                          isCompleted && styles.inputDisabled
                        ]}
                        placeholder="20"
                        placeholderTextColor="#6B7280"
                        keyboardType="numeric"
                        editable={!isCompleted}
                      />
                    </View>

                    {/* Indicador de completado para este ejercicio */}
                    <View style={styles.supersetExerciseStatus}>
                      <MaterialCommunityIcons
                        name={superset.roundCompleted[superset.currentRound - 1] ? "check-circle" : "circle-outline"}
                        size={20}
                        color={superset.roundCompleted[superset.currentRound - 1] ? "#00D4AA" : "#B0B0C4"}
                      />
                    </View>
                  </View>

                  {/* Instrucciones del ejercicio */}
                  <Text style={styles.supersetExerciseInstruction}>
                    {exercise.sets[0]?.reps && exercise.sets[0]?.weight 
                      ? `Hacer ${exercise.sets[0].reps} repeticiones con ${exercise.sets[0].weight}kg`
                      : 'Configura repeticiones y peso arriba'
                    }
                  </Text>
                </View>
              ))}

              {/* Instrucciones de la superserie */}
              <View style={styles.supersetInstructions}>
                <MaterialCommunityIcons name="information-outline" size={16} color="#FFB84D" />
                <Text style={styles.supersetInstructionsText}>
                  Realiza todos los ejercicios seguidos (A → B → C) sin descanso entre ellos. 
                  Descansa {superset.restTime}s al completar la ronda.
                </Text>
              </View>

              {/* Botón para completar ronda */}
              {!isCompleted && superset.currentRound <= superset.totalRounds && (
                <Pressable
                  onPress={() => completeRound(ssIdx)}
                  style={[
                    styles.completeRoundBtn,
                    superset.roundCompleted[superset.currentRound - 1] && styles.completeRoundBtnCompleted,
                    !superset.exercises.every(ex => ex.sets.length > 0 && ex.sets[0].reps && ex.sets[0].weight) && styles.completeRoundBtnDisabled
                  ]}
                  disabled={
                    superset.roundCompleted[superset.currentRound - 1] ||
                    !superset.exercises.every(ex => ex.sets.length > 0 && ex.sets[0].reps && ex.sets[0].weight)
                  }
                >
                  <MaterialCommunityIcons 
                    name={
                      superset.roundCompleted[superset.currentRound - 1] 
                        ? "check-circle" 
                        : !superset.exercises.every(ex => ex.sets.length > 0 && ex.sets[0].reps && ex.sets[0].weight)
                        ? "alert-circle"
                        : "play-circle"
                    } 
                    size={20} 
                    color="#FFFFFF" 
                  />
                  <Text style={styles.completeRoundText}>
                    {superset.roundCompleted[superset.currentRound - 1] 
                      ? "Ronda Completada" 
                      : !superset.exercises.every(ex => ex.sets.length > 0 && ex.sets[0].reps && ex.sets[0].weight)
                      ? "Configura todos los ejercicios"
                      : "Completar Ronda"}
                  </Text>
                </Pressable>
              )}
            </View>

            {/* Tiempo de descanso */}
            <View style={styles.supersetRestTime}>
              <MaterialCommunityIcons name="timer" size={16} color="#FFB84D" />
              <Text style={styles.restTimeLabel}>Descanso entre rondas:</Text>
              <TextInput
                value={superset.restTime}
                onChangeText={(val) => {
                  const updatedSuperset = { ...superset, restTime: val };
                  updateSuperset(ssIdx, updatedSuperset);
                }}
                keyboardType="numeric"
                style={[
                  styles.restTimeInput,
                  isCompleted && styles.inputDisabled
                ]}
                editable={!isCompleted}
              />
              <Text style={styles.restTimeUnit}>seg</Text>
            </View>
          </LinearGradient>
        </View>
      ))}

      {/* ===== EJERCICIOS INDIVIDUALES ===== */}
      {exercises.map((ex, idx) => (
        <View key={ex.id} style={styles.exerciseCard}>
          <LinearGradient
            colors={
              isCompleted 
                ? ["rgba(0, 212, 170, 0.15)", "rgba(0, 184, 148, 0.1)"]
                : ["#2D2D5F", "#3D3D7F"]
            }
            style={styles.exerciseGradient}
          >
            <View style={styles.exerciseHeader}>
              <Pressable
                style={styles.exerciseHeaderContent}
                onPress={() => setOpenExerciseIdx(openExerciseIdx === idx ? null : idx)}
              >
                <View style={styles.exerciseInfo}>
                  <View style={styles.exerciseNameContainer}>
                    <Text style={[
                      styles.exerciseName,
                      isCompleted && styles.exerciseNameCompleted
                    ]}>
                      {ex.name}
                    </Text>
                    {isCompleted && (
                      <MaterialCommunityIcons name="lock" size={16} color="#00D4AA" />
                    )}
                  </View>
                  <Text style={styles.exerciseStats}>
                    {ex.sets.length} {ex.sets.length === 1 ? "serie" : "series"}
                    {ex.sets.length > 0 &&
                      ` • ${ex.sets.filter((s) => s.completed).length} completadas`}
                  </Text>
                </View>

                <View style={styles.exerciseActions}>
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
            </View>

            {openExerciseIdx === idx && (
              <View style={styles.exerciseBody}>
                {/* Tiempo de descanso */}
                <View style={styles.restTimeContainer}>
                  <MaterialCommunityIcons name="timer" size={16} color="#FFB84D" />
                  <Text style={styles.restTimeLabel}>Descanso:</Text>
                  <TextInput
                    value={ex.restTime || "60"}
                    onChangeText={(val) => updateRestTime(idx, val)}
                    keyboardType="numeric"
                    style={[
                      styles.restTimeInput,
                      isCompleted && styles.inputDisabled
                    ]}
                    editable={!isCompleted}
                  />
                  <Text style={styles.restTimeUnit}>seg</Text>
                </View>

                {/* Series */}
                {ex.sets.map((s, sIdx) => (
                  <View key={sIdx} style={styles.setContainer}>
                    <LinearGradient
                      colors={
                        s.completed
                          ? ["#00D4AA", "#00B894"]
                          : isCompleted
                          ? ["rgba(255,255,255,0.02)", "rgba(255,255,255,0.01)"]
                          : ["rgba(255,255,255,0.05)", "rgba(255,255,255,0.02)"]
                      }
                      style={styles.setGradient}
                    >
                      <View style={styles.setHeader}>
                        <Text style={[styles.setNumber, s.completed && styles.setNumberCompleted]}>
                          Serie {sIdx + 1}
                        </Text>
                        {!isCompleted && (
                          <Pressable
                            onPress={() => removeSet(idx, sIdx)}
                            style={styles.removeSetBtn}
                          >
                            <MaterialCommunityIcons name="close" size={16} color="#FF6B6B" />
                          </Pressable>
                        )}
                      </View>

                      <View style={styles.setInputs}>
                        <View style={styles.inputGroup}>
                          <Text style={[styles.inputLabel, s.completed && styles.inputLabelCompleted]}>
                            Repeticiones
                          </Text>
                          <TextInput
                            value={s.reps}
                            onChangeText={(v) => updateSet(idx, sIdx, "reps", v)}
                            keyboardType="numeric"
                            style={[
                              styles.setInput,
                              s.completed && styles.setInputCompleted,
                              isCompleted && styles.inputDisabled
                            ]}
                            editable={!isCompleted}
                          />
                        </View>

                        <View style={styles.inputGroup}>
                          <Text style={[styles.inputLabel, s.completed && styles.inputLabelCompleted]}>
                            Peso (kg)
                          </Text>
                          <TextInput
                            value={s.weight}
                            onChangeText={(v) => updateSet(idx, sIdx, "weight", v)}
                            keyboardType="numeric"
                            style={[
                              styles.setInput,
                              s.completed && styles.setInputCompleted,
                              isCompleted && styles.inputDisabled
                            ]}
                            editable={!isCompleted}
                          />
                        </View>

                        <Pressable
                          onPress={() => updateSet(idx, sIdx, "completed", !s.completed)}
                          style={[
                            styles.completeBtn,
                            s.completed && styles.completeBtnActive,
                            isCompleted && styles.buttonDisabled
                          ]}
                          disabled={isCompleted}
                        >
                          <MaterialCommunityIcons
                            name={s.completed ? "check-circle" : "circle-outline"}
                            size={24}
                            color={s.completed ? "#FFFFFF" : "#B0B0C4"}
                          />
                        </Pressable>
                      </View>
                    </LinearGradient>
                  </View>
                ))}

                {/* Botón añadir serie */}
                {!isCompleted && (
                  <Pressable onPress={() => addSet(idx)} style={styles.addSetBtn}>
                    <LinearGradient
                      colors={["rgba(0, 212, 170, 0.2)", "rgba(0, 184, 148, 0.2)"]}
                      style={styles.addSetGradient}
                    >
                      <MaterialCommunityIcons name="plus" size={20} color="#00D4AA" />
                      <Text style={styles.addSetText}>Añadir Serie</Text>
                    </LinearGradient>
                  </Pressable>
                )}
              </View>
            )}
          </LinearGradient>
        </View>
      ))}

      {/* ===== BOTONES DE ACCIÓN ===== */}
      {!isCompleted && (
        <View style={styles.actionButtons}>
          {/* Botón añadir ejercicio */}
          <Pressable 
            onPress={() => setShowExerciseSelector(true)} 
            style={styles.addExerciseBtn}
          >
            <LinearGradient
              colors={["#00D4AA", "#00B894"]}
              style={styles.addExerciseGradient}
            >
              <MaterialCommunityIcons name="plus" size={20} color="#FFFFFF" />
              <Text style={styles.addExerciseText}>Añadir Ejercicio</Text>
            </LinearGradient>
          </Pressable>

          {/* Botón crear superserie */}
          {exercises.length >= 2 && (
            <Pressable 
              onPress={() => setShowSupersetBuilder(true)} 
              style={styles.createSupersetBtn}
            >
              <LinearGradient
                colors={["#FF6B6B", "#FF5252"]}
                style={styles.createSupersetGradient}
              >
                <MaterialCommunityIcons name="lightning-bolt" size={20} color="#FFFFFF" />
                <Text style={styles.createSupersetText}>Crear Superserie</Text>
              </LinearGradient>
            </Pressable>
          )}
        </View>
      )}

      {/* ===== COMPLETAR ENTRENAMIENTO ===== */}
      {!isCompleted && (exercises.length > 0 || superSets.length > 0) && (
        <Pressable 
          onPress={handleCompleteWorkout}
          style={[
            styles.completeWorkoutBtn,
            !workoutReady && styles.completeWorkoutBtnDisabled
          ]}
          disabled={!workoutReady}
        >
          <LinearGradient
            colors={
              workoutReady 
                ? progressPercentage === 100 ? ["#00D4AA", "#00B894"] : ["#FF9800", "#F57C00"]
                : ["#6B7280", "#4B5563"]
            }
            style={styles.completeWorkoutGradient}
          >
            <MaterialCommunityIcons 
              name={
                !workoutReady ? "alert-circle" :
                progressPercentage === 100 ? "trophy" : "check-circle"
              } 
              size={24} 
              color="#FFFFFF" 
            />
            <Text style={styles.completeWorkoutText}>
              {!workoutReady ? "Completa la configuración de series" :
               progressPercentage === 100 ? "¡Entrenamiento Perfecto!" : "Finalizar Entrenamiento"}
            </Text>
          </LinearGradient>
        </Pressable>
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
              {isCompleted ? "Entrenamiento Vacío Completado" : "Sin ejercicios"}
            </Text>
            <Text style={styles.emptySubtitle}>
              {isCompleted 
                ? "Este entrenamiento se completó sin ejercicios añadidos."
                : "¡Añade ejercicios individuales o crea superseries!"
              }
            </Text>
          </LinearGradient>
        </View>
      )}

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
    </View>
  );
}

/**
 * Funciones utilitarias para superseries
 */
const getSupersetTypeName = (type: 'superset' | 'circuit' | 'triset') => {
  switch (type) {
    case 'superset': return 'Superserie';
    case 'triset': return 'Triserie';
    case 'circuit': return 'Circuito';
    default: return 'Superserie';
  }
};

const getSupersetIcon = (type: 'superset' | 'circuit' | 'triset') => {
  switch (type) {
    case 'superset': return 'lightning-bolt';
    case 'triset': return 'flash';
    case 'circuit': return 'refresh-circle';
    default: return 'lightning-bolt';
  }
};

const getSupersetColor = (type: 'superset' | 'circuit' | 'triset') => {
  switch (type) {
    case 'superset': return '#FF6B6B';
    case 'triset': return '#FFB84D';
    case 'circuit': return '#4ECDC4';
    default: return '#FF6B6B';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 12,
    marginHorizontal: 20,
  },

  // ===== ESTADÍSTICAS =====
  statsContainer: {
    marginBottom: 8,
    borderRadius: 20,
    overflow: 'hidden',
  },

  statsGradient: {
    padding: 16,
    borderRadius: 20,
  },

  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },

  statsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  statsContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },

  statItem: {
    alignItems: 'center',
  },

  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#00D4AA',
  },

  statLabel: {
    fontSize: 12,
    color: '#B0B0C4',
    marginTop: 2,
  },

  progressContainer: {
    marginTop: 8,
  },

  progressBackground: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
  },

  progressBar: {
    height: 6,
    backgroundColor: '#00D4AA',
    borderRadius: 3,
  },

  completedMessage: {
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(0, 212, 170, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 170, 0.3)',
  },

  completedMessageText: {
    fontSize: 12,
    color: '#00D4AA',
    textAlign: 'center',
    fontWeight: '600',
  },

  // ===== SUPERSERIES =====
  supersetCard: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },

  supersetGradient: {
    padding: 16,
    borderRadius: 20,
  },

  supersetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  supersetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },

  supersetName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  supersetBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },

  supersetBadgeText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },

  roundProgress: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 6,
  },

  roundIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },

  roundCompleted: {
    backgroundColor: '#00D4AA',
    borderColor: '#00D4AA',
  },

  roundCurrent: {
    borderColor: '#FFB84D',
    backgroundColor: 'rgba(255, 184, 77, 0.2)',
  },

  roundNumber: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B0B0C4',
  },

  roundNumberCompleted: {
    color: '#FFFFFF',
  },

  currentRoundContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },

  currentRoundTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFB84D',
    marginBottom: 12,
    textAlign: 'center',
  },

  supersetExercise: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
  },

  supersetExerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },

  supersetExerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },

  supersetExerciseBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },

  supersetExerciseBadgeText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },

  supersetExerciseInputs: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    marginBottom: 8,
  },

  supersetInputGroup: {
    flex: 1,
  },

  supersetInputLabel: {
    fontSize: 12,
    color: '#B0B0C4',
    marginBottom: 4,
    fontWeight: '600',
  },

  supersetInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },

  supersetExerciseStatus: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },

  supersetExerciseInstruction: {
    fontSize: 12,
    color: '#B0B0C4',
    fontStyle: 'italic',
    textAlign: 'center',
  },

  supersetInstructions: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 184, 77, 0.1)',
    borderRadius: 8,
    padding: 10,
    marginVertical: 12,
    gap: 8,
  },

  supersetInstructionsText: {
    flex: 1,
    fontSize: 12,
    color: '#FFB84D',
    lineHeight: 16,
  },

  completeRoundBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00D4AA',
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 8,
    gap: 8,
  },

  completeRoundBtnCompleted: {
    backgroundColor: '#6B7280',
    opacity: 0.7,
  },

  completeRoundBtnDisabled: {
    backgroundColor: '#FF6B6B',
    opacity: 0.8,
  },

  completeRoundText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  supersetRestTime: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 184, 77, 0.1)',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },

  // ===== EJERCICIOS INDIVIDUALES =====
  exerciseCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 12,
  },

  exerciseGradient: {
    padding: 16,
    borderRadius: 20,
  },

  exerciseHeader: {
    marginBottom: 12,
  },

  exerciseHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  exerciseInfo: {
    flex: 1,
  },

  exerciseNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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

  exerciseStats: {
    fontSize: 14,
    color: '#B0B0C4',
  },

  exerciseActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  deleteBtn: {
    padding: 4,
  },

  exerciseBody: {
    gap: 12,
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

  setContainer: {
    borderRadius: 16,
    overflow: 'hidden',
  },

  setGradient: {
    padding: 12,
    borderRadius: 16,
  },

  setHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },

  setNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#B0B0C4',
  },

  setNumberCompleted: {
    color: '#FFFFFF',
  },

  removeSetBtn: {
    padding: 4,
  },

  setInputs: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
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

  inputLabelCompleted: {
    color: '#FFFFFF',
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

  setInputCompleted: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },

  inputDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: '#6B7280',
  },

  buttonDisabled: {
    opacity: 0.5,
  },

  completeBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },

  completeBtnActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },

  addSetBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },

  addSetGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 16,
    gap: 8,
  },

  addSetText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00D4AA',
  },

  // ===== BOTONES DE ACCIÓN =====
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },

  addExerciseBtn: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },

  addExerciseGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
  },

  addExerciseText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  createSupersetBtn: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },

  createSupersetGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
  },

  createSupersetText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // ===== COMPLETAR ENTRENAMIENTO =====
  completeWorkoutBtn: {
    marginTop: 12,
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },

  completeWorkoutBtnDisabled: {
    opacity: 0.6,
  },

  completeWorkoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 20,
    gap: 8,
  },

  completeWorkoutText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
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