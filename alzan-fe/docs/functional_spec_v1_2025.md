ALZAN – ESPECIFICACIÓN FUNCIONAL COMPLETA & USE CASES (2025)
============================================================

Versión: 1.0
Fecha: 2025-12-09
Autor: Josep
Proyecto: ALZAN — App de entrenamiento, nutrición y salud

------------------------------------------------------------
ÍNDICE
------------------------------------------------------------
1. Introducción y visión general
2. Arquitectura funcional de la aplicación
3. Reglas globales del sistema
4. Módulo de Autenticación
5. Módulo de Onboarding
6. Módulo de Home / Dashboard
7. Módulo de Entrenamiento
    7.1. Gym / Fuerza
    7.2. Endurance (Running, Cycling, Swimming)
    7.3. Weekly Plan
    7.4. Integraciones externas
8. Módulo de Nutrición
9. Módulo de Salud y Cuerpo
10. Módulo de Estadísticas
11. Módulo de Configuración / Ajustes
12. IA Futura — Preparación técnica
13. Casos de uso globales de error
14. Requisitos no funcionales
15. Anexos (base de datos, integraciones, legal)

============================================================
1. INTRODUCCIÓN Y VISIÓN GENERAL
============================================================

ALZAN es una aplicación móvil que actúa como el centro de control personal 
para usuarios que desean gestionar:

• Entrenamientos (fuerza y deportes de resistencia)
• Nutrición (dietas planificadas, comidas reales, adherencia)
• Salud (peso, medidas corporales, ritmo cardíaco, descanso)
• Estadísticas integradas
• Integraciones con servicios deportivos externos (Suunto, futuro: Garmin/Strava)
• Futuro módulo de inteligencia artificial (coach deportivo y nutricional)

Objetivo clave: unificar en un solo lugar la información dispersa en Strava, 
Suunto, notas personales, apps de dieta y apps de gimnasio.

------------------------------------------------------------
Metas del producto:
------------------------------------------------------------
• Simplificar el control diario de salud y deporte
• Crear un historial completo y rigurosamente estructurado
• Preparar una base sólida para IA avanzada
• Mantener un diseño minimalista, calmado y eficiente

============================================================
2. ARQUITECTURA FUNCIONAL DE LA APLICACIÓN
============================================================

La app se divide en 5 módulos principales visibles desde la barra inferior:

1. Home / Dashboard
2. Training
3. Nutrition
4. Body & Health
5. Settings

Todos los datos están almacenados en Supabase con RLS.

============================================================
3. REGLAS GLOBALES DEL SISTEMA
============================================================

• El usuario NO puede utilizar nada sin iniciar sesión.
• Toda operación debe respetar RLS.
• Datos sensibles (salud) requieren consentimiento explícito.
• La UI debe seguir estética minimalista tipo Apple Fitness.
• Los datos se guardan en tiempo real; si no hay internet, local + reintento.
• Todos los flujos deben manejar estados vacíos claros.
• Toda acción crítica requiere confirmación.

============================================================
4. MÓDULO DE AUTENTICACIÓN
============================================================

Casos de uso incluidos:
• CU-A1 — Iniciar sesión con email/contraseña
• CU-A2 — Registrarse
• CU-A3 — Iniciar sesión con Google
• CU-A4 — Iniciar sesión con Apple
• CU-A5 — Recuperar contraseña
• CU-A6 — Mantener sesión activa
• CU-A7 — Manejar expiración de token
• CU-A8 — Cerrar sesión

------------------------------------------------------------
Detalles funcionales:
------------------------------------------------------------
CU-A1 — Login email/password
- Usuario introduce credenciales
- Supabase valida
- Si correcto → Home
- Si incorrecto → Mensaje apropiado

CU-A3 — Login con Google
- Redirección OAuth
- Primer login → se crea perfil
- Se redirige a Onboarding Goals

CU-A7 — Token expirado
- Mostrar mensaje: “La sesión expiró”
- Redirigir a login

============================================================
5. MÓDULO DE ONBOARDING
============================================================

Casos de uso:
• CU-O1 — Seleccionar objetivo principal
• CU-O2 — “Lo rellenaré más tarde”
• CU-O3 — Introducir datos iniciales (altura, sexo)
• CU-O4 — Aceptar consentimiento de datos de salud

------------------------------------------------------------
CU-O1 — Selección de objetivo
------------------------------------------------------------
Opciones:
• Perder grasa
• Ganar músculo
• Mejorar rendimiento
• Mejorar salud general
• Rellenar más tarde

Cada selección crea un registro en user_goals.

============================================================
6. HOME / DASHBOARD
============================================================

Casos de uso:
• CU-H1 — Visualizar resumen diario
• CU-H2 — Ver comidas del día
• CU-H3 — Ver entrenamientos del día
• CU-H4 — Ver progreso semanal
• CU-H5 — Mostrar insights automáticos

------------------------------------------------------------
Contenido del dashboard:
------------------------------------------------------------
• Rutinas asignadas hoy
• Comidas planificadas para el día
• Tarjetas de salud (peso, sueño, FC reposo)
• Barras de progreso semanal
• Alertas suaves:
  - “Has dormido menos de tu media esta semana”
  - “Quedan 2 entrenamientos para tu objetivo semanal”

============================================================
7. MÓDULO DE ENTRENAMIENTO
============================================================

============================================================
7.1 GYM / FUERZA
============================================================

Casos de uso:
• CU-G1 — Crear plantilla de rutina
• CU-G2 — Editar rutina existente
• CU-G3 — Añadir ejercicio global
• CU-G4 — Crear ejercicio personalizado
• CU-G5 — Reordenar ejercicios
• CU-G6 — Iniciar entrenamiento
• CU-G7 — Completar set
• CU-G8 — Rest timer
• CU-G9 — Finalizar entrenamiento
• CU-G10 — Visualizar PRs
• CU-G11 — Ver historial del ejercicio

------------------------------------------------------------
CU-G1 — Crear plantilla
------------------------------------------------------------
Flujo:
1. Usuario introduce nombre
2. Añade ejercicios
3. Configura objetivos de reps, sets, peso
4. Guarda

Datos creados:
- workout_templates
- workout_template_exercises

------------------------------------------------------------
CU-G6 — Iniciar entrenamiento
------------------------------------------------------------
1. Crear activity_session
2. Pre-cargar sets de la plantilla
3. UI muestra ejercicio actual
4. Usuario ejecuta set → CU-G7

------------------------------------------------------------
CU-G7 — Completar set
------------------------------------------------------------
Datos requeridos:
- weight_kg
- reps
- duration_s (si aplica)
- rpe
- rest_s

------------------------------------------------------------
CU-G10 — Ver PRs
------------------------------------------------------------
1RM estimado con fórmula Epley

============================================================
7.2 ENDURANCE (Running/Cycling/Swimming)
============================================================

Casos:
• CU-E1 — Registrar actividad manual
• CU-E2 — Ver historial
• CU-E3 — Conectar con Suunto
• CU-E4 — Procesar actividad importada
• CU-E5 — Enlazar actividad externa con plantilla

------------------------------------------------------------
CU-E1 — Registrar actividad manual
Campos:
• tipo deporte
• duración
• distancia
• FC media/máxima
• notas
Se guarda en activity_sessions.

============================================================
7.3 WEEKLY PLAN
============================================================

Casos:
• CU-W1 — Ver planificación semanal
• CU-W2 — Asignar rutina a un día
• CU-W3 — Modificar planificación futura
• CU-W4 — Eliminar asignación

============================================================
7.4 INTEGRACIONES EXTERNAS
============================================================

Casos:
• CU-I1 — Conectar Suunto
• CU-I2 — Recibir actividad externa
• CU-I3 — Resolver conflicto de emparejamiento

============================================================
8. MÓDULO DE NUTRICIÓN
============================================================

Casos:
• CU-N1 — Crear plantilla de dieta
• CU-N2 — Añadir comida a un día
• CU-N3 — Registrar comida real
• CU-N4 — Calcular macros con API gratuita
• CU-N5 — Ver adherencia semanal
• CU-N6 — Exportar dieta
• CU-N7 — Importar dieta

------------------------------------------------------------
CU-N4 — Calcular macros con API gratuita
------------------------------------------------------------
Flujo:
1. Usuario escribe nombre plato
2. Sistema usa OpenFoodAPI/Spoonacular Free
3. Usuario revisa ingredientes
4. Se almacenan macros estimados

============================================================
9. MÓDULO DE SALUD Y CUERPO
============================================================

Casos:
• CU-S1 — Registrar peso
• CU-S2 — Registrar medidas corporales
• CU-S3 — Registrar sueño
• CU-S4 — Registrar ritmo cardíaco en reposo
• CU-S5 — Ver tendencias
• CU-S6 — Estimar grasa corporal
• CU-S7 — Ver gráficos semanales/mensuales

============================================================
10. MÓDULO DE ESTADÍSTICAS
============================================================

Casos:
• CU-ST1 — Ver estadísticas de entrenamiento
• CU-ST2 — Ver estadísticas de nutrición
• CU-ST3 — Ver estadísticas de salud
• CU-ST4 — Comparación semana/semana
• CU-ST5 — Gráficos avanzados
• CU-ST6 — Alertas inteligentes

============================================================
11. MÓDULO DE CONFIGURACIÓN / AJUSTES
============================================================

Casos:
• CU-C1 — Editar perfil
• CU-C2 — Editar preferencias
• CU-C3 — Editar objetivos
• CU-C4 — Gestionar integraciones
• CU-C5 — Gestión de datos y privacidad
• CU-C6 — Exportar datos personales
• CU-C7 — Eliminar cuenta (GDPR)
• CU-C8 — Ver documentos legales

------------------------------------------------------------
GDPR Obligatorio:
------------------------------------------------------------
• Exportación completa (portabilidad)
• Eliminación completa (derecho al olvido)
• Consentimiento explícito para datos de salud
• Política de privacidad
• Términos y condiciones

============================================================
12. IA FUTURA — PREPARACIÓN
============================================================

Casos previstos:
• CU-IA1 — Generar rutinas inteligentes
• CU-IA2 — Analizar adherencia y ofrecer mejoras
• CU-IA3 — Crear planes para 10K, media maratón, subida potencia ciclismo
• CU-IA4 — Recomendaciones nutricionales basadas en progreso

Módulos de datos necesarios:
• Training summaries
• Diet summaries
• Body metrics timeline
• Sleep trends

============================================================
13. CASOS DE ERROR GLOBALES
============================================================

• CE-1 — Sin conexión
• CE-2 — RLS denegado
• CE-3 — API externa caída
• CE-4 — Token expirado
• CE-5 — Datos corruptos
• CE-6 — No se encuentra plantilla asociada

============================================================
14. REQUISITOS NO FUNCIONALES
============================================================

• Seguridad: Supabase RLS + TLS
• UX minimalista
• Rendimiento fluido 60fps donde posible
• Multilenguaje (ES/EN)
• Offline-first (sets y comidas)
• Código estructurado para escalabilidad

============================================================
15. ANEXOS
============================================================

• Esquema completo de Supabase
• Modelos de datos (TypeScript)
• Documentos legales
• APIs externas aprobadas
• Flujo de integraciones deportivas

------------------------------------------------------------
FIN DEL DOCUMENTO
------------------------------------------------------------
