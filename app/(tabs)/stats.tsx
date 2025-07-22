// app/(tabs)/stats.tsx
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

// Importación de componentes modulares
import { AddMeasurementModal } from '../../components/stats/AddMeasurementModal';
import { ChartSection } from '../../components/stats/ChartSection';
import { ConsistencySection } from '../../components/stats/ConsistencySection';
import { MetricCard } from '../../components/stats/MetricCard';
import { RecordsSection } from '../../components/stats/RecordsSection';

/**
 * Pantalla principal de estadísticas
 * - Muestra métricas corporales con progreso hacia objetivos
 * - Gráfica interactiva con múltiples métricas y períodos
 * - Consistencia semanal con deportes multicolor
 * - Récords personales preparados para navegación futura
 * - Modal para añadir mediciones manuales o automáticas
 */
export default function StatsScreen() {
  /* -------- ESTADO DE LA INTERFAZ -------- */
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<'peso' | 'grasa' | 'musculo' | 'cintura' | 'pecho' | 'brazo' | 'muslo'>('peso');
  const [selectedPeriod, setSelectedPeriod] = useState<'7dias' | '30dias' | '90dias'>('30dias');

  /* -------- DATOS ESTÁTICOS - TODO: Conectar con base de datos -------- */
  
  // Métricas corporales actuales (algunas pueden no estar disponibles)
  const currentStats = {
    weight: 72.5,     // kg - peso actual (obligatorio)
    height: 175,      // cm - altura (se configura una vez en perfil)
    bodyFat: 15.2,    // % - porcentaje de grasa corporal (opcional, se puede calcular)
    muscle: 34.8,     // kg - masa muscular (opcional, se puede calcular)
    water: 58.3,      // % - porcentaje de agua corporal (opcional)
    waist: 82,        // cm - cintura (opcional, ideal mensual)
    chest: 98,        // cm - pecho (opcional, ideal mensual)
    arm: 35,          // cm - brazo (opcional, ideal mensual)
    thigh: 58,        // cm - muslo (opcional, ideal mensual)
  };

  // Objetivos del usuario (obligatorios según especificaciones)
  const goals = {
    weightGoal: 75.0,    // kg - peso objetivo
    bodyFatGoal: 12.0,   // % - grasa corporal objetivo
    muscleGoal: 36.0,    // kg - masa muscular objetivo
    waistGoal: 80,       // cm - cintura objetivo
  };

  // Disponibilidad de métricas (para ocultar las no disponibles)
  const metricsAvailability = {
    weight: true,
    bodyFat: true,
    muscle: true,
    water: false,
    waist: true,
    chest: false, // Ejemplo: no disponible
    arm: false,   // Ejemplo: no disponible
    thigh: false, // Ejemplo: no disponible
  };

  // Datos históricos para diferentes métricas y períodos
  const chartData = {
    peso: {
      '7dias': [
        { date: '25/6', value: 72.8 },
        { date: '26/6', value: 72.6 },
        { date: '27/6', value: 72.7 },
        { date: '28/6', value: 72.4 },
        { date: '29/6', value: 72.5 },
        { date: '30/6', value: 72.3 },
        { date: '1/7', value: 72.5 },
      ],
      '30dias': [
        { date: '1/6', value: 74.2 },
        { date: '5/6', value: 73.8 },
        { date: '10/6', value: 73.5 },
        { date: '15/6', value: 73.1 },
        { date: '20/6', value: 72.8 },
        { date: '25/6', value: 72.6 },
        { date: '1/7', value: 72.5 },
      ],
      '90dias': [
        { date: '1/4', value: 76.5 },
        { date: '15/4', value: 75.8 },
        { date: '1/5', value: 75.2 },
        { date: '15/5', value: 74.6 },
        { date: '1/6', value: 74.2 },
        { date: '15/6', value: 73.1 },
        { date: '1/7', value: 72.5 },
      ]
    },
    grasa: {
      '7dias': [
        { date: '25/6', value: 15.5 },
        { date: '26/6', value: 15.3 },
        { date: '27/6', value: 15.4 },
        { date: '28/6', value: 15.2 },
        { date: '29/6', value: 15.1 },
        { date: '30/6', value: 15.0 },
        { date: '1/7', value: 15.2 },
      ],
      '30dias': [
        { date: '1/6', value: 16.2 },
        { date: '5/6', value: 15.9 },
        { date: '10/6', value: 15.7 },
        { date: '15/6', value: 15.5 },
        { date: '20/6', value: 15.3 },
        { date: '25/6', value: 15.1 },
        { date: '1/7', value: 15.2 },
      ],
      '90dias': [
        { date: '1/4', value: 17.8 },
        { date: '15/4', value: 17.2 },
        { date: '1/5', value: 16.8 },
        { date: '15/5', value: 16.4 },
        { date: '1/6', value: 16.2 },
        { date: '15/6', value: 15.5 },
        { date: '1/7', value: 15.2 },
      ]
    },
    musculo: {
      '7dias': [
        { date: '25/6', value: 34.5 },
        { date: '26/6', value: 34.6 },
        { date: '27/6', value: 34.7 },
        { date: '28/6', value: 34.8 },
        { date: '29/6', value: 34.8 },
        { date: '30/6', value: 34.9 },
        { date: '1/7', value: 34.8 },
      ],
      '30dias': [
        { date: '1/6', value: 33.8 },
        { date: '5/6', value: 34.0 },
        { date: '10/6', value: 34.2 },
        { date: '15/6', value: 34.4 },
        { date: '20/6', value: 34.6 },
        { date: '25/6', value: 34.7 },
        { date: '1/7', value: 34.8 },
      ],
      '90dias': [
        { date: '1/4', value: 32.5 },
        { date: '15/4', value: 33.0 },
        { date: '1/5', value: 33.4 },
        { date: '15/5', value: 33.7 },
        { date: '1/6', value: 33.8 },
        { date: '15/6', value: 34.4 },
        { date: '1/7', value: 34.8 },
      ]
    },
    cintura: {
      '30dias': [
        { date: '1/6', value: 84 },
        { date: '15/6', value: 83 },
        { date: '1/7', value: 82 },
      ],
      '90dias': [
        { date: '1/4', value: 86 },
        { date: '1/5', value: 85 },
        { date: '1/6', value: 84 },
        { date: '15/6', value: 83 },
        { date: '1/7', value: 82 },
      ]
    },
  };

  // Progreso semanal de entrenamientos con deportes
  const weeklyWorkouts = [
    { 
      hasWorkout: true, 
      sports: [{ id: 'gimnasio', name: 'Gimnasio', color: '#FF6B6B', icon: 'dumbbell' }] 
    },
    { 
      hasWorkout: true, 
      sports: [
        { id: 'running', name: 'Running', color: '#4ECDC4', icon: 'run' },
        { id: 'yoga', name: 'Yoga', color: '#FECA57', icon: 'meditation' }
      ] 
    },
    { hasWorkout: false, sports: [] },
    { 
      hasWorkout: true, 
      sports: [{ id: 'gimnasio', name: 'Gimnasio', color: '#FF6B6B', icon: 'dumbbell' }] 
    },
    { 
      hasWorkout: true, 
      sports: [{ id: 'ciclismo', name: 'Ciclismo', color: '#45B7D1', icon: 'bike' }] 
    },
    { hasWorkout: false, sports: [] },
    { 
      hasWorkout: true, 
      sports: [
        { id: 'gimnasio', name: 'Gimnasio', color: '#FF6B6B', icon: 'dumbbell' },
        { id: 'natacion', name: 'Natación', color: '#96CEB4', icon: 'swim' }
      ] 
    },
  ];

  // Función helper para clasificar IMC
  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { category: 'Bajo peso', color: '#FFB84D' };
    if (bmi < 25) return { category: 'Normal', color: '#00D4AA' };
    if (bmi < 30) return { category: 'Sobrepeso', color: '#FFB84D' };
    return { category: 'Obesidad', color: '#FF6B6B' };
  };

  // Función helper para calcular progreso hacia objetivo
  const getProgressToGoal = (current: number, goal: number, isReverse = false) => {
    if (isReverse) {
      // Para grasa corporal (queremos reducir)
      const progress = Math.max(0, Math.min(100, ((goal / current) * 100)));
      return progress;
    } else {
      // Para peso/músculo (queremos aumentar)
      return Math.max(0, Math.min(100, (current / goal) * 100));
    }
  };

  // Calcular IMC
  const bmi = currentStats.weight / Math.pow(currentStats.height / 100, 2);
  const bmiInfo = getBMICategory(bmi);

  // Obtener datos de gráfica según selección
  const getCurrentChartData = () => {
    return (chartData as any)[selectedMetric]?.[selectedPeriod] || [];
  };

  const getCurrentChartValue = () => {
    const data = getCurrentChartData();
    if (!data.length) return '0';
    
    switch (selectedMetric) {
      case 'peso': return currentStats.weight.toString();
      case 'grasa': return currentStats.bodyFat?.toString() || '0';
      case 'musculo': return currentStats.muscle?.toString() || '0';
      case 'cintura': return currentStats.waist?.toString() || '0';
      case 'pecho': return currentStats.chest?.toString() || '0';
      case 'brazo': return currentStats.arm?.toString() || '0';
      case 'muslo': return currentStats.thigh?.toString() || '0';
      default: return '0';
    }
  };

  const getCurrentChartUnit = () => {
    switch (selectedMetric) {
      case 'peso': return 'kg';
      case 'grasa': 
      case 'musculo': return '%';
      case 'cintura':
      case 'pecho':
      case 'brazo':
      case 'muslo': return 'cm';
      default: return '';
    }
  };

  const getCurrentGoal = () => {
    switch (selectedMetric) {
      case 'peso': return goals.weightGoal;
      case 'grasa': return goals.bodyFatGoal;
      case 'musculo': return goals.muscleGoal;
      case 'cintura': return goals.waistGoal;
      default: return undefined;
    }
  };

  // Handlers
  const handleAddMeasurement = (data: any) => {
    console.log('Nueva medición:', data);
    // TODO: Guardar en base de datos
  };

  const handleRecordPress = (record: any) => {
    console.log('Récord seleccionado:', record);
    // TODO: Navegar a vista de detalles del récord
  };

  const handleViewAllRecords = () => {
    console.log('Ver todos los récords');
    // TODO: Navegar a vista completa de récords
  };

  return (
    <LinearGradient
      colors={['#0F0F23', '#1A1A3A', '#2D2D5F']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Estadísticas</Text>
            <Text style={styles.subtitle}>Seguimiento de tu progreso</Text>
          </View>

          {/* Métricas Principales */}
          <View style={styles.mainMetrics}>
            <Text style={styles.sectionTitle}>Métricas Corporales</Text>
            
            <View style={styles.metricsGrid}>
              <MetricCard 
                icon="weight" 
                label="Peso Actual" 
                value={currentStats.weight.toString()} 
                unit="kg"
                progress={getProgressToGoal(currentStats.weight, goals.weightGoal)}
                goal={goals.weightGoal}
                color="#00D4AA"
                isAvailable={metricsAvailability.weight}
              />
              
              <MetricCard 
                icon="human" 
                label="IMC" 
                value={bmi.toFixed(1)} 
                unit=""
                subtitle={bmiInfo.category}
                color={bmiInfo.color}
                isAvailable={metricsAvailability.weight} // Depende del peso
              />
              
              <MetricCard 
                icon="scale-bathroom" 
                label="Grasa Corporal" 
                value={currentStats.bodyFat?.toString() || '0'} 
                unit="%"
                progress={getProgressToGoal(currentStats.bodyFat || 0, goals.bodyFatGoal, true)}
                goal={goals.bodyFatGoal}
                color="#FF6B6B"
                isAvailable={metricsAvailability.bodyFat}
              />
              
              <MetricCard 
                icon="arm-flex" 
                label="Masa Muscular" 
                value={currentStats.muscle?.toString() || '0'} 
                unit="kg"
                progress={getProgressToGoal(currentStats.muscle || 0, goals.muscleGoal)}
                goal={goals.muscleGoal}
                color="#A78BFA"
                isAvailable={metricsAvailability.muscle}
              />

              <MetricCard 
                icon="water" 
                label="Agua Corporal" 
                value={currentStats.water?.toString() || '0'} 
                unit="%"
                color="#42A5F5"
                isAvailable={metricsAvailability.water}
              />

              <MetricCard 
                icon="ruler" 
                label="Cintura" 
                value={currentStats.waist?.toString() || '0'} 
                unit="cm"
                progress={getProgressToGoal(currentStats.waist || 0, goals.waistGoal, true)}
                goal={goals.waistGoal}
                color="#FFB84D"
                isAvailable={metricsAvailability.waist}
              />
            </View>
          </View>

          {/* Gráfica Interactiva */}
          <ChartSection
            title="Historial de Progreso"
            currentValue={getCurrentChartValue()}
            unit={getCurrentChartUnit()}
            currentDate="jul 1, 2025"
            data={getCurrentChartData()}
            selectedMetric={selectedMetric}
            selectedPeriod={selectedPeriod}
            goal={getCurrentGoal()}
            onMetricChange={setSelectedMetric}
            onPeriodChange={setSelectedPeriod}
          />

          {/* Consistencia Semanal */}
          <ConsistencySection
            weekData={weeklyWorkouts as any}
            totalExercises={12}
            totalPlanned={15}
          />

          {/* Récords Personales */}
          <RecordsSection
            records={personalRecords}
            onRecordPress={handleRecordPress}
            onViewAllPress={handleViewAllRecords}
          />

          {/* Botón para añadir medición */}
          <Pressable 
            style={styles.addMeasurementBtn}
            onPress={() => setShowAddModal(true)}
          >
            <LinearGradient
              colors={['#00D4AA', '#00B894']}
              style={styles.addBtnGradient}
            >
              <MaterialCommunityIcons name="plus" size={24} color="#FFFFFF" />
              <Text style={styles.addBtnText}>Añadir Medición</Text>
            </LinearGradient>
          </Pressable>

          <View style={{ height: 20 }} />
        </ScrollView>
      </SafeAreaView>

      {/* Modal para añadir mediciones */}
      <AddMeasurementModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddMeasurement}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  
  scrollContent: {
    paddingBottom: 20,
  },
  
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    marginBottom: 20,
  },
  
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  
  subtitle: {
    fontSize: 16,
    color: '#B0B0C4',
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
    paddingHorizontal: 20,
  },

  mainMetrics: {
    marginBottom: 20,
  },

  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
  },

  addMeasurementBtn: {
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },

  addBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },

  addBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

  // Récords personales
  const personalRecords = [
    { id: '1', exercise: 'Press Banca', weight: 85, unit: 'kg', date: '2024-06-15', improvement: 2.5 },
    { id: '2', exercise: 'Sentadilla', weight: 120, unit: 'kg', date: '2024-06-10', improvement: 5 },
    { id: '3', exercise: 'Peso Muerto', weight: 140, unit: 'kg', date: '2024-06-08', improvement: 10 },
    { id: '4', exercise: 'Press Militar', weight: 55, unit: 'kg', date: '2024-06-12', improvement: 2 },
  ];