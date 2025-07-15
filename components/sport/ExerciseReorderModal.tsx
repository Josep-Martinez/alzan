// components/sport/ExerciseReorderModal.tsx - Modal para reordenar ejercicios
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
    Alert,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { EXERCISE_TYPE_COLORS, EXERCISE_TYPE_ICONS, GymExercise } from './sports';

interface ExerciseReorderModalProps {
  visible: boolean;
  exercises: GymExercise[];
  onClose: () => void;
  onReorder: (exercises: GymExercise[]) => void;
  title?: string;
}

export default function ExerciseReorderModal({
  visible,
  exercises,
  onClose,
  onReorder,
  title = "Reordenar Ejercicios"
}: ExerciseReorderModalProps) {
  const [reorderedExercises, setReorderedExercises] = useState<GymExercise[]>(exercises);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);

  // Resetear cuando se abre el modal
  React.useEffect(() => {
    if (visible) {
      setReorderedExercises([...exercises]);
      setSelectedExercise(null);
    }
  }, [visible, exercises]);

  /**
   * Mueve un ejercicio hacia arriba
   */
  const moveUp = (index: number) => {
    if (index === 0) return;
    
    const newExercises = [...reorderedExercises];
    [newExercises[index], newExercises[index - 1]] = [newExercises[index - 1], newExercises[index]];
    setReorderedExercises(newExercises);
  };

  /**
   * Mueve un ejercicio hacia abajo
   */
  const moveDown = (index: number) => {
    if (index === reorderedExercises.length - 1) return;
    
    const newExercises = [...reorderedExercises];
    [newExercises[index], newExercises[index + 1]] = [newExercises[index + 1], newExercises[index]];
    setReorderedExercises(newExercises);
  };

  /**
   * Mueve un ejercicio a una posición específica
   */
  const moveToPosition = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    
    const newExercises = [...reorderedExercises];
    const [movedExercise] = newExercises.splice(fromIndex, 1);
    newExercises.splice(toIndex, 0, movedExercise);
    setReorderedExercises(newExercises);
  };

  /**
   * Selecciona un ejercicio para mover
   */
  const selectExercise = (exerciseId: string) => {
    if (selectedExercise === exerciseId) {
      setSelectedExercise(null);
    } else {
      setSelectedExercise(exerciseId);
    }
  };

  /**
   * Mueve el ejercicio seleccionado a una posición
   */
  const moveSelectedTo = (toIndex: number) => {
    if (!selectedExercise) return;
    
    const fromIndex = reorderedExercises.findIndex(ex => ex.id === selectedExercise);
    if (fromIndex === -1) return;
    
    moveToPosition(fromIndex, toIndex);
    setSelectedExercise(null);
  };

  /**
   * Guarda los cambios
   */
  const handleSave = () => {
    onReorder(reorderedExercises);
    onClose();
  };

  /**
   * Cancela los cambios
   */
  const handleCancel = () => {
    setReorderedExercises([...exercises]);
    setSelectedExercise(null);
    onClose();
  };

  /**
   * Resetea el orden original
   */
  const handleReset = () => {
    Alert.alert(
      "Resetear Orden",
      "¿Estás seguro de que quieres volver al orden original?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Resetear", 
          style: "destructive",
          onPress: () => {
            setReorderedExercises([...exercises]);
            setSelectedExercise(null);
          }
        }
      ]
    );
  };

  /**
   * Verifica si el orden ha cambiado
   */
  const hasChanges = () => {
    return JSON.stringify(reorderedExercises.map(ex => ex.id)) !== 
           JSON.stringify(exercises.map(ex => ex.id));
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleCancel}
    >
      <LinearGradient
        colors={['#0F0F23', '#1A1A3A', '#2D2D5F']}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <MaterialCommunityIcons name="sort" size={24} color="#FFB84D" />
            <Text style={styles.title}>{title}</Text>
          </View>
          <Pressable onPress={handleCancel} style={styles.closeBtn}>
            <MaterialCommunityIcons name="close" size={24} color="#B0B0C4" />
          </Pressable>
        </View>

        {/* Instrucciones */}
        <View style={styles.instructions}>
          <LinearGradient
            colors={["rgba(255, 184, 77, 0.1)", "rgba(255, 184, 77, 0.05)"]}
            style={styles.instructionsGradient}
          >
            <MaterialCommunityIcons name="information-outline" size={20} color="#FFB84D" />
            <Text style={styles.instructionsText}>
              {selectedExercise 
                ? "Toca en la posición donde quieres mover el ejercicio seleccionado"
                : "Usa las flechas para mover ejercicios o toca un ejercicio para seleccionarlo"
              }
            </Text>
          </LinearGradient>
        </View>

        {/* Lista de ejercicios */}
        <ScrollView style={styles.exercisesList} showsVerticalScrollIndicator={false}>
          {reorderedExercises.map((exercise, index) => {
            const isSelected = selectedExercise === exercise.id;
            const canMoveUp = index > 0;
            const canMoveDown = index < reorderedExercises.length - 1;
            
            return (
              <View key={exercise.id} style={styles.exerciseItemContainer}>
                <Pressable
                  onPress={() => {
                    if (selectedExercise && selectedExercise !== exercise.id) {
                      moveSelectedTo(index);
                    } else {
                      selectExercise(exercise.id);
                    }
                  }}
                  style={[
                    styles.exerciseItem,
                    isSelected && styles.exerciseItemSelected,
                    selectedExercise && selectedExercise !== exercise.id && styles.exerciseItemDropTarget
                  ]}
                >
                  <LinearGradient
                    colors={
                      isSelected 
                        ? ["#FFB84D33", "#FFB84D1A"]
                        : selectedExercise && selectedExercise !== exercise.id
                        ? ["rgba(0, 212, 170, 0.1)", "rgba(0, 212, 170, 0.05)"]
                        : ["rgba(255, 255, 255, 0.05)", "rgba(255, 255, 255, 0.02)"]
                    }
                    style={styles.exerciseItemGradient}
                  >
                    {/* Número de posición */}
                    <View style={[styles.positionNumber, { 
                      backgroundColor: isSelected ? '#FFB84D' : '#4ECDC4' 
                    }]}>
                      <Text style={styles.positionNumberText}>{index + 1}</Text>
                    </View>

                    {/* Información del ejercicio */}
                    <View style={styles.exerciseInfo}>
                      <Text style={[styles.exerciseName, isSelected && styles.exerciseNameSelected]}>
                        {exercise.name}
                      </Text>
                      <View style={styles.exerciseMetadata}>
                        <View style={styles.exerciseType}>
                          <MaterialCommunityIcons 
                            name={EXERCISE_TYPE_ICONS[exercise.exerciseType || 'Repeticiones'] as any}
                            size={12} 
                            color={EXERCISE_TYPE_COLORS[exercise.exerciseType || 'Repeticiones']} 
                          />
                          <Text style={[styles.exerciseTypeText, { 
                            color: EXERCISE_TYPE_COLORS[exercise.exerciseType || 'Repeticiones'] 
                          }]}>
                            {exercise.exerciseType === 'Tiempo' ? 'TIEMPO' : 'REPS'}
                          </Text>
                        </View>
                        
                        {exercise.muscleGroup && (
                          <Text style={styles.muscleGroup}>
                            {exercise.muscleGroup}
                          </Text>
                        )}
                        
                        <Text style={styles.setsInfo}>
                          {exercise.sets.length} {exercise.sets.length === 1 ? 'serie' : 'series'}
                        </Text>
                      </View>
                    </View>

                    {/* Controles de movimiento */}
                    <View style={styles.moveControls}>
                      <Pressable
                        onPress={() => moveUp(index)}
                        style={[styles.moveBtn, !canMoveUp && styles.moveBtnDisabled]}
                        disabled={!canMoveUp}
                      >
                        <MaterialCommunityIcons 
                          name="arrow-up" 
                          size={20} 
                          color={canMoveUp ? "#4ECDC4" : "#6B7280"} 
                        />
                      </Pressable>
                      
                      <Pressable
                        onPress={() => moveDown(index)}
                        style={[styles.moveBtn, !canMoveDown && styles.moveBtnDisabled]}
                        disabled={!canMoveDown}
                      >
                        <MaterialCommunityIcons 
                          name="arrow-down" 
                          size={20} 
                          color={canMoveDown ? "#4ECDC4" : "#6B7280"} 
                        />
                      </Pressable>
                    </View>
                  </LinearGradient>
                </Pressable>

                {/* Indicador de inserción */}
                {selectedExercise && selectedExercise !== exercise.id && (
                  <View style={styles.insertionIndicator}>
                    <View style={styles.insertionLine} />
                    <Text style={styles.insertionText}>Insertar aquí</Text>
                    <View style={styles.insertionLine} />
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>

        {/* Botones de acción */}
        <View style={styles.actionButtons}>
          <Pressable
            onPress={handleReset}
            style={[styles.actionBtn, styles.resetBtn]}
            disabled={!hasChanges()}
          >
            <MaterialCommunityIcons name="restore" size={20} color="#FF6B6B" />
            <Text style={styles.resetBtnText}>Resetear</Text>
          </Pressable>

          <Pressable onPress={handleCancel} style={[styles.actionBtn, styles.cancelBtn]}>
            <Text style={styles.cancelBtnText}>Cancelar</Text>
          </Pressable>

          <Pressable 
            onPress={handleSave} 
            style={[styles.actionBtn, styles.saveBtn]}
            disabled={!hasChanges()}
          >
            <LinearGradient
              colors={
                hasChanges() 
                  ? ["#00D4AA", "#00B894"]
                  : ["#6B7280", "#4B5563"]
              }
              style={styles.saveBtnGradient}
            >
              <MaterialCommunityIcons name="check" size={20} color="#FFFFFF" />
              <Text style={styles.saveBtnText}>Guardar</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // ===== HEADER =====
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },

  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  closeBtn: {
    padding: 8,
  },

  // ===== INSTRUCCIONES =====
  instructions: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },

  instructionsGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },

  instructionsText: {
    flex: 1,
    fontSize: 14,
    color: '#FFB84D',
    fontWeight: '500',
    lineHeight: 18,
  },

  // ===== LISTA DE EJERCICIOS =====
  exercisesList: {
    flex: 1,
    paddingHorizontal: 20,
  },

  exerciseItemContainer: {
    marginVertical: 6,
  },

  exerciseItem: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },

  exerciseItemSelected: {
    borderColor: '#FFB84D',
    transform: [{ scale: 1.02 }],
  },

  exerciseItemDropTarget: {
    borderColor: '#00D4AA',
    borderStyle: 'dashed',
  },

  exerciseItemGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },

  positionNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },

  positionNumberText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  exerciseInfo: {
    flex: 1,
  },

  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },

  exerciseNameSelected: {
    color: '#FFB84D',
  },

  exerciseMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },

  exerciseType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  exerciseTypeText: {
    fontSize: 10,
    fontWeight: '600',
  },

  muscleGroup: {
    fontSize: 12,
    color: '#4ECDC4',
    fontWeight: '500',
  },

  setsInfo: {
    fontSize: 12,
    color: '#B0B0C4',
    fontWeight: '500',
  },

  moveControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  moveBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  moveBtnDisabled: {
    opacity: 0.3,
  },

  // ===== INDICADOR DE INSERCIÓN =====
  insertionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
  },

  insertionLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#00D4AA',
    borderRadius: 1,
  },

  insertionText: {
    fontSize: 12,
    color: '#00D4AA',
    fontWeight: '600',
    paddingHorizontal: 8,
  },

  // ===== BOTONES DE ACCIÓN =====
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },

  actionBtn: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },

  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.4)',
    gap: 6,
  },

  resetBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B6B',
  },

  cancelBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },

  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#B0B0C4',
  },

  saveBtn: {
    borderRadius: 12,
    overflow: 'hidden',
  },

  saveBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },

  saveBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});