import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RootNavigator } from './src/navigation/RootNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { PreferencesProvider } from './src/context/PreferencesContext';
import { ThemeProvider } from './src/context/ThemeContext';
import './src/i18n';

import { enableScreens } from 'react-native-screens';
import { AlzanBackendClientProvider } from './src/context/AlzanBackendClientContext';
import { AlertProvider } from './src/context/AlertContext';

// Enable screens for better performance
enableScreens(true);

const queryClient = new QueryClient();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            <AlzanBackendClientProvider>
              <PreferencesProvider>
                <ThemeProvider>
                  <AlertProvider>
                    <RootNavigator />
                  </AlertProvider>
                </ThemeProvider>
              </PreferencesProvider>
            </AlzanBackendClientProvider>
          </QueryClientProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
