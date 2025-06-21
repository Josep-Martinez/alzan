// app/(tabs)/index.tsx
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router'; // Importar router para navegación
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ProgressBar } from 'react-native-paper';

export default function HomeScreen() {
  /* --- DATOS MOCK PARA DEMOSTRACIÓN --- */
  const userName = 'Josep';                                                  
  const kcalConsumed = 1250;                  
  const kcalGoal = 2000;
  const steps = 7832;
  const stepsGoal = 10000;
  
  // Calcular porcentajes de progreso
  const progressPercentage = (kcalConsumed / kcalGoal) * 100;
  const stepsPercentage = (steps / stepsGoal) * 100;

  // Función para navegar a la página de entrenamiento
  const navigateToWorkout = () => {
    router.push('/work');
  };

  // Función para navegar a la página de nutrición
  const navigateToNutrition = () => {
    router.push('/nutrition');
  };

  return (
    // Gradiente de fondo principal (azul oscuro)
    <LinearGradient
      colors={['#0F0F23', '#1A1A3A', '#2D2D5F']}
      style={styles.container}
    >
      {/* Área segura para evitar elementos del sistema */}
      <SafeAreaView style={styles.safeArea}>
        {/* ScrollView para permitir desplazamiento vertical */}
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false} // Oculta barra de scroll
        >
          {/* SECCIÓN: Encabezado con saludo personalizado */}
          <View style={styles.header}>
            <Text style={styles.greeting}>Hola, {userName} 👋</Text>
            <Text style={styles.subtitle}>¡Vamos a por un gran día!</Text>
          </View>

          {/* SECCIÓN: Tarjetas de acciones rápidas */}
          <View style={styles.quickActions}>
            {/* Tarjeta: Próximo Entreno - Navega a /work */}
            <Pressable style={styles.actionCard} onPress={navigateToWorkout}>
              <LinearGradient
                colors={['#00D4AA', '#00B894']} // Gradiente verde
                style={styles.cardGradient}
              >
                <MaterialCommunityIcons name="dumbbell" size={24} color="#FFFFFF" />
                <Text style={styles.cardTitle}>Próximo Entreno</Text>
                <Text style={styles.cardSubtitle}>Tren Superior</Text>
              </LinearGradient>
            </Pressable>

            {/* Tarjeta: Siguiente Comida - Navega a /nutrition */}
            <Pressable style={styles.actionCard} onPress={navigateToNutrition}>
              <LinearGradient
                colors={['#FF6B6B', '#FF5252']} // Gradiente rojo
                style={styles.cardGradient}
              >
                <MaterialCommunityIcons name="food-apple" size={24} color="#FFFFFF" />
                <Text style={styles.cardTitle}>Siguiente Comida</Text>
                <Text style={styles.cardSubtitle}>Almuerzo</Text>
              </LinearGradient>
            </Pressable>
          </View>

          {/* SECCIÓN: Estadísticas de calorías */}
          <View style={styles.statsCard}>
            <LinearGradient
              colors={['#2D2D5F', '#3D3D7F']} // Gradiente azul oscuro
              style={styles.statsGradient}
            >
              {/* Encabezado de la sección con icono */}
              <View style={styles.statsHeader}>
                <MaterialCommunityIcons name="fire" size={28} color="#FF6B6B" />
                <Text style={styles.statsTitle}>Calorías de Hoy</Text>
              </View>
              
              {/* Información principal de calorías */}
              <View style={styles.calorieInfo}>
                <Text style={styles.calorieMain}>
                  {kcalConsumed.toLocaleString()} 
                  <Text style={styles.calorieGoal}> / {kcalGoal.toLocaleString()}</Text>
                </Text>
                <Text style={styles.calorieLabel}>kcal</Text>
              </View>

              {/* Barra de progreso de calorías */}
              <ProgressBar
                progress={kcalConsumed / kcalGoal} // Valor entre 0 y 1
                style={styles.progressBar}
                color="#00D4AA" // Color verde para el progreso
              />
              
              {/* Texto de porcentaje completado */}
              <Text style={styles.progressText}>
                {Math.round(progressPercentage)}% completado
              </Text>
            </LinearGradient>
          </View>

          {/* SECCIÓN: Estadísticas de pasos */}
          <View style={styles.statsCard}>
            <LinearGradient
              colors={['#2D2D5F', '#3D3D7F']} // Gradiente azul oscuro
              style={styles.statsGradient}
            >
              {/* Encabezado de la sección con icono */}
              <View style={styles.statsHeader}>
                <MaterialCommunityIcons name="walk" size={28} color="#00D4AA" />
                <Text style={styles.statsTitle}>Pasos Diarios</Text>
              </View>
              
              {/* Información principal de pasos */}
              <View style={styles.calorieInfo}>
                <Text style={styles.calorieMain}>
                  {steps.toLocaleString()} 
                  <Text style={styles.calorieGoal}> / {stepsGoal.toLocaleString()}</Text>
                </Text>
                <Text style={styles.calorieLabel}>pasos</Text>
              </View>

              {/* Barra de progreso de pasos */}
              <ProgressBar
                progress={steps / stepsGoal} // Valor entre 0 y 1
                style={styles.progressBar}
                color="#FF6B6B" // Color rojo para el progreso
              />
              
              {/* Texto de porcentaje completado */}
              <Text style={styles.progressText}>
                {Math.round(stepsPercentage)}% completado
              </Text>
            </LinearGradient>
          </View>

          {/* SECCIÓN: Progreso semanal */}
          <View style={styles.weeklySection}>
            <Text style={styles.weeklyTitle}>Progreso Semanal</Text>
            <View style={styles.weekRow}>
              {/* Mapear días de la semana */}
              {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day, index) => {
                // Lógica para determinar estado de cada día
                const isCompleted = index < 4; // Días completados (mock)
                const isToday = index === 3;   // Día actual (jueves en este ejemplo)
                
                return (
                  <View key={day} style={styles.dayContainer}>
                    {/* Etiqueta del día */}
                    <Text style={[
                      styles.dayLabel,
                      isToday && styles.dayLabelToday // Estilo especial para hoy
                    ]}>
                      {day}
                    </Text>
                    {/* Indicador visual del día */}
                    <View style={[
                      styles.dayDot,
                      isCompleted && styles.dayDotCompleted, // Verde si está completado
                      isToday && styles.dayDotToday         // Borde verde si es hoy
                    ]}>
                      {/* Checkmark para días completados */}
                      {isCompleted && (
                        <MaterialCommunityIcons 
                          name="check" 
                          size={12} 
                          color="#FFFFFF" 
                        />
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

/* ESTILOS DEL COMPONENTE */
const styles = StyleSheet.create({
  // Contenedor principal con gradiente
  container: {
    flex: 1,
  },
  
  // Área segura para dispositivos con notch
  safeArea: {
    flex: 1,
  },
  
  // ScrollView principal
  scrollView: {
    flex: 1,
  },
  
  // Contenido del scroll con padding
  scrollContent: {
    padding: 20,
    paddingBottom: 40, // Padding extra para mejor experiencia de scroll
  },
  
  // Encabezado con saludo
  header: {
    marginBottom: 24,
    paddingTop: 20,
  },
  
  // Texto principal del saludo
  greeting: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  
  // Subtítulo motivacional
  subtitle: {
    fontSize: 16,
    color: '#B0B0C4',
    fontWeight: '400',
  },

  // Contenedor de acciones rápidas
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },

  // Tarjeta individual de acción
  actionCard: {
    flex: 1,
    height: 100,
    borderRadius: 16,
    overflow: 'hidden', // Para que el gradiente respete el border radius
  },

  // Gradiente interno de las tarjetas
  cardGradient: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Título de la tarjeta
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },

  // Subtítulo de la tarjeta
  cardSubtitle: {
    color: '#FFFFFF',
    fontSize: 12,
    opacity: 0.8,
    marginTop: 2,
  },

  // Tarjeta de estadísticas
  statsCard: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },

  // Gradiente de las tarjetas de estadísticas
  statsGradient: {
    padding: 20,
  },

  // Encabezado de las estadísticas (icono + título)
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },

  // Título de la sección de estadísticas
  statsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 12,
  },

  // Contenedor de la información principal (números)
  calorieInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },

  // Número principal (calorías/pasos actuales)
  calorieMain: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Objetivo (meta de calorías/pasos)
  calorieGoal: {
    fontSize: 24,
    fontWeight: '400',
    color: '#B0B0C4',
  },

  // Etiqueta de unidad (kcal/pasos)
  calorieLabel: {
    fontSize: 16,
    color: '#B0B0C4',
    marginLeft: 8,
    fontWeight: '500',
  },

  // Barra de progreso
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Fondo semi-transparente
    marginBottom: 8,
  },

  // Texto de porcentaje completado
  progressText: {
    fontSize: 14,
    color: '#B0B0C4',
    fontWeight: '500',
  },

  // Sección de progreso semanal
  weeklySection: {
    marginTop: 8,
  },

  // Título del progreso semanal
  weeklyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },

  // Fila de días de la semana
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },

  // Contenedor individual de cada día
  dayContainer: {
    alignItems: 'center',
    flex: 1,
  },

  // Etiqueta del día (L, M, X, etc.)
  dayLabel: {
    fontSize: 14,
    color: '#B0B0C4',
    fontWeight: '600',
    marginBottom: 8,
  },

  // Estilo especial para el día actual
  dayLabelToday: {
    color: '#00D4AA',
  },

  // Punto indicador del día
  dayDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Fondo por defecto
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Punto para días completados
  dayDotCompleted: {
    backgroundColor: '#00D4AA', // Verde sólido
  },

  // Borde especial para el día actual
  dayDotToday: {
    borderWidth: 2,
    borderColor: '#00D4AA',
  },
});