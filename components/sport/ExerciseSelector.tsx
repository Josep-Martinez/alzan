// components/sport/ExerciseSelector.tsx
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import exercisesData from '../../assets/data/ejercicios_esp.json';

// ---- Tipos ---- //
export interface ManualExercise {
  id: string;
  name: string;
  description?: string;
}

interface ExerciseSelectorProps {
  visible: boolean;
  onSelectExercise: (exercise: ManualExercise) => void;
  onClose: () => void;
}

/**
 * Modal selector de ejercicios con diseño minimalista
 * - Búsqueda inteligente por nombre
 * - Filtros por grupo muscular, equipamiento y nivel
 * - Vista de descripción expandible
 * - Estética moderna y limpia
 */
export default function ExerciseSelector({
  visible,
  onSelectExercise,
  onClose,
}: ExerciseSelectorProps) {
  const [search, setSearch] = useState('');
  const [muscleFilter, setMuscleFilter] = useState<string | null>(null);
  const [equipmentFilter, setEquipmentFilter] = useState<string | null>(null);
  const [levelFilter, setLevelFilter] = useState<string | null>(null);
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);

  // Pre-calcular listas únicas para los filtros
  const muscles = useMemo(
    () => Array.from(new Set(exercisesData.map((e) => e['Grupo Muscular']))).sort(),
    []
  );

  const equipments = useMemo(
    () => Array.from(new Set(exercisesData.map((e) => e['Equipamiento']))).sort(),
    []
  );

  const levels = useMemo(
    () => Array.from(new Set(exercisesData.map((e) => e['Nivel']))).sort(),
    []
  );

  // Filtrar ejercicios según criterios
  const filtered = useMemo(() => {
    return exercisesData.filter((ex) => {
      const matchSearch =
        search.trim().length === 0 ||
        ex['Ejercicio'].toLowerCase().includes(search.trim().toLowerCase());
      const matchMuscle = !muscleFilter || ex['Grupo Muscular'] === muscleFilter;
      const matchEquip = !equipmentFilter || ex['Equipamiento'] === equipmentFilter;
      const matchLevel = !levelFilter || ex['Nivel'] === levelFilter;

      return matchSearch && matchMuscle && matchEquip && matchLevel;
    });
  }, [search, muscleFilter, equipmentFilter, levelFilter]);

  // Manejar selección
  const handleSelect = (exercise: any) => {
    onSelectExercise({
      id: `db_${exercise['Ejercicio'].replace(/\s+/g, '_').toLowerCase()}`,
      name: exercise['Ejercicio'],
      description: exercise['Descripción'] || '',
    });
    resetAndClose();
  };

  const resetAndClose = () => {
    setSearch('');
    setMuscleFilter(null);
    setEquipmentFilter(null);
    setLevelFilter(null);
    setExpandedExercise(null);
    onClose();
  };

  const clearAllFilters = () => {
    setMuscleFilter(null);
    setEquipmentFilter(null);
    setLevelFilter(null);
  };

  const hasActiveFilters = muscleFilter || equipmentFilter || levelFilter;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={resetAndClose}
    >
      <LinearGradient
        colors={['#0F0F23', '#1A1A3A', '#2D2D5F']}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Seleccionar Ejercicio</Text>
            <Pressable onPress={resetAndClose} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={24} color="#FFFFFF" />
            </Pressable>
          </View>

          {/* Búsqueda */}
          <View style={styles.searchContainer}>
            <MaterialCommunityIcons name="magnify" size={20} color="#B0B0C4" />
            <TextInput
              placeholder="Buscar ejercicio..."
              placeholderTextColor="#6B7280"
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch('')} style={styles.clearSearch}>
                <MaterialCommunityIcons name="close-circle" size={20} color="#6B7280" />
              </Pressable>
            )}
          </View>

          {/* Filtros con header */}
          <View style={styles.filtersSection}>
            <View style={styles.filtersHeader}>
              <Text style={styles.filtersTitle}>Filtros</Text>
              {hasActiveFilters && (
                <Pressable onPress={clearAllFilters} style={styles.clearFilters}>
                  <Text style={styles.clearFiltersText}>Limpiar</Text>
                </Pressable>
              )}
            </View>

            {/* Grupo Muscular */}
            <Text style={styles.filterLabel}>Grupo Muscular</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {muscles.map((muscle) => (
                <FilterChip
                  key={muscle}
                  label={muscle}
                  selected={muscleFilter === muscle}
                  onPress={() => setMuscleFilter(muscleFilter === muscle ? null : muscle)}
                />
              ))}
            </ScrollView>

            {/* Equipamiento */}
            <Text style={styles.filterLabel}>Equipamiento</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {equipments.map((equipment) => (
                <FilterChip
                  key={equipment}
                  label={equipment}
                  selected={equipmentFilter === equipment}
                  onPress={() => setEquipmentFilter(equipmentFilter === equipment ? null : equipment)}
                />
              ))}
            </ScrollView>

            {/* Nivel */}
            <Text style={styles.filterLabel}>Nivel</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {levels.map((level) => (
                <FilterChip
                  key={level}
                  label={level}
                  selected={levelFilter === level}
                  onPress={() => setLevelFilter(levelFilter === level ? null : level)}
                />
              ))}
            </ScrollView>
          </View>

          {/* Resultados */}
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsCount}>
              {filtered.length} ejercicio{filtered.length !== 1 ? 's' : ''}
            </Text>
          </View>

          {/* Lista de ejercicios */}
          <ScrollView style={styles.exercisesList} showsVerticalScrollIndicator={false}>
            {filtered.map((exercise) => (
              <ExerciseCard
                key={exercise['Ejercicio']}
                exercise={exercise}
                expanded={expandedExercise === exercise['Ejercicio']}
                onPress={() => handleSelect(exercise)}
                onToggleExpand={() => 
                  setExpandedExercise(
                    expandedExercise === exercise['Ejercicio'] 
                      ? null 
                      : exercise['Ejercicio']
                  )
                }
              />
            ))}
            <View style={{ height: 20 }} />
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </Modal>
  );
}

// Componente FilterChip mejorado
function FilterChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
      android_ripple={{ color: 'rgba(255, 255, 255, 0.1)' }}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

// Componente ExerciseCard con descripción expandible
function ExerciseCard({
  exercise,
  expanded,
  onPress,
  onToggleExpand,
}: {
  exercise: any;
  expanded: boolean;
  onPress: () => void;
  onToggleExpand: () => void;
}) {
  const hasDescription = exercise['Descripción'] && exercise['Descripción'].trim().length > 0;

  return (
    <View style={styles.exerciseCard}>
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.02)']}
        style={styles.exerciseGradient}
      >
        <Pressable onPress={onPress} style={styles.exerciseMain}>
          <View style={styles.exerciseHeader}>
            <Text style={styles.exerciseName}>{exercise['Ejercicio']}</Text>
            {hasDescription && (
              <Pressable onPress={onToggleExpand} style={styles.expandButton}>
                <MaterialCommunityIcons 
                  name={expanded ? "chevron-up" : "information-outline"} 
                  size={20} 
                  color="#00D4AA" 
                />
              </Pressable>
            )}
          </View>
          
          <View style={styles.exerciseTags}>
            <Text style={styles.exerciseTag}>{exercise['Grupo Muscular']}</Text>
            <Text style={styles.exerciseTag}>{exercise['Equipamiento']}</Text>
            <Text style={[styles.exerciseTag, { color: getLevelColor(exercise['Nivel']) }]}>
              {exercise['Nivel']}
            </Text>
          </View>

          {expanded && hasDescription && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionText}>{exercise['Descripción']}</Text>
            </View>
          )}
        </Pressable>
      </LinearGradient>
    </View>
  );
}

// Helper para colores de nivel
function getLevelColor(level: string) {
  switch (level.toLowerCase()) {
    case 'principiante': return '#4ADE80';
    case 'intermedio': return '#FFB84D';
    case 'avanzado': return '#FF6B6B';
    default: return '#B0B0C4';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  safeArea: {
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

  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  closeButton: {
    padding: 4,
    borderRadius: 8,
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 20,
    marginTop: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    height: 44,
  },

  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    marginLeft: 8,
  },

  clearSearch: {
    padding: 4,
  },

  filtersSection: {
    paddingHorizontal: 20,
    marginTop: 20,
  },

  filtersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  filtersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  clearFilters: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },

  clearFiltersText: {
    fontSize: 14,
    color: '#00D4AA',
    fontWeight: '500',
  },

  filterLabel: {
    fontSize: 12,
    color: '#B0B0C4',
    marginBottom: 8,
    marginTop: 8,
    fontWeight: '500',
  },

  chipRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },

  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },

  chipSelected: {
    backgroundColor: '#00D4AA',
    borderColor: '#00D4AA',
  },

  chipText: {
    color: '#B0B0C4',
    fontSize: 12,
    fontWeight: '500',
  },

  chipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  resultsHeader: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },

  resultsCount: {
    fontSize: 14,
    color: '#B0B0C4',
    fontWeight: '500',
  },

  exercisesList: {
    flex: 1,
    paddingHorizontal: 20,
  },

  exerciseCard: {
    marginTop: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },

  exerciseGradient: {
    padding: 16,
  },

  exerciseMain: {
    flex: 1,
  },

  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },

  exerciseName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  expandButton: {
    padding: 4,
  },

  exerciseTags: {
    flexDirection: 'row',
    gap: 8,
  },

  exerciseTag: {
    fontSize: 12,
    color: '#B0B0C4',
    fontWeight: '500',
  },

  descriptionContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },

  descriptionText: {
    fontSize: 14,
    color: '#B0B0C4',
    lineHeight: 20,
  },
});