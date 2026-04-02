# Documentación de Seguridad y Base de Datos - ALZAN Health

**Fecha de Actualización:** 20 Diciembre 2025
**Estado:** Producción / Zero Trust

---

## 1. Filosofía de Seguridad: Modelo "Zero Trust"

La arquitectura de seguridad de ALZAN Health ha sido diseñada bajo el principio de **"Zero Trust"** (Confianza Cero). Esto significa que la seguridad no depende del frontend (React Native), sino que está forzada estrictamente a nivel de base de datos (PostgreSQL/Supabase).

### Principios Fundamentales

1.  **Sin `service_role` en Cliente:** La aplicación móvil nunca posee credenciales de superusuario. Todas las operaciones se realizan bajo el contexto del usuario autenticado (`auth.uid()`).
2.  **Row Level Security (RLS) Mandatorio:** Todas las tablas sensibles tienen RLS habilitado. Una consulta `SELECT * FROM table` solo devolverá las filas que pertenecen al usuario, aunque existan millones de registros de otros usuarios.
3.  **Validación en Servidor:** Lógica crítica (como disponibilidad de username) se ejecuta mediante funciones seguras (RPC) en el servidor, no en el cliente.

---

---

## 2. Autenticación, Verificación y Onboarding

### Configuración

- **Proveedores:** Email/Password (OTP), Google OAuth, Apple OAuth.
- **Gestión de Sesión:** Tokens JWT gestionados por `@supabase/supabase-js`.
- **Verificación OTP:** Sustitución de links por códigos de 6 dígitos enviados por email.

### Flujo de Registro y Verificación

1.  **Registro (`SignUpPassword`):** El usuario crea su cuenta y contraseña. Supabase envía automáticamente un código OTP.
2.  **Pantalla de Verificación:** La app bloquea el acceso hasta que se verifique el código mediante `supabase.auth.verifyOtp`.
3.  **Redirección de Seguridad:** Si un usuario intenta iniciar sesión con un email no verificado, la app detecta el error `email_not_confirmed` y lo redirige automáticamente a la pantalla de verificación.

### Robustez en Onboarding

Para evitar la pérdida de datos por "stale state" (estado asíncrono de React):

- Cada pantalla de onboarding captura su estado local y lo inyecta como un **override directo** en la función de guardado. Esto garantiza que el 100% de la información (ej. username, metas) llegue a la base de datos sin depender de ciclos de renderizado.

---

## 3. Arquitectura de Base de Datos: Denormalización para Seguridad

> **Referencia de Esquema**: Puedes consultar la definición completa del esquema SQL en [schema.md](../../.agents/skills/database-schema/references/schema.md) o usar la skill `database-schema`.

## ...

## 4. Auditoría de Seguridad por Módulo

## ...

## 5. Privacidad Avanzada: Eliminación de Cuenta

Cumpliendo con las normativas GDPR, ALZAN Health implementa un proceso de eliminación definitiva:

### Estrategia Híbrida (Admin API + Cascade)

- **Problema:** Un usuario autenticado no tiene permisos SQL para borrar su propia entrada en `auth.users` (gestionada internamente por Supabase).
- **Solución:** Uso de un cliente administrativo temporal (Service Role) en el servidor/Edge Function para ejecutar `admin.deleteUser(userId)`.
- **Eliminación Atómica:** Para garantizar que no queden datos huérfanos, hemos configurado todas las tablas con `ON DELETE CASCADE`. Borrar el usuario en el motor de autenticación desencadena la limpieza instantánea de sus logs, metas y preferencias en todas las tablas del esquema `public`.

---

## 6. Scripts de Mantenimiento y Seguridad

1.  `fix_seed_exercises.sql`: (Depuración) Inserta ejercicios base vinculados a los IDs reales de músculos.
2.  `rpc_delete_account.sql`: Función para limpieza atómica desde base de datos.
3.  `alter_tables_cascade.sql`: Configura la integridad referencial para el borrado en cascada.

---

## 7. Conclusión

ALZAN Health garantiza la soberanía de los datos del usuario mediante una combinación de RLS estricto, verificación OTP obligatoria y procesos de borrado total. La seguridad no es una opción, es la base de la aplicación.
