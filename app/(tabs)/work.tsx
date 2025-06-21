// app/(tabs)/work.tsx - Versión final sin avisos con entrenamientos completados visibles
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import GymSession from '../../components/sport/GymSession';
import {
  CyclingSessionComponent,
  GenericSportSessionComponent,
  RunningSessionComponent,
  SwimmingSessionComponent
} from '../../components/sport/OtherSportsSessions';
import RestTimerBar from '../../components/sport/RestTimerBar';
import SportSelector from '../../components/sport/SportSelector';
import {
  CyclingSession,
  GenericSportSession,
  GymExercise,
  RunningSession,
  SPORT_TRANSLATIONS,
  SportSession,
  SportType,
  SwimmingSession,
  WeeklyPlan,
  Workout
} from '../../components/sport/sports';

const days = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const todayIdx = (new Date().getDay() + 6) % 7; // Lunes = 0

const SPORT_ICONS: Record<SportType, string> = {
  gym: 'dumbbell',
  running: 'run',
  cycling: 'bike',
  swimming: 'swim',
  yoga: 'meditation',
  football: 'soccer',
  basketball: 'basketball'
};

const SPORT_COLORS: Record<SportType, string[]> = {
  gym: ['#FF6B6B', '#FF5252'],
  running: ['#4ECDC4', '#26C6DA'],
  cycling: ['#45B7D1', '#2196F3'],
  swimming: ['#96CEB4', '#4CAF50'],
  yoga: ['#FECA57', '#FF9800'],
  football: ['#6C5CE7', '#673AB7'],
  basketball: ['#FD79A8', '#E91E63']
};

export default function MainTrainingScreen() {
  /**
   * Estados principales de la aplicación
   */
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan>(
    Object.fromEntries(days.map((d) => [d, []]))
  );
  const [selectedDay, setSelectedDay] = useState(days[todayIdx]);
  const [showSportSelector, setShowSportSelector] = useState(false);
  const [activeWorkoutId, setActiveWorkoutId] = useState<string | null>(null);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [restDuration, setRestDuration] = useState(60);

  const todaysWorkouts = weeklyPlan[selectedDay] || [];
  const activeWorkout = todaysWorkouts.find(w => w.id === activeWorkoutId);

  /**
   * Función para generar fechas de la semana actual
   * Calcula las fechas reales para cada día de lunes a domingo
   */
  const getWeekDates = () => {
    const today = new Date();
    const currentDay = today.getDay();
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
    
    return days.map((_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() + mondayOffset + index);
      return {
        dayCode: days[index],
        date: date.getDate(),
        month: date.getMonth() + 1,
        fullDate: date,
        isToday: date.toDateString() === today.toDateString()
      };
    });
  };

  const weekDates = getWeekDates();

  /**
   * Función para obtener información formateada del día seleccionado
   */
  const getSelectedDayInfo = () => {
    const selectedDayInfo = weekDates.find(d => d.dayCode === selectedDay);
    if (!selectedDayInfo) return '';
    
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    
    return `${selectedDayInfo.date} de ${monthNames[selectedDayInfo.month - 1]}`;
  };

  /**
   * Función para crear sesión por defecto según el deporte
   */
  const createDefaultSession = (sport: SportType): SportSession => {
    switch (sport) {
      case 'gym':
        return { sport: 'gym', data: [] };
      case 'running':
        return { 
          sport: 'running', 
          data: { 
            type: 'long_run',
            plannedDistance: undefined,
            plannedDuration: undefined
          } 
        };
      case 'cycling':
        return { 
          sport: 'cycling', 
          data: { 
            type: 'endurance',
            plannedDistance: undefined,
            plannedDuration: undefined
          } 
        };
      case 'swimming':
        return { 
          sport: 'swimming', 
          data: { 
            type: 'endurance',
            plannedDistance: undefined,
            poolLength: 25
          } 
        };
      default:
        return { 
          sport, 
          data: { 
            type: 'training',
            duration: undefined
          } 
        };
    }
  };

  /**
   * Función para añadir nuevo entrenamiento
   */
  const addNewWorkout = (sport: SportType) => {
    const newWorkout: Workout = {
      id: `workout_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      sport,
      session: createDefaultSession(sport),
      completed: false
    };

    setWeeklyPlan(prev => ({
      ...prev,
      [selectedDay]: [...prev[selectedDay], newWorkout]
    }));

    setActiveWorkoutId(newWorkout.id);
    setShowSportSelector(false);
  };

  /**
   * Función para actualizar sesión del entrenamiento activo
   */
  const updateWorkoutSession = (session: SportSession) => {
    if (!activeWorkoutId) return;

    setWeeklyPlan(prev => ({
      ...prev,
      [selectedDay]: prev[selectedDay].map(workout =>
        workout.id === activeWorkoutId
          ? { ...workout, session }
          : workout
      )
    }));
  };

  /**
   * Función para eliminar entrenamiento
   */
  const removeWorkout = (workoutId: string) => {
    setWeeklyPlan(prev => ({
      ...prev,
      [selectedDay]: prev[selectedDay].filter(w => w.id !== workoutId)
    }));

    if (activeWorkoutId === workoutId) {
      const remainingWorkouts = todaysWorkouts.filter(w => w.id !== workoutId);
      setActiveWorkoutId(remainingWorkouts.length > 0 ? remainingWorkouts[0].id : null);
    }
  };

  /**
   * Función para completar entrenamiento - SIN AVISOS
   * Solo cambia el estado a completado
   */
  const completeWorkout = () => {
    if (!activeWorkoutId) return;

    setWeeklyPlan(prev => ({
      ...prev,
      [selectedDay]: prev[selectedDay].map(workout =>
        workout.id === activeWorkoutId
          ? { ...workout, completed: true, duration: Date.now() }
          : workout
      )
    }));

    // Buscar siguiente entrenamiento incompleto
    const remainingIncompleteWorkouts = todaysWorkouts.filter(w => 
      w.id !== activeWorkoutId && !w.completed
    );
    
    if (remainingIncompleteWorkouts.length > 0) {
      setActiveWorkoutId(remainingIncompleteWorkouts[0].id);
    } else {
      setActiveWorkoutId(null);
      // SIN ALERTAS - Solo cambio de estado visual
    }
  };

  /**
   * Función para renderizar la sesión deportiva activa
   * Incluye tanto entrenamientos en progreso como completados
   */
  const renderSportSession = () => {
    if (!activeWorkout) return null;

    const session = activeWorkout.session;
    
    // Si el entrenamiento está completado, mostrar solo lectura
    const isCompleted = activeWorkout.completed;
    
    // Props comunes para componentes completados
    const completedProps = isCompleted ? {
      onCompleteWorkout: undefined, // Deshabilitar botón de completar
      disabled: true // Indicador de que está en modo lectura
    } : {
      onCompleteWorkout: completeWorkout
    };

    switch (activeWorkout.sport) {
      case 'gym':
        return (
          <GymSession
            exercises={(session as any).data || []}
            onUpdateExercises={
              isCompleted 
                ? () => {} // No permitir cambios si está completado
                : (exercises: GymExercise[]) => 
                    updateWorkoutSession({ sport: 'gym', data: exercises })
            }
            onStartRestTimer={isCompleted ? () => {} : startRestTimer}
            onCompleteWorkout={isCompleted ? undefined : completeWorkout}
            isCompleted={isCompleted} // Nueva prop para indicar estado
          />
        );
      
      case 'running':
        return (
          <RunningSessionComponent
            session={(session as any).data || { type: 'long_run' }}
            onUpdateSession={
              isCompleted
                ? () => {} // No permitir cambios si está completado
                : (data: RunningSession) => 
                    updateWorkoutSession({ sport: 'running', data })
            }
            onCompleteWorkout={isCompleted ? undefined : completeWorkout}
          />
        );
      
      case 'cycling':
        return (
          <CyclingSessionComponent
            session={(session as any).data || { type: 'endurance' }}
            onUpdateSession={
              isCompleted
                ? () => {} // No permitir cambios si está completado
                : (data: CyclingSession) => 
                    updateWorkoutSession({ sport: 'cycling', data })
            }
            onCompleteWorkout={isCompleted ? undefined : completeWorkout}
          />
        );
      
      case 'swimming':
        return (
          <SwimmingSessionComponent
            session={(session as any).data || { type: 'endurance', poolLength: 25 }}
            onUpdateSession={
              isCompleted
                ? () => {} // No permitir cambios si está completado
                : (data: SwimmingSession) => 
                    updateWorkoutSession({ sport: 'swimming', data })
            }
            onCompleteWorkout={isCompleted ? undefined : completeWorkout}
          />
        );
      
      default:
        return (
          <GenericSportSessionComponent
            session={(session as any).data || { type: 'training' }}
            sport={activeWorkout.sport}
            onUpdateSession={
              isCompleted
                ? () => {} // No permitir cambios si está completado
                : (data: GenericSportSession) => 
                    updateWorkoutSession({ sport: activeWorkout.sport, data })
            }
            onCompleteWorkout={isCompleted ? undefined : completeWorkout}
          />
        );
    }
  };

  /**
   * Funciones para el timer de descanso
   */
  const startRestTimer = (duration: number) => {
    setRestDuration(duration);
    setShowRestTimer(true);
  };

  const stopRestTimer = () => {
    setShowRestTimer(false);
  };

  /**
   * Función para obtener nombre completo del día
   */
  const getDayName = (dayCode: string) => {
    const dayNames = {
      'L': 'Lunes',
      'M': 'Martes',
      'X': 'Miércoles',
      'J': 'Jueves',
      'V': 'Viernes',
      'S': 'Sábado',
      'D': 'Domingo'
    };
    return dayNames[dayCode as keyof typeof dayNames];
  };

  // Calcular estadísticas del día
  const completedWorkouts = todaysWorkouts.filter(w => w.completed).length;
  const totalWorkouts = todaysWorkouts.length;
  const dayProgress = totalWorkouts > 0 ? (completedWorkouts / totalWorkouts) * 100 : 0;

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
            <Text style={styles.title}>Entrenamientos 💪</Text>
            <Text style={styles.subtitle}>Planifica tu semana deportiva</Text>
          </View>

          {/* Day Selector con fechas mejorado */}
          <View style={styles.daySelector}>
            <LinearGradient
              colors={["#2D2D5F", "#3D3D7F"]}
              style={styles.daySelectorGradient}
            >
              <View style={styles.daySelectorHeader}>
                <Text style={styles.daySelectorTitle}>Plan Semanal</Text>
                <Text style={styles.daySelectorSubtitle}>
                  📅 {getSelectedDayInfo()}
                </Text>
              </View>
              
              <View style={styles.weekRow}>
                {weekDates.map((dayInfo, i) => {
                  const isSelected = dayInfo.dayCode === selectedDay;
                  const hasWorkout = weeklyPlan[dayInfo.dayCode]?.length > 0;
                  const dayCompletedWorkouts = weeklyPlan[dayInfo.dayCode]?.filter(w => w.completed).length || 0;
                  const dayTotalWorkouts = weeklyPlan[dayInfo.dayCode]?.length || 0;

                  return (
                    <Pressable
                      key={dayInfo.dayCode}
                      onPress={() => {
                        setSelectedDay(dayInfo.dayCode);
                        setActiveWorkoutId(null);
                      }}
                      style={styles.dayButton}
                    >
                      <View
                        style={[
                          styles.dayContainer,
                          isSelected && styles.daySelected,
                          dayInfo.isToday && styles.dayToday,
                        ]}
                      >
                        <Text
                          style={[
                            styles.dayLabel,
                            isSelected && styles.dayLabelSelected,
                            dayInfo.isToday && styles.dayLabelToday,
                          ]}
                        >
                          {dayInfo.dayCode}
                        </Text>
                        
                        <Text
                          style={[
                            styles.dayDate,
                            isSelected && styles.dayDateSelected,
                            dayInfo.isToday && styles.dayDateToday,
                          ]}
                        >
                          {dayInfo.date}
                        </Text>

                        <View style={styles.dayIndicators}>
                          {dayInfo.isToday && (
                            <View style={styles.todayIndicator}>
                              <MaterialCommunityIcons
                                name="calendar-today"
                                size={8}
                                color="#FFB84D"
                              />
                            </View>
                          )}
                          
                          {hasWorkout && (
                            <View style={styles.workoutIndicator}>
                              {dayTotalWorkouts > 0 && dayCompletedWorkouts === dayTotalWorkouts ? (
                                <MaterialCommunityIcons
                                  name="check-circle"
                                  size={10}
                                  color="#00D4AA"
                                />
                              ) : (
                                <MaterialCommunityIcons
                                  name="dumbbell"
                                  size={10}
                                  color={isSelected ? "#FFFFFF" : "#FFB84D"}
                                />
                              )}
                            </View>
                          )}
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </LinearGradient>
          </View>

          {/* Rest Timer Bar */}
          {showRestTimer && (
            <RestTimerBar
              duration={restDuration}
              onComplete={stopRestTimer}
              onCancel={stopRestTimer}
            />
          )}

          {/* Current Day Info with Progress */}
          <View style={styles.currentDayInfo}>
            <LinearGradient
              colors={["#2D2D5F", "#3D3D7F"]}
              style={styles.currentDayGradient}
            >
              <View style={styles.currentDayHeader}>
                <MaterialCommunityIcons
                  name="calendar-clock"
                  size={20}
                  color="#00D4AA"
                />
                <Text style={styles.currentDayText}>
                  {getDayName(selectedDay)} - {getSelectedDayInfo()}
                </Text>
              </View>
              
              <View style={styles.dayStatsRow}>
                <Text style={styles.workoutCount}>
                  {completedWorkouts}/{totalWorkouts} entrenamientos completados
                </Text>
                
                {totalWorkouts > 0 && (
                  <Text style={styles.progressPercentage}>
                    {Math.round(dayProgress)}%
                  </Text>
                )}
              </View>

              {/* Barra de progreso del día */}
              {totalWorkouts > 0 && (
                <View style={styles.dayProgressContainer}>
                  <View style={styles.dayProgressBackground}>
                    <View 
                      style={[
                        styles.dayProgressBar, 
                        { width: `${dayProgress}%` }
                      ]} 
                    />
                  </View>
                </View>
              )}
            </LinearGradient>
          </View>

          {/* Workouts List */}
          {todaysWorkouts.length > 0 && (
            <View style={styles.workoutsList}>
              <LinearGradient
                colors={["#2D2D5F", "#3D3D7F"]}
                style={styles.workoutsListGradient}
              >
                <Text style={styles.workoutsListTitle}>Entrenamientos del Día</Text>
                {todaysWorkouts.map((workout) => (
                  <Pressable
                    key={workout.id}
                    onPress={() => setActiveWorkoutId(workout.id)}
                    style={styles.workoutItem}
                  >
                    <LinearGradient
                      colors={
                        activeWorkoutId === workout.id
                          ? SPORT_COLORS[workout.sport] as [string, string]
                          : workout.completed
                          ? ['rgba(0, 212, 170, 0.3)', 'rgba(0, 184, 148, 0.2)']
                          : ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']
                      }
                      style={[
                        styles.workoutItemGradient,
                        activeWorkoutId === workout.id && styles.workoutItemActive,
                        workout.completed && styles.workoutItemCompleted
                      ]}
                    >
                      <View style={styles.workoutItemContent}>
                        <View style={styles.workoutItemInfo}>
                          <View style={styles.workoutItemHeader}>
                            <MaterialCommunityIcons
                              name={SPORT_ICONS[workout.sport] as any}
                              size={24}
                              color={
                                activeWorkoutId === workout.id ? '#FFFFFF' : 
                                workout.completed ? '#00D4AA' : '#B0B0C4'
                              }
                            />
                            <Text style={[
                              styles.workoutItemName,
                              activeWorkoutId === workout.id && styles.workoutItemNameActive,
                              workout.completed && styles.workoutItemNameCompleted
                            ]}>
                              {SPORT_TRANSLATIONS[workout.sport]}
                            </Text>
                            {workout.completed && (
                              <View style={styles.completedBadge}>
                                <MaterialCommunityIcons
                                  name="check-circle"
                                  size={16}
                                  color="#00D4AA"
                                />
                                <Text style={styles.completedBadgeText}>COMPLETADO</Text>
                              </View>
                            )}
                          </View>
                        </View>
                        <Pressable
                          onPress={() => removeWorkout(workout.id)}
                          style={styles.removeWorkoutBtn}
                        >
                          <MaterialCommunityIcons
                            name="close"
                            size={20}
                            color="#FF6B6B"
                          />
                        </Pressable>
                      </View>
                    </LinearGradient>
                  </Pressable>
                ))}
              </LinearGradient>
            </View>
          )}

          {/* Add Workout Button */}
          <Pressable 
            onPress={() => setShowSportSelector(true)} 
            style={styles.addWorkoutBtn}
          >
            <LinearGradient
              colors={["#00D4AA", "#00B894"]}
              style={styles.addWorkoutGradient}
            >
              <MaterialCommunityIcons name="plus" size={24} color="#FFFFFF" />
              <Text style={styles.addWorkoutText}>Añadir Entrenamiento</Text>
            </LinearGradient>
          </Pressable>

          {/* Sport Session - Tanto en progreso como completados */}
          {activeWorkout && (
            <View style={styles.sessionContainer}>
              <LinearGradient
                colors={
                  activeWorkout.completed 
                    ? ["rgba(0, 212, 170, 0.2)", "rgba(0, 184, 148, 0.1)"]
                    : ["#2D2D5F", "#3D3D7F"]
                }
                style={styles.sessionHeader}
              >
                <MaterialCommunityIcons
                  name={SPORT_ICONS[activeWorkout.sport] as any}
                  size={24}
                  color={
                    activeWorkout.completed 
                      ? "#00D4AA" 
                      : SPORT_COLORS[activeWorkout.sport][0]
                  }
                />
                <Text style={[
                  styles.sessionTitle,
                  activeWorkout.completed && styles.sessionTitleCompleted
                ]}>
                  {SPORT_TRANSLATIONS[activeWorkout.sport]}
                  {activeWorkout.completed && " - Completado ✅"}
                </Text>
              </LinearGradient>
              {renderSportSession()}
            </View>
          )}

          {/* Empty State */}
          {todaysWorkouts.length === 0 && (
            <View style={styles.emptyState}>
              <LinearGradient
                colors={["#2D2D5F", "#3D3D7F"]}
                style={styles.emptyStateGradient}
              >
                <MaterialCommunityIcons
                  name="calendar-plus"
                  size={48}
                  color="#B0B0C4"
                />
                <Text style={styles.emptyTitle}>Sin entrenamientos</Text>
                <Text style={styles.emptySubtitle}>
                  ¡Añade tu primer entrenamiento del día!
                </Text>
              </LinearGradient>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Sport Selector Modal */}
      {showSportSelector && (
        <SportSelector
          onSportSelect={addNewWorkout}
          onClose={() => setShowSportSelector(false)}
        />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F23',
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
    marginBottom: 20,
    paddingTop: 10,
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

  // Day Selector con bordes redondeados completos
  daySelector: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 20, // Aumentado para mejor redondeado
    overflow: 'hidden',
  },

  daySelectorGradient: {
    padding: 20,
    borderRadius: 20, // Asegurar redondeado interno
  },

  daySelectorHeader: {
    marginBottom: 16,
  },

  daySelectorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },

  daySelectorSubtitle: {
    fontSize: 14,
    color: '#00D4AA',
    fontWeight: '600',
  },

  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  dayButton: {
    flex: 1,
    alignItems: 'center',
  },

  dayContainer: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 16, // Bordes más redondeados
    alignItems: 'center',
    minWidth: 44,
    minHeight: 68,
    justifyContent: 'center',
    position: 'relative',
  },

  daySelected: {
    backgroundColor: '#00D4AA',
  },

  dayToday: {
    borderWidth: 2,
    borderColor: '#FFB84D',
  },

  dayLabel: {
    fontSize: 14,
    color: '#B0B0C4',
    fontWeight: '600',
  },

  dayLabelSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  dayLabelToday: {
    color: '#FFB84D',
    fontWeight: '700',
  },

  dayDate: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
    marginTop: 2,
  },

  dayDateSelected: {
    color: '#FFFFFF',
  },

  dayDateToday: {
    color: '#FFB84D',
  },

  dayIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },

  todayIndicator: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  workoutIndicator: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Current Day Info con bordes mejorados
  currentDayInfo: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },

  currentDayGradient: {
    padding: 16,
    borderRadius: 20,
  },

  currentDayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  currentDayText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },

  dayStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },

  workoutCount: {
    fontSize: 14,
    color: '#B0B0C4',
  },

  progressPercentage: {
    fontSize: 14,
    fontWeight: '700',
    color: '#00D4AA',
  },

  dayProgressContainer: {
    marginTop: 8,
  },

  dayProgressBackground: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
  },

  dayProgressBar: {
    height: 6,
    backgroundColor: '#00D4AA',
    borderRadius: 3,
  },

  // Workouts List con bordes mejorados
  workoutsList: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },

  workoutsListGradient: {
    padding: 20,
    borderRadius: 20,
  },

  workoutsListTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },

  workoutItem: {
    marginBottom: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },

  workoutItemGradient: {
    padding: 16,
    borderRadius: 16,
  },

  workoutItemActive: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },

  workoutItemCompleted: {
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 170, 0.5)',
  },

  workoutItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  workoutItemInfo: {
    flex: 1,
  },

  workoutItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  workoutItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#B0B0C4',
    flex: 1,
  },

  workoutItemNameActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  workoutItemNameCompleted: {
    color: '#00D4AA',
    fontWeight: '700',
  },

  // Badge para entrenamientos completados
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 212, 170, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },

  completedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#00D4AA',
    letterSpacing: 0.5,
  },

  removeWorkoutBtn: {
    padding: 4,
  },

  // Add Workout Button con bordes mejorados
  addWorkoutBtn: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },

  addWorkoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 20,
    gap: 8,
  },

  addWorkoutText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Session Container con bordes mejorados
  sessionContainer: {
    marginBottom: 16,
  },

  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 20, // Bordes más redondeados
    gap: 12,
  },

  sessionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  sessionTitleCompleted: {
    color: '#00D4AA',
  },

  // Empty State con bordes mejorados
  emptyState: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },

  emptyStateGradient: {
    padding: 40,
    alignItems: 'center',
    borderRadius: 20,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },

  emptySubtitle: {
    fontSize: 14,
    color: '#B0B0C4',
    textAlign: 'center',
  },
});