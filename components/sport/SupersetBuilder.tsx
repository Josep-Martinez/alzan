// components/sport/SupersetBuilder.tsx - Constructor de superseries con UI mejorada
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
import { GymExercise } from './sports';

/**
 * Tipos de superseries disponibles
 * DATOS BD: Enum values para superset_type en tabla supersets
 */
const SUPERSET_TYPES = [
  {
    type: 'superset',
    name: 'Superserie',
    description: '2 ejercicios sin descanso',
    icon: 'lightning-bolt',
    color: '#FF6B6B',
    minExercises: 2,
    maxExercises: 2,
    benefits: ['Ahorra tiempo', 'Aumenta intensidad', 'Músculos antagonistas']
  },
  {
    type: 'triset',
    name: 'Triserie',
    description: '3 ejercicios consecutivos',
    icon: 'flash',
    color: '#FFB84D',
    minExercises: 3,
    maxExercises: 3,
    benefits: ['Mayor volumen', 'Trabajo específico', 'Fatiga controlada']
  },
  {
    type: 'circuit',
    name: 'Circuito',
    description: '4+ ejercicios en secuencia',
    icon: 'refresh-circle',
    color: '#4ECDC4',
    minExercises: 4,
    maxExercises: 8,
    benefits: ['Trabajo cardiovascular', 'Tiempo eficiente', 'Variedad']
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
    type: 'superset' | 'circuit' | 'triset';
    exercises: GymExercise[];
    rounds: number;
    restTime: string;
  }) => void;
}

/**
 * Componente constructor de superseries
 * Permite crear superseries, triseries y circuitos con interfaz intuitiva
 * 
 * DATOS BD: Crea registros en tabla supersets con relaciones a exercises
 * - superset_id (PRIMARY KEY)
 * - superset_name (VARCHAR)
 * - superset_type (ENUM: superset/triset/circuit)
 * - rounds_count (INTEGER)
 * - rest_time_seconds (INTEGER)
 * - created_at (TIMESTAMP)
 */
export default function SupersetBuilder({
  visible,
  exercises,
  onClose,
  onCreateSuperset
}: SupersetBuilderProps) {
  // ===== ESTADOS =====
  const [currentStep, setCurrentStep] = useState<'type' | 'exercises' | 'config'>('type');
  const [selectedType, setSelectedType] = useState<'superset' | 'circuit' | 'triset'>('superset');
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const [supersetName, setSupersetName] = useState('');
  const [rounds, setRounds] = useState(3);
  const [restTime, setRestTime] = useState('90');

  /**
   * Reinicia el builder al estado inicial
   */
  const resetBuilder = () => {
    setCurrentStep('type');
    setSelectedType('superset');
    setSelectedExercises([]);
    setSupersetName('');
    setRounds(3);
    setRestTime('90');
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
   * Continúa al siguiente paso o retrocede al anterior
   */
  const nextStep = () => {
    if (currentStep === 'type') {
      setCurrentStep('exercises');
      setSupersetName(`${getSelectedTypeConfig().name} ${new Date().getHours()}:${new Date().getMinutes().toString().padStart(2, '0')}`);
    } else if (currentStep === 'exercises') {
      setCurrentStep('config');
    }
  };

  /**
   * Función para retroceder (botón "Atrás")
   */
  const prevStep = () => {
    if (currentStep === 'config') {
      setCurrentStep('exercises');
    } else if (currentStep === 'exercises') {
      setCurrentStep('type');
    } else {
      // Si estamos en el primer paso, cerrar el modal
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
      case 'config':
        return supersetName.trim() !== '' && rounds > 0 && restTime.trim() !== '';
      default:
        return false;
    }
  };

  /**
   * Crea la superserie
   * DATOS BD: INSERT en tabla supersets con foreign keys a exercises
   */
  const createSuperset = () => {
    const selectedExerciseObjects = selectedExercises.map(id => 
      exercises.find(ex => ex.id === id)!
    );

    onCreateSuperset({
      name: supersetName.trim(), // BD: superset_name
      type: selectedType, // BD: superset_type
      exercises: selectedExerciseObjects, // BD: Relación superset_exercises
      rounds, // BD: rounds_count
      restTime // BD: rest_time_seconds
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
        {/* ===== HEADER SIMPLIFICADO ===== */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <MaterialCommunityIcons
              name="lightning-bolt"
              size={24}
              color="#FF6B6B"
            />
            <Text style={styles.title}>Constructor de Superseries</Text>
          </View>

          <Pressable onPress={handleClose} style={styles.closeBtn}>
            <MaterialCommunityIcons name="close" size={24} color="#B0B0C4" />
          </Pressable>
        </View>

        {/* ===== INDICADOR DE PROGRESO ===== */}
        <View style={styles.progressIndicator}>
          <View style={styles.progressSteps}>
            {["type", "exercises", "config"].map((step, index) => (
              <View key={step} style={styles.progressStepContainer}>
                <View
                  style={[
                    styles.progressStep,
                    currentStep === step && styles.progressStepActive,
                    ["type", "exercises", "config"].indexOf(currentStep) >
                      index && styles.progressStepCompleted,
                  ]}
                >
                  <Text
                    style={[
                      styles.progressStepText,
                      (currentStep === step ||
                        ["type", "exercises", "config"].indexOf(currentStep) >
                          index) &&
                        styles.progressStepTextActive,
                    ]}
                  >
                    {index + 1}
                  </Text>
                </View>
                {index < 2 && (
                  <View
                    style={[
                      styles.progressLine,
                      ["type", "exercises", "config"].indexOf(currentStep) >
                        index && styles.progressLineCompleted,
                    ]}
                  />
                )}
              </View>
            ))}
          </View>

          <View style={styles.progressLabels}>
            <Text
              style={[
                styles.progressLabel,
                currentStep === "type" && styles.progressLabelActive,
              ]}
            >
              Tipo
            </Text>
            <Text
              style={[
                styles.progressLabel,
                currentStep === "exercises" && styles.progressLabelActive,
              ]}
            >
              Ejercicios
            </Text>
            <Text
              style={[
                styles.progressLabel,
                currentStep === "config" && styles.progressLabelActive,
              ]}
            >
              Configuración
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
                          size={32}
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

                      <View style={styles.typeOptionBenefits}>
                        <Text
                          style={[
                            styles.benefitsTitle,
                            selectedType === type.type &&
                              styles.benefitsTitleSelected,
                          ]}
                        >
                          Beneficios:
                        </Text>
                        {type.benefits.map((benefit, index) => (
                          <Text
                            key={index}
                            style={[
                              styles.benefitText,
                              selectedType === type.type &&
                                styles.benefitTextSelected,
                            ]}
                          >
                            • {benefit}
                          </Text>
                        ))}
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
                                  {String.fromCharCode(65 + index)}
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
                <Text style={styles.sectionTitle}>Ejercicios Disponibles</Text>

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
                              {String.fromCharCode(
                                65 + selectedExercises.indexOf(exercise.id)
                              )}
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

          {/* ===== PASO 3: CONFIGURACIÓN ===== */}
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
                      Ejercicios Seleccionados
                    </Text>
                  </View>

                  <View style={styles.configSummaryExercises}>
                    {selectedExercises.map((exerciseId, index) => {
                      const exercise = exercises.find(
                        (ex) => ex.id === exerciseId
                      )!;
                      return (
                        <Text
                          key={exerciseId}
                          style={styles.configSummaryExercise}
                        >
                          {String.fromCharCode(65 + index)}. {exercise.name}
                        </Text>
                      );
                    })}
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
                <Text style={styles.configLabel}>Número de Rondas</Text>
                <View style={styles.roundsSelector}>
                  {[1, 2, 3, 4, 5, 6].map((num) => (
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

              {/* Tiempo de descanso */}
              <View style={styles.configField}>
                <Text style={styles.configLabel}>Descanso entre rondas</Text>
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
                    &quot;{supersetName}&quot; - {selectedExercises.length}{" "}
                    ejercicios × {rounds} rondas
                  </Text>
                  <Text style={styles.finalPreviewSubtext}>
                    Descanso de {restTime}s entre rondas • Tiempo estimado: ~
                    {Math.round(
                      ((selectedExercises.length * 60 +
                        parseInt(restTime || "90")) *
                        rounds) /
                        60
                    )}{" "}
                    minutos
                  </Text>
                </LinearGradient>
              </View>
            </View>
          )}
        </ScrollView>

        {/* ===== BOTONES DE ACCIÓN SIMPLIFICADOS ===== */}
        <View style={styles.actions}>
          {/* Botón Atrás - Mismo color que omitir (naranaja/amarillo) */}
          <Pressable onPress={prevStep} style={styles.backBtn}>
            <Text style={styles.backText}>
              {currentStep === "type" ? "Cancelar" : "Atrás"}
            </Text>
          </Pressable>

          {/* Botón principal */}
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

  // ===== HEADER SIMPLIFICADO =====
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
  // Reemplaza los estilos existentes con estos:
exerciseCountContainer: {
  backgroundColor: 'rgba(255, 184, 77, 0.2)',
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderRadius: 8,
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
  },

  typeOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 16,
  },

  typeOptionInfo: {
    flex: 1,
  },

  typeOptionName: {
    fontSize: 20,
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

  typeOptionBenefits: {
    marginBottom: 12,
  },

  benefitsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#B0B0C4',
    marginBottom: 6,
  },

  benefitsTitleSelected: {
    color: 'rgba(255, 255, 255, 0.9)',
  },

  benefitText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },

  benefitTextSelected: {
    color: 'rgba(255, 255, 255, 0.7)',
  },

  typeOptionFooter: {
    alignItems: 'center',
  },

// En SupersetBuilder.tsx
exerciseCount: {
  fontSize: 12,
  fontWeight: '600',
  color: '#FFB84D',
  backgroundColor: 'rgba(255, 184, 77, 0.2)', // Línea problemática
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderRadius: 8,
},

  exerciseCountSelected: {
    color: '#FFFFFF',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
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

  // ===== PASO 3: CONFIGURACIÓN =====
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

  configLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#B0B0C4',
    marginBottom: 8,
  },

  configInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
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
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
  },

  restTimeInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },

  restTimeUnit: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
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

  // ===== BOTONES SIMPLIFICADOS =====
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },

  // Botón Atrás - Mismo color que omitir (naranaja/amarillo)
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