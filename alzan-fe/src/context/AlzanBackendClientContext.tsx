import React, { createContext, ReactNode } from 'react';
import { client } from '../openapi/generated/alzan-be/client.gen';
import { CONFIG } from '../constants/environment';
import { useAuth } from './AuthContext';

const AlzanBackendClientContext = createContext(null);

export const AlzanBackendClientProvider = ({ children }: { children: ReactNode }) => {
  const { session } = useAuth();

  client.setConfig({
    baseUrl: CONFIG.alzanBeBaseUrl,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token}`,
    },
  });

  return <AlzanBackendClientContext.Provider value={null}>{children}</AlzanBackendClientContext.Provider>;
};
