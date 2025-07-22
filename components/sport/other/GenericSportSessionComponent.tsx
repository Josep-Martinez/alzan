// components/sport/GenericSportSessionComponent.tsx - Deportes genéricos con botón mejorado
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { GenericSportSession, SportType } from './common/sports';

/**
 * Props del componente de deportes genéricos
 */
interface GenericSportSessionComponentProps {
  session: GenericSportSession;
  sport: SportType;
  onUpdateSession: (session: GenericSportSession) => void;
  onCompleteWorkout?: () => void;
  isCompleted?: boolean;
}

/**
 * Componente principal para deportes genéricos
 * Enfoque simplificado "vas, juegas y ya" con métricas básicas
 * 
 * DATOS BD: Los datos se guardan en session_data como JSON
 * - type: training/match/practice (VARCHAR)
 * - duration: duración en minutos (INTEGER)
 * - notes: notas opcionales (TEXT)
 */
export default function GenericSportSessionComponent({ 
  session, 
  sport, 
  onUpdateSession, 
  onCompleteWorkout,
  isCompleted = false 
}: GenericSportSessionComponentProps) {
  // ===== ESTADOS LOCALES =====
  const [duration, setDuration] = useState(session.duration?.toString() || '');
  const [notes, setNotes] = useState(session.notes || '');

  /**
   * Obtiene la configuración específica del deporte
   */
  const getSportConfig = () => {
    switch (sport) {
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
          ],
          defaultDuration: 90
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
          ],
          defaultDuration: 120
        };
      case 'yoga':
        return { 
          icon: 'meditation', 
          color: '#FECA57', 
          name: 'Yoga',
          colors: ['#FECA57', '#FF9800'],
          types: [
            { value: 'training', label: 'Sesión' },
            { value: 'practice', label: 'Práctica Personal' },
            { value: 'match', label: 'Clase Grupal' }
          ],
          defaultDuration: 60
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
          ],
          defaultDuration: 60
        };
    }
  };

  const config = getSportConfig();

  /**
   * Actualiza la duración del entrenamiento
   * DATOS BD: Actualiza duration en session_data
   */
  const handleDurationChange = (value: string) => {
    setDuration(value);
    const numValue = parseInt(value) || undefined;
    onUpdateSession({ 
      ...session, 
      duration: numValue, // BD: duration en minutes
      notes: notes.trim() || undefined
    });
  };

  /**
   * Actualiza el tipo de actividad
   * DATOS BD: Actualiza type en session_data
   */
  const handleTypeChange = (type: 'training' | 'match' | 'practice') => {
    onUpdateSession({ 
      ...session, 
      type, // BD: activity_type
      duration: session.duration,
      notes: notes.trim() || undefined
    });
  };

  /**
   * Actualiza las notas del entrenamiento
   * DATOS BD: Actualiza notes en session_data
   */
  const handleNotesChange = (text: string) => {
    setNotes(text);
    onUpdateSession({ 
      ...session, 
      notes: text.trim() || undefined, // BD: session_notes (puede ser NULL)
      duration: session.duration
    });
  };

  /**
   * Verifica si el entrenamiento está listo para completar
   */
  const isReadyToComplete = !!session.duration && session.duration > 0;

  return (
    <View style={styles.container}>
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
        {/* ===== HEADER ===== */}
        <View style={styles.sessionHeader}>
          <MaterialCommunityIcons name={config.icon as any} size={24} color={config.color} />
          <Text style={[styles.sessionTitle, isCompleted && styles.sessionTitleCompleted]}>
            Sesión de {config.name} {isCompleted && "- Completada"}
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

        {/* ===== TIPO DE ACTIVIDAD ===== */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Tipo de Actividad</Text>
          <View style={styles.typeSelector}>
            {config.types.map((type) => (
              <Pressable
                key={type.value}
                onPress={() => !isCompleted && handleTypeChange(type.value as any)}
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

        {/* ===== DURACIÓN ===== */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Duración del Entrenamiento</Text>
          <View style={styles.durationContainer}>
            <TextInput
              value={duration}
              onChangeText={handleDurationChange}
              keyboardType="numeric"
              style={[
                styles.durationInput,
                isCompleted && styles.inputDisabled
              ]}
              placeholder={config.defaultDuration.toString()}
              placeholderTextColor="#B0B0C4"
              editable={!isCompleted}
              maxLength={3}
            />
            <View style={styles.durationUnit}>
              <Text style={styles.durationUnitText}>minutos</Text>
            </View>
          </View>
          
          {session.duration && session.duration > 0 && (
            <Text style={styles.durationHint}>
              ⏱️ Duración estimada: {Math.floor(session.duration / 60)}h {session.duration % 60}min
            </Text>
          )}
        </View>

        {/* ===== NOTAS OPCIONALES ===== */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Notas del Entrenamiento (Opcional)</Text>
          <TextInput
            value={notes}
            onChangeText={handleNotesChange}
            style={[
              styles.notesInput,
              isCompleted && styles.inputDisabled
            ]}
            placeholder="Objetivos específicos, ejercicios a practicar, observaciones..."
            placeholderTextColor="#B0B0C4"
            multiline
            numberOfLines={3}
            editable={!isCompleted}
            maxLength={150}
          />
          <Text style={styles.notesCounter}>
            {notes.length}/150 caracteres
          </Text>
        </View>

        {/* ===== ESTADÍSTICAS RÁPIDAS ===== */}
        {session.duration && session.duration > 0 && (
          <View style={styles.quickStats}>
            <LinearGradient
              colors={[
                `${config.colors[0]}33`,
                `${config.colors[1]}1A`
              ]}
              style={styles.quickStatsGradient}
            >
              <View style={styles.quickStatsHeader}>
                <MaterialCommunityIcons name="chart-line" size={16} color={config.color} />
                <Text style={styles.quickStatsTitle}>Resumen de la Sesión</Text>
              </View>
              
              <View style={styles.quickStatsContent}>
                <View style={styles.quickStatItem}>
                  <MaterialCommunityIcons name="clock" size={14} color={config.color} />
                  <Text style={styles.quickStatText}>{session.duration} min</Text>
                </View>
                <View style={styles.quickStatItem}>
                  <MaterialCommunityIcons name="fire" size={14} color={config.color} />
                  <Text style={styles.quickStatText}>
                    ~{Math.round(session.duration * 5)} kcal
                  </Text>
                </View>
                <View style={styles.quickStatItem}>
                  <MaterialCommunityIcons name="target" size={14} color={config.color} />
                  <Text style={styles.quickStatText}>
                    {session.type === 'training' ? 'Entrenamiento' :
                     session.type === 'match' ? 'Competición' : 'Práctica'}
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        )}

        {/* ===== BOTÓN COMPLETAR ENTRENAMIENTO ===== */}
        {!isCompleted && (
          <Pressable 
            onPress={() => onCompleteWorkout?.()} 
            style={[
              styles.completeWorkoutBtn,
              !isReadyToComplete && styles.completeWorkoutBtnDisabled
            ]}
            disabled={!isReadyToComplete}
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
                {isReadyToComplete ? `Completar ${config.name}` : "Indica la duración del entrenamiento"}
              </Text>
            </LinearGradient>
          </Pressable>
        )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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

  // ===== CAMPOS DE FORMULARIO =====
  fieldContainer: {
    marginBottom: 16,
  },

  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#B0B0C4',
    marginBottom: 8,
  },

  // ===== SELECTOR DE TIPO =====
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },

  typeChipSelected: {
    backgroundColor: '#00D4AA',
    borderColor: '#00D4AA',
  },

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

  // ===== DURACIÓN =====
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },

  durationInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 18,
    textAlign: 'center',
    fontWeight: '700',
  },

  durationUnit: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },

  durationUnitText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#B0B0C4',
  },

  durationHint: {
    fontSize: 12,
    color: '#FFB84D',
    marginTop: 4,
    fontWeight: '500',
  },

  inputDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: '#6B7280',
  },

  // ===== NOTAS =====
  notesInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#FFFFFF',
    fontSize: 14,
    textAlignVertical: 'top',
    minHeight: 60,
  },

  notesCounter: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'right',
    marginTop: 4,
  },

  // ===== ESTADÍSTICAS RÁPIDAS =====
  quickStats: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },

  quickStatsGradient: {
    padding: 16,
    borderRadius: 16,
  },

  quickStatsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },

  quickStatsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  quickStatsContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },

  quickStatItem: {
    alignItems: 'center',
    gap: 4,
  },

  quickStatText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // ===== BOTÓN COMPLETAR - MEJORADO =====
  completeWorkoutBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
  },

  completeWorkoutBtnDisabled: {
    // Quitamos opacity para que se vea mejor
  },

  completeWorkoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16, // Más padding para mejor visibilidad
    borderRadius: 16,
    gap: 8,
  },

  completeWorkoutText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});