# Módulo Home/Dashboard - Documentación Técnica

## Arquitectura

### Componente Principal

**Archivo**: [`src/screens/home/HomeScreen.tsx`](file:///Users/josep/Projectos/alzan/src/screens/home/HomeScreen.tsx)

**Propósito**: Agregador de datos de todos los módulos.

**Location**: `src/screens/home/HomeScreen.tsx`

---

## Características

### 1. Cabecera (Header)

- **Título**: "Inicio" estilizado según tipografía `h2`.
- **Fecha**: Fecha actual en formato "EEEE, d 'de' MMMM" (localización ES).

### 2. Resumen de Hoy (Statistics)

Grid de 2x2 con tarjetas `GlassCard` interactivas:

- **Peso**: Muestra el último peso registrado. Al hacer tap abre `WeightLogModal`.
- **Sueño**: Última duración de sueño. Navega a `HealthHome`.
- **Calorías**: Kcal consumidas vs objetivo (usando `useDayNutrition`). Navega a `NutritionHome`.
- **Entrenos**: Número de entrenamientos completados. Navega a `TrainingHome`.

### 3. Agenda del Día

Lista vertical de elementos de acción:

- **Siguiente Comida**:
  - Calculada dinámicamente según la hora del día y la configuración del usuario (`notifSettings`).
  - Muestra "Registrado" (verde) o "Restantes" (amarillo).
- **Entrenamiento Pendiente**:
  - Si hay un entreno programado para hoy, muestra tarjeta con botón "Play".
  - Si no, muestra tarjeta genérica de estado.

---

## Logica de Negocio

### Cálculo de Siguiente Comida (`getNextMealType`)

Se determina en base a la hora actual y los horarios definidos en `Settings`:

1. Si `hora_actual < hora_almuerzo` -> Breakfast
2. Si `hora_actual < hora_lunch` -> Almuerzo
3. Si `hora_actual < hora_merienda` -> Lunch (Comida)
4. Si `hora_actual < hora_dinner` -> Merienda
5. Sino -> Dinner (Cena)

La pantalla actualiza este estado cada 60 segundos.

---

## Hooks y Dependencias

### Principales Hooks

- **`useHomeStyles`**: Gestiona estilos dinámicos (Tema Claro/Oscuro) y gradientes.
- **`useDashboardData`**: Obtiene resumen de entrenamientos y salud.
- **`useDayNutrition`**: Obtiene totales y targets de nutrición del día.
- **`useUnitConversion`**: Conversión de unidades de peso y energía.
- **`useSettingsNotifications`**: Obtiene configuración de horarios para cálculo de comidas.
- **`useFocusEffect`**: Invalida queries (`dashboard`, `mealLogs`) al enfocar la pantalla.

## Optimización

### Caché Strategy

- Usar `placeholderData: keepPreviousData`
- Mostrar datos anteriores mientras carga nuevos
- Skeleton loaders solo en primera carga

### Revalidación

- `refetchOnFocus`: true
- `staleTime`: 30 segundos
- Invalidación manual al completar acciones

---

## Mejoras Futuras

- [ ] Widgets personalizables
- [ ] Insights con IA
- [ ] Resumen semanal automático
- [ ] Notificaciones inteligentes
