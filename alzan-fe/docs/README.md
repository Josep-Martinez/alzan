# Documentación de Alzan Health

Bienvenido a la documentación completa de la aplicación Alzan Health. Esta documentación está organizada en dos categorías principales: **Técnica** y **Funcional**.

---

## 📚 Estructura de Documentación

### Documentación Técnica (`technical/`)
Detalles de implementación, arquitectura, hooks, servicios, APIs y estructura de base de datos.

- [**Autenticación**](technical/auth_module.md) - Supabase Auth, AuthContext, RLS, sesiones
- [**Entrenamiento**](technical/training_module.md) - Rutinas gym, actividades resistencia, colores deportes, zonas
- [**Salud**](technical/health_module.md) - Algoritmos composición corporal, cálculos automáticos, gráficos
- [**Nutrición**](technical/nutrition_module.md) - Open Food Facts API, plantillas dieta, macros
- [**Configuración**](technical/settings_module.md) - Perfil, preferencias, apps conectadas, GDPR
- [**Optimización y Assets**](technical/app_optimization.md) - R8 Shrinking, Iconos, Assets Play Store
- [**Home/Dashboard**](technical/home_module.md) - Agregación datos, optimización rendimiento

### Documentación Funcional (`functional/`)
Flujos de usuario, casos de uso, reglas de negocio, validaciones y mensajes.

- [**Autenticación**](functional/auth_flows.md) - Login, registro, recuperación contraseña, onboarding
- [**Entrenamiento**](functional/training_flows.md) - Crear rutinas, ejecutar entrenamientos, planificación
- [**Salud**](functional/health_flows.md) - Registrar peso/medidas, composición corporal, gráficos
- [**Nutrición**](functional/nutrition_flows.md) - Plantillas dieta, registrar comidas, adherencia
- [**Configuración**](functional/settings_flows.md) - Editar perfil, preferencias, exportar datos
- [**Home/Dashboard**](functional/home_flows.md) - Resumen diario, navegación rápida

---

## 🎯 Documentación General

- [**Arquitectura**](architecture.md) - Visión general de la arquitectura de la aplicación
- [**Especificación Funcional**](functional_spec_v1_2025.md) - Especificación funcional completa v1.0
- [**Lógica de Aplicación**](APPLICATION_LOGIC.md) - Lógica de negocio general
- [**Walkthrough**](walkthrough.md) - Guía general de la aplicación

---

## 🔍 Guía Rápida por Rol

### Para Desarrolladores
Empieza con la **documentación técnica**:
1. [Arquitectura](architecture.md) - Entender la estructura general
2. [Autenticación Técnica](technical/auth_module.md) - Sistema de auth y sesiones
3. Módulo específico según feature (Training, Health, etc.)

**Contenido técnico incluye**:
- Estructura de archivos y componentes
- Hooks y servicios
- Esquemas de base de datos
- APIs y integraciones externas
- Tipos TypeScript
- Ejemplos de código

### Para Product Managers / Stakeholders
Empieza con la **documentación funcional**:
1. [Especificación Funcional](functional_spec_v1_2025.md) - Visión general
2. [Flujos de Autenticación](functional/auth_flows.md) - Flujos de usuario
3. Módulo específico según feature

**Contenido funcional incluye**:
- Diagramas de flujo de usuario (mermaid)
- Casos de uso detallados
- Reglas de negocio
- Validaciones y mensajes
- Estados de la interfaz

### Para QA / Testing
Usa **ambas documentaciones**:
1. **Funcional** - Para crear test cases basados en casos de uso
2. **Técnica** - Para entender implementación y edge cases

**Útil para**:
- Crear test cases
- Validar reglas de negocio
- Verificar mensajes de error
- Probar flujos completos

---

## 📊 Características Recientes Documentadas

### Entrenamiento
- ✅ **Colores específicos por deporte** (SPORT_COLORS) - Paleta actualizada
- ✅ **Estados completados** - Botón "TERMINADO" en rojo
- ✅ **Filtros de fecha mejorados** - Corrección con startOfDay
- ✅ **Cálculo automático de calorías** - En ManualLogScreen
- ✅ **Zonas de entrenamiento** - Para running (Z1-Z5)

### Salud
- ✅ **Cálculo automático de IMC y % grasa** - Siempre calculado
- ✅ **Múltiples algoritmos** - Deurenberg, BAI, WHtR, Antropometría completa
- ✅ **Preferencia import_health_metrics** - Toggle en settings
- ✅ **Modal rediseñado** - Bottom sheet con colores temáticos
- ✅ **Selector de fecha inline** - iOS wheel picker
- ✅ **Gráficos interactivos** - Filtros de tiempo (1W, 1M, 3M, 6M, 1Y, ALL)

### Configuración
- ✅ **Nueva preferencia** - import_health_metrics para básculas inteligentes
- ✅ **Reducción APK (R8)** - Plugin de optimización persistente
- ✅ **Nuevos Iconos** - Assets renovados y Play Store icon

---

## 🔄 Mantenimiento de Documentación

### Cuándo Actualizar
La documentación debe actualizarse cuando:
- Se añaden nuevas pantallas o componentes
- Se modifican flujos de usuario
- Se cambian reglas de negocio
- Se actualizan algoritmos o cálculos
- Se añaden nuevas integraciones

### Cómo Actualizar
1. **Cambios técnicos** → Actualizar archivo en `technical/`
2. **Cambios funcionales** → Actualizar archivo en `functional/`
3. **Cambios generales** → Actualizar `architecture.md` o `functional_spec_v1_2025.md`

### Revisión Periódica
- **Mensual**: Verificar que la documentación esté actualizada
- **Por Release**: Documentar nuevas características
- **Por Bug Fix**: Actualizar si afecta lógica de negocio

---

## 📈 Estadísticas

- **Archivos de documentación**: 16 archivos
  - Técnica: 6 módulos
  - Funcional: 6 módulos
  - General: 4 archivos
- **Líneas de documentación**: ~5,200 líneas
- **Diagramas mermaid**: 20+ diagramas de flujo
- **Casos de uso**: 30+ casos documentados
- **Última actualización**: 2025-12-12

---

## 🚀 Próximos Pasos

### Documentación Pendiente
- [ ] Guía de contribución para desarrolladores
- [ ] Guía de estilo de código
- [ ] Documentación de testing
- [ ] Guía de deployment
- [ ] Changelog detallado

### Mejoras Planificadas
- [ ] Diagramas de arquitectura más detallados
- [ ] Ejemplos de código interactivos
- [ ] Videos de demostración de flujos
- [ ] FAQ por módulo
- [ ] Glosario de términos

---

## 📞 Contacto

Para preguntas sobre la documentación o sugerencias de mejora, contacta al equipo de desarrollo.

---

**Última actualización**: 2025-12-12  
**Versión de documentación**: 2.0  
**Commit**: `afb3931`
