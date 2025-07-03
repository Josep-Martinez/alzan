# CodeViz Research Context

> **Note**: This file contains research context from CodeViz. Most recent contexts are at the bottom.

---

## Research Query

enseñame toda la arquitectura de la app

*Session: bd79ab3221e61889eca6a0b74b77f401 | Generated: 3/7/2025, 13:27:28*

### Analysis Summary

# Arquitectura General de la Aplicación Alzan

La aplicación Alzan está estructurada en varias secciones principales, cada una con responsabilidades específicas, y utiliza un enfoque modular para la organización del código.

## Estructura de Directorios

La aplicación sigue una estructura de directorios clara, separando la lógica de la interfaz de usuario, los activos, los componentes reutilizables y los servicios.

*   **`app/`**: Contiene las pantallas principales de la aplicación y la navegación.
    *   `(tabs)/` : Define las pestañas de navegación principales de la aplicación.
        *   [index.tsx](file:app/(tabs)/index.tsx): Pantalla de inicio o dashboard principal.
        *   [nutrition.tsx](file:app/(tabs)/nutrition.tsx): Pantalla dedicada a la gestión de la nutrición.
        *   [stats.tsx](file:app/(tabs)/stats.tsx): Pantalla para visualizar estadísticas y progreso.
        *   [work.tsx](file:app/(tabs)/work.tsx): Pantalla para el seguimiento de entrenamientos y actividades físicas.
    *   [_layout.tsx](file:app/_layout.tsx): Define el layout global de la aplicación, incluyendo la navegación principal.
    *   [+not-found.tsx](file:app/+not-found.tsx): Componente para manejar rutas no encontradas.

*   **`assets/`**: Almacena recursos estáticos como imágenes, fuentes y datos.
    *   `data/`: Contiene archivos de datos, como [ejercicios_esp.csv](file:assets/data/ejercicios_esp.csv) y [ejercicios_esp.json](file:assets/data/ejercicios_esp.json), que probablemente se utilizan para cargar información sobre ejercicios.
    *   `fonts/`: Almacena las fuentes utilizadas en la aplicación.
    *   `images/`: Contiene todas las imágenes y iconos de la aplicación.

*   **`components/`**: Agrupa componentes reutilizables, organizados por funcionalidad.
    *   `nutri/`: Componentes relacionados con la funcionalidad de nutrición.
        *   [AddExtraMealModal.tsx](file:components/nutri/AddExtraMealModal.tsx): Modal para añadir comidas extra.
        *   [AddFoodModal.tsx](file:components/nutri/AddFoodModal.tsx): Modal para añadir alimentos.
        *   [AddFoodModalAI.tsx](file:components/nutri/AddFoodModalAI.tsx): Modal para añadir alimentos con asistencia de IA.
        *   [FoodScanner.tsx](file:components/nutri/FoodScanner.tsx): Componente para escanear alimentos.
        *   [MealCard.tsx](file:components/nutri/MealCard.tsx): Tarjeta para mostrar información de una comida.
    *   `services/`: Contiene servicios que encapsulan lógica de negocio o interacciones con APIs externas.
        *   [FoodAnalysisService.ts](file:components/services/FoodAnalysisService.ts): Servicio para analizar información de alimentos.
        *   [GeminiFoodAnalyzer.ts](file:components/services/GeminiFoodAnalyzer.ts): Servicio específico para el análisis de alimentos utilizando Gemini.
    *   `sport/`: Componentes relacionados con la funcionalidad deportiva y de entrenamiento.
        *   [ExerciseSelector.tsx](file:components/sport/ExerciseSelector.tsx): Selector de ejercicios.
        *   [GymSession.tsx](file:components/sport/GymSession.tsx): Componente para gestionar sesiones de gimnasio.
        *   [OtherSportsSessions.tsx](file:components/sport/OtherSportsSessions.tsx): Componente para gestionar otras sesiones deportivas.
        *   [RestTimerBar.tsx](file:components/sport/RestTimerBar.tsx): Barra de temporizador de descanso.
        *   [sports.ts](file:components/sport/sports.ts): Definiciones o utilidades relacionadas con deportes.
        *   [SportSelector.tsx](file:components/sport/SportSelector.tsx): Selector de deportes.
    *   `stats/`: Componentes para la visualización de estadísticas.
        *   [AddMeasurementModal.tsx](file:components/stats/AddMeasurementModal.tsx): Modal para añadir mediciones.
        *   [ChartSection.tsx](file:components/stats/ChartSection.tsx): Sección para mostrar gráficos.
        *   [ConsistencySection.tsx](file:components/stats/ConsistencySection.tsx): Sección para mostrar la consistencia.
        *   [MetricCard.tsx](file:components/stats/MetricCard.tsx): Tarjeta para mostrar métricas.
        *   [RecordsSection.tsx](file:components/stats/RecordsSection.tsx): Sección para mostrar récords.
    *   `ui/`: Componentes de interfaz de usuario genéricos y reutilizables.
        *   [IconSymbol.ios.tsx](file:components/ui/IconSymbol.ios.tsx) y [IconSymbol.tsx](file:components/ui/IconSymbol.tsx): Componentes para mostrar iconos, con una versión específica para iOS.
        *   [TabBarBackground.ios.tsx](file:components/ui/TabBarBackground.ios.tsx) y [TabBarBackground.tsx](file:components/ui/TabBarBackground.tsx): Componentes para el fondo de la barra de pestañas, con una versión específica para iOS.

*   **`constants/`**: Contiene constantes globales de la aplicación, como [Colors.ts](file:constants/Colors.ts).

*   **`hooks/`**: Almacena hooks personalizados de React para encapsular lógica reutilizable.
    *   [useColorScheme.ts](file:hooks/useColorScheme.ts) y [useColorScheme.web.ts](file:hooks/useColorScheme.web.ts): Hooks para manejar el esquema de color de la aplicación, con una versión específica para web.
    *   [useThemeColor.ts](file:hooks/useThemeColor.ts): Hook para obtener colores del tema.

*   **`scripts/`**: Contiene scripts de utilidad, como [reset-project.js](file:scripts/reset-project.js).

## Flujo de Datos y Componentes Clave

La aplicación parece seguir un patrón de diseño basado en componentes, donde las pantallas (`app/`) orquestan la interacción entre los componentes más pequeños (`components/`).

1.  **Navegación**: La navegación principal se gestiona a través de las pestañas definidas en `app/(tabs)/_layout.tsx`, permitiendo al usuario moverse entre las secciones de nutrición, estadísticas y entrenamiento.
2.  **Gestión de Nutrición**:
    *   La pantalla [nutrition.tsx](file:app/(tabs)/nutrition.tsx) es el punto de entrada para la funcionalidad de nutrición.
    *   Utiliza componentes como [AddFoodModal.tsx](file:components/nutri/AddFoodModal.tsx) y [AddFoodModalAI.tsx](file:components/nutri/AddFoodModalAI.tsx) para permitir al usuario registrar alimentos.
    *   Los servicios [FoodAnalysisService.ts](file:components/services/FoodAnalysisService.ts) y [GeminiFoodAnalyzer.ts](file:components/services/GeminiFoodAnalyzer.ts) son responsables de procesar y analizar la información de los alimentos, posiblemente interactuando con APIs externas o modelos de IA.
    *   [FoodScanner.tsx](file:components/nutri/FoodScanner.tsx) sugiere la capacidad de escanear alimentos para su registro.
3.  **Seguimiento de Entrenamiento**:
    *   La pantalla [work.tsx](file:app/(tabs)/work.tsx) maneja la lógica relacionada con el seguimiento de actividades físicas.
    *   Componentes como [ExerciseSelector.tsx](file:components/sport/ExerciseSelector.tsx), [GymSession.tsx](file:components/sport/GymSession.tsx) y [OtherSportsSessions.tsx](file:components/sport/OtherSportsSessions.tsx) facilitan la selección y el registro de ejercicios y sesiones de entrenamiento.
    *   [sports.ts](file:components/sport/sports.ts) probablemente define la estructura de datos para los diferentes deportes y ejercicios.
4.  **Visualización de Estadísticas**:
    *   La pantalla [stats.tsx](file:app/(tabs)/stats.tsx) es el centro para mostrar el progreso del usuario.
    *   Utiliza componentes como [ChartSection.tsx](file:components/stats/ChartSection.tsx) para visualizar datos, [ConsistencySection.tsx](file:components/stats/ConsistencySection.tsx) para mostrar la consistencia y [RecordsSection.tsx](file:components/stats/RecordsSection.tsx) para los récords personales.
    *   [AddMeasurementModal.tsx](file:components/stats/AddMeasurementModal.tsx) permite al usuario añadir nuevas mediciones para el seguimiento.

## Interacciones Clave

*   **Pantallas y Componentes**: Las pantallas en `app/` actúan como contenedores que ensamblan y gestionan el estado de los componentes más pequeños de `components/`.
*   **Componentes y Servicios**: Los componentes de UI interactúan con los servicios en `components/services/` para realizar operaciones de negocio complejas, como el análisis de alimentos.
*   **Datos Estáticos**: Los datos de ejercicios en `assets/data/` son consumidos por los componentes relacionados con el deporte para poblar selectores o proporcionar información.
*   **Hooks Personalizados**: Los hooks en `hooks/` proporcionan lógica reutilizable y abstraen la complejidad de la gestión del estado o la interacción con el sistema (ej. `useColorScheme`).

En resumen, la aplicación Alzan está bien organizada en módulos funcionales, lo que facilita el desarrollo y mantenimiento. La separación de la UI, la lógica de negocio y los servicios es clara, lo que permite una mayor escalabilidad y reutilización de código.

### Implementation Steps

1. **Understanding the Overall Application Architecture**
   The Alzan application is designed with a modular approach, separating UI, business logic, and services. It is structured into several main sections, each with specific responsibilities, facilitating development and maintenance.

2. **Exploring the Directory Structure**
   The application's directory structure organizes code into distinct areas. The `app/` directory contains main application screens and navigation, including primary navigation tabs and a global layout. The `assets/` directory stores static resources like images, fonts, and data, such as exercise information. The `components/` directory groups reusable components by functionality, while `constants/` holds global application constants. Custom React hooks are stored in `hooks/` for reusable logic, and `scripts/` contains utility scripts.

3. **Diving into the Application Screens (`app/`)**
   The `app/` directory is responsible for the main application screens and overall navigation. It defines the primary navigation tabs, such as `index`, `nutrition`, `stats`, and `work`, which allow users to move between different sections. It also includes a global layout file that defines the main application structure and a component for handling unfound routes.

4. **Understanding Static Resources (`assets/`)**
   The `assets/` directory is dedicated to static resources. It includes a `data/` subdirectory for data files, such as exercise information in JSON and CSV formats. The `fonts/` subdirectory stores all fonts used in the application, and the `images/` subdirectory contains all application images and icons.

5. **Examining Reusable Components (`components/`)**
   The `components/` directory centralizes reusable UI components, organized by their functional area. This includes specific components for nutrition (`nutri/`), services (`services/`), sports and training (`sport/`), and statistics visualization (`stats/`). Additionally, it contains generic and reusable UI components in `ui/`.

6. **Focusing on Nutrition Components (`nutri/`)**
   The `nutri/` subdirectory within `components/` contains all components related to nutrition functionality. These include modals for adding extra meals and food items, a modal for AI-assisted food entry, a food scanner component, and a component for displaying meal information.

7. **Understanding Service Components (`services/`)**
   The `services/` subdirectory within `components/` encapsulates business logic and interactions with external APIs. It includes a service for general food analysis and a specific service for food analysis using the Gemini AI model.

8. **Exploring Sport and Training Components (`sport/`)**
   The `sport/` subdirectory within `components/` houses components for sports and training functionality. This includes an exercise selector, components for managing gym sessions and other sports sessions, a rest timer bar, and utilities or definitions related to sports.

9. **Analyzing Statistics Components (`stats/`)**
   The `stats/` subdirectory within `components/` contains components for visualizing user statistics and progress. These include a modal for adding measurements, sections for displaying charts, consistency, and personal records, and a component for showing metrics.

10. **Reviewing Generic UI Components (`ui/`)**
   The `ui/` subdirectory within `components/` provides generic and reusable user interface components. Examples include components for displaying icons and components for the tab bar background, with specific versions for iOS.

11. **Understanding Global Constants (`constants/`)**
   The `constants/` directory is used to store global application constants, such as color definitions.

12. **Exploring Custom Hooks (`hooks/`)**
   The `hooks/` directory contains custom React hooks designed to encapsulate reusable logic. These include hooks for managing the application's color scheme (with a web-specific version) and for retrieving theme colors.

13. **Examining Utility Scripts (`scripts/`)**
   The `scripts/` directory holds utility scripts for the application, such as a project reset script.

14. **Understanding Data Flow and Key Components**
   The application follows a component-based design pattern where screens orchestrate interactions between smaller components. Navigation is managed through tabs, allowing users to move between nutrition, statistics, and training sections. Nutrition management involves screens and modals for food entry, supported by services for food analysis. Training tracking uses components for selecting and logging exercises and sessions. Statistics visualization relies on components for displaying charts, consistency, and records, and for adding new measurements.

15. **Analyzing Key Interactions**
   Key interactions within the application include screens acting as containers for components, UI components interacting with services for complex business operations, static data being consumed by sport-related components, and custom hooks providing reusable logic and abstracting system interactions.

