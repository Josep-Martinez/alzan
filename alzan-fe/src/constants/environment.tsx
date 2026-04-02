export const CONFIG = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  nutritionApiBaseUrl: process.env.EXPO_PUBLIC_NUTRITION_API_BASE_URL || 'https://world.openfoodfacts.org',
  baseUrl: process.env.EXPO_PUBLIC_WEBSITE_URL || 'https://alzanhealth.com',
  alzanBeBaseUrl: process.env.EXPO_PUBLIC_ALZAN_BACKEND_BASE_URL || 'http://localhost:1111',
};
