# Optimización y Assets de la Aplicación

Este documento detalla la configuración de rendimiento y gestión de assets gráficos implementada en la aplicación Android.

**Location**: `plugins/withOptimizedR8.js` and `app.json`

## 1. Optimización R8 (Android)

Para garantizar el menor tamaño de aplicación y el mejor rendimiento posible, hemos habilitado **R8 Code Shrinking** y **Resource Optimization** de forma persistente.

### Implementación

La configuración no se realiza manualmente en `android/` (ya que es efímero en Expo), sino a través de plugins de configuración en `app.json`.

#### Plugins Utilizados

1. **`expo-build-properties`**: Habilita las flags nativas estándar.

   ```json
   {
     "android": {
       "enableShrinkResourcesInReleaseBuilds": true,
       "enableMinifyInReleaseBuilds": true
     }
   }
   ```

2. **`plugins/withOptimizedR8.js`** (Custom Plugin):
   - Inyecta `android.r8.optimizedResourceShrinking=true` en `gradle.properties`.
   - Reemplaza el archivo de reglas ProGuard por defecto (`proguard-android.txt`) con la versión optimizada (`proguard-android-optimize.txt`) en `build.gradle`.

### Verificación

Al ejecutar `npx expo prebuild`, se generan los siguientes cambios en la carpeta `android/`:

- **`gradle.properties`**: Incluye las flags de R8.
- **`app/build.gradle`**: Referencia a `proguard-android-optimize.txt`.

---

## 2. Gestión de Iconos y Assets

Los iconos de la aplicación se gestionan de forma centralizada pero se generan nativamente para cada plataforma.

### Estructura de Archivos

- **`assets/icon.png`**: Icono principal (iOS y fallback).
- **`assets/adaptive-icon.png`**: Icono adaptativo para Android (solo primer plano). El fondo es blanco (`#ffffff`).
- **`assets/playstore-icon.png`**: Asset de 512x512px requerido para la ficha de Google Play Store.
- **`assets/iconA-icons/`**: Carpeta de origen que contiene todos los recursos generados (iOS, Android Mipmaps, Web, etc.).

### Configuración en `app.json`

```json
"android": {
  "adaptiveIcon": {
    "foregroundImage": "./assets/adaptive-icon.png",
    "backgroundColor": "#ffffff"
  }
}
```

### Notas para Producción

- El archivo `assets/playstore-icon.png` debe subirse manualmente a Google Play Console.
- Si se regenera el proyecto (`prebuild`), los iconos nativos se recrearán automáticamente desde los archivos en `assets/`.
