// components/sport/ExerciseSelector.tsx - Selector de ejercicios de gimnasio mejorado
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
 * Interfaz para ejercicio manual con datos adicionales
 * DATOS BD: Estructura para tabla exercises
 */
interface ManualExercise {
  id: string; // BD: exercise_id (PRIMARY KEY)
  name: string; // BD: exercise_name
  muscleGroup?: string; // BD: muscle_group
  equipment?: string; // BD: equipment_needed
  maxWeight?: number; // BD: personal_max_weight (registro personal del usuario)
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
 * Base de datos de ejercicios organizada por grupo muscular y equipamiento
 * DATOS BD: Datos predefinidos en tabla exercises con relaciones a equipment_types
 */
const EXERCISE_DATABASE = {
  pecho: {
    name: 'Pecho',
    icon: 'arm-flex',
    color: '#FF6B6B',
    exercises: [
      { id: 'press_banca', name: 'Press de Banca', equipment: 'barra', maxWeight: 80 },
      { id: 'press_inclinado', name: 'Press Inclinado', equipment: 'barra', maxWeight: 70 },
      { id: 'press_declinado', name: 'Press Declinado', equipment: 'barra', maxWeight: 75 },
      { id: 'aperturas_mancuernas', name: 'Aperturas con Mancuernas', equipment: 'mancuernas', maxWeight: 25 },
      { id: 'aperturas_cables', name: 'Aperturas en Cables', equipment: 'cables', maxWeight: 40 },
      { id: 'fondos_paralelas', name: 'Fondos en Paralelas', equipment: 'peso_corporal', maxWeight: 0 },
      { id: 'flexiones', name: 'Flexiones', equipment: 'peso_corporal', maxWeight: 0 },
      { id: 'press_mancuernas', name: 'Press con Mancuernas', equipment: 'mancuernas', maxWeight: 35 }
    ]
  },
  espalda: {
    name: 'Espalda',
    icon: 'human-handsup',
    color: '#4ECDC4',
    exercises: [
      { id: 'dominadas', name: 'Dominadas', equipment: 'peso_corporal', maxWeight: 0 },
      { id: 'remo_barra', name: 'Remo con Barra', equipment: 'barra', maxWeight: 90 },
      { id: 'remo_mancuerna', name: 'Remo con Mancuerna', equipment: 'mancuernas', maxWeight: 40 },
      { id: 'jalones_lat', name: 'Jalones en Polea Alta', equipment: 'cables', maxWeight: 70 },
      { id: 'remo_cable', name: 'Remo en Cable Sentado', equipment: 'cables', maxWeight: 80 },
      { id: 'peso_muerto', name: 'Peso Muerto', equipment: 'barra', maxWeight: 120 },
      { id: 'hiperextensiones', name: 'Hiperextensiones', equipment: 'maquina', maxWeight: 20 },
      { id: 'pullover', name: 'Pullover', equipment: 'mancuernas', maxWeight: 30 }
    ]
  },
  piernas: {
    name: 'Piernas',
    icon: 'run',
    color: '#45B7D1',
    exercises: [
      { id: 'sentadillas', name: 'Sentadillas', equipment: 'barra', maxWeight: 100 },
      { id: 'prensa', name: 'Prensa de Piernas', equipment: 'maquina', maxWeight: 200 },
      { id: 'zancadas', name: 'Zancadas', equipment: 'mancuernas', maxWeight: 20 },
      { id: 'peso_muerto_rumano', name: 'Peso Muerto Rumano', equipment: 'barra', maxWeight: 80 },
      { id: 'curl_femoral', name: 'Curl Femoral', equipment: 'maquina', maxWeight: 60 },
      { id: 'extension_cuadriceps', name: 'Extensión de Cuádriceps', equipment: 'maquina', maxWeight: 80 },
      { id: 'elevacion_gemelos', name: 'Elevación de Gemelos', equipment: 'maquina', maxWeight: 150 },
      { id: 'sentadilla_bulgara', name: 'Sentadilla Búlgara', equipment: 'mancuernas', maxWeight: 15 }
    ]
  },
  hombros: {
    name: 'Hombros',
    icon: 'account-arrow-up',
    color: '#FF9800',
    exercises: [
      { id: 'press_militar', name: 'Press Militar', equipment: 'barra', maxWeight: 50 },
      { id: 'press_mancuernas_hombro', name: 'Press con Mancuernas', equipment: 'mancuernas', maxWeight: 25 },
      { id: 'elevaciones_laterales', name: 'Elevaciones Laterales', equipment: 'mancuernas', maxWeight: 12 },
      { id: 'elevaciones_frontales', name: 'Elevaciones Frontales', equipment: 'mancuernas', maxWeight: 15 },
      { id: 'pajaros', name: 'Pájaros (Deltoides Posterior)', equipment: 'mancuernas', maxWeight: 10 },
      { id: 'press_arnold', name: 'Press Arnold', equipment: 'mancuernas', maxWeight: 20 },
      { id: 'remo_al_menton', name: 'Remo al Mentón', equipment: 'barra', maxWeight: 30 },
      { id: 'encogimientos', name: 'Encogimientos de Hombros', equipment: 'mancuernas', maxWeight: 40 }
    ]
  },
  brazos: {
    name: 'Brazos',
    icon: 'arm-flex-outline',
    color: '#9C27B0',
    exercises: [
      { id: 'curl_biceps_barra', name: 'Curl de Bíceps con Barra', equipment: 'barra', maxWeight: 40 },
      { id: 'curl_biceps_mancuernas', name: 'Curl de Bíceps con Mancuernas', equipment: 'mancuernas', maxWeight: 20 },
      { id: 'curl_martillo', name: 'Curl Martillo', equipment: 'mancuernas', maxWeight: 18 },
      { id: 'press_frances', name: 'Press Francés', equipment: 'barra', maxWeight: 25 },
      { id: 'extensiones_triceps', name: 'Extensiones de Tríceps', equipment: 'cables', maxWeight: 30 },
      { id: 'fondos_banco', name: 'Fondos en Banco', equipment: 'peso_corporal', maxWeight: 0 },
      { id: 'curl_predicador', name: 'Curl en Predicador', equipment: 'maquina', maxWeight: 35 },
      { id: 'patadas_triceps', name: 'Patadas de Tríceps', equipment: 'mancuernas', maxWeight: 12 }
    ]
  },
  core: {
    name: 'Core',
    icon: 'human-male',
    color: '#4CAF50',
    exercises: [
      { id: 'abdominales_crunch', name: 'Abdominales Crunch', equipment: 'peso_corporal', maxWeight: 0 },
      { id: 'plancha', name: 'Plancha', equipment: 'peso_corporal', maxWeight: 0 },
      { id: 'abdominales_bicicleta', name: 'Abdominales Bicicleta', equipment: 'peso_corporal', maxWeight: 0 },
      { id: 'elevacion_piernas', name: 'Elevación de Piernas', equipment: 'peso_corporal', maxWeight: 0 },
      { id: 'mountain_climbers', name: 'Mountain Climbers', equipment: 'peso_corporal', maxWeight: 0 },
      { id: 'russian_twist', name: 'Russian Twist', equipment: 'mancuernas', maxWeight: 10 },
      { id: 'plancha_lateral', name: 'Plancha Lateral', equipment: 'peso_corporal', maxWeight: 0 },
      { id: 'dead_bug', name: 'Dead Bug', equipment: 'peso_corporal', maxWeight: 0 }
    ]
  },
  cardio: {
    name: 'Cardio',
    icon: 'heart-pulse',
    color: '#E91E63',
    exercises: [
      { id: 'cinta_correr', name: 'Cinta de Correr', equipment: 'maquina', maxWeight: 0 },
      { id: 'bicicleta_estatica', name: 'Bicicleta Estática', equipment: 'maquina', maxWeight: 0 },
      { id: 'eliptica', name: 'Elíptica', equipment: 'maquina', maxWeight: 0 },
      { id: 'remo_cardio', name: 'Remo Cardio', equipment: 'maquina', maxWeight: 0 },
      { id: 'burpees', name: 'Burpees', equipment: 'peso_corporal', maxWeight: 0 },
      { id: 'jumping_jacks', name: 'Jumping Jacks', equipment: 'peso_corporal', maxWeight: 0 },
      { id: 'escalador', name: 'Escalador', equipment: 'peso_corporal', maxWeight: 0 },
      { id: 'battle_ropes', name: 'Battle Ropes', equipment: 'funcional', maxWeight: 0 }
    ]
  }
};

/**
 * Tipos de equipamiento disponibles
 * DATOS BD: Tabla equipment_types
 */
const EQUIPMENT_TYPES = [
  { id: 'barra', name: 'Barra', icon: 'dumbbell', color: '#FF6B6B' },
  { id: 'mancuernas', name: 'Mancuernas', icon: 'dumbbell', color: '#4ECDC4' },
  { id: 'maquina', name: 'Máquina', icon: 'cog', color: '#45B7D1' },
  { id: 'cables', name: 'Cables/Poleas', icon: 'cable-data', color: '#FF9800' },
  { id: 'peso_corporal', name: 'Peso Corporal', icon: 'human-male', color: '#4CAF50' },
  { id: 'funcional', name: 'Funcional', icon: 'format-list-bulleted', color: '#9C27B0' }
];

/**
 * Componente selector de ejercicios mejorado
 * Permite buscar, filtrar por grupo muscular y equipamiento
 * Muestra máximo peso personal para cada ejercicio
 * 
 * DATOS BD: Lee de tabla exercises y personal_records del usuario
 */
export default function ExerciseSelector({
  visible,
  onClose,
  onSelectExercise
}: ExerciseSelectorProps) {
  // ===== ESTADOS =====
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<string | null>(null);

  /**
   * Filtra ejercicios basado en búsqueda, categoría y equipamiento
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

    // Filtrar por equipamiento
    if (selectedEquipment) {
      allExercises = allExercises.filter(exercise => exercise.equipment === selectedEquipment);
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
      name: searchText.trim(),
      equipment: selectedEquipment || 'peso_corporal'
    };
    
    handleSelectExercise(customExercise);
  };

  /**
   * Formatea el máximo peso para mostrar
   */
  const formatMaxWeight = (weight: number, equipment: string) => {
    if (equipment === 'peso_corporal') return 'Peso corporal';
    if (weight === 0) return 'Sin peso';
    return `RP: ${weight}kg`; // RP = Record Personal
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
            {(selectedCategory || selectedEquipment) && (
              <Pressable
                onPress={() => {
                  setSelectedCategory(null);
                  setSelectedEquipment(null);
                }}
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
                  : selectedEquipment
                  ? EQUIPMENT_TYPES.find(eq => eq.id === selectedEquipment)?.name
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
          {/* ===== FILTROS DE EQUIPAMIENTO ===== */}
          {!selectedCategory && !selectedEquipment && !searchText && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Filtrar por Equipamiento</Text>
              <View style={styles.equipmentGrid}>
                {EQUIPMENT_TYPES.map((equipment) => (
                  <Pressable
                    key={equipment.id}
                    onPress={() => setSelectedEquipment(equipment.id)}
                    style={styles.equipmentBtn}
                  >
                    <LinearGradient
                      colors={[equipment.color + '20', equipment.color + '10']}
                      style={styles.equipmentGradient}
                    >
                      <MaterialCommunityIcons
                        name={equipment.icon as any}
                        size={24}
                        color={equipment.color}
                      />
                      <Text style={styles.equipmentName}>{equipment.name}</Text>
                    </LinearGradient>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* ===== CATEGORÍAS DE EJERCICIOS ===== */}
          {!selectedCategory && !selectedEquipment && !searchText && (
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
          {(selectedCategory || selectedEquipment || searchText) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {searchText 
                  ? `Resultados (${filteredExercises.length})`
                  : selectedEquipment
                  ? `Ejercicios con ${EQUIPMENT_TYPES.find(eq => eq.id === selectedEquipment)?.name}`
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
                            <View style={styles.exerciseMetadata}>
                              {(searchText || selectedEquipment) && (
                                <Text style={styles.exerciseCategory}>{exercise.category}</Text>
                              )}
                              <View style={styles.exerciseEquipment}>
                                <MaterialCommunityIcons 
                                  name={EQUIPMENT_TYPES.find(eq => eq.id === exercise.equipment)?.icon as any || 'help'}
                                  size={12} 
                                  color="#FFB84D" 
                                />
                                <Text style={styles.exerciseEquipmentText}>
                                  {EQUIPMENT_TYPES.find(eq => eq.id === exercise.equipment)?.name || 'Desconocido'}
                                </Text>
                              </View>
                              {/* DATOS BD: Mostrar récord personal del usuario */}
                              {exercise.maxWeight !== undefined && (
                                <Text style={styles.exerciseMaxWeight}>
                                  {formatMaxWeight(exercise.maxWeight, exercise.equipment || 'peso_corporal')}
                                </Text>
                              )}
                            </View>
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
                    {selectedEquipment && ` con ${EQUIPMENT_TYPES.find(eq => eq.id === selectedEquipment)?.name}`}
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
                💡 Filtra por equipamiento o grupo muscular para encontrar ejercicios específicos. Los récords personales (RP) te ayudan a planificar tu progresión.
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

  // ===== EQUIPAMIENTO =====
  equipmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  equipmentBtn: {
    width: '31%',
    borderRadius: 12,
    overflow: 'hidden',
  },

  equipmentGradient: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 12,
  },

  equipmentName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 8,
    textAlign: 'center',
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
    marginBottom: 4,
  },

  exerciseMetadata: {
    gap: 2,
  },

  exerciseCategory: {
    fontSize: 12,
    color: '#B0B0C4',
    fontWeight: '500',
  },

  exerciseEquipment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  exerciseEquipmentText: {
    fontSize: 11,
    color: '#FFB84D',
    fontWeight: '500',
  },

  // DATOS BD: Estilo para mostrar máximo peso personal
  exerciseMaxWeight: {
    fontSize: 11,
    color: '#00D4AA',
    fontWeight: '600',
    backgroundColor: 'rgba(0, 212, 170, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
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