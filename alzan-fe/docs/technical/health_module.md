# Módulo de Salud - Documentación Técnica

## Índice

1. [Arquitectura](#arquitectura)
2. [Componentes y Pantallas](#componentes-y-pantallas)
3. [Algoritmos de Cálculo](#algoritmos-de-cálculo)
4. [Hooks y Servicios](#hooks-y-servicios)
5. [Base de Datos](#base-de-datos)
6. [Características Recientes](#características-recientes)

---

## Arquitectura

### Stack Tecnológico

- **Frontend**: React Native + TypeScript
- **State Management**: TanStack Query
- **Backend**: Supabase
- **Gráficos**: Victory Native (react-native-svg)
- **UI**: Custom components (RangeBar, HealthInteractiveChart)

### Estructura de Módulo

```
src/modules/health/
├── algorithms/           # Cálculos de composición corporal
│   └── bodyComposition.ts # Algoritmos unificados (IMC, Grasa, Músculo)
├── components/          # Componentes específicos
│   ├── RangeBar.tsx
│   ├── HealthInteractiveChart.tsx
│   └── SimpleChart.tsx
├── constants/           # Rangos y configuraciones
│   └── bodyCompositionRanges.ts
├── hooks/               # Data fetching
│   ├── useHealthInsights.ts
│   ├── useWeight.ts
│   └── useMeasurements.ts
├── screens/             # Pantallas
│   ├── HealthHome.tsx
│   ├── BodyCompositionDetail.tsx
│   ├── HealthStatisticsScreen.tsx # Gráficos y estadísticas agregadas
│   ├── WeightAdd.tsx
│   ├── WeightList.tsx
│   ├── MeasurementAdd.tsx
│   ├── MeasurementDetail.tsx # Historial específico de una medida
│   ├── MeasurementsList.tsx
│   ├── RestingHRList.tsx     # Historial de Frecuencia Cardíaca en Reposo
│   ├── SleepAdd.tsx          # Registrar sueño
│   └── SleepList.tsx         # Historial de sueño
└── services/            # APIs
    ├── weightApi.ts
    └── measurementApi.ts
```

---

## Componentes y Pantallas

### 1. HealthHome

**Archivo**: [`src/modules/health/screens/HealthHome.tsx`](file:///Users/josep/Projectos/alzan/src/modules/health/screens/HealthHome.tsx)

**Propósito**: Dashboard principal del módulo de salud.

**Características**:

- Tarjeta de peso actual con tendencia
- Tarjeta de composición corporal (IMC, % grasa)
- Accesos rápidos a registrar peso/medidas
- Gráfico de tendencia de peso

---

### 2. BodyCompositionDetail

**Archivo**: [`src/modules/health/screens/BodyCompositionDetail.tsx`](file:///Users/josep/Projectos/alzan/src/modules/health/screens/BodyCompositionDetail.tsx)

**Propósito**: Vista detallada de composición corporal con cálculos avanzados.

**Características Recientes**:

#### Cálculo Automático de Métricas

```typescript
const { bodyComposition } = useHealthInsights();

// bodyComposition contiene:
{
  bmi: { value: 24.5, category: 'normal' },
  bodyFat: {
    percentage: 18.5,
    method: 'deurenberg' | 'bai' | 'whtr' | 'anthropometry_full',
    massKg: 13.2
  },
  muscle: {
    percentage: 42.3,
    method: 'al_gindan' | 'cmc_advanced',
    massKg: 30.1
  },
  availableData: {
    hasBasicData: true,
    hasAbdomen: true,
    hasHip: true,
    hasFullAnthropometry: false
  }
}
```

#### Modal de Información Rediseñado (Bottom Sheet)

```typescript
const [infoModal, setInfoModal] = useState<'bmi' | 'bodyFat' | 'muscle' | null>(null);

// Modal con:
// - Slide-up animation
// - Colores temáticos por métrica
// - Explicación de cálculo
// - Tips dinámicos según datos disponibles
```

**Colores Temáticos**:

- IMC: Azul (#3B82F6)
- Grasa Corporal: Verde (#10B981)
- Masa Muscular: Morado (#8B5CF6)

#### RangeBar con Segmentos Dinámicos

```typescript
// Rangos específicos por edad y sexo
const bodyFatRanges = useMemo(() =>
  getBodyFatRanges(userAge, isFemale),
  [userAge, isFemale]
);

<RangeBar
  value={bodyComposition.bodyFat.percentage}
  min={5}
  max={45}
  segments={bodyFatSegments}
  label="Grasa Corporal"
/>
```

---

### 3. WeightAdd

**Archivo**: [`src/modules/health/screens/WeightAdd.tsx`](file:///Users/josep/Projectos/alzan/src/modules/health/screens/WeightAdd.tsx)

**Propósito**: Registro de peso con fecha personalizada.

**Características Recientes**:

#### Selector de Fecha Inline (iOS)

```typescript
const [showDatePicker, setShowDatePicker] = useState(false);

{Platform.OS === 'ios' && showDatePicker && (
  <View style={styles.inlinePickerContainer}>
    <DateTimePicker
      value={selectedDate}
      mode="date"
      display="inline"  // Wheel picker inline
      maximumDate={new Date()}
      onChange={(event, date) => {
        if (date) setSelectedDate(date);
      }}
      themeVariant="light"
    />
  </View>
)}
```

**Validaciones**:

- Peso: 20-300 kg
- Fecha: No puede ser futura
- % Grasa (opcional): 3-60%

---

### 4. MeasurementAdd

**Archivo**: [`src/modules/health/screens/MeasurementAdd.tsx`](file:///Users/josep/Projectos/alzan/src/modules/health/screens/MeasurementAdd.tsx)

**Propósito**: Registro de medidas corporales.

**Medidas Soportadas**:

```typescript
type MeasurementType =
  | 'abdomen' // Abdomen
  | 'hips' // Cadera
  | 'chest' // Pecho
  | 'arm' // Brazo
  | 'thigh' // Muslo
  | 'neck'; // Cuello
```

**Selector de Fecha Inline**: Igual que WeightAdd

---

### 5. HealthInteractiveChart

**Archivo**: [`src/modules/health/components/HealthInteractiveChart.tsx`](file:///Users/josep/Projectos/alzan/src/modules/health/components/HealthInteractiveChart.tsx)

**Propósito**: Gráfico interactivo estilo Apple Health.

**Características**:

- Línea Bézier suave con gradiente
- Puntos clickeables con tooltip
- Filtros de tiempo: 1 semana, 1 mes, 3 meses, 6 meses, 1 año, todo
- Fallback inteligente si no hay datos en rango

**Filtros**:

```typescript
type TimeFilter = '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL';

const filterData = (filter: TimeFilter) => {
  const now = new Date();
  let startDate: Date;

  switch (filter) {
    case '1W':
      startDate = subDays(now, 7);
      break;
    case '1M':
      startDate = subMonths(now, 1);
      break;
    case '3M':
      startDate = subMonths(now, 3);
      break;
    case '6M':
      startDate = subMonths(now, 6);
      break;
    case '1Y':
      startDate = subYears(now, 1);
      break;
    case 'ALL':
      return allData;
  }

  return data.filter(d => new Date(d.date) >= startDate);
};
```

---

## Algoritmos de Cálculo

### 1. IMC (Índice de Masa Corporal)

**Ubicación**: `src/modules/health/algorithms/bodyComposition.ts`

```typescript
export const calculateBMI = (weightKg: number, heightCm: number): number => {
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
};

export const getBMICategory = (bmi: number): string => {
  if (bmi < 18.5) return 'underweight';
  if (bmi < 25) return 'normal';
  if (bmi < 30) return 'overweight';
  if (bmi < 35) return 'obese_1';
  if (bmi < 40) return 'obese_2';
  return 'obese_3';
};
```

**Rangos OMS**:

- Bajo peso: < 18.5
- Normal: 18.5 - 24.9
- Sobrepeso: 25 - 29.9
- Obesidad I: 30 - 34.9
- Obesidad II: 35 - 39.9
- Obesidad III: ≥ 40

---

### 2. Porcentaje de Grasa Corporal

**Archivo**: [`src/modules/health/algorithms/bodyComposition.ts`](file:///Users/josep/Projectos/alzan/src/modules/health/algorithms/bodyComposition.ts)

#### Método CUN-BAE (Escenario A - Básico)

```typescript
export const calculateBodyFatCUNBAE = (
  bmi: number,
  age: number,
  sex: 'male' | 'female'
): number => {
  const isFemale = sex === 'female' ? 1 : 0;
  // Fórmula validada por Universidad de Navarra
  return -44.988 + (0.503 * age) + ...;
};
```

**Uso**: Estándar actual (Escenario A) cuando solo hay peso, altura, edad y sexo. Más preciso que Deurenberg.

#### Método RFM (Relative Fat Mass - Escenario B)

```typescript
export const calculateBodyFatRFM = (heightCm: number, abdomenCm: number, sex: 'male' | 'female'): number => {
  // Fórmula Woolcott & Bergman (2018)
  const sexFactor = sex === 'female' ? 1 : 0;
  return 64 - 20 * (heightCm / abdomenCm) + 12 * sexFactor;
};
```

**Uso**: Preferido (Escenario B) cuando hay medida de **abdomen**. No depende del peso ni IMC.

#### Método BAI (Body Adiposity Index)

```typescript
export const calculateBAI = (hipCm: number, heightCm: number): number => {
  const heightM = heightCm / 100;
  return hipCm / Math.pow(heightM, 1.5) - 18;
};
```

**Uso**: Cuando hay medida de cadera.

#### Método WHtR (Waist-to-Height Ratio)

```typescript
export const calculateWHtR = (abdomenCm: number, heightCm: number): number => {
  return abdomenCm / heightCm;
};

export const whtRtoBodyFat = (whtr: number, isFemale: boolean): number => {
  // Conversión basada en estudios
  if (isFemale) {
    return (whtr - 0.35) * 100 + 15;
  } else {
    return (whtr - 0.35) * 100 + 10;
  }
};
```

**Uso**: Cuando hay medida de abdomen.

#### Método Combinado (BAI + WHtR)

```typescript
export const calculateBodyFatCombined = (bai: number, whtr: number, isFemale: boolean): number => {
  const whtrBF = whtRtoBodyFat(whtr, isFemale);
  return bai * 0.6 + whtrBF * 0.4;
};
```

**Uso**: Cuando hay abdomen y cadera.

#### Método Antropometría Completa (Navy Adaptado)

```typescript
export const calculateBodyFatFull = (
  abdomenCm: number,
  hipCm: number,
  chestCm: number,
  armCm: number,
  thighCm: number,
  heightCm: number,
  bmi: number,
  isFemale: boolean,
): number => {
  // Algoritmo complejo con todas las medidas
  // Basado en Navy Method adaptado
  // Mayor precisión
};
```

**Uso**: Cuando hay todas las medidas corporales.

---

### 3. Preferencia de Importación de Métricas

**Archivo**: [`src/hooks/settings/usePreferences.ts`](file:///Users/josep/Projectos/alzan/src/hooks/settings/usePreferences.ts)

```typescript
interface UserPreferences {
  import_health_metrics: boolean; // NUEVO
  distance_unit: 'km' | 'mi';
  temperature_unit: 'C' | 'F';
}
```

**Lógica de Priorización**:

```typescript
const calculateBodyFat = () => {
  // 1. Si import_health_metrics está activado Y hay loggedBodyFat
  if (preferences.import_health_metrics && latestWeight.bodyfat_percent) {
    return { ... };
  }

  // 2. Escenario B: Si hay Abdomen (RFM)
  if (hasAbdomen) {
    return calculateBodyFatRFM(height, abdomen, sex);
  }

  // 3. Fallback B: Si hay Cadera pero no Abdomen (BAI)
  else if (hasHip) {
    return calculateBodyFatBAI(height, hip);
  }

  // 4. Escenario A: Datos básicos (CUN-BAE)
  else {
    return calculateBodyFatCUNBAE(bmi, age, sex);
  }
};
```

**Implementación en Settings**:

```tsx
<Switch
  value={preferences?.import_health_metrics ?? false}
  onValueChange={val => updatePreferences({ import_health_metrics: val })}
  trackColor={{ false: '#767577', true: colors.primary + '50' }}
  thumbColor={preferences?.import_health_metrics ? colors.primary : '#FFFFFF'}
/>
```

---

### 4. Masa Muscular

**Ubicación**: `src/modules/health/algorithms/bodyComposition.ts`

#### Método Al-Gindan (Básico)

```typescript
export const calculateMuscleMassAlGindan = (
  weightKg: number,
  heightCm: number,
  age: number,
  isFemale: boolean,
): number => {
  const heightM = heightCm / 100;
  const sexFactor = isFemale ? 0 : 1;

  return 0.244 * weightKg + 7.8 * heightM + 6.6 * sexFactor - 0.098 * age + 0.4;
};
```

**Uso**: Cuando solo hay datos básicos.

#### Método CMC Avanzado (Circunferencia Muscular Corregida)

```typescript
export const calculateMuscleMassCMC = (
  chestCm: number,
  armCm: number,
  thighCm: number,
  heightCm: number,
  isFemale: boolean,
): number => {
  // CMC = circunferencia - (π × pliegue_cutáneo)
  // Asumiendo pliegue promedio de 0.5 cm
  const cmcChest = chestCm - Math.PI * 0.5;
  const cmcArm = armCm - Math.PI * 0.5;
  const cmcThigh = thighCm - Math.PI * 0.5;

  const k = isFemale ? -2.5 : 0;

  return 0.01 * (Math.pow(cmcArm, 2) + Math.pow(cmcThigh, 2) + Math.pow(cmcChest, 2)) + 0.12 * heightCm + k;
};
```

**Uso**: Cuando hay medidas de pecho, brazo y muslo.

---

## Hooks y Servicios

### useHealthInsights

**Archivo**: [`src/modules/health/hooks/useHealthInsights.ts`](file:///Users/josep/Projectos/alzan/src/modules/health/hooks/useHealthInsights.ts)

**Propósito**: Hook agregado que calcula todas las métricas de salud.

```typescript
export const useHealthInsights = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { data: weightLogs } = useWeightLogs(2);
  const { data: measurements } = useMeasurements();
  const { preferences } = useUserPreferences();

  const bodyComposition = useMemo(() => {
    // Obtener datos disponibles
    const availableData = {
      hasBasicData: !!(profile?.height_cm && weightLogs?.[0]),
      hasAbdomen: !!measurements?.find(m => m.measurement_type === 'abdomen'),
      hasHip: !!measurements?.find(m => m.measurement_type === 'hips'),
      hasChest: !!measurements?.find(m => m.measurement_type === 'chest'),
      hasArm: !!measurements?.find(m => m.measurement_type === 'arm'),
      hasThigh: !!measurements?.find(m => m.measurement_type === 'thigh'),
      hasNeck: !!measurements?.find(m => m.measurement_type === 'neck'),
    };

    availableData.hasFullAnthropometry =
      availableData.hasWaist &&
      availableData.hasHip &&
      availableData.hasChest &&
      availableData.hasArm &&
      availableData.hasThigh;

    // Calcular IMC
    const bmi = calculateBMI(weight, height);

    // Calcular % grasa (con priorización)
    const bodyFat = calculateBodyFatWithPriority(
      availableData,
      preferences.import_health_metrics,
      weightLogs[0].bodyfat_percent,
    );

    // Calcular masa muscular
    const muscle = calculateMuscleMass(availableData);

    return { bmi, bodyFat, muscle, availableData };
  }, [profile, weightLogs, measurements, preferences]);

  return { bodyComposition, latestWeight, age };
};
```

---

### useWeightLogs

**Archivo**: [`src/modules/health/hooks/useWeight.ts`](file:///Users/josep/Projectos/alzan/src/modules/health/hooks/useWeight.ts)

```typescript
export const useWeightLogs = (days?: number) => {
  return useQuery({
    queryKey: ['weight-logs', user?.id, days],
    queryFn: async () => {
      let query = supabase
        .from('weight_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('measured_at', { ascending: false });

      if (days) {
        const startDate = subDays(new Date(), days).toISOString();
        query = query.gte('measured_at', startDate);
      }

      return query;
    },
  });
};

export const useAddWeightLog = () => {
  return useMutation({
    mutationFn: async (data: { weight_kg: number; measured_at: string; bodyfat_percent?: number }) => {
      return await supabase.from('weight_logs').insert({
        user_id: user.id,
        ...data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['weight-logs']);
      queryClient.invalidateQueries(['health-insights']);
    },
  });
};
```

---

## Base de Datos

### Tabla: `weight_logs`

```sql
CREATE TABLE weight_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  weight_kg DECIMAL(5,2) NOT NULL,
  bodyfat_percent DECIMAL(4,1),  -- Opcional, de báscula inteligente
  muscle_mass_kg DECIMAL(5,2),   -- Opcional, calculado o medido
  measured_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_weight_logs_user_date ON weight_logs(user_id, measured_at DESC);
```

### Tabla: `body_measurements`

```sql
CREATE TABLE body_measurements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  measurement_type TEXT NOT NULL,  -- 'waist', 'hips', 'chest', 'arm', 'thigh', 'neck'
  value_cm DECIMAL(5,1) NOT NULL,
  measured_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_measurements_user_type ON body_measurements(user_id, measurement_type, measured_at DESC);
```

### Tabla: `user_preferences`

```sql
ALTER TABLE user_preferences
ADD COLUMN import_health_metrics BOOLEAN DEFAULT FALSE;
```

---

## Características Recientes

### 1. Cálculo Automático de IMC y % Grasa

- **Siempre calculado** con fórmulas basadas en datos disponibles
- **Priorización inteligente**: Usa método más preciso según medidas disponibles
- **Preferencia de importación**: Toggle para usar datos de báscula inteligente

### 2. Preferencia "Importar Métricas de Salud"

- **Ubicación**: Settings > Preferencias
- **Función**: Controla si se usan datos de apps externas (báscula, Apple Health)
- **Lógica**: Si activado Y hay `bodyfat_percent` en weight_log, usar ese valor

### 3. Modal de Información Rediseñado

- **Diseño**: Bottom sheet con slide-up animation
- **Colores temáticos**: Azul (IMC), Verde (Grasa), Morado (Músculo)
- **Contenido dinámico**: Tips según datos disponibles
- **Explicación de cálculo**: Muestra fórmula y método usado

### 4. Selector de Fecha Inline (iOS)

- **Componente**: `DateTimePicker` con `display="inline"`
- **Ubicación**: WeightAdd, MeasurementAdd
- **Ventaja**: Wheel picker nativo sin modal

### 5. Gráficos Interactivos Mejorados

- **Filtros de tiempo**: 1W, 1M, 3M, 6M, 1Y, ALL
- **Fallback inteligente**: Si no hay datos en rango, expande automáticamente
- **Tooltip**: Muestra valor exacto al tocar punto

---

## Mejoras Futuras

- [ ] Integración con Apple Health / Google Fit
- [ ] Fotos de progreso con comparación lado a lado
- [ ] Predicción de tendencia con IA
- [ ] Alertas de cambios significativos
- [ ] Exportar datos a PDF
- [ ] Sincronización con básculas Bluetooth
- [ ] Análisis de composición corporal por segmentos
- [ ] Recomendaciones personalizadas de nutrición
