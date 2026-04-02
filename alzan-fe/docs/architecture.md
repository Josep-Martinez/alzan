# Arquitectura de Alzan Health

## Stack Tecnológico

| Capa           | Tecnología                                 |
| -------------- | ------------------------------------------ |
| **Framework**  | React Native 0.81 + Expo 54                |
| **Navigation** | React Navigation 7 (Stack + Bottom Tabs)   |
| **State**      | TanStack React Query v5                    |
| **Backend**    | Supabase (PostgreSQL + Auth + RLS)         |
| **Styling**    | StyleSheet + Custom Theme ("Liquid Glass") |
| **i18n**       | i18next                                    |

---

## Estructura de Directorios

```
alzan/
├── App.tsx                 # Entry point
├── src/
│   ├── components/         # UI compartida
│   │   ├── GlassCard.tsx   # Tarjeta con efecto glass
│   │   └── stats/
│   │       └── SimpleChart.tsx
│   │
│   ├── context/
│   │   └── AuthContext.tsx # Gestión de autenticación
│   │
│   ├── hooks/              # Hooks globales
│   │
│   ├── lib/
│   │   └── supabaseClient.ts
│   │
│   ├── modules/            # Módulos de dominio
│   │   └── health/         # Ver technical/health_module.md
│   │
│   ├── navigation/
│   │   ├── RootNavigator.tsx
│   │   ├── TabNavigator.tsx
│   │   ├── TrainingStack.tsx
│   │   ├── HealthNavigator.tsx
│   │   └── ...
│   │
│   ├── screens/            # Pantallas por feature
│   │   ├── auth/
│   │   ├── health/
│   │   ├── nutrition/
│   │   ├── settings/
│   │   └── training/
│   │
│   ├── theme/
│   │   └── index.ts        # colors, typography, spacing
│   │
│   └── types/
│       └── database.types.ts  # Tipos auto-generados de Supabase
│
├── docs/                   # Documentación
└── supabase/               # Migraciones y config
```

---

## Patrón de Datos

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐    ┌───────────┐
│  Supabase   │───►│   Services   │───►│    Hooks    │───►│  Screens  │
│   Tables    │    │   (APIs)     │    │(React Query)│    │   & UI    │
└─────────────┘    └──────────────┘    └─────────────┘    └───────────┘
      ▲                                       │
      │                                       │
      └───────────────mutations───────────────┘
```

### Flujo de Lectura

1. Screen monta → Hook se ejecuta → Service hace fetch → Supabase responde
2. React Query cachea automáticamente

### Flujo de Escritura

1. Usuario input → Mutation hook → Service inserta → Supabase guarda
2. `queryClient.invalidateQueries()` refresca datos

---

## Navegación

```
RootNavigator
├── AuthStack (si no autenticado)
│   ├── LoginScreen
│   └── RegisterScreen
│
└── TabNavigator (si autenticado)
    ├── Home Tab
    │   └── HomeScreen
    │
    ├── Training Tab → TrainingStack
    │   ├── TrainingHome
    │   ├── GymRoutinesList
    │   ├── ActiveWorkout
    │   └── ...
    │
    ├── Nutrition Tab → NutritionNavigator
    │   └── ...
    │
    ├── Health Tab → HealthNavigator
    │   ├── HealthHome
    │   ├── WeightAdd
    │   ├── MeasurementAdd
    │   └── ...
    │
    └── Settings Tab → SettingsNavigator
        ├── SettingsHome
        ├── ProfileSettings
        ├── TrainingSettings
        ├── NutritionSettings
        └── ...
```

---

## Design System: "Liquid Glass"

### Colores (Dark Theme)

```typescript
const colors = {
  background: '#0A0A0F', // Fondo principal
  surface: '#1A1A2E', // Tarjetas/superficies
  primary: '#007AFF', // Acento principal
  textPrimary: '#FFFFFF',
  textSecondary: '#8E8E93',
  success: '#10B981',
  error: '#EF4444',
};
```

### Componente GlassCard

```tsx
<GlassCard style={{ padding: 16 }}>
  <Text>Contenido</Text>
</GlassCard>
```

- Fondo semi-transparente
- Borde sutil blanco
- Sombra suave

---

## Autenticación

Manejada por `AuthContext`:

```typescript
const { user, session, signIn, signOut, isLoading } = useAuth();
```

- Supabase Auth con email/password
- Tokens almacenados en SecureStore
- Sesión persistente

---

## Supabase & RLS

Todas las tablas usan Row Level Security:

```sql
CREATE POLICY "Users access own data"
  ON table_name FOR ALL
  USING (user_id = auth.uid());
```

El cliente se configura en `src/lib/supabaseClient.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types';

export const supabase = createClient<Database>(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
);
```

---

## Convenciones

### Naming

- Screens: `PascalCase` + `Screen.tsx` suffix
- Hooks: `useCamelCase.ts`
- Services: `camelCaseApi.ts`
- Components: `PascalCase.tsx`

### Estructura de Hook

```typescript
// useWeight.ts
export const useWeightLogs = (days = 30) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['weight-logs', user?.id, days],
    queryFn: () => fetchWeightLogs(user!.id, days),
    enabled: !!user,
  });
};
```

### Mutations

```typescript
export const useAddWeightLog = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: data => addWeightLog(user!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weight-logs'] });
    },
  });
};
```
