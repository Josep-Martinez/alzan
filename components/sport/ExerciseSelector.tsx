// components/sport/ExerciseSelector.tsx - Versión corregida con scroll funcional
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';

// Interfaz simplificada para ejercicio manual
interface ManualExercise {
  id: string;
  name: string;
}

interface ExerciseSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelectExercise: (exercise: ManualExercise) => void;
}

export default function ExerciseSelector({ visible, onClose, onSelectExercise }: ExerciseSelectorProps) {
  const [exerciseName, setExerciseName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Categorías predefinidas para organizar
  const categories = [
    { id: 'chest', name: 'Pecho', icon: 'arm-flex' },
    { id: 'back', name: 'Espalda', icon: 'human-handsup' },
    { id: 'shoulders', name: 'Hombros', icon: 'account-outline' },
    { id: 'arms', name: 'Brazos', icon: 'arm-flex-outline' },
    { id: 'legs', name: 'Piernas', icon: 'human-male' },
    { id: 'abs', name: 'Abdomen', icon: 'ab-testing' },
    { id: 'cardio', name: 'Cardio', icon: 'heart' },
    { id: 'other', name: 'Otro', icon: 'dumbbell' }
  ];

  // Ejercicios sugeridos por categoría (solo nombres)
  const suggestedExercises: Record<string, string[]> = {
    chest: ['Press banca', 'Flexiones', 'Press inclinado', 'Aperturas', 'Fondos'],
    back: ['Dominadas', 'Remo', 'Peso muerto', 'Jalones', 'Remo con barra'],
    shoulders: ['Press militar', 'Elevaciones laterales', 'Press hombro', 'Pájaros', 'Press Arnold'],
    arms: ['Curl bíceps', 'Tríceps', 'Curl martillo', 'Press francés', 'Fondos tríceps'],
    legs: ['Sentadillas', 'Prensa', 'Zancadas', 'Peso muerto rumano', 'Extensiones'],
    abs: ['Abdominales', 'Plancha', 'Crunches', 'Elevaciones piernas', 'Russian twist'],
    cardio: ['Cinta', 'Elíptica', 'Bicicleta', 'Remo', 'Burpees'],
    other: ['Ejercicio personalizado']
  };

  /**
   * Función para añadir ejercicio personalizado
   * Valida que el nombre no esté vacío y crea el ejercicio
   */
  const handleAddCustomExercise = () => {
    if (!exerciseName.trim()) return;

    const newExercise: ManualExercise = {
      id: `manual_${Date.now()}`,
      name: exerciseName.trim()
    };

    onSelectExercise(newExercise);
    resetAndClose();
  };

  /**
   * Función para seleccionar ejercicio sugerido
   * Crea el ejercicio desde la lista predefinida
   */
  const handleSelectSuggested = (name: string) => {
    const exercise: ManualExercise = {
      id: `suggested_${Date.now()}`,
      name: name
    };

    onSelectExercise(exercise);
    resetAndClose();
  };

  /**
   * Función para limpiar estado y cerrar modal
   */
  const resetAndClose = () => {
    setExerciseName('');
    setSelectedCategory('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen" // Cambio clave: fullScreen para mejor scroll
    >
      <LinearGradient
        colors={['#0F0F23', '#1A1A3A', '#2D2D5F']}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea}>
          {/* Header fijo */}
          <View style={styles.header}>
            <Text style={styles.title}>Añadir Ejercicio</Text>
            <Pressable onPress={resetAndClose} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={24} color="#B0B0C4" />
            </Pressable>
          </View>

          {/* Contenido scrolleable */}
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={true} // Permite bounce en iOS
            scrollEventThrottle={16} // Mejora performance del scroll
          >
            {/* Ejercicio personalizado */}
            <View style={styles.customSection}>
              <Text style={styles.sectionTitle}>Ejercicio Personalizado</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  value={exerciseName}
                  onChangeText={setExerciseName}
                  placeholder="Nombre del ejercicio..."
                  placeholderTextColor="#B0B0C4"
                  style={styles.textInput}
                  autoFocus={false} // Evitar auto-focus que puede interferir
                />
                <Pressable 
                  onPress={handleAddCustomExercise}
                  style={[
                    styles.addButton,
                    !exerciseName.trim() && styles.addButtonDisabled
                  ]}
                  disabled={!exerciseName.trim()}
                >
                  <MaterialCommunityIcons 
                    name="plus" 
                    size={20} 
                    color={exerciseName.trim() ? "#FFFFFF" : "#6B7280"} 
                  />
                  <Text style={[
                    styles.addButtonText,
                    !exerciseName.trim() && styles.addButtonTextDisabled
                  ]}>
                    Añadir
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Separador */}
            <View style={styles.separator}>
              <View style={styles.separatorLine} />
              <Text style={styles.separatorText}>O selecciona uno sugerido</Text>
              <View style={styles.separatorLine} />
            </View>

            {/* Categorías */}
            <View style={styles.categoriesSection}>
              <Text style={styles.sectionTitle}>Categorías</Text>
              <View style={styles.categoriesGrid}>
                {categories.map((category) => (
                  <Pressable
                    key={category.id}
                    onPress={() => setSelectedCategory(
                      selectedCategory === category.id ? '' : category.id
                    )}
                    style={[
                      styles.categoryCard,
                      selectedCategory === category.id && styles.categoryCardSelected
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={category.icon as any}
                      size={24}
                      color={selectedCategory === category.id ? '#FFFFFF' : '#00D4AA'}
                    />
                    <Text style={[
                      styles.categoryName,
                      selectedCategory === category.id && styles.categoryNameSelected
                    ]}>
                      {category.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Ejercicios sugeridos - Solo se muestran si hay categoría seleccionada */}
            {selectedCategory && (
              <View style={styles.suggestionsSection}>
                <Text style={styles.sectionTitle}>
                  Ejercicios de {categories.find(c => c.id === selectedCategory)?.name}
                </Text>
                <View style={styles.suggestionsList}>
                  {suggestedExercises[selectedCategory]?.map((exercise, index) => (
                    <Pressable
                      key={index}
                      onPress={() => handleSelectSuggested(exercise)}
                      style={styles.suggestionItem}
                    >
                      <LinearGradient
                        colors={["#2D2D5F", "#3D3D7F"]}
                        style={styles.suggestionGradient}
                      >
                        <MaterialCommunityIcons
                          name="dumbbell"
                          size={20}
                          color="#00D4AA"
                        />
                        <Text style={styles.suggestionName}>{exercise}</Text>
                        <MaterialCommunityIcons
                          name="chevron-right"
                          size={16}
                          color="#B0B0C4"
                        />
                      </LinearGradient>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* Espacio adicional al final para mejor scroll */}
            <View style={styles.bottomSpacer} />
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // Contenedor principal
  container: {
    flex: 1,
  },

  safeArea: {
    flex: 1,
  },

  // Header fijo que no hace scroll
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'transparent', // Fondo transparente para mejor integración
  },

  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },

  // ScrollView y contenido
  scrollView: {
    flex: 1,
  },

  scrollContent: {
    padding: 20,
    paddingTop: 10, // Menos padding top ya que header es fijo
  },

  // Sección de ejercicio personalizado
  customSection: {
    marginBottom: 24,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },

  inputContainer: {
    flexDirection: 'row',
    gap: 12,
  },

  textInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },

  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00D4AA',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },

  addButtonDisabled: {
    backgroundColor: '#6B7280',
  },

  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  addButtonTextDisabled: {
    color: '#9CA3AF',
  },

  // Separador
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    gap: 12,
  },

  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },

  separatorText: {
    fontSize: 14,
    color: '#B0B0C4',
    fontWeight: '500',
  },

  // Sección de categorías
  categoriesSection: {
    marginBottom: 24,
  },

  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },

  categoryCard: {
    width: '22%', // Ajustado para mejor distribución
    aspectRatio: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 6,
  },

  categoryCardSelected: {
    backgroundColor: '#00D4AA',
    borderColor: '#00D4AA',
  },

  categoryName: {
    fontSize: 11,
    color: '#B0B0C4',
    fontWeight: '600',
    textAlign: 'center',
  },

  categoryNameSelected: {
    color: '#FFFFFF',
  },

  // Sección de sugerencias
  suggestionsSection: {
    flex: 1,
  },

  suggestionsList: {
    gap: 8,
  },

  suggestionItem: {
    borderRadius: 12,
    overflow: 'hidden',
  },

  suggestionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },

  suggestionName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Espacio al final para mejor scroll
  bottomSpacer: {
    height: 40,
  },
});