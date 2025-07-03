// components/sport/ExerciseSelector.tsx - Selector de ejercicios de gimnasio
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
 * Interfaz para ejercicio manual
 */
interface ManualExercise {
  id: string;
  name: string;
}

/**
 * Props del selector de ejercicios
 */
interface ExerciseSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelectExercise: (exercise: ManualExercise) => void;
}

/**
 * Base de datos de ejercicios organizados por grupo muscular
 * Incluye ejercicios populares y efectivos para gimnasio
 */
const EXERCISE_DATABASE = {
  pecho: {
    name: 'Pecho',
    icon: 'arm-flex',
    color: '#FF6B6B',
    exercises: [
      { id: 'press_banca', name: 'Press de Banca' },
      { id: 'press_inclinado', name: 'Press Inclinado' },
      { id: 'press_declinado', name: 'Press Declinado' },
      { id: 'aperturas_mancuernas', name: 'Aperturas con Mancuernas' },
      { id: 'aperturas_cables', name: 'Aperturas en Cables' },
      { id: 'fondos_paralelas', name: 'Fondos en Paralelas' },
      { id: 'flexiones', name: 'Flexiones' },
      { id: 'press_mancuernas', name: 'Press con Mancuernas' }
    ]
  },
  espalda: {
    name: 'Espalda',
    icon: 'human-handsup',
    color: '#4ECDC4',
    exercises: [
      { id: 'dominadas', name: 'Dominadas' },
      { id: 'remo_barra', name: 'Remo con Barra' },
      { id: 'remo_mancuerna', name: 'Remo con Mancuerna' },
      { id: 'jalones_lat', name: 'Jalones en Polea Alta' },
      { id: 'remo_cable', name: 'Remo en Cable Sentado' },
      { id: 'peso_muerto', name: 'Peso Muerto' },
      { id: 'hiperextensiones', name: 'Hiperextensiones' },
      { id: 'pullover', name: 'Pullover' }
    ]
  },
  piernas: {
    name: 'Piernas',
    icon: 'run',
    color: '#45B7D1',
    exercises: [
      { id: 'sentadillas', name: 'Sentadillas' },
      { id: 'prensa', name: 'Prensa de Piernas' },
      { id: 'zancadas', name: 'Zancadas' },
      { id: 'peso_muerto_rumano', name: 'Peso Muerto Rumano' },
      { id: 'curl_femoral', name: 'Curl Femoral' },
      { id: 'extension_cuadriceps', name: 'Extensión de Cuádriceps' },
      { id: 'elevacion_gemelos', name: 'Elevación de Gemelos' },
      { id: 'sentadilla_bulgara', name: 'Sentadilla Búlgara' }
    ]
  },
  hombros: {
    name: 'Hombros',
    icon: 'account-arrow-up',
    color: '#FF9800',
    exercises: [
      { id: 'press_militar', name: 'Press Militar' },
      { id: 'press_mancuernas_hombro', name: 'Press con Mancuernas' },
      { id: 'elevaciones_laterales', name: 'Elevaciones Laterales' },
      { id: 'elevaciones_frontales', name: 'Elevaciones Frontales' },
      { id: 'pajaros', name: 'Pájaros (Deltoides Posterior)' },
      { id: 'press_arnold', name: 'Press Arnold' },
      { id: 'remo_al_menton', name: 'Remo al Mentón' },
      { id: 'encogimientos', name: 'Encogimientos de Hombros' }
    ]
  },
  brazos: {
    name: 'Brazos',
    icon: 'arm-flex-outline',
    color: '#9C27B0',
    exercises: [
      { id: 'curl_biceps_barra', name: 'Curl de Bíceps con Barra' },
      { id: 'curl_biceps_mancuernas', name: 'Curl de Bíceps con Mancuernas' },
      { id: 'curl_martillo', name: 'Curl Martillo' },
      { id: 'press_frances', name: 'Press Francés' },
      { id: 'extensiones_triceps', name: 'Extensiones de Tríceps' },
      { id: 'fondos_banco', name: 'Fondos en Banco' },
      { id: 'curl_predicador', name: 'Curl en Predicador' },
      { id: 'patadas_triceps', name: 'Patadas de Tríceps' }
    ]
  },
  core: {
    name: 'Core',
    icon: 'human-male',
    color: '#4CAF50',
    exercises: [
      { id: 'abdominales_crunch', name: 'Abdominales Crunch' },
      { id: 'plancha', name: 'Plancha' },
      { id: 'abdominales_bicicleta', name: 'Abdominales Bicicleta' },
      { id: 'elevacion_piernas', name: 'Elevación de Piernas' },
      { id: 'mountain_climbers', name: 'Mountain Climbers' },
      { id: 'russian_twist', name: 'Russian Twist' },
      { id: 'plancha_lateral', name: 'Plancha Lateral' },
      { id: 'dead_bug', name: 'Dead Bug' }
    ]
  },
  cardio: {
    name: 'Cardio',
    icon: 'heart-pulse',
    color: '#E91E63',
    exercises: [
      { id: 'cinta_correr', name: 'Cinta de Correr' },
      { id: 'bicicleta_estatica', name: 'Bicicleta Estática' },
      { id: 'eliptica', name: 'Elíptica' },
      { id: 'remo_cardio', name: 'Remo Cardio' },
      { id: 'burpees', name: 'Burpees' },
      { id: 'jumping_jacks', name: 'Jumping Jacks' },
      { id: 'escalador', name: 'Escalador' },
      { id: 'battle_ropes', name: 'Battle Ropes' }
    ]
  }
};

/**
 * Componente selector de ejercicios
 * Permite buscar y seleccionar ejercicios organizados por grupo muscular
 */
export default function ExerciseSelector({
  visible,
  onClose,
  onSelectExercise
}: ExerciseSelectorProps) {
  // ===== ESTADOS =====
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [recentExercises] = useState<ManualExercise[]>([
    { id: 'press_banca', name: 'Press de Banca' },
    { id: 'sentadillas', name: 'Sentadillas' },
    { id: 'dominadas', name: 'Dominadas' },
    { id: 'curl_biceps_barra', name: 'Curl de Bíceps con Barra' }
  ]);

  /**
   * Filtra ejercicios basado en búsqueda y categoría
   */
  const getFilteredExercises = () => {
    let allExercises: (ManualExercise & { category: string; categoryColor: string })[] = [];
    
    // Si hay una categoría seleccionada, solo mostrar esos ejercicios
    if (selectedCategory) {
      const categoryData = EXERCISE_DATABASE[selectedCategory as keyof typeof EXERCISE_DATABASE];
      allExercises = categoryData.exercises.map(ex => ({
        ...ex,
        category: categoryData.name,
        categoryColor: categoryData.color
      }));
    } else {
      // Mostrar todos los ejercicios
      Object.entries(EXERCISE_DATABASE).forEach(([key, categoryData]) => {
        allExercises.push(...categoryData.exercises.map(ex => ({
          ...ex,
          category: categoryData.name,
          categoryColor: categoryData.color
        })));
      });
    }

    // Filtrar por búsqueda
    if (searchText.trim()) {
      allExercises = allExercises.filter(exercise =>
        exercise.name.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    return allExercises;
  };

  /**
   * Maneja la selección de un ejercicio
   */
  const handleSelectExercise = (exercise: ManualExercise) => {
    onSelectExercise(exercise);
    onClose();
  };

  /**
   * Crea ejercicio personalizado a partir de la búsqueda
   */
  const createCustomExercise = () => {
    if (!searchText.trim()) return;
    
    const customExercise: ManualExercise = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: searchText.trim()
    };
    
    handleSelectExercise(customExercise);
  };

  const filteredExercises = getFilteredExercises();
  const categories = Object.entries(EXERCISE_DATABASE);

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
          <View style={styles.headerLeft}>
            {selectedCategory && (
              <Pressable
                onPress={() => setSelectedCategory(null)}
                style={styles.backBtn}
              >
                <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
              </Pressable>
            )}
            <View style={styles.headerContent}>
              <MaterialCommunityIcons name="dumbbell" size={24} color="#FF6B6B" />
              <Text style={styles.title}>
                {selectedCategory 
                  ? EXERCISE_DATABASE[selectedCategory as keyof typeof EXERCISE_DATABASE].name
                  : 'Ejercicios'
                }
              </Text>
            </View>
          </View>
          
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <MaterialCommunityIcons name="close" size={24} color="#B0B0C4" />
          </Pressable>
        </View>

        {/* ===== BARRA DE BÚSQUEDA ===== */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <MaterialCommunityIcons name="magnify" size={20} color="#B0B0C4" />
            <TextInput
              value={searchText}
              onChangeText={setSearchText}
              style={styles.searchInput}
              placeholder="Buscar ejercicio..."
              placeholderTextColor="#6B7280"
              autoCapitalize="words"
            />
            {searchText.length > 0 && (
              <Pressable
                onPress={() => setSearchText('')}
                style={styles.clearBtn}
              >
                <MaterialCommunityIcons name="close-circle" size={20} color="#6B7280" />
              </Pressable>
            )}
          </View>

          {/* Botón crear ejercicio personalizado */}
          {searchText.trim() && filteredExercises.length === 0 && (
            <Pressable
              onPress={createCustomExercise}
              style={styles.createCustomBtn}
            >
              <LinearGradient
                colors={["#00D4AA", "#00B894"]}
                style={styles.createCustomGradient}
              >
                <MaterialCommunityIcons name="plus" size={16} color="#FFFFFF" />
                <Text style={styles.createCustomText}>
                  Crear &quot;{searchText.trim()}&quot;
                </Text>
              </LinearGradient>
            </Pressable>
          )}
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* ===== EJERCICIOS RECIENTES ===== */}
          {!selectedCategory && !searchText && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ejercicios Recientes</Text>
              <View style={styles.recentExercises}>
                {recentExercises.map((exercise) => (
                  <Pressable
                    key={exercise.id}
                    onPress={() => handleSelectExercise(exercise)}
                    style={styles.recentExerciseBtn}
                  >
                    <LinearGradient
                      colors={["rgba(255, 255, 255, 0.1)", "rgba(255, 255, 255, 0.05)"]}
                      style={styles.recentExerciseGradient}
                    >
                      <MaterialCommunityIcons name="history" size={16} color="#FFB84D" />
                      <Text style={styles.recentExerciseText}>{exercise.name}</Text>
                    </LinearGradient>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* ===== CATEGORÍAS DE EJERCICIOS ===== */}
          {!selectedCategory && !searchText && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Grupos Musculares</Text>
              <View style={styles.categoriesGrid}>
                {categories.map(([key, categoryData]) => (
                  <Pressable
                    key={key}
                    onPress={() => setSelectedCategory(key)}
                    style={styles.categoryBtn}
                  >
                    <LinearGradient
                      colors={[categoryData.color + '20', categoryData.color + '10']}
                      style={styles.categoryGradient}
                    >
                      <MaterialCommunityIcons
                        name={categoryData.icon as any}
                        size={28}
                        color={categoryData.color}
                      />
                      <Text style={styles.categoryName}>{categoryData.name}</Text>
                      <Text style={styles.categoryCount}>
                        {categoryData.exercises.length} ejercicios
                      </Text>
                    </LinearGradient>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* ===== LISTA DE EJERCICIOS ===== */}
          {(selectedCategory || searchText) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {searchText 
                  ? `Resultados (${filteredExercises.length})`
                  : `Ejercicios de ${EXERCISE_DATABASE[selectedCategory as keyof typeof EXERCISE_DATABASE]?.name}`
                }
              </Text>
              
              {filteredExercises.length > 0 ? (
                <View style={styles.exercisesList}>
                  {filteredExercises.map((exercise) => (
                    <Pressable
                      key={exercise.id}
                      onPress={() => handleSelectExercise(exercise)}
                      style={styles.exerciseItem}
                    >
                      <LinearGradient
                        colors={["rgba(255, 255, 255, 0.05)", "rgba(255, 255, 255, 0.02)"]}
                        style={styles.exerciseItemGradient}
                      >
                        <View style={styles.exerciseItemContent}>
                          <View style={[styles.exerciseIcon, { backgroundColor: exercise.categoryColor }]}>
                            <MaterialCommunityIcons name="dumbbell" size={16} color="#FFFFFF" />
                          </View>
                          
                          <View style={styles.exerciseInfo}>
                            <Text style={styles.exerciseName}>{exercise.name}</Text>
                            {searchText && (
                              <Text style={styles.exerciseCategory}>{exercise.category}</Text>
                            )}
                          </View>
                          
                          <MaterialCommunityIcons name="plus-circle" size={24} color="#00D4AA" />
                        </View>
                      </LinearGradient>
                    </Pressable>
                  ))}
                </View>
              ) : (
                <View style={styles.noResults}>
                  <MaterialCommunityIcons name="close-circle-outline" size={48} color="#6B7280" />
                  <Text style={styles.noResultsTitle}>Sin resultados</Text>
                  <Text style={styles.noResultsText}>
                    No se encontraron ejercicios para &quot;{searchText}&quot;
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* ===== INFORMACIÓN ===== */}
          <View style={styles.infoSection}>
            <LinearGradient
              colors={["rgba(255, 184, 77, 0.1)", "rgba(255, 184, 77, 0.05)"]}
              style={styles.infoGradient}
            >
              <MaterialCommunityIcons name="information-outline" size={16} color="#FFB84D" />
              <Text style={styles.infoText}>
                💡 Tip: Puedes crear ejercicios personalizados escribiendo el nombre en la búsqueda
              </Text>
            </LinearGradient>
          </View>
        </ScrollView>
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

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  backBtn: {
    padding: 8,
    marginRight: 8,
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

  // ===== BÚSQUEDA =====
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },

  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    paddingVertical: 4,
  },

  clearBtn: {
    padding: 4,
  },

  createCustomBtn: {
    marginTop: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },

  createCustomGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 6,
  },

  createCustomText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // ===== CONTENIDO =====
  content: {
    flex: 1,
  },

  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },

  // ===== EJERCICIOS RECIENTES =====
  recentExercises: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  recentExerciseBtn: {
    borderRadius: 8,
    overflow: 'hidden',
  },

  recentExerciseGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },

  recentExerciseText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },

  // ===== CATEGORÍAS =====
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },

  categoryBtn: {
    width: '47%',
    borderRadius: 16,
    overflow: 'hidden',
  },

  categoryGradient: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 12,
    borderRadius: 16,
  },

  categoryName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 8,
    textAlign: 'center',
  },

  categoryCount: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
    textAlign: 'center',
  },

  // ===== LISTA DE EJERCICIOS =====
  exercisesList: {
    gap: 8,
  },

  exerciseItem: {
    borderRadius: 12,
    overflow: 'hidden',
  },

  exerciseItemGradient: {
    borderRadius: 12,
  },

  exerciseItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },

  exerciseIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },

  exerciseInfo: {
    flex: 1,
  },

  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },

  exerciseCategory: {
    fontSize: 12,
    color: '#B0B0C4',
    fontWeight: '500',
  },

  // ===== SIN RESULTADOS =====
  noResults: {
    alignItems: 'center',
    paddingVertical: 40,
  },

  noResultsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },

  noResultsText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },

  // ===== INFORMACIÓN =====
  infoSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },

  infoGradient: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },

  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#FFB84D',
    lineHeight: 16,
  },
});