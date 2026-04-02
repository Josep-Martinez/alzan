# Módulo de Entrenamiento - Documentación Técnica

## Índice

1. [Arquitectura](#arquitectura)
2. [Componentes y Pantallas](#componentes-y-pantallas)
3. [Hooks y Servicios](#hooks-y-servicios)
4. [Base de Datos](#base-de-datos)
5. [Características Recientes](#características-recientes)
6. [Tipos TypeScript](#tipos-typescript)

---

## Arquitectura

### Stack Tecnológico

- **Frontend**: React Native + TypeScript
- **Navigation**: React Navigation (Stack Navigator)
- **State Management**: TanStack Query (React Query)
- **Backend**: Supabase (PostgreSQL con RLS)
- **UI**: Custom "Liquid Glass" design system

**Location**: `src/screens/training/` and `src/modules/training/`

### Estructura de Navegación

```
TabNavigator
└── Training Tab
    └── TrainingStack
        ├── TrainingHomeScreen (principal con calendario)
        ├── GymRoutinesList
        ├── GymRoutineEditor
        ├── ExerciseSearch
        ├── StartWorkout
        ├── ActiveWorkout
        ├── FinishWorkout
        ├── EnduranceSessionsList
        ├── EnduranceSessionForm
        ├── EnduranceSessionDetail
        ├── EnduranceWorkoutBuilder
        ├── SportTemplatesList
        ├── ExternalActivityLinking
        ├── WeeklyPlan
        └── ExerciseDetail
```

---

## Componentes y Pantallas

### 1. TrainingHomeScreen

**Archivo**: [`src/screens/training/TrainingHomeScreen.tsx`](file:///Users/josep/Projectos/alzan/src/screens/training/TrainingHomeScreen.tsx)

**Propósito**: Pantalla principal del módulo con calendario y vista de entrenamientos planificados.

**Características Clave**:

- **Calendario horizontal** con 2 semanas pasadas y 3 semanas futuras
- **Indicadores visuales** (dots) en días con entrenamientos planificados
- **Estado de sesiones completadas** con botón "TERMINADO" en rojo
- **Detección de sesiones activas** con botón "REANUDAR" en verde
- **Colores específicos por deporte** usando `SPORT_COLORS`

**Estado Local**:

```typescript
const [selectedDate, setSelectedDate] = useState(new Date());
const PAST_DAYS = 14;
const FUTURE_DAYS = 21;
```

**Queries Principales**:

```typescript
// Planes manuales para la fecha seleccionada
const { data: manualPlans } = useQuery({
  queryKey: ['dailyPlans', selectedDate, user?.id],
  queryFn: async () => {
    const formattedDate = format(selectedDate, 'yyyy-MM-dd');
    return await supabase
      .from('workout_plans')
      .select('*, workout_templates(...), endurance_workout_templates(...)')
      .eq('user_id', user.id)
      .eq('planned_date', formattedDate);
  },
});

// Plantillas programadas para el día de la semana
const { data: scheduledTemplates } = useQuery({
  queryKey: ['scheduledTemplates', selectedDayOfWeek, user?.id],
  queryFn: async () => {
    // Fetch endurance templates
    const endurance = await supabase
      .from('endurance_workout_templates')
      .select('*')
      .eq('user_id', user.id)
      .eq('scheduled_day', selectedDayOfWeek);

    // Fetch gym templates
    const gym = await supabase
      .from('workout_templates')
      .select('*')
      .eq('user_id', user.id)
      .eq('suggested_day_of_week', selectedDayOfWeek);

    return { endurance, gym };
  },
});

// Sesiones completadas para la fecha
const { data: completedSessions } = useQuery({
  queryKey: ['completedSessions', format(selectedDate, 'yyyy-MM-dd'), user?.id],
  queryFn: async () => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    return await supabase
      .from('activity_sessions')
      .select('id, sport_type, workout_template_id, start_time, name')
      .eq('user_id', user.id)
      .not('end_time', 'is', null) // Solo completadas
      .gte('start_time', `${dateStr}T00:00:00`)
      .lte('start_time', `${dateStr}T23:59:59`);
  },
});
```

**Lógica de Estado de Sesiones**:

```typescript
// Verificar si está completada
const isGymCompleted = isGym && completedSessions?.some((s: any) => s.workout_template_id === template?.id);
const isEnduranceCompleted =
  !isGym &&
  completedSessions?.some((s: any) => s.sport_type === template?.sport_type && s.name === template?.base_name);
const isCompleted = isGymCompleted || isEnduranceCompleted;

// Verificar si está activa
const isSameDate = activeSession?.start_time ? isSameDay(new Date(activeSession.start_time), selectedDate) : false;
const isThisSessionActive =
  isGym && activeSession?.workout_template_id === template.id && !activeSession?.end_time && isSameDate;
```

**Colores de Deportes** (actualizado):

```typescript
import { SPORT_COLORS } from '../../theme/sportColors';

// Aplicación de colores
<View style={[
  styles.planIcon,
  { backgroundColor: isGym ? SPORT_COLORS.gym : (SPORT_COLORS[template?.sport_type?.toLowerCase()] || colors.accent) }
]}>
```

---

### 2. EnduranceSessionsListScreen

**Archivo**: [`src/screens/training/EnduranceSessionsListScreen.tsx`](file:///Users/josep/Projectos/alzan/src/screens/training/EnduranceSessionsListScreen.tsx)

**Propósito**: Historial de actividades de resistencia con filtros avanzados.

**Características Recientes**:

- **Filtros de fecha mejorados** con rango personalizado
- **Selector de fecha inline** para iOS (wheel picker)
- **Filtros predefinidos**: Última semana, último mes, últimos 3 meses
- **Corrección de filtro de fecha**: Ahora usa `startOfDay` para incluir correctamente el día final

**Tipos de Filtros**:

```typescript
type FilterPreset = 'all' | 'week' | 'month' | 'three_months' | 'custom';

interface DateFilter {
  preset: FilterPreset;
  startDate?: string;
  endDate?: string;
}
```

**Lógica de Filtrado Corregida**:

```typescript
const getDateRange = (preset: FilterPreset) => {
  // Usar startOfDay porque el hook añade +1 día para incluir el día completo
  const today = startOfDay(new Date());

  switch (preset) {
    case 'week':
      return {
        startDate: startOfDay(subDays(today, 7)).toISOString(),
        endDate: today.toISOString(),
      };
    case 'month':
      return {
        startDate: startOfDay(subMonths(today, 1)).toISOString(),
        endDate: today.toISOString(),
      };
    case 'custom':
      return {
        startDate: startOfDay(customStartDate).toISOString(),
        endDate: startOfDay(customEndDate).toISOString(),
      };
    default:
      return {};
  }
};
```

**Selector de Fecha iOS Inline**:

```tsx
{
  Platform.OS === 'ios' && showStartDatePicker && (
    <View style={styles.inlinePickerContainer}>
      <DateTimePicker
        value={customStartDate}
        mode="date"
        display="inline"
        maximumDate={new Date()}
        onChange={(event, selectedDate) => {
          if (selectedDate) setCustomStartDate(selectedDate);
        }}
        themeVariant="light"
      />
    </View>
  );
}
```

---

---

### 3. Registro Manual y Formularios

**Archivo**: [`src/screens/training/EnduranceSessionFormScreen.tsx`](file:///Users/josep/Projectos/alzan/src/screens/training/EnduranceSessionFormScreen.tsx)

**Propósito**: Registro de actividades de resistencia, ya sea mediante plantilla o entrada manual rápida.

**Cálculo Automático de Calorías** (si no se proporcionan):
Si el usuario deja las calorías en 0, el sistema calcula una estimación basada en:

- Duración de la actividad.
- Peso del perfil de usuario (o 70kg por defecto).
- MET (Equivalente Metabólico) estimado de 5.

```typescript
// Kcal = MET * kg * horas
const finalCalories = Math.round(5 * userWeight * (durationSeconds / 3600));
```

---

### 4. EnduranceWorkoutBuilderScreen

**Archivo**: [`src/screens/training/EnduranceWorkoutBuilderScreen.tsx`](file:///Users/josep/Projectos/alzan/src/screens/training/EnduranceWorkoutBuilderScreen.tsx)

**Propósito**: Constructor avanzado de entrenamientos de resistencia con pasos y zonas.

**Características**:

- **Selección de deporte** (Running, Cycling, Swimming, etc.)
- **Pasos de entrenamiento**: Calentamiento, Intervalos, Recuperación
- **Grupos de repetición**: Agrupar pasos para repetir (ej: 5x400m)
- **Zonas de entrenamiento**: Ritmo objetivo por zona (Z1-Z5)
- **Entrada de distancia**: Kilómetros y metros
- **Cálculo automático** de duración estimada

**Estructura de Pasos**:

```typescript
interface WorkoutStep {
  id: string;
  type: 'warmup' | 'interval' | 'recovery' | 'cooldown' | 'group';
  distance_m?: number;
  duration_s?: number;
  pace_target?: string; // mm:ss format
  zone?: 1 | 2 | 3 | 4 | 5;
  repetitions?: number; // Para grupos
  children?: WorkoutStep[]; // Para grupos
}
```

**Zonas de Entrenamiento para Running**:

```typescript
const RUNNING_ZONES = {
  1: { name: 'Recuperación', description: 'Muy fácil, conversacional' },
  2: { name: 'Aeróbico', description: 'Cómodo, sostenible' },
  3: { name: 'Tempo', description: 'Ritmo controlado' },
  4: { name: 'Umbral', description: 'Difícil pero sostenible' },
  5: { name: 'VO2 Max', description: 'Máximo esfuerzo' },
};
```

---

### 5. SportTemplatesListScreen

**Archivo**: [`src/screens/training/SportTemplatesListScreen.tsx`](file:///Users/josep/Projectos/alzan/src/screens/training/SportTemplatesListScreen.tsx)

- **Endurance**: Tracking GPS y manual.
- **TrainingSettings**: Configuración general (Accesible desde `SettingsNavigator`).

**Características**:

- Vista de todas las plantillas creadas
- **Colores específicos por deporte** usando `SPORT_COLORS`
- Edición y eliminación de plantillas
- Asignación a días de la semana

**Aplicación de Colores**:

```tsx
<View style={[styles.sportIcon, { backgroundColor: SPORT_COLORS[template.sport_type] || colors.primary }]}>
  <SportIcon sport={template.sport_type} size={20} color="#FFF" />
</View>
```

---

### 6. ExerciseDetailScreen

**Archivo**: [`src/screens/training/ExerciseDetailScreen.tsx`](file:///Users/josep/Projectos/alzan/src/screens/training/ExerciseDetailScreen.tsx)

**Propósito**: Vista detallada de un ejercicio específico con historial y métricas.

**Características**:

- **Estadísticas Rápidas**: Dificultad, Músculo principal, PR (Récord Personal).
- **Gráficos**: Integración futura de progreso de peso/volumen.
- **Instrucciones**: Descripción paso a paso y equipamiento necesario.
- **UI Adaptativa**: Header con gradiente y soporte para Safe Area superior (evita solapamiento con status bar).

**Consultas Principales**:

```typescript
// Obtener PR del ejercicio
const { data: prData } = useQuery({
  queryKey: ['exercisePR', exercise?.id],
  queryFn: async () => {
    return await supabase
      .from('workout_sets')
      .select('weight_kg, reps')
      .eq('exercise_id', exercise.id)
      .order('weight_kg', { ascending: false })
      .limit(1)
      .maybeSingle();
  },
});
```

---

## Hooks y Servicios

### useEnduranceSessions

**Archivo**: [`src/hooks/useEnduranceSessions.ts`](file:///Users/josep/Projectos/alzan/src/hooks/useEnduranceSessions.ts)

**Propósito**: Gestión de sesiones de resistencia con filtros de fecha.

**Interfaz**:

```typescript
interface DateRange {
  startDate?: string;
  endDate?: string;
}

const useEnduranceSessions = (dateRange?: DateRange) => {
  const { sessions, isLoading, error } = useQuery({
    queryKey: ['endurance-sessions', user?.id, dateRange],
    queryFn: async () => {
      let query = supabase
        .from('activity_sessions')
        .select('*')
        .eq('user_id', user.id)
        .neq('sport_type', 'strength')
        .order('start_time', { ascending: false });

      if (dateRange?.startDate) {
        query = query.gte('start_time', dateRange.startDate);
      }
      if (dateRange?.endDate) {
        // Añadir 1 día para incluir el día completo
        const endDatePlusOne = addDays(new Date(dateRange.endDate), 1).toISOString();
        query = query.lt('start_time', endDatePlusOne);
      }

      return query;
    },
  });

  return { sessions, isLoading, error };
};
```

---

### useGymRoutines

**Archivo**: [`src/hooks/useGymRoutines.ts`](file:///Users/josep/Projectos/alzan/src/hooks/useGymRoutines.ts)

**Propósito**: Gestión de rutinas de gimnasio.

**Funciones**:

```typescript
const useGymRoutines = () => {
  const { data: routines, isLoading } = useQuery({
    queryKey: ['gym-routines', userId],
    queryFn: async () => {
      return await supabase
        .from('workout_templates')
        .select(
          `
          *,
          workout_template_exercises (
            *,
            exercises (*)
          )
        `,
        )
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
    },
  });

  const deleteRoutine = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('workout_templates').delete().eq('id', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['gym-routines']);
    },
  });

  return { routines, isLoading, deleteRoutine };
};
```

---

## Base de Datos

### Tabla: `activity_sessions`

Registro de todas las sesiones de entrenamiento.

```sql
CREATE TABLE activity_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  sport_type TEXT NOT NULL, -- 'strength', 'running', 'cycling', 'swimming', 'manual', etc.
  name TEXT,
  workout_template_id UUID REFERENCES workout_templates(id),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_s INTEGER,
  distance_m DECIMAL(10,2),
  calories_kcal DECIMAL(8,2),
  avg_heart_rate INTEGER,
  max_heart_rate INTEGER,
  elevation_gain_m DECIMAL(8,2),
  source TEXT DEFAULT 'manual', -- 'manual', 'suunto', 'strava', etc.
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_sessions_user_time ON activity_sessions(user_id, start_time DESC);
CREATE INDEX idx_activity_sessions_sport ON activity_sessions(user_id, sport_type);
```

### Tabla: `workout_templates`

Plantillas de rutinas de gimnasio.

```sql
CREATE TABLE workout_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  base_name TEXT NOT NULL,
  description TEXT,
  suggested_day_of_week INTEGER, -- 0=Sunday, 1=Monday, etc. (NUEVO)
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Tabla: `endurance_workout_templates`

Plantillas de entrenamientos de resistencia.

```sql
CREATE TABLE endurance_workout_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  base_name TEXT NOT NULL,
  sport_type TEXT NOT NULL,
  description TEXT,
  workout_goal TEXT,
  scheduled_day INTEGER, -- 0-6 para día de la semana
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Tabla: `endurance_workout_steps`

Pasos individuales de entrenamientos de resistencia.

```sql
CREATE TABLE endurance_workout_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES endurance_workout_templates(id) ON DELETE CASCADE,
  parent_step_id UUID REFERENCES endurance_workout_steps(id), -- Para grupos
  step_order INTEGER NOT NULL,
  step_type TEXT NOT NULL, -- 'warmup', 'interval', 'recovery', 'cooldown', 'group'
  distance_m DECIMAL(10,2),
  duration_s INTEGER,
  pace_target TEXT, -- mm:ss format
  zone INTEGER, -- 1-5
  repetitions INTEGER, -- Para grupos
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Características Recientes

### 1. Colores Específicos por Deporte

**Archivo**: [`src/theme/sportColors.ts`](file:///Users/josep/Projectos/alzan/src/theme/sportColors.ts)

```typescript
export const SPORT_COLORS: Record<string, string> = {
  gym: '#007AFF', // Azul técnico elegante
  running: '#E9A73C', // Ámbar deportivo
  cycling: '#E56353', // Coral dinámico
  swimming: '#34AADC', // Cyan
  football: '#2E7D32', // Dark Green
  basketball: '#FF9500', // Orange
  tennis: '#F2D648', // Amarillo clásico
  padel: '#8A5CC8', // Morado único
  hiking: '#A9825A', // Tierra/montaña
  walking: '#34C759', // Greenish
  other: '#8E8E93', // Gris neutro
};
```

**Uso**: Aplicado en `TrainingHomeScreen`, `EnduranceSessionsListScreen`, `SportTemplatesListScreen`, y `EnduranceWorkoutBuilderScreen`.

---

### 2. Estado de Sesiones Completadas

**Implementación**: `TrainingHomeScreen.tsx`

**Lógica**:

- Consulta `activity_sessions` para la fecha seleccionada
- Filtra solo sesiones con `end_time` no nulo (completadas)
- Compara `workout_template_id` para gym o `sport_type` + `name` para resistencia
- Muestra botón "TERMINADO" en rojo si está completada
- Deshabilita el botón para evitar duplicados

**Código**:

```tsx
<TouchableOpacity
  style={[styles.startPlanBtn, isCompleted && { backgroundColor: colors.danger }]}
  disabled={isCompleted}
  onPress={() => {
    if (isCompleted) return;
    // Iniciar entrenamiento
  }}
>
  <Text style={styles.startPlanText}>{isCompleted ? 'TERMINADO' : 'INICIAR'}</Text>
</TouchableOpacity>
```

---

### 3. Filtros de Fecha Mejorados

**Implementación**: `EnduranceSessionsListScreen.tsx`

**Mejoras**:

- Uso de `startOfDay` para asegurar inclusión correcta del día final
- Selector inline para iOS (wheel picker)
- Filtros predefinidos más intuitivos
- Banner visual del filtro activo

**Corrección Crítica**:

```typescript
// ANTES (incorrecto - incluía día siguiente)
const today = new Date();

// DESPUÉS (correcto - solo hasta final del día)
const today = startOfDay(new Date());
```

---

### 4. Cálculo Automático de Calorías

**Implementación**: `ManualLogScreen.tsx`

**Fórmula**:

```
Calorías = MET × Peso (kg) × Duración (horas)
MET = 5 (actividad moderada estimada)
```

**Código**:

```typescript
const durationSeconds = (parseInt(duration) || 0) * 60;
const hours = durationSeconds / 3600;
const userWeight = profile?.weight_kg || 70;
const finalCalories = Math.round(5 * userWeight * hours);
```

---

## Tipos TypeScript

### Training Types

**Archivo**: [`src/types/training.ts`](file:///Users/josep/Projectos/alzan/src/types/training.ts)

```typescript
interface ActivitySession {
  id: string;
  user_id: string;
  sport_type: string;
  name?: string;
  workout_template_id?: string;
  start_time: string;
  end_time?: string;
  duration_s?: number;
  distance_m?: number;
  calories_kcal?: number;
  avg_heart_rate?: number;
  max_heart_rate?: number;
  elevation_gain_m?: number;
  source: 'manual' | 'suunto' | 'strava' | 'garmin';
  description?: string;
  created_at: string;
}

interface WorkoutTemplate {
  id: string;
  user_id: string;
  base_name: string;
  description?: string;
  suggested_day_of_week?: number;
  is_active: boolean;
  created_at: string;
  workout_template_exercises?: WorkoutTemplateExercise[];
}

interface EnduranceWorkoutTemplate {
  id: string;
  user_id: string;
  base_name: string;
  sport_type: string;
  description?: string;
  workout_goal?: string;
  scheduled_day?: number;
  created_at: string;
  steps?: EnduranceWorkoutStep[];
}

interface EnduranceWorkoutStep {
  id: string;
  template_id: string;
  parent_step_id?: string;
  step_order: number;
  step_type: 'warmup' | 'interval' | 'recovery' | 'cooldown' | 'group';
  distance_m?: number;
  duration_s?: number;
  pace_target?: string;
  zone?: 1 | 2 | 3 | 4 | 5;
  repetitions?: number;
  created_at: string;
  children?: EnduranceWorkoutStep[];
}
```

---

## Mejoras Futuras

### Corto Plazo

- [ ] Temporizador de descanso entre series
- [ ] Gráficas de progreso (peso/reps por ejercicio)
- [ ] Exportar entrenamientos a CSV
- [ ] Sincronización en tiempo real de sesiones activas

### Medio Plazo

- [ ] Notificaciones push para workouts planificados
- [ ] Integración OAuth real con Strava/Suunto
- [ ] Análisis de volumen semanal
- [ ] Recomendaciones de recuperación

### Largo Plazo

- [ ] Análisis de fatiga y sobreentrenamiento
- [ ] Recomendaciones de IA para progresión
- [ ] Social features (compartir workouts)
- [ ] Integración con wearables (Apple Watch, Garmin)
