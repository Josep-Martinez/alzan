import {
  MENU_IMPORT_MAX_DAYS,
  MENU_IMPORT_MAX_TOTAL_INGREDIENTS,
  MENU_IMPORT_MAX_UNIQUE_INGREDIENTS,
} from './menuImportContract';

export const MENU_IMPORT_TEMPLATE = `{
  "format": "alzan-menu-plan",
  "version": 1,
  "menu_name": "{{NOMBRE_DEL_MENU}}",
  "days": [
    {
      "date": "YYYY-MM-DD",
      "weekday": "lunes",
      "meals": [
        {
          "meal_type": "breakfast",
          "name": "{{NOMBRE_DE_LA_COMIDA}}",
          "ingredients": [
            {
              "name": "{{NOMBRE_DEL_INGREDIENTE}}",
              "quantity_g": 100
            }
          ]
        }
      ]
    }
  ]
}
`;

export const MENU_IMPORT_PROMPT = `Convierte el DOCX de nutrición adjunto en un JSON alzan-menu-plan v1 listo para importar.

ARCHIVOS
- Lee completo el DOCX del plan de nutrición, aunque tenga otro nombre.
- Usa el CSV adjunto solo para resolver nombres canónicos de ingredientes. Si también hay un DOCX de entrenamiento, ignóralo.

SALIDA
- Devuelve únicamente JSON válido, sin markdown, comentarios ni texto adicional.
- La raíz solo contiene format, version, menu_name y days.
- Cada day solo contiene date, weekday y meals. Cada meal solo contiene meal_type, name e ingredients.
- Cada ingredient solo contiene name y quantity_g. No añadas IDs, categorías, unidades, calorías, macros ni recetas.
- Fechas YYYY-MM-DD, weekday correcto, gramos como números positivos y máximo de ${MENU_IMPORT_MAX_DAYS} días.

FIDELIDAD
- Conserva fechas, días, orden, comidas, nombres, ingredientes y cantidades del DOCX.
- No diseñes, optimices, corrijas raciones, mezcles recetas ni añadas comidas o ingredientes.
- Expande las recetas del documento; no conviertas una lista de la compra en una comida.
- Convierte unidades a gramos solo con una equivalencia explícita del DOCX o del CSV.

INGREDIENTES
- Busca primero coincidencia exacta normalizada en el CSV y copia su nombre canónico.
- Si no existe, usa el ingrediente más parecido solo si mantiene alimento, categoría, estado (crudo/cocido/escurrido) y unidad. No confundas alimentos distintos.
- Conserva siempre la cantidad original. Si no hay una alternativa segura, devuelve un informe de bloqueo.
- Mantén meal_type entre breakfast, almuerzo, lunch, merienda, dinner y snack.
- No inventes nombres, IDs, calorías ni macronutrientes. No superes ${MENU_IMPORT_MAX_TOTAL_INGREDIENTS} ingredientes totales ni ${MENU_IMPORT_MAX_UNIQUE_INGREDIENTS} nombres distintos.

VALIDACIÓN
- Comprueba fechas, weekday, comidas con ingredientes, cantidades positivas y propiedades permitidas.
- Si todo es válido, devuelve solo el JSON siguiendo esta plantilla. Si no, devuelve solo el informe de bloqueo:

PLANTILLA JSON
${MENU_IMPORT_TEMPLATE}`;

export const MENU_IMPORT_CLIPBOARD_TEXT = `${MENU_IMPORT_PROMPT}\n`;
