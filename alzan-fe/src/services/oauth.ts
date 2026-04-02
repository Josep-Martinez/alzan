import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../lib/supabaseClient';

type Provider = 'google' | 'apple';

export async function signInWithProvider(provider: Provider) {
  const redirectTo = Linking.createURL('auth-callback'); // alzan://auth-callback

  // 1) Pedimos la URL OAuth a Supabase (sin redirección automática)
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      skipBrowserRedirect: true, // ✅ tú controlas el browser
    },
  });

  if (error) throw error;
  if (!data?.url) throw new Error('No se recibió URL de OAuth');

  // 2) Abrimos sesión en navegador seguro y esperamos el redirect
  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

  if (result.type !== 'success' || !result.url) return;

  // 3) Extraemos el code del redirect a tu app
  const { queryParams } = Linking.parse(result.url);
  const code = queryParams?.code as string | undefined;

  if (!code) throw new Error("No llegó 'code' en el redirect");

  // 4) Intercambiamos code por sesión (PKCE)
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) throw exchangeError;
}
