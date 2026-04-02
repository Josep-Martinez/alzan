# Módulo Home/Dashboard - Documentación Funcional

## Visión General

Dashboard central que agrega información de todos los módulos:

- 🏠 **Vista unificada** del día
- 🎯 **Acciones rápidas** a cada módulo
- 📊 **Resumen** de progreso
- 🔔 **Recordatorios** inteligentes

**Ubicación del Código**:

- Pantalla Principal: `src/screens/home/HomeScreen.tsx`
- Hooks de Datos: `src/hooks/useDashboardData.ts`
- Lógica de Nutrición Diaria: `src/modules/nutrition/hooks/useDayNutritionLogic.ts`

---

## Interfaz de Usuario (UI)

La pantalla principal se divide en tres secciones clave:

### 1. Cabecera

- Muestra "Inicio" y la fecha actual en español.
- Fondo con gradiente dinámico que cambia según el tema (Claro/Oscuro).

### 2. Resumen de Hoy (Grid 2x2)

Cuatro tarjetas clave para un vistazo rápido:

- **⚖️ Peso**: Último registro y botón rápido (+).
- **👣 Pasos**: Contador de pasos del día.
- **🔥 Calorías**: Progreso diario vs Objetivo.
- **✅ Entrenos**: Conteo de sesiones completadas.

### 3. Agenda Inteligente

Muestra lo que el usuario debe hacer _ahora_:

- **Próxima Comida**: Indica qué toca comer (Desayuno, Comida, Cena, etc.) basado en el horario.
  - _Estado_: Muestra si ya se registró o cuántas kcal quedan.
- **Entrenamiento**:
  - Si hay uno programado: Muestra el nombre y un botón de "Play" directo.
  - Si no: Muestra un resumen o estado vacío.

---

## Reglas de Negocio

### RN-D1: Siguiente Comida Dinámica

El sistema calcula automáticamente cuál es la siguiente comida basándose en:

1. Hora actual del dispositivo.
2. Horarios de comida configurados por el usuario en Ajustes.
   Se actualiza en tiempo real (cada minuto).

### RN-D2: Refresco de Datos

- **Al enfocar**: Los datos se recargan automáticamente cada vez que el usuario vuelve a la pantalla de inicio.
- **Navegación**: Tocar una tarjeta lleva directamente a la pantalla principal del módulo correspondiente.

### RN-D3: Entrenamiento Pendiente

- Se prioriza mostrar el entrenamiento programado para "Hoy".
- Diferencia visual entre entrenamientos de Gimnasio (Dumbbell) y Resistencia (correr, bici, etc.).

## Mejoras Futuras

- [ ] Widgets personalizables
- [ ] Insights diarios con IA
- [ ] Streaks y logros
- [ ] Resumen semanal automático
