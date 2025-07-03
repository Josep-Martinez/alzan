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
import AdvancedWorkoutBuilder from './AdvancedWorkoutBuilder';
import {
  CyclingSession,
  GenericSportSession,
  RunningSession,
  SportType,
  SwimmingSession
} from './sports';

/**
 * Interfaz para plan de entrenamiento estructurado
 */
interface WorkoutPlan {
  id: string;
  name: string;
  sport: 'running' | 'cycling' | 'swimming';
  steps: any[];
  estimatedDuration: number;
  estimatedDistance: number;
  createdAt: string;
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
 * Integra plantillas predefinidas y construcción personalizada
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
   * Plantillas rápidas para running
   */
  const quickTemplates = [
    {
      id: 'easy_run',
      name: 'Rodaje Suave',
      description: '30-60 min a ritmo conversacional',
      icon: 'run',
      color: '#4CAF50',
      estimatedTime: '45 min'
    },
    {
      id: 'intervals',
      name: 'Intervalos',
      description: 'Series de velocidad con descanso',
      icon: 'speedometer',
      color: '#FF5722',
      estimatedTime: '40 min'
    },
    {
      id: 'tempo',
      name: 'Tempo Run',
      description: '20 min a ritmo de umbral',
      icon: 'timer',
      color: '#FF9800',
      estimatedTime: '35 min'
    },
    {
      id: 'long_run',
      name: 'Tirada Larga',
      description: 'Carrera continua de resistencia',
      icon: 'map-marker-distance',
      color: '#00BCD4',
      estimatedTime: '90 min'
    }
  ];

  /**
   * Maneja la selección de plantilla rápida
   */
  const handleQuickTemplate = (templateId: string) => {
    const template = quickTemplates.find(t => t.id === templateId);
    if (!template) return;

    // Actualizar sesión básica
    onUpdateSession({
      ...session,
      type: templateId as any,
      plannedDuration: templateId === 'long_run' ? 90 * 60 : 
                      templateId === 'intervals' ? 40 * 60 :
                      templateId === 'tempo' ? 35 * 60 : 45 * 60
    });
  };

  /**
   * Maneja el plan de entrenamiento creado
   */
  const handleWorkoutPlan = (workoutPlan: WorkoutPlan) => {
    setCurrentWorkoutPlan(workoutPlan);
    
    // Actualizar sesión con datos del plan
    onUpdateSession({
      ...session,
      type: 'intervals', // Determinar tipo basado en los pasos
      plannedDuration: workoutPlan.estimatedDuration,
      plannedDistance: workoutPlan.estimatedDistance,
      workoutPlan: workoutPlan // Guardar plan completo para ejecución
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
          <Text style={[styles.sessionTitle, isCompleted && styles.sessionTitleCompleted]}>
            Sesión de Running {isCompleted && "- Completada"}
          </Text>
          {isCompleted && <MaterialCommunityIcons name="lock" size={16} color="#00D4AA" />}
        </View>

        {/* ===== MENSAJE DE COMPLETADO ===== */}
        {isCompleted && (
          <View style={styles.completedMessage}>
            <MaterialCommunityIcons name="trophy" size={16} color="#00D4AA" />
            <Text style={styles.completedMessageText}>
              Este entrenamiento ya fue completado. Los datos se muestran en modo solo lectura.
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

        {/* ===== PLANTILLAS RÁPIDAS ===== */}
        {!isCompleted && !currentWorkoutPlan && (
          <View style={styles.quickTemplatesSection}>
            <Text style={styles.sectionTitle}>Plantillas Rápidas</Text>
            <View style={styles.quickTemplatesGrid}>
              {quickTemplates.map((template) => (
                <Pressable
                  key={template.id}
                  onPress={() => handleQuickTemplate(template.id)}
                  style={styles.quickTemplateBtn}
                >
                  <LinearGradient
                    colors={[template.color + '20', template.color + '10']}
                    style={styles.quickTemplateGradient}
                  >
                    <MaterialCommunityIcons
                      name={template.icon as any}
                      size={20}
                      color={template.color}
                    />
                    <Text style={styles.quickTemplateName}>{template.name}</Text>
                    <Text style={styles.quickTemplateDescription}>{template.description}</Text>
                    <Text style={styles.quickTemplateTime}>{template.estimatedTime}</Text>
                  </LinearGradient>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* ===== CONSTRUCTOR AVANZADO ===== */}
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
                Constructor Avanzado de Running
              </Text>
              <MaterialCommunityIcons name="arrow-right" size={16} color="#FFFFFF" />
            </LinearGradient>
          </Pressable>
        )}

        {/* ===== INFORMACIÓN ACTUAL ===== */}
        {(session.plannedDuration || session.plannedDistance) && !currentWorkoutPlan && (
          <View style={styles.currentSessionInfo}>
            <LinearGradient
              colors={["rgba(78, 205, 196, 0.15)", "rgba(78, 205, 196, 0.08)"]}
              style={styles.currentSessionGradient}
            >
              <Text style={styles.currentSessionTitle}>Sesión Configurada</Text>
              <View style={styles.currentSessionDetails}>
                {session.plannedDuration && (
                  <Text style={styles.currentSessionDetail}>
                    ⏱️ Duración: {Math.round(session.plannedDuration / 60)} minutos
                  </Text>
                )}
                {session.plannedDistance && (
                  <Text style={styles.currentSessionDetail}>
                    📏 Distancia: {session.plannedDistance >= 1000 
                      ? `${(session.plannedDistance / 1000).toFixed(1)} km`
                      : `${session.plannedDistance} m`
                    }
                  </Text>
                )}
                <Text style={styles.currentSessionDetail}>
                  🏃‍♂️ Tipo: {session.type === 'long_run' ? 'Tirada Larga' :
                           session.type === 'intervals' ? 'Intervalos' :
                           session.type === 'tempo' ? 'Tempo Run' :
                           session.type === 'recovery' ? 'Recuperación' : 'Carrera'}
                </Text>
              </View>
            </LinearGradient>
          </View>
        )}

        {/* ===== CONSEJOS ===== */}
        <View style={styles.tipsContainer}>
          <MaterialCommunityIcons name="lightbulb-outline" size={16} color="#FFB84D" />
          <View style={styles.tipsContent}>
            <Text style={styles.tipsTitle}>Consejos para Running:</Text>
            <Text style={styles.tipsText}>🏃‍♂️ Calienta 10-15 minutos antes de empezar</Text>
            <Text style={styles.tipsText}>💧 Mantén hidratación cada 15-20 minutos</Text>
            <Text style={styles.tipsText}>👟 Usa calzado apropiado y revisa la técnica</Text>
            <Text style={styles.tipsText}>📱 Tu reloj/app registrará las métricas automáticamente</Text>
          </View>
        </View>

        {/* ===== BOTÓN COMPLETAR ===== */}
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
              colors={isReadyToComplete() ? ["#4ECDC4", "#26C6DA"] : ["#6B7280", "#4B5563"]}
              style={styles.completeWorkoutGradient}
            >
              <MaterialCommunityIcons 
                name={isReadyToComplete() ? "check-circle" : "alert-circle"} 
                size={20} 
                color="#FFFFFF" 
              />
              <Text style={styles.completeWorkoutText}>
                {isReadyToComplete() ? "Completar Running" : "Configura tu entrenamiento"}
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
 */
export function CyclingSessionComponent({ 
  session, 
  onUpdateSession, 
  onCompleteWorkout,
  isCompleted = false 
}: CyclingSessionProps) {
  const [showWorkoutBuilder, setShowWorkoutBuilder] = useState(false);
  const [currentWorkoutPlan, setCurrentWorkoutPlan] = useState<WorkoutPlan | null>(null);

  const quickTemplates = [
    {
      id: 'endurance',
      name: 'Resistencia',
      description: '60-120 min a ritmo aeróbico',
      icon: 'bike',
      color: '#00BCD4',
      estimatedTime: '90 min'
    },
    {
      id: 'intervals',
      name: 'Intervalos',
      description: 'Series de potencia con recuperación',
      icon: 'speedometer',
      color: '#FF5722',
      estimatedTime: '60 min'
    },
    {
      id: 'recovery',
      name: 'Recuperación',
      description: 'Pedaleo suave y regenerativo',
      icon: 'heart-pulse',
      color: '#4CAF50',
      estimatedTime: '45 min'
    },
    {
      id: 'indoor',
      name: 'Indoor',
      description: 'Entrenamiento en rodillo/estática',
      icon: 'home',
      color: '#9C27B0',
      estimatedTime: '60 min'
    }
  ];

  const handleQuickTemplate = (templateId: string) => {
    const template = quickTemplates.find(t => t.id === templateId);
    if (!template) return;

    onUpdateSession({
      ...session,
      type: templateId as any,
      plannedDuration: templateId === 'endurance' ? 90 * 60 : 
                      templateId === 'intervals' ? 60 * 60 :
                      templateId === 'recovery' ? 45 * 60 : 60 * 60
    });
  };

  const handleWorkoutPlan = (workoutPlan: WorkoutPlan) => {
    setCurrentWorkoutPlan(workoutPlan);
    onUpdateSession({
      ...session,
      type: 'intervals',
      plannedDuration: workoutPlan.estimatedDuration,
      plannedDistance: workoutPlan.estimatedDistance,
      workoutPlan: workoutPlan
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

        {!isCompleted && !currentWorkoutPlan && (
          <View style={styles.quickTemplatesSection}>
            <Text style={styles.sectionTitle}>Plantillas Rápidas</Text>
            <View style={styles.quickTemplatesGrid}>
              {quickTemplates.map((template) => (
                <Pressable
                  key={template.id}
                  onPress={() => handleQuickTemplate(template.id)}
                  style={styles.quickTemplateBtn}
                >
                  <LinearGradient
                    colors={[template.color + '20', template.color + '10']}
                    style={styles.quickTemplateGradient}
                  >
                    <MaterialCommunityIcons
                      name={template.icon as any}
                      size={20}
                      color={template.color}
                    />
                    <Text style={styles.quickTemplateName}>{template.name}</Text>
                    <Text style={styles.quickTemplateDescription}>{template.description}</Text>
                    <Text style={styles.quickTemplateTime}>{template.estimatedTime}</Text>
                  </LinearGradient>
                </Pressable>
              ))}
            </View>
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
                Constructor Avanzado de Ciclismo
              </Text>
              <MaterialCommunityIcons name="arrow-right" size={16} color="#FFFFFF" />
            </LinearGradient>
          </Pressable>
        )}

        <View style={styles.tipsContainer}>
          <MaterialCommunityIcons name="lightbulb-outline" size={16} color="#FFB84D" />
          <View style={styles.tipsContent}>
            <Text style={styles.tipsTitle}>Consejos para Ciclismo:</Text>
            <Text style={styles.tipsText}>🚴‍♂️ Ajusta bien la altura del sillín y manillar</Text>
            <Text style={styles.tipsText}>⚡ Controla la potencia y cadencia durante el entrenamiento</Text>
            <Text style={styles.tipsText}>🦺 Usa casco y ropa visible si sales a la carretera</Text>
            <Text style={styles.tipsText}>📱 Tu ciclocomputador registrará métricas de potencia y velocidad</Text>
          </View>
        </View>

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
                {isReadyToComplete() ? "Completar Ciclismo" : "Configura tu entrenamiento"}
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
 */
export function SwimmingSessionComponent({ 
  session, 
  onUpdateSession, 
  onCompleteWorkout,
  isCompleted = false 
}: SwimmingSessionProps) {
  const [showWorkoutBuilder, setShowWorkoutBuilder] = useState(false);
  const [currentWorkoutPlan, setCurrentWorkoutPlan] = useState<WorkoutPlan | null>(null);

  const quickTemplates = [
    {
      id: 'endurance',
      name: 'Resistencia',
      description: '1500-3000m continuos',
      icon: 'swim',
      color: '#00BCD4',
      estimatedTime: '60 min'
    },
    {
      id: 'technique',
      name: 'Técnica',
      description: 'Ejercicios de técnica y drills',
      icon: 'school',
      color: '#4CAF50',
      estimatedTime: '45 min'
    },
    {
      id: 'speed',
      name: 'Velocidad',
      description: 'Series cortas de alta intensidad',
      icon: 'speedometer',
      color: '#FF5722',
      estimatedTime: '50 min'
    },
    {
      id: 'open_water',
      name: 'Aguas Abiertas',
      description: 'Entrenamiento para mar/lago',
      icon: 'waves',
      color: '#2196F3',
      estimatedTime: '75 min'
    }
  ];

  const handleQuickTemplate = (templateId: string) => {
    const template = quickTemplates.find(t => t.id === templateId);
    if (!template) return;

    onUpdateSession({
      ...session,
      type: templateId as any,
      plannedDistance: templateId === 'endurance' ? 2000 : 
                      templateId === 'technique' ? 1200 :
                      templateId === 'speed' ? 1000 : 1500
    });
  };

  const handleWorkoutPlan = (workoutPlan: WorkoutPlan) => {
    setCurrentWorkoutPlan(workoutPlan);
    onUpdateSession({
      ...session,
      type: 'technique',
      plannedDistance: workoutPlan.estimatedDistance,
      workoutPlan: workoutPlan
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

        {!isCompleted && !currentWorkoutPlan && (
          <View style={styles.quickTemplatesSection}>
            <Text style={styles.sectionTitle}>Plantillas Rápidas</Text>
            <View style={styles.quickTemplatesGrid}>
              {quickTemplates.map((template) => (
                <Pressable
                  key={template.id}
                  onPress={() => handleQuickTemplate(template.id)}
                  style={styles.quickTemplateBtn}
                >
                  <LinearGradient
                    colors={[template.color + '20', template.color + '10']}
                    style={styles.quickTemplateGradient}
                  >
                    <MaterialCommunityIcons
                      name={template.icon as any}
                      size={20}
                      color={template.color}
                    />
                    <Text style={styles.quickTemplateName}>{template.name}</Text>
                    <Text style={styles.quickTemplateDescription}>{template.description}</Text>
                    <Text style={styles.quickTemplateTime}>{template.estimatedTime}</Text>
                  </LinearGradient>
                </Pressable>
              ))}
            </View>
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
                Constructor Avanzado de Natación
              </Text>
              <MaterialCommunityIcons name="arrow-right" size={16} color="#FFFFFF" />
            </LinearGradient>
          </Pressable>
        )}

        <View style={styles.tipsContainer}>
          <MaterialCommunityIcons name="lightbulb-outline" size={16} color="#FFB84D" />
          <View style={styles.tipsContent}>
            <Text style={styles.tipsTitle}>Consejos para Natación:</Text>
            <Text style={styles.tipsText}>🏊‍♂️ Calienta fuera del agua antes de entrar</Text>
            <Text style={styles.tipsText}>👓 Usa gafas apropiadas y ajusta bien las correas</Text>
            <Text style={styles.tipsText}>🫁 Enfócate en la respiración bilateral y técnica</Text>
            <Text style={styles.tipsText}>⏱️ Tu reloj waterproof registrará brazadas y distancia</Text>
          </View>
        </View>

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
                {isReadyToComplete() ? "Completar Natación" : "Configura tu entrenamiento"}
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

// ===== GENERIC SPORTS COMPONENT =====
interface GenericSportSessionProps {
  session: GenericSportSession;
  sport: SportType;
  onUpdateSession: (session: GenericSportSession) => void;
  onCompleteWorkout?: () => void;
  isCompleted?: boolean;
}

/**
 * Exportar el componente genérico desde el archivo separado
 * Ya está implementado en GenericSportSessionComponent.tsx
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

  // ===== PLANTILLAS RÁPIDAS =====
  quickTemplatesSection: {
    marginBottom: 16,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },

  quickTemplatesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  quickTemplateBtn: {
    width: '48%',
    borderRadius: 12,
    overflow: 'hidden',
  },

  quickTemplateGradient: {
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 100,
    justifyContent: 'center',
  },

  quickTemplateName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 8,
    textAlign: 'center',
  },

  quickTemplateDescription: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 14,
  },

  quickTemplateTime: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },

  // ===== CONSTRUCTOR AVANZADO =====
  advancedBuilderBtn: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },

  advancedBuilderGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
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

  // ===== CONSEJOS =====
  tipsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 184, 77, 0.1)',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    marginBottom: 16,
  },

  tipsContent: {
    flex: 1,
  },

  tipsTitle: {
    fontSize: 12,
    color: '#FFB84D',
    fontWeight: '600',
    marginBottom: 4,
  },

  tipsText: {
    fontSize: 11,
    color: '#FFB84D',
    lineHeight: 14,
    marginBottom: 2,
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