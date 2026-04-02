# Documentación de Algoritmos - Alzan Health

Este documento detalla el funcionamiento interno de los algoritmos utilizados en la plataforma Alzan para los módulos de Salud, Nutrición y Entrenamiento.

> **Estado**: Verificado y en Producción
> **Última Auditoría**: Febrero 2026

---

## 1. Motor de Salud (Composición Corporal)

El módulo de salud utiliza un sistema de **selección adaptativa** (Waterfall Logic). No usa una única fórmula, sino que elige automáticamente la más precisa posible basándose en los datos disponibles del usuario.

> **Nota sobre Vigencia de Datos**: Para garantizar la precisión, las medidas antropométricas (cintura, cadera, etc.) solo se consideran válidas si tienen **menos de 14 días** de antigüedad. Si son más antiguas, el algoritmo las ignora y pasa al siguiente método disponible (fallback).

### 1.1 Índice de Masa Corporal (IMC / BMI)

Es el cálculo base para clasificaciones generales.

- **Fórmula**: `Peso (kg) / Altura (m)²`
- **Interpretación**: Se ajusta ligeramente según sexo (mujeres tienen un límite de "Normal" en 24.4, hombres en 24.9).

### 1.2 Porcentaje de Grasa Corporal

El algoritmo evalúa los datos en el siguiente orden de prioridad:

1.  **Medición Directa (Prioridad Máxima)**: Si el usuario introduce un % de grasa manual (ej. de una báscula de bioimpedancia), este valor prevalece sobre cualquier cálculo.
2.  **RFM - Relative Fat Mass (Alta Precisión)**: Se usa si hay **Altura** y **Abdomen**.
    - _Fórmula (Hombres)_: `64 - 20 * (Altura / Abdomen)`
    - _Fórmula (Mujeres)_: `76 - 20 * (Altura / Abdomen)`
    - _Referencia_: Woolcott & Bergman (2018).
3.  **BAI - Body Adiposity Index (Media Precisión)**: Fallback si no hay abdomen pero sí **Cadera**.
    - _Fórmula_: `(Cadera / Altura^1.5) - 18`
4.  **CUN-BAE (Estimación Base)**: Fallback final si solo hay Peso, Altura y Edad.
    - _Funcionamiento_: Utiliza el IMC ajustado por edad y sexo. Es menos preciso para atletas con mucha masa muscular que el RFM.

### 1.3 Masa Muscular

Similar a la grasa, selecciona la mejor fórmula según las medidas:

1.  **Al-Gindan et al. (Alta Precisión)**: Requiere **Abdomen y Cadera** (en hombres) o **Cadera** (en mujeres). Validado mediante resonancia magnética (MRI).
2.  **Lee et al. (Estimación Base)**: Fallback estándar. Usa Peso, Altura y Edad.

---

## 2. Motor de Nutrición

Calcula las necesidades calóricas y distribución de macronutrientes asegurando mínimos saludables.

### 2.1 Metabolismo Basal (BMR)

Utiliza la fórmula de **Mifflin-St Jeor**, considerada el estándar de oro para población general sana.

- _Inputs_: Peso, Altura, Edad, Sexo.

### 2.2 Gasto Energético Total (TDEE) - Sistema Híbrido

Combina dos factores para mayor precisión que el sistema clásico de multiplicador único:

1.  **Actividad Diaria (NEAT)**: Factor base por movimiento no deportivo (Sedentario 1.15, Activo 1.35, Físico 1.55).
2.  **Frecuencia de Entrenamiento (EAT)**: Sumador extra según días de entreno (Ocasional +0.2, Frecuente +0.4, Atleta +0.75).

### 2.3 Estrategia de "Rescate" de Macros

Cuando las calorías objetivo son muy bajas (déficit agresivo), el motor prioriza nutrientes esenciales en este orden ("Waterfall de Seguridad"):

1.  **Proteína**: Se asegura primero (mínimo 1.6-2.0 g/kg para preservar músculo).
2.  **Grasas**: Se asegura un mínimo vital hormonal (0.5g/kg).
3.  **Carbohidratos**: Se rellenan con las calorías restantes.
    - _Safe Guard_: Si al cubrir proteína y grasas no quedan calorías para carbohidratos, el sistema **automáticamente aumenta las calorías totales** para garantizar un mínimo de salud, ignorando el déficit estricto.

---

## 3. Motor de Entrenamiento (Calculadora de Calorías)

Estima el gasto calórico de sesiones deportivas basándose en intensidad relativa (RPE) y física.

### 3.1 Lógica General

Formula: `METs * Peso (kg) * Duración (h)`

- **MET (Metabolic Equivalent of Task)**: Se determina dinámicamente.
- **Factor de Corrección por Sexo**: Se aplica un ajuste del 0.95 para mujeres debido a diferencias metabólicas promedio.

### 3.2 Lógica por Deporte

| Deporte          | Datos Principales    | Cómo se calculan los METs                                                                                                   |
| :--------------- | :------------------- | :-------------------------------------------------------------------------------------------------------------------------- |
| **Running**      | Distancia + Tiempo   | Se calcula la **velocidad real**. <br>Ej: <8km/h = 6 METs, >12km/h = 11.5 METs. <br>Si falta tiempo, usa distancia \* peso. |
| **Ciclismo**     | Distancia + Tiempo   | Velocidad media. <br>Ej: <16km/h = 4 METs, >26km/h = 10 METs.                                                               |
| **Natación**     | RPE (Esfuerzo)       | Basado puramente en RPE (3-9).                                                                                              |
| **Fútbol/Tenis** | RPE + Tiempo         | Tablas estándar deportivas ajustadas por intensidad percibida.                                                              |
| **Senderismo**   | Desnivel + Distancia | Si hay desnivel, calcula la pendiente media para subir los METs. Si no, usa RPE.                                            |

### 3.3 Ajustes Avanzados

- **RPE (Esfuerzo Percibido)**: Modifica el cálculo final hasta un ±10%.
- **Desnivel (Running/Hiking)**: Añade un 5% de calorías extra por cada 1000m de desnivel acumulado.

---

> **Nota para Desarrolladores**:
> El código fuente se encuentra en:
>
> - `src/modules/health/algorithms/bodyComposition.ts`
> - `src/modules/nutrition/algorithms/nutritionCalculator.ts`
> - `src/utils/caloriesEstimator.ts`
