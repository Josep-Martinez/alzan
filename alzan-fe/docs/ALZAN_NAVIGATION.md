# Documentación de Implementación: Navegación Modo Alzan

**Fecha:** 23 de Enero, 2026
**Autor:** Antigravity (Assistant)

## 1. Resumen

Se ha implementado un nuevo sistema de navegación dual en la aplicación "Alzan". Este sistema permite alternar entre el **Modo Principal** (Home, Training, Nutrition, Health) y el **Modo Alzan** (Inicio, Clips, Mensajes, Perfil) mediante un botón dedicado en el footer.

El objetivo principal era crear una experiencia diferenciada para la sección "Alzan", manteniendo la estética "Liquid Glass" del footer pero cambiando completamente las opciones de navegación disponibles.

## 2. Arquitectura de Navegación

### 2.1 Archivo Principal: `src/navigation/TabNavigator.tsx`

Este archivo es el núcleo de la implementación. Anteriormente, era un `Tab.Navigator` estático. Ahora, actúa como un orquestador de estado que decide qué contenido mostrar.

#### Contexto de Estado (`AlzanModeContext`)

Se ha creado un contexto de React para gestionar el estado del modo Alzan en toda la jerarquía de componentes del navegador:

```typescript
const AlzanModeContext = React.createContext<{
  isAlzanMode: boolean;           // Indica si estamos en modo Alzan
  setIsAlzanMode: (v: boolean) => void;
  alzanActiveTab: string;         // Tab activo dentro del modo Alzan
  setAlzanActiveTab: (t: string) => void;
}>({...});
```

### 2.2 Configuraciones de Pestañas

Se definen dos configuraciones de pestañas separadas para facilitar el cambio dinámico:

**Modo Principal (`mainTabsConfig`):**

- **Home** (Inicio General)
- **Training** (Entreno)
- **Nutrition** (Nutrición)
- **Health** (Salud)
- **Alzan** (Botón switch con icono `iconA.png`)

**Modo Alzan (`alzanTabsConfig`):**

- **AlzanHome** (Etiquetado como "Inicio", icono `LayoutGrid`)
- **Clips** (Vídeos)
- **Messages** (Mensajes)
- **AlzanProfile** (Perfil de usuario Alzan)
- **BackToMain** (Botón para volver, etiquetado "Alzan", icono `iconA.png`)

## 3. Componentes Clave

### 3.1 `CustomTabBar`

El componente `CustomTabBar` ha sido modificado para ser "agnóstico" del navegador subyacente en cuanto a qué botones renderizar.

- **Lógica Dinámica**: Renderiza los botones basándose en `isAlzanMode ? alzanTabsConfig : mainTabsConfig`.
- **Icono Alzan**: Detecta si el tab es un switch (`isAlzanSwitch`). Si es así, renderiza el icono `iconA.png` con un tamaño fijo de **28px** y sin animaciones de escala al pulsarlo, para mantener la estabilidad visual.
- **Navegación Manual**: Si estamos en modo Alzan, el `onPress` actualiza el estado `alzanActiveTab` en lugar de emitir eventos de navegación de React Navigation.

### 3.2 `AlzanModeContent`

Un componente helper que renderiza la pantalla correspondiente según el `alzanActiveTab` seleccionado cuando `isAlzanMode` es `true`.

- Actúa como un "Switch Case" simple para renderizar `AlzanHomeScreen`, `ClipsScreen`, `MessagesScreen` o `AlzanProfileScreen`.

### 3.3 Integración en `TabNavigator`

El componente exportado `TabNavigator` decide qué estructura renderizar:

```tsx
return (
  <AlzanModeContext.Provider ...>
    <View style={{ flex: 1 }}>
      {isAlzanMode ? (
        <>
          <AlzanModeContent />
          {/* Footer renderizado manualmente para mantener estética */}
          <CustomTabBar ... />
        </>
      ) : (
        <Tab.Navigator tabBar={props => <CustomTabBar {...props} />}>
           {/* Definición estática de pantallas principales */}
        </Tab.Navigator>
      )}
    </View>
  </AlzanModeContext.Provider>
);
```

**Nota Importante sobre `Settings`**:
Aunque `Settings` no aparece visualmente en el footer principal (reemplazado por el botón Alzan), se ha mantenido como un `<Tab.Screen>` dentro del navegador pero con `tabBarButton: () => null`. Esto permite que la navegación imperativa `navigation.navigate('Settings')` desde los headers de otras pantallas siga funcionando correctamente.

## 4. Cambios en Pantallas

### 4.1 Pantallas Nuevas

Se han creado las pantallas placeholder para el modo Alzan en `src/screens/alzan/`:

- `AlzanHomeScreen.tsx`
- `ClipsScreen.tsx`
- `MessagesScreen.tsx`
- `AlzanProfileScreen.tsx`

Estas pantallas utilizan el tema de la aplicación (`colors.textPrimary`) para asegurar consistencia visual (modo claro/oscuro).

### 4.2 Ajustes (`SettingsHomeScreen.tsx`)

Se realizaron modificaciones para mejorar la usabilidad al navegar desde otras secciones:

- **Botón Atrás**: Se añadió un botón `<ChevronLeft />` en la esquina superior izquierda del header.
- **Funcionalidad**: Al pulsarlo, ejecuta `navigation.goBack()`, permitiendo al usuario volver a la pantalla desde la que invocó los ajustes (Inicio, Entreno, etc.).

## 5. Activos

- **Icono**: Se utiliza `assets/iconA.png` como icono distintivo para el botón de Alzan y para el botón de retorno, tintado dinámicamente según el tema seleccionado.

## 6. Flujo de Usuario

1.  Usuario abre la app -> Ve el footer principal.
2.  Usuario toca icono "Alzan" (derecha) -> Footer cambia, pantalla cambia a "Inicio" de Alzan.
3.  Usuario navega por Clips, Mensajes, Perfil.
4.  Usuario toca icono "Alzan" de nuevo -> Vuelve al footer principal y a la pantalla de Inicio General.
5.  Desde Inicio/Entreno/Nutrición, usuario toca el engranaje -> Navega a Ajustes (ahora accesible).
6.  En Ajustes, usuario toca "<" -> Vuelve a la pantalla anterior.
