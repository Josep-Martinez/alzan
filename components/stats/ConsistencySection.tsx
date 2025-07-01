// components/stats/ConsistencySection.tsx
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

interface WorkoutDay {
  hasWorkout: boolean;
  sports: SportType[];
}

interface SportType {
  id: string;
  name: string;
  color: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}

interface ConsistencySectionProps {
  weekData: WorkoutDay[]; // Array de 7 días (L-D)
  totalExercises: number;
  totalPlanned?: number;
}

/**
 * Componente que muestra la consistencia semanal de entrenamientos
 * - Visualiza 7 días de la semana con indicadores de actividad
 * - Soporta múltiples deportes por día con colores distintivos
 * - Muestra leyenda de deportes practicados
 * - Calcula estadísticas de ejercicios completados vs planificados
 */
export function ConsistencySection({ 
  weekData, 
  totalExercises, 
  totalPlanned 
}: ConsistencySectionProps) {
  
  // Configuración de deportes con sus colores e iconos (basado en diseño)
  const sportsConfig: { [key: string]: SportType } = {
    gimnasio: {
      id: 'gimnasio',
      name: 'Gimnasio',
      color: '#FF6B6B', // Rojo coral
      icon: 'dumbbell'
    },
    running: {
      id: 'running',
      name: 'Running',
      color: '#4ECDC4', // Turquesa
      icon: 'run'
    },
    ciclismo: {
      id: 'ciclismo',
      name: 'Ciclismo',
      color: '#45B7D1', // Azul
      icon: 'bike'
    },
    natacion: {
      id: 'natacion',
      name: 'Natación',
      color: '#96CEB4', // Verde agua
      icon: 'swim'
    },
    yoga: {
      id: 'yoga',
      name: 'Yoga',
      color: '#FECA57', // Amarillo/naranja
      icon: 'meditation'
    },
    futbol: {
      id: 'futbol',
      name: 'Fútbol',
      color: '#A29BFE', // Púrpura
      icon: 'soccer'
    },
    baloncesto: {
      id: 'baloncesto',
      name: 'Baloncesto',
      color: '#FD79A8', // Rosa
      icon: 'basketball'
    }
  };

  const workoutsCompleted = weekData.filter(day => day.hasWorkout).length;
  
  // Renderiza cada día de la semana con sus actividades
  const renderDayWorkout = (dayData: WorkoutDay, dayIndex: number) => {
    const dayNames = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
    const dayName = dayNames[dayIndex];
    const isToday = dayIndex === new Date().getDay() - 1; // Ajustar según día actual
    
    const hasSingleSport = dayData.sports.length === 1;
    const hasMultipleSports = dayData.sports.length > 1;
    
    // Determinar el color del dot según los deportes
    let dotColor = 'rgba(255, 255, 255, 0.1)'; // Sin entrenamientos
    let dotContent = null;
    
    if (hasSingleSport) {
      // Un solo deporte - usar su color
      const sport = sportsConfig[dayData.sports[0].name.toLowerCase()];
      dotColor = sport?.color || '#00D4AA';
      dotContent = (
        <MaterialCommunityIcons 
          name={sport?.icon || 'dumbbell'} 
          size={12} 
          color="#FFFFFF" 
        />
      );
    } else if (hasMultipleSports) {
      // Múltiples deportes - crear patrón dividido
      const primarySport = sportsConfig[dayData.sports[0].name.toLowerCase()];
      const secondarySport = sportsConfig[dayData.sports[1].name.toLowerCase()];
      
      dotContent = (
        <View style={styles.multiSportDot}>
          <View style={[
            styles.multiSportSegment,
            { backgroundColor: primarySport?.color || '#00D4AA' }
          ]} />
          <View style={[
            styles.multiSportSegment,
            { backgroundColor: secondarySport?.color || '#FFB84D' }
          ]} />
          {dayData.sports.length > 2 && (
            <View style={styles.multiSportIndicator}>
              <Text style={styles.multiSportCount}>+</Text>
            </View>
          )}
        </View>
      );
    }

    return (
      <View key={dayIndex} style={styles.dayContainer}>
        <Text style={[
          styles.dayLabel,
          isToday && styles.dayLabelToday
        ]}>
          {dayName}
        </Text>
        
        <View style={[
          styles.workoutDot,
          dayData.hasWorkout && styles.workoutDotCompleted,
          isToday && styles.workoutDotToday,
          hasSingleSport && { backgroundColor: dotColor },
          hasMultipleSports && { backgroundColor: 'transparent' }
        ]}>
          {dotContent}
        </View>
        
        {/* Mini indicadores de deportes debajo del dot principal */}
        {dayData.sports.length > 0 && (
          <View style={styles.sportsIndicators}>
            {dayData.sports.slice(0, 3).map((sport, sportIndex) => {
              const sportConfig = sportsConfig[sport.name.toLowerCase()];
              return (
                <View 
                  key={sportIndex}
                  style={[
                    styles.sportMiniIndicator,
                    { backgroundColor: sportConfig?.color || '#00D4AA' }
                  ]} 
                />
              );
            })}
          </View>
        )}
      </View>
    );
  };

  return (
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
          {totalExercises} ejercicio{totalExercises !== 1 ? 's' : ''} completado{totalExercises !== 1 ? 's' : ''}
          {totalPlanned && ` de ${totalPlanned} planificados`}
        </Text>
        
        <Text style={styles.consistencySubtext}>
          {workoutsCompleted} de 7 días con actividad
        </Text>
        
        <View style={styles.weekRow}>
          {weekData.map((dayData, index) => renderDayWorkout(dayData, index))}
        </View>
        
        {/* Leyenda de deportes practicados esta semana */}
        <View style={styles.sportsLegend}>
          <Text style={styles.legendTitle}>Deportes practicados:</Text>
          <View style={styles.legendItems}>
            {Object.values(sportsConfig).map((sport) => {
              const isActive = weekData.some(day => 
                day.sports.some(s => s.name.toLowerCase() === sport.id)
              );
              
              if (!isActive) return null;
              
              return (
                <View key={sport.id} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: sport.color }]} />
                  <Text style={styles.legendText}>{sport.name}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
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

  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  consistencyText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 4,
  },

  consistencySubtext: {
    fontSize: 14,
    color: '#B0B0C4',
    marginBottom: 16,
  },

  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  dayContainer: {
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },

  dayLabel: {
    fontSize: 12,
    color: '#B0B0C4',
    fontWeight: '600',
  },

  dayLabelToday: {
    color: '#FFB84D',
  },

  workoutDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },

  workoutDotCompleted: {
    backgroundColor: '#00D4AA',
  },

  workoutDotToday: {
    borderWidth: 2,
    borderColor: '#FFB84D',
  },

  multiSportDot: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    position: 'relative',
  },

  multiSportSegment: {
    flex: 1,
    height: '100%',
  },

  multiSportIndicator: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },

  multiSportCount: {
    fontSize: 8,
    fontWeight: '700',
    color: '#2D2D5F',
  },

  sportsIndicators: {
    flexDirection: 'row',
    gap: 2,
    justifyContent: 'center',
  },

  sportMiniIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },

  sportsLegend: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 16,
  },

  legendTitle: {
    fontSize: 12,
    color: '#B0B0C4',
    marginBottom: 8,
    fontWeight: '600',
  },

  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },

  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  legendText: {
    fontSize: 11,
    color: '#B0B0C4',
    fontWeight: '500',
  },
});