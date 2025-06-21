import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function TabLayout() {
  return (
    <SafeAreaProvider>
      <Tabs
        screenOptions={{
          headerShown: false, // Usaremos nuestro header personalizado
          tabBarActiveTintColor: "#4CAF50",
          tabBarInactiveTintColor: "#6B7280",
          tabBarStyle: {
            backgroundColor: "#1C1E30", // Color oscuro coherente con las páginas
            borderTopWidth: 1,
            borderTopColor: "#2A2D47",
            elevation: 8,
            shadowColor: "#000",
            shadowOffset: {
              width: 0,
              height: -2,
            },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            height: Platform.OS === "ios" ? 90 : 70,
            paddingTop: 8,
            paddingBottom: Platform.OS === "ios" ? 25 : 8,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "600",
            marginTop: 4,
          },
          tabBarIconStyle: {
            marginTop: 2,
          },
        }}
      >
        {/* 4 pestañas visibles */}
        <Tabs.Screen
          name="index"
          options={{
            title: "Inicio",
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons
                name="home-variant"
                color={color}
                size={size}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="nutrition"
          options={{
            title: "Nutrición",
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons
                name="nutrition"
                color={color}
                size={size}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="work"
          options={{
            title: "Ejercicios",
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons
                name="dumbbell"
                color={color}
                size={size}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="stats"
          options={{
            title: "Estadísticas",
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons
                name="chart-bar"
                color={color}
                size={size}
              />
            ),
          }}
        />
      </Tabs>
    </SafeAreaProvider>
  );
}