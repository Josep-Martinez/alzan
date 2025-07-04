// components/sport/PostWorkoutIntensity.tsx - Modal para capturar intensidad post-entrenamiento
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

/**
 * Interfaz para los datos de intensidad post-entrenamiento
 * DATOS BD: Estructura para tabla post_workout_data
 */
interface PostWorkoutData {
  rpe: number;       // BD: rpe_score (Rate of Perceived Exertion 1-10)
  feeling: string;   // BD: feeling_category (great/good/ok/tired/exhausted)
  notes?: string;    // BD: workout_notes (TEXT opcional)
}

/**
 * Props del componente PostWorkoutIntensity
 */
interface PostWorkoutIntensityProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: PostWorkoutData | null) => void; // null = omitir intensidad
  workoutName: string;
}

/**
 * Escalas de RPE basadas en investigación de apps fitness profesionales
 * Siguiendo el patrón de Garmin Connect y Apple Fitness
 * DATOS BD: Valores predefinidos para validación en backend
 */
const RPE_SCALES = [
  { value: 1, label: 'Muy Fácil', description: 'Sin esfuerzo', color: '#4CAF50', emoji: '😌' },
  { value: 2, label: 'Fácil', description: 'Esfuerzo mínimo', color: '#8BC34A', emoji: '🙂' },
  { value: 3, label: 'Moderado', description: 'Esfuerzo ligero', color: '#CDDC39', emoji: '😊' },
  { value: 4, label: 'Algo Duro', description: 'Esfuerzo moderado', color: '#FFC107', emoji: '😐' },
  { value: 5, label: 'Duro', description: 'Esfuerzo notable', color: '#FF9800', emoji: '😅' },
  { value: 6, label: 'Muy Duro', description: 'Esfuerzo alto', color: '#FF5722', emoji: '😰' },
  { value: 7, label: 'Extremo', description: 'Esfuerzo muy alto', color: '#F44336', emoji: '🥵' },
  { value: 8, label: 'Agotador', description: 'Esfuerzo intenso', color: '#E91E63', emoji: '😫' },
  { value: 9, label: 'Máximo', description: 'Esfuerzo máximo', color: '#9C27B0', emoji: '🤯' },
  { value: 10, label: 'Imposible', description: 'No sostenible', color: '#673AB7', emoji: '💀' },
];

/**
 * Categorías de sensación basadas en Apple Fitness y Garmin
 * DATOS BD: Enum values para feeling_category
 */
const FEELING_CATEGORIES = [
  { id: 'great', label: 'Excelente', description: 'Me siento genial', icon: 'emoticon-excited', color: '#4CAF50' },
  { id: 'good', label: 'Bien', description: 'Me siento bien', icon: 'emoticon-happy', color: '#8BC34A' },
  { id: 'ok', label: 'Normal', description: 'Me siento normal', icon: 'emoticon-neutral', color: '#FFC107' },
  { id: 'tired', label: 'Cansado', description: 'Me siento cansado', icon: 'emoticon-sad', color: '#FF9800' },
  { id: 'exhausted', label: 'Agotado', description: 'Me siento agotado', icon: 'emoticon-dead', color: '#F44336' },
];

/**
 * Componente PostWorkoutIntensity
 * Modal para capturar métricas subjetivas post-entrenamiento
 * Implementa escalas RPE y categorías de sensación estándar
 * DATOS BD: Inserta datos en tabla post_workout_data con foreign key a workouts
 */
export default function PostWorkoutIntensity({
  visible,
  onClose,
  onSubmit,
  workoutName
}: PostWorkoutIntensityProps) {
  // ===== ESTADOS =====
  const [selectedRPE, setSelectedRPE] = useState<number>(5); // Valor por defecto moderado
  const [selectedFeeling, setSelectedFeeling] = useState<string>('good'); // Sensación por defecto
  const [notes, setNotes] = useState<string>(''); // Notas opcionales
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  /**
   * Maneja el envío de datos de intensidad
   * DATOS BD: INSERT en post_workout_data con workout_id, rpe_score, feeling_category, notes
   */
  const handleSubmit = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    const data: PostWorkoutData = {
      rpe: selectedRPE, // BD: rpe_score
      feeling: selectedFeeling, // BD: feeling_category
      notes: notes.trim() || undefined // BD: workout_notes (puede ser NULL)
    };

    try {
      onSubmit(data);
    } catch (error) {
      console.error('Error submitting workout intensity:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Omite la captura de intensidad y completa el entrenamiento sin datos subjetivos
   * DATOS BD: El workout se marca como completed pero sin datos en post_workout_data
   */
  const handleSkip = () => {
    onSubmit(null); // null indica que se omitió la intensidad
  };

  /**
   * Obtiene los datos de la escala RPE seleccionada
   */
  const getSelectedRPEData = () => {
    return RPE_SCALES.find(scale => scale.value === selectedRPE) || RPE_SCALES[4];
  };

  /**
   * Obtiene los datos de la categoría de sensación seleccionada
   */
  const getSelectedFeelingData = () => {
    return FEELING_CATEGORIES.find(feeling => feeling.id === selectedFeeling) || FEELING_CATEGORIES[1];
  };

  const rpeData = getSelectedRPEData();
  const feelingData = getSelectedFeelingData();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <LinearGradient
        colors={['#0F0F23', '#1A1A3A', '#2D2D5F']}
        style={styles.container}
      >
        {/* ===== HEADER ===== */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <MaterialCommunityIcons
              name="chart-line"
              size={24}
              color="#00D4AA"
            />
            <Text style={styles.title}>¿Cómo fue tu entrenamiento?</Text>
          </View>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <MaterialCommunityIcons
              name="close"
              size={24}
              color="#B0B0C4"
            />
          </Pressable>
        </View>

        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* ===== INFO DEL ENTRENAMIENTO ===== */}
          <View style={styles.workoutInfo}>
            <LinearGradient
              colors={["#2D2D5F", "#3D3D7F"]}
              style={styles.workoutInfoGradient}
            >
              <MaterialCommunityIcons
                name="trophy"
                size={20}
                color="#FFB84D"
              />
              <Text style={styles.workoutInfoText}>
                Entrenamiento completado: {workoutName}
              </Text>
            </LinearGradient>
          </View>

          {/* ===== SECCIÓN RPE ===== */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons
                name="speedometer"
                size={20}
                color="#00D4AA"
              />
              <Text style={styles.sectionTitle}>Intensidad del Esfuerzo (RPE)</Text>
            </View>
            
            <Text style={styles.sectionSubtitle}>
              En una escala del 1 al 10, ¿qué tan duro se sintió el entrenamiento?
            </Text>

            {/* Visualización del RPE seleccionado */}
            <View style={styles.selectedRPEDisplay}>
              <LinearGradient
                colors={[rpeData.color + '33', rpeData.color + '1A']}
                style={styles.selectedRPEGradient}
              >
                <Text style={styles.selectedRPEEmoji}>{rpeData.emoji}</Text>
                <Text style={styles.selectedRPEValue}>{rpeData.value}/10</Text>
                <Text style={styles.selectedRPELabel}>{rpeData.label}</Text>
                <Text style={styles.selectedRPEDescription}>{rpeData.description}</Text>
              </LinearGradient>
            </View>

            {/* Selector de RPE */}
            <View style={styles.rpeSelector}>
              {RPE_SCALES.map((scale) => (
                <Pressable
                  key={scale.value}
                  onPress={() => setSelectedRPE(scale.value)}
                  style={[
                    styles.rpeOption,
                    selectedRPE === scale.value && styles.rpeOptionSelected,
                    { borderColor: scale.color }
                  ]}
                >
                  <Text
                    style={[
                      styles.rpeOptionText,
                      selectedRPE === scale.value && { color: scale.color }
                    ]}
                  >
                    {scale.value}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Descripción visual del RPE */}
            <View style={styles.rpeDescription}>
              <Text style={styles.rpeDescriptionText}>
                💡 RPE (Rate of Perceived Exertion) es una medida subjetiva de qué tan duro 
                se sintió tu entrenamiento, independiente de las métricas objetivas.
              </Text>
            </View>
          </View>

          {/* ===== SECCIÓN SENSACIÓN GENERAL ===== */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons
                name="heart"
                size={20}
                color="#FF6B6B"
              />
              <Text style={styles.sectionTitle}>Sensación General</Text>
            </View>
            
            <Text style={styles.sectionSubtitle}>
              ¿Cómo te sientes después del entrenamiento?
            </Text>

            {/* Selector de sensación */}
            <View style={styles.feelingSelector}>
              {FEELING_CATEGORIES.map((feeling) => (
                <Pressable
                  key={feeling.id}
                  onPress={() => setSelectedFeeling(feeling.id)}
                  style={[
                    styles.feelingOption,
                    selectedFeeling === feeling.id && styles.feelingOptionSelected,
                    selectedFeeling === feeling.id && { backgroundColor: feeling.color + '20' }
                  ]}
                >
                  <MaterialCommunityIcons
                    name={feeling.icon as any}
                    size={24}
                    color={selectedFeeling === feeling.id ? feeling.color : '#B0B0C4'}
                  />
                  <Text
                    style={[
                      styles.feelingOptionLabel,
                      selectedFeeling === feeling.id && { color: feeling.color }
                    ]}
                  >
                    {feeling.label}
                  </Text>
                  <Text
                    style={[
                      styles.feelingOptionDescription,
                      selectedFeeling === feeling.id && { color: feeling.color + 'CC' }
                    ]}
                  >
                    {feeling.description}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* ===== SECCIÓN NOTAS OPCIONALES ===== */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons
                name="note-text"
                size={20}
                color="#FFB84D"
              />
              <Text style={styles.sectionTitle}>Notas Adicionales (Opcional)</Text>
            </View>
            
            <Text style={styles.sectionSubtitle}>
              Cualquier observación sobre el entrenamiento
            </Text>

            <TextInput
              value={notes}
              onChangeText={setNotes}
              style={styles.notesInput}
              placeholder="Ej: Me costó más de lo normal, clima húmedo, nueva rutina..."
              placeholderTextColor="#6B7280"
              multiline
              numberOfLines={3}
              maxLength={200}
            />
            
            <Text style={styles.notesCounter}>
              {notes.length}/200 caracteres
            </Text>
          </View>

          {/* ===== RESUMEN ===== */}
          <View style={styles.summary}>
            <LinearGradient
              colors={[feelingData.color + '20', feelingData.color + '10']}
              style={styles.summaryGradient}
            >
              <View style={styles.summaryHeader}>
                <MaterialCommunityIcons
                  name="clipboard-check"
                  size={20}
                  color={feelingData.color}
                />
                <Text style={styles.summaryTitle}>Resumen</Text>
              </View>
              
              <View style={styles.summaryContent}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Intensidad:</Text>
                  <Text style={[styles.summaryValue, { color: rpeData.color }]}>
                    {rpeData.value}/10 - {rpeData.label} {rpeData.emoji}
                  </Text>
                </View>
                
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Sensación:</Text>
                  <Text style={[styles.summaryValue, { color: feelingData.color }]}>
                    {feelingData.label} {feelingData.description}
                  </Text>
                </View>
                
                {notes.trim() && (
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Notas:</Text>
                    <Text style={styles.summaryNotes}>{notes.trim()}</Text>
                  </View>
                )}
              </View>
            </LinearGradient>
          </View>
        </ScrollView>

        {/* ===== BOTONES DE ACCIÓN ===== */}
        <View style={styles.actions}>
          {/* Botón Omitir - Color diferente, completa sin datos */}
          <Pressable 
            onPress={handleSkip} 
            style={styles.skipBtn}
            disabled={isSubmitting}
          >
            <Text style={styles.skipText}>Omitir</Text>
          </Pressable>
          
          {/* Botón Guardar Intensidad */}
          <Pressable 
            onPress={handleSubmit} 
            style={[
              styles.submitBtn,
              isSubmitting && styles.submitBtnDisabled
            ]}
            disabled={isSubmitting}
          >
            <LinearGradient
              colors={isSubmitting ? ["#6B7280", "#4B5563"] : ["#00D4AA", "#00B894"]}
              style={styles.submitGradient}
            >
              {isSubmitting ? (
                <MaterialCommunityIcons
                  name="loading"
                  size={20}
                  color="#FFFFFF"
                />
              ) : (
                <MaterialCommunityIcons
                  name="check-circle"
                  size={20}
                  color="#FFFFFF"
                />
              )}
              <Text style={styles.submitText}>
                {isSubmitting ? 'Guardando...' : 'Guardar Intensidad'}
              </Text>
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

  closeButton: {
    padding: 8,
  },

  // ===== CONTENIDO =====
  content: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },

  // ===== INFO DEL ENTRENAMIENTO =====
  workoutInfo: {
    marginBottom: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },

  workoutInfoGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },

  workoutInfoText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },

  // ===== SECCIONES =====
  section: {
    marginBottom: 24,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  sectionSubtitle: {
    fontSize: 14,
    color: '#B0B0C4',
    marginBottom: 16,
    lineHeight: 20,
  },

  // ===== RPE SELECTOR =====
  selectedRPEDisplay: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },

  selectedRPEGradient: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
  },

  selectedRPEEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },

  selectedRPEValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },

  selectedRPELabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },

  selectedRPEDescription: {
    fontSize: 14,
    color: '#B0B0C4',
    textAlign: 'center',
  },

  rpeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },

  rpeOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  rpeOptionSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
  },

  rpeOptionText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#B0B0C4',
  },

  rpeDescription: {
    backgroundColor: 'rgba(0, 212, 170, 0.1)',
    borderRadius: 12,
    padding: 12,
  },

  rpeDescriptionText: {
    fontSize: 12,
    color: '#00D4AA',
    lineHeight: 16,
    textAlign: 'center',
  },

  // ===== SELECTOR DE SENSACIÓN =====
  feelingSelector: {
    gap: 8,
  },

  feelingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 12,
  },

  feelingOptionSelected: {
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },

  feelingOptionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#B0B0C4',
    flex: 1,
  },

  feelingOptionDescription: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },

  // ===== NOTAS =====
  notesInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    textAlignVertical: 'top',
    minHeight: 80,
  },

  notesCounter: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'right',
    marginTop: 4,
  },

  // ===== RESUMEN =====
  summary: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },

  summaryGradient: {
    padding: 16,
    borderRadius: 16,
  },

  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },

  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  summaryContent: {
    gap: 8,
  },

  summaryItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },

  summaryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#B0B0C4',
    minWidth: 80,
  },

  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },

  summaryNotes: {
    fontSize: 14,
    color: '#FFFFFF',
    flex: 1,
    fontStyle: 'italic',
  },

  // ===== BOTONES DE ACCIÓN =====
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },

  // Botón Omitir - Color naranaja/amarillo para diferenciarlo
  skipBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 184, 77, 0.2)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 77, 0.4)',
  },

  skipText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFB84D',
  },

  // Botón principal (Guardar)
  submitBtn: {
    flex: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },

  submitBtnDisabled: {
    opacity: 0.7,
  },

  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },

  submitText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});