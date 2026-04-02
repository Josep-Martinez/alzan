// WebCrypto polyfill - MUST be first
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/requests.types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CONFIG } from '../constants/environment';

// const AsyncStorageAdapter = { ... } (Removed unused var)

const supabaseUrl = CONFIG.supabaseUrl;
const supabaseAnonKey = CONFIG.supabaseAnonKey;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'pkce',
    storage: {
      getItem: key => AsyncStorage.getItem(key),
      setItem: (key, value) => AsyncStorage.setItem(key, value),
      removeItem: key => AsyncStorage.removeItem(key),
    },
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
