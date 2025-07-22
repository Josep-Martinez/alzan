// services/GeminiFoodAnalyzer.ts
// Servicio para analizar imágenes de comida usando Google Gemini Vision API

// Configuración de la API de Gemini
const GEMINI_API_KEY = 'AIzaSyAq-aQRkJeyS_1x5gwFLSsSW7yUJUenENQ' as const;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// Interfaces para los tipos de datos
interface NutritionData {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber?: number;
  sugar?: number;
}

interface FoodAnalysisResult {
  detectedFood: string;
  estimatedQuantity: string;
  nutrition: NutritionData;
  confidence: number;
  ingredients: string[];
  category: 'real' | 'good' | 'ultra';
}

interface GeminiResponse {
  candidates: {
    content: {
      parts: {
        text: string;
      }[];
    };
  }[];
}

/**
 * Clase principal para el análisis de comida con Gemini
 */
export class GeminiFoodAnalyzer {
  
  /**
   * Analizar una imagen de comida y obtener información nutricional
   * @param imageUri - URI de la imagen a analizar
   * @returns Promise con el resultado del análisis
   */
  static async analyzeFood(imageUri: string): Promise<FoodAnalysisResult> {
    try {
      // Convertir imagen a base64
      const base64Image = await this.convertImageToBase64(imageUri);
      
      // Crear el prompt para Gemini
      const prompt = this.createFoodAnalysisPrompt();
      
      // Preparar el payload para la API
      const payload = {
        contents: [{
          parts: [
            {
              text: prompt
            },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: base64Image
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.4,
          topK: 32,
          topP: 1,
          maxOutputTokens: 1024,
        }
      };

      // Hacer la llamada a la API de Gemini
      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Error de API: ${response.status} - ${response.statusText}`);
      }

      const data: GeminiResponse = await response.json();
      
      // Procesar la respuesta de Gemini
      return this.parseGeminiResponse(data);
      
    } catch (error) {
      console.error('Error analyzing food with Gemini:', error);
      throw new Error('No se pudo analizar la imagen. Inténtalo de nuevo.');
    }
  }

  /**
   * Convertir imagen a base64
   * @param imageUri - URI de la imagen
   * @returns Promise con la imagen en base64
   */
  private static async convertImageToBase64(imageUri: string): Promise<string> {
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          // Quitar el prefijo "data:image/jpeg;base64," si existe
          const base64Data = base64.split(',')[1] || base64;
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error(error);
      throw new Error('Error al procesar la imagen');
    }
  }

  /**
   * Crear el prompt optimizado para análisis nutricional
   * @returns String con el prompt para Gemini
   */
  private static createFoodAnalysisPrompt(): string {
    return `Analiza esta imagen de comida y proporciona información nutricional detallada en formato JSON.

INSTRUCCIONES:
- Identifica TODOS los alimentos visibles en la imagen
- Estima la cantidad/porción de cada alimento
- Calcula los valores nutricionales totales del plato
- Clasifica según el nivel de procesamiento

Responde ÚNICAMENTE con un JSON válido con esta estructura exacta:

{
  "detectedFood": "Nombre descriptivo del plato completo",
  "estimatedQuantity": "Cantidad estimada (ej: 1 plato, 250g, 2 porciones)",
  "nutrition": {
    "calories": número_entero,
    "protein": número_entero,
    "carbs": número_entero,
    "fats": número_entero,
    "fiber": número_entero,
    "sugar": número_entero
  },
  "confidence": número_decimal_entre_0_y_1,
  "ingredients": ["ingrediente1", "ingrediente2", "ingrediente3"],
  "category": "real" | "good" | "ultra"
}

CRITERIOS DE CATEGORIZACIÓN:
- "real": Alimentos frescos, naturales, sin procesar (frutas, verduras, carnes frescas, huevos)
- "good": Alimentos mínimamente procesados (pasta integral, pan artesanal, yogur natural)
- "ultra": Alimentos ultraprocesados (comida rápida, snacks empaquetados, bebidas azucaradas)

IMPORTANTE: Responde SOLO con el JSON, sin texto adicional.`;
  }

  /**
   * Procesar la respuesta de Gemini y extraer los datos
   * @param data - Respuesta de la API de Gemini
   * @returns Objeto con el análisis de la comida
   */
  private static parseGeminiResponse(data: GeminiResponse): FoodAnalysisResult {
    try {
      // Extraer el texto de la respuesta
      const responseText = data.candidates[0]?.content?.parts[0]?.text;
      
      if (!responseText) {
        throw new Error('Respuesta vacía de Gemini');
      }

      // Limpiar el texto y extraer JSON
      const cleanedText = responseText.trim();
      let jsonText = cleanedText;

      // Intentar extraer JSON si hay texto adicional
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonText = jsonMatch[0];
      }

      // Parsear el JSON
      const analysisResult = JSON.parse(jsonText);

      // Validar que tenga la estructura esperada
      this.validateAnalysisResult(analysisResult);

      return analysisResult;

    } catch (error) {
      console.error('Error parsing Gemini response:', error);
      
      // Devolver resultado por defecto en caso de error
      return {
        detectedFood: 'Comida no identificada',
        estimatedQuantity: '1 porción',
        nutrition: {
          calories: 200,
          protein: 10,
          carbs: 20,
          fats: 8,
          fiber: 3,
          sugar: 5
        },
        confidence: 0.3,
        ingredients: ['ingredientes no identificados'],
        category: 'good'
      };
    }
  }

  /**
   * Validar que el resultado tenga la estructura correcta
   * @param result - Resultado a validar
   */
  private static validateAnalysisResult(result: any): void {
    const requiredFields = ['detectedFood', 'estimatedQuantity', 'nutrition', 'confidence', 'ingredients', 'category'];
    const nutritionFields = ['calories', 'protein', 'carbs', 'fats'];

    // Verificar campos principales
    for (const field of requiredFields) {
      if (!(field in result)) {
        throw new Error(`Campo requerido faltante: ${field}`);
      }
    }

    // Verificar campos de nutrición
    for (const field of nutritionFields) {
      if (!(field in result.nutrition)) {
        throw new Error(`Campo de nutrición faltante: ${field}`);
      }
    }

    // Verificar tipos
    if (typeof result.detectedFood !== 'string') result.detectedFood = 'Comida detectada';
    if (typeof result.estimatedQuantity !== 'string') result.estimatedQuantity = '1 porción';
    if (typeof result.confidence !== 'number') result.confidence = 0.5;
    if (!Array.isArray(result.ingredients)) result.ingredients = [];
    if (!['real', 'good', 'ultra'].includes(result.category)) result.category = 'good';

    // Asegurar que los valores nutricionales sean números
    Object.keys(result.nutrition).forEach(key => {
      if (typeof result.nutrition[key] !== 'number') {
        result.nutrition[key] = parseInt(result.nutrition[key]) || 0;
      }
    });
  }

  /**
   * Método para probar la conexión con la API
   * @returns Promise que indica si la API está funcionando
   */
  static async testConnection(): Promise<boolean> {
    try {
      const testPayload = {
        contents: [{
          parts: [{
            text: "Responde únicamente con 'OK' si puedes leer este mensaje."
          }]
        }]
      };

      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testPayload),
      });

      return response.ok;
    } catch (error) {
      console.error('Error testing Gemini connection:', error);
      return false;
    }
  }
}

// Función helper para uso directo
export const analyzeFoodImage = (imageUri: string): Promise<FoodAnalysisResult> => {
  return GeminiFoodAnalyzer.analyzeFood(imageUri);
};

// Función para verificar si la API está configurada
export const isGeminiConfigured = (): boolean => {
  return GEMINI_API_KEY !== 'AIzaSyAq-aQRkJeyS_1x5gwFLSsSW7yUJUenENQ' && GEMINI_API_KEY !== '';
};