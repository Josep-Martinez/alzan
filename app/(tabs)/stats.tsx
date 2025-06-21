// app/(tabs)/stats.tsx
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function StatsScreen() {
  /* -------- DATOS ESTÁTICOS - TODO: Conectar con base de datos -------- */
  
  // Métricas corporales actuales
  const currentStats = {
    weight: 72.5,     // kg - peso actual
    height: 175,      // cm - altura (para calcular IMC)
    bodyFat: 15.2,    // % - porcentaje de grasa corporal
    muscle: 34.8,     // kg - masa muscular
    water: 58.3,      // % - porcentaje de agua corporal
  };

  // Cálculo automático del IMC
  const bmi = currentStats.weight / Math.pow(currentStats.height / 100, 2);

  // Datos históricos mensuales para la gráfica (últimos 30 días aproximadamente)
  const monthlyWeightData = [
    { date: '5/4', weight: 89.2 },
    { date: '5/7', weight: 88.8 },
    { date: '5/11', weight: 87.9 },
    { date: '5/14', weight: 87.5 },
    { date: '5/18', weight: 86.8 },
    { date: '5/21', weight: 86.2 },
    { date: '5/25', weight: 85.9 },
    { date: '5/28', weight: 85.7 },
    { date: '5/31', weight: 85.3 },
    { date: '6/4', weight: 85.6 },
    { date: '6/8', weight: 85.8 },
    { date: '6/11', weight: 86.1 },
    { date: '6/14', weight: 88.3 }, // Peso actual mostrado en la gráfica
  ];

  // Objetivos del usuario
  const goals = {
    weightGoal: 75.0,    // kg - peso objetivo
    bodyFatGoal: 12.0,   // % - grasa corporal objetivo
    muscleGoal: 36.0,    // kg - masa muscular objetivo
  };

  // Progreso semanal de entrenamientos (para mostrar consistencia)
  const weeklyWorkouts = [true, true, false, true, true, false, true]; // L-D
  const workoutsCompleted = weeklyWorkouts.filter(Boolean).length;

  // Récords personales - TODO: obtener de base de datos de entrenamientos
  const personalRecords = [
    { exercise: 'Press Banca', weight: 85, unit: 'kg', date: '2024-01-15' },
    { exercise: 'Sentadilla', weight: 120, unit: 'kg', date: '2024-01-10' },
    { exercise: 'Peso Muerto', weight: 140, unit: 'kg', date: '2024-01-08' },
    { exercise: 'Press Militar', weight: 55, unit: 'kg', date: '2024-01-12' },
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
      const progress = Math.max(0, Math.min(100, ((current - goal) / current) * 100));
      return 100 - progress;
    } else {
      // Para peso/músculo (queremos aumentar)
      return Math.max(0, Math.min(100, (current / goal) * 100));
    }
  };

  // Función para calcular la diferencia con el objetivo
  const getWeightDifference = () => {
    const currentWeight = monthlyWeightData[monthlyWeightData.length - 1].weight;
    const difference = currentWeight - goals.weightGoal;
    return difference > 0 ? `+${difference.toFixed(1)}kg` : `${difference.toFixed(1)}kg`;
  };

  const bmiInfo = getBMICategory(bmi);

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
            
            {/* Grid de métricas 2x2 */}
            <View style={styles.metricsGrid}>
              <MetricCard 
                icon="weight" 
                label="Peso Actual" 
                value={currentStats.weight.toString()} 
                unit="kg"
                progress={getProgressToGoal(currentStats.weight, goals.weightGoal)}
                goal={goals.weightGoal}
                color="#00D4AA"
              />
              
              <MetricCard 
                icon="human" 
                label="IMC" 
                value={bmi.toFixed(1)} 
                unit=""
                subtitle={bmiInfo.category}
                color={bmiInfo.color}
              />
              
              <MetricCard 
                icon="scale-bathroom" 
                label="Grasa Corporal" 
                value={currentStats.bodyFat.toString()} 
                unit="%"
                progress={getProgressToGoal(currentStats.bodyFat, goals.bodyFatGoal, true)}
                goal={goals.bodyFatGoal}
                color="#FF6B6B"
              />
              
              <MetricCard 
                icon="arm-flex" 
                label="Masa Muscular" 
                value={currentStats.muscle.toString()} 
                unit="kg"
                progress={getProgressToGoal(currentStats.muscle, goals.muscleGoal)}
                goal={goals.muscleGoal}
                color="#A78BFA"
              />
            </View>
          </View>

          {/* Gráfica Mensual de Peso */}
          <View style={styles.chartSection}>
            <LinearGradient
              colors={['#2D2D5F', '#3D3D7F']}
              style={styles.chartGradient}
            >
              {/* Header de la gráfica */}
              <View style={styles.chartHeader}>
                <Text style={styles.cardTitle}>Historial de Peso</Text>
                <View style={styles.chartHeaderRight}>
                  <Text style={styles.currentWeightText}>
                    {monthlyWeightData[monthlyWeightData.length - 1].weight}kg
                  </Text>
                  <Text style={styles.dateText}>
                    jun 14, 2025
                  </Text>
                </View>
              </View>

              {/* Contenedor de la gráfica */}
              <View style={styles.chartContainer}>
                {/* Área de la gráfica */}
                <View style={styles.chartArea}>
                  {/* Líneas de referencia horizontales */}
                  <View style={styles.gridLines}>
                    <View style={styles.gridLine} />
                    <View style={styles.gridLine} />
                    <View style={styles.gridLine} />
                    <View style={styles.gridLine} />
                  </View>

                  {/* Etiquetas del eje Y */}
                  <View style={styles.yAxisLabels}>
                    <Text style={styles.yAxisLabel}>95.0</Text>
                    <Text style={styles.yAxisLabel}>90.0</Text>
                    <Text style={styles.yAxisLabel}>87.5</Text>
                    <Text style={styles.yAxisLabel}>85.0</Text>
                    <Text style={styles.yAxisLabel}>kg</Text>
                  </View>

                  {/* Gráfica de línea */}
                  <View style={styles.lineChart}>
                    {monthlyWeightData.map((point, index) => {
                      // Calcular posición vertical basada en el peso
                      const minWeight = 85.0;
                      const maxWeight = 95.0;
                      const normalizedWeight = (maxWeight - point.weight) / (maxWeight - minWeight);
                      const yPosition = normalizedWeight * 100; // Porcentaje desde arriba

                      return (
                        <View key={index} style={styles.dataPointContainer}>
                          {/* Punto de datos */}
                          <View 
                            style={[
                              styles.dataPoint, 
                              { top: `${yPosition}%` },
                              index === monthlyWeightData.length - 1 && styles.currentDataPoint
                            ]} 
                          />
                          
                          {/* Línea conectora (excepto para el último punto) */}
                          {index < monthlyWeightData.length - 1 && (
                            <View 
                              style={[
                                styles.connector,
                                { top: `${yPosition}%` }
                              ]} 
                            />
                          )}
                        </View>
                      );
                    })}
                  </View>

                  {/* Área rellena bajo la curva */}
                  <View style={styles.chartFill} />
                </View>

                {/* Etiquetas del eje X */}
                <View style={styles.xAxisLabels}>
                  {['5/4', '5/11', '5/18', '5/25', '5/31', '6/8', '6/14'].map((date, index) => (
                    <Text key={index} style={styles.xAxisLabel}>{date}</Text>
                  ))}
                </View>
              </View>

              {/* Progreso hacia objetivo */}
              <View style={styles.goalProgress}>
                <Text style={styles.goalProgressText}>
                  Comparar con su objetivo: 
                  <Text style={styles.goalDifference}> {getWeightDifference()}</Text>
                </Text>
              </View>
            </LinearGradient>
          </View>

          {/* Consistencia de Entrenamiento */}
          <View style={styles.consistencySection}>
            <LinearGradient
              colors={['#2D2D5F', '#3D3D7F']}
              style={styles.consistencyGradient}
            >
              <View style={styles.consistencyHeader}>
                <MaterialCommunityIcons name="calendar-check" size={24} color="#FFB84D" />
                <Text style={styles.cardTitle}>Consistencia Semanal</Text>
              </View>
              
              <Text style={styles.consistencyText}>
                {workoutsCompleted} de 7 entrenamientos completados
              </Text>
              
              <View style={styles.weekRow}>
                {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day, index) => {
                  const isCompleted = weeklyWorkouts[index];
                  const isToday = index === 3; // Jueves como ejemplo
                  
                  return (
                    <View key={day} style={styles.dayContainer}>
                      <Text style={[
                        styles.dayLabel,
                        isToday && styles.dayLabelToday
                      ]}>
                        {day}
                      </Text>
                      <View style={[
                        styles.workoutDot,
                        isCompleted && styles.workoutDotCompleted,
                        isToday && styles.workoutDotToday
                      ]}>
                        {isCompleted && (
                          <MaterialCommunityIcons 
                            name="dumbbell" 
                            size={12} 
                            color="#FFFFFF" 
                          />
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            </LinearGradient>
          </View>

          {/* Récords Personales */}
          <View style={styles.recordsSection}>
            <Text style={styles.sectionTitle}>Récords Personales</Text>
            
            {personalRecords.map((record, index) => (
              <RecordCard 
                key={index}
                exercise={record.exercise}
                weight={record.weight}
                unit={record.unit}
                date={record.date}
              />
            ))}
          </View>

          {/* Métricas Adicionales */}
          <View style={styles.additionalMetrics}>
            <LinearGradient
              colors={['#2D2D5F', '#3D3D7F']}
              style={styles.additionalGradient}
            >
              <Text style={styles.cardTitle}>Composición Corporal</Text>
              
              <View style={styles.compositionGrid}>
                <View style={styles.compositionItem}>
                  <MaterialCommunityIcons name="water" size={24} color="#42A5F5" />
                  <Text style={styles.compositionValue}>{currentStats.water}%</Text>
                  <Text style={styles.compositionLabel}>Agua</Text>
                </View>
                
                <View style={styles.compositionItem}>
                  <MaterialCommunityIcons name="ruler" size={24} color="#FFB84D" />
                  <Text style={styles.compositionValue}>{currentStats.height}cm</Text>
                  <Text style={styles.compositionLabel}>Altura</Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Botón para añadir medición */}
          <Pressable style={styles.addMeasurementBtn}>
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
    </LinearGradient>
  );
}

/* --- Componentes Helper --- */

// Componente para tarjetas de métricas principales
function MetricCard({ 
  icon, 
  label, 
  value, 
  unit, 
  subtitle, 
  progress, 
  goal, 
  color 
}: { 
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string; 
  value: string; 
  unit: string;
  subtitle?: string;
  progress?: number;
  goal?: number;
  color: string;
}) {
  return (
    <View style={styles.metricCard}>
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.02)']}
        style={styles.metricGradient}
      >
        <MaterialCommunityIcons name={icon} size={28} color={color} />
        
        <View style={styles.metricContent}>
          <Text style={styles.metricValue}>
            {value}<Text style={styles.metricUnit}>{unit}</Text>
          </Text>
          <Text style={styles.metricLabel}>{label}</Text>
          
          {subtitle && (
            <Text style={[styles.metricSubtitle, { color }]}>{subtitle}</Text>
          )}
          
          {progress !== undefined && goal && (
            <>
              <View style={styles.progressContainer}>
                <View style={styles.progressBg}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${Math.min(progress, 100)}%`, backgroundColor: color }
                    ]} 
                  />
                </View>
              </View>
              <Text style={styles.goalText}>Meta: {goal}{unit}</Text>
            </>
          )}
        </View>
      </LinearGradient>
    </View>
  );
}

// Componente para tarjetas de récords personales
function RecordCard({ 
  exercise, 
  weight, 
  unit, 
  date 
}: { 
  exercise: string; 
  weight: number; 
  unit: string; 
  date: string; 
}) {
  return (
    <View style={styles.recordCard}>
      <LinearGradient
        colors={['#2D2D5F', '#3D3D7F']}
        style={styles.recordGradient}
      >
        <View style={styles.recordContent}>
          <View style={styles.recordInfo}>
            <Text style={styles.recordExercise}>{exercise}</Text>
            <Text style={styles.recordDate}>
              {new Date(date).toLocaleDateString('es-ES')}
            </Text>
          </View>
          
          <View style={styles.recordWeight}>
            <Text style={styles.recordValue}>{weight}</Text>
            <Text style={styles.recordUnit}>{unit}</Text>
          </View>
        </View>
        
        <MaterialCommunityIcons name="trophy" size={20} color="#FFB84D" />
      </LinearGradient>
    </View>
  );
}

/* --- Estilos --- */
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

  metricCard: {
    width: '48%',
    borderRadius: 16,
    overflow: 'hidden',
  },

  metricGradient: {
    padding: 16,
    alignItems: 'center',
  },

  metricContent: {
    alignItems: 'center',
    marginTop: 8,
  },

  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },

  metricUnit: {
    fontSize: 16,
    fontWeight: '400',
    color: '#B0B0C4',
  },

  metricLabel: {
    fontSize: 12,
    color: '#B0B0C4',
    textAlign: 'center',
    marginBottom: 4,
  },

  metricSubtitle: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 8,
  },

  progressContainer: {
    width: '100%',
    marginBottom: 4,
  },

  progressBg: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
  },

  progressFill: {
    height: 4,
    borderRadius: 2,
  },

  goalText: {
    fontSize: 10,
    color: '#B0B0C4',
  },

  /* --- Estilos para la nueva gráfica mensual --- */
  chartSection: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },

  chartGradient: {
    padding: 20,
  },

  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },

  chartHeaderRight: {
    alignItems: 'flex-end',
  },

  currentWeightText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  dateText: {
    fontSize: 14,
    color: '#B0B0C4',
    marginTop: 2,
  },

  chartContainer: {
    height: 200,
    marginBottom: 16,
  },

  chartArea: {
    flex: 1,
    position: 'relative',
  },

  gridLines: {
    position: 'absolute',
    top: 0,
    left: 40,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
  },

  gridLine: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },

  yAxisLabels: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 35,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },

  yAxisLabel: {
    fontSize: 12,
    color: '#B0B0C4',
    textAlign: 'right',
  },

  lineChart: {
    position: 'absolute',
    top: 0,
    left: 40,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
  },

  dataPointContainer: {
    position: 'relative',
    width: 8,
    height: '100%',
  },

  dataPoint: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4A9EFF',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    left: 0,
    transform: [{ translateY: -4 }],
  },

  currentDataPoint: {
    backgroundColor: '#4A9EFF',
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 3,
    transform: [{ translateY: -5 }],
  },

  connector: {
    position: 'absolute',
    height: 2,
    backgroundColor: '#4A9EFF',
    left: 8,
    width: 20,
    transform: [{ translateY: -1 }],
  },

  chartFill: {
    position: 'absolute',
    bottom: 0,
    left: 40,
    right: 0,
    height: '70%',
    backgroundColor: 'rgba(74, 158, 255, 0.2)',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },

  xAxisLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    marginTop: 8,
  },

  xAxisLabel: {
    fontSize: 12,
    color: '#B0B0C4',
    textAlign: 'center',
  },

  goalProgress: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 16,
  },

  goalProgressText: {
    fontSize: 14,
    color: '#B0B0C4',
  },

  goalDifference: {
    color: '#FFB84D',
    fontWeight: '600',
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 0,
  },

  /* --- Resto de estilos existentes --- */
  consistencySection: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },

  consistencyGradient: {
    padding: 20,
  },

  consistencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },

  consistencyText: {
    fontSize: 14,
    color: '#B0B0C4',
    marginBottom: 16,
  },

  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  dayContainer: {
    alignItems: 'center',
    flex: 1,
  },

  dayLabel: {
    fontSize: 12,
    color: '#B0B0C4',
    fontWeight: '600',
    marginBottom: 8,
  },

  dayLabelToday: {
    color: '#FFB84D',
  },

  workoutDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  workoutDotCompleted: {
    backgroundColor: '#00D4AA',
  },

  workoutDotToday: {
    borderWidth: 2,
    borderColor: '#FFB84D',
  },

  recordsSection: {
    marginBottom: 20,
  },

  recordCard: {
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },

  recordGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },

  recordContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginRight: 12,
  },

  recordInfo: {
    flex: 1,
  },

  recordExercise: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },

  recordDate: {
    fontSize: 12,
    color: '#B0B0C4',
  },

  recordWeight: {
    alignItems: 'center',
  },

  recordValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  recordUnit: {
    fontSize: 12,
    color: '#B0B0C4',
  },

  additionalMetrics: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },

  additionalGradient: {
    padding: 20,
  },

  compositionGrid: {
    flexDirection: 'row',
    gap: 20,
  },

  compositionItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
  },

  compositionValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 8,
    marginBottom: 4,
  },

  compositionLabel: {
    fontSize: 12,
    color: '#B0B0C4',
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