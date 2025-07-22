// components/sport/OtherSportsSessions.tsx - Deportes específicos con constructor avanzado integrado
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View
} from 'react-native';
import {
  CyclingSession,
  RunningSession,
  SwimmingSession
} from '../common/sports';
import AdvancedWorkoutBuilder from './AdvancedWorkoutBuilder';

/**
 * Interfaz para plan de entrenamiento estructurado
 * DATOS BD: Estructura completa para tabla workout_plans
 */
interface WorkoutPlan {
  id: string; // BD: plan_id (PRIMARY KEY)
  name: string; // BD: plan_name
  sport: 'running' | 'cycling' | 'swimming'; // BD: sport_type
  steps: any[]; // BD: plan_structure (JSON con pasos y loops)
  estimatedDuration: number; // BD: estimated_duration_seconds
  estimatedDistance: number; // BD: estimated_distance_meters
  createdAt: string; // BD: created_at
}

// ===== RUNNING COMPONENT =====
interface RunningSessionProps {
  session: RunningSession;
  onUpdateSession: (session: RunningSession) => void;
  onCompleteWorkout?: () => void;
  isCompleted?: boolean;
}

/**
 * Componente para sesiones de running con constructor avanzado
 * Integra solamente el constructor personalizado, plantillas movidas al AdvancedWorkoutBuilder
 * 
 * DATOS BD: Actualiza session_data en tabla workouts con:
 * - type: running_session_type (ENUM)
 * - plannedDuration: planned_duration_seconds (INTEGER)
 * - plannedDistance: planned_distance_meters (INTEGER)
 * - workoutPlan: workout_plan_id (FOREIGN KEY a workout_plans)
 */
export function RunningSessionComponent({ 
  session, 
  onUpdateSession, 
  onCompleteWorkout,
  isCompleted = false 
}: RunningSessionProps) {
  const [showWorkoutBuilder, setShowWorkoutBuilder] = useState(false);
  const [currentWorkoutPlan, setCurrentWorkoutPlan] = useState<WorkoutPlan | null>(null);

  /**
   * Maneja el plan de entrenamiento creado desde el constructor avanzado
   * DATOS BD: Guarda referencia al workout_plan_id en session_data
   */
  const handleWorkoutPlan = (workoutPlan: WorkoutPlan) => {
    setCurrentWorkoutPlan(workoutPlan);
    
    // Actualizar sesión con datos del plan
    onUpdateSession({
      ...session,
      type: 'interval', // Determinar tipo basado en los pasos del plan
      plannedDuration: workoutPlan.estimatedDuration, // BD: planned_duration_seconds
      plannedDistance: workoutPlan.estimatedDistance, // BD: planned_distance_meters
    });
    
    setShowWorkoutBuilder(false);
  };

  /**
   * Verifica si el entrenamiento está listo para completar
   */
  const isReadyToComplete = () => {
    return session.plannedDuration || session.plannedDistance || currentWorkoutPlan;
  };

  return (
    <View style={styles.sessionContainer}>
      <LinearGradient
        colors={
          isCompleted
            ? ["rgba(78, 205, 196, 0.2)", "rgba(78, 205, 196, 0.1)"]
            : ["#2D2D5F", "#3D3D7F"]
        }
        style={styles.sessionGradient}
      >
        {/* ===== HEADER ===== */}
        <View style={styles.sessionHeader}>
          <MaterialCommunityIcons name="run" size={24} color="#4ECDC4" />
          <Text
            style={[
              styles.sessionTitle,
              isCompleted && styles.sessionTitleCompleted,
            ]}
          >
            Sesión de Running {isCompleted && "- Completada"}
          </Text>
          {isCompleted && (
            <MaterialCommunityIcons name="lock" size={16} color="#00D4AA" />
          )}
        </View>

        {/* ===== MENSAJE DE COMPLETADO ===== */}
        {isCompleted && (
          <View style={styles.completedMessage}>
            <MaterialCommunityIcons name="trophy" size={16} color="#00D4AA" />
            <Text style={styles.completedMessageText}>
              Este entrenamiento ya fue completado. Los datos se muestran en
              modo solo lectura.
            </Text>
          </View>
        )}

        {/* ===== PLAN DE ENTRENAMIENTO ACTIVO ===== */}
        {currentWorkoutPlan && (
          <View style={styles.activeWorkoutPlan}>
            <LinearGradient
              colors={["#4ECDC4", "#26C6DA"]}
              style={styles.activeWorkoutPlanGradient}
            >
              <View style={styles.workoutPlanHeader}>
                <MaterialCommunityIcons
                  name="playlist-check"
                  size={20}
                  color="#FFFFFF"
                />
                <Text style={styles.workoutPlanName}>
                  {currentWorkoutPlan.name}
                </Text>
              </View>

              <View style={styles.workoutPlanStats}>
                <View style={styles.workoutPlanStat}>
                  <MaterialCommunityIcons
                    name="clock"
                    size={14}
                    color="#FFFFFF"
                  />
                  <Text style={styles.workoutPlanStatText}>
                    {Math.round(currentWorkoutPlan.estimatedDuration / 60)} min
                  </Text>
                </View>
                <View style={styles.workoutPlanStat}>
                  <MaterialCommunityIcons
                    name="map-marker-distance"
                    size={14}
                    color="#FFFFFF"
                  />
                  <Text style={styles.workoutPlanStatText}>
                    {currentWorkoutPlan.estimatedDistance >= 1000
                      ? `${(
                          currentWorkoutPlan.estimatedDistance / 1000
                        ).toFixed(1)} km`
                      : `${currentWorkoutPlan.estimatedDistance} m`}
                  </Text>
                </View>
                <View style={styles.workoutPlanStat}>
                  <MaterialCommunityIcons
                    name="format-list-numbered"
                    size={14}
                    color="#FFFFFF"
                  />
                  <Text style={styles.workoutPlanStatText}>
                    {currentWorkoutPlan.steps.length} pasos
                  </Text>
                </View>
              </View>

              {!isCompleted && (
                <Pressable
                  onPress={() => setCurrentWorkoutPlan(null)}
                  style={styles.removeWorkoutPlanBtn}
                >
                  <MaterialCommunityIcons
                    name="close"
                    size={16}
                    color="#FFFFFF"
                  />
                  <Text style={styles.removeWorkoutPlanText}>Quitar Plan</Text>
                </Pressable>
              )}
            </LinearGradient>
          </View>
        )}

        {/* ===== CONSTRUCTOR AVANZADO (ÚNICO BOTÓN) ===== */}
        {!isCompleted && (
          <Pressable
            onPress={() => setShowWorkoutBuilder(true)}
            style={styles.advancedBuilderBtn}
          >
            <LinearGradient
              colors={["#4ECDC4", "#26C6DA"]}
              style={styles.advancedBuilderGradient}
            >
              <MaterialCommunityIcons name="cog" size={20} color="#FFFFFF" />
              <Text style={styles.advancedBuilderText}>
                Crear Entrenamiento de Running
              </Text>
              <MaterialCommunityIcons
                name="arrow-right"
                size={16}
                color="#FFFFFF"
              />
            </LinearGradient>
          </Pressable>
        )}

        {/* ===== INFORMACIÓN ACTUAL ===== */}
        {(session.plannedDuration || session.plannedDistance) && !currentWorkoutPlan && (
          <View style={styles.currentSessionInfo}>
            <LinearGradient
              colors={["#4ECDC4", "#26C6DA"]}
              style={styles.currentSessionGradient}
            >
              <Text style={styles.currentSessionTitle}>Sesión Configurada</Text>
              <View style={styles.currentSessionDetails}>
                {session.plannedDuration && (
                  <Text style={styles.currentSessionDetail}>
                    {`⏱️ Duración: ${Math.round(session.plannedDuration / 60)} minutos`}
                  </Text>
                )}
                {session.plannedDistance && (
                  <Text style={styles.currentSessionDetail}>
                    {`📏 Distancia: ${session.plannedDistance >= 1000 
                      ? `${(session.plannedDistance / 1000).toFixed(1)} km`
                      : `${session.plannedDistance} m`
                    }`}
                  </Text>
                )}
                <Text style={styles.currentSessionDetail}>
                  {`🏃‍♂️ Tipo: ${session.type === 'long_run' ? 'Tirada Larga' :
                           session.type === 'interval' ? 'Intervalos' :
                           session.type === 'tempo' ? 'Tempo Run' :
                           session.type === 'recovery' ? 'Recuperación' : 'Carrera'}`}
                </Text>
              </View>
            </LinearGradient>
          </View>
        )}

        {/* ===== BOTÓN COMPLETAR ===== */}
        {!isCompleted && (
          <Pressable
            onPress={() => onCompleteWorkout?.()}
            style={[
              styles.completeWorkoutBtn,
              !isReadyToComplete() && styles.completeWorkoutBtnDisabled,
            ]}
            disabled={!isReadyToComplete()}
          >
            <LinearGradient
              colors={
                isReadyToComplete()
                  ? ["#4ECDC4", "#26C6DA"]
                  : ["#6B7280", "#4B5563"]
              }
              style={styles.completeWorkoutGradient}
            >
              <MaterialCommunityIcons
                name={isReadyToComplete() ? "check-circle" : "alert-circle"}
                size={20}
                color="#FFFFFF"
              />
              <Text style={styles.completeWorkoutText}>
                {isReadyToComplete()
                  ? "Completar Running"
                  : "Crea tu entrenamiento arriba"}
              </Text>
            </LinearGradient>
          </Pressable>
        )}

        {/* ===== MODAL CONSTRUCTOR AVANZADO ===== */}
        <AdvancedWorkoutBuilder
          sport="running"
          visible={showWorkoutBuilder}
          onClose={() => setShowWorkoutBuilder(false)}
          onSave={handleWorkoutPlan}
        />
      </LinearGradient>
    </View>
  );
}

// ===== CYCLING COMPONENT =====
interface CyclingSessionProps {
  session: CyclingSession;
  onUpdateSession: (session: CyclingSession) => void;
  onCompleteWorkout?: () => void;
  isCompleted?: boolean;
}

/**
 * Componente para sesiones de ciclismo con constructor avanzado
 * DATOS BD: Similar estructura a Running pero para cycling_session_type
 */
export function CyclingSessionComponent({ 
  session, 
  onUpdateSession, 
  onCompleteWorkout,
  isCompleted = false 
}: CyclingSessionProps) {
  const [showWorkoutBuilder, setShowWorkoutBuilder] = useState(false);
  const [currentWorkoutPlan, setCurrentWorkoutPlan] = useState<WorkoutPlan | null>(null);

  const handleWorkoutPlan = (workoutPlan: WorkoutPlan) => {
    setCurrentWorkoutPlan(workoutPlan);
    onUpdateSession({
      ...session,
      type: 'interval',
      plannedDuration: workoutPlan.estimatedDuration,
      plannedDistance: workoutPlan.estimatedDistance
    });
    setShowWorkoutBuilder(false);
  };

  const isReadyToComplete = () => {
    return session.plannedDuration || session.plannedDistance || currentWorkoutPlan;
  };

  return (
    <View style={styles.sessionContainer}>
      <LinearGradient
        colors={
          isCompleted 
            ? ["rgba(69, 183, 209, 0.2)", "rgba(33, 150, 243, 0.1)"]
            : ["#2D2D5F", "#3D3D7F"]
        }
        style={styles.sessionGradient}
      >
        <View style={styles.sessionHeader}>
          <MaterialCommunityIcons name="bike" size={24} color="#45B7D1" />
          <Text style={[styles.sessionTitle, isCompleted && styles.sessionTitleCompleted]}>
            Sesión de Ciclismo {isCompleted && "- Completada"}
          </Text>
          {isCompleted && <MaterialCommunityIcons name="lock" size={16} color="#00D4AA" />}
        </View>

        {isCompleted && (
          <View style={styles.completedMessage}>
            <MaterialCommunityIcons name="trophy" size={16} color="#00D4AA" />
            <Text style={styles.completedMessageText}>
              Este entrenamiento ya fue completado. Los datos se muestran en modo solo lectura.
            </Text>
          </View>
        )}

        {currentWorkoutPlan && (
          <View style={styles.activeWorkoutPlan}>
            <LinearGradient
              colors={["#45B7D1", "#2196F3"]}
              style={styles.activeWorkoutPlanGradient}
            >
              <View style={styles.workoutPlanHeader}>
                <MaterialCommunityIcons name="playlist-check" size={20} color="#FFFFFF" />
                <Text style={styles.workoutPlanName}>{currentWorkoutPlan.name}</Text>
              </View>
              
              <View style={styles.workoutPlanStats}>
                <View style={styles.workoutPlanStat}>
                  <MaterialCommunityIcons name="clock" size={14} color="#FFFFFF" />
                  <Text style={styles.workoutPlanStatText}>
                    {Math.round(currentWorkoutPlan.estimatedDuration / 60)} min
                  </Text>
                </View>
                <View style={styles.workoutPlanStat}>
                  <MaterialCommunityIcons name="map-marker-distance" size={14} color="#FFFFFF" />
                  <Text style={styles.workoutPlanStatText}>
                    {currentWorkoutPlan.estimatedDistance >= 1000 
                      ? `${(currentWorkoutPlan.estimatedDistance / 1000).toFixed(1)} km`
                      : `${currentWorkoutPlan.estimatedDistance} m`
                    }
                  </Text>
                </View>
                <View style={styles.workoutPlanStat}>
                  <MaterialCommunityIcons name="format-list-numbered" size={14} color="#FFFFFF" />
                  <Text style={styles.workoutPlanStatText}>
                    {currentWorkoutPlan.steps.length} pasos
                  </Text>
                </View>
              </View>

              {!isCompleted && (
                <Pressable
                  onPress={() => setCurrentWorkoutPlan(null)}
                  style={styles.removeWorkoutPlanBtn}
                >
                  <MaterialCommunityIcons name="close" size={16} color="#FFFFFF" />
                  <Text style={styles.removeWorkoutPlanText}>Quitar Plan</Text>
                </Pressable>
              )}
            </LinearGradient>
          </View>
        )}

        {!isCompleted && (
          <Pressable 
            onPress={() => setShowWorkoutBuilder(true)} 
            style={styles.advancedBuilderBtn}
          >
            <LinearGradient 
              colors={["#45B7D1", "#2196F3"]} 
              style={styles.advancedBuilderGradient}
            >
              <MaterialCommunityIcons name="cog" size={20} color="#FFFFFF" />
              <Text style={styles.advancedBuilderText}>
                Crear Entrenamiento de Ciclismo
              </Text>
              <MaterialCommunityIcons name="arrow-right" size={16} color="#FFFFFF" />
            </LinearGradient>
          </Pressable>
        )}

        {!isCompleted && (
          <Pressable 
            onPress={() => onCompleteWorkout?.()} 
            style={[
              styles.completeWorkoutBtn,
              !isReadyToComplete() && styles.completeWorkoutBtnDisabled
            ]}
            disabled={!isReadyToComplete()}
          >
            <LinearGradient
              colors={isReadyToComplete() ? ["#45B7D1", "#2196F3"] : ["#6B7280", "#4B5563"]}
              style={styles.completeWorkoutGradient}
            >
              <MaterialCommunityIcons 
                name={isReadyToComplete() ? "check-circle" : "alert-circle"} 
                size={20} 
                color="#FFFFFF" 
              />
              <Text style={styles.completeWorkoutText}>
                {isReadyToComplete() ? "Completar Ciclismo" : "Crea tu entrenamiento arriba"}
              </Text>
            </LinearGradient>
          </Pressable>
        )}

        <AdvancedWorkoutBuilder
          sport="cycling"
          visible={showWorkoutBuilder}
          onClose={() => setShowWorkoutBuilder(false)}
          onSave={handleWorkoutPlan}
        />
      </LinearGradient>
    </View>
  );
}

// ===== SWIMMING COMPONENT =====
interface SwimmingSessionProps {
  session: SwimmingSession;
  onUpdateSession: (session: SwimmingSession) => void;
  onCompleteWorkout?: () => void;
  isCompleted?: boolean;
}

/**
 * Componente para sesiones de natación con constructor avanzado
 * DATOS BD: Similar estructura para swimming_session_type
 */
export function SwimmingSessionComponent({ 
  session, 
  onUpdateSession, 
  onCompleteWorkout,
  isCompleted = false 
}: SwimmingSessionProps) {
  const [showWorkoutBuilder, setShowWorkoutBuilder] = useState(false);
  const [currentWorkoutPlan, setCurrentWorkoutPlan] = useState<WorkoutPlan | null>(null);

  const handleWorkoutPlan = (workoutPlan: WorkoutPlan) => {
    setCurrentWorkoutPlan(workoutPlan);
    onUpdateSession({
      ...session,
      type: 'technique',
      plannedDistance: workoutPlan.estimatedDistance
    });
    setShowWorkoutBuilder(false);
  };

  const isReadyToComplete = () => {
    return session.plannedDistance || currentWorkoutPlan;
  };

  return (
    <View style={styles.sessionContainer}>
      <LinearGradient
        colors={
          isCompleted 
            ? ["rgba(150, 206, 180, 0.2)", "rgba(76, 175, 80, 0.1)"]
            : ["#2D2D5F", "#3D3D7F"]
        }
        style={styles.sessionGradient}
      >
        <View style={styles.sessionHeader}>
          <MaterialCommunityIcons name="swim" size={24} color="#96CEB4" />
          <Text style={[styles.sessionTitle, isCompleted && styles.sessionTitleCompleted]}>
            Sesión de Natación {isCompleted && "- Completada"}
          </Text>
          {isCompleted && <MaterialCommunityIcons name="lock" size={16} color="#00D4AA" />}
        </View>

        {isCompleted && (
          <View style={styles.completedMessage}>
            <MaterialCommunityIcons name="trophy" size={16} color="#00D4AA" />
            <Text style={styles.completedMessageText}>
              Este entrenamiento ya fue completado. Los datos se muestran en modo solo lectura.
            </Text>
          </View>
        )}

        {currentWorkoutPlan && (
          <View style={styles.activeWorkoutPlan}>
            <LinearGradient
              colors={["#96CEB4", "#4CAF50"]}
              style={styles.activeWorkoutPlanGradient}
            >
              <View style={styles.workoutPlanHeader}>
                <MaterialCommunityIcons name="playlist-check" size={20} color="#FFFFFF" />
                <Text style={styles.workoutPlanName}>{currentWorkoutPlan.name}</Text>
              </View>
              
              <View style={styles.workoutPlanStats}>
                <View style={styles.workoutPlanStat}>
                  <MaterialCommunityIcons name="clock" size={14} color="#FFFFFF" />
                  <Text style={styles.workoutPlanStatText}>
                    {Math.round(currentWorkoutPlan.estimatedDuration / 60)} min
                  </Text>
                </View>
                <View style={styles.workoutPlanStat}>
                  <MaterialCommunityIcons name="map-marker-distance" size={14} color="#FFFFFF" />
                  <Text style={styles.workoutPlanStatText}>
                    {currentWorkoutPlan.estimatedDistance >= 1000 
                      ? `${(currentWorkoutPlan.estimatedDistance / 1000).toFixed(1)} km`
                      : `${currentWorkoutPlan.estimatedDistance} m`
                    }
                  </Text>
                </View>
                <View style={styles.workoutPlanStat}>
                  <MaterialCommunityIcons name="format-list-numbered" size={14} color="#FFFFFF" />
                  <Text style={styles.workoutPlanStatText}>
                    {currentWorkoutPlan.steps.length} pasos
                  </Text>
                </View>
              </View>

              {!isCompleted && (
                <Pressable
                  onPress={() => setCurrentWorkoutPlan(null)}
                  style={styles.removeWorkoutPlanBtn}
                >
                  <MaterialCommunityIcons name="close" size={16} color="#FFFFFF" />
                  <Text style={styles.removeWorkoutPlanText}>Quitar Plan</Text>
                </Pressable>
              )}
            </LinearGradient>
          </View>
        )}

        {!isCompleted && (
          <Pressable 
            onPress={() => setShowWorkoutBuilder(true)} 
            style={styles.advancedBuilderBtn}
          >
            <LinearGradient 
              colors={["#96CEB4", "#4CAF50"]} 
              style={styles.advancedBuilderGradient}
            >
              <MaterialCommunityIcons name="cog" size={20} color="#FFFFFF" />
              <Text style={styles.advancedBuilderText}>
                Crear Entrenamiento de Natación
              </Text>
              <MaterialCommunityIcons name="arrow-right" size={16} color="#FFFFFF" />
            </LinearGradient>
          </Pressable>
        )}

        {!isCompleted && (
          <Pressable 
            onPress={() => onCompleteWorkout?.()} 
            style={[
              styles.completeWorkoutBtn,
              !isReadyToComplete() && styles.completeWorkoutBtnDisabled
            ]}
            disabled={!isReadyToComplete()}
          >
            <LinearGradient
              colors={isReadyToComplete() ? ["#96CEB4", "#4CAF50"] : ["#6B7280", "#4B5563"]}
              style={styles.completeWorkoutGradient}
            >
              <MaterialCommunityIcons 
                name={isReadyToComplete() ? "check-circle" : "alert-circle"} 
                size={20} 
                color="#FFFFFF" 
              />
              <Text style={styles.completeWorkoutText}>
                {isReadyToComplete() ? "Completar Natación" : "Crea tu entrenamiento arriba"}
              </Text>
            </LinearGradient>
          </Pressable>
        )}

        <AdvancedWorkoutBuilder
          sport="swimming"
          visible={showWorkoutBuilder}
          onClose={() => setShowWorkoutBuilder(false)}
          onSave={handleWorkoutPlan}
        />
      </LinearGradient>
    </View>
  );
}
/**
 * Exportar el componente genérico desde el archivo separado
 * Ya está implementado en GenericSportSessionComponent.tsx (actualizado)
 */
export { default as GenericSportSessionComponent } from './GenericSportSessionComponent';

const styles = StyleSheet.create({
  sessionContainer: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },

  sessionGradient: {
    padding: 20,
    borderRadius: 20,
  },

  // ===== HEADER =====
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },

  sessionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
  },

  sessionTitleCompleted: {
    color: '#00D4AA',
  },

  completedMessage: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: 'rgba(0, 212, 170, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 170, 0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  completedMessageText: {
    flex: 1,
    fontSize: 12,
    color: '#00D4AA',
    fontWeight: '600',
  },

  // ===== PLAN ACTIVO =====
  activeWorkoutPlan: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },

  activeWorkoutPlanGradient: {
    padding: 16,
    borderRadius: 16,
  },

  workoutPlanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },

  workoutPlanName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
  },

  workoutPlanStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },

  workoutPlanStat: {
    alignItems: 'center',
    gap: 4,
  },

  workoutPlanStatText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
  },

  removeWorkoutPlanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    paddingVertical: 8,
    gap: 4,
  },

  removeWorkoutPlanText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // ===== CONSTRUCTOR AVANZADO (ÚNICO) =====
  advancedBuilderBtn: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },

  advancedBuilderGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },

  advancedBuilderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },

  // ===== SESIÓN ACTUAL =====
  currentSessionInfo: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },

  currentSessionGradient: {
    padding: 16,
    borderRadius: 16,
  },

  currentSessionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4ECDC4',
    marginBottom: 8,
  },

  currentSessionDetails: {
    gap: 4,
  },

  currentSessionDetail: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '500',
  },

  // ===== BOTÓN COMPLETAR =====
  completeWorkoutBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
  },

  completeWorkoutBtnDisabled: {
    opacity: 0.6,
  },

  completeWorkoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
  },

  completeWorkoutText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});