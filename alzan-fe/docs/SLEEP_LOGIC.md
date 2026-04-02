# Lógica del Módulo de Sueño (Sleep Feature Logic)

Este documento detalla la lógica implementada para el registro y gestión del sueño en la aplicación, específicamente cómo se manejan las fechas, los horarios y las estadísticas.

## 1. Semántica de "Noche de..." (Date Logic)

El sistema utiliza una lógica basada en la **"Noche del día X"** para mantener la consistencia en el historial y las rachas, independientemente de si el usuario se duerme antes o después de la medianoche.

### Principio General
La fecha seleccionada en el calendario (`date` en base de datos) representa la **fecha contable** del sueño, no necesariamente el día en que ocurren todas las horas de sueño.

### Reglas de Cálculo de Tiempo

Cuando un usuario registra un sueño para una fecha seleccionada (ej: **Martes 17**):

1.  **Hora de Despertar (`sleep_end`)**:
    *   Si la hora es anterior a las **14:00 (2 PM)**, se asume que pertenece al **día siguiente** (Miércoles 18).
    *   Si la hora es posterior a las 14:00, se asume que pertenece al **mismo día** seleccionado (Martes 17) - *Caso de siesta*.

2.  **Hora de Dormir (`sleep_start`)**:
    *   Si la hora es anterior a las **14:00 (2 PM)** (ej: 01:00 AM), se asume que pertenece al **día siguiente** (Miércoles 18).
        *   *Ejemplo: Trasnochar hasta la 1 AM.*
    *   Si la hora es posterior a las 14:00 (ej: 23:00 PM), se asume que pertenece al **mismo día** seleccionado (Martes 17).

### Ejemplos Prácticos (Seleccionando "Martes 17")

| Caso de Uso | Horario Introducido | Fecha Guardada (`date`) | Inicio Real (`sleep_start`) | Fin Real (`sleep_end`) |
| :--- | :--- | :--- | :--- | :--- |
| **Normal** | 23:00 - 07:00 | **2025-12-17** | 2025-12-17T23:00:00 | 2025-12-18T07:00:00 |
| **Madrugada** | 01:00 - 09:00 | **2025-12-17** | 2025-12-18T01:00:00 | 2025-12-18T09:00:00 |
| **Siesta** | 15:00 - 16:00 | **2025-12-17** | 2025-12-17T15:00:00 | 2025-12-17T16:00:00 |

---

## 2. Estadísticas y Visualización

### Gráficos
*   **Agrupación**: Los datos se agrupan por el campo `date`.
*   **Media**: Se calcula sumando la duración en minutos de todos los registros del periodo y dividiendo por el número de registros **existentes**. Los días sin datos no bajan la media (no cuentan como 0).

### Tendencia
*   Se calcula comparando la primera mitad del periodo seleccionado con la segunda mitad.
*   **Requisito Mínimo**: Se requiere un mínimo de **2 registros** (uno en cada mitad del periodo) para mostrar una tendencia fiable. Si no hay suficientes datos, se muestra "--".

### Historial
*   Muestra la fecha contable (`date`) para facilitar la búsqueda ("Sueño del Martes").
*   Muestra el rango horario real calculado (`23:00 - 07:00`) para precisión.
*   Muestra duración total y calidad.

---

## 3. Base de Datos (`sleep_logs`)

Estructura relevante para esta lógica:

```sql
CREATE TABLE public.sleep_logs (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  date date NOT NULL,                -- Fecha contable (ej: "Noche del Martes")
  sleep_start timestamp,             -- Timestamp real inicio (ej: Miércoles 01:00)
  sleep_end timestamp,               -- Timestamp real fin (ej: Miércoles 09:00)
  duration_min integer,              -- Duración en minutos
  quality_score integer,             -- 1-5 estrellas
  source text DEFAULT 'manual'
);
```
