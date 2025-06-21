import { Link, Stack } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

/**
 * Pantalla 404 (rutas no encontradas)
 * Si no quieres theming avanzado, ya compila tal cual.
 */
export default function NotFoundScreen() {
  return (
    <>
      {/* Cambiamos título de la barra nativa */}
      <Stack.Screen options={{ title: 'Oops!' }} />

      <View style={styles.container}>
        <Text style={styles.title}>Esta pantalla no existe 😕</Text>

        {/* Volver a la Home; replace evita que el 404 quede en el historial */}
        <Link href="/" style={styles.link} replace>
          <Text style={styles.linkText}>Ir a Inicio</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: { fontSize: 20, fontWeight: '600', textAlign: 'center', marginBottom: 24 },
  link: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, backgroundColor: '#4CAF50' },
  linkText: { color: '#fff', fontWeight: '600' },
});