# Módulo de Nutrición - Documentación Técnica

## Arquitectura

### Stack

- React Native + TypeScript
- TanStack Query
- Open Food Facts API
- Supabase

- Open Food Facts API
- Supabase

**Location**: `src/screens/nutrition/` and `src/modules/nutrition/`

### Estructura

```
src/screens/nutrition/
├── NutritionHomeScreen.tsx      # Dashboard diario y principal
├── MealLogFormScreen.tsx        # Registrar comida (Manual, Buscador, Escáner)
├── NutritionSettingsScreen.tsx  # Ajustes, Configuración de comidas, Export/Import
└── components/                  # Componentes reutilizables (FoodScanner, DaySwitcher, etc.)
```

---

## Componentes Principales

### 1. NutritionHomeScreen

- Resumen diario de macros (Proteína, Carbos, Grasas)
- Progreso vs objetivo calórico
- Lista de comidas del día y gestión de ingesta de agua
- Lógica de "Agenda de Hoy" para comidas planificadas

### 2. MealLogFormScreen

**Archivo**: [`src/screens/nutrition/MealLogFormScreen.tsx`](file:///Users/josep/Projectos/alzan/src/screens/nutrition/MealLogFormScreen.tsx)

**Propósito**: Formulario unificado para registro de comidas.

**Características**:

- Modos: Búsqueda (API Open Food Facts), Escáner (Cámara), Manual, y AI (Recetas).
- Gestión de ingredientes y cálculo automático de macros.
- Búsqueda de alimentos y escáner de código de barras integrados.

### 3. NutritionSettingsScreen

**Archivo**: [`src/screens/nutrition/NutritionSettingsScreen.tsx`](file:///Users/josep/Projectos/alzan/src/screens/nutrition/NutritionSettingsScreen.tsx)

**Propósito**: Configuración específica del módulo (Accesible desde `SettingsNavigator`).

**Características**:

- Configuración de comidas habilitadas (Desayuno, Cena, etc.).
- Planificación Automática: Copia secuencial o alterna de semanas.
- Exportación (PDF) de historial de dieta usando `pdfExportService`.
- Herramientas de limpieza de datos ("Zona de Peligro").

---

## Servicios

### Open Food Facts API

```typescript
const getCaloriesForIngredient = async (name: string, grams: number) => {
  const response = await fetch(
    `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${name}&json=1&fields=code,product_name,nutriments`,
  );

  const data = await response.json();
  const product = data.products[0];

  if (product?.nutriments?.['energy-kcal_100g']) {
    const kcal_100g = product.nutriments['energy-kcal_100g'];
    const totalKcal = (kcal_100g / 100) * grams;

    return {
      name: product.product_name,
      kcal: totalKcal,
      protein: (product.nutriments.proteins_100g / 100) * grams,
      carbs: (product.nutriments.carbohydrates_100g / 100) * grams,
      fat: (product.nutriments.fat_100g / 100) * grams,
    };
  }
};
```

---

## Base de Datos

### `diet_templates`

```sql
CREATE TABLE diet_templates (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `diet_template_meals`

```sql
CREATE TABLE diet_template_meals (
  id UUID PRIMARY KEY,
  template_id UUID REFERENCES diet_templates(id),
  day_of_week INTEGER, -- 0-6
  meal_type TEXT, -- 'breakfast', 'lunch', 'dinner', 'snack'
  name TEXT,
  calories_kcal DECIMAL,
  protein_g DECIMAL,
  carbs_g DECIMAL,
  fat_g DECIMAL
);
```

### `daily_nutrition_logs`

```sql
CREATE TABLE daily_nutrition_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  log_date DATE NOT NULL,
  meal_type TEXT,
  name TEXT,
  calories_kcal DECIMAL,
  protein_g DECIMAL,
  carbs_g DECIMAL,
  fat_g DECIMAL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Hooks

### useDietTemplates

```typescript
const useDietTemplates = () => {
  return useQuery({
    queryKey: ['diet-templates', userId],
    queryFn: async () => {
      return await supabase.from('diet_templates').select('*, diet_template_meals(*)').eq('user_id', userId);
    },
  });
};
```

### useDayNutrition

```typescript
const useDayNutrition = (date: Date) => {
  return useQuery({
    queryKey: ['day-nutrition', userId, format(date, 'yyyy-MM-dd')],
    queryFn: async () => {
      // 1. Fetch logged meals
      const logs = await supabase
        .from('daily_nutrition_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('log_date', format(date, 'yyyy-MM-dd'));

      // 2. Fetch planned meals from active template
      const planned = await supabase.from('diet_template_meals').select('*').eq('day_of_week', date.getDay());

      // 3. Fetch global goals (targets) from user_goals table
      const targets = await supabase
        .from('user_goals')
        .select('*')
        .eq('user_id', userId)
        .eq('goal_type', 'nutrition')
        .single();

      return { logs, planned, targets };
    },
  });
};
```

---

## Mejoras Futuras

- [ ] Recetas personalizadas
- [ ] Planificador de comidas con IA
- [ ] Integración con MyFitnessPal
- [ ] Análisis de micronutrientes
- [ ] Sugerencias basadas en objetivos
