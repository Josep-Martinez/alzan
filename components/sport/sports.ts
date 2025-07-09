// components/sport/sports.ts - Tipos y interfaces completos para el sistema de entrenamientos
// ACTUALIZACIÓN MÍNIMA: Solo campos necesarios para BD de ejercicios

/**
 * Tipos de deportes soportados
 */
export type SportType = 'gym' | 'running' | 'cycling' | 'swimming' | 'yoga' | 'football' | 'basketball';

/**
 * Traducciones de nombres de deportes
 */
export const SPORT_TRANSLATIONS = {
  gym: 'Gimnasio',
  running: 'Running',
  cycling: 'Ciclismo',
  swimming: 'Natación',
  yoga: 'Yoga',
  football: 'Fútbol',
  basketball: 'Baloncesto'
} as const;

// ===== INTERFACES PARA EJERCICIOS MANUALES =====

/**
 * Interfaz para ejercicio manual (sin base de datos externa)
 */
export interface Exercise {
  id: string;
  name: string;
}

// ===== INTERFACES PARA GIMNASIO =====

/**
 * Tipos de serie para gimnasio
 */
export type SetType = 'normal' | 'warmup' | 'dropset' | 'failure';

/**
 * Interfaz para una serie de gimnasio
 */
export interface GymSet {
  reps: string;           // Repeticiones como string para permitir entrada flexible
  weight: string;         // Peso como string para permitir entrada flexible
  completed?: boolean;    // Si la serie está completada
  restTime?: number;      // Tiempo de descanso específico para esta serie
  type?: SetType;         // Tipo de serie
  notes?: string;         // Notas específicas de la serie
}

/**
 * Interfaz para un ejercicio de gimnasio
 * ACTUALIZADO: Campos adicionales para integración con BD de ejercicios
 */
export interface GymExercise {
  id: string;             // ID único del ejercicio en la sesión
  exerciseId: string;     // Referencia al ejercicio manual
  name: string;           // Nombre del ejercicio
  sets: GymSet[];         // Array de series
  restTime?: string;      // Tiempo de descanso por defecto entre series (en segundos)
  notes?: string;         // Notas del ejercicio
  targetMuscle?: string;  // Grupo muscular objetivo
  
  // === CAMPOS NUEVOS PARA BD DE EJERCICIOS ===
  muscleGroup?: string;        // grupo_muscular_principal de la BD
  specificMuscle?: string;     // grupo_muscular_secundario de la BD
  equipment?: string;          // equipamiento de la BD
  difficulty?: string;         // dificultad de la BD
  description?: string;        // descripcion de la BD
}

// ===== INTERFACES PARA DEPORTES ESPECÍFICOS =====

/**
 * Tipos de sesión de running
 */
export type RunningSessionType = 'long_run' | 'intervals' | 'tempo' | 'recovery' | 'race' | 'fartlek';

/**
 * Interfaz para sesión de running
 */
export interface RunningSession {
  type: RunningSessionType;
  plannedDistance?: number;     // Distancia planeada en metros
  plannedDuration?: number;     // Duración planeada en segundos
  targetPace?: {                // Ritmo objetivo
    min: number;                // Segundos por km mínimo
    max: number;                // Segundos por km máximo
  };
  intervalData?: {              // Datos específicos para intervalos
    workDistance: number;       // Distancia de trabajo en metros
    restDistance: number;       // Distancia de recuperación en metros
    repetitions: number;        // Número de repeticiones
    workPace?: { min: number; max: number };
    restPace?: { min: number; max: number };
  };
  workoutPlan?: any;            // Plan estructurado del constructor avanzado
}

/**
 * Tipos de sesión de ciclismo
 */
export type CyclingSessionType = 'endurance' | 'intervals' | 'recovery' | 'indoor' | 'hill_training';

/**
 * Interfaz para sesión de ciclismo
 */
export interface CyclingSession {
  type: CyclingSessionType;
  plannedDistance?: number;     // Distancia planeada en metros
  plannedDuration?: number;     // Duración planeada en segundos
  targetPower?: {               // Potencia objetivo en watts
    min: number;
    max: number;
  };
  targetHeartRate?: {           // Frecuencia cardíaca objetivo
    min: number;
    max: number;
  };
  intervalData?: {              // Datos específicos para intervalos
    workDuration: number;       // Duración de trabajo en segundos
    restDuration: number;       // Duración de recuperación en segundos
    repetitions: number;        // Número de repeticiones
    workPower?: { min: number; max: number };
    restPower?: { min: number; max: number };
  };
  workoutPlan?: any;            // Plan estructurado del constructor avanzado
}

/**
 * Tipos de sesión de natación
 */
export type SwimmingSessionType = 'endurance' | 'technique' | 'speed' | 'open_water';

/**
 * Interfaz para sesión de natación
 */
export interface SwimmingSession {
  type: SwimmingSessionType;
  plannedDistance?: number;     // Distancia planeada en metros
  poolLength?: number;          // Longitud de la piscina en metros
  targetStroke?: string;        // Estilo de natación objetivo
  intervalData?: {              // Datos específicos para intervalos
    workDistance: number;       // Distancia de trabajo en metros
    restTime: number;           // Tiempo de descanso en segundos
    repetitions: number;        // Número de repeticiones
  };
  workoutPlan?: any;            // Plan estructurado del constructor avanzado
}

/**
 * Tipos de sesión genérica
 */
export type GenericSessionType = 'training' | 'match' | 'practice';

/**
 * Interfaz para sesión genérica (deportes simples)
 */
export interface GenericSportSession {
  type: GenericSessionType;
  duration?: number;            // Duración en minutos
  intensity?: number;           // Intensidad planeada del 1-10
  notes?: string;               // Notas adicionales
}

// ===== INTERFACES PARA DATOS POST-ENTRENAMIENTO =====

/**
 * Datos de intensidad post-entrenamiento
 */
export interface PostWorkoutData {
  rpe: number;                  // Rate of Perceived Exertion (1-10)
  feeling: string;              // Categoría de sensación
  notes?: string;               // Notas adicionales opcionales
  heartRateData?: {             // Datos de frecuencia cardíaca si están disponibles
    avg: number;
    max: number;
    restingAfter3Min?: number;
  };
  timestamp: string;            // Timestamp de cuando se completó
}

// ===== UNIÓN DE TIPOS DE SESIÓN =====

/**
 * Unión de todos los tipos de sesión deportiva
 */
export type SportSession = 
  | { sport: 'gym'; data: GymExercise[] }
  | { sport: 'running'; data: RunningSession }
  | { sport: 'cycling'; data: CyclingSession }
  | { sport: 'swimming'; data: SwimmingSession }
  | { sport: SportType; data: GenericSportSession };

// ===== INTERFAZ PRINCIPAL DE ENTRENAMIENTO =====

/**
 * Interfaz principal para un entrenamiento completo
 */
export interface Workout {
  id: string;                   // ID único del entrenamiento
  date: string;                 // Fecha en formato ISO string
  sport: SportType;             // Tipo de deporte
  name?: string;                // Nombre personalizado del entrenamiento
  session: SportSession;        // Datos específicos de la sesión
  completed?: boolean;          // Si el entrenamiento está completado
  duration?: number;            // Duración real del entrenamiento en segundos
  notes?: string;               // Notas generales del entrenamiento
  
  // Metadatos para base de datos futura
  createdAt?: string;           // Timestamp de creación
  updatedAt?: string;           // Timestamp de última actualización
  completedAt?: string;         // Timestamp de completado
  
  // Datos post-entrenamiento
  postWorkoutData?: PostWorkoutData;
  
  // Métricas del dispositivo (reloj, app, etc.)
  deviceData?: {
    heartRateAvg?: number;
    heartRateMax?: number;
    calories?: number;
    distance?: number;          // En metros
    pace?: number;              // Segundos por km
    power?: number;             // Watts promedio (ciclismo)
    cadence?: number;           // RPM promedio
    strokesPerMinute?: number;  // Para natación
  };
}

// ===== INTERFACES PARA PLANIFICACIÓN SEMANAL =====

/**
 * Plan semanal de entrenamientos
 * Organizado por día de la semana
 */
export interface WeeklyPlan {
  [key: string]: Workout[];     // 'L', 'M', 'X', 'J', 'V', 'S', 'D'
}

// ===== INTERFACES PARA PLANTILLAS Y PLANES =====

/**
 * Plantilla de entrenamiento reutilizable
 */
export interface WorkoutTemplate {
  id: string;
  name: string;
  sport: SportType;
  description?: string;
  estimatedDuration: number;    // En segundos
  difficulty: 1 | 2 | 3 | 4 | 5; // Nivel de dificultad
  sessionTemplate: SportSession;
  tags?: string[];              // Etiquetas para filtrado
  createdBy?: 'system' | 'user';
}

/**
 * Plan de entrenamiento estructurado (para constructor avanzado)
 */
export interface StructuredWorkoutPlan {
  id: string;
  name: string;
  sport: 'running' | 'cycling' | 'swimming';
  steps: WorkoutStep[];
  estimatedDuration: number;    // En segundos
  estimatedDistance: number;    // En metros
  createdAt: string;
  difficulty?: 1 | 2 | 3 | 4 | 5;
  description?: string;
}

/**
 * Paso individual en un plan estructurado
 */
export interface WorkoutStep {
  id: string;
  name: string;
  stepType: 'warmup' | 'work' | 'rest' | 'recovery' | 'cooldown';
  durationType: 'time' | 'distance' | 'lap_button' | 'heart_rate';
  duration?: number;            // En segundos
  distance?: number;            // En metros
  targetType?: 'pace' | 'heart_rate' | 'power' | 'none';
  targetMin?: number;
  targetMax?: number;
  color: string;                // Color para visualización
  notes?: string;
}

/**
 * Loop/repetición en un plan estructurado
 */
export interface WorkoutLoop {
  id: string;
  name: string;
  repetitions: number;
  steps: WorkoutStep[];
  color: string;
}

// ===== INTERFACES PARA SUPERSERIES (GIMNASIO) =====

/**
 * Tipos de superseries
 * ACTUALIZADO: Agregado 'megacircuit' para soporte completo de circuitos
 */
export type SupersetType = 'superset' | 'circuit' | 'triset' | 'megacircuit';

/**
 * Interfaz para superseries de gimnasio
 */
export interface SuperSet {
  id: string;
  name: string;
  exercises: GymExercise[];
  restTime: string;             // Tiempo de descanso entre rondas
  type: SupersetType;
  currentRound: number;         // Ronda actual (1-based)
  totalRounds: number;          // Total de rondas planeadas
  roundCompleted: boolean[];    // Array para trackear rondas completadas
  notes?: string;
}

// ===== INTERFACES PARA MÉTRICAS Y ANÁLISIS =====

/**
 * Métricas semanales/mensuales
 */
export interface PeriodMetrics {
  period: string;               // 'week-2025-01' o 'month-2025-01'
  totalWorkouts: number;
  totalDuration: number;        // En minutos
  totalDistance: number;        // En metros
  averageIntensity: number;     // RPE promedio
  sportDistribution: {          // Distribución por deporte
    [sport in SportType]?: number;
  };
  completionRate: number;       // Porcentaje de entrenamientos completados
}

/**
 * Progreso de objetivos
 */
export interface GoalProgress {
  id: string;
  type: 'weekly' | 'monthly' | 'yearly';
  sport?: SportType;            // Si es específico de un deporte
  target: number;               // Objetivo numérico
  current: number;              // Progreso actual
  unit: 'workouts' | 'minutes' | 'kilometers' | 'calories';
  startDate: string;
  endDate: string;
  achieved?: boolean;
}

// ===== CONFIGURACIÓN DE USUARIO =====

/**
 * Configuración de usuario para entrenamientos
 */
export interface UserWorkoutSettings {
  defaultRestTime: number;      // Tiempo de descanso por defecto en segundos
  preferredUnits: 'metric' | 'imperial';
  autoCompleteRounds: boolean;  // Auto-completar superseries
  showAdvancedMetrics: boolean;
  enableDeviceSync: boolean;    // Sincronización con dispositivos
  preferredSports: SportType[]; // Deportes preferidos para mostrar primero
  workoutReminders: {
    enabled: boolean;
    time: string;               // Hora en formato HH:MM
    days: number[];             // Días de la semana (0=Domingo)
  };
}

// ===== INTERFACES ADICIONALES PARA BD DE EJERCICIOS =====

/**
 * Interfaz para ejercicio manual del selector (integración con BD)
 */
export interface ManualExercise {
  id: string;
  name: string;
  muscleGroup?: string;
  specificMuscle?: string;
  equipment?: string;
  difficulty?: string;
  maxWeight?: number;
  description?: string;
  recordType?: string;
}

/**
 * Interfaz para ejercicio de la base de datos
 */
export interface ExerciseFromDB {
  id_ejercicio: number;
  nombre_ejercicio: string;
  grupo_muscular_principal: string;
  grupo_muscular_secundario: string | null;
  equipamiento: string;
  dificultad: 'Principiante' | 'Intermedio' | 'Avanzado';
  descripcion: string;
}

// ===== EXPORTACIONES ADICIONALES =====

/**
 * Función helper para crear un entrenamiento vacío
 */
export const createEmptyWorkout = (sport: SportType, date: Date = new Date()): Workout => {
  const baseWorkout: Workout = {
    id: `workout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    date: date.toISOString().split('T')[0],
    sport,
    completed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    session: { sport, data: sport === 'gym' ? [] : { type: 'training' } } as SportSession
  };

  return baseWorkout;
};

/**
 * Función helper para validar si un entrenamiento está listo para completar
 */
export const isWorkoutReadyToComplete = (workout: Workout): boolean => {
  if (workout.completed) return false;

  switch (workout.sport) {
    case 'gym':
      const gymData = (workout.session as any).data as GymExercise[];
      return gymData.length > 0 && gymData.every(ex => 
        ex.sets.length > 0 && ex.sets.every(set => 
          set.reps.trim() !== '' && set.weight.trim() !== ''
        )
      );
    
    case 'running':
    case 'cycling':
    case 'swimming':
      const specificData = (workout.session as any).data;
      return !!(specificData.plannedDuration || specificData.plannedDistance || specificData.workoutPlan);
    
    default:
      const genericData = (workout.session as any).data as GenericSportSession;
      return !!(genericData.duration && genericData.duration > 0);
  }
};

/**
 * Función helper para calcular duración estimada de un entrenamiento
 */
export const calculateEstimatedDuration = (workout: Workout): number => {
  switch (workout.sport) {
    case 'gym':
      const gymData = (workout.session as any).data as GymExercise[];
      // Estimación básica: 3 minutos por serie + tiempo de descanso
      const totalSets = gymData.reduce((total, ex) => total + ex.sets.length, 0);
      const avgRestTime = 60; // segundos
      return (totalSets * 3 * 60) + (totalSets * avgRestTime);
    
    case 'running':
    case 'cycling':
    case 'swimming':
      const specificData = (workout.session as any).data;
      return specificData.plannedDuration || 0;
    
    default:
      const genericData = (workout.session as any).data as GenericSportSession;
      return (genericData.duration || 0) * 60; // Convertir minutos a segundos
  }
};

// ===== CONSTANTES ÚTILES =====

/**
 * Colores por deporte para UI
 */
export const SPORT_COLORS: Record<SportType, [string, string]> = {
  gym: ['#FF6B6B', '#FF5252'],
  running: ['#4ECDC4', '#26C6DA'],
  cycling: ['#45B7D1', '#2196F3'],
  swimming: ['#96CEB4', '#4CAF50'],
  yoga: ['#FECA57', '#FF9800'],
  football: ['#6C5CE7', '#673AB7'],
  basketball: ['#FD79A8', '#E91E63']
};

/**
 * Iconos por deporte
 */
export const SPORT_ICONS: Record<SportType, string> = {
  gym: 'dumbbell',
  running: 'run',
  cycling: 'bike',
  swimming: 'swim',
  yoga: 'meditation',
  football: 'soccer',
  basketball: 'basketball'
};

/**
 * Códigos de días de la semana
 */
export const WEEK_DAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'] as const;

/**
 * Nombres completos de días
 */
export const WEEK_DAY_NAMES = {
  'L': 'Lunes',
  'M': 'Martes',
  'X': 'Miércoles',
  'J': 'Jueves',
  'V': 'Viernes',
  'S': 'Sábado',
  'D': 'Domingo'
} as const;

// ===== CONSTANTES PARA BD DE EJERCICIOS =====

export const MUSCLE_GROUPS = [
  'pectoral', 'dorsal', 'espalda', 'hombro', 'biceps', 'triceps', 'antebrazos',
  'cuadriceps', 'gluteo', 'isquiotibial', 'gemelo', 'soleo', 'abdominal', 'abductor', 'cuerpo completo'
] as const;

export const EQUIPMENT_TYPES = [
  'Peso corporal', 'Banda elástica', 'Mancuernas', 'Barra', 'Cable', 'Máquina',
  'TRX', 'Balón medicinal', 'Battle ropes', 'Rueda abdominal', 'Kettlebell', 'Fitball', 'Bosu'
] as const;

export const DIFFICULTY_LEVELS = ['Principiante', 'Intermedio', 'Avanzado'] as const;