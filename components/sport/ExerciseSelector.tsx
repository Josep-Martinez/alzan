// components/sport/ExerciseSelector.tsx - Actualizado con nuevas categorías
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

// Importar tipos de tu estructura existente
import { ManualExercise } from './sports';

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
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<ManualExercise | null>(null);

  // Categorías principales de grupos musculares ACTUALIZADAS
  const MUSCLE_CATEGORIES = [
    { 
      id: 'pectoral', 
      name: 'Pectoral', 
      icon: 'arm-flex', 
      color: '#FF6B6B',
      muscles: ['pectoral']
    },
    { 
      id: 'espalda', 
      name: 'Espalda', 
      icon: 'human-handsup', 
      color: '#4ECDC4',
      muscles: ['dorsal', 'espalda']
    },
    { 
      id: 'hombro', 
      name: 'Hombro', 
      icon: 'account-arrow-up', 
      color: '#FF9800',
      muscles: ['hombro']
    },
    { 
      id: 'pierna', 
      name: 'Pierna', 
      icon: 'run', 
      color: '#9C27B0',
      muscles: ['cuadriceps', 'isquiotibial', 'gemelo', 'soleo']
    },
    { 
      id: 'gluteo', 
      name: 'Glúteo', 
      icon: 'run-fast', 
      color: '#E91E63',
      muscles: ['gluteo']
    },
    { 
      id: 'brazo', 
      name: 'Brazo', 
      icon: 'arm-flex-outline', 
      color: '#2196F3',
      muscles: ['biceps', 'triceps', 'antebrazos']
    },
    { 
      id: 'abdominal', 
      name: 'Abdominales', 
      icon: 'human-male', 
      color: '#4CAF50',
      muscles: ['abdominal']
    },
    { 
      id: 'cuerpo_completo', 
      name: 'Cuerpo Completo', 
      icon: 'human-handsdown', 
      color: '#FFC107',
      muscles: ['cuerpo completo']
    }
  ];

  // Categorías de equipamiento ACTUALIZADAS
  const EQUIPMENT_CATEGORIES = [
    { 
      id: 'mancuernas', 
      name: 'Mancuernas', 
      icon: 'dumbbell', 
      color: '#2196F3',
      equipment: ['Mancuernas']
    },
    { 
      id: 'barras', 
      name: 'Barras', 
      icon: 'weight-lifter', 
      color: '#FF6B6B',
      equipment: ['Barra']
    },
    { 
      id: 'cables', 
      name: 'Cables', 
      icon: 'cable-data', 
      color: '#9C27B0',
      equipment: ['Cable']
    },
    { 
      id: 'maquinas', 
      name: 'Máquinas', 
      icon: 'cog', 
      color: '#607D8B',
      equipment: ['Máquina']
    },
    { 
      id: 'peso_corporal', 
      name: 'Peso Corporal', 
      icon: 'human-male', 
      color: '#4CAF50',
      equipment: ['Peso corporal']
    },
    { 
      id: 'otros', 
      name: 'Otros', 
      icon: 'dots-horizontal', 
      color: '#795548',
      equipment: ['Banda elástica', 'TRX', 'Balón medicinal', 'Battle ropes', 'Rueda abdominal', 'Kettlebell', 'Fitball', 'Bosu']
    }
  ];

  // Categorías de dificultad (sin cambios)
  const DIFFICULTY_CATEGORIES = [
    { id: 'Principiante', name: 'Principiante', icon: 'numeric-1-circle', color: '#4CAF50' },
    { id: 'Intermedio', name: 'Intermedio', icon: 'numeric-2-circle', color: '#FF9800' },
    { id: 'Avanzado', name: 'Avanzado', icon: 'numeric-3-circle', color: '#F44336' }
  ];

  /**
   * Organizar ejercicios por categoría muscular principal
   */
  const EXERCISE_DATABASE = useMemo(() => {
    const categorizedExercises: ManualExercise[] = [];

    // Procesar ejercicios del JSON
    exercisesData.ejercicios.forEach((exercise: any) => {
      const newExercise: ManualExercise = {
        id: exercise.id_ejercicio.toString(),
        name: exercise.nombre_ejercicio,
        muscleGroup: exercise.grupo_muscular_principal,
        specificMuscle: exercise.grupo_muscular_secundario,
        equipment: exercise.equipamiento,
        difficulty: exercise.dificultad,
        description: exercise.descripcion,
        maxWeight: 0 // Se cargaría de la base de datos del usuario
      };
      categorizedExercises.push(newExercise);
    });

    return categorizedExercises;
  }, []);

  /**
   * Filtra ejercicios basado en búsqueda, categoría, equipamiento y dificultad
   */
  const getFilteredExercises = useMemo(() => {
    let filteredExercises = [...EXERCISE_DATABASE];

    // Filtrar por categoría muscular
    if (selectedCategory) {
      const category = MUSCLE_CATEGORIES.find(cat => cat.id === selectedCategory);
      if (category) {
        filteredExercises = filteredExercises.filter(exercise => 
          category.muscles.includes(exercise.muscleGroup?.toLowerCase() || '')
        );
      }
    }

    // Filtrar por equipamiento
    if (selectedEquipment) {
      const equipmentCategory = EQUIPMENT_CATEGORIES.find(eq => eq.id === selectedEquipment);
      if (equipmentCategory) {
        filteredExercises = filteredExercises.filter(exercise => 
          equipmentCategory.equipment.includes(exercise.equipment || '')
        );
      }
    }

    // Filtrar por dificultad
    if (selectedDifficulty) {
      filteredExercises = filteredExercises.filter(exercise => 
        exercise.difficulty?.toLowerCase() === selectedDifficulty.toLowerCase()
      );
    }

    // Filtrar por búsqueda
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase();
      filteredExercises = filteredExercises.filter(exercise =>
        exercise.name.toLowerCase().includes(searchLower) ||
        exercise.muscleGroup?.toLowerCase().includes(searchLower) ||
        exercise.specificMuscle?.toLowerCase().includes(searchLower) ||
        exercise.equipment?.toLowerCase().includes(searchLower)
      );
    }

    return filteredExercises;
  }, [selectedCategory, selectedEquipment, selectedDifficulty, searchText, EXERCISE_DATABASE]);

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
      equipment: selectedEquipment || 'Peso corporal',
      difficulty: selectedDifficulty || 'Principiante'
    };
    
    handleSelectExercise(customExercise);
  };

  /**
   * Limpia todos los filtros
   */
  const clearAllFilters = () => {
    setSelectedCategory(null);
    setSelectedEquipment(null);
    setSelectedDifficulty(null);
    setSearchText('');
  };

  /**
   * Obtiene el color de la categoría muscular
   */
  const getMuscleGroupColor = (muscleGroup: string) => {
    const category = MUSCLE_CATEGORIES.find(cat => 
      cat.muscles.includes(muscleGroup?.toLowerCase() || '')
    );
    return category?.color || '#6B7280';
  };

  /**
   * Obtiene el ícono del equipamiento
   */
  const getEquipmentIcon = (equipment: string) => {
    const equipmentCategory = EQUIPMENT_CATEGORIES.find(eq => 
      eq.equipment.includes(equipment || '')
    );
    return equipmentCategory?.icon || 'help-circle';
  };

  /**
   * Obtiene el color de la dificultad
   */
  const getDifficultyColor = (difficulty: string) => {
    const difficultyCategory = DIFFICULTY_CATEGORIES.find(d => 
      d.id.toLowerCase() === difficulty?.toLowerCase()
    );
    return difficultyCategory?.color || '#6B7280';
  };

  /**
   * Obtiene el nombre de la categoría muscular para mostrar
   */
  const getMuscleGroupDisplayName = (muscleGroup: string) => {
    const category = MUSCLE_CATEGORIES.find(cat => 
      cat.muscles.includes(muscleGroup?.toLowerCase() || '')
    );
    return category?.name || muscleGroup;
  };

  /**
   * Obtiene el nombre de la categoría de equipamiento para mostrar
   */
  const getEquipmentDisplayName = (equipment: string) => {
    const equipmentCategory = EQUIPMENT_CATEGORIES.find(eq => 
      eq.equipment.includes(equipment || '')
    );
    return equipmentCategory?.name || equipment;
  };

  const filteredExercises = getFilteredExercises;
  const hasActiveFilters = selectedCategory || selectedEquipment || selectedDifficulty;

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
                <Text style={styles.detailLabel}>Músculo principal:</Text>
                <Text style={styles.detailValue}>{getMuscleGroupDisplayName(selectedExercise.muscleGroup || '')}</Text>
              </View>
              
              {selectedExercise.specificMuscle && (
                <View style={styles.detailRow}>
                  <MaterialCommunityIcons name="target" size={20} color="#4ECDC4" />
                  <Text style={styles.detailLabel}>Músculo secundario:</Text>
                  <Text style={styles.detailValue}>{selectedExercise.specificMuscle}</Text>
                </View>
              )}
              
              <View style={styles.detailRow}>
                <MaterialCommunityIcons 
                  name={getEquipmentIcon(selectedExercise.equipment || '') as any} 
                  size={20} 
                  color="#FFB84D" 
                />
                <Text style={styles.detailLabel}>Equipamiento:</Text>
                <Text style={styles.detailValue}>{selectedExercise.equipment}</Text>
              </View>

              <View style={styles.detailRow}>
                <MaterialCommunityIcons name="speedometer" size={20} color={getDifficultyColor(selectedExercise.difficulty || '')} />
                <Text style={styles.detailLabel}>Dificultad:</Text>
                <Text style={[styles.detailValue, { color: getDifficultyColor(selectedExercise.difficulty || '') }]}>
                  {selectedExercise.difficulty}
                </Text>
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
            {hasActiveFilters && (
              <Pressable
                onPress={clearAllFilters}
                style={styles.backBtn}
              >
                <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
              </Pressable>
            )}
            <View style={styles.headerContent}>
              <MaterialCommunityIcons name="dumbbell" size={24} color="#FF6B6B" />
              <Text style={styles.title}>
                {selectedCategory 
                  ? MUSCLE_CATEGORIES.find(cat => cat.id === selectedCategory)?.name || 'Ejercicios'
                  : selectedEquipment
                  ? EQUIPMENT_CATEGORIES.find(eq => eq.id === selectedEquipment)?.name || 'Ejercicios'
                  : selectedDifficulty
                  ? DIFFICULTY_CATEGORIES.find(d => d.id === selectedDifficulty)?.name || 'Ejercicios'
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
              placeholder="Buscar ejercicio, músculo o equipamiento..."
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

          {/* Filtros activos */}
          {hasActiveFilters && (
            <View style={styles.activeFilters}>
              {selectedCategory && (
                <View style={[styles.activeFilter, { backgroundColor: MUSCLE_CATEGORIES.find(cat => cat.id === selectedCategory)?.color + '20' }]}>
                  <Text style={[styles.activeFilterText, { color: MUSCLE_CATEGORIES.find(cat => cat.id === selectedCategory)?.color }]}>
                    {MUSCLE_CATEGORIES.find(cat => cat.id === selectedCategory)?.name}
                  </Text>
                  <Pressable onPress={() => setSelectedCategory(null)} style={styles.removeFilterBtn}>
                    <MaterialCommunityIcons name="close" size={14} color={MUSCLE_CATEGORIES.find(cat => cat.id === selectedCategory)?.color} />
                  </Pressable>
                </View>
              )}
              
              {selectedEquipment && (
                <View style={[styles.activeFilter, { backgroundColor: EQUIPMENT_CATEGORIES.find(eq => eq.id === selectedEquipment)?.color + '20' }]}>
                  <Text style={[styles.activeFilterText, { color: EQUIPMENT_CATEGORIES.find(eq => eq.id === selectedEquipment)?.color }]}>
                    {EQUIPMENT_CATEGORIES.find(eq => eq.id === selectedEquipment)?.name}
                  </Text>
                  <Pressable onPress={() => setSelectedEquipment(null)} style={styles.removeFilterBtn}>
                    <MaterialCommunityIcons name="close" size={14} color={EQUIPMENT_CATEGORIES.find(eq => eq.id === selectedEquipment)?.color} />
                  </Pressable>
                </View>
              )}

              {selectedDifficulty && (
                <View style={[styles.activeFilter, { backgroundColor: getDifficultyColor(selectedDifficulty) + '20' }]}>
                  <Text style={[styles.activeFilterText, { color: getDifficultyColor(selectedDifficulty) }]}>
                    {DIFFICULTY_CATEGORIES.find(d => d.id === selectedDifficulty)?.name}
                  </Text>
                  <Pressable onPress={() => setSelectedDifficulty(null)} style={styles.removeFilterBtn}>
                    <MaterialCommunityIcons name="close" size={14} color={getDifficultyColor(selectedDifficulty)} />
                  </Pressable>
                </View>
              )}
            </View>
          )}

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
          {/* ===== CATEGORÍAS DE MÚSCULOS ===== */}
          {!hasActiveFilters && !searchText && (
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
                    </LinearGradient>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* ===== FILTROS DE EQUIPAMIENTO ===== */}
          {!hasActiveFilters && !searchText && (
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

          {/* ===== FILTROS DE DIFICULTAD ===== */}
          {!hasActiveFilters && !searchText && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Filtrar por Dificultad</Text>
              <View style={styles.difficultyGrid}>
                {DIFFICULTY_CATEGORIES.map((difficulty) => {
                  const exerciseCount = EXERCISE_DATABASE.filter(ex => 
                    ex.difficulty?.toLowerCase() === difficulty.id.toLowerCase()
                  ).length;
                  
                  return (
                    <Pressable
                      key={difficulty.id}
                      onPress={() => setSelectedDifficulty(difficulty.id)}
                      style={styles.difficultyBtn}
                    >
                      <LinearGradient
                        colors={[difficulty.color + '20', difficulty.color + '10']}
                        style={styles.difficultyGradient}
                      >
                        <MaterialCommunityIcons
                          name={difficulty.icon as any}
                          size={32}
                          color={difficulty.color}
                        />
                        <Text style={styles.difficultyName}>{difficulty.name}</Text>
                        <Text style={styles.difficultyCount}>
                          {exerciseCount} ejercicios
                        </Text>
                      </LinearGradient>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {/* ===== LISTA DE EJERCICIOS ===== */}
          {(hasActiveFilters || searchText) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {searchText 
                  ? `Resultados para "${searchText}" (${filteredExercises.length})`
                  : `Ejercicios filtrados (${filteredExercises.length})`
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
                            backgroundColor: getMuscleGroupColor(exercise.muscleGroup || '') 
                          }]}>
                            <MaterialCommunityIcons name="dumbbell" size={16} color="#FFFFFF" />
                          </View>
                          
                          <View style={styles.exerciseInfo}>
                            <Text style={styles.exerciseName}>{exercise.name}</Text>
                            <View style={styles.exerciseMetadata}>
                              <Text style={[styles.primaryMuscle, { 
                                backgroundColor: getMuscleGroupColor(exercise.muscleGroup || '') + '20',
                                color: getMuscleGroupColor(exercise.muscleGroup || '')
                              }]}>
                                {getMuscleGroupDisplayName(exercise.muscleGroup || '')}
                              </Text>
                              
                              {exercise.specificMuscle && (
                                <Text style={[styles.secondaryMuscle, { 
                                  backgroundColor: '#4ECDC4' + '20',
                                  color: '#4ECDC4'
                                }]}>
                                  {exercise.specificMuscle}
                                </Text>
                              )}
                              
                              <View style={styles.exerciseEquipment}>
                                <MaterialCommunityIcons 
                                  name={getEquipmentIcon(exercise.equipment || '') as any}
                                  size={12} 
                                  color="#FFB84D" 
                                />
                                <Text style={styles.exerciseEquipmentText}>
                                  {exercise.equipment}
                                </Text>
                              </View>
                              
                              <View style={styles.exerciseDifficulty}>
                                <MaterialCommunityIcons 
                                  name="speedometer"
                                  size={12} 
                                  color={getDifficultyColor(exercise.difficulty || '')} 
                                />
                                <Text style={[styles.exerciseDifficultyText, { 
                                  color: getDifficultyColor(exercise.difficulty || '')
                                }]}>
                                  {exercise.difficulty}
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
                    No se encontraron ejercicios con los filtros actuales
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
                Filtra por grupo muscular, equipamiento o dificultad para encontrar ejercicios específicos. 
                Toca el ícono de información para ver detalles de cada uno de los más de 450 ejercicios.
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
    maxHeight: '80%',
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
    minWidth: 140,
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

  // ===== FILTROS ACTIVOS =====
  activeFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },

  activeFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },

  activeFilterText: {
    fontSize: 12,
    fontWeight: '600',
  },

  removeFilterBtn: {
    padding: 2,
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

  equipmentCount: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
    textAlign: 'center',
  },

  // ===== DIFICULTAD =====
  difficultyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },

  difficultyBtn: {
    width: '31%',
    borderRadius: 16,
    overflow: 'hidden',
  },

  difficultyGradient: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 12,
    borderRadius: 16,
  },

  difficultyName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 8,
    textAlign: 'center',
  },

  difficultyCount: {
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },

  primaryMuscle: {
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },

  secondaryMuscle: {
    fontSize: 10,
    fontWeight: '500',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
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

  exerciseDifficulty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  exerciseDifficultyText: {
    fontSize: 11,
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