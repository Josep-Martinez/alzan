# Alzan Health - Fitness & Health Tracking App

Una aplicación móvil completa para rastrear entrenamientos, nutrición y métricas de salud, construida con React Native y Expo.

## 🚀 Quick Start

```bash
# Instalar dependencias
pnpm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de Supabase

# Ejecutar la app
npx expo start -c
```

**Credenciales de prueba:**

- Email: `info@alzan.com`
- Password: `FakePassword1`

---

## ✨ Features

| Módulo           | Descripción                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------------- |
| 🏋️ **Training**  | Rutinas de gimnasio, entrenamientos activos, deportes de resistencia, planificación semanal |
| 🍎 **Nutrition** | Seguimiento, macros, plantillas y **Búsqueda AI de Recetas**                                |
| 📊 **Health**    | Peso, medidas corporales, sueño, ritmo cardíaco, gráficos interactivos                      |
| ⚙️ **Settings**  | Perfil, preferencias, objetivos, privacidad GDPR, integraciones                             |
| 📈 **Stats**     | Análisis de progreso, gráficos interactivos para entreno, nutrición y salud                 |

---

## 🛠️ Tech Stack

- **Frontend**: React Native 0.81 + Expo 54
- **Navigation**: React Navigation (Stack + Bottom Tabs)
- **State**: TanStack React Query
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **Styling**: Custom "Liquid Glass" design system
- **Performance**: R8 Code Shrinking & Resource Optimization (Android)
- **i18n**: i18next (ES/EN)

---

## 📁 Project Structure

```
src/
├── components/          # Componentes UI reutilizables (GlassCard, SimpleChart)
├── context/             # Providers (AuthContext)
├── hooks/               # Custom hooks globales
├── i18n/                # Archivos de traducción
├── lib/                 # Configuración de librerías (Supabase)
├── modules/             # Módulos de dominio
│   └── health/          # Módulo de salud
│       ├── algorithms/  # Cálculos (BMI, body fat)
│       ├── components/  # Componentes específicos
│       ├── hooks/       # Hooks de datos
│       ├── screens/     # Pantallas
│       └── services/    # APIs de Supabase
├── navigation/          # Configuración de navegación
├── screens/             # Pantallas organizadas por feature
│   ├── auth/
│   ├── health/
│   ├── nutrition/
│   ├── settings/
│   ├── stats/
│   └── training/
├── theme/               # Colores, tipografía, spacing
├── types/               # Tipos TypeScript
└── utils/               # Utilidades y helpers
```

---

## 📚 Documentation

| Documento                                                   | Descripción                     |
| ----------------------------------------------------------- | ------------------------------- |
| [Especificación Funcional](docs/functional_spec_v1_2025.md) | Casos de uso y requisitos       |
| [Módulo Training](docs/technical/training_module.md)        | Documentación técnica detallada |
| [Módulo Health](docs/technical/health_module.md)            | Screens, hooks, services        |
| [Arquitectura](docs/architecture.md)                        | Visión general del sistema      |

---

## 🔧 Development

### Prerequisites

- Node.js 18+
- pnpm
- Expo CLI
- iOS Simulator / Android Emulator
- Cuenta de Supabase

### Environment Variables

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### Running the App

#### Option 1: Expo Go (Desarrollo Rápido)

**Expo Go** es ideal para desarrollo rápido sin necesidad de compilar código nativo.

```bash
# Iniciar el servidor de desarrollo
npx expo start -c

# Opciones disponibles:
# - Presiona 's' para cambiar a Expo Go
# - Presiona 'i' para abrir en iOS Simulator
# - Presiona 'a' para abrir en Android Emulator
# - Escanea el QR con la app Expo Go en tu dispositivo físico
```

**Instalar Expo Go:**

- iOS: [Expo Go en App Store](https://apps.apple.com/app/expo-go/id982107779)
- Android: [Expo Go en Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

**Limitaciones de Expo Go:**

- No incluye módulos nativos personalizados
- Algunas funcionalidades pueden no estar disponibles (notificaciones nativas, autenticación biométrica, etc.)

#### Option 2: Development Build (Recomendado para Testing Completo)

**Development Build** incluye todos los módulos nativos y es más parecido a la app de producción.

```bash
# Build de desarrollo para iOS
eas build --profile development --platform ios

# Build de desarrollo para Android
eas build --profile development --platform android

# Una vez descargado el build:
# - iOS: Instala el archivo .ipa en tu dispositivo o simulador
# - Android: Instala el archivo .apk en tu dispositivo o emulador

# Luego inicia el servidor:
npx expo start --dev-client
```

#### Option 3: Build Local (Sin EAS)

Si prefieres compilar localmente sin usar EAS Build:

```bash
# iOS (requiere macOS y Xcode)
npx expo run:ios

# Android (requiere Android Studio y SDK)
npx expo run:android
```

**Nota:** Los builds locales compilan el código nativo en tu máquina y lanzan la app en el simulador/emulador.

### Building for Production

#### Preview Build (Testing Interno)

```bash
# Build de preview para iOS
eas build --profile preview --platform ios

# Build de preview para Android
eas build --profile preview --platform android
```

#### Production Build (App Stores)

```bash
# Build de producción para iOS
eas build --profile production --platform ios

# Build de producción para Android (R8 Optimized)
eas build --profile production --platform android

# Submit a las tiendas
eas submit --platform ios
eas submit --platform android
```

### Gestión de Versiones

Las versiones se gestionan automáticamente con `autoIncrement` en `eas.json`:

- **iOS:** `buildNumber` se incrementa automáticamente
- **Android:** `versionCode` se incrementa automáticamente
- **Version:** Se gestiona manualmente en `app.json` (actualmente `1.0.0`)

---

## 📝 License

Private project - All rights reserved.
