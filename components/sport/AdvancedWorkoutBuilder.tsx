// components/sport/AdvancedWorkoutBuilder.tsx - Constructor avanzado con ruedas realistas
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
  stepType: 'warmup' | 'interval' | 'recovery' | 'cooldown';
  durationType: 'time' | 'distance' | 'lap_button';
  duration?: number;
  distance?: number;
  targetType?: 'pace' | 'heart_rate' | 'power' | 'velocity' | 'none';
  targetMin?: number;
  targetMax?: number;
  color: string;
}

/**
 * Estructura de loops/repeticiones
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
 * Plantillas predefinidas con valores realistas
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
          stepType: 'warmup' as const, 
          durationType: 'time' as const, 
          duration: 600, 
          targetType: 'heart_rate' as const, 
          targetMin: 120, 
          targetMax: 140, 
          color: '#4CAF50' 
        },
        { 
          id: '2', 
          name: 'Rodaje Suave', 
          stepType: 'interval' as const, 
          durationType: 'time' as const, 
          duration: 2400, 
          targetType: 'pace' as const, 
          targetMin: 330, // 5:30 min/km
          targetMax: 390, // 6:30 min/km
          color: '#00BCD4' 
        },
        { 
          id: '3', 
          name: 'Enfriamiento', 
          stepType: 'cooldown' as const, 
          durationType: 'time' as const, 
          duration: 300, 
          targetType: 'none' as const, 
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
          stepType: 'warmup' as const, 
          durationType: 'time' as const, 
          duration: 900, 
          targetType: 'power' as const, 
          targetMin: 120, 
          targetMax: 150, 
          color: '#4CAF50' 
        },
        { 
          id: '2', 
          name: 'Zona Aeróbica', 
          stepType: 'interval' as const, 
          durationType: 'distance' as const, 
          distance: 60000, 
          targetType: 'power' as const, 
          targetMin: 180, 
          targetMax: 220, 
          color: '#00BCD4' 
        },
        { 
          id: '3', 
          name: 'Enfriamiento', 
          stepType: 'cooldown' as const, 
          durationType: 'time' as const, 
          duration: 600, 
          targetType: 'power' as const, 
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
          stepType: 'warmup' as const, 
          durationType: 'distance' as const, 
          distance: 400, 
          targetType: 'pace' as const, 
          targetMin: 150, // 2:30 min/100m
          targetMax: 180, // 3:00 min/100m
          color: '#4CAF50' 
        },
        { 
          id: '4', 
          name: 'Serie Principal', 
          stepType: 'interval' as const, 
          durationType: 'distance' as const, 
          distance: 800, 
          targetType: 'heart_rate' as const, 
          targetMin: 140, 
          targetMax: 160, 
          color: '#00BCD4' 
        },
        { 
          id: '5', 
          name: 'Enfriamiento', 
          stepType: 'cooldown' as const, 
          durationType: 'distance' as const, 
          distance: 200, 
          targetType: 'none' as const, 
          color: '#9C27B0' 
        },
      ]
    }
  ]
};

/**
 * Componente principal del constructor avanzado
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
  const [editingItem, setEditingItem] = useState<WorkoutStep | null>(null);
  const [showItemEditor, setShowItemEditor] = useState(false);
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
            { value: 'velocity', label: 'Velocidad', unit: 'km/h' },
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
            { value: 'velocity', label: 'Velocidad', unit: 'km/h' },
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
            { value: 'pace', label: 'Ritmo', unit: 'min/100m' },
            { value: 'heart_rate', label: 'Frecuencia Cardíaca', unit: 'ppm' },
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
   * Edita un paso
   */
  const editItem = (item: WorkoutStep | WorkoutLoop) => {
    if ('stepType' in item) {
      setEditingItem(item);
      setShowItemEditor(true);
    }
  };

  /**
   * Guarda cambios en un paso
   */
  const saveStep = (updatedStep: WorkoutStep) => {
    setSteps(steps.map(item => 
      item.id === updatedStep.id ? updatedStep : item
    ));
    setShowItemEditor(false);
    setEditingItem(null);
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
   * Obtiene el color del tipo de paso
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
    if (item.targetType === 'none' || !item.targetMin || !item.targetMax) return '';
    
    if (item.targetType === 'pace') {
      const minTime = Math.floor(item.targetMin / 60);
      const minSecs = item.targetMin % 60;
      const maxTime = Math.floor(item.targetMax / 60);
      const maxSecs = item.targetMax % 60;
      
      const unit = sport === 'swimming' ? 'min/100m' : 'min/km';
      return `${minTime}:${minSecs.toString().padStart(2, '0')} - ${maxTime}:${maxSecs.toString().padStart(2, '0')} ${unit}`;
    }
    
    const targetType = config.targetTypes.find(t => t.value === item.targetType);
    return `${item.targetMin} - ${item.targetMax} ${targetType?.unit || ''}`;
  };

  /**
   * Calcula estimaciones totales del entrenamiento
   */
  const calculateEstimates = () => {
    let totalTime = 0;
    let totalDistance = 0;
    
    steps.forEach(item => {
      if ('repetitions' in item) {
        item.steps.forEach(step => {
          totalTime += (step.duration || 0) * item.repetitions;
          totalDistance += (step.distance || 0) * item.repetitions;
        });
      } else {
        totalTime += item.duration || 0;
        totalDistance += item.distance || 0;
      }
    });
    
    return { totalTime, totalDistance };
  };

  const { totalTime, totalDistance } = calculateEstimates();

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
                <Text style={styles.workoutItemDetails}>
                  {item.repetitions} repeticiones • {item.steps.length} pasos
                </Text>
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

          {/* ===== PLANTILLAS RÁPIDAS ===== */}
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

        {/* ===== MODAL EDITOR DE PASOS CON RUEDAS ===== */}
        <Modal
          visible={showItemEditor}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowItemEditor(false)}
        >
          {editingItem && (
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
 * Componente Editor de Pasos con ruedas realistas
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

  /**
   * Genera rangos realistas para cada tipo de objetivo según el deporte
   */
  const getTargetRanges = () => {
    switch (sport) {
      case 'running':
        return {
          pace: {
            minMinutes: [3, 4, 5, 6, 7, 8, 9, 10],
            minSeconds: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55],
            maxMinutes: [3, 4, 5, 6, 7, 8, 9, 10],
            maxSeconds: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55],
            unit: 'min/km'
          },
          heart_rate: {
            min: Array.from({length: 101}, (_, i) => i + 100),
            max: Array.from({length: 101}, (_, i) => i + 100),
            unit: 'ppm'
          },
          velocity: {
            min: Array.from({length: 26}, (_, i) => (i + 7.5).toFixed(1)),
            max: Array.from({length: 26}, (_, i) => (i + 7.5).toFixed(1)),
            unit: 'km/h'
          }
        };
      case 'cycling':
        return {
          power: {
            min: Array.from({length: 301}, (_, i) => i + 100),
            max: Array.from({length: 301}, (_, i) => i + 100),
            unit: 'W'
          },
          heart_rate: {
            min: Array.from({length: 101}, (_, i) => i + 100),
            max: Array.from({length: 101}, (_, i) => i + 100),
            unit: 'ppm'
          },
          velocity: {
            min: Array.from({length: 36}, (_, i) => i + 15),
            max: Array.from({length: 36}, (_, i) => i + 15),
            unit: 'km/h'
          }
        };
      case 'swimming':
        return {
          heart_rate: {
            min: Array.from({length: 81}, (_, i) => i + 100),
            max: Array.from({length: 81}, (_, i) => i + 100),
            unit: 'ppm'
          },
          pace: {
            minMinutes: [1, 2, 3, 4, 5],
            minSeconds: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55],
            maxMinutes: [1, 2, 3, 4, 5],
            maxSeconds: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55],
            unit: 'min/100m'
          }
        };
      default:
        return {};
    }
  };

  /**
   * Formatea el valor del objetivo para mostrar
   */
  const formatTargetValue = (value: number, type: string) => {
    if (type === 'pace') {
      const minutes = Math.floor(value / 60);
      const seconds = value % 60;
      const unit = sport === 'swimming' ? '/100m' : '/km';
      return `${minutes}:${seconds.toString().padStart(2, '0')}${unit}`;
    }
    const ranges = getTargetRanges();
    const targetRange = ranges[type as keyof typeof ranges] as any;
    return `${value} ${targetRange?.unit || ''}`;
  };

  const targetRanges = getTargetRanges();

  /**
   * Componente Picker personalizado estilo iOS
   */
  const TargetPicker = ({ targetType }: { targetType: string }) => {
    const ranges = targetRanges[targetType as keyof typeof targetRanges] as any;
    if (!ranges) return null;

    if (targetType === 'pace') {
      const currentMinValue = editedStep.targetMin || 0;
      const currentMaxValue = editedStep.targetMax || 0;
      
      const minMinutes = Math.floor(currentMinValue / 60);
      const minSeconds = currentMinValue % 60;
      const maxMinutes = Math.floor(currentMaxValue / 60);
      const maxSeconds = currentMaxValue % 60;

      return (
        <View style={styles.pacePicker}>
          <Text style={styles.pacePickerTitle}>Rango de Ritmo</Text>
          
          <View style={styles.paceRow}>
            <Text style={styles.paceLabel}>Mínimo:</Text>
            <View style={styles.paceInputs}>
              <View style={styles.paceColumn}>
                <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                  {ranges.minMinutes.map((min: number) => (
                    <Pressable
                      key={min}
                      onPress={() => {
                        const newValue = min * 60 + minSeconds;
                        updateStep('targetMin', newValue);
                      }}
                      style={[
                        styles.pickerItem,
                        minMinutes === min && styles.pickerItemSelected
                      ]}
                    >
                      <Text style={[
                        styles.pickerText,
                        minMinutes === min && styles.pickerTextSelected
                      ]}>
                        {min}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
                <Text style={styles.pickerUnit}>min</Text>
              </View>
              
              <Text style={styles.paceSeparator}>:</Text>
              
              <View style={styles.paceColumn}>
                <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                  {ranges.minSeconds.map((sec: number) => (
                    <Pressable
                      key={sec}
                      onPress={() => {
                        const newValue = minMinutes * 60 + sec;
                        updateStep('targetMin', newValue);
                      }}
                      style={[
                        styles.pickerItem,
                        minSeconds === sec && styles.pickerItemSelected
                      ]}
                    >
                      <Text style={[
                        styles.pickerText,
                        minSeconds === sec && styles.pickerTextSelected
                      ]}>
                        {sec.toString().padStart(2, '0')}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
                <Text style={styles.pickerUnit}>seg</Text>
              </View>
            </View>
          </View>

          <Text style={styles.rangeSeparator}>-</Text>

          <View style={styles.paceRow}>
            <Text style={styles.paceLabel}>Máximo:</Text>
            <View style={styles.paceInputs}>
              <View style={styles.paceColumn}>
                <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                  {ranges.maxMinutes.map((min: number) => (
                    <Pressable
                      key={min}
                      onPress={() => {
                        const newValue = min * 60 + maxSeconds;
                        updateStep('targetMax', newValue);
                      }}
                      style={[
                        styles.pickerItem,
                        maxMinutes === min && styles.pickerItemSelected
                      ]}
                    >
                      <Text style={[
                        styles.pickerText,
                        maxMinutes === min && styles.pickerTextSelected
                      ]}>
                        {min}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
                <Text style={styles.pickerUnit}>min</Text>
              </View>
              
              <Text style={styles.paceSeparator}>:</Text>
              
              <View style={styles.paceColumn}>
                <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                  {ranges.maxSeconds.map((sec: number) => (
                    <Pressable
                      key={sec}
                      onPress={() => {
                        const newValue = maxMinutes * 60 + sec;
                        updateStep('targetMax', newValue);
                      }}
                      style={[
                        styles.pickerItem,
                        maxSeconds === sec && styles.pickerItemSelected
                      ]}
                    >
                      <Text style={[
                        styles.pickerText,
                        maxSeconds === sec && styles.pickerTextSelected
                      ]}>
                        {sec.toString().padStart(2, '0')}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
                <Text style={styles.pickerUnit}>seg</Text>
              </View>
            </View>
          </View>

          <Text style={styles.targetPreview}>
            Objetivo: {formatTargetValue(editedStep.targetMin || 0, 'pace')} - {formatTargetValue(editedStep.targetMax || 0, 'pace')}
          </Text>
        </View>
      );
    } else {
      return (
        <View style={styles.simplePicker}>
          <Text style={styles.simplePickerTitle}>Rango de {config.targetTypes.find((t: any) => t.value === targetType)?.label}</Text>
          
          <View style={styles.simplePickerRow}>
            <View style={styles.simplePickerColumn}>
              <Text style={styles.simplePickerLabel}>Mínimo</Text>
              <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                {ranges.min.map((value: any) => (
                  <Pressable
                    key={value}
                    onPress={() => updateStep('targetMin', parseFloat(value))}
                    style={[
                      styles.pickerItem,
                      editedStep.targetMin === parseFloat(value) && styles.pickerItemSelected
                    ]}
                  >
                    <Text style={[
                      styles.pickerText,
                      editedStep.targetMin === parseFloat(value) && styles.pickerTextSelected
                    ]}>
                      {value}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            <Text style={styles.rangeSeparator}>-</Text>

            <View style={styles.simplePickerColumn}>
              <Text style={styles.simplePickerLabel}>Máximo</Text>
              <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                {ranges.max.map((value: any) => (
                  <Pressable
                    key={value}
                    onPress={() => updateStep('targetMax', parseFloat(value))}
                    style={[
                      styles.pickerItem,
                      editedStep.targetMax === parseFloat(value) && styles.pickerItemSelected
                    ]}
                  >
                    <Text style={[
                      styles.pickerText,
                      editedStep.targetMax === parseFloat(value) && styles.pickerTextSelected
                    ]}>
                      {value}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>

          <Text style={styles.targetPreview}>
            Objetivo: {editedStep.targetMin || 0} - {editedStep.targetMax || 0} {ranges.unit}
          </Text>
        </View>
      );
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
                  updateStep('stepType', phase.type as WorkoutStep['stepType']);
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

          {editedStep.durationType !== 'lap_button' && (
            <View style={styles.durationValueContainer}>
              <TextInput
                value={editedStep.durationType === 'time' 
                  ? Math.floor((editedStep.duration || 0) / 60).toString()
                  : editedStep.durationType === 'distance' 
                    ? (sport === 'swimming' 
                        ? (editedStep.distance || 0).toString()
                        : ((editedStep.distance || 0) / 1000).toString())
                    : ''
                }
                onChangeText={(value) => {
                  const numValue = parseFloat(value) || 0;
                  if (editedStep.durationType === 'time') {
                    updateStep('duration', numValue * 60);
                  } else if (editedStep.durationType === 'distance') {
                    const meters = sport === 'swimming' ? numValue : numValue * 1000;
                    updateStep('distance', meters);
                  }
                }}
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

          {editedStep.targetType !== 'none' && editedStep.targetType && (
            <TargetPicker targetType={editedStep.targetType} />
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

  deleteItemBtn: {
    padding: 8,
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    borderRadius: 8,
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

  // ===== PICKER STYLES =====
  pacePicker: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },

  pacePickerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },

  paceRow: {
    marginBottom: 12,
  },

  paceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#B0B0C4',
    marginBottom: 8,
  },

  paceInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  paceColumn: {
    alignItems: 'center',
  },

  paceSeparator: {
    fontSize: 28,
    fontWeight: '600',
    color: '#FFFFFF',
    marginHorizontal: 8,
  },

  simplePicker: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },

  simplePickerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },

  simplePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },

  simplePickerColumn: {
    alignItems: 'center',
    flex: 1,
  },

  simplePickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#B0B0C4',
    marginBottom: 8,
  },

  pickerScroll: {
    height: 120,
    width: 80,
  },

  pickerItem: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 8,
    marginVertical: 2,
  },

  pickerItemSelected: {
    backgroundColor: '#00D4AA',
  },

  pickerText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#B0B0C4',
  },

  pickerTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  pickerUnit: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFB84D',
    marginTop: 8,
  },

  rangeSeparator: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginVertical: 8,
  },

  targetPreview: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00D4AA',
    textAlign: 'center',
    marginTop: 12,
    backgroundColor: 'rgba(0, 212, 170, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
});