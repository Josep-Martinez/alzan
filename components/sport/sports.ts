// components/sport/sports.ts - Versión simplificada sin base de datos de ejercicios

export type SportType = 'gym' | 'running' | 'cycling' | 'swimming' | 'yoga' | 'football' | 'basketball';

// Interfaz simplificada para ejercicios manuales
export interface Exercise {
  id: string;
  name: string;
}

export interface GymSet {
  reps: string;
  weight: string;
  completed?: boolean;
  restTime?: number;
  type?: 'normal' | 'warmup' | 'dropset' | 'failure';
}

export interface GymExercise {
  id: string;
  exerciseId: string; // Reference to manual Exercise
  name: string;
  sets: GymSet[];
  restTime?: string;
  notes?: string;
}

export interface RunningSession {
  type: 'long_run' | 'intervals' | 'tempo' | 'recovery' | 'race';
  plannedDistance?: number;
  plannedDuration?: number;
  intervalData?: {
    workDistance: number;
    restDistance: number;
    repetitions: number;
  };
}

export interface CyclingSession {
  type: 'endurance' | 'intervals' | 'recovery' | 'indoor';
  plannedDistance?: number;
  plannedDuration?: number;
}

export interface SwimmingSession {
  type: 'endurance' | 'technique' | 'speed' | 'open_water';
  plannedDistance?: number;
  poolLength?: number;
}

export interface GenericSportSession {
  type: 'training' | 'match' | 'practice';
  duration?: number;
}

export type SportSession = 
  | { sport: 'gym'; data: GymExercise[] }
  | { sport: 'running'; data: RunningSession }
  | { sport: 'cycling'; data: CyclingSession }
  | { sport: 'swimming'; data: SwimmingSession }
  | { sport: SportType; data: GenericSportSession };

export interface Workout {
  id: string;
  date: string;
  sport: SportType;
  name?: string;
  session: SportSession;
  completed?: boolean;
  duration?: number;
  notes?: string;
}

export interface WeeklyPlan {
  [key: string]: Workout[]; // 'L', 'M', 'X', 'J', 'V', 'S', 'D'
}

export const SPORT_TRANSLATIONS = {
  gym: 'Gimnasio',
  running: 'Running',
  cycling: 'Ciclismo',
  swimming: 'Natación',
  yoga: 'Yoga',
  football: 'Fútbol',
  basketball: 'Baloncesto'
} as const;