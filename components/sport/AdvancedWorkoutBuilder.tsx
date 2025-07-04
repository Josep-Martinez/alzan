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
 * DATOS BD: Estructura para tabla workout_steps
 */
interface WorkoutStep {
  id: string; // BD: step_id (PRIMARY KEY)
  name: string; // BD: step_name
  stepType: 'warmup' | 'interval' | 'recovery' | 'cooldown'; // BD: step_type (ENUM)
  durationType: 'time' | 'distance' | 'lap_button' | 'heart_rate'; // BD: duration_type (ENUM)
  duration?: number; // BD: duration_seconds (tiempo en segundos)
  distance?: number; // BD: distance_meters (distancia en metros)
  targetType?: 'pace' | 'heart_rate' | 'power' | 'none'; // BD: target_type (ENUM)
  targetMin?: number; // BD: target_min_value
  targetMax?: number; // BD: target_max_value
  color: string; // BD: step_color (para UI)
}

/**
 * Estructura de loops/repeticiones como en Garmin Connect
 * DATOS BD: Tabla workout_loops con foreign key a workout_plans
 */
interface WorkoutLoop {
  id: string; // BD: loop_id (PRIMARY KEY)
  name: string; // BD: loop_name
  repetitions: number; // BD: repetition_count
  steps: WorkoutStep[]; // BD: Relación con workout_steps
  color: string; // BD: loop_color
}

/**
 * Plan de entrenamiento completo
 * DATOS BD: Tabla workout_plans
 */
interface WorkoutPlan {
  id: string; // BD: plan_id (PRIMARY KEY)
  name: string; // BD: plan_name
  sport: 'running' | 'cycling' | 'swimming'; // BD: sport_type
  steps: (WorkoutStep | WorkoutLoop)[]; // BD: Estructura JSON o relaciones
  estimatedDuration: number; // BD: estimated_duration_seconds
  estimatedDistance: number; // BD: estimated_distance_meters
  createdAt: string; // BD: created_at
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
 * Plantillas predefinidas mejoradas (movidas desde OtherSportsSessions)
 * DATOS BD: Tabla workout_templates con datos predefinidos
 */
const WORKOUT_TEMPLATES = {
  running: [
    {
      id: 'easy_run',
      name: 'Rodaje Suave',
      description: '30-60 min a ritmo conversacional',
      icon: 'run',
      color: '#4CAF50',
      estimatedTime: 45,
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
          name: 'Rodaje Suave', 
          stepType: 'interval', 
          durationType: 'time', 
          duration: 2400, 
          targetType: 'pace', 
          targetMin: 300, 
          targetMax: 330, 
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
    },
    {
      id: 'intervals_400m',
      name: 'Intervalos 400m',
      description: 'Series de velocidad con descanso',
      icon: 'speedometer',
      color: '#FF5722',
      estimatedTime: 40,
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
              stepType: 'interval', 
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
    {
      id: 'tempo_20min',
      name: 'Tempo 20 min',
      description: '20 min a ritmo de umbral',
      icon: 'timer',
      color: '#FF9800',
      estimatedTime: 35,
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
          stepType: 'interval', 
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
    {
      id: 'long_run',
      name: 'Tirada Larga 10K',
      description: 'Carrera continua de resistencia',
      icon: 'map-marker-distance',
      color: '#00BCD4',
      estimatedTime: 60,
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
          stepType: 'interval', 
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
  ],
  cycling: [
    {
      id: 'endurance_60km',
      name: 'Resistencia 60km',
      description: '60-120 min a ritmo aeróbico',
      icon: 'bike',
      color: '#00BCD4',
      estimatedTime: 120,
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
          stepType: 'interval', 
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
    },
    {
      id: 'power_intervals',
      name: 'Intervalos de Potencia',
      description: 'Series de potencia con recuperación',
      icon: 'speedometer',
      color: '#FF5722',
      estimatedTime: 75,
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
              stepType: 'interval', 
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
    }
  ],
  swimming: [
    {
      id: 'technique_endurance',
      name: 'Técnica y Resistencia',
      description: 'Ejercicios de técnica y drills',
      icon: 'swim',
      color: '#4CAF50',
      estimatedTime: 60,
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
              stepType: 'interval', 
              durationType: 'distance', 
              distance: 200, 
              targetType: 'none', 
              color: '#FF9800' 
            },
            { 
              id: '3', 
              name: 'Descanso', 
              stepType: 'recovery', 
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
          stepType: 'interval', 
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
  ]
};

/**
 * Componente principal del constructor avanzado
 * Implementa patrones de UX de Garmin Connect y Suunto App
 * DATOS BD: Crea planes en workout_plans y relaciona con workout_steps/workout_loops
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
  const [showTemplates, setShowTemplates] = useState(false);

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
            { value: 'pace', label: 'Ritmo', unit: 'min/km' },
            { value: 'heart_rate', label: 'Frecuencia Cardíaca', unit: 'ppm' },
            { value: 'none', label: 'Sin Objetivo', unit: '' }
          ],
          durationTypes: [
            { value: 'time', label: 'Tiempo', unit: 'min' },
            { value: 'distance', label: 'Distancia', unit: 'km' },
            { value: 'lap_button', label: 'Botón de vuelta', unit: '' }
          ]
        };
      case 'cycling':
        return {
          name: 'Ciclismo',
          color: '#45B7D1',
          icon: 'bike',
          targetTypes: [
            { value: 'power', label: 'Potencia', unit: 'W' },
            { value: 'heart_rate', label: 'Frecuencia Cardíaca', unit: 'ppm' },
            { value: 'none', label: 'Sin Objetivo', unit: '' }
          ],
          durationTypes: [
            { value: 'time', label: 'Tiempo', unit: 'min' },
            { value: 'distance', label: 'Distancia', unit: 'km' },
            { value: 'lap_button', label: 'Botón de vuelta', unit: '' }
          ]
        };
      case 'swimming':
        return {
          name: 'Natación',
          color: '#96CEB4',
          icon: 'swim',
          targetTypes: [
            { value: 'none', label: 'Sin Objetivo', unit: '' }
          ],
          durationTypes: [
            { value: 'time', label: 'Tiempo', unit: 'min' },
            { value: 'distance', label: 'Distancia', unit: 'm' }
          ]
        };
      default:
        return {
          name: 'Deporte',
          color: '#B0B0C4',
          icon: 'dumbbell',
          targetTypes: [
            { value: 'none', label: 'Sin Objetivo', unit: '' }
          ],
          durationTypes: [
            { value: 'time', label: 'Tiempo', unit: 'min' }
          ]
        };
    }
  };

  const config = getSportConfig();

  /**
   * Carga una plantilla predefinida
   * DATOS BD: Clona datos de workout_templates a nuevo workout_plan
   */
  const loadTemplate = (template: any) => {
    setWorkoutName(template.name);
    setSteps(template.steps.map((step: any) => ({
      ...step,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    })));
  };

  /**
   * Añade un nuevo paso individual
   * DATOS BD: Nuevo registro en workout_steps
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
   * Edita un paso o loop - NUEVA FUNCIONALIDAD
   */
  const editItem = (item: WorkoutStep | WorkoutLoop) => {
    setEditingItem(item);
    setShowItemEditor(true);
  };

  /**
   * Guarda cambios en un paso - NUEVA FUNCIONALIDAD MEJORADA
   */
  const saveStep = (updatedStep: WorkoutStep) => {
    setSteps(steps.map(item => 
      item.id === updatedStep.id ? updatedStep : item
    ));
    setShowItemEditor(false);
    setEditingItem(null);
  };

  /**
   * Crea un loop con los pasos seleccionados
   * DATOS BD: Nuevo registro en workout_loops con relaciones a workout_steps
   */
  const createLoop = (repetitions: number) => {
    if (selectedStepsForLoop.length < 2) return;

    // Obtener pasos en el orden seleccionado (orden importa para ejecución)
    const selectedSteps = selectedStepsForLoop.map(stepId => 
      steps.find(item => 'stepType' in item && item.id === stepId)
    ).filter(Boolean) as WorkoutStep[];

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
   * Reordena los ejercicios seleccionados para el loop
   */
  const reorderSelectedStep = (fromIndex: number, toIndex: number) => {
    const newOrder = [...selectedStepsForLoop];
    const [movedItem] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, movedItem);
    setSelectedStepsForLoop(newOrder);
  };

  /**
   * Obtiene el nombre del tipo de paso
   */
  const getStepTypeName = (stepType: WorkoutStep['stepType']) => {
    const names = {
      warmup: 'Calentamiento',
      interval: 'Intervalo',
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
      interval: '#FF5722',
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
    if (sport === 'swimming') {
      return `${meters} m`;
    }
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
   * Elimina un paso o loop
   * DATOS BD: DELETE de workout_steps o workout_loops
   */
  const deleteItem = (itemId: string) => {
    setSteps(steps.filter(item => item.id !== itemId));
  };

  /**
   * Guarda el plan de entrenamiento
   * DATOS BD: INSERT en workout_plans con todas las relaciones
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

  const templates = WORKOUT_TEMPLATES[sport] || [];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <LinearGradient colors={['#0F0F23', '#1A1A3A', '#2D2D5F']} style={styles.container}>
        {/* ===== HEADER ===== */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <MaterialCommunityIcons name="cog" size={24} color="#FF6B6B" />
            <Text style={styles.title}>Constructor de {config.name}</Text>
          </View>
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

          {/* ===== PLANTILLAS RÁPIDAS (MINIMIZABLES) ===== */}
          <View style={styles.templatesSection}>
            <Pressable 
              onPress={() => setShowTemplates(!showTemplates)}
              style={styles.templatesSectionHeader}
            >
              <Text style={styles.sectionTitle}>Plantillas Rápidas</Text>
              <MaterialCommunityIcons 
                name={showTemplates ? "chevron-up" : "chevron-down"} 
                size={24} 
                color="#B0B0C4" 
              />
            </Pressable>
            
            {showTemplates && (
              <View style={styles.templateButtons}>
                {templates.map((template) => (
                  <Pressable
                    key={template.id}
                    onPress={() => loadTemplate(template)}
                    style={styles.templateButton}
                  >
                    <LinearGradient
                      colors={[template.color + '20', template.color + '10']}
                      style={styles.templateButtonGradient}
                    >
                      <MaterialCommunityIcons name={template.icon as any} size={20} color={template.color} />
                      <Text style={styles.templateButtonName}>{template.name}</Text>
                      <Text style={styles.templateButtonDescription}>{template.description}</Text>
                      <Text style={styles.templateButtonTime}>{template.estimatedTime} min</Text>
                    </LinearGradient>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {/* ===== AÑADIR PASOS ===== */}
          <View style={styles.addStepsSection}>
            <Text style={styles.sectionTitle}>Añadir Pasos</Text>
            <View style={styles.stepTypeButtons}>
              {[
                { type: 'warmup', label: 'Calentamiento', icon: 'thermometer-plus' },
                { type: 'interval', label: 'Intervalo', icon: 'speedometer' },
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

        {/* ===== MODAL CONSTRUCTOR DE LOOPS CON REORDENAMIENTO ===== */}
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
                Orden de ejecución (el primero se ejecuta primero):
              </Text>
              
              <View style={styles.selectedStepsList}>
                {selectedStepsForLoop.map((stepId, index) => {
                  const step = steps.find(s => s.id === stepId) as WorkoutStep;
                  return (
                    <View key={stepId} style={styles.selectedStepItem}>
                      <View style={[styles.selectedStepIndicator, { backgroundColor: step.color }]} />
                      <Text style={styles.selectedStepText}>
                        {index + 1}. {step.name}
                      </Text>
                      
                      {/* Botones de reordenamiento */}
                      <View style={styles.reorderButtons}>
                        {index > 0 && (
                          <Pressable
                            onPress={() => reorderSelectedStep(index, index - 1)}
                            style={styles.reorderBtn}
                          >
                            <MaterialCommunityIcons name="arrow-up" size={16} color="#00D4AA" />
                          </Pressable>
                        )}
                        {index < selectedStepsForLoop.length - 1 && (
                          <Pressable
                            onPress={() => reorderSelectedStep(index, index + 1)}
                            style={styles.reorderBtn}
                          >
                            <MaterialCommunityIcons name="arrow-down" size={16} color="#00D4AA" />
                          </Pressable>
                        )}
                      </View>
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

        {/* ===== MODAL EDITOR DE PASOS ESTILO GARMIN ===== */}
        <Modal
          visible={showItemEditor}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowItemEditor(false)}
        >
          {editingItem && 'stepType' in editingItem && (
            <StepEditor
              step={editingItem}
              sport={sport}
              config={config}
              onSave={saveStep}
              onClose={() => setShowItemEditor(false)}
            />
          )}
        </Modal>
      </LinearGradient>
    </Modal>
  );
}

/**
 * Componente Editor de Pasos estilo Garmin/Suunto
 */
interface StepEditorProps {
  step: WorkoutStep;
  sport: 'running' | 'cycling' | 'swimming';
  config: any;
  onSave: (step: WorkoutStep) => void;
  onClose: () => void;
}

function StepEditor({ step, sport, config, onSave, onClose }: StepEditorProps) {
  const [editedStep, setEditedStep] = useState<WorkoutStep>({ ...step });

  const updateStep = (field: keyof WorkoutStep, value: any) => {
    setEditedStep(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave(editedStep);
  };

  const formatDurationValue = () => {
    if (editedStep.durationType === 'time' && editedStep.duration) {
      return Math.floor(editedStep.duration / 60).toString();
    }
    if (editedStep.durationType === 'distance' && editedStep.distance) {
      return sport === 'swimming' 
        ? editedStep.distance.toString()
        : (editedStep.distance / 1000).toString();
    }
    return '';
  };

  const handleDurationValueChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    if (editedStep.durationType === 'time') {
      updateStep('duration', numValue * 60);
    } else if (editedStep.durationType === 'distance') {
      const meters = sport === 'swimming' ? numValue : numValue * 1000;
      updateStep('distance', meters);
    }
  };

  return (
    <LinearGradient colors={['#0F0F23', '#1A1A3A', '#2D2D5F']} style={styles.stepEditorContainer}>
      <View style={styles.stepEditorHeader}>
        <Text style={styles.stepEditorTitle}>EDITAR PASO</Text>
        <Pressable onPress={onClose} style={styles.stepEditorCloseBtn}>
          <MaterialCommunityIcons name="close" size={24} color="#B0B0C4" />
        </Pressable>
      </View>

      <ScrollView style={styles.stepEditorContent}>
        {/* Fase */}
        <View style={styles.editorSection}>
          <Text style={styles.editorLabel}>Fase</Text>
          <View style={styles.phaseSelector}>
            {[
              { type: 'warmup', label: 'Calentamiento', color: '#4CAF50' },
              { type: 'interval', label: 'Intervalo', color: '#FF5722' },
              { type: 'recovery', label: 'Recuperación', color: '#2196F3' },
              { type: 'cooldown', label: 'Enfriamiento', color: '#9C27B0' }
            ].map((phase) => (
              <Pressable
                key={phase.type}
                onPress={() => {
                  updateStep('stepType', phase.type);
                  updateStep('color', phase.color);
                }}
                style={[
                  styles.phaseOption,
                  editedStep.stepType === phase.type && styles.phaseOptionSelected,
                  { borderColor: phase.color }
                ]}
              >
                <View style={[styles.phaseIndicator, { backgroundColor: phase.color }]} />
                <Text style={[
                  styles.phaseOptionText,
                  editedStep.stepType === phase.type && { color: phase.color }
                ]}>
                  {phase.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Nombre del paso */}
        <View style={styles.editorSection}>
          <Text style={styles.editorLabel}>Nombre del paso</Text>
          <TextInput
            value={editedStep.name}
            onChangeText={(text) => updateStep('name', text)}
            style={styles.stepNameInput}
            placeholder="Nombre del paso"
            placeholderTextColor="#6B7280"
          />
        </View>

        {/* Duración */}
        <View style={styles.editorSection}>
          <Text style={styles.editorLabel}>Duración</Text>
          
          {/* Selector de tipo de duración */}
          <View style={styles.durationTypeSelector}>
            {config.durationTypes.map((durationType: any) => (
              <Pressable
                key={durationType.value}
                onPress={() => updateStep('durationType', durationType.value)}
                style={[
                  styles.durationTypeOption,
                  editedStep.durationType === durationType.value && styles.durationTypeOptionSelected
                ]}
              >
                <Text style={[
                  styles.durationTypeText,
                  editedStep.durationType === durationType.value && styles.durationTypeTextSelected
                ]}>
                  {durationType.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Input de valor */}
          {editedStep.durationType !== 'lap_button' && (
            <View style={styles.durationValueContainer}>
              <TextInput
                value={formatDurationValue()}
                onChangeText={handleDurationValueChange}
                style={styles.durationValueInput}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#6B7280"
              />
              <Text style={styles.durationValueUnit}>
                {editedStep.durationType === 'time' ? 'min' :
                 sport === 'swimming' ? 'm' : 'km'}
              </Text>
            </View>
          )}
        </View>

        {/* Objetivo */}
        <View style={styles.editorSection}>
          <Text style={styles.editorLabel}>Objetivo</Text>
          
          {/* Selector de tipo de objetivo */}
          <View style={styles.targetTypeSelector}>
            {config.targetTypes.map((targetType: any) => (
              <Pressable
                key={targetType.value}
                onPress={() => updateStep('targetType', targetType.value)}
                style={[
                  styles.targetTypeOption,
                  editedStep.targetType === targetType.value && styles.targetTypeOptionSelected
                ]}
              >
                <Text style={[
                  styles.targetTypeText,
                  editedStep.targetType === targetType.value && styles.targetTypeTextSelected
                ]}>
                  {targetType.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Inputs de rango de objetivo */}
          {editedStep.targetType !== 'none' && (
            <View style={styles.targetRangeContainer}>
              <View style={styles.targetRangeInputGroup}>
                <Text style={styles.targetRangeLabel}>Mínimo</Text>
                <TextInput
                  value={editedStep.targetMin?.toString() || ''}
                  onChangeText={(text) => updateStep('targetMin', parseInt(text) || 0)}
                  style={styles.targetRangeInput}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#6B7280"
                />
              </View>
              
              <Text style={styles.targetRangeSeparator}>-</Text>
              
              <View style={styles.targetRangeInputGroup}>
                <Text style={styles.targetRangeLabel}>Máximo</Text>
                <TextInput
                  value={editedStep.targetMax?.toString() || ''}
                  onChangeText={(text) => updateStep('targetMax', parseInt(text) || 0)}
                  style={styles.targetRangeInput}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#6B7280"
                />
              </View>

              <Text style={styles.targetRangeUnit}>
                {config.targetTypes.find((t: any) => t.value === editedStep.targetType)?.unit || ''}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Botones de acción */}
      <View style={styles.stepEditorActions}>
        <Pressable onPress={onClose} style={styles.stepEditorCancelBtn}>
          <Text style={styles.stepEditorCancelText}>Cancelar</Text>
        </Pressable>
        <Pressable onPress={handleSave} style={styles.stepEditorSaveBtn}>
          <LinearGradient
            colors={["#00D4AA", "#00B894"]}
            style={styles.stepEditorSaveGradient}
          >
            <Text style={styles.stepEditorSaveText}>Guardar Paso</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </LinearGradient>
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

  templatesSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  templateButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },

  templateButton: {
    width: '47%',
    borderRadius: 16,
    overflow: 'hidden',
  },

  templateButtonGradient: {
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    minHeight: 120,
  },

  templateButtonName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 8,
    textAlign: 'center',
  },

  templateButtonDescription: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 14,
  },

  templateButtonTime: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
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
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 12,
    borderRadius: 8,
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
    flex: 1,
  },

  reorderButtons: {
    flexDirection: 'row',
    gap: 4,
  },

  reorderBtn: {
    padding: 4,
    backgroundColor: 'rgba(0, 212, 170, 0.2)',
    borderRadius: 4,
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

  // ===== STEP EDITOR STYLES =====
  stepEditorContainer: {
    flex: 1,
  },

  stepEditorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },

  stepEditorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  stepEditorCloseBtn: {
    padding: 8,
  },

  stepEditorContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },

  editorSection: {
    marginBottom: 24,
  },

  editorLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#B0B0C4',
    marginBottom: 12,
  },

  // Fase selector
  phaseSelector: {
    gap: 8,
  },

  phaseOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 12,
  },

  phaseOptionSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },

  phaseIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },

  phaseOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },

  // Nombre del paso
  stepNameInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },

  // Duración
  durationTypeSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },

  durationTypeOption: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    alignItems: 'center',
  },

  durationTypeOptionSelected: {
    backgroundColor: '#00D4AA',
  },

  durationTypeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#B0B0C4',
  },

  durationTypeTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  durationValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },

  durationValueInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },

  durationValueUnit: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#B0B0C4',
  },

  // Objetivo
  targetTypeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },

  targetTypeOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    alignItems: 'center',
  },

  targetTypeOptionSelected: {
    backgroundColor: '#00D4AA',
  },

  targetTypeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#B0B0C4',
  },

  targetTypeTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  targetRangeContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },

  targetRangeInputGroup: {
    flex: 1,
  },

  targetRangeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B0B0C4',
    marginBottom: 4,
  },

  targetRangeInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },

  targetRangeSeparator: {
    fontSize: 16,
    fontWeight: '600',
    color: '#B0B0C4',
    paddingBottom: 8,
  },

  targetRangeUnit: {
    fontSize: 14,
    fontWeight: '600',
    color: '#B0B0C4',
    paddingBottom: 8,
  },

  // Botones de acción
  stepEditorActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },

  stepEditorCancelBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },

  stepEditorCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#B0B0C4',
  },

  stepEditorSaveBtn: {
    flex: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },

  stepEditorSaveGradient: {
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },

  stepEditorSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});