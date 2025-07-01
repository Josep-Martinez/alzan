// components/MealCard.tsx
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  quantity: string;
}

interface Meal {
  id: string;
  name: string;
  time: string;
  foods: FoodItem[];
  totalCalories: number;
  isConfirmed?: boolean;
}

interface MealCardProps {
  meal: Meal;
  onConfirm: (mealId: string) => void;
  onEdit: (meal: Meal) => void;
}

export function MealCard({ meal, onConfirm, onEdit }: MealCardProps) {
  const handleConfirm = () => {
    onConfirm(meal.id);
    
    if (meal.isConfirmed) {
      Alert.alert('❌ Confirmación Cancelada', `${meal.name} ya no está confirmada.`);
    } else {
      Alert.alert('✅ Comida Confirmada', `${meal.name} ha sido registrada correctamente.`);
    }
  };

  return (
    <View style={styles.mealCard}>
      <LinearGradient
        colors={meal.isConfirmed 
          ? ['rgba(0, 220, 180, 0.45)', 'rgba(20, 195, 140, 0.45)'] 
          : ['#2D2D5F', '#3D3D7F']
        }
        style={styles.mealGradient}
      >
        {/* Encabezado de la comida */}
        <View style={styles.mealHeader}>
          <View style={styles.mealTitleContainer}>
            <MaterialCommunityIcons 
              name="silverware-fork-knife" 
              size={24} 
              color={meal.isConfirmed ? "#FFFFFF" : "#00D4AA"} 
            />
            <View style={styles.mealTitleInfo}>
              <Text style={styles.mealName}>{meal.name}</Text>
              <Text style={[styles.mealTime, meal.isConfirmed && styles.mealTimeConfirmed]}>
                {meal.time}
              </Text>
            </View>
          </View>
          
          <View style={styles.mealHeaderRight}>
            {meal.isConfirmed && (
              <View style={styles.checkCircle}>
                <MaterialCommunityIcons name="check" size={20} color="#00D4AA" />
              </View>
            )}
            <Text style={[styles.mealCalories, meal.isConfirmed && styles.mealCaloriesConfirmed]}>
              {meal.totalCalories} kcal
            </Text>
          </View>
        </View>

        {/* Lista de alimentos en la comida */}
        <View style={styles.foodsList}>
          {meal.foods.map((food) => (
            <View key={food.id} style={styles.foodItem}>
              <View style={styles.foodMainInfo}>
                <View style={styles.categoryDot} />
                <View style={styles.foodDetails}>
                  <Text style={[styles.foodName, meal.isConfirmed && styles.foodNameConfirmed]}>
                    {food.name}
                  </Text>
                  <Text style={[styles.foodMeta, meal.isConfirmed && styles.foodMetaConfirmed]}>
                    {food.quantity} • {food.calories} kcal
                  </Text>
                </View>
              </View>
              <View style={styles.macros}>
                <Text style={styles.macroText}>P: {food.protein}g</Text>
                <Text style={styles.macroText}>C: {food.carbs}g</Text>
                <Text style={styles.macroText}>G: {food.fats}g</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Botones de acción */}
        <View style={styles.mealActions}>
          {meal.foods.length > 0 && (
            <Pressable 
              style={[
                styles.actionButton, 
                meal.isConfirmed ? styles.cancelButton : styles.confirmButton
              ]}
              onPress={handleConfirm}
            >
              <MaterialCommunityIcons 
                name={meal.isConfirmed ? "close" : "check"} 
                size={16} 
                color="#FFFFFF"
              />
              <Text style={styles.actionButtonText}>
                {meal.isConfirmed ? "Cancelar" : "Confirmar"}
              </Text>
            </Pressable>
          )}
          
          <Pressable 
            style={[styles.actionButton, styles.editButton]}
            onPress={() => onEdit(meal)}
          >
            <MaterialCommunityIcons name="pencil" size={16} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Modificar</Text>
          </Pressable>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  // Tarjeta de comida
  mealCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },

  mealGradient: {
    padding: 16,
  },

  // Header de la comida
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

  mealTime: {
    fontSize: 14,
    color: '#B0B0C4',
    marginTop: 2,
  },

  mealTimeConfirmed: {
    color: 'rgba(255, 255, 255, 0.9)',
  },

  mealHeaderRight: {
    alignItems: 'flex-end',
    gap: 8,
  },

  checkCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  mealCalories: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00D4AA',
  },

  mealCaloriesConfirmed: {
    color: '#FFFFFF',
    fontWeight: '700',
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

  foodMainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F59E0B',
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

  foodNameConfirmed: {
    color: '#FFFFFF',
  },

  foodMeta: {
    fontSize: 12,
    color: '#B0B0C4',
    marginTop: 2,
  },

  foodMetaConfirmed: {
    color: 'rgba(255, 255, 255, 0.9)',
  },

  macros: {
    flexDirection: 'row',
    gap: 8,
  },

  macroText: {
    fontSize: 11,
    color: '#B0B0C4',
    fontWeight: '500',
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
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.6)',
  },

  editButton: {
    backgroundColor: '#6B7280',
    borderColor: '#6B7280',
  },

  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  
});