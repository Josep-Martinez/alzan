# Contributing to Alzan Health

## 🚀 Setup

```bash
# 1. Clonar repositorio
git clone <repo-url> && cd alzan

# 2. Instalar dependencias
pnpm install

# 3. Configurar entorno
cp .env.example .env
# Editar .env con credenciales de Supabase

# 4. Ejecutar
npx expo start -c
```

---

## 📁 Estructura de Código

```
src/
├── components/     # Componentes UI reutilizables
├── modules/        # Módulos de dominio (self-contained)
│   └── <module>/
│       ├── components/
│       ├── hooks/
│       ├── screens/
│       └── services/
├── screens/        # Pantallas (pueden migrar a modules/)
└── navigation/     # Stacks y tabs
```

---

## 🎨 Convenciones

### Naming
| Tipo | Formato | Ejemplo |
|------|---------|---------|
| Screen | PascalCase + Screen | `WeightAddScreen.tsx` |
| Component | PascalCase | `GlassCard.tsx` |
| Hook | useCamelCase | `useWeightLogs.ts` |
| Service | camelCaseApi | `weightApi.ts` |

### Imports
```typescript
// 1. React/RN
import React, { useState } from 'react';
import { View, Text } from 'react-native';

// 2. Third-party
import { useQuery } from '@tanstack/react-query';

// 3. Internal (absolute paths)
import { colors } from '../../../theme';
import { useAuth } from '../../../context/AuthContext';

// 4. Local
import { MyComponent } from './MyComponent';
```

---

## 🔄 Patrón de Datos

```typescript
// 1. Service (API)
// src/modules/<module>/services/exampleApi.ts
export const fetchItems = async (userId: string) => {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq('user_id', userId);
  if (error) throw error;
  return data;
};

// 2. Hook
// src/modules/<module>/hooks/useItems.ts
export const useItems = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['items', user?.id],
    queryFn: () => fetchItems(user!.id),
    enabled: !!user,
  });
};

// 3. Screen
// src/modules/<module>/screens/ItemsScreen.tsx
const { data, isLoading } = useItems();
```

---

## ✅ Checklist antes de PR

- [ ] Sin errores de TypeScript
- [ ] Probado en iOS y Android
- [ ] Hooks usan React Query correctamente
- [ ] UI sigue design system (GlassCard, colors, typography)
- [ ] Textos en español (UI) o inglés (código/logs)

---

## 🐛 Debugging

```bash
# Limpiar caché
npx expo start -c

# Ver logs de Metro
# Buscar errores en terminal

# React Query Devtools
# No disponible en RN, usar console.log
```
