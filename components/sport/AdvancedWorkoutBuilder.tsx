// components/sport/AdvancedWorkoutBuilder.tsx - Constructor avanzado inspirado en Suunto/Garmin
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';

/**
 * Tipos de pasos de entrenamiento siguiendo el patrón de Garmin/Suunto
 */
interface WorkoutStep {
  id: string;
  name: string;
  stepType: 'warmup' | 'work' | 'rest' | 'recovery' | 'cooldown';
  durationType: 'time' | 'distance' | 'lap_button' | 'heart_rate';
  duration?: number; // tiempo en segundos
  distance?: number; // distancia en metros
  targetType?: 'pace' | 'heart_rate' | 'power' | 'none';
  targetMin?: number;
  targetMax?: number;
  color: string;
}

/**
 * Estructura de loops/repeticiones como en Garmin Connect
 */
interface WorkoutLoop {
  id: string;
  name: string;
  repetitions: number;
  steps: WorkoutStep[];
  color: string;
}

/**
 * Plan de entrenamiento completo
 */
interface WorkoutPlan {
  id: string;
  name: string;
  sport: 'running' | 'cycling' | 'swimming';
  steps: (WorkoutStep | WorkoutLoop)[];
  estimatedDuration: number;
  estimatedDistance: number;
  createdAt: string;
}

/**
 * Props del constructor avanzado
 */
interface AdvancedWorkoutBuilderProps {
  sport: 'running' | 'cycling' | 'swimming';
  visible: boolean;
  onClose: () => void;
  onSave: (workoutPlan: WorkoutPlan) => void;
}

/**
 * Plantillas predefinidas siguiendo el patrón de apps profesionales
 * Basadas en la investigación de Garmin Connect, Suunto App y Apple Fitness
 */
const WORKOUT_TEMPLATES = {
  running: {
    intervals_400m: {
      name: 'Intervalos 400m',
      steps: [
        { 
          id: '1', 
          name: 'Calentamiento', 
          stepType: 'warmup', 
          durationType: 'time', 
          duration: 600, 
          targetType: 'heart_rate', 
          targetMin: 120, 
          targetMax: 140, 
          color: '#4CAF50' 
        },
        {
          id: 'loop1',
          name: 'Serie de Intervalos',
          repetitions: 8,
          steps: [
            { 
              id: '2', 
              name: 'Intervalo 400m', 
              stepType: 'work', 
              durationType: 'distance', 
              distance: 400, 
              targetType: 'pace', 
              targetMin: 240, 
              targetMax: 270, 
              color: '#FF5722' 
            },
            { 
              id: '3', 
              name: 'Recuperación', 
              stepType: 'recovery', 
              durationType: 'time', 
              duration: 90, 
              targetType: 'heart_rate', 
              targetMin: 110, 
              targetMax: 130, 
              color: '#2196F3' 
            },
          ],
          color: '#FF9800'
        },
        { 
          id: '4', 
          name: 'Enfriamiento', 
          stepType: 'cooldown', 
          durationType: 'time', 
          duration: 600, 
          targetType: 'none', 
          color: '#9C27B0' 
        },
      ]
    },
    tempo_20min: {
      name: 'Tempo 20 min',
      steps: [
        { 
          id: '1', 
          name: 'Calentamiento', 
          stepType: 'warmup', 
          durationType: 'time', 
          duration: 900, 
          targetType: 'heart_rate', 
          targetMin: 120, 
          targetMax: 140, 
          color: '#4CAF50' 
        },
        { 
          id: '2', 
          name: 'Tempo', 
          stepType: 'work', 
          durationType: 'time', 
          duration: 1200, 
          targetType: 'pace', 
          targetMin: 270, 
          targetMax: 300, 
          color: '#FF9800' 
        },
        { 
          id: '3', 
          name: 'Enfriamiento', 
          stepType: 'cooldown', 
          durationType: 'time', 
          duration: 600, 
          targetType: 'none', 
          color: '#9C27B0' 
        },
      ]
    },
    long_run: {
      name: 'Tirada Larga 10K',
      steps: [
        { 
          id: '1', 
          name: 'Calentamiento', 
          stepType: 'warmup', 
          durationType: 'time', 
          duration: 600, 
          targetType: 'heart_rate', 
          targetMin: 120, 
          targetMax: 140, 
          color: '#4CAF50' 
        },
        { 
          id: '2', 
          name: 'Carrera Base', 
          stepType: 'work', 
          durationType: 'distance', 
          distance: 10000, 
          targetType: 'heart_rate', 
          targetMin: 130, 
          targetMax: 150, 
          color: '#00BCD4' 
        },
        { 
          id: '3', 
          name: 'Enfriamiento', 
          stepType: 'cooldown', 
          durationType: 'time', 
          duration: 300, 
          targetType: 'none', 
          color: '#9C27B0' 
        },
      ]
    }
  },
  cycling: {
    power_intervals: {
      name: 'Intervalos de Potencia',
      steps: [
        { 
          id: '1', 
          name: 'Calentamiento', 
          stepType: 'warmup', 
          durationType: 'time', 
          duration: 900, 
          targetType: 'power', 
          targetMin: 120, 
          targetMax: 150, 
          color: '#4CAF50' 
        },
        {
          id: 'loop1',
          name: 'Serie de Potencia',
          repetitions: 5,
          steps: [
            { 
              id: '2', 
              name: 'Trabajo', 
              stepType: 'work', 
              durationType: 'time', 
              duration: 240, 
              targetType: 'power', 
              targetMin: 300, 
              targetMax: 350, 
              color: '#FF5722' 
            },
            { 
              id: '3', 
              name: 'Recuperación', 
              stepType: 'recovery', 
              durationType: 'time', 
              duration: 180, 
              targetType: 'power', 
              targetMin: 120, 
              targetMax: 150, 
              color: '#2196F3' 
            },
          ],
          color: '#FF9800'
        },
        { 
          id: '4', 
          name: 'Enfriamiento', 
          stepType: 'cooldown', 
          durationType: 'time', 
          duration: 600, 
          targetType: 'power', 
          targetMin: 100, 
          targetMax: 130, 
          color: '#9C27B0' 
        },
      ]
    },
    endurance_60km: {
      name: 'Resistencia 60km',
      steps: [
        { 
          id: '1', 
          name: 'Calentamiento', 
          stepType: 'warmup', 
          durationType: 'time', 
          duration: 900, 
          targetType: 'power', 
          targetMin: 120, 
          targetMax: 150, 
          color: '#4CAF50' 
        },
        { 
          id: '2', 
          name: 'Zona Aeróbica', 
          stepType: 'work', 
          durationType: 'distance', 
          distance: 60000, 
          targetType: 'power', 
          targetMin: 180, 
          targetMax: 220, 
          color: '#00BCD4' 
        },
        { 
          id: '3', 
          name: 'Enfriamiento', 
          stepType: 'cooldown', 
          durationType: 'time', 
          duration: 600, 
          targetType: 'power', 
          targetMin: 100, 
          targetMax: 130, 
          color: '#9C27B0' 
        },
      ]
    }
  },
  swimming: {
    technique_endurance: {
      name: 'Técnica y Resistencia',
      steps: [
        { 
          id: '1', 
          name: 'Calentamiento', 
          stepType: 'warmup', 
          durationType: 'distance', 
          distance: 400, 
          targetType: 'none', 
          color: '#4CAF50' 
        },
        {
          id: 'loop1',
          name: 'Serie de Técnica',
          repetitions: 4,
          steps: [
            { 
              id: '2', 
              name: 'Técnica', 
              stepType: 'work', 
              durationType: 'distance', 
              distance: 200, 
              targetType: 'none', 
              color: '#FF9800' 
            },
            { 
              id: '3', 
              name: 'Descanso', 
              stepType: 'rest', 
              durationType: 'time', 
              duration: 30, 
              targetType: 'none', 
              color: '#2196F3' 
            },
          ],
          color: '#FFB84D'
        },
        { 
          id: '4', 
          name: 'Serie Principal', 
          stepType: 'work', 
          durationType: 'distance', 
          distance: 800, 
          targetType: 'none', 
          color: '#00BCD4' 
        },
        { 
          id: '5', 
          name: 'Enfriamiento', 
          stepType: 'cooldown', 
          durationType: 'distance', 
          distance: 200, 
          targetType: 'none', 
          color: '#9C27B0' 
        },
      ]
    }
  }
};

/**
 * Componente principal del constructor avanzado
 * Implementa patrones de UX de Garmin Connect y Suunto App
 */
export default function AdvancedWorkoutBuilder({
  sport,
  visible,
  onClose,
  onSave
}: AdvancedWorkoutBuilderProps) {
  // ===== ESTADOS =====
  const [workoutName, setWorkoutName] = useState('');
  const [steps, setSteps] = useState<(WorkoutStep | WorkoutLoop)[]>([]);
  const [editingItem, setEditingItem] = useState<WorkoutStep | WorkoutLoop | null>(null);
  const [showItemEditor, setShowItemEditor] = useState(false);
  const [showLoopBuilder, setShowLoopBuilder] = useState(false);
  const [selectedStepsForLoop, setSelectedStepsForLoop] = useState<string[]>([]);

  /**
   * Obtiene la configuración específica del deporte
   */
  const getSportConfig = () => {
    switch (sport) {
      case 'running':
        return {
          name: 'Running',
          color: '#4ECDC4',
          icon: 'run',
          targetTypes: [
            { value: 'pace', label: 'Ritmo (min/km)', unit: 'min/km' },
            { value: 'heart_rate', label: 'Frecuencia Cardíaca', unit: 'ppm' },
            { value: 'none', label: 'Sin Objetivo', unit: '' }
          ]
        };
      case 'cycling':
        return {
          name: 'Ciclismo',
          color: '#45B7D1',
          icon: 'bike',
          targetTypes: [
            { value: 'power', label: 'Potencia (W)', unit: 'W' },
            { value: 'heart_rate', label: 'Frecuencia Cardíaca', unit: 'ppm' },
            { value: 'none', label: 'Sin Objetivo', unit: '' }
          ]
        };
      case 'swimming':
        return {
          name: 'Natación',
          color: '#96CEB4',
          icon: 'swim',
          targetTypes: [
            { value: 'none', label: 'Sin Objetivo', unit: '' }
          ]
        };
      default:
        return {
          name: 'Deporte',
          color: '#B0B0C4',
          icon: 'dumbbell',
          targetTypes: [
            { value: 'none', label: 'Sin Objetivo', unit: '' }
          ]
        };
    }
  };

  const config = getSportConfig();

  /**
   * Carga una plantilla predefinida
   */
  const loadTemplate = (templateKey: string) => {
    const template = WORKOUT_TEMPLATES[sport]?.[templateKey as keyof typeof WORKOUT_TEMPLATES[typeof sport]] as { name: string; steps: any[] } | undefined;
    if (template) {
      setWorkoutName(template.name);
      setSteps(template.steps.map((step: any) => ({
        ...step,
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      })));
    }
  };

  /**
   * Añade un nuevo paso individual
   */
  const addStep = (stepType: WorkoutStep['stepType']) => {
    const newStep: WorkoutStep = {
      id: `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: getStepTypeName(stepType),
      stepType,
      durationType: 'time',
      duration: stepType === 'warmup' ? 600 : stepType === 'cooldown' ? 600 : 120,
      distance: sport === 'swimming' ? 200 : sport === 'running' ? 400 : 1000,
      targetType: 'none',
      color: getStepColor(stepType)
    };
    setSteps([...steps, newStep]);
  };

  /**
   * Crea un loop con los pasos seleccionados
   */
  const createLoop = (repetitions: number) => {
    if (selectedStepsForLoop.length < 2) return;

    const selectedSteps = steps.filter(item => 
      'stepType' in item && selectedStepsForLoop.includes(item.id)
    ) as WorkoutStep[];

    const newLoop: WorkoutLoop = {
      id: `loop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: `Repetir ${repetitions}x`,
      repetitions,
      steps: selectedSteps.map(step => ({
        ...step,
        id: `${step.id}_loop_${Date.now()}`
      })),
      color: '#FF9800'
    };

    // Remover pasos individuales y añadir loop
    const remainingSteps = steps.filter(item => 
      !('stepType' in item) || !selectedStepsForLoop.includes(item.id)
    );
    
    setSteps([...remainingSteps, newLoop]);
    setSelectedStepsForLoop([]);
    setShowLoopBuilder(false);
  };

  /**
   * Obtiene el nombre del tipo de paso
   */
  const getStepTypeName = (stepType: WorkoutStep['stepType']) => {
    const names = {
      warmup: 'Calentamiento',
      work: 'Trabajo',
      rest: 'Descanso',
      recovery: 'Recuperación',
      cooldown: 'Enfriamiento'
    };
    return names[stepType];
  };

  /**
   * Obtiene el color del tipo de paso siguiendo el patrón de Garmin
   */
  const getStepColor = (stepType: WorkoutStep['stepType']) => {
    const colors = {
      warmup: '#4CAF50',
      work: '#FF5722',
      rest: '#2196F3',
      recovery: '#2196F3',
      cooldown: '#9C27B0'
    };
    return colors[stepType];
  };

  /**
   * Formatea tiempo en formato MM:SS
   */
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  /**
   * Formatea distancia en formato legible
   */
  const formatDistance = (meters: number) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${meters} m`;
  };

  /**
   * Formatea el objetivo de intensidad
   */
  const formatTarget = (item: WorkoutStep) => {
    if (item.targetType === 'none') return '';
    if (item.targetType === 'pace') {
      const minTime = Math.floor(item.targetMin! / 60);
      const minSecs = item.targetMin! % 60;
      const maxTime = Math.floor(item.targetMax! / 60);
      const maxSecs = item.targetMax! % 60;
      return `${minTime}:${minSecs.toString().padStart(2, '0')} - ${maxTime}:${maxSecs.toString().padStart(2, '0')} min/km`;
    }
    return `${item.targetMin} - ${item.targetMax} ${config.targetTypes.find(t => t.value === item.targetType)?.unit}`;
  };

  /**
   * Calcula estimaciones totales del entrenamiento
   */
  const calculateEstimates = () => {
    let totalTime = 0;
    let totalDistance = 0;
    
    steps.forEach(item => {
      if ('repetitions' in item) {
        // Es un loop
        item.steps.forEach(step => {
          totalTime += (step.duration || 0) * item.repetitions;
          totalDistance += (step.distance || 0) * item.repetitions;
        });
      } else {
        // Es un paso individual
        totalTime += item.duration || 0;
        totalDistance += item.distance || 0;
      }
    });
    
    return { totalTime, totalDistance };
  };

  const { totalTime, totalDistance } = calculateEstimates();

  /**
   * Edita un paso o loop
   */
  const editItem = (item: WorkoutStep | WorkoutLoop) => {
    setEditingItem(item);
    setShowItemEditor(true);
  };

  /**
   * Guarda cambios en un paso o loop
   */
  const saveItem = (updatedItem: WorkoutStep | WorkoutLoop) => {
    setSteps(steps.map(item => item.id === updatedItem.id ? updatedItem : item));
    setShowItemEditor(false);
    setEditingItem(null);
  };

  /**
   * Elimina un paso o loop
   */
  const deleteItem = (itemId: string) => {
    setSteps(steps.filter(item => item.id !== itemId));
  };

  /**
   * Guarda el plan de entrenamiento
   */
  const saveWorkout = () => {
    const workoutPlan: WorkoutPlan = {
      id: `workout_plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: workoutName || `Entrenamiento ${config.name}`,
      sport,
      steps,
      estimatedDuration: totalTime,
      estimatedDistance: totalDistance,
      createdAt: new Date().toISOString()
    };
    onSave(workoutPlan);
    onClose();
  };

  /**
   * Renderiza un paso individual o loop
   */
  const renderWorkoutItem = (item: WorkoutStep | WorkoutLoop, index: number) => {
    const isLoop = 'repetitions' in item;
    
    return (
      <Pressable
        key={item.id}
        onPress={() => editItem(item)}
        style={styles.workoutItem}
      >
        <LinearGradient
          colors={[item.color + '20', item.color + '10']}
          style={styles.workoutItemGradient}
        >
          <View style={styles.workoutItemHeader}>
            <View style={[styles.stepIndicator, { backgroundColor: item.color }]}>
              <MaterialCommunityIcons
                name={isLoop ? "repeat" : "play"}
                size={16}
                color="#FFFFFF"
              />
            </View>
            
            <View style={styles.workoutItemInfo}>
              <Text style={styles.workoutItemName}>{item.name}</Text>
              
              {isLoop ? (
                <View style={styles.loopInfo}>
                  <Text style={styles.workoutItemDetails}>
                    {item.repetitions} repeticiones • {item.steps.length} pasos
                  </Text>
                  
                  {/* Pasos dentro del loop */}
                  <View style={styles.loopSteps}>
                    {item.steps.map((step, stepIdx) => (
                      <View key={step.id} style={styles.loopStepItem}>
                        <View style={[styles.loopStepIndicator, { backgroundColor: step.color }]} />
                        <Text style={styles.loopStepText}>
                          {String.fromCharCode(65 + stepIdx)}. {step.name}
                          {step.durationType === 'time' && step.duration ? ` ${formatTime(step.duration)}` : ''}
                          {step.durationType === 'distance' && step.distance ? ` ${formatDistance(step.distance)}` : ''}
                          {formatTarget(step) && ` • ${formatTarget(step)}`}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : (
                <Text style={styles.workoutItemDetails}>
                  {item.durationType === 'time' && item.duration ? formatTime(item.duration) : ''}
                  {item.durationType === 'distance' && item.distance ? formatDistance(item.distance) : ''}
                  {item.durationType === 'lap_button' ? 'Presionar vuelta' : ''}
                  {formatTarget(item) && ` • ${formatTarget(item)}`}
                </Text>
              )}
            </View>
            
            <Pressable onPress={() => deleteItem(item.id)} style={styles.deleteItemBtn}>
              <MaterialCommunityIcons name="trash-can" size={18} color="#FF6B6B" />
            </Pressable>
          </View>
          
          {/* Checkbox para seleccionar para loop */}
          {!isLoop && (
            <Pressable
              onPress={() => {
                if (selectedStepsForLoop.includes(item.id)) {
                  setSelectedStepsForLoop(prev => prev.filter(id => id !== item.id));
                } else {
                  setSelectedStepsForLoop(prev => [...prev, item.id]);
                }
              }}
              style={styles.stepSelector}
            >
              <MaterialCommunityIcons
                name={selectedStepsForLoop.includes(item.id) ? "checkbox-marked" : "checkbox-blank-outline"}
                size={20}
                color={selectedStepsForLoop.includes(item.id) ? "#00D4AA" : "#B0B0C4"}
              />
              <Text style={styles.stepSelectorText}>
                {selectedStepsForLoop.includes(item.id) ? "Seleccionado para loop" : "Seleccionar para loop"}
              </Text>
            </Pressable>
          )}
        </LinearGradient>
      </Pressable>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <LinearGradient colors={['#0F0F23', '#1A1A3A', '#2D2D5F']} style={styles.container}>
        {/* ===== HEADER ===== */}
        <View style={styles.header}>
          <Text style={styles.title}>Constructor de {config.name}</Text>
          <Pressable onPress={onClose}>
            <MaterialCommunityIcons name="close" size={24} color="#FFFFFF" />
          </Pressable>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* ===== NOMBRE DEL ENTRENAMIENTO ===== */}
          <View style={styles.nameSection}>
            <Text style={styles.sectionTitle}>Nombre del Entrenamiento</Text>
            <TextInput
              value={workoutName}
              onChangeText={setWorkoutName}
              style={styles.nameInput}
              placeholder={`Entrenamiento ${config.name}`}
              placeholderTextColor="#B0B0C4"
            />
          </View>

          {/* ===== PLANTILLAS RÁPIDAS ===== */}
          <View style={styles.templatesSection}>
            <Text style={styles.sectionTitle}>Plantillas Rápidas</Text>
            <View style={styles.templateButtons}>
              {Object.entries(WORKOUT_TEMPLATES[sport] || {}).map(([key, template]) => (
                <Pressable
                  key={key}
                  onPress={() => loadTemplate(key)}
                  style={styles.templateButton}
                >
                  <MaterialCommunityIcons name={config.icon as any} size={16} color={config.color} />
                  <Text style={styles.templateButtonText}>{template.name}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* ===== AÑADIR PASOS ===== */}
          <View style={styles.addStepsSection}>
            <Text style={styles.sectionTitle}>Añadir Pasos</Text>
            <View style={styles.stepTypeButtons}>
              {[
                { type: 'warmup', label: 'Calentamiento', icon: 'thermometer-plus' },
                { type: 'work', label: 'Trabajo', icon: 'speedometer' },
                { type: 'rest', label: 'Descanso', icon: 'pause' },
                { type: 'recovery', label: 'Recuperación', icon: 'heart-pulse' },
                { type: 'cooldown', label: 'Enfriamiento', icon: 'thermometer-minus' }
              ].map((stepType) => (
                <Pressable
                  key={stepType.type}
                  onPress={() => addStep(stepType.type as WorkoutStep['stepType'])}
                  style={styles.stepTypeButton}
                >
                  <MaterialCommunityIcons
                    name={stepType.icon as any}
                    size={16}
                    color={getStepColor(stepType.type as WorkoutStep['stepType'])}
                  />
                  <Text style={styles.stepTypeButtonText}>{stepType.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* ===== CREAR LOOP ===== */}
          {selectedStepsForLoop.length >= 2 && (
            <View style={styles.loopBuilderSection}>
              <LinearGradient
                colors={["#FF9800", "#F57C00"]}
                style={styles.loopBuilderGradient}
              >
                <MaterialCommunityIcons name="repeat" size={20} color="#FFFFFF" />
                <Text style={styles.loopBuilderText}>
                  Crear Loop con {selectedStepsForLoop.length} pasos
                </Text>
                <Pressable
                  onPress={() => setShowLoopBuilder(true)}
                  style={styles.loopBuilderBtn}
                >
                  <Text style={styles.loopBuilderBtnText}>Crear</Text>
                </Pressable>
              </LinearGradient>
            </View>
          )}

          {/* ===== ESTRUCTURA DEL ENTRENAMIENTO ===== */}
          <View style={styles.workoutStructure}>
            <Text style={styles.sectionTitle}>Estructura del Entrenamiento ({steps.length})</Text>
            {steps.map((item, index) => renderWorkoutItem(item, index))}
          </View>

          {/* ===== RESUMEN ===== */}
          {steps.length > 0 && (
            <View style={styles.summarySection}>
              <Text style={styles.sectionTitle}>Resumen del Entrenamiento</Text>
              <LinearGradient
                colors={[config.color + '20', config.color + '10']}
                style={styles.summaryGradient}
              >
                <View style={styles.summaryStats}>
                  <View style={styles.summaryStatItem}>
                    <MaterialCommunityIcons name="clock" size={16} color={config.color} />
                    <Text style={styles.summaryStatText}>
                      {formatTime(totalTime)}
                    </Text>
                  </View>
                  <View style={styles.summaryStatItem}>
                    <MaterialCommunityIcons name="map-marker-distance" size={16} color={config.color} />
                    <Text style={styles.summaryStatText}>
                      {formatDistance(totalDistance)}
                    </Text>
                  </View>
                  <View style={styles.summaryStatItem}>
                    <MaterialCommunityIcons name="format-list-numbered" size={16} color={config.color} />
                    <Text style={styles.summaryStatText}>
                      {steps.length} elementos
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </View>
          )}
        </ScrollView>

        {/* ===== BOTONES DE ACCIÓN ===== */}
        <View style={styles.actions}>
          <Pressable onPress={onClose} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </Pressable>
          <Pressable
            onPress={saveWorkout}
            style={[styles.saveBtn, steps.length === 0 && styles.saveBtnDisabled]}
            disabled={steps.length === 0}
          >
            <LinearGradient
              colors={steps.length > 0 ? [config.color, config.color + '80'] : ["#6B7280", "#4B5563"]}
              style={styles.saveGradient}
            >
              <Text style={styles.saveText}>Guardar Entrenamiento</Text>
            </LinearGradient>
          </Pressable>
        </View>

        {/* ===== MODAL CONSTRUCTOR DE LOOPS ===== */}
        <Modal
          visible={showLoopBuilder}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setShowLoopBuilder(false)}
        >
          <View style={styles.modalOverlay}>
            <LinearGradient
              colors={['#0F0F23', '#1A1A3A', '#2D2D5F']}
              style={styles.loopBuilderModal}
            >
              <Text style={styles.loopBuilderModalTitle}>Crear Loop de Repetición</Text>
              
              <Text style={styles.loopBuilderModalText}>
                Se repetirán los pasos seleccionados en orden:
              </Text>
              
              <View style={styles.selectedStepsList}>
                {selectedStepsForLoop.map((stepId, index) => {
                  const step = steps.find(s => s.id === stepId) as WorkoutStep;
                  return (
                    <View key={stepId} style={styles.selectedStepItem}>
                      <View style={[styles.selectedStepIndicator, { backgroundColor: step.color }]} />
                      <Text style={styles.selectedStepText}>
                        {String.fromCharCode(65 + index)}. {step.name}
                      </Text>
                    </View>
                  );
                })}
              </View>
              
              <View style={styles.repetitionsInput}>
                <Text style={styles.repetitionsLabel}>Número de repeticiones:</Text>
                <View style={styles.repetitionsButtons}>
                  {[2, 3, 4, 5, 8, 10].map((num) => (
                    <Pressable
                      key={num}
                      onPress={() => createLoop(num)}
                      style={styles.repetitionBtn}
                    >
                      <Text style={styles.repetitionBtnText}>{num}x</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              
              <Pressable
                onPress={() => setShowLoopBuilder(false)}
                style={styles.loopBuilderCancelBtn}
              >
                <Text style={styles.loopBuilderCancelText}>Cancelar</Text>
              </Pressable>
            </LinearGradient>
          </View>
        </Modal>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },

  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  content: {
    flex: 1,
    paddingHorizontal: 20,
  },

  nameSection: {
    marginVertical: 20,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },

  nameInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  templatesSection: {
    marginBottom: 20,
  },

  templateButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  templateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },

  templateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  addStepsSection: {
    marginBottom: 20,
  },

  stepTypeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  stepTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },

  stepTypeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  loopBuilderSection: {
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },

  loopBuilderGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },

  loopBuilderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },

  loopBuilderBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },

  loopBuilderBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  workoutStructure: {
    marginBottom: 20,
  },

  workoutItem: {
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },

  workoutItemGradient: {
    padding: 12,
    borderRadius: 12,
  },

  workoutItemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },

  stepIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },

  workoutItemInfo: {
    flex: 1,
  },

  workoutItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },

  workoutItemDetails: {
    fontSize: 12,
    color: '#B0B0C4',
  },

  loopInfo: {
    marginTop: 4,
  },

  loopSteps: {
    marginTop: 8,
    marginLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(255, 255, 255, 0.2)',
    paddingLeft: 8,
  },

  loopStepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },

  loopStepIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  loopStepText: {
    fontSize: 11,
    color: '#B0B0C4',
    flex: 1,
  },

  deleteItemBtn: {
    padding: 8,
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    borderRadius: 8,
  },

  stepSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },

  stepSelectorText: {
    fontSize: 12,
    color: '#B0B0C4',
  },

  summarySection: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },

  summaryGradient: {
    borderRadius: 12,
    padding: 12,
  },

  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },

  summaryStatItem: {
    alignItems: 'center',
    gap: 4,
  },

  summaryStatText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },

  actions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },

  cancelBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },

  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#B0B0C4',
  },

  saveBtn: {
    flex: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },

  saveBtnDisabled: {
    opacity: 0.5,
  },

  saveGradient: {
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },

  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Loop Builder Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  loopBuilderModal: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
  },

  loopBuilderModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },

  loopBuilderModalText: {
    fontSize: 14,
    color: '#B0B0C4',
    marginBottom: 16,
    textAlign: 'center',
  },

  selectedStepsList: {
    marginBottom: 20,
  },

  selectedStepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },

  selectedStepIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },

  selectedStepText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },

  repetitionsInput: {
    marginBottom: 20,
  },

  repetitionsLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },

  repetitionsButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },

  repetitionBtn: {
    backgroundColor: '#00D4AA',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },

  repetitionBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  loopBuilderCancelBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },

  loopBuilderCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#B0B0C4',
  },
});