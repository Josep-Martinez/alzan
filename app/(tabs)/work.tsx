// app/(tabs)/work.tsx - Sistema mejorado de entrenamientos con gestión múltiple
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
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
import GymSession from '../../components/sport/GymSession';
import {
  CyclingSessionComponent,
  GenericSportSessionComponent,
  RunningSessionComponent,
  SwimmingSessionComponent
} from '../../components/sport/OtherSportsSessions';
import PostWorkoutIntensity from '../../components/sport/PostWorkoutIntensity';
import RestTimerBar from '../../components/sport/RestTimerBar';
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
import SportSelector from '../../components/sport/SportSelector';

/**
 * Configuración de días de la semana
 * L=Lunes, M=Martes, X=Miércoles, J=Jueves, V=Viernes, S=Sábado, D=Domingo
 */
const days = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const todayIdx = (new Date().getDay() + 6) % 7; // Lunes = 0

/**
 * Configuración de iconos para cada deporte
 */
const SPORT_ICONS: Record<SportType, string> = {
  gym: 'dumbbell',
  running: 'run',
  cycling: 'bike',
  swimming: 'swim',
  yoga: 'meditation',
  football: 'soccer',
  basketball: 'basketball'
};

/**
 * Configuración de colores gradiente para cada deporte
 */
const SPORT_COLORS: Record<SportType, string[]> = {
  gym: ['#FF6B6B', '#FF5252'],
  running: ['#4ECDC4', '#26C6DA'],
  cycling: ['#45B7D1', '#2196F3'],
  swimming: ['#96CEB4', '#4CAF50'],
  yoga: ['#FECA57', '#FF9800'],
  football: ['#6C5CE7', '#673AB7'],
  basketball: ['#FD79A8', '#E91E63']
};

/**
 * Componente principal de la pantalla de entrenamientos
 * Gestiona múltiples entrenamientos por día con sistema de minimización
 */
export default function MainTrainingScreen() {
  // ===== ESTADOS PRINCIPALES =====
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan>(
    Object.fromEntries(days.map((d) => [d, []]))
  );
  const [selectedDay, setSelectedDay] = useState(days[todayIdx]);
  const [showSportSelector, setShowSportSelector] = useState(false);
  const [showWorkoutNamer, setShowWorkoutNamer] = useState(false);
  const [pendingSport, setPendingSport] = useState<SportType | null>(null);
  const [pendingWorkoutName, setPendingWorkoutName] = useState('');
  
  // ===== ESTADOS DE ENTRENAMIENTO ACTIVO =====
  const [activeWorkoutId, setActiveWorkoutId] = useState<string | null>(null);
  const [minimizedWorkouts, setMinimizedWorkouts] = useState<Set<string>>(new Set());
  
  // ===== ESTADOS DE TIMER Y POST-ENTRENAMIENTO =====
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [restDuration, setRestDuration] = useState(60);
  const [showIntensityModal, setShowIntensityModal] = useState(false);
  const [completingWorkoutId, setCompletingWorkoutId] = useState<string | null>(null);

  const todaysWorkouts = weeklyPlan[selectedDay] || [];
  const activeWorkout = todaysWorkouts.find(w => w.id === activeWorkoutId);

  /**
   * Genera las fechas de la semana actual para el selector de días
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
   * Obtiene información formateada del día seleccionado
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
   * Genera nombre automático para entrenamientos basado en el patrón:
   * "Entrenamiento de [DEPORTE], el [FECHA Y HORA]"
   */
  const generateDefaultWorkoutName = (sport: SportType): string => {
    const now = new Date();
    const dayInfo = getSelectedDayInfo();
    const time = now.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    return `Entrenamiento de ${SPORT_TRANSLATIONS[sport]}, el ${dayInfo} ${time}`;
  };

  /**
   * Crea sesión por defecto según el tipo de deporte
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
   * Inicia el proceso de añadir nuevo entrenamiento
   * Abre modal para editar nombre
   */
  const startAddWorkout = (sport: SportType) => {
    setPendingSport(sport);
    setPendingWorkoutName(generateDefaultWorkoutName(sport));
    setShowWorkoutNamer(true);
    setShowSportSelector(false);
  };

  /**
   * Confirma la creación del entrenamiento con nombre personalizado
   */
  const confirmAddWorkout = () => {
    if (!pendingSport) return;

    const newWorkout: Workout = {
      id: `workout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // ID único
      date: new Date().toISOString().split('T')[0],
      sport: pendingSport,
      name: pendingWorkoutName.trim() || generateDefaultWorkoutName(pendingSport),
      session: createDefaultSession(pendingSport),
      completed: false,
      createdAt: new Date().toISOString(), // Para BD futura
      updatedAt: new Date().toISOString()  // Para BD futura
    };

    setWeeklyPlan(prev => ({
      ...prev,
      [selectedDay]: [...prev[selectedDay], newWorkout]
    }));

    // Activar el nuevo entrenamiento y expandirlo
    setActiveWorkoutId(newWorkout.id);
    setMinimizedWorkouts(prev => {
      const newSet = new Set(prev);
      newSet.delete(newWorkout.id); // Asegurar que esté expandido
      return newSet;
    });

    // Limpiar estados temporales
    setShowWorkoutNamer(false);
    setPendingSport(null);
    setPendingWorkoutName('');
  };

  /**
   * Actualiza la sesión del entrenamiento activo
   */
  const updateWorkoutSession = (session: SportSession) => {
    if (!activeWorkoutId) return;

    setWeeklyPlan(prev => ({
      ...prev,
      [selectedDay]: prev[selectedDay].map(workout =>
        workout.id === activeWorkoutId
          ? { 
              ...workout, 
              session,
              updatedAt: new Date().toISOString() // Para BD futura
            }
          : workout
      )
    }));
  };

  /**
   * Elimina un entrenamiento con confirmación visual
   */
  const removeWorkout = (workoutId: string) => {
    setWeeklyPlan(prev => ({
      ...prev,
      [selectedDay]: prev[selectedDay].filter(w => w.id !== workoutId)
    }));

    // Si era el entrenamiento activo, seleccionar otro
    if (activeWorkoutId === workoutId) {
      const remainingWorkouts = todaysWorkouts.filter(w => w.id !== workoutId);
      setActiveWorkoutId(remainingWorkouts.length > 0 ? remainingWorkouts[0].id : null);
    }

    // Limpiar de entrenamientos minimizados
    setMinimizedWorkouts(prev => {
      const newSet = new Set(prev);
      newSet.delete(workoutId);
      return newSet;
    });
  };

  /**
   * Inicia el proceso de completar entrenamiento
   * Abre modal de intensidad post-entrenamiento
   */
  const startCompleteWorkout = (workoutId?: string) => {
    const targetWorkoutId = workoutId || activeWorkoutId;
    if (!targetWorkoutId) return;

    setCompletingWorkoutId(targetWorkoutId);
    setShowIntensityModal(true);
  };

  /**
   * Completa el entrenamiento con datos de intensidad
   */
  const completeWorkoutWithIntensity = (intensityData: {
    rpe: number;
    feeling: string;
    notes?: string;
  }) => {
    if (!completingWorkoutId) return;

    const completedAt = new Date().toISOString();

    setWeeklyPlan(prev => ({
      ...prev,
      [selectedDay]: prev[selectedDay].map(workout =>
        workout.id === completingWorkoutId
          ? { 
              ...workout, 
              completed: true,
              completedAt,
              updatedAt: completedAt,
              postWorkoutData: {
                ...intensityData,
                timestamp: completedAt
              } // Para análisis futuro
            }
          : workout
      )
    }));

    // Buscar siguiente entrenamiento incompleto
    const remainingIncompleteWorkouts = todaysWorkouts.filter(w => 
      w.id !== completingWorkoutId && !w.completed
    );
    
    if (remainingIncompleteWorkouts.length > 0) {
      setActiveWorkoutId(remainingIncompleteWorkouts[0].id);
    } else {
      setActiveWorkoutId(null);
    }

    // Cerrar modales
    setShowIntensityModal(false);
    setCompletingWorkoutId(null);
  };

  /**
   * Alterna el estado minimizado de un entrenamiento
   */
  const toggleWorkoutMinimized = (workoutId: string) => {
    setMinimizedWorkouts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(workoutId)) {
        newSet.delete(workoutId);
      } else {
        newSet.add(workoutId);
      }
      return newSet;
    });
  };

  /**
   * Renderiza la sesión deportiva según el tipo
   */
  const renderSportSession = (workout: Workout, isMinimized: boolean) => {
    if (isMinimized) return null;

    const session = workout.session;
    const isCompleted = workout.completed;

    switch (workout.sport) {
      case 'gym':
        return (
          <GymSession
            exercises={(session as any).data || []}
            onUpdateExercises={
              isCompleted 
                ? () => {}
                : (exercises: GymExercise[]) => 
                    updateWorkoutSession({ sport: 'gym', data: exercises })
            }
            onStartRestTimer={isCompleted ? () => {} : startRestTimer}
            onCompleteWorkout={isCompleted ? undefined : () => startCompleteWorkout(workout.id)}
            isCompleted={isCompleted}
          />
        );
      
      case 'running':
        return (
          <RunningSessionComponent
            session={(session as any).data || { type: 'long_run' }}
            onUpdateSession={
              isCompleted
                ? () => {}
                : (data: RunningSession) => 
                    updateWorkoutSession({ sport: 'running', data })
            }
            onCompleteWorkout={isCompleted ? undefined : () => startCompleteWorkout(workout.id)}
            isCompleted={isCompleted}
          />
        );
      
      case 'cycling':
        return (
          <CyclingSessionComponent
            session={(session as any).data || { type: 'endurance' }}
            onUpdateSession={
              isCompleted
                ? () => {}
                : (data: CyclingSession) => 
                    updateWorkoutSession({ sport: 'cycling', data })
            }
            onCompleteWorkout={isCompleted ? undefined : () => startCompleteWorkout(workout.id)}
            isCompleted={isCompleted}
          />
        );
      
      case 'swimming':
        return (
          <SwimmingSessionComponent
            session={(session as any).data || { type: 'endurance', poolLength: 25 }}
            onUpdateSession={
              isCompleted
                ? () => {}
                : (data: SwimmingSession) => 
                    updateWorkoutSession({ sport: 'swimming', data })
            }
            onCompleteWorkout={isCompleted ? undefined : () => startCompleteWorkout(workout.id)}
            isCompleted={isCompleted}
          />
        );
      
      default:
        return (
          <GenericSportSessionComponent
            session={(session as any).data || { type: 'training' }}
            sport={workout.sport}
            onUpdateSession={
              isCompleted
                ? () => {}
                : (data: GenericSportSession) => 
                    updateWorkoutSession({ sport: workout.sport, data })
            }
            onCompleteWorkout={isCompleted ? undefined : () => startCompleteWorkout(workout.id)}
            isCompleted={isCompleted}
          />
        );
    }
  };

  /**
   * Inicia el timer de descanso
   */
  const startRestTimer = (duration: number) => {
    setRestDuration(duration);
    setShowRestTimer(true);
  };

  /**
   * Detiene el timer de descanso
   */
  const stopRestTimer = () => {
    setShowRestTimer(false);
  };

  /**
   * Obtiene el nombre completo del día
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

  // ===== CÁLCULOS DE ESTADÍSTICAS =====
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
          {/* ===== HEADER ===== */}
          <View style={styles.header}>
            <Text style={styles.title}>Entrenamientos 💪</Text>
            <Text style={styles.subtitle}>Planifica tu semana deportiva</Text>
          </View>

          {/* ===== SELECTOR DE DÍAS ===== */}
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

          {/* ===== BARRA DE TIMER DE DESCANSO ===== */}
          {showRestTimer && (
            <RestTimerBar
              duration={restDuration}
              onComplete={stopRestTimer}
              onCancel={stopRestTimer}
            />
          )}

          {/* ===== INFORMACIÓN DEL DÍA ACTUAL ===== */}
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

          {/* ===== BOTÓN AÑADIR ENTRENAMIENTO ===== */}
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

          {/* ===== LISTA DE ENTRENAMIENTOS ===== */}
          {todaysWorkouts.map((workout) => {
            const isActive = activeWorkoutId === workout.id;
            const isMinimized = minimizedWorkouts.has(workout.id);
            
            return (
              <View key={workout.id} style={styles.workoutCard}>
                {/* Header del entrenamiento */}
                <Pressable
                  onPress={() => setActiveWorkoutId(isActive ? null : workout.id)}
                  style={styles.workoutHeader}
                >
                  <LinearGradient
                    colors={
                      isActive
                        ? SPORT_COLORS[workout.sport] as [string, string]
                        : workout.completed
                        ? ['rgba(0, 212, 170, 0.3)', 'rgba(0, 184, 148, 0.2)']
                        : ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']
                    }
                    style={[
                      styles.workoutHeaderGradient,
                      isActive && styles.workoutHeaderActive,
                      workout.completed && styles.workoutHeaderCompleted
                    ]}
                  >
                    <View style={styles.workoutHeaderContent}>
                      <View style={styles.workoutHeaderLeft}>
                        <MaterialCommunityIcons
                          name={SPORT_ICONS[workout.sport] as any}
                          size={24}
                          color={
                            isActive ? '#FFFFFF' : 
                            workout.completed ? '#00D4AA' : 
                            SPORT_COLORS[workout.sport][0]
                          }
                        />
                        <View style={styles.workoutHeaderText}>
                          <Text style={[
                            styles.workoutName,
                            isActive && styles.workoutNameActive,
                            workout.completed && styles.workoutNameCompleted
                          ]}>
                            {workout.name || `Entrenamiento de ${SPORT_TRANSLATIONS[workout.sport]}`}
                          </Text>
                          
                          {workout.completed && (
                            <View style={styles.completedBadge}>
                              <MaterialCommunityIcons
                                name="check-circle"
                                size={12}
                                color="#00D4AA"
                              />
                              <Text style={styles.completedBadgeText}>COMPLETADO</Text>
                            </View>
                          )}
                        </View>
                      </View>

                      <View style={styles.workoutHeaderActions}>
                        {/* Botón minimizar */}
                        {isActive && (
                          <Pressable
                            onPress={() => toggleWorkoutMinimized(workout.id)}
                            style={styles.minimizeBtn}
                          >
                            <MaterialCommunityIcons
                              name={isMinimized ? "window-maximize" : "window-minimize"}
                              size={20}
                              color="#B0B0C4"
                            />
                          </Pressable>
                        )}

                        {/* Botón eliminar */}
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

                        {/* Indicador expandido/colapsado */}
                        <MaterialCommunityIcons
                          name={isActive && !isMinimized ? "chevron-up" : "chevron-down"}
                          size={24}
                          color="#B0B0C4"
                        />
                      </View>
                    </View>
                  </LinearGradient>
                </Pressable>

                {/* Contenido del entrenamiento */}
                {isActive && (
                  <View style={styles.workoutContent}>
                    {renderSportSession(workout, isMinimized)}
                  </View>
                )}
              </View>
            );
          })}

          {/* ===== ESTADO VACÍO ===== */}
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

      {/* ===== MODALES ===== */}
      
      {/* Modal selector de deporte */}
      {showSportSelector && (
        <SportSelector
          onSportSelect={startAddWorkout}
          onClose={() => setShowSportSelector(false)}
        />
      )}

      {/* Modal para nombrar entrenamiento */}
      <Modal
        visible={showWorkoutNamer}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowWorkoutNamer(false)}
      >
        <View style={styles.modalOverlay}>
          <LinearGradient
            colors={['#0F0F23', '#1A1A3A', '#2D2D5F']}
            style={styles.workoutNamerModal}
          >
            <View style={styles.workoutNamerHeader}>
              <MaterialCommunityIcons
                name="pencil"
                size={24}
                color="#00D4AA"
              />
              <Text style={styles.workoutNamerTitle}>Nombre del Entrenamiento</Text>
            </View>

            <TextInput
              value={pendingWorkoutName}
              onChangeText={setPendingWorkoutName}
              style={styles.workoutNamerInput}
              placeholder="Nombre del entrenamiento..."
              placeholderTextColor="#B0B0C4"
              multiline
              maxLength={100}
              autoFocus
            />

            <Text style={styles.workoutNamerHint}>
              💡 Puedes usar el nombre automático o personalizarlo
            </Text>

            <View style={styles.workoutNamerActions}>
              <Pressable
                onPress={() => {
                  setShowWorkoutNamer(false);
                  setPendingSport(null);
                  setPendingWorkoutName('');
                }}
                style={styles.workoutNamerCancelBtn}
              >
                <Text style={styles.workoutNamerCancelText}>Cancelar</Text>
              </Pressable>

              <Pressable
                onPress={confirmAddWorkout}
                style={styles.workoutNamerConfirmBtn}
              >
                <LinearGradient
                  colors={["#00D4AA", "#00B894"]}
                  style={styles.workoutNamerConfirmGradient}
                >
                  <Text style={styles.workoutNamerConfirmText}>Crear Entrenamiento</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </LinearGradient>
        </View>
      </Modal>

      {/* Modal de intensidad post-entrenamiento */}
      {showIntensityModal && completingWorkoutId && (
        <PostWorkoutIntensity
          visible={showIntensityModal}
          onClose={() => {
            setShowIntensityModal(false);
            setCompletingWorkoutId(null);
          }}
          onSubmit={completeWorkoutWithIntensity}
          workoutName={
            todaysWorkouts.find(w => w.id === completingWorkoutId)?.name || 
            'Entrenamiento'
          }
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

  // ===== SELECTOR DE DÍAS =====
  daySelector: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },

  daySelectorGradient: {
    padding: 20,
    borderRadius: 20,
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
    borderRadius: 16,
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

  // ===== INFORMACIÓN DEL DÍA =====
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

  // ===== BOTÓN AÑADIR ENTRENAMIENTO =====
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

  // ===== TARJETAS DE ENTRENAMIENTO =====
  workoutCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 20,
    overflow: 'hidden',
  },

  workoutHeader: {
    borderRadius: 20,
    overflow: 'hidden',
  },

  workoutHeaderGradient: {
    borderRadius: 20,
  },

  workoutHeaderActive: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },

  workoutHeaderCompleted: {
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 170, 0.5)',
  },

  workoutHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },

  workoutHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },

  workoutHeaderText: {
    flex: 1,
  },

  workoutName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#B0B0C4',
    marginBottom: 4,
  },

  workoutNameActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  workoutNameCompleted: {
    color: '#00D4AA',
    fontWeight: '700',
  },

  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 212, 170, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    alignSelf: 'flex-start',
  },

  completedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#00D4AA',
    letterSpacing: 0.5,
  },

  workoutHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  minimizeBtn: {
    padding: 4,
  },

  removeWorkoutBtn: {
    padding: 4,
  },

  workoutContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },

  // ===== ESTADO VACÍO =====
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

  // ===== MODAL NOMBRAR ENTRENAMIENTO =====
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  workoutNamerModal: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
  },

  workoutNamerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },

  workoutNamerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  workoutNamerInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 8,
    minHeight: 60,
    textAlignVertical: 'top',
  },

  workoutNamerHint: {
    fontSize: 12,
    color: '#FFB84D',
    marginBottom: 20,
    fontStyle: 'italic',
  },

  workoutNamerActions: {
    flexDirection: 'row',
    gap: 12,
  },

  workoutNamerCancelBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },

  workoutNamerCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#B0B0C4',
  },

  workoutNamerConfirmBtn: {
    flex: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },

  workoutNamerConfirmGradient: {
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },

  workoutNamerConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});