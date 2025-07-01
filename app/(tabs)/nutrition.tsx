// screens/nutrition.tsx - Pantalla principal de registro nutricional
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { ProgressBar } from 'react-native-paper';

// Importar componentes personalizados
import { AddExtraMealModal } from '../../components/nutri/AddExtraMealModal';
import { AddFoodModal } from '../../components/nutri/AddFoodModal';

/**
 * INTERFACES: Definición de tipos para las estructuras de datos
 */
interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  quantity: string;
  category?: 'real' | 'good' | 'ultra';
  photoUri?: string;
  isAnalyzedByAI?: boolean;
}

interface MealSection {
  id: string;
  name: string;
  time: string;
  foods: FoodItem[];
  totalCalories: number;
  icon: string;
  isCompleted?: boolean;
  isExpanded?: boolean;
}

interface WeekDay {
  id: string;
  day: string;
  date: number;
  isToday: boolean;
  isSelected: boolean;
  meals: MealSection[];
  waterIntake: number;
}

interface DayNutrition {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
}

export default function NutritionScreen() {
  /**
   * FUNCIÓN: Generar días de la semana con datos mock
   * Crea una semana completa con datos de ejemplo para demostración
   */
  const generateWeekDays = (): WeekDay[] => {
    const today = new Date();
    const currentDay = today.getDay();
    
    const weekDays: WeekDay[] = [];
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    
    // Calcular el offset para que la semana empiece en lunes
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
    
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(today);
      dayDate.setDate(today.getDate() + mondayOffset + i);
      
      const isToday = dayDate.toDateString() === today.toDateString();
      const mockMeals = generateMockMealsForDay(i, isToday);
      
      weekDays.push({
        id: `day-${i}`,
        day: dayNames[dayDate.getDay()],
        date: dayDate.getDate(),
        isToday,
        isSelected: isToday,
        meals: mockMeals,
        waterIntake: isToday ? 1200 : Math.floor(Math.random() * 1000) + 1500
      });
    }
    
    return weekDays;
  };

  /**
   * FUNCIÓN: Generar comidas mock específicas por día
   * Crea datos de ejemplo para cada día de la semana
   */
  const generateMockMealsForDay = (dayIndex: number, isToday: boolean): MealSection[] => {
    const baseMeals: MealSection[] = [
      {
        id: 'breakfast',
        name: 'Desayuno',
        time: '07:00',
        icon: 'coffee',
        foods: [],
        totalCalories: 0,
        isCompleted: false,
        isExpanded: false
      },
      {
        id: 'lunch',
        name: 'Almuerzo',
        time: '10:00',
        icon: 'bread-slice',
        foods: [],
        totalCalories: 0,
        isCompleted: false,
        isExpanded: false
      },
      {
        id: 'launch',
        name: 'Comida',
        time: '14:00',
        icon: 'food-drumstick',
        foods: [],
        totalCalories: 0,
        isCompleted: false,
        isExpanded: false
      },
      {
        id: 'snack',
        name: 'Merienda',
        time: '17:00',
        icon: 'food-variant',
        foods: [],
        totalCalories: 0,
        isCompleted: false,
        isExpanded: false
      },
      {
        id: 'dinner',
        name: 'Cena',
        time: '21:30',
        icon: 'silverware-fork-knife',
        foods: [],
        totalCalories: 0,
        isCompleted: false,
        isExpanded: false
      }
    ];

    // Añadir datos mock solo para el día de hoy para demostración
    if (isToday) {
      baseMeals[0].foods = [
        {
          id: '1',
          name: 'Avena con plátano',
          calories: 320,
          protein: 12,
          carbs: 58,
          fats: 6,
          quantity: '200g',
          category: 'real'
        },
        {
          id: '2',
          name: 'Café con leche',
          calories: 80,
          protein: 4,
          carbs: 8,
          fats: 3,
          quantity: '250ml',
          category: 'good'
        }
      ];
      baseMeals[0].totalCalories = 400;
      baseMeals[0].isCompleted = true; // Desayuno completado

      baseMeals[2].foods = [
        {
          id: '3',
          name: 'Pollo a la plancha',
          calories: 250,
          protein: 46,
          carbs: 0,
          fats: 6,
          quantity: '150g',
          category: 'real'
        },
        {
          id: '4',
          name: 'Arroz integral',
          calories: 200,
          protein: 4,
          carbs: 44,
          fats: 2,
          quantity: '100g',
          category: 'good'
        }
      ];
      baseMeals[2].totalCalories = 450;
      baseMeals[2].isCompleted = true; // Comida completada

      baseMeals[4].foods = [
        {
          id: '5',
          name: 'Salmón al horno',
          calories: 200,
          protein: 25,
          carbs: 0,
          fats: 12,
          quantity: '120g',
          category: 'real'
        }
      ];
      baseMeals[4].totalCalories = 200;
    } else {
      // Datos mock para otros días (más variados)
      const mockFoodsPerDay = [
        ['Yogur con frutas', 'Tostadas integrales'],
        ['Ensalada César', 'Pasta con pollo'],
        ['Huevos revueltos', 'Sándwich de pavo'],
        ['Batido de proteína', 'Pizza casera'],
        ['Tortitas de avena', 'Pescado al vapor'],
        ['Smoothie verde', 'Hamburguesa saludable'],
        ['Granola casera', 'Tacos de pescado']
      ];

      if (dayIndex < mockFoodsPerDay.length) {
        baseMeals[0].foods = [{
          id: `mock-${dayIndex}-1`,
          name: mockFoodsPerDay[dayIndex][0],
          calories: Math.floor(Math.random() * 200) + 200,
          protein: Math.floor(Math.random() * 15) + 5,
          carbs: Math.floor(Math.random() * 30) + 10,
          fats: Math.floor(Math.random() * 10) + 2,
          quantity: '1 porción',
          category: 'good'
        }];
        baseMeals[0].totalCalories = baseMeals[0].foods[0].calories;

        if (dayIndex % 2 === 0) {
          baseMeals[2].foods = [{
            id: `mock-${dayIndex}-2`,
            name: mockFoodsPerDay[dayIndex][1],
            calories: Math.floor(Math.random() * 300) + 300,
            protein: Math.floor(Math.random() * 20) + 10,
            carbs: Math.floor(Math.random() * 40) + 20,
            fats: Math.floor(Math.random() * 15) + 5,
            quantity: '1 plato',
            category: 'real'
          }];
          baseMeals[2].totalCalories = baseMeals[2].foods[0].calories;
        }
      }
    }

    return baseMeals;
  };

  /**
   * ESTADOS DE LA APLICACIÓN
   * Manejo del estado global de la pantalla
   */
  const [weekDays, setWeekDays] = useState<WeekDay[]>(generateWeekDays());
  const [waterGoal] = useState(2500);
  const [showAddFoodModal, setShowAddFoodModal] = useState(false);
  const [showAddExtraMealModal, setShowAddExtraMealModal] = useState(false);
  const [selectedMealId, setSelectedMealId] = useState<string>('');

  // Obtener el día seleccionado y sus datos
  const selectedDay = weekDays.find(day => day.isSelected);
  const mealSections = selectedDay?.meals || [];
  const waterIntake = selectedDay?.waterIntake || 0;

  /**
   * FUNCIÓN: Calcular nutrición total del día
   * Suma todos los macronutrientes de todas las comidas
   */
  const calculateDayNutrition = (): DayNutrition => {
    const totalCalories = mealSections.reduce((sum, meal) => sum + meal.totalCalories, 0);
    const totalProtein = mealSections.reduce((sum, meal) => 
      sum + meal.foods.reduce((mealSum, food) => mealSum + food.protein, 0), 0
    );
    const totalCarbs = mealSections.reduce((sum, meal) => 
      sum + meal.foods.reduce((mealSum, food) => mealSum + food.carbs, 0), 0
    );
    const totalFats = mealSections.reduce((sum, meal) => 
      sum + meal.foods.reduce((mealSum, food) => mealSum + food.fats, 0), 0
    );

    return { totalCalories, totalProtein, totalCarbs, totalFats };
  };

  const dayNutrition = calculateDayNutrition();
  const dailyCalorieGoal = 2000;
  const progressPercentage = (dayNutrition.totalCalories / dailyCalorieGoal) * 100;
  const waterPercentage = Math.min((waterIntake / waterGoal) * 100, 100);

  /**
   * FUNCIONES DE NAVEGACIÓN Y SELECCIÓN
   */
  const selectDay = (dayId: string) => {
    setWeekDays(prevDays => 
      prevDays.map(day => ({
        ...day,
        isSelected: day.id === dayId
      }))
    );
    console.log(`📅 Día seleccionado: ${dayId}`);
  };

  const openAddFoodForMeal = (mealId: string) => {
    setSelectedMealId(mealId);
    setShowAddFoodModal(true);
  };

  /**
   * FUNCIÓN: Manejar comida extra
   * Añade una nueva comida personalizada al día seleccionado
   */
  const handleAddExtraMeal = (name: string, time: string) => {
    console.log(`🍽️ Añadiendo comida extra: ${name} a las ${time}`);
    
    const newMeal: MealSection = {
      id: `extra-${Date.now()}`,
      name: name,
      time: time,
      icon: 'food-variant',
      foods: [],
      totalCalories: 0,
      isCompleted: false,
      isExpanded: false
    };

    setWeekDays(prevDays => 
      prevDays.map(day => {
        if (!day.isSelected) return day;

        // Ordenar comidas por hora después de añadir la nueva
        const updatedMeals = [...day.meals, newMeal].sort((a, b) => {
          const timeToMinutes = (timeStr: string) => {
            const [hours, minutes] = timeStr.split(':').map(Number);
            return hours * 60 + minutes;
          };
          
          return timeToMinutes(a.time) - timeToMinutes(b.time);
        });

        return {
          ...day,
          meals: updatedMeals
        };
      })
    );
  };

  /**
   * FUNCIÓN: Toggle expandir/contraer comida confirmada
   * Permite mostrar u ocultar los ingredientes de comidas confirmadas
   */
  const toggleMealExpanded = (mealId: string) => {
    setWeekDays(prevDays => 
      prevDays.map(day => {
        if (!day.isSelected) return day;

        return {
          ...day,
          meals: day.meals.map(meal => 
            meal.id === mealId 
              ? { ...meal, isExpanded: !meal.isExpanded }
              : meal
          )
        };
      })
    );
  };

  /**
   * FUNCIÓN: Completar/descompletar comida
   * Marca una comida como completada o la desmarca
   */
  const toggleMealCompleted = (mealId: string) => {
    setWeekDays(prevDays => 
      prevDays.map(day => {
        if (!day.isSelected) return day;

        return {
          ...day,
          meals: day.meals.map(meal => 
            meal.id === mealId 
              ? { ...meal, isCompleted: !meal.isCompleted }
              : meal
          )
        };
      })
    );
    console.log(`✅ Comida ${mealId} completada/descompletada`);
  };
  /**
   * FUNCIÓN: Eliminar alimento de una comida
   * Permite quitar ingredientes que se hayan añadido por error
   */
  const removeFoodFromMeal = (mealId: string, foodId: string) => {
    console.log(`🗑️ Eliminando alimento ${foodId} de la comida ${mealId}`);
    
    setWeekDays(prevDays => 
      prevDays.map(day => {
        if (!day.isSelected) return day;

        return {
          ...day,
          meals: day.meals.map(meal => 
            meal.id === mealId 
              ? { 
                  ...meal, 
                  foods: meal.foods.filter(food => food.id !== foodId),
                  totalCalories: meal.foods
                    .filter(food => food.id !== foodId)
                    .reduce((sum, food) => sum + food.calories, 0)
                }
              : meal
          )
        };
      })
    );
  };

  /**
   * FUNCIÓN: Manejar adición de ingredientes
   * Procesa los datos del modal de añadir comida y los agrega al estado
   */
  const handleAddFood = (foodData: any) => {
    const newFood: FoodItem = {
      id: Date.now().toString(),
      name: foodData.name,
      calories: foodData.calories || 150,
      protein: foodData.protein || 8,
      carbs: foodData.carbs || 20,
      fats: foodData.fats || 5,
      quantity: foodData.quantity,
      category: foodData.category || 'good',
      photoUri: foodData.photoUri,
      isAnalyzedByAI: foodData.isAnalyzedByAI || false
    };

    updateSelectedDayMeals(selectedMealId, newFood);
  };

  /**
   * FUNCIÓN: Actualizar comidas del día seleccionado
   * Función helper para añadir ingredientes a una comida específica
   */
  const updateSelectedDayMeals = (mealId: string, newFood: FoodItem) => {
    setWeekDays(prevDays => 
      prevDays.map(day => {
        if (!day.isSelected) return day;

        return {
          ...day,
          meals: day.meals.map(meal => 
            meal.id === mealId 
              ? { 
                  ...meal, 
                  foods: [...meal.foods, newFood],
                  totalCalories: meal.totalCalories + newFood.calories
                }
              : meal
          )
        };
      })
    );
  };

  /**
   * FUNCIONES DE HIDRATACIÓN
   * Manejo del consumo de agua diario
   */
  const addWater = (amount: number) => {
    setWeekDays(prevDays => 
      prevDays.map(day => 
        day.isSelected 
          ? { ...day, waterIntake: day.waterIntake + amount }
          : day
      )
    );
  };

  const removeWater = (amount: number) => {
    setWeekDays(prevDays => 
      prevDays.map(day => 
        day.isSelected 
          ? { ...day, waterIntake: Math.max(0, day.waterIntake - amount) }
          : day
      )
    );
  };

  /**
   * RENDERIZADO PRINCIPAL
   */
  return (
    <LinearGradient
      colors={['#0F0F23', '#1A1A3A', '#2D2D5F']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ENCABEZADO PRINCIPAL */}
          <View style={styles.header}>
            <Text style={styles.title}>Registro Nutricional 📊</Text>
            <Text style={styles.subtitle}>
              {new Date().toLocaleDateString('es-ES', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long' 
              })}
            </Text>
          </View>

          {/* CALENDARIO SEMANAL */}
          <View style={styles.calendarSection}>
            <Text style={styles.calendarTitle}>Plan Semanal</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.calendarScroll}
              contentContainerStyle={styles.calendarContent}
            >
              {weekDays.map((day) => {
                const dayTotalCalories = day.meals.reduce((sum, meal) => sum + meal.totalCalories, 0);

                return (
                  <Pressable
                    key={day.id}
                    style={[
                      styles.dayCard,
                      day.isToday && styles.todayCard,
                      day.isSelected && styles.selectedDayCard
                    ]}
                    onPress={() => selectDay(day.id)}
                  >
                    <Text style={[
                      styles.dayName,
                      day.isToday && styles.todayText,
                      day.isSelected && styles.selectedDayText
                    ]}>
                      {day.day}
                    </Text>
                    <Text style={[
                      styles.dayDate,
                      day.isToday && styles.todayText,
                      day.isSelected && styles.selectedDayText
                    ]}>
                      {day.date}
                    </Text>
                    <Text style={[
                      styles.dayCalories,
                      day.isToday && styles.todayText,
                      day.isSelected && styles.selectedDayText
                    ]}>
                      {dayTotalCalories} kcal
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* RESUMEN DIARIO */}
          <View style={styles.summaryCard}>
            <LinearGradient
              colors={['#2D2D5F', '#3D3D7F']}
              style={styles.summaryGradient}
            >
              <View style={styles.summaryHeader}>
                <MaterialCommunityIcons name="chart-line" size={28} color="#00D4AA" />
                <Text style={styles.summaryTitle}>
                  Resumen del {selectedDay?.isToday ? 'Día' : selectedDay?.day}
                </Text>
              </View>
              
              <View style={styles.macrosContainer}>
                <View style={styles.mainCalories}>
                  <Text style={styles.calorieNumber}>
                    {dayNutrition.totalCalories}
                    <Text style={styles.calorieGoal}> / {dailyCalorieGoal}</Text>
                  </Text>
                  <Text style={styles.calorieLabel}>kcal</Text>
                </View>

                <View style={styles.macrosGrid}>
                  <View style={styles.macroItem}>
                    <Text style={[styles.macroValue, { color: '#FF6B6B' }]}>{dayNutrition.totalProtein}g</Text>
                    <Text style={styles.macroLabel}>Proteínas</Text>
                  </View>
                  <View style={styles.macroItem}>
                    <Text style={[styles.macroValue, { color: '#F59E0B' }]}>{dayNutrition.totalCarbs}g</Text>
                    <Text style={styles.macroLabel}>Carbohidratos</Text>
                  </View>
                  <View style={styles.macroItem}>
                    <Text style={[styles.macroValue, { color: '#8B5CF6' }]}>{dayNutrition.totalFats}g</Text>
                    <Text style={styles.macroLabel}>Grasas</Text>
                  </View>
                </View>
              </View>

              <ProgressBar
                progress={dayNutrition.totalCalories / dailyCalorieGoal}
                style={styles.progressBar}
                color="#00D4AA"
              />
              
              <Text style={styles.progressText}>
                {Math.round(progressPercentage)}% del objetivo diario
              </Text>
            </LinearGradient>
          </View>

          {/* SECCIÓN DE COMIDAS */}
          <View style={styles.mealsSection}>
            <View style={styles.mealsSectionHeader}>
              <Text style={styles.sectionTitle}>Registro de Comidas</Text>
              
              {selectedDay?.isToday && (
                <Pressable 
                  style={styles.addExtraMealButton}
                  onPress={() => setShowAddExtraMealModal(true)}
                >
                  <MaterialCommunityIcons name="plus" size={18} color="#FFFFFF" />
                  <Text style={styles.addExtraMealText}>Comida Extra</Text>
                </Pressable>
              )}
            </View>
            
            {mealSections.map((meal) => (
              <View key={meal.id} style={styles.mealSection}>
                <LinearGradient
                  colors={meal.isCompleted 
                    ? ['rgba(0, 220, 180, 0.45)', 'rgba(20, 195, 140, 0.45)'] 
                    : ['#2D2D5F', '#3D3D7F']
                  }
                  style={styles.mealGradient}
                >
                  <View style={styles.mealHeader}>
                    <View style={styles.mealTitleContainer}>
                      <MaterialCommunityIcons 
                        name={meal.icon as any} 
                        size={24} 
                        color={meal.isCompleted ? "#FFFFFF" : "#00D4AA"} 
                      />
                      <View style={styles.mealTitleInfo}>
                        <Text style={styles.mealName}>{meal.name}</Text>
                        <Text style={[styles.mealTime, meal.isCompleted && styles.mealTimeCompleted]}>
                          {meal.time}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.mealHeaderRight}>
                      {meal.isCompleted && (
                        <View style={styles.checkCircle}>
                          <MaterialCommunityIcons name="check" size={16} color="#00D4AA" />
                        </View>
                      )}
                      <Text style={[styles.mealCalories, meal.isCompleted && styles.mealCaloriesCompleted]}>
                        {meal.totalCalories} kcal
                      </Text>
                    </View>
                  </View>

                  {meal.foods.length > 0 && !meal.isCompleted ? (
                    <View style={styles.foodsList}>
                      {meal.foods.map((food) => (
                        <View key={food.id} style={styles.foodItem}>
                          {food.photoUri && (
                            <View style={styles.foodImageContainer}>
                              <Image source={{ uri: food.photoUri }} style={styles.foodImage} />
                              {food.isAnalyzedByAI && (
                                <View style={styles.aiIndicatorSmall}>
                                  <MaterialCommunityIcons name="brain" size={10} color="#FFFFFF" />
                                </View>
                              )}
                            </View>
                          )}
                          
                          <View style={styles.foodMainInfo}>
                            <View style={[
                              styles.categoryDot, 
                              { backgroundColor: getCategoryColor(food.category) }
                            ]} />
                            <View style={styles.foodDetails}>
                              <Text style={[styles.foodName, meal.isCompleted && styles.foodNameCompleted]}>
                                {food.name}
                              </Text>
                              <Text style={[styles.foodMeta, meal.isCompleted && styles.foodMetaCompleted]}>
                                {food.quantity} • {food.calories} kcal
                              </Text>
                            </View>
                          </View>
                          
                          {selectedDay?.isToday && (
                            <View style={styles.foodActions}>
                              <Pressable 
                                style={styles.removeButton}
                                onPress={() => removeFoodFromMeal(meal.id, food.id)}
                              >
                                <MaterialCommunityIcons name="close" size={16} color="#FF6B6B" />
                              </Pressable>
                            </View>
                          )}
                        </View>
                      ))}
                    </View>
                  ) : meal.foods.length > 0 && meal.isCompleted ? (
                    <>
                      <Pressable 
                        style={styles.expandButton}
                        onPress={() => toggleMealExpanded(meal.id)}
                      >
                        <Text style={styles.expandButtonText}>
                          Ver {meal.foods.length} ingrediente{meal.foods.length > 1 ? 's' : ''}
                        </Text>
                        <MaterialCommunityIcons 
                          name={meal.isExpanded ? "chevron-up" : "chevron-down"} 
                          size={20} 
                          color="#FFFFFF" 
                        />
                      </Pressable>
                      
                      {meal.isExpanded && (
                        <View style={styles.foodsList}>
                          {meal.foods.map((food) => (
                            <View key={food.id} style={styles.foodItem}>
                              {food.photoUri && (
                                <View style={styles.foodImageContainer}>
                                  <Image source={{ uri: food.photoUri }} style={styles.foodImage} />
                                  {food.isAnalyzedByAI && (
                                    <View style={styles.aiIndicatorSmall}>
                                      <MaterialCommunityIcons name="brain" size={10} color="#FFFFFF" />
                                    </View>
                                  )}
                                </View>
                              )}
                              
                              <View style={styles.foodMainInfo}>
                                <View style={[
                                  styles.categoryDot, 
                                  { backgroundColor: getCategoryColor(food.category) }
                                ]} />
                                <View style={styles.foodDetails}>
                                  <Text style={styles.foodNameCompleted}>
                                    {food.name}
                                  </Text>
                                  <Text style={styles.foodMetaCompleted}>
                                    {food.quantity} • {food.calories} kcal
                                  </Text>
                                </View>
                              </View>
                            </View>
                          ))}
                        </View>
                      )}
                    </>
                  ) : (
                    <View style={styles.emptyMeal}>
                      <MaterialCommunityIcons 
                        name="silverware-fork-knife" 
                        size={32} 
                        color={meal.isCompleted ? "rgba(255, 255, 255, 0.6)" : "#6B7280"} 
                      />
                      <Text style={[styles.emptyMealText, meal.isCompleted && styles.emptyMealTextCompleted]}>
                        No hay alimentos registrados
                      </Text>
                    </View>
                  )}

                  {selectedDay?.isToday && (
                    <View style={styles.mealActions}>
                      {meal.foods.length > 0 && (
                        <Pressable 
                          style={[
                            styles.actionButton, 
                            meal.isCompleted ? styles.cancelButton : styles.confirmButton
                          ]}
                          onPress={() => toggleMealCompleted(meal.id)}
                        >
                          <MaterialCommunityIcons 
                            name={meal.isCompleted ? "close" : "check"} 
                            size={18} 
                            color="#FFFFFF" 
                          />
                          <Text style={styles.actionButtonText}>
                            {meal.isCompleted ? 'Cancelar' : 'Confirmar'}
                          </Text>
                        </Pressable>
                      )}

                      <Pressable 
                        style={[styles.actionButton, styles.addIngredientButton]}
                        onPress={() => openAddFoodForMeal(meal.id)}
                      >
                        <MaterialCommunityIcons name="plus" size={18} color="#FFFFFF" />
                        <Text style={styles.actionButtonText}>Añadir Ingrediente</Text>
                      </Pressable>
                    </View>
                  )}
                </LinearGradient>
              </View>
            ))}
          </View>

          {/* HIDRATACIÓN */}
          {selectedDay?.isToday && (
            <View style={styles.hydrationSection}>
              <View style={styles.hydrationCard}>
                <LinearGradient
                  colors={['#1E3A8A', '#3B82F6']}
                  style={styles.hydrationGradient}
                >
                  <View style={styles.hydrationHeader}>
                    <MaterialCommunityIcons name="water" size={28} color="#60A5FA" />
                    <Text style={styles.hydrationTitle}>Hidratación</Text>
                  </View>
                  
                  <View style={styles.waterDisplay}>
                    <Text style={styles.waterAmount}>
                      {waterIntake}
                      <Text style={styles.waterGoal}> / {waterGoal}</Text>
                    </Text>
                    <Text style={styles.waterLabel}>ml consumidos</Text>
                  </View>

                  <ProgressBar
                    progress={Math.min(waterIntake / waterGoal, 1)}
                    style={styles.progressBar}
                    color="#60A5FA"
                  />
                  
                  <Text style={styles.progressText}>
                    {Math.round(waterPercentage)}% del objetivo diario
                    {waterIntake > waterGoal && (
                      <Text style={styles.exceededText}> • ¡Objetivo superado! 🎉</Text>
                    )}
                  </Text>

                  <View style={styles.waterActions}>
                    {[250, 500, 750].map((amount) => (
                      <Pressable 
                        key={amount}
                        style={styles.waterButton}
                        onPress={() => addWater(amount)}
                      >
                        <MaterialCommunityIcons name="cup-water" size={16} color="#FFFFFF" />
                        <Text style={styles.waterButtonText}>+{amount}ml</Text>
                      </Pressable>
                    ))}
                  </View>

                  {waterIntake > 0 && (
                    <View style={styles.removeWaterSection}>
                      <Text style={styles.removeWaterText}>¿Te equivocaste?</Text>
                      <View style={styles.removeWaterActions}>
                        {[250, 500, 750].map((amount) => (
                          <Pressable 
                            key={`remove-${amount}`}
                            style={styles.removeWaterButton}
                            onPress={() => removeWater(amount)}
                          >
                            <MaterialCommunityIcons name="minus" size={14} color="#FF6B6B" />
                            <Text style={styles.removeWaterButtonText}>-{amount}ml</Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  )}
                </LinearGradient>
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* MODALES */}
      {selectedDay?.isToday && (
        <>
          <AddFoodModal
            visible={showAddFoodModal}
            onClose={() => setShowAddFoodModal(false)}
            onAddFood={handleAddFood}
          />

          <AddExtraMealModal
            visible={showAddExtraMealModal}
            onClose={() => setShowAddExtraMealModal(false)}
            onAdd={handleAddExtraMeal}
          />
        </>
      )}
    </LinearGradient>
  );
}

/**
 * FUNCIÓN HELPER: Obtener color según categoría de alimento
 */
const getCategoryColor = (category?: string) => {
  switch (category) {
    case 'real': return '#10B981';
    case 'good': return '#F59E0B';
    case 'ultra': return '#EF4444';
    default: return '#6B7280';
  }
};

/**
 * ESTILOS DEL COMPONENTE
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  safeArea: {
    flex: 1,
  },
  
  scrollView: {
    flex: 1,
  },
  
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  header: {
    marginBottom: 24,
    paddingTop: 20,
  },
  
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  
  subtitle: {
    fontSize: 16,
    color: '#B0B0C4',
    fontWeight: '400',
    textTransform: 'capitalize',
  },

  // Calendario semanal
  calendarSection: {
    marginBottom: 24,
  },

  calendarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },

  calendarScroll: {
    paddingLeft: 0,
  },

  calendarContent: {
    paddingRight: 20,
    gap: 12,
  },

  dayCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    minWidth: 60,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },

  todayCard: {
    backgroundColor: 'rgba(0, 212, 170, 0.1)',
    borderColor: '#00D4AA',
  },

  selectedDayCard: {
    backgroundColor: '#00D4AA',
    borderColor: '#00D4AA',
  },

  dayName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B0B0C4',
    marginBottom: 4,
  },

  dayDate: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },

  dayCalories: {
    fontSize: 10,
    fontWeight: '500',
    color: '#B0B0C4',
  },

  todayText: {
    color: '#00D4AA',
  },

  selectedDayText: {
    color: '#FFFFFF',
  },

  // Resumen diario
  summaryCard: {
    marginBottom: 24,
    borderRadius: 20,
    overflow: 'hidden',
  },

  summaryGradient: {
    padding: 20,
  },

  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },

  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 12,
  },

  macrosContainer: {
    marginBottom: 16,
  },

  mainCalories: {
    alignItems: 'center',
    marginBottom: 16,
  },

  calorieNumber: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  calorieGoal: {
    fontSize: 24,
    fontWeight: '400',
    color: '#B0B0C4',
  },

  calorieLabel: {
    fontSize: 16,
    color: '#B0B0C4',
    fontWeight: '500',
    marginTop: 4,
  },

  macrosGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },

  macroItem: {
    alignItems: 'center',
  },

  macroValue: {
    fontSize: 18,
    fontWeight: '700',
  },

  macroLabel: {
    fontSize: 12,
    color: '#B0B0C4',
    marginTop: 2,
  },

  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 8,
  },

  progressText: {
    fontSize: 14,
    color: '#B0B0C4',
    fontWeight: '500',
    textAlign: 'center',
  },

  exceededText: {
    color: '#00D4AA',
    fontWeight: '600',
  },

  // Sección de comidas
  mealsSection: {
    marginBottom: 24,
  },

  mealsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  addExtraMealButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },

  addExtraMealText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },

  mealSection: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },

  mealGradient: {
    padding: 16,
  },

  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  mealTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  mealTitleInfo: {
    marginLeft: 12,
  },

  mealName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  mealHeaderRight: {
    alignItems: 'flex-end',
    gap: 8,
  },

  completedStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00D4AA',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 30,
    gap: 10,
    shadowColor: '#00D4AA',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },

  completedStatusText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1.5,
  },

  mealTime: {
    fontSize: 14,
    color: '#B0B0C4',
    marginTop: 2,
  },

  mealCalories: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00D4AA',
  },

  // Lista de alimentos
  foodsList: {
    marginBottom: 16,
  },

  foodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    gap: 12,
  },

  foodImageContainer: {
    position: 'relative',
  },

  foodImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },

  aiIndicatorSmall: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#00D4AA',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },

  foodMainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },

  foodDetails: {
    flex: 1,
  },

  foodName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  foodNameCompleted: {
    color: '#FFFFFF',
  },

  foodMeta: {
    fontSize: 12,
    color: '#B0B0C4',
    marginTop: 2,
  },

  foodMetaCompleted: {
    color: 'rgba(255, 255, 255, 0.9)',
  },

  foodActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  removeButton: {
    padding: 4,
  },

  // Estado vacío de comida
  emptyMeal: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 16,
  },

  emptyMealText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },

  emptyMealTextCompleted: {
    color: 'rgba(255, 255, 255, 0.9)',
  },

  // Botón expandir para comidas confirmadas
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
  },

  expandButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  // Acciones de comida
  mealActions: {
    flexDirection: 'row',
    gap: 12,
  },

  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
    borderWidth: 2,
  },

  confirmButton: {
    backgroundColor: '#00D4AA',
    borderColor: '#00D4AA',
  },

  cancelButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    borderColor: 'rgba(239, 68, 68, 0.8)',
  },

  addIngredientButton: {
    backgroundColor: '#6B7280',
    borderColor: '#6B7280',
  },

  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  // Sección de hidratación
  hydrationSection: {
    marginBottom: 24,
  },

  hydrationCard: {
    borderRadius: 20,
    overflow: 'hidden',
  },

  hydrationGradient: {
    padding: 20,
  },

  hydrationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },

  hydrationTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 12,
  },

  waterDisplay: {
    alignItems: 'center',
    marginBottom: 12,
  },

  waterAmount: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  waterGoal: {
    fontSize: 24,
    fontWeight: '400',
    color: '#B0B0C4',
  },

  waterLabel: {
    fontSize: 16,
    color: '#B0B0C4',
    fontWeight: '500',
    marginTop: 4,
  },

  // Acciones de agua
  waterActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },

  waterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 4,
  },

  waterButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },

  // Sección de eliminar agua
  removeWaterSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },

  removeWaterText: {
    fontSize: 12,
    color: '#B0B0C4',
    textAlign: 'center',
    marginBottom: 8,
  },

  removeWaterActions: {
    flexDirection: 'row',
    gap: 8,
  },

  removeWaterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.2)',
  },

  removeWaterButtonText: {
    color: '#FF6B6B',
    fontSize: 11,
    fontWeight: '600',
  },
  mealTimeCompleted: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  mealCaloriesCompleted: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});