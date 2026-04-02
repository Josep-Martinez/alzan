# Guía Técnica de Arquitectura Frontend - ALZAN Health

**Fecha:** 20 Diciembre 2025
**Plataforma:** React Native (Expo) + TypeScript + Supabase

---

## 1. Estructura del Proyecto

La aplicación sigue una arquitectura modular basada en "features" (funcionalidades) dentro de `src/`.

```
src/
├── components/     # UI Reutilizable (Buttons, Inputs, Cards)
├── context/        # Estado Global (Auth, Theme)
├── hooks/          # Lógica de negocio (useExercises, useNutrition)
├── navigation/     # Configuradores de rutas (Stacks, Tabs)
├── screens/        # Pantallas agrupadas por módulo
│   ├── auth/       # Login, Registro, Recuperación
│   ├── onboarding/ # Flujo de bienvenida y configuración
│   ├── home/       # Dashboard principal
│   ├── training/   # Rutinas y Ejercicios
│   ├── nutrition/  # Dieta y Alimentos
│   ├── health/     # Métricas de salud (Peso, Sueño)
│   ├── stats/      # Gráficos y Análisis
│   └── settings/   # Configuración de usuario
├── services/       # Integraciones externas (Supabase, API AI)
├── theme/          # Sistema de diseño (Colores, Tipografía)
└── utils/          # Helpers y Funciones Puras
```

---

## 2. Flujo de Navegación (`src/navigation/`)

La navegación se gestiona con `React Navigation 6` y se divide en 3 estados principales controlados por `RootNavigator.tsx`:

### 2.1. Estado: No Autenticado (`AuthStack`)

El usuario no tiene sesión.

- **AuthScreen:** Acceso principal (Login).
- **SignUpEmail / SignUpPassword:** Flujo de registro.
- **VerifyEmail:** _[ NUEVO ]_ Pantalla de verificación OTP (6 dígitos).
- **ForgotPassword / ResetPassword:** Recuperación de cuenta.

### 2.2. Estado: Onboarding (`OnboardingNavigator`)

Usuario autenticado pero con `onboarding_step` incompleto.
Flujo lineal:

1.  **Identity:** Nombre y Username (validado por RPC).
2.  **Goal:** Objetivo principal (Ganar músculo, perder grasa, etc.).
3.  **Physical:** Peso, Altura.
4.  **Activity:** Nivel de actividad diaria.
5.  **Profile:** Sexo, Fecha nacimiento.
6.  **Units:** Preferencias métricas/imperiales.
7.  **Health:** Consentimiento de datos de salud.
8.  **Consent:** Términos legales.
9.  **Complete:** Carga inicial de datos.

### 2.3. Estado: App Principal (`TabNavigator`)

Usuario autenticado y onboarding completo.

- **Home:** Resumen del día (Dashboard).
- **Training:** Rutinas, Historial, Ejercicios.
- **Nutrition:** Registro de comidas, Macros.
- **Stats:** Análisis de progreso.
- **Settings:** Configuración general.

---

## 3. Desglose de Módulos y Pantallas

### A. Autenticación (`src/screens/auth/`)

- **Lógica Clave:** `useAuth` (Context).
- **Seguridad:** Redirección automática a `VerifyEmail` si se detecta `email_not_confirmed` al hacer login.
- **Integraciones:** Google/Apple Sign-In (preparado en `services/oauth.ts`).

### B. Entrenamiento (`src/screens/training/`)

- **TrainingHomeScreen:** Vista calendario de la semana. Muestra el entreno de hoy.
- **GymRoutineEditor:** Creación/Edición de rutinas.
  - _Nota Técnica:_ Usa `navigation.setOptions` o parámetros planos para recibir ejercicios seleccionados (evita warnings de serialización).
- **ExerciseSearchScreen:** Buscador de ejercicios con filtros (Músculo/Material).
  - _Datos:_ `useExercises` conecta con Supabase y gestiona caché con React Query.
- **ActiveSessionScreen:** Pantalla de ejecución del entrenamiento (Series, Cronómetro).

### C. Nutrición (`src/screens/nutrition/`)

- **NutritionHomeScreen:** Resumen de calorías y macros del día.
- **MealLogFormScreen:** Buscador de alimentos (Base de datos propia + API externa) y registro manual.

### D. Configuración (`src/screens/settings/`)

- **SettingsNavigator:** Gestiona todas las pantallas de configuración.
- **ProfileScreen:** Edición de datos personales.
- **NutritionSettingsScreen:** Configuración de comidas y planificador (Movido aquí).
- **TrainingSettingsScreen:** Ajustes de entreno (Movido aquí).

* **SecurityScreen:** Cambio de contraseña.
* **DataScreen:** Exportación de datos y **Eliminación de Cuenta**.
  - _Lógica de Borrado:_ Usa `deleteUser.ts` que combina RPC sql con Admin API para una limpieza total (GDPR compliant).

---

## 4. Gestión de Estado y Datos

- **Usuario/Sesión:** `AuthContext.tsx`. Persiste sesión con `AsyncStorage`.
- **Datos de Servidor:** `TanStack Query` (React Query).
  - Caching automático.
  - Revalidación en segundo plano.
  - Hooks custom: `useExercises`, `useWorkouts`, `useDiet`.
- **Formularios:** Estado local (`useState`) controlado. En Onboarding se usa un patrón de "override" para asegurar que los datos viajan a la BD antes de navegar.

## 5. Sistema de Diseño (`src/theme/`)

- **Glassmorphism:** Componente `GlassCard.tsx` usado extensivamente.
- **Colores:** Definidos en `theme.ts` (Soporte Light/Dark mode).
- **Tipografía:** Escala definida (`h1`, `body`, `caption`).

---

## 6. Comandos Útiles

- `npx expo start`: Iniciar servidor de desarrollo.
- `npx expo prebuild`: Generar carpetas nativas (android/ios).
- `pnpm format`: Formatear código (Prettier).
- `pnpm run lint:check`: Verificar calidad de código (ESLint).

---

## 7. Habilidades de Desarrollo (Skills)

El proyecto incluye skills configuradas en `.agents/skills` para asistir al desarrollo con IA:

- **`pnpm-quality-gate`**: Ejecuta formateo y linting automáticamente. Úsalo al finalizar tareas de edición.
- **`database-schema`**: Proporciona el esquema SQL completo para consultas y entendimiento del modelo de datos.
- **`skill-crafter-perfect`**: Guía para crear y mantener nuevas skills siguiendo las mejores prácticas.

---

_Documentación generada automáticamente por ALZAN Assistant_
