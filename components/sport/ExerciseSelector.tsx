// components/sport/ExerciseSelector.tsx
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';

// Importar la base de datos desde el JSON
import exercisesData from '../../assets/data/BDD_Gym.json';

/**
 * Interfaz para ejercicio manual con datos adicionales
 */
interface ManualExercise {
  id: string;
  name: string;
  muscleGroup?: string;
  specificMuscle?: string;
  equipment?: string;
  maxWeight?: number;
  description?: string;
  recordType?: string;
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
 * Componente selector de ejercicios mejorado
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
  const [selectedExercise, setSelectedExercise] = useState<ManualExercise | null>(null);

  // Categorías principales de grupos musculares
  const MUSCLE_CATEGORIES = [
    { id: 'Pectorales', name: 'Pectorales', icon: 'arm-flex', color: '#FF6B6B' },
    { id: 'Espalda', name: 'Espalda', icon: 'human-handsup', color: '#4ECDC4' },
    { id: 'Piernas', name: 'Piernas', icon: 'run', color: '#45B7D1' },
    { id: 'Hombros', name: 'Hombros', icon: 'account-arrow-up', color: '#FF9800' },
    { id: 'Brazo', name: 'Brazo', icon: 'arm-flex-outline', color: '#9C27B0' },
    { id: 'Core', name: 'Core', icon: 'human-male', color: '#4CAF50' },
    { id: 'Cardio', name: 'Cardio', icon: 'heart-pulse', color: '#E91E63' },
    { id: 'Cuerpo Completo', name: 'Cuerpo Completo', icon: 'human-handsdown', color: '#9C27B0' }
  ];

  // Categorías de equipamiento
  const EQUIPMENT_CATEGORIES = [
    { id: 'Barras', name: 'Barras', icon: 'dumbbell', color: '#FF6B6B' },
    { id: 'Mancuernas', name: 'Mancuernas', icon: 'dumbbell', color: '#4ECDC4' },
    { id: 'Máquina', name: 'Máquina', icon: 'cog', color: '#45B7D1' },
    { id: 'Kettlebells', name: 'Kettlebells', icon: 'kettlebell', color: '#9C27B0' },
    { id: 'Peso corporal', name: 'Peso corporal', icon: 'human-male', color: '#4CAF50' },
    { id: 'Otros', name: 'Otros', icon: 'toolbox', color: '#9C27B0' }
  ];

  // Mapeo de músculos específicos a categorías
  const MUSCLE_TO_CATEGORY_MAP: Record<string, string> = {
    'Pectorales': 'Pectorales',
    'Dorsales': 'Espalda',
    'Hombros': 'Hombros',
    'Bíceps': 'Brazo',
    'Tríceps': 'Brazo',
    'Antebrazos': 'Brazo',
    'Cuádriceps': 'Piernas',
    'Isquiotibiales': 'Piernas',
    'Glúteos': 'Piernas',
    'Gemelos': 'Piernas',
    'Soleos': 'Piernas',
    'Abdominales': 'Core',
    'Core': 'Core',
    'Cuerpo Completo': 'Cuerpo Completo'
  };

  /**
   * Organizar ejercicios por categoría muscular principal
   */
  const EXERCISE_DATABASE = useMemo(() => {
    const categories: Record<string, {
      name: string;
      icon: string;
      color: string;
      exercises: ManualExercise[];
    }> = {};

    // Inicializar categorías
    MUSCLE_CATEGORIES.forEach(cat => {
      categories[cat.id] = {
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        exercises: []
      };
    });

    // Procesar ejercicios del JSON
    exercisesData.forEach((exercise: any) => {
      const specificMuscle = exercise['Grupo Muscular'];
      const category = MUSCLE_TO_CATEGORY_MAP[specificMuscle] || 'Otros';
      const equipment = exercise.Equipamiento;
      const description = exercise['Descripción'];
      const recordType = exercise['Record'];
      
      if (categories[category]) {
        categories[category].exercises.push({
          id: exercise.Ejercicio,
          name: exercise.Ejercicio,
          muscleGroup: category,
          specificMuscle,
          equipment,
          description,
          recordType,
          maxWeight: 0 // Se cargaría de la base de datos del usuario
        });
      }
    });

    return categories;
  }, []);

  /**
   * Obtener tipos de equipamiento automáticamente desde los datos
   */
  const EQUIPMENT_TYPES = useMemo(() => {
    const equipmentSet = new Set<string>();
    
    // Recoger todos los equipamientos únicos
    Object.values(EXERCISE_DATABASE).forEach(category => {
      category.exercises.forEach(exercise => {
        if (exercise.equipment) {
          equipmentSet.add(exercise.equipment);
        }
      });
    });
    
    return Array.from(equipmentSet).map(eq => {
      // Buscar si coincide con alguna categoría principal
      const mainCategory = EQUIPMENT_CATEGORIES.find(cat => 
        cat.name.toLowerCase() === eq.toLowerCase()
      );
      
      return mainCategory ? mainCategory : EQUIPMENT_CATEGORIES.find(cat => cat.id === 'Otros')!;
    })
    // Filtrar duplicados
    .filter((eq, index, self) => 
      index === self.findIndex(t => t.id === eq.id)
    );
  }, [EXERCISE_DATABASE]);

  /**
   * Filtra ejercicios basado en búsqueda, categoría y equipamiento
   */
  const getFilteredExercises = useMemo(() => {
    let allExercises: ManualExercise[] = [];
    
    // Si hay una categoría seleccionada, solo mostrar esos ejercicios
    if (selectedCategory) {
      const categoryData = EXERCISE_DATABASE[selectedCategory];
      if (categoryData) {
        allExercises = [...categoryData.exercises];
      }
    } else {
      // Mostrar todos los ejercicios
      Object.values(EXERCISE_DATABASE).forEach(categoryData => {
        allExercises.push(...categoryData.exercises);
      });
    }

    // Filtrar por equipamiento
    if (selectedEquipment) {
      allExercises = allExercises.filter(exercise => {
        const equipmentCategory = EQUIPMENT_TYPES.find(eq => 
          eq.name.toLowerCase() === exercise.equipment?.toLowerCase()
        )?.id || 'Otros';
        
        return equipmentCategory === selectedEquipment;
      });
    }

    // Filtrar por búsqueda
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase();
      allExercises = allExercises.filter(exercise =>
        exercise.name.toLowerCase().includes(searchLower) ||
        exercise.specificMuscle?.toLowerCase().includes(searchLower)
      );
    }

    return allExercises;
  }, [selectedCategory, selectedEquipment, searchText, EXERCISE_DATABASE]);

  /**
   * Maneja la selección de un ejercicio
   */
  const handleSelectExercise = (exercise: ManualExercise) => {
    onSelectExercise(exercise);
    onClose();
  };

  /**
   * Muestra los detalles de un ejercicio
   */
  const showExerciseDetails = (exercise: ManualExercise) => {
    setSelectedExercise(exercise);
  };

  /**
   * Cierra el modal de detalles
   */
  const closeExerciseDetails = () => {
    setSelectedExercise(null);
  };

  /**
   * Crea ejercicio personalizado a partir de la búsqueda
   */
  const createCustomExercise = () => {
    if (!searchText.trim()) return;
    
    const customExercise: ManualExercise = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: searchText.trim(),
      equipment: selectedEquipment || 'Peso corporal'
    };
    
    handleSelectExercise(customExercise);
  };

  /**
   * Formatea el récord para mostrar
   */
  const formatRecord = (exercise: ManualExercise) => {
    if (!exercise.recordType) return 'Sin récord';
    
    switch (exercise.recordType) {
      case 'Peso':
        return `Récord: ${exercise.maxWeight || 0}kg`;
      case 'Repeticiones':
        return `Récord: ${exercise.maxWeight || 0} repeticiones`;
      case 'Tiempo':
        return `Récord: ${exercise.maxWeight || 0} minutos`;
      case 'Distancia':
        return `Récord: ${exercise.maxWeight || 0} metros`;
      default:
        return 'Sin récord';
    }
  };

  const categories = Object.entries(EXERCISE_DATABASE);
  const filteredExercises = getFilteredExercises;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      {/* Modal de detalles del ejercicio */}
      {selectedExercise && (
        <View style={styles.detailsModal}>
          <LinearGradient
            colors={['#1A1A3A', '#2D2D5F']}
            style={styles.detailsContainer}
          >
            <Pressable onPress={closeExerciseDetails} style={styles.closeDetailsBtn}>
              <MaterialCommunityIcons name="close" size={24} color="#FFFFFF" />
            </Pressable>
            
            <Text style={styles.detailsTitle}>{selectedExercise.name}</Text>
            
            <View style={styles.detailsSection}>
              <View style={styles.detailRow}>
                <MaterialCommunityIcons name="arm-flex" size={20} color="#FF6B6B" />
                <Text style={styles.detailLabel}>Músculo:</Text>
                <Text style={styles.detailValue}>{selectedExercise.specificMuscle}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <MaterialCommunityIcons name="dumbbell" size={20} color="#4ECDC4" />
                <Text style={styles.detailLabel}>Equipamiento:</Text>
                <Text style={styles.detailValue}>{selectedExercise.equipment}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <MaterialCommunityIcons name="trophy" size={20} color="#FFD700" />
                <Text style={styles.detailLabel}>Tu récord:</Text>
                <Text style={styles.detailValue}>{formatRecord(selectedExercise)}</Text>
              </View>
            </View>
            
            <View style={styles.descriptionSection}>
              <Text style={styles.descriptionTitle}>Descripción</Text>
              <Text style={styles.descriptionText}>
                {selectedExercise.description || 'No hay descripción disponible para este ejercicio.'}
              </Text>
            </View>
            
            <Pressable 
              onPress={() => handleSelectExercise(selectedExercise)}
              style={styles.selectExerciseBtn}
            >
              <LinearGradient
                colors={["#00D4AA", "#00B894"]}
                style={styles.selectExerciseGradient}
              >
                <MaterialCommunityIcons name="plus" size={20} color="#FFFFFF" />
                <Text style={styles.selectExerciseText}>Seleccionar ejercicio</Text>
              </LinearGradient>
            </Pressable>
          </LinearGradient>
        </View>
      )}

      {/* Selector principal de ejercicios */}
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
                  ? EXERCISE_DATABASE[selectedCategory]?.name || 'Ejercicios'
                  : selectedEquipment
                  ? EQUIPMENT_CATEGORIES.find(eq => eq.id === selectedEquipment)?.name
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
              placeholder="Buscar ejercicio o músculo..."
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
          {/* ===== CATEGORÍAS DE EJERCICIOS ===== */}
          {!selectedCategory && !selectedEquipment && !searchText && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Grupos Musculares</Text>
              <View style={styles.categoriesGrid}>
                {MUSCLE_CATEGORIES.map((category) => (
                  <Pressable
                    key={category.id}
                    onPress={() => setSelectedCategory(category.id)}
                    style={styles.categoryBtn}
                  >
                    <LinearGradient
                      colors={[category.color + '20', category.color + '10']}
                      style={styles.categoryGradient}
                    >
                      <MaterialCommunityIcons
                        name={category.icon as any}
                        size={28}
                        color={category.color}
                      />
                      <Text style={styles.categoryName}>{category.name}</Text>
                      <Text style={styles.categoryCount}>
                        {EXERCISE_DATABASE[category.id]?.exercises.length || 0} ejercicios
                      </Text>
                    </LinearGradient>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* ===== FILTROS DE EQUIPAMIENTO ===== */}
          {!selectedCategory && !selectedEquipment && !searchText && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Filtrar por Equipamiento</Text>
              <View style={styles.equipmentGrid}>
                {EQUIPMENT_CATEGORIES.map((equipment) => (
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

          {/* ===== LISTA DE EJERCICIOS ===== */}
          {(selectedCategory || selectedEquipment || searchText) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {searchText 
                  ? `Resultados (${filteredExercises.length})`
                  : selectedEquipment
                  ? `Ejercicios con ${EQUIPMENT_CATEGORIES.find(eq => eq.id === selectedEquipment)?.name}`
                  : `Ejercicios de ${EXERCISE_DATABASE[selectedCategory as keyof typeof EXERCISE_DATABASE]?.name}`
                }
              </Text>
              
              {filteredExercises.length > 0 ? (
                <View style={styles.exercisesList}>
                  {filteredExercises.map((exercise) => (
                    <Pressable
                      key={exercise.id}
                      style={styles.exerciseItem}
                    >
                      <LinearGradient
                        colors={["rgba(255, 255, 255, 0.05)", "rgba(255, 255, 255, 0.02)"]}
                        style={styles.exerciseItemGradient}
                      >
                        <View style={styles.exerciseItemContent}>
                          <View style={[styles.exerciseIcon, { 
                            backgroundColor: MUSCLE_CATEGORIES.find(c => c.id === exercise.muscleGroup)?.color || '#6B7280' 
                          }]}>
                            <MaterialCommunityIcons name="dumbbell" size={16} color="#FFFFFF" />
                          </View>
                          
                          <View style={styles.exerciseInfo}>
                            <Text style={styles.exerciseName}>{exercise.name}</Text>
                            <View style={styles.exerciseMetadata}>
                              <Text style={styles.specificMuscle}>
                                {exercise.specificMuscle}
                              </Text>
                              <View style={styles.exerciseEquipment}>
                                <MaterialCommunityIcons 
                                  name={EQUIPMENT_CATEGORIES.find(eq => 
                                    eq.id === (EQUIPMENT_TYPES.find(e => e.name === exercise.equipment)?.id || 'Otros')
                                  )?.icon as any || 'help'}
                                  size={12} 
                                  color="#FFB84D" 
                                />
                                <Text style={styles.exerciseEquipmentText}>
                                  {exercise.equipment}
                                </Text>
                              </View>
                            </View>
                          </View>
                          
                          <View style={styles.exerciseActions}>
                            <Pressable 
                              onPress={() => showExerciseDetails(exercise)}
                              style={styles.infoButton}
                            >
                              <MaterialCommunityIcons 
                                name="information-outline" 
                                size={24} 
                                color="#B0B0C4" 
                              />
                            </Pressable>
                            <Pressable onPress={() => handleSelectExercise(exercise)}>
                              <MaterialCommunityIcons name="plus-circle" size={24} color="#00D4AA" />
                            </Pressable>
                          </View>
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
                    {selectedEquipment && ` con ${EQUIPMENT_CATEGORIES.find(eq => eq.id === selectedEquipment)?.name}`}
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
                💡 Filtra por equipamiento o grupo muscular para encontrar ejercicios específicos. 
                Toca el ícono de información para ver detalles de cada ejercicio.
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

  // ===== MODAL DE DETALLES =====
  detailsModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  detailsContainer: {
    width: '90%',
    borderRadius: 20,
    padding: 20,
    paddingTop: 40,
  },

  closeDetailsBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 8,
  },

  detailsTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
  },

  detailsSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },

  detailLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFB84D',
    minWidth: 120,
  },

  detailValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    flex: 1,
  },

  descriptionSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },

  descriptionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 10,
  },

  descriptionText: {
    fontSize: 16,
    color: '#E0E0E0',
    lineHeight: 24,
  },

  selectExerciseBtn: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 10,
  },

  selectExerciseGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 10,
  },

  selectExerciseText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
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
    gap: 4,
  },

  specificMuscle: {
    fontSize: 13,
    color: '#B0B0C4',
    fontWeight: '500',
    backgroundColor: 'rgba(176, 176, 196, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },

  exerciseEquipment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  exerciseEquipmentText: {
    fontSize: 12,
    color: '#FFB84D',
    fontWeight: '500',
  },

  // Acciones para cada ejercicio
  exerciseActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },

  infoButton: {
    padding: 4
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