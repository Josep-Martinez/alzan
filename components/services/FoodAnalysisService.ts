// ----------------------------------------------------------
// Servicio unificado de análisis nutricional con SPOONACULAR
//   • analyzeImage()  ->  IA de fotos  (Spoonacular Images API)
//   • analyzeText()   ->  Parser texto (Spoonacular Ingredients API)
// ----------------------------------------------------------
//  Idioma principal actual: 🇪🇸  (español)
//  • El parser de Spoonacular entiende mucho mejor el inglés, así
//    que si el input está en español intentaremos traducirlo gratis
//    con LibreTranslate.
//  • Si la traducción o el parser fallan, la función lanzará un error
//    que el componente capturará para avisar al usuario.
//
//  FUTURO multi-idioma:
//    1) Detectar `Localization.locale`.
//    2) Ajustar parámetro `source` de LibreTranslate.
//    3) Mantener mismo flujo.
//
// ----------------------------------------------------------

import * as ImageManipulator from 'expo-image-manipulator';
import * as Localization from 'expo-localization';

/*-------------------------  SPOONACULAR  ---------------------------*/
const SPOONACULAR_API_KEY = 'f92481d8425241d6861dfec8ff5f3147';

/*----------------------  LIBRETRANSLATE (opcional) -----------------*
 *  Servicio de traducción open-source. Límite ≈ 100 pet./d sin key.
 *  Si prefieres evitar la llamada externa, comenta la función
 *  `translateToEnglish()` y pide al usuario que escriba en inglés.
 */
const LIBRETRANSLATE_URL = 'https://libretranslate.de/translate';

/*---------------------  Tipado común que usa la UI  ----------------*/
export interface NutritionData {
  calories: number; // kcal
  protein:  number; // g
  carbs:    number; // g
  fats:     number; // g
}

/*===================================================================*
 *  analyzeImage(uri) -> Spoonacular /food/images/analyze
 *==================================================================*/
export async function analyzeImage(imageUri: string): Promise<NutritionData> {
  // 1) Comprimimos para no subir archivos enormes (800 px ≈ 200 KB)
  const { uri: compressedUri } = await ImageManipulator.manipulateAsync(
    imageUri,
    [{ resize: { width: 800 } }],
    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
  );

  // 2) Preparamos el multipart/form-data
  const formData = new FormData();
  formData.append('file', {
    uri:  compressedUri,
    name: 'meal.jpg',
    type: 'image/jpeg',
  } as any);

  // 3) Llamada a Spoonacular
  const resp = await fetch(
    `https://api.spoonacular.com/food/images/analyze?apiKey=${SPOONACULAR_API_KEY}`,
    { method: 'POST', headers: { 'Content-Type': 'multipart/form-data' }, body: formData }
  );

  if (!resp.ok) throw new Error('No pude analizar la imagen (Spoonacular)');

  const json = await resp.json();
  const n    = json.nutrition;

  return {
    calories: Math.round(n.calories.value),
    carbs:    Math.round(n.carbs.value),
    fats:     Math.round(n.fat.value),
    protein:  Math.round(n.protein.value),
  };
}

/*===================================================================*
 *  analyzeText(text) -> Spoonacular /recipes/parseIngredients
 *                       (con fallback de traducción 🇪🇸➜🇬🇧)
 *==================================================================*/
export async function analyzeText(originalText: string): Promise<NutritionData> {
  // 0) Normalizamos espacios y quitamos líneas vacías
  const text = originalText.trim().replace(/\s+/g, ' ');
  if (!text) throw new Error('Descripción vacía');

  // 1) Primero intentamos la llamada directa (por si Spoonacular reconoce el español)
  const parsed = await tryParseWithSpoonacular(text);
  if (parsed) return parsed;

  // 2) Si falla y el idioma del sistema es español, probamos traducir a inglés
  const localeShort = Localization.getLocales()[0].languageCode; // ej: "es"
  if (localeShort === 'es') {
    const translated = await translateToEnglish(text);
    const parsedEn   = await tryParseWithSpoonacular(translated);
    if (parsedEn) return parsedEn;
  }

  // 3) Sin éxito
  throw new Error('No se pudo interpretar el texto. Prueba con otra descripción.');
}

/*===================================================================*
 *  HELPERS
 *==================================================================*/

/**
 * Intenta analizar una lista de ingredientes con Spoonacular.
 *  • Devuelve NutritionData si lo entiende.
 *  • Devuelve null si Spoonacular no encontró macros (>0 kcal).
 */
async function tryParseWithSpoonacular(ingredientList: string): Promise<NutritionData | null> {
  const body =
    'ingredientList=' + encodeURIComponent(ingredientList) +
    '&servings=1&includeNutrition=true';

  const resp = await fetch(
    `https://api.spoonacular.com/recipes/parseIngredients?apiKey=${SPOONACULAR_API_KEY}`,
    { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body }
  );

  if (!resp.ok) return null; // Error HTTP: devolvemos null para probar otra vía

  const json = await resp.json();
  if (!Array.isArray(json) || json.length === 0) return null;

  const ing = json[0]; // Primer ingrediente
  const nutrientsArr = ing.nutrition?.nutrients ?? [];

  // Buscamos los valores por nombre
  const get = (name: string) =>
    Math.round(nutrientsArr.find((n: any) => n.name === name)?.amount ?? 0);

  const calories = get('Calories');
  if (calories === 0) return null; // Spoonacular no lo entendió

  return {
    calories,
    protein: get('Protein'),
    carbs:   get('Carbohydrates'),
    fats:    get('Fat'),
  };
}

/**
 * Traduce texto español ➜ inglés usando LibreTranslate.
 *  (Gratuito y sin clave; ≈10 peticiones/min de forma anónima)
 */
async function translateToEnglish(esText: string): Promise<string> {
  const resp = await fetch(LIBRETRANSLATE_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      q:       esText,
      source:  'es',
      target:  'en',
      format:  'text',
    }),
  });

  if (!resp.ok) throw new Error('Error al traducir el texto');

  const json = await resp.json();
  return json.translatedText ?? esText;
}