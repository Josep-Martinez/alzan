// components/sport/sports.ts - Tipos mejorados para superseries y circuitos

/**
 * Tipos de deportes disponibles
 */
export type SportType = 'gym' | 'running' | 'cycling' | 'swimming' | 'yoga' | 'football' | 'basketball';

/**
 * Tipos de ejercicios de gimnasio
 */
export type ExerciseType = 'Repeticiones' | 'Tiempo' | 'Distancia';

/**
 * Tipos de superseries con diferenciación clara
 */
export type SupersetType = 'superset' | 'triset' | 'circuit' | 'megacircuit';

/**
 * Configuración de tipos de superseries
 */
export const SUPERSET_TYPE_CONFIG = {
  superset: {
    name: 'Superserie',
    minExercises: 2,
    maxExercises: 2,
    hasExerciseRest: false,
    allowTimedSets: false,
    icon: 'lightning-bolt',
    color: '#FF6B6B'
  },
  triset: {
    name: 'Triserie',
    minExercises: 3,
    maxExercises: 3,
    hasExerciseRest: false,
    allowTimedSets: false,
    icon: 'flash',
    color: '#FFB84D'
  },
  circuit: {
    name: 'Circuito',
    minExercises: 3,
    maxExercises: 8,
    hasExerciseRest: true,
    allowTimedSets: true,
    icon: 'refresh-circle',
    color: '#4ECDC4'
  },
  megacircuit: {
    name: 'Mega Circuito',
    minExercises: 9,
    maxExercises: 12,
    hasExerciseRest: true,
    allowTimedSets: true,
    icon: 'fire',
    color: '#E91E63'
  }
} as const;

/**
 * Traducciones de tipos de ejercicios
 */
export const EXERCISE_TYPE_TRANSLATIONS = {
  'Repeticiones': 'REPS',
  'Tiempo': 'TIEMPO',
  'Distancia': 'DISTANCIA'
} as const;

/**
 * Iconos para tipos de ejercicios
 */
export const EXERCISE_TYPE_ICONS = {
  'Repeticiones': 'numeric',
  'Tiempo': 'timer',
  'Distancia': 'map-marker-distance'
} as const;

/**
 * Colores para tipos de ejercicios
 */
export const EXERCISE_TYPE_COLORS = {
  'Repeticiones': '#4ECDC4',
  'Tiempo': '#FFB84D',
  'Distancia': '#9C27B0'
} as const;

/**
 * Traducciones de deportes
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

/**
 * Serie de gimnasio con campos opcionales según el tipo
 */
export interface GymSet {
  reps?: string;          // Para ejercicios de repeticiones
  weight?: string;        // Peso utilizado (opcional)
  duration?: string;      // Para ejercicios de tiempo (en segundos)
  distance?: string;      // Para ejercicios de distancia
  completed: boolean;     // Si la serie está completada
  actualDuration?: number; // Duración real en segundos (para ejercicios de tiempo)
  notes?: string;         // Notas adicionales
}

/**
 * Ejercicio de gimnasio
 */
export interface GymExercise {
  id: string;
  exerciseId: string;     // ID del ejercicio en la base de datos
  name: string;
  sets: GymSet[];
  restTime?: string;      // Tiempo de descanso en segundos
  notes?: string;
  muscleGroup?: string;   // Grupo muscular principal
  specificMuscle?: string; // Músculo específico
  equipment?: string;     // Equipamiento necesario
  difficulty?: string;    // Nivel de dificultad
  exerciseType?: ExerciseType; // Tipo de ejercicio
  description?: string;   // Descripción del ejercicio
}

/**
 * Superserie mejorada con soporte completo para circuitos
 */
export interface SuperSet {
  id: string;
  name: string;
  exercises: GymExercise[];
  type: SupersetType;
  currentRound: number;
  totalRounds: number;
  roundCompleted: boolean[];
  restTimeBetweenRounds: string;    // Descanso entre rondas completas
  restTimeBetweenExercises?: string; // Descanso entre ejercicios (solo circuitos)
  currentExerciseIndex?: number;     // Índice del ejercicio actual (para navegación)
  useTimeForAll?: boolean;          // Si todos los ejercicios usan tiempo (circuitos)
  defaultTime?: string;             // Tiempo por defecto para circuitos
}

/**
 * Sesiones para diferentes deportes
 */
export interface RunningSession {
  type: 'interval' | 'long_run' | 'tempo' | 'recovery';
  plannedDistance?: number;
  plannedDuration?: number; // en minutos
  actualDistance?: number;
  actualDuration?: number;
  pace?: string;
  heartRate?: number;
  intervals?: {
    distance?: number;
    duration?: number;
    rest?: number;
    repetitions?: number;
  };
}

export interface CyclingSession {
  type: 'endurance' | 'interval' | 'climbing' | 'recovery';
  plannedDistance?: number;
  plannedDuration?: number;
  actualDistance?: number;
  actualDuration?: number;
  avgSpeed?: number;
  maxSpeed?: number;
  elevation?: number;
  power?: number;
}

export interface SwimmingSession {
  type: 'endurance' | 'technique' | 'speed' | 'recovery';
  plannedDistance?: number;
  actualDistance?: number;
  duration?: number;
  poolLength: number;
  strokes?: {
    freestyle?: number;
    backstroke?: number;
    breaststroke?: number;
    butterfly?: number;
  };
}

export interface GenericSportSession {
  type: 'training' | 'match' | 'practice';
  duration?: number;
  intensity?: 'low' | 'medium' | 'high';
  notes?: string;
}

/**
 * Unión de todas las sesiones deportivas
 */
export type SportSession = 
  | { sport: 'gym'; data: GymExercise[] }
  | { sport: 'running'; data: RunningSession }
  | { sport: 'cycling'; data: CyclingSession }
  | { sport: 'swimming'; data: SwimmingSession }
  | { sport: SportType; data: GenericSportSession };

/**
 * Workout completo
 */
export interface Workout {
  id: string;
  date: string;
  sport: SportType;
  name?: string;
  session: SportSession;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  notes?: string;
  duration?: number; // duración total en minutos
  postWorkoutData?: {
    rpe: number; // Rate of Perceived Exertion (1-10)
    feeling: string; // 'great' | 'good' | 'okay' | 'tired' | 'exhausted'
    notes?: string;
    timestamp: string;
  };
  deviceData?: {
    heartRate?: number[];
    calories?: number;
    distance?: number;
  };
}

/**
 * Plan semanal
 */
export type WeeklyPlan = {
  [dayCode: string]: Workout[];
};

/**
 * Función para crear una serie vacía según el tipo
 */
export function createEmptySet(exerciseType: ExerciseType): GymSet {
  const baseSet: GymSet = {
    completed: false,
    weight: '',
    notes: ''
  };

  switch (exerciseType) {
    case 'Tiempo':
      return {
        ...baseSet,
        duration: ''
      };
    case 'Distancia':
      return {
        ...baseSet,
        distance: '',
        duration: ''
      };
    case 'Repeticiones':
    default:
      return {
        ...baseSet,
        reps: ''
      };
  }
}

/**
 * Función para verificar si una serie está completa
 */
export function isSetComplete(set: GymSet, exerciseType: ExerciseType): boolean {
  switch (exerciseType) {
    case 'Tiempo':
      return !!(set.duration && parseInt(set.duration) > 0);
    case 'Distancia':
      return !!(set.distance && parseFloat(set.distance) > 0);
    case 'Repeticiones':
    default:
      return !!(set.reps && parseInt(set.reps) > 0);
  }
}

/**
 * Función para calcular el volumen total de un ejercicio
 */
export function calculateExerciseVolume(exercise: GymExercise): number {
  return exercise.sets.reduce((total, set) => {
    if (!set.completed) return total;
    
    const reps = parseInt(set.reps || '0');
    const weight = parseFloat(set.weight || '0');
    
    return total + (reps * weight);
  }, 0);
}

/**
 * Función para calcular la duración total de un ejercicio de tiempo
 */
export function calculateExerciseDuration(exercise: GymExercise): number {
  if (exercise.exerciseType !== 'Tiempo') return 0;
  
  return exercise.sets.reduce((total, set) => {
    if (!set.completed) return total;
    return total + (set.actualDuration || parseInt(set.duration || '0'));
  }, 0);
}

/**
 * Función para obtener el PR (Personal Record) de un ejercicio
 */
export function getExerciseMaxWeight(exercise: GymExercise): number {
  return exercise.sets.reduce((max, set) => {
    if (!set.completed || !set.weight) return max;
    const weight = parseFloat(set.weight);
    return weight > max ? weight : max;
  }, 0);
}

/**
 * Función para generar un ID único
 */
export function generateId(prefix: string = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Función para formatear tiempo en MM:SS
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Función para calcular el tiempo total estimado de una superserie
 */
export function calculateSupersetDuration(superset: SuperSet): number {
  let totalTime = 0;
  
  // Tiempo de ejercicios
  superset.exercises.forEach(exercise => {
    if (exercise.exerciseType === 'Tiempo') {
      const duration = parseInt(exercise.sets[0]?.duration || '0');
      totalTime += duration * superset.totalRounds;
    } else {
      // Estimación para ejercicios de repeticiones: 2-3 segundos por repetición
      const reps = parseInt(exercise.sets[0]?.reps || '0');
      totalTime += (reps * 2.5) * superset.totalRounds;
    }
  });
  
  // Tiempo de descanso entre ejercicios
  if (superset.restTimeBetweenExercises && parseInt(superset.restTimeBetweenExercises) > 0) {
    const restBetweenExercises = parseInt(superset.restTimeBetweenExercises);
    // (cantidad de ejercicios - 1) * descanso * rondas
    totalTime += (superset.exercises.length - 1) * restBetweenExercises * superset.totalRounds;
  }
  
  // Tiempo de descanso entre rondas
  if (superset.totalRounds > 1) {
    const restBetweenRounds = parseInt(superset.restTimeBetweenRounds || '90');
    totalTime += (superset.totalRounds - 1) * restBetweenRounds;
  }
  
  return totalTime;
}

/**
 * Función para verificar si una superserie está completada
 */
export function isSupersetComplete(superset: SuperSet): boolean {
  // Verificar que todos los ejercicios tengan configuración válida
  const allExercisesConfigured = superset.exercises.every(exercise => 
    exercise.sets.length > 0 && 
    exercise.sets.every(set => isSetComplete(set, exercise.exerciseType || 'Repeticiones'))
  );
  
  // Verificar que todas las rondas estén completadas
  const allRoundsCompleted = superset.roundCompleted.every(completed => completed);
  
  return allExercisesConfigured && allRoundsCompleted;
}

/**
 * Función para obtener el progreso de una superserie
 */
export function getSupersetProgress(superset: SuperSet): number {
  const completedRounds = superset.roundCompleted.filter(completed => completed).length;
  return superset.totalRounds > 0 ? (completedRounds / superset.totalRounds) * 100 : 0;
}