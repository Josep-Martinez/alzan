// components/sport/OtherSportsSessions.tsx - Con modo solo lectura para entrenamientos completados
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import {
  CyclingSession,
  GenericSportSession,
  RunningSession,
  SportType,
  SwimmingSession
} from './sports';

interface RunningSessionProps {
  session: RunningSession;
  onUpdateSession: (session: RunningSession) => void;
  onCompleteWorkout?: () => void;
  isCompleted?: boolean; // Nueva prop para modo solo lectura
}

export function RunningSessionComponent({ 
  session, 
  onUpdateSession, 
  onCompleteWorkout,
  isCompleted = false 
}: RunningSessionProps) {
  
  /**
   * Función para actualizar datos de intervalos
   * Solo funciona si no está completado
   */
  const updateIntervalData = (field: keyof NonNullable<RunningSession['intervalData']>, value: number) => {
    if (isCompleted) return; // No permitir cambios si está completado
    
    const currentIntervalData = session.intervalData || {
      workDistance: 0,
      restDistance: 0,
      repetitions: 0
    };
    
    onUpdateSession({
      ...session,
      intervalData: {
        ...currentIntervalData,
        [field]: value
      }
    });
  };

  /**
   * Función para completar entrenamiento - Sin alertas, solo callback
   * Solo funciona si no está completado
   */
  const handleCompleteWorkout = () => {
    if (!session.plannedDistance && !session.plannedDuration) return;
    if (isCompleted) return; // No permitir si ya está completado
    onCompleteWorkout?.();
  };

  // Verificar si el entrenamiento está listo para completar
  const isReadyToComplete = session.plannedDistance || session.plannedDuration;

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
        {/* Header con candado para entrenamientos completados */}
        <View style={styles.sessionHeader}>
          <MaterialCommunityIcons name="run" size={24} color="#4ECDC4" />
          <Text style={[
            styles.sessionTitle,
            isCompleted && styles.sessionTitleCompleted
          ]}>
            Sesión de Running {isCompleted && "- Completada"}
          </Text>
          {/* Icono de candado para entrenamientos completados */}
          {isCompleted && (
            <MaterialCommunityIcons
              name="lock"
              size={16}
              color="#00D4AA"
              style={styles.lockIcon}
            />
          )}
        </View>

        {/* Mensaje mejorado para entrenamientos completados */}
        {isCompleted && (
          <View style={styles.completedMessage}>
            <MaterialCommunityIcons name="trophy" size={16} color="#00D4AA" />
            <Text style={styles.completedMessageText}>
              Este entrenamiento ya fue completado. Los datos se muestran en modo solo lectura.
            </Text>
          </View>
        )}

        {/* Type Selector */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Tipo de Entrenamiento</Text>
          <View style={styles.typeSelector}>
            {[
              { value: 'long_run', label: 'Tirada Larga', icon: 'run-fast' },
              { value: 'intervals', label: 'Series/Intervalos', icon: 'speedometer' },
              { value: 'tempo', label: 'Tempo', icon: 'heart' },
              { value: 'recovery', label: 'Recuperación', icon: 'walk' },
              { value: 'race', label: 'Competición', icon: 'trophy' }
            ].map((type) => (
              <Pressable
                key={type.value}
                onPress={() => !isCompleted && onUpdateSession({ ...session, type: type.value as any })}
                style={[
                  styles.typeChip,
                  session.type === type.value && styles.typeChipSelected,
                  isCompleted && styles.chipDisabled
                ]}
                disabled={isCompleted}
              >
                <MaterialCommunityIcons
                  name={type.icon as any}
                  size={16}
                  color={session.type === type.value ? '#FFFFFF' : '#4ECDC4'}
                />
                <Text style={[
                  styles.typeChipText,
                  session.type === type.value && styles.typeChipTextSelected
                ]}>
                  {type.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Distance and Duration */}
        <View style={styles.inputRow}>
          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>Distancia Planificada</Text>
            <View style={styles.inputWithUnit}>
              <TextInput
                value={session.plannedDistance?.toString() || ''}
                onChangeText={(val) => !isCompleted && onUpdateSession({ 
                  ...session, 
                  plannedDistance: val ? parseFloat(val) : undefined 
                })}
                keyboardType="numeric"
                style={[
                  styles.textInput,
                  isCompleted && styles.inputDisabled
                ]}
                placeholder="10"
                placeholderTextColor="#B0B0C4"
                editable={!isCompleted}
              />
              <Text style={styles.unitLabel}>km</Text>
            </View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>Duración Estimada</Text>
            <View style={styles.inputWithUnit}>
              <TextInput
                value={session.plannedDuration?.toString() || ''}
                onChangeText={(val) => !isCompleted && onUpdateSession({ 
                  ...session, 
                  plannedDuration: val ? parseFloat(val) : undefined 
                })}
                keyboardType="numeric"
                style={[
                  styles.textInput,
                  isCompleted && styles.inputDisabled
                ]}
                placeholder="60"
                placeholderTextColor="#B0B0C4"
                editable={!isCompleted}
              />
              <Text style={styles.unitLabel}>min</Text>
            </View>
          </View>
        </View>

        {/* Interval Data for Series */}
        {session.type === 'intervals' && (
          <View style={styles.intervalContainer}>
            <View style={styles.intervalHeader}>
              <MaterialCommunityIcons
                name="speedometer"
                size={20}
                color="#4ECDC4"
              />
              <Text style={styles.intervalTitle}>Configuración de Series</Text>
            </View>
            
            <View style={styles.inputRow}>
              <View style={styles.inputGroup}>
                <Text style={styles.subFieldLabel}>Distancia de Trabajo</Text>
                <View style={styles.inputWithUnit}>
                  <TextInput
                    value={session.intervalData?.workDistance?.toString() || ''}
                    onChangeText={(val) => updateIntervalData('workDistance', val ? parseFloat(val) : 0)}
                    keyboardType="numeric"
                    style={[
                      styles.textInput,
                      isCompleted && styles.inputDisabled
                    ]}
                    placeholder="400"
                    placeholderTextColor="#B0B0C4"
                    editable={!isCompleted}
                  />
                  <Text style={styles.unitLabel}>m</Text>
                </View>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.subFieldLabel}>Descanso</Text>
                <View style={styles.inputWithUnit}>
                  <TextInput
                    value={session.intervalData?.restDistance?.toString() || ''}
                    onChangeText={(val) => updateIntervalData('restDistance', val ? parseFloat(val) : 0)}
                    keyboardType="numeric"
                    style={[
                      styles.textInput,
                      isCompleted && styles.inputDisabled
                    ]}
                    placeholder="200"
                    placeholderTextColor="#B0B0C4"
                    editable={!isCompleted}
                  />
                  <Text style={styles.unitLabel}>m</Text>
                </View>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.subFieldLabel}>Repeticiones</Text>
                <TextInput
                  value={session.intervalData?.repetitions?.toString() || ''}
                  onChangeText={(val) => updateIntervalData('repetitions', val ? parseInt(val) : 0)}
                  keyboardType="numeric"
                  style={[
                    styles.textInput,
                    isCompleted && styles.inputDisabled
                  ]}
                  placeholder="8"
                  placeholderTextColor="#B0B0C4"
                  editable={!isCompleted}
                />
              </View>
            </View>

            {/* Interval Summary */}
            {session.intervalData && session.intervalData.workDistance > 0 && session.intervalData.repetitions > 0 && (
              <View style={styles.intervalSummary}>
                <Text style={styles.summaryText}>
                  Total: {((session.intervalData.workDistance + session.intervalData.restDistance) * session.intervalData.repetitions / 1000).toFixed(1)}km
                  ({session.intervalData.repetitions} × {session.intervalData.workDistance}m + {session.intervalData.restDistance}m)
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Tips based on type */}
        <View style={styles.tipsContainer}>
          <MaterialCommunityIcons name="lightbulb-outline" size={16} color="#FFB84D" />
          <Text style={styles.tipsText}>
            {session.type === 'long_run' && 'Mantén un ritmo conversacional durante toda la carrera'}
            {session.type === 'intervals' && 'Calienta bien antes de hacer las series intensas'}
            {session.type === 'tempo' && 'Corre a un ritmo "cómodamente duro" durante la sesión'}
            {session.type === 'recovery' && 'Mantén un ritmo muy suave, priorizando la recuperación'}
            {session.type === 'race' && 'Descansa bien los días previos y calienta adecuadamente'}
          </Text>
        </View>

        {/* Complete Workout Button - Solo si no está completado */}
        {!isCompleted && (
          <Pressable 
            onPress={handleCompleteWorkout}
            style={[
              styles.completeWorkoutBtn,
              !isReadyToComplete && styles.completeWorkoutBtnDisabled
            ]}
          >
            <LinearGradient
              colors={isReadyToComplete ? ["#4ECDC4", "#26C6DA"] : ["#6B7280", "#4B5563"]}
              style={styles.completeWorkoutGradient}
            >
              <MaterialCommunityIcons 
                name={isReadyToComplete ? "check-circle" : "alert-circle"} 
                size={20} 
                color="#FFFFFF" 
              />
              <Text style={styles.completeWorkoutText}>
                {isReadyToComplete ? "Completar Running" : "Añade distancia o duración"}
              </Text>
            </LinearGradient>
          </Pressable>
        )}
      </LinearGradient>
    </View>
  );
}

interface CyclingSessionProps {
  session: CyclingSession;
  onUpdateSession: (session: CyclingSession) => void;
  onCompleteWorkout?: () => void;
  isCompleted?: boolean;
}

export function CyclingSessionComponent({ 
  session, 
  onUpdateSession, 
  onCompleteWorkout,
  isCompleted = false 
}: CyclingSessionProps) {
  
  /**
   * Función para completar entrenamiento - Sin alertas, solo callback
   */
  const handleCompleteWorkout = () => {
    if (!session.plannedDistance && !session.plannedDuration) return;
    if (isCompleted) return;
    onCompleteWorkout?.();
  };

  const isReadyToComplete = session.plannedDistance || session.plannedDuration;

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
        {/* Header con candado para entrenamientos completados */}
        <View style={styles.sessionHeader}>
          <MaterialCommunityIcons name="bike" size={24} color="#45B7D1" />
          <Text style={[
            styles.sessionTitle,
            isCompleted && styles.sessionTitleCompleted
          ]}>
            Sesión de Ciclismo {isCompleted && "- Completada"}
          </Text>
          {/* Icono de candado para entrenamientos completados */}
          {isCompleted && (
            <MaterialCommunityIcons
              name="lock"
              size={16}
              color="#00D4AA"
              style={styles.lockIcon}
            />
          )}
        </View>

        {/* Mensaje mejorado para entrenamientos completados */}
        {isCompleted && (
          <View style={styles.completedMessage}>
            <MaterialCommunityIcons name="trophy" size={16} color="#00D4AA" />
            <Text style={styles.completedMessageText}>
              Este entrenamiento ya fue completado. Los datos se muestran en modo solo lectura.
            </Text>
          </View>
        )}

        {/* Type Selector */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Tipo de Entrenamiento</Text>
          <View style={styles.typeSelector}>
            {[
              { value: 'endurance', label: 'Resistencia', icon: 'bike' },
              { value: 'intervals', label: 'Intervalos', icon: 'speedometer' },
              { value: 'recovery', label: 'Recuperación', icon: 'bike-fast' },
              { value: 'indoor', label: 'Bici Estática', icon: 'home' }
            ].map((type) => (
              <Pressable
                key={type.value}
                onPress={() => !isCompleted && onUpdateSession({ ...session, type: type.value as any })}
                style={[
                  styles.typeChip,
                  session.type === type.value && styles.typeChipSelected,
                  isCompleted && styles.chipDisabled
                ]}
                disabled={isCompleted}
              >
                <MaterialCommunityIcons
                  name={type.icon as any}
                  size={16}
                  color={session.type === type.value ? '#FFFFFF' : '#45B7D1'}
                />
                <Text style={[
                  styles.typeChipText,
                  session.type === type.value && styles.typeChipTextSelected
                ]}>
                  {type.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Distance and Duration */}
        <View style={styles.inputRow}>
          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>
              {session.type === 'indoor' ? 'Duración' : 'Distancia Planificada'}
            </Text>
            {session.type === 'indoor' ? (
              <View style={styles.inputWithUnit}>
                <TextInput
                  value={session.plannedDuration?.toString() || ''}
                  onChangeText={(val) => !isCompleted && onUpdateSession({ 
                    ...session, 
                    plannedDuration: val ? parseFloat(val) : undefined 
                  })}
                  keyboardType="numeric"
                  style={[
                    styles.textInput,
                    isCompleted && styles.inputDisabled
                  ]}
                  placeholder="45"
                  placeholderTextColor="#B0B0C4"
                  editable={!isCompleted}
                />
                <Text style={styles.unitLabel}>min</Text>
              </View>
            ) : (
              <View style={styles.inputWithUnit}>
                <TextInput
                  value={session.plannedDistance?.toString() || ''}
                  onChangeText={(val) => !isCompleted && onUpdateSession({ 
                    ...session, 
                    plannedDistance: val ? parseFloat(val) : undefined 
                  })}
                  keyboardType="numeric"
                  style={[
                    styles.textInput,
                    isCompleted && styles.inputDisabled
                  ]}
                  placeholder="30"
                  placeholderTextColor="#B0B0C4"
                  editable={!isCompleted}
                />
                <Text style={styles.unitLabel}>km</Text>
              </View>
            )}
          </View>
          
          {session.type !== 'indoor' && (
            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>Duración Estimada</Text>
              <View style={styles.inputWithUnit}>
                <TextInput
                  value={session.plannedDuration?.toString() || ''}
                  onChangeText={(val) => !isCompleted && onUpdateSession({ 
                    ...session, 
                    plannedDuration: val ? parseFloat(val) : undefined 
                  })}
                  keyboardType="numeric"
                  style={[
                    styles.textInput,
                    isCompleted && styles.inputDisabled
                  ]}
                  placeholder="90"
                  placeholderTextColor="#B0B0C4"
                  editable={!isCompleted}
                />
                <Text style={styles.unitLabel}>min</Text>
              </View>
            </View>
          )}
        </View>

        {/* Tips */}
        <View style={styles.tipsContainer}>
          <MaterialCommunityIcons name="lightbulb-outline" size={16} color="#FFB84D" />
          <Text style={styles.tipsText}>
            {session.type === 'endurance' && 'Mantén una cadencia estable de 80-100 RPM'}
            {session.type === 'intervals' && 'Alterna entre alta intensidad y recuperación activa'}
            {session.type === 'recovery' && 'Pedalea suave para favorecer la recuperación'}
            {session.type === 'indoor' && 'Asegúrate de tener buena ventilación e hidratación'}
          </Text>
        </View>

        {!isCompleted && (
          <Pressable 
            onPress={handleCompleteWorkout}
            style={[
              styles.completeWorkoutBtn,
              !isReadyToComplete && styles.completeWorkoutBtnDisabled
            ]}
          >
            <LinearGradient
              colors={isReadyToComplete ? ["#45B7D1", "#2196F3"] : ["#6B7280", "#4B5563"]}
              style={styles.completeWorkoutGradient}
            >
              <MaterialCommunityIcons 
                name={isReadyToComplete ? "check-circle" : "alert-circle"} 
                size={20} 
                color="#FFFFFF" 
              />
              <Text style={styles.completeWorkoutText}>
                {isReadyToComplete ? "Completar Ciclismo" : "Añade distancia o duración"}
              </Text>
            </LinearGradient>
          </Pressable>
        )}
      </LinearGradient>
    </View>
  );
}

interface SwimmingSessionProps {
  session: SwimmingSession;
  onUpdateSession: (session: SwimmingSession) => void;
  onCompleteWorkout?: () => void;
  isCompleted?: boolean;
}

export function SwimmingSessionComponent({ 
  session, 
  onUpdateSession, 
  onCompleteWorkout,
  isCompleted = false 
}: SwimmingSessionProps) {
  
  const handleCompleteWorkout = () => {
    if (!session.plannedDistance) return;
    if (isCompleted) return;
    onCompleteWorkout?.();
  };

  const isReadyToComplete = !!session.plannedDistance;

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
        {/* Header con candado para entrenamientos completados */}
        <View style={styles.sessionHeader}>
          <MaterialCommunityIcons name="swim" size={24} color="#96CEB4" />
          <Text style={[
            styles.sessionTitle,
            isCompleted && styles.sessionTitleCompleted
          ]}>
            Sesión de Natación {isCompleted && "- Completada"}
          </Text>
          {/* Icono de candado para entrenamientos completados */}
          {isCompleted && (
            <MaterialCommunityIcons
              name="lock"
              size={16}
              color="#00D4AA"
              style={styles.lockIcon}
            />
          )}
        </View>

        {/* Mensaje mejorado para entrenamientos completados */}
        {isCompleted && (
          <View style={styles.completedMessage}>
            <MaterialCommunityIcons name="trophy" size={16} color="#00D4AA" />
            <Text style={styles.completedMessageText}>
              Este entrenamiento ya fue completado. Los datos se muestran en modo solo lectura.
            </Text>
          </View>
        )}

        {/* Type Selector */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Tipo de Entrenamiento</Text>
          <View style={styles.typeSelector}>
            {[
              { value: 'endurance', label: 'Resistencia', icon: 'swim' },
              { value: 'technique', label: 'Técnica', icon: 'school' },
              { value: 'speed', label: 'Velocidad', icon: 'speedometer' },
              { value: 'open_water', label: 'Aguas Abiertas', icon: 'waves' }
            ].map((type) => (
              <Pressable
                key={type.value}
                onPress={() => !isCompleted && onUpdateSession({ ...session, type: type.value as any })}
                style={[
                  styles.typeChip,
                  session.type === type.value && styles.typeChipSelected,
                  isCompleted && styles.chipDisabled
                ]}
                disabled={isCompleted}
              >
                <MaterialCommunityIcons
                  name={type.icon as any}
                  size={16}
                  color={session.type === type.value ? '#FFFFFF' : '#96CEB4'}
                />
                <Text style={[
                  styles.typeChipText,
                  session.type === type.value && styles.typeChipTextSelected
                ]}>
                  {type.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Distance and Pool Length */}
        <View style={styles.inputRow}>
          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>Distancia Planificada</Text>
            <View style={styles.inputWithUnit}>
              <TextInput
                value={session.plannedDistance?.toString() || ''}
                onChangeText={(val) => !isCompleted && onUpdateSession({ 
                  ...session, 
                  plannedDistance: val ? parseFloat(val) : undefined 
                })}
                keyboardType="numeric"
                style={[
                  styles.textInput,
                  isCompleted && styles.inputDisabled
                ]}
                placeholder="2000"
                placeholderTextColor="#B0B0C4"
                editable={!isCompleted}
              />
              <Text style={styles.unitLabel}>m</Text>
            </View>
          </View>
          
          {session.type !== 'open_water' && (
            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>Longitud Piscina</Text>
              <View style={styles.inputWithUnit}>
                <TextInput
                  value={session.poolLength?.toString() || ''}
                  onChangeText={(val) => !isCompleted && onUpdateSession({ 
                    ...session, 
                    poolLength: val ? parseFloat(val) : undefined 
                  })}
                  keyboardType="numeric"
                  style={[
                    styles.textInput,
                    isCompleted && styles.inputDisabled
                  ]}
                  placeholder="25"
                  placeholderTextColor="#B0B0C4"
                  editable={!isCompleted}
                />
                <Text style={styles.unitLabel}>m</Text>
              </View>
            </View>
          )}
        </View>

        {/* Pool calculation */}
        {session.type !== 'open_water' && session.plannedDistance && session.poolLength && (
          <View style={styles.poolCalculation}>
            <Text style={styles.calculationText}>
              = {Math.ceil(session.plannedDistance / session.poolLength)} largos de {session.poolLength}m
            </Text>
          </View>
        )}

        {/* Tips */}
        <View style={styles.tipsContainer}>
          <MaterialCommunityIcons name="lightbulb-outline" size={16} color="#FFB84D" />
          <Text style={styles.tipsText}>
            {session.type === 'endurance' && 'Mantén un ritmo constante y controlado durante toda la sesión'}
            {session.type === 'technique' && 'Concéntrate en la técnica más que en la velocidad'}
            {session.type === 'speed' && 'Incluye series cortas a máxima velocidad con descansos completos'}
            {session.type === 'open_water' && 'Practica la orientación y adapta la técnica a las condiciones'}
          </Text>
        </View>

        {!isCompleted && (
          <Pressable 
            onPress={handleCompleteWorkout}
            style={[
              styles.completeWorkoutBtn,
              !isReadyToComplete && styles.completeWorkoutBtnDisabled
            ]}
          >
            <LinearGradient
              colors={isReadyToComplete ? ["#96CEB4", "#4CAF50"] : ["#6B7280", "#4B5563"]}
              style={styles.completeWorkoutGradient}
            >
              <MaterialCommunityIcons 
                name={isReadyToComplete ? "check-circle" : "alert-circle"} 
                size={20} 
                color="#FFFFFF" 
              />
              <Text style={styles.completeWorkoutText}>
                {isReadyToComplete ? "Completar Natación" : "Añade distancia planificada"}
              </Text>
            </LinearGradient>
          </Pressable>
        )}
      </LinearGradient>
    </View>
  );
}

interface GenericSportSessionProps {
  session: GenericSportSession;
  sport: SportType;
  onUpdateSession: (session: GenericSportSession) => void;
  onCompleteWorkout?: () => void;
  isCompleted?: boolean;
}

export function GenericSportSessionComponent({ 
  session, 
  sport, 
  onUpdateSession, 
  onCompleteWorkout,
  isCompleted = false 
}: GenericSportSessionProps) {
  
  const getSportConfig = () => {
    switch (sport) {
      case 'yoga':
        return { 
          icon: 'meditation', 
          color: '#FECA57', 
          name: 'Yoga',
          colors: ['#FECA57', '#FF9800'],
          types: [
            { value: 'training', label: 'Práctica General' },
            { value: 'match', label: 'Clase Dirigida' },
            { value: 'practice', label: 'Meditación' }
          ]
        };
      case 'football':
        return { 
          icon: 'soccer', 
          color: '#6C5CE7', 
          name: 'Fútbol',
          colors: ['#6C5CE7', '#673AB7'],
          types: [
            { value: 'training', label: 'Entrenamiento' },
            { value: 'match', label: 'Partido' },
            { value: 'practice', label: 'Práctica Técnica' }
          ]
        };
      case 'basketball':
        return { 
          icon: 'basketball', 
          color: '#FD79A8', 
          name: 'Baloncesto',
          colors: ['#FD79A8', '#E91E63'],
          types: [
            { value: 'training', label: 'Entrenamiento' },
            { value: 'match', label: 'Partido' },
            { value: 'practice', label: 'Práctica de Tiros' }
          ]
        };
      default:
        return { 
          icon: 'dumbbell', 
          color: '#B0B0C4', 
          name: 'Deporte',
          colors: ['#B0B0C4', '#6B7280'],
          types: [
            { value: 'training', label: 'Entrenamiento' },
            { value: 'match', label: 'Competición' },
            { value: 'practice', label: 'Práctica' }
          ]
        };
    }
  };

  const config = getSportConfig();

  const handleCompleteWorkout = () => {
    if (!session.duration) return;
    if (isCompleted) return;
    onCompleteWorkout?.();
  };

  const isReadyToComplete = !!session.duration;

  return (
    <View style={styles.sessionContainer}>
      <LinearGradient
        colors={
          isCompleted 
            ? [
                `${config.colors[0]}33`, // 20% opacity
                `${config.colors[1]}1A`  // 10% opacity
              ]
            : ["#2D2D5F", "#3D3D7F"]
        }
        style={styles.sessionGradient}
      >
        {/* Header con candado para entrenamientos completados */}
        <View style={styles.sessionHeader}>
          <MaterialCommunityIcons name={config.icon as any} size={24} color={config.color} />
          <Text style={[
            styles.sessionTitle,
            isCompleted && styles.sessionTitleCompleted
          ]}>
            Sesión de {config.name} {isCompleted && "- Completada"}
          </Text>
          {/* Icono de candado para entrenamientos completados */}
          {isCompleted && (
            <MaterialCommunityIcons
              name="lock"
              size={16}
              color="#00D4AA"
              style={styles.lockIcon}
            />
          )}
        </View>

        {/* Mensaje mejorado para entrenamientos completados */}
        {isCompleted && (
          <View style={styles.completedMessage}>
            <MaterialCommunityIcons name="trophy" size={16} color="#00D4AA" />
            <Text style={styles.completedMessageText}>
              Este entrenamiento ya fue completado. Los datos se muestran en modo solo lectura.
            </Text>
          </View>
        )}

        {/* Type Selector */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Tipo de Actividad</Text>
          <View style={styles.typeSelector}>
            {config.types.map((type) => (
              <Pressable
                key={type.value}
                onPress={() => !isCompleted && onUpdateSession({ ...session, type: type.value as any })}
                style={[
                  styles.typeChip,
                  session.type === type.value && styles.typeChipSelected,
                  isCompleted && styles.chipDisabled
                ]}
                disabled={isCompleted}
              >
                <Text style={[
                  styles.typeChipText,
                  session.type === type.value && styles.typeChipTextSelected
                ]}>
                  {type.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Duration */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Duración</Text>
          <View style={styles.inputWithUnit}>
            <TextInput
              value={session.duration?.toString() || ''}
              onChangeText={(val) => !isCompleted && onUpdateSession({ 
                ...session, 
                duration: val ? parseFloat(val) : undefined 
              })}
              keyboardType="numeric"
              style={[
                styles.textInput,
                isCompleted && styles.inputDisabled
              ]}
              placeholder={sport === 'yoga' ? '60' : '90'}
              placeholderTextColor="#B0B0C4"
              editable={!isCompleted}
            />
            <Text style={styles.unitLabel}>min</Text>
          </View>
        </View>

        {/* Tips */}
        <View style={styles.tipsContainer}>
          <MaterialCommunityIcons name="lightbulb-outline" size={16} color="#FFB84D" />
          <Text style={styles.tipsText}>
            {sport === 'yoga' && 'Concéntrate en la respiración y escucha a tu cuerpo'}
            {sport === 'football' && 'No olvides calentar bien antes de jugar'}
            {sport === 'basketball' && 'Mantén la hidratación durante los descansos'}
          </Text>
        </View>

        {!isCompleted && (
          <Pressable 
            onPress={handleCompleteWorkout}
            style={[
              styles.completeWorkoutBtn,
              !isReadyToComplete && styles.completeWorkoutBtnDisabled
            ]}
          >
            <LinearGradient
              colors={isReadyToComplete ? config.colors as [string, string] : ["#6B7280", "#4B5563"]}
              style={styles.completeWorkoutGradient}
            >
              <MaterialCommunityIcons 
                name={isReadyToComplete ? "check-circle" : "alert-circle"} 
                size={20} 
                color="#FFFFFF" 
              />
              <Text style={styles.completeWorkoutText}>
                {isReadyToComplete ? `Completar ${config.name}` : "Añade duración del entrenamiento"}
              </Text>
            </LinearGradient>
          </Pressable>
        )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  sessionContainer: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 20, // Bordes más redondeados
    overflow: 'hidden',
  },

  sessionGradient: {
    padding: 20,
    borderRadius: 20, // Asegurar redondeado interno
  },

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

  lockIcon: {
    marginLeft: 8,
  },

  // Mensaje para entrenamientos completados mejorado
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

  fieldContainer: {
    marginBottom: 16,
  },

  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#B0B0C4',
    marginBottom: 8,
  },

  subFieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B0B0C4',
    marginBottom: 4,
  },

  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16, // Más redondeado
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  typeChipSelected: {
    backgroundColor: '#00D4AA',
    borderColor: '#00D4AA',
  },

  // Estilo para chips deshabilitados
  chipDisabled: {
    opacity: 0.6,
  },

  typeChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#B0B0C4',
  },

  typeChipTextSelected: {
    color: '#FFFFFF',
  },

  inputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },

  inputGroup: {
    flex: 1,
  },

  inputWithUnit: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12, // Más redondeado
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },

  textInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
  },

  // Estilo para inputs deshabilitados
  inputDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: '#6B7280',
  },

  unitLabel: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#B0B0C4',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },

  intervalContainer: {
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
    borderRadius: 16, // Más redondeado
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(78, 205, 196, 0.3)',
  },

  intervalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },

  intervalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4ECDC4',
  },

  intervalSummary: {
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(78, 205, 196, 0.15)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(78, 205, 196, 0.3)',
  },

  summaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4ECDC4',
    textAlign: 'center',
  },

  poolCalculation: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: 'rgba(150, 206, 180, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(150, 206, 180, 0.3)',
  },

  calculationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#96CEB4',
    textAlign: 'center',
  },

  tipsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 184, 77, 0.1)',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    marginBottom: 16,
  },

  tipsText: {
    flex: 1,
    fontSize: 12,
    color: '#FFB84D',
    lineHeight: 16,
    fontStyle: 'italic',
  },

  // Complete Workout Button mejorado
  completeWorkoutBtn: {
    borderRadius: 16, // Más redondeado
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