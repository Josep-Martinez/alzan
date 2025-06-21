// components/sport/GymSession.tsx - Con modo solo lectura para entrenamientos completados
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
import { GymExercise, GymSet } from './sports';

// Interfaz simplificada para ejercicio manual
interface ManualExercise {
  id: string;
  name: string;
}

interface GymSessionProps {
  exercises: GymExercise[];
  onUpdateExercises: (exercises: GymExercise[]) => void;
  onStartRestTimer: (duration: number) => void;
  onCompleteWorkout?: () => void;
  isCompleted?: boolean; // Nueva prop para indicar si está completado
}

export default function GymSession({ 
  exercises, 
  onUpdateExercises, 
  onStartRestTimer,
  onCompleteWorkout,
  isCompleted = false // Por defecto no está completado
}: GymSessionProps) {
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  /**
   * Función para añadir nuevo ejercicio a la sesión
   * Solo funciona si no está completado
   */
  const addExercise = (exercise: ManualExercise) => {
    if (isCompleted) return; // No permitir cambios si está completado
    
    const newGymExercise: GymExercise = {
      id: `gym_ex_${Date.now()}`,
      exerciseId: exercise.id,
      name: exercise.name,
      sets: [],
      restTime: '60',
      notes: ''
    };
    onUpdateExercises([...exercises, newGymExercise]);
  };

  /**
   * Función para eliminar ejercicio
   * Solo funciona si no está completado
   */
  const removeExercise = (idx: number) => {
    if (isCompleted) return; // No permitir cambios si está completado
    onUpdateExercises(exercises.filter((_, i) => i !== idx));
  };

  /**
   * Función para añadir nueva serie a un ejercicio
   * Solo funciona si no está completado
   */
  const addSet = (idx: number) => {
    if (isCompleted) return; // No permitir cambios si está completado
    
    const updatedExercises = exercises.map((ex, i) =>
      i === idx
        ? { ...ex, sets: [...ex.sets, { reps: '', weight: '', completed: false }] }
        : ex
    );
    onUpdateExercises(updatedExercises);
  };

  /**
   * Función para actualizar datos de una serie
   * Solo funciona si no está completado
   */
  const updateSet = (exIdx: number, setIdx: number, field: keyof GymSet, val: string | boolean) => {
    if (isCompleted) return; // No permitir cambios si está completado
    
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

    // Si se marca como completada, iniciar cronómetro de descanso
    if (field === 'completed' && val === true && !isCompleted) {
      const exercise = exercises[exIdx];
      const restTime = parseInt(exercise.restTime || '60');
      onStartRestTimer(restTime);
    }
  };

  /**
   * Función para eliminar una serie
   * Solo funciona si no está completado
   */
  const removeSet = (exIdx: number, setIdx: number) => {
    if (isCompleted) return; // No permitir cambios si está completado
    
    const updatedExercises = exercises.map((ex, i) =>
      i === exIdx
        ? { ...ex, sets: ex.sets.filter((_, j) => j !== setIdx) }
        : ex
    );
    onUpdateExercises(updatedExercises);
  };

  /**
   * Función para actualizar tiempo de descanso
   * Solo funciona si no está completado
   */
  const updateRestTime = (idx: number, restTime: string) => {
    if (isCompleted) return; // No permitir cambios si está completado
    
    const updatedExercises = exercises.map((ex, i) =>
      i === idx ? { ...ex, restTime } : ex
    );
    onUpdateExercises(updatedExercises);
  };

  /**
   * Función para completar entrenamiento - Sin alertas, solo callback
   * Solo funciona si no está completado
   */
  const handleCompleteWorkout = () => {
    if (exercises.length === 0 || isCompleted) return;
    onCompleteWorkout?.();
  };

  // Calcular estadísticas del entrenamiento
  const totalSets = exercises.reduce((total, ex) => total + ex.sets.length, 0);
  const completedSets = exercises.reduce((total, ex) => 
    total + ex.sets.filter(set => set.completed).length, 0
  );
  const progressPercentage = totalSets > 0 ? (completedSets / totalSets) * 100 : 0;

  return (
    <View style={styles.container}>
      {/* Estadísticas del entrenamiento */}
      {exercises.length > 0 && (
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
                <Text style={styles.statValue}>{exercises.length}</Text>
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

            {/* Mensaje para entrenamientos completados */}
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

      {/* Empty State */}
      {exercises.length === 0 && (
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
                : "¡Añade tu primer ejercicio para comenzar!"
              }
            </Text>
          </LinearGradient>
        </View>
      )}

      {/* Exercise List */}
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
            {/* Exercise Header */}
            <View style={styles.exerciseHeader}>
              <Pressable
                style={styles.exerciseHeaderContent}
                onPress={() => setOpenIdx(openIdx === idx ? null : idx)}
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
                      <MaterialCommunityIcons
                        name="lock"
                        size={16}
                        color="#00D4AA"
                      />
                    )}
                  </View>
                  <Text style={styles.exerciseStats}>
                    {ex.sets.length}{" "}
                    {ex.sets.length === 1 ? "serie" : "series"}
                    {ex.sets.length > 0 &&
                      ` • ${
                        ex.sets.filter((s) => s.completed).length
                      } completadas`}
                  </Text>
                </View>

                <View style={styles.exerciseActions}>
                  {!isCompleted && (
                    <Pressable
                      onPress={() => removeExercise(idx)}
                      style={styles.deleteBtn}
                    >
                      <MaterialCommunityIcons
                        name="trash-can"
                        size={20}
                        color="#FF6B6B"
                      />
                    </Pressable>
                  )}
                  <MaterialCommunityIcons
                    name={openIdx === idx ? "chevron-up" : "chevron-down"}
                    size={24}
                    color="#B0B0C4"
                  />
                </View>
              </Pressable>
            </View>

            {/* Exercise Body (Expanded) */}
            {openIdx === idx && (
              <View style={styles.exerciseBody}>
                {/* Rest Time */}
                <View style={styles.restTimeContainer}>
                  <MaterialCommunityIcons
                    name="timer"
                    size={16}
                    color="#FFB84D"
                  />
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

                {/* Sets */}
                {ex.sets.map((s, sIdx) => (
                  <View key={sIdx} style={styles.setContainer}>
                    <LinearGradient
                      colors={
                        s.completed
                          ? ["#00D4AA", "#00B894"]
                          : isCompleted
                          ? ["rgba(255,255,255,0.02)", "rgba(255,255,255,0.01)"]
                          : [
                              "rgba(255,255,255,0.05)",
                              "rgba(255,255,255,0.02)",
                            ]
                      }
                      style={styles.setGradient}
                    >
                      <View style={styles.setHeader}>
                        <Text
                          style={[
                            styles.setNumber,
                            s.completed && styles.setNumberCompleted,
                          ]}
                        >
                          Serie {sIdx + 1}
                        </Text>
                        {!isCompleted && (
                          <Pressable
                            onPress={() => removeSet(idx, sIdx)}
                            style={styles.removeSetBtn}
                          >
                            <MaterialCommunityIcons
                              name="close"
                              size={16}
                              color="#FF6B6B"
                            />
                          </Pressable>
                        )}
                      </View>

                      <View style={styles.setInputs}>
                        <View style={styles.inputGroup}>
                          <Text
                            style={[
                              styles.inputLabel,
                              s.completed && styles.inputLabelCompleted,
                            ]}
                          >
                            Repeticiones
                          </Text>
                          <TextInput
                            value={s.reps}
                            onChangeText={(v) =>
                              updateSet(idx, sIdx, "reps", v)
                            }
                            keyboardType="numeric"
                            style={[
                              styles.setInput,
                              s.completed && styles.setInputCompleted,
                              isCompleted && styles.inputDisabled
                            ]}
                            placeholderTextColor="#B0B0C4"
                            editable={!isCompleted}
                          />
                        </View>

                        <View style={styles.inputGroup}>
                          <Text
                            style={[
                              styles.inputLabel,
                              s.completed && styles.inputLabelCompleted,
                            ]}
                          >
                            Peso (kg)
                          </Text>
                          <TextInput
                            value={s.weight}
                            onChangeText={(v) =>
                              updateSet(idx, sIdx, "weight", v)
                            }
                            keyboardType="numeric"
                            style={[
                              styles.setInput,
                              s.completed && styles.setInputCompleted,
                              isCompleted && styles.inputDisabled
                            ]}
                            placeholderTextColor="#B0B0C4"
                            editable={!isCompleted}
                          />
                        </View>

                        <Pressable
                          onPress={() =>
                            updateSet(idx, sIdx, "completed", !s.completed)
                          }
                          style={[
                            styles.completeBtn,
                            s.completed && styles.completeBtnActive,
                            isCompleted && styles.buttonDisabled
                          ]}
                          disabled={isCompleted}
                        >
                          <MaterialCommunityIcons
                            name={
                              s.completed
                                ? "check-circle"
                                : "circle-outline"
                            }
                            size={24}
                            color={s.completed ? "#FFFFFF" : "#B0B0C4"}
                          />
                        </Pressable>
                      </View>
                    </LinearGradient>
                  </View>
                ))}

                {/* Add Set Button - Solo si no está completado */}
                {!isCompleted && (
                  <Pressable
                    onPress={() => addSet(idx)}
                    style={styles.addSetBtn}
                  >
                    <LinearGradient
                      colors={[
                        "rgba(0, 212, 170, 0.2)",
                        "rgba(0, 184, 148, 0.2)",
                      ]}
                      style={styles.addSetGradient}
                    >
                      <MaterialCommunityIcons
                        name="plus"
                        size={20}
                        color="#00D4AA"
                      />
                      <Text style={styles.addSetText}>Añadir Serie</Text>
                    </LinearGradient>
                  </Pressable>
                )}
              </View>
            )}
          </LinearGradient>
        </View>
      ))}

      {/* Add Exercise Button - Solo si no está completado */}
      {!isCompleted && (
        <Pressable 
          onPress={() => setShowExerciseSelector(true)} 
          style={styles.addExerciseBtn}
        >
          <LinearGradient
            colors={["#00D4AA", "#00B894"]}
            style={styles.addExerciseGradient}
          >
            <MaterialCommunityIcons name="plus" size={24} color="#FFFFFF" />
            <Text style={styles.addExerciseText}>Añadir Ejercicio</Text>
          </LinearGradient>
        </Pressable>
      )}

      {/* Complete Workout Button - Solo si no está completado */}
      {!isCompleted && exercises.length > 0 && (
        <Pressable 
          onPress={handleCompleteWorkout}
          style={styles.completeWorkoutBtn}
        >
          <LinearGradient
            colors={progressPercentage === 100 ? ["#00D4AA", "#00B894"] : ["#FF6B6B", "#FF5252"]}
            style={styles.completeWorkoutGradient}
          >
            <MaterialCommunityIcons 
              name={progressPercentage === 100 ? "trophy" : "check-circle"} 
              size={24} 
              color="#FFFFFF" 
            />
            <Text style={styles.completeWorkoutText}>
              {progressPercentage === 100 ? "¡Entrenamiento Perfecto!" : "Finalizar Entrenamiento"}
            </Text>
          </LinearGradient>
        </Pressable>
      )}

      {/* Exercise Selector Modal - Solo si no está completado */}
      {!isCompleted && (
        <ExerciseSelector
          visible={showExerciseSelector}
          onClose={() => setShowExerciseSelector(false)}
          onSelectExercise={addExercise}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    gap: 12,
    marginHorizontal: 20,
  },

  // Estadísticas del entrenamiento
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

  // Mensaje para entrenamientos completados
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

  exerciseCard: {
    borderRadius: 20,
    overflow: 'hidden',
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

  // Estilos para elementos deshabilitados
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

  addExerciseBtn: {
    marginTop: 8,
    borderRadius: 20,
    overflow: 'hidden',
  },

  addExerciseGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 20,
    gap: 8,
  },

  addExerciseText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Botón completar entrenamiento mejorado
  completeWorkoutBtn: {
    marginTop: 12,
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
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
});