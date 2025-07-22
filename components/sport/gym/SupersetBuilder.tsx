// components/sport/SupersetBuilder.tsx - Constructor mejorado con configuración completa
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
// Importar tipos de tu estructura existente
import { GymExercise, GymSet, SupersetType, createEmptySet } from './sports';

/**
 * Tipos de superseries disponibles con diferenciación entre superseries y circuitos
 */
const SUPERSET_TYPES = [
  {
    type: 'superset' as SupersetType,
    name: 'Superserie',
    description: '2 ejercicios consecutivos sin descanso entre ellos',
    icon: 'lightning-bolt',
    color: '#FF6B6B',
    minExercises: 2,
    maxExercises: 2,
    hasExerciseRest: false,
    allowTimedSets: false
  },
  {
    type: 'triset' as SupersetType,
    name: 'Triserie',
    description: '3 ejercicios consecutivos sin descanso entre ellos',
    icon: 'flash',
    color: '#FFB84D',
    minExercises: 3,
    maxExercises: 3,
    hasExerciseRest: false,
    allowTimedSets: false
  },
  {
    type: 'circuit' as SupersetType,
    name: 'Circuito',
    description: '3-8 ejercicios con tiempo o reps, descanso opcional entre ejercicios',
    icon: 'refresh-circle',
    color: '#4ECDC4',
    minExercises: 3,
    maxExercises: 8,
    hasExerciseRest: true,
    allowTimedSets: true
  },
  {
    type: 'megacircuit' as SupersetType,
    name: 'Mega Circuito',
    description: '9-12 ejercicios con tiempo o reps, descanso opcional entre ejercicios',
    icon: 'fire',
    color: '#E91E63',
    minExercises: 9,
    maxExercises: 12,
    hasExerciseRest: true,
    allowTimedSets: true
  }
] as const;

/**
 * Props del constructor de superseries
 */
interface SupersetBuilderProps {
  visible: boolean;
  exercises: GymExercise[];
  onClose: () => void;
  onCreateSuperset: (data: {
    name: string;
    type: SupersetType;
    exercises: GymExercise[];
    rounds: number;
    restTime: string;
    restTimeBetweenExercises?: string;
    useTimeForAll?: boolean;
    defaultTime?: string;
  }) => void;
}

/**
 * Configuración de ejercicio en superserie
 */
interface SupersetExerciseConfig {
  exercise: GymExercise;
  sets: GymSet[];
  useTime: boolean;
  time?: string;
}

/**
 * Componente constructor de superseries
 * Permite crear superseries, triseries, circuitos y mega circuitos con configuración completa
 */
export default function SupersetBuilder({
  visible,
  exercises,
  onClose,
  onCreateSuperset
}: SupersetBuilderProps) {
  // ===== ESTADOS =====
  const [currentStep, setCurrentStep] = useState<'type' | 'exercises' | 'config' | 'sets'>('type');
  const [selectedType, setSelectedType] = useState<SupersetType>('superset');
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const [exerciseConfigs, setExerciseConfigs] = useState<SupersetExerciseConfig[]>([]);
  const [supersetName, setSupersetName] = useState('');
  const [rounds, setRounds] = useState(3);
  const [restTime, setRestTime] = useState('90');
  const [restTimeBetweenExercises, setRestTimeBetweenExercises] = useState('20');
  const [useTimeForAll, setUseTimeForAll] = useState(false);
  const [defaultTime, setDefaultTime] = useState('45');

  /**
   * Reinicia el builder al estado inicial
   */
  const resetBuilder = () => {
    setCurrentStep('type');
    setSelectedType('superset');
    setSelectedExercises([]);
    setExerciseConfigs([]);
    setSupersetName('');
    setRounds(3);
    setRestTime('90');
    setRestTimeBetweenExercises('20');
    setUseTimeForAll(false);
    setDefaultTime('45');
  };

  /**
   * Maneja el cierre del modal
   */
  const handleClose = () => {
    resetBuilder();
    onClose();
  };

  /**
   * Obtiene la configuración del tipo seleccionado
   */
  const getSelectedTypeConfig = () => {
    return SUPERSET_TYPES.find(type => type.type === selectedType) || SUPERSET_TYPES[0];
  };

  /**
   * Continúa al siguiente paso
   */
  const nextStep = () => {
    if (currentStep === 'type') {
      setCurrentStep('exercises');
      setSupersetName(`${getSelectedTypeConfig().name} ${new Date().getHours()}:${new Date().getMinutes().toString().padStart(2, '0')}`);
      
      // Ajustar configuración por defecto según el tipo
      const typeConfig = getSelectedTypeConfig();
      if (typeConfig.type === 'circuit') {
        setRounds(3);
        setRestTime('120');
        setRestTimeBetweenExercises('20');
        setUseTimeForAll(true); // Por defecto, circuitos usan tiempo
        setDefaultTime('45');
      } else if (typeConfig.type === 'megacircuit') {
        setRounds(2);
        setRestTime('180');
        setRestTimeBetweenExercises('15');
        setUseTimeForAll(true);
        setDefaultTime('30');
      } else {
        setRounds(3);
        setRestTime('90');
        setRestTimeBetweenExercises('0');
        setUseTimeForAll(false);
      }
    } else if (currentStep === 'exercises') {
      // Crear configuraciones iniciales para los ejercicios seleccionados
      const configs: SupersetExerciseConfig[] = selectedExercises.map(exerciseId => {
        const exercise = exercises.find(ex => ex.id === exerciseId)!;
        const typeConfig = getSelectedTypeConfig();
        
        return {
          exercise: {
            ...exercise,
            sets: [] // Vacío inicialmente
          },
          sets: [createEmptySet(useTimeForAll && typeConfig.allowTimedSets ? 'Tiempo' : exercise.exerciseType || 'Repeticiones')],
          useTime: useTimeForAll && typeConfig.allowTimedSets,
          time: useTimeForAll ? defaultTime : undefined
        };
      });
      
      setExerciseConfigs(configs);
      setCurrentStep('sets');
    } else if (currentStep === 'sets') {
      setCurrentStep('config');
    }
  };

  /**
   * Retrocede al paso anterior
   */
  const prevStep = () => {
    if (currentStep === 'config') {
      setCurrentStep('sets');
    } else if (currentStep === 'sets') {
      setCurrentStep('exercises');
    } else if (currentStep === 'exercises') {
      setCurrentStep('type');
    } else {
      handleClose();
    }
  };

  /**
   * Alterna la selección de un ejercicio
   */
  const toggleExerciseSelection = (exerciseId: string) => {
    const typeConfig = getSelectedTypeConfig();
    
    if (selectedExercises.includes(exerciseId)) {
      setSelectedExercises(prev => prev.filter(id => id !== exerciseId));
    } else {
      if (selectedExercises.length < typeConfig.maxExercises) {
        setSelectedExercises(prev => [...prev, exerciseId]);
      }
    }
  };

  /**
   * Reordena los ejercicios seleccionados
   */
  const reorderExercise = (fromIndex: number, toIndex: number) => {
    const newOrder = [...selectedExercises];
    const [movedItem] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, movedItem);
    setSelectedExercises(newOrder);

    // También reordenar las configuraciones si ya existen
    if (exerciseConfigs.length > 0) {
      const newConfigs = [...exerciseConfigs];
      const [movedConfig] = newConfigs.splice(fromIndex, 1);
      newConfigs.splice(toIndex, 0, movedConfig);
      setExerciseConfigs(newConfigs);
    }
  };

  /**
   * Actualiza la configuración de un ejercicio
   */
  const updateExerciseConfig = (index: number, field: keyof SupersetExerciseConfig, value: any) => {
    const newConfigs = [...exerciseConfigs];
    
    if (field === 'useTime') {
      // Cambiar el tipo de ejercicio y resetear las series
      newConfigs[index] = {
        ...newConfigs[index],
        useTime: value,
        sets: [createEmptySet(value ? 'Tiempo' : newConfigs[index].exercise.exerciseType || 'Repeticiones')],
        time: value ? defaultTime : undefined
      };
    } else {
      newConfigs[index] = {
        ...newConfigs[index],
        [field]: value
      };
    }
    
    setExerciseConfigs(newConfigs);
  };

  /**
   * Actualiza una serie de un ejercicio
   */
  const updateExerciseSet = (exerciseIndex: number, setIndex: number, field: keyof GymSet, value: string) => {
    const newConfigs = [...exerciseConfigs];
    const config = newConfigs[exerciseIndex];
    
    if (config.useTime) {
      // Para ejercicios por tiempo, actualizar el tiempo global
      if (field === 'duration') {
        config.time = value;
      }
    } else {
      // Para ejercicios por repeticiones, actualizar la serie específica
      const newSets = [...config.sets];
      newSets[setIndex] = {
        ...newSets[setIndex],
        [field]: value
      };
      config.sets = newSets;
    }
    
    setExerciseConfigs(newConfigs);
  };

  /**
   * Verifica si se puede continuar al siguiente paso
   */
  const canProceed = () => {
    const typeConfig = getSelectedTypeConfig();
    
    switch (currentStep) {
      case 'type':
        return true;
      case 'exercises':
        return selectedExercises.length >= typeConfig.minExercises && 
               selectedExercises.length <= typeConfig.maxExercises;
      case 'sets':
        // Verificar que todos los ejercicios tengan configuración válida
        return exerciseConfigs.every(config => {
          if (config.useTime) {
            return config.time && parseInt(config.time) > 0;
          } else {
            return config.sets.every(set => set.reps && parseInt(set.reps) > 0);
          }
        });
      case 'config':
        return supersetName.trim() !== '' && rounds > 0 && restTime.trim() !== '';
      default:
        return false;
    }
  };

  /**
   * Crea la superserie
   */
  const createSuperset = () => {
    const typeConfig = getSelectedTypeConfig();
    
    // Preparar los ejercicios con sus configuraciones
    const configuredExercises = exerciseConfigs.map(config => {
      const exercise = config.exercise;
      
      if (config.useTime) {
        // Para ejercicios por tiempo en circuitos
        return {
          ...exercise,
          exerciseType: 'Tiempo' as const,
          sets: [{
            duration: config.time,
            weight: '',
            completed: false
          }]
        };
      } else {
        // Para ejercicios por repeticiones
        return {
          ...exercise,
          sets: config.sets
        };
      }
    });

    onCreateSuperset({
      name: supersetName.trim(),
      type: selectedType,
      exercises: configuredExercises,
      rounds,
      restTime,
      restTimeBetweenExercises: typeConfig.hasExerciseRest ? restTimeBetweenExercises : undefined,
      useTimeForAll: useTimeForAll && typeConfig.allowTimedSets
    });

    resetBuilder();
  };

  const typeConfig = getSelectedTypeConfig();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <LinearGradient
        colors={["#0F0F23", "#1A1A3A", "#2D2D5F"]}
        style={styles.container}
      >
        {/* ===== HEADER ===== */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <MaterialCommunityIcons
              name="lightning-bolt"
              size={24}
              color="#FF6B6B"
            />
            <Text style={styles.title}>Constructor de {typeConfig.name || 'Superseries'}</Text>
          </View>

          <Pressable onPress={handleClose} style={styles.closeBtn}>
            <MaterialCommunityIcons name="close" size={24} color="#B0B0C4" />
          </Pressable>
        </View>

        {/* ===== INDICADOR DE PROGRESO ===== */}
        <View style={styles.progressIndicator}>
          <View style={styles.progressSteps}>
            {["type", "exercises", "sets", "config"].map((step, index) => (
              <View key={step} style={styles.progressStepContainer}>
                <View
                  style={[
                    styles.progressStep,
                    currentStep === step && styles.progressStepActive,
                    ["type", "exercises", "sets", "config"].indexOf(currentStep) > index && 
                      styles.progressStepCompleted,
                  ]}
                >
                  <Text
                    style={[
                      styles.progressStepText,
                      (currentStep === step ||
                        ["type", "exercises", "sets", "config"].indexOf(currentStep) > index) &&
                        styles.progressStepTextActive,
                    ]}
                  >
                    {index + 1}
                  </Text>
                </View>
                {index < 3 && (
                  <View
                    style={[
                      styles.progressLine,
                      ["type", "exercises", "sets", "config"].indexOf(currentStep) > index && 
                        styles.progressLineCompleted,
                    ]}
                  />
                )}
              </View>
            ))}
          </View>

          <View style={styles.progressLabels}>
            <Text style={[styles.progressLabel, currentStep === "type" && styles.progressLabelActive]}>
              Tipo
            </Text>
            <Text style={[styles.progressLabel, currentStep === "exercises" && styles.progressLabelActive]}>
              Ejercicios
            </Text>
            <Text style={[styles.progressLabel, currentStep === "sets" && styles.progressLabelActive]}>
              Series
            </Text>
            <Text style={[styles.progressLabel, currentStep === "config" && styles.progressLabelActive]}>
              Config
            </Text>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* ===== PASO 1: SELECCIÓN DE TIPO ===== */}
          {currentStep === "type" && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>
                ¿Qué tipo de entrenamiento quieres crear?
              </Text>
              <Text style={styles.stepSubtitle}>
                Cada tipo tiene características diferentes para tus objetivos
              </Text>

              <View style={styles.typeSelector}>
                {SUPERSET_TYPES.map((type) => (
                  <Pressable
                    key={type.type}
                    onPress={() => setSelectedType(type.type)}
                    style={[
                      styles.typeOption,
                      selectedType === type.type && styles.typeOptionSelected,
                    ]}
                  >
                    <LinearGradient
                      colors={
                        selectedType === type.type
                          ? [type.color, type.color + "80"]
                          : ["rgba(255,255,255,0.05)", "rgba(255,255,255,0.02)"]
                      }
                      style={styles.typeOptionGradient}
                    >
                      <View style={styles.typeOptionHeader}>
                        <MaterialCommunityIcons
                          name={type.icon as any}
                          size={36}
                          color={
                            selectedType === type.type ? "#FFFFFF" : type.color
                          }
                        />
                        <View style={styles.typeOptionInfo}>
                          <Text
                            style={[
                              styles.typeOptionName,
                              selectedType === type.type &&
                                styles.typeOptionNameSelected,
                            ]}
                          >
                            {type.name}
                          </Text>
                          <Text
                            style={[
                              styles.typeOptionDescription,
                              selectedType === type.type &&
                                styles.typeOptionDescriptionSelected,
                            ]}
                          >
                            {type.description}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.typeOptionFooter}>
                        <View
                          style={[
                            styles.exerciseCountContainer,
                            selectedType === type.type &&
                              styles.exerciseCountContainerSelected,
                          ]}
                        >
                          <Text
                            style={[
                              styles.exerciseCountText,
                              selectedType === type.type &&
                                styles.exerciseCountTextSelected,
                            ]}
                          >
                            {type.minExercises === type.maxExercises
                              ? `${type.minExercises} ejercicios`
                              : `${type.minExercises}-${type.maxExercises} ejercicios`}
                          </Text>
                        </View>
                      </View>
                    </LinearGradient>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* ===== PASO 2: SELECCIÓN DE EJERCICIOS ===== */}
          {currentStep === "exercises" && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>
                Selecciona ejercicios para tu {typeConfig.name}
              </Text>
              <Text style={styles.stepSubtitle}>
                Necesitas seleccionar{" "}
                {typeConfig.minExercises === typeConfig.maxExercises
                  ? `exactamente ${typeConfig.minExercises}`
                  : `entre ${typeConfig.minExercises} y ${typeConfig.maxExercises}`}{" "}
                ejercicios
              </Text>

              {/* Ejercicios seleccionados (orden) */}
              {selectedExercises.length > 0 && (
                <View style={styles.selectedExercisesSection}>
                  <Text style={styles.sectionTitle}>
                    Orden de ejecución ({selectedExercises.length}/
                    {typeConfig.maxExercises})
                  </Text>

                  <View style={styles.selectedExercisesList}>
                    {selectedExercises.map((exerciseId, index) => {
                      const exercise = exercises.find(
                        (ex) => ex.id === exerciseId
                      )!;
                      return (
                        <View
                          key={exerciseId}
                          style={styles.selectedExerciseItem}
                        >
                          <LinearGradient
                            colors={[
                              typeConfig.color + "33",
                              typeConfig.color + "1A",
                            ]}
                            style={styles.selectedExerciseGradient}
                          >
                            <View style={styles.selectedExerciseContent}>
                              <View
                                style={[
                                  styles.exerciseOrder,
                                  { backgroundColor: typeConfig.color },
                                ]}
                              >
                                <Text style={styles.exerciseOrderText}>
                                  {index + 1}
                                </Text>
                              </View>

                              <Text style={styles.selectedExerciseName}>
                                {exercise.name}
                              </Text>

                              <View style={styles.orderControls}>
                                {index > 0 && (
                                  <Pressable
                                    onPress={() =>
                                      reorderExercise(index, index - 1)
                                    }
                                    style={styles.orderBtn}
                                  >
                                    <MaterialCommunityIcons
                                      name="arrow-up"
                                      size={16}
                                      color="#B0B0C4"
                                    />
                                  </Pressable>
                                )}
                                {index < selectedExercises.length - 1 && (
                                  <Pressable
                                    onPress={() =>
                                      reorderExercise(index, index + 1)
                                    }
                                    style={styles.orderBtn}
                                  >
                                    <MaterialCommunityIcons
                                      name="arrow-down"
                                      size={16}
                                      color="#B0B0C4"
                                    />
                                  </Pressable>
                                )}
                                <Pressable
                                  onPress={() => 
                                    toggleExerciseSelection(exerciseId)
                                  }
                                  style={[styles.orderBtn, styles.removeBtn]}
                                >
                                  <MaterialCommunityIcons
                                    name="close"
                                    size={16}
                                    color="#FF6B6B"
                                  />
                                </Pressable>
                              </View>
                            </View>
                          </LinearGradient>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Lista de ejercicios disponibles */}
              <View style={styles.availableExercisesSection}>
                <Text style={styles.sectionTitle}>
                  Ejercicios Disponibles ({exercises.length})
                </Text>

                <View style={styles.exercisesList}>
                  {exercises.map((exercise) => {
                    const isSelected = selectedExercises.includes(exercise.id);
                    const canSelect =
                      selectedExercises.length < typeConfig.maxExercises;

                    return (
                      <Pressable
                        key={exercise.id}
                        onPress={() => toggleExerciseSelection(exercise.id)}
                        style={[
                          styles.exerciseOption,
                          isSelected && styles.exerciseOptionSelected,
                          !canSelect &&
                            !isSelected &&
                            styles.exerciseOptionDisabled,
                        ]}
                        disabled={!canSelect && !isSelected}
                      >
                        <MaterialCommunityIcons
                          name={
                            isSelected
                              ? "checkbox-marked-circle"
                              : "checkbox-blank-circle-outline"
                          }
                          size={24}
                          color={isSelected ? typeConfig.color : "#B0B0C4"}
                        />
                        <Text
                          style={[
                            styles.exerciseOptionText,
                            isSelected && styles.exerciseOptionTextSelected,
                            !canSelect &&
                              !isSelected &&
                              styles.exerciseOptionTextDisabled,
                          ]}
                        >
                          {exercise.name}
                        </Text>
                        {isSelected && (
                          <View
                            style={[
                              styles.exerciseSelectedBadge,
                              { backgroundColor: typeConfig.color },
                            ]}
                          >
                            <Text style={styles.exerciseSelectedBadgeText}>
                              {selectedExercises.indexOf(exercise.id) + 1}
                            </Text>
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </View>
          )}

          {/* ===== PASO 3: CONFIGURACIÓN DE SERIES ===== */}
          {currentStep === "sets" && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>
                Configura las series para cada ejercicio
              </Text>
              <Text style={styles.stepSubtitle}>
                Define las repeticiones o tiempo para cada ejercicio
              </Text>

              {/* Opción global para circuitos */}
              {typeConfig.allowTimedSets && (
                <View style={styles.globalTimeOption}>
                  <Pressable
                    onPress={() => setUseTimeForAll(!useTimeForAll)}
                    style={styles.globalTimeToggle}
                  >
                    <MaterialCommunityIcons
                      name={useTimeForAll ? "checkbox-marked" : "checkbox-blank-outline"}
                      size={24}
                      color={useTimeForAll ? typeConfig.color : "#B0B0C4"}
                    />
                    <Text style={styles.globalTimeText}>
                      Usar tiempo para todos los ejercicios
                    </Text>
                  </Pressable>
                  
                  {useTimeForAll && (
                    <View style={styles.globalTimeInput}>
                      <Text style={styles.globalTimeLabel}>Tiempo por ejercicio:</Text>
                      <TextInput
                        value={defaultTime}
                        onChangeText={(val) => {
                          setDefaultTime(val);
                          // Actualizar todos los ejercicios
                          const newConfigs = exerciseConfigs.map(config => ({
                            ...config,
                            time: val
                          }));
                          setExerciseConfigs(newConfigs);
                        }}
                        style={styles.timeInput}
                        keyboardType="numeric"
                        placeholder="45"
                      />
                      <Text style={styles.timeUnit}>seg</Text>
                    </View>
                  )}
                </View>
              )}

              {/* Configuración individual de ejercicios */}
              <View style={styles.exerciseConfigsList}>
                {exerciseConfigs.map((config, index) => (
                  <View key={config.exercise.id} style={styles.exerciseConfigCard}>
                    <LinearGradient
                      colors={["rgba(255,255,255,0.05)", "rgba(255,255,255,0.02)"]}
                      style={styles.exerciseConfigGradient}
                    >
                      <View style={styles.exerciseConfigHeader}>
                        <View style={[styles.exerciseNumber, { backgroundColor: typeConfig.color }]}>
                          <Text style={styles.exerciseNumberText}>{index + 1}</Text>
                        </View>
                        <Text style={styles.exerciseConfigName}>{config.exercise.name}</Text>
                      </View>

                      {typeConfig.allowTimedSets && !useTimeForAll && (
                        <View style={styles.exerciseTypeToggle}>
                          <Pressable
                            onPress={() => updateExerciseConfig(index, 'useTime', false)}
                            style={[
                              styles.typeToggleBtn,
                              !config.useTime && styles.typeToggleBtnActive
                            ]}
                          >
                            <MaterialCommunityIcons name="numeric" size={16} color={!config.useTime ? "#FFFFFF" : "#B0B0C4"} />
                            <Text style={[styles.typeToggleText, !config.useTime && styles.typeToggleTextActive]}>
                              Reps
                            </Text>
                          </Pressable>
                          <Pressable
                            onPress={() => updateExerciseConfig(index, 'useTime', true)}
                            style={[
                              styles.typeToggleBtn,
                              config.useTime && styles.typeToggleBtnActive
                            ]}
                          >
                            <MaterialCommunityIcons name="timer" size={16} color={config.useTime ? "#FFFFFF" : "#B0B0C4"} />
                            <Text style={[styles.typeToggleText, config.useTime && styles.typeToggleTextActive]}>
                              Tiempo
                            </Text>
                          </Pressable>
                        </View>
                      )}

                      <View style={styles.setsConfig}>
                        {config.useTime ? (
                          <View style={styles.timeConfig}>
                            <Text style={styles.configLabel}>Tiempo:</Text>
                            <View style={styles.timeInputContainer}>
                              <TextInput
                                value={config.time}
                                onChangeText={(val) => updateExerciseConfig(index, 'time', val)}
                                style={styles.configInput}
                                keyboardType="numeric"
                                placeholder="45"
                              />
                              <Text style={styles.configUnit}>seg</Text>
                            </View>
                          </View>
                        ) : (
                          <View style={styles.repsConfig}>
                            <Text style={styles.configLabel}>Repeticiones:</Text>
                            <TextInput
                              value={config.sets[0]?.reps || ''}
                              onChangeText={(val) => updateExerciseSet(index, 0, 'reps', val)}
                              style={styles.configInput}
                              keyboardType="numeric"
                              placeholder="12"
                            />
                          </View>
                        )}
                      </View>
                    </LinearGradient>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ===== PASO 4: CONFIGURACIÓN FINAL ===== */}
          {currentStep === "config" && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>
                Configuración de tu {typeConfig.name}
              </Text>
              <Text style={styles.stepSubtitle}>
                Personaliza los detalles finales del entrenamiento
              </Text>

              {/* Resumen de ejercicios */}
              <View style={styles.configSummary}>
                <LinearGradient
                  colors={[typeConfig.color + "20", typeConfig.color + "10"]}
                  style={styles.configSummaryGradient}
                >
                  <View style={styles.configSummaryHeader}>
                    <MaterialCommunityIcons
                      name={typeConfig.icon as any}
                      size={20}
                      color={typeConfig.color}
                    />
                    <Text style={styles.configSummaryTitle}>
                      {exerciseConfigs.length} Ejercicios Configurados
                    </Text>
                  </View>

                  <View style={styles.configSummaryExercises}>
                    {exerciseConfigs.map((config, index) => (
                      <Text
                        key={config.exercise.id}
                        style={styles.configSummaryExercise}
                      >
                        {index + 1}. {config.exercise.name} - {
                          config.useTime 
                            ? `${config.time}s` 
                            : `${config.sets[0]?.reps || '0'} reps`
                        }
                      </Text>
                    ))}
                  </View>
                </LinearGradient>
              </View>

              {/* Nombre */}
              <View style={styles.configField}>
                <Text style={styles.configLabel}>
                  Nombre del {typeConfig.name}
                </Text>
                <TextInput
                  value={supersetName}
                  onChangeText={setSupersetName}
                  style={styles.configInput}
                  placeholder={`Mi ${typeConfig.name.toLowerCase()}`}
                  placeholderTextColor="#6B7280"
                  maxLength={50}
                />
              </View>

              {/* Número de rondas */}
              <View style={styles.configField}>
                <Text style={styles.configLabel}>
                  Número de Rondas
                </Text>
                <View style={styles.roundsSelector}>
                  {[1, 2, 3, 4, 5].map((num) => (
                    <Pressable
                      key={num}
                      onPress={() => setRounds(num)}
                      style={[
                        styles.roundOption,
                        rounds === num && styles.roundOptionSelected,
                        rounds === num && { backgroundColor: typeConfig.color },
                      ]}
                    >
                      <Text
                        style={[
                          styles.roundOptionText,
                          rounds === num && styles.roundOptionTextSelected,
                        ]}
                      >
                        {num}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Tiempo de descanso entre rondas */}
              <View style={styles.configField}>
                <Text style={styles.configLabel}>
                  Descanso entre rondas
                </Text>
                <View style={styles.restTimeContainer}>
                  <TextInput
                    value={restTime}
                    onChangeText={setRestTime}
                    style={styles.restTimeInput}
                    keyboardType="numeric"
                    placeholder="90"
                    placeholderTextColor="#6B7280"
                    maxLength={3}
                  />
                  <Text style={styles.restTimeUnit}>segundos</Text>
                </View>
              </View>

              {/* Tiempo de descanso entre ejercicios (solo para circuitos) */}
              {typeConfig.hasExerciseRest && (
                <View style={styles.configField}>
                  <Text style={styles.configLabel}>
                    Descanso entre ejercicios
                    <Text style={styles.configHint}> (0 = sin descanso)</Text>
                  </Text>
                  <View style={styles.restTimeContainer}>
                    <TextInput
                      value={restTimeBetweenExercises}
                      onChangeText={setRestTimeBetweenExercises}
                      style={styles.restTimeInput}
                      keyboardType="numeric"
                      placeholder="20"
                      placeholderTextColor="#6B7280"
                      maxLength={3}
                    />
                    <Text style={styles.restTimeUnit}>segundos</Text>
                  </View>
                </View>
              )}

              {/* Preview final */}
              <View style={styles.finalPreview}>
                <LinearGradient
                  colors={[typeConfig.color + "15", typeConfig.color + "08"]}
                  style={styles.finalPreviewGradient}
                >
                  <View style={styles.finalPreviewHeader}>
                    <MaterialCommunityIcons
                      name="eye"
                      size={16}
                      color={typeConfig.color}
                    />
                    <Text style={styles.finalPreviewTitle}>Vista Previa</Text>
                  </View>

                  <Text style={styles.finalPreviewText}>
                    &quot;{supersetName}&quot; - {exerciseConfigs.length} ejercicios × {rounds} rondas
                  </Text>
                  <Text style={styles.finalPreviewSubtext}>
                    {typeConfig.hasExerciseRest && restTimeBetweenExercises !== '0' ? (
                      <>
                        Descanso entre ejercicios: {restTimeBetweenExercises}s • 
                        Descanso entre rondas: {restTime}s
                      </>
                    ) : (
                      <>Descanso entre rondas: {restTime}s</>
                    )}
                  </Text>
                </LinearGradient>
              </View>
            </View>
          )}
        </ScrollView>

        {/* ===== BOTONES DE ACCIÓN ===== */}
        <View style={styles.actions}>
          <Pressable onPress={prevStep} style={styles.backBtn}>
            <Text style={styles.backText}>
              {currentStep === "type" ? "Cancelar" : "Atrás"}
            </Text>
          </Pressable>

          {currentStep === "config" ? (
            <Pressable
              onPress={createSuperset}
              style={[
                styles.primaryBtn,
                !canProceed() && styles.primaryBtnDisabled,
              ]}
              disabled={!canProceed()}
            >
              <LinearGradient
                colors={
                  canProceed()
                    ? [typeConfig.color, typeConfig.color + "80"]
                    : ["#6B7280", "#4B5563"]
                }
                style={styles.primaryBtnGradient}
              >
                <MaterialCommunityIcons
                  name="check"
                  size={20}
                  color="#FFFFFF"
                />
                <Text style={styles.primaryBtnText}>
                  Crear {typeConfig.name}
                </Text>
              </LinearGradient>
            </Pressable>
          ) : (
            <Pressable
              onPress={nextStep}
              style={[
                styles.primaryBtn,
                !canProceed() && styles.primaryBtnDisabled,
              ]}
              disabled={!canProceed()}
            >
              <LinearGradient
                colors={
                  canProceed()
                    ? [typeConfig.color, typeConfig.color + "80"]
                    : ["#6B7280", "#4B5563"]
                }
                style={styles.primaryBtnGradient}
              >
                <Text style={styles.primaryBtnText}>Continuar</Text>
                <MaterialCommunityIcons
                  name="arrow-right"
                  size={20}
                  color="#FFFFFF"
                />
              </LinearGradient>
            </Pressable>
          )}
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
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  closeBtn: {
    padding: 8,
  },

  // ===== PROGRESO =====
  progressIndicator: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },

  progressSteps: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },

  progressStepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  progressStep: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },

  progressStepActive: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },

  progressStepCompleted: {
    backgroundColor: '#00D4AA',
    borderColor: '#00D4AA',
  },

  progressStepText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#B0B0C4',
  },

  progressStepTextActive: {
    color: '#FFFFFF',
  },

  progressLine: {
    width: 40,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 8,
  },

  progressLineCompleted: {
    backgroundColor: '#00D4AA',
  },

  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },

  progressLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },

  progressLabelActive: {
    color: '#FF6B6B',
  },

  // ===== CONTENIDO =====
  content: {
    flex: 1,
  },

  stepContainer: {
    padding: 20,
  },

  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },

  stepSubtitle: {
    fontSize: 14,
    color: '#B0B0C4',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
  },

  // ===== PASO 1: TIPOS =====
  typeSelector: {
    gap: 16,
  },

  typeOption: {
    borderRadius: 16,
    overflow: 'hidden',
  },

  typeOptionSelected: {
    transform: [{ scale: 1.02 }],
  },

  typeOptionGradient: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    minHeight: 120,
  },

  typeOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 16,
  },

  typeOptionInfo: {
    flex: 1,
  },

  typeOptionName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },

  typeOptionNameSelected: {
    color: '#FFFFFF',
  },

  typeOptionDescription: {
    fontSize: 14,
    color: '#B0B0C4',
  },

  typeOptionDescriptionSelected: {
    color: 'rgba(255, 255, 255, 0.8)',
  },

  typeOptionFooter: {
    alignItems: 'center',
  },

  exerciseCountContainer: {
    backgroundColor: 'rgba(255, 184, 77, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },

  exerciseCountContainerSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },

  exerciseCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFB84D',
  },

  exerciseCountTextSelected: {
    color: '#FFFFFF',
  },

  // ===== PASO 2: EJERCICIOS =====
  selectedExercisesSection: {
    marginBottom: 24,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },

  selectedExercisesList: {
    gap: 8,
  },

  selectedExerciseItem: {
    borderRadius: 12,
    overflow: 'hidden',
  },

  selectedExerciseGradient: {
    borderRadius: 12,
  },

  selectedExerciseContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },

  exerciseOrder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },

  exerciseOrderText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  selectedExerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },

  orderControls: {
    flexDirection: 'row',
    gap: 4,
  },

  orderBtn: {
    padding: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
  },

  removeBtn: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
  },

  availableExercisesSection: {
    marginTop: 16,
  },

  exercisesList: {
    gap: 8,
  },

  exerciseOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 12,
  },

  exerciseOptionSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },

  exerciseOptionDisabled: {
    opacity: 0.5,
  },

  exerciseOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    flex: 1,
  },

  exerciseOptionTextSelected: {
    fontWeight: '600',
  },

  exerciseOptionTextDisabled: {
    color: '#6B7280',
  },

  exerciseSelectedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  exerciseSelectedBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // ===== PASO 3: SERIES =====
  globalTimeOption: {
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },

  globalTimeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  globalTimeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  globalTimeInput: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },

  globalTimeLabel: {
    fontSize: 14,
    color: '#B0B0C4',
  },

  timeInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    minWidth: 60,
    textAlign: 'center',
  },

  timeUnit: {
    fontSize: 14,
    color: '#B0B0C4',
  },

  exerciseConfigsList: {
    gap: 12,
  },

  exerciseConfigCard: {
    borderRadius: 12,
    overflow: 'hidden',
  },

  exerciseConfigGradient: {
    padding: 16,
    borderRadius: 12,
  },

  exerciseConfigHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },

  exerciseNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },

  exerciseNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  exerciseConfigName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },

  exerciseTypeToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 4,
    marginBottom: 12,
  },

  typeToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },

  typeToggleBtnActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },

  typeToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B0B0C4',
  },

  typeToggleTextActive: {
    color: '#FFFFFF',
  },

  setsConfig: {
    gap: 8,
  },

  timeConfig: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  repsConfig: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  configLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#B0B0C4',
  },

  timeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  configInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    minWidth: 60,
    textAlign: 'center',
  },

  configUnit: {
    fontSize: 14,
    color: '#B0B0C4',
  },

  // ===== PASO 4: CONFIGURACIÓN =====
  configSummary: {
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
  },

  configSummaryGradient: {
    padding: 16,
    borderRadius: 16,
  },

  configSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },

  configSummaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  configSummaryExercises: {
    gap: 4,
  },

  configSummaryExercise: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },

  configField: {
    marginBottom: 20,
  },

  configHint: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '400',
  },

  roundsSelector: {
    flexDirection: 'row',
    gap: 8,
  },

  roundOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  roundOptionSelected: {
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },

  roundOptionText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#B0B0C4',
  },

  roundOptionTextSelected: {
    color: '#FFFFFF',
  },

  restTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },

  restTimeInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },

  restTimeUnit: {
    fontSize: 14,
    fontWeight: '600',
    color: '#B0B0C4',
  },

  finalPreview: {
    borderRadius: 16,
    overflow: 'hidden',
  },

  finalPreviewGradient: {
    padding: 16,
    borderRadius: 16,
  },

  finalPreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },

  finalPreviewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  finalPreviewText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },

  finalPreviewSubtext: {
    fontSize: 12,
    color: '#B0B0C4',
    fontStyle: 'italic',
  },

  // ===== BOTONES =====
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },

  backBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 184, 77, 0.2)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 77, 0.4)',
  },

  backText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFB84D',
  },

  primaryBtn: {
    flex: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },

  primaryBtnDisabled: {
    opacity: 0.5,
  },

  primaryBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },

  primaryBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});