# Módulo de Nutrición - Documentación Funcional

## Visión General

Gestión completa de nutrición con:

- 🍽️ **Plantillas de dieta** semanales
- 📝 **Registro diario** de comidas
- 🔍 **Búsqueda de alimentos** con API
- 📊 **Seguimiento de macros** (proteína, carbos, grasas)
- ✅ **Adherencia** a plan nutricional

**Ubicación del Código**:

- Pantallas: `src/screens/nutrition/`
- Componentes y Hooks: `src/modules/nutrition/`
- Algoritmos de Planificación: `src/modules/nutrition/services/dietCopyService.ts`

---

## Flujos Principales

### Flujo 1: Planificación Semanal Automática

```mermaid
graph TD
    A[NutritionHomeScreen] --> B[Ajustes (Icono Engranaje)]
    B --> C[SettingsNavigator -> NutritionSettings]
    C --> D[Sección Planificación Automática]
    D --> E{Seleccionar Modo}
    E -->|Copia Semanal| F[Activar Copia Semanal]
    E -->|Copia Alterna| G[Activar Copia Alterna A/B]
    F --> H[Copia semana actual -> Futuro]
    G --> H
    H --> I[Guardar Preferencias]
```

### Flujo 2: Registrar Comida (Manual / AI / Escáner)

```mermaid
graph TD
    A[NutritionHomeScreen] --> B[+ Añadir en Comida (ej: Desayuno)]
    B --> C[MealLogForm]
    C --> D{Seleccionar Modo}
    D -->|Buscar| E[Buscar ingrediente API]
    D -->|Escanear| F[Escanear código de barras]
    D -->|Manual| G[Ingresar macros manuales]
    D -->|AI| H[Generar desde Nombre Receta]
    E --> I[Añadir a lista]
    F --> I
    G --> I
    H --> I
    I --> J[Guardar Comida]
    J --> K[Actualizar Dashboard]
```

---

## Casos de Uso

### CU-N1: Configurar Planificación Automática

**Flujo**:

1.  Usuario accede a Ajustes desde NutritionHome (redirige a Settings).
2.  Navega a "Planificación Automática".
3.  Selecciona "Copia Secuencial" o "Copia Alterna".
4.  Sistema verifica conflictos (datos futuros existentes).
5.  Si hay conflictos, solicita confirmación de sobreescritura.
6.  Sistema replica la dieta de la semana base a las semanas futuras.

### CU-N2: Registrar Comida Real

**Flujo**:

1. Usuario ve comida planificada
2. Opción A: Marca como completada (usa datos plantilla)
3. Opción B: Registra comida diferente
4. Sistema actualiza progreso de macros del día

---

## Reglas de Negocio

### RN-N1: Solo Una Plantilla Activa

- Solo puede haber una plantilla activa a la vez
- Al activar nueva, se desactiva la anterior

### RN-N2: Adherencia

- Adherencia = (comidas registradas / comidas planificadas) × 100
- Se calcula semanalmente

### RN-N3: Objetivo Calórico

- Calculado automáticamente basado en TDEE
- Usuario puede override manual

---

## Mejoras Futuras

- [ ] Recetas con ingredientes
- [ ] Planificador automático con IA
- [ ] Integración con apps de nutrición
- [ ] Análisis de micronutrientes
