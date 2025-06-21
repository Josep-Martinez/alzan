// components/nutri/AddExtraMealModal.tsx
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';

// Props del componente
interface AddExtraMealModalProps {
  visible: boolean; // Controla si el modal está visible
  onClose: () => void; // Función para cerrar el modal
  onAdd: (name: string, time: string) => void; // Función para añadir la nueva comida
}

export function AddExtraMealModal({ visible, onClose, onAdd }: AddExtraMealModalProps) {
  // Estados del formulario
  const [mealName, setMealName] = useState(''); // Nombre de la comida
  const [mealTime, setMealTime] = useState(''); // Hora de la comida

  // Comidas predefinidas para sugerencias rápidas
  const suggestedMeals = [
    { name: 'Snack de media mañana', time: '10:30', icon: 'cookie' },
    { name: 'Aperitivo', time: '19:00', icon: 'glass-wine' },
    { name: 'Cena tardía', time: '22:00', icon: 'silverware-fork-knife' },
    { name: 'Post-entreno', time: '18:30', icon: 'dumbbell' },
    { name: 'Merienda saludable', time: '16:30', icon: 'fruit-grapes' },
    { name: 'Desayuno tardío', time: '11:00', icon: 'coffee-outline' },
  ];

  /**
   * Manejar la adición de una nueva comida
   * Valida que los campos estén completos antes de proceder
   */
  const handleAdd = () => {
    // Validación básica de campos requeridos
    if (!mealName.trim() || !mealTime.trim()) {
      return; // No hacer nada si faltan datos
    }

    // Llamar a la función padre para añadir la comida
    onAdd(mealName.trim(), mealTime.trim());
    
    // Limpiar el formulario y cerrar el modal
    handleClose();
  };

  /**
   * Seleccionar una comida sugerida
   * Rellena automáticamente los campos del formulario
   */
  const selectSuggestedMeal = (meal: typeof suggestedMeals[0]) => {
    setMealName(meal.name);
    setMealTime(meal.time);
  };

  /**
   * Cerrar el modal y limpiar el formulario
   */
  const handleClose = () => {
    setMealName('');
    setMealTime('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <LinearGradient
        colors={['#0F0F23', '#1A1A3A', '#2D2D5F']}
        style={styles.modalContainer}
      >
        <SafeAreaView style={styles.modalSafeArea}>
          {/* Encabezado del modal */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Añadir Comida Extra</Text>
            <Pressable onPress={handleClose} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={24} color="#FFFFFF" />
            </Pressable>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Sección de comidas sugeridas */}
            <View style={styles.suggestionsSection}>
              <Text style={styles.suggestionsTitle}>Comidas sugeridas</Text>
              <View style={styles.suggestionsGrid}>
                {suggestedMeals.map((meal, index) => (
                  <Pressable
                    key={index}
                    style={styles.suggestionCard}
                    onPress={() => selectSuggestedMeal(meal)}
                  >
                    <View style={styles.suggestionIconContainer}>
                      <MaterialCommunityIcons 
                        name={meal.icon as any} 
                        size={24} 
                        color="#00D4AA" 
                      />
                    </View>
                    <View style={styles.suggestionTextContainer}>
                      <Text style={styles.suggestionName}>{meal.name}</Text>
                      <Text style={styles.suggestionTime}>{meal.time}</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Formulario personalizado */}
            <View style={styles.formContainer}>
              <View style={styles.formHeader}>
                <MaterialCommunityIcons name="pencil-plus" size={20} color="#00D4AA" />
                <Text style={styles.formSectionTitle}>O crea una personalizada</Text>
              </View>
              
              {/* Campo nombre de la comida */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nombre de la comida *</Text>
                <TextInput
                  style={styles.textInput}
                  value={mealName}
                  onChangeText={setMealName}
                  placeholder="Ej: Snack de media tarde, Brunch..."
                  placeholderTextColor="#6B7280"
                  autoFocus={false}
                />
              </View>

              {/* Campo hora de la comida */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Hora *</Text>
                <TextInput
                  style={styles.textInput}
                  value={mealTime}
                  onChangeText={setMealTime}
                  placeholder="Ej: 10:30, 16:00..."
                  placeholderTextColor="#6B7280"
                />
              </View>

              {/* Información adicional */}
              <View style={styles.infoBox}>
                <MaterialCommunityIcons name="information" size={20} color="#00D4AA" />
                <Text style={styles.infoText}>
                  Podrás añadir alimentos a esta comida una vez creada
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Botones de acción */}
          <View style={styles.modalActions}>
            <Pressable 
              style={[styles.actionButton, styles.cancelButton]}
              onPress={handleClose}
            >
              <Text style={styles.actionButtonText}>Cancelar</Text>
            </Pressable>
            
            <Pressable 
              style={[
                styles.actionButton, 
                styles.addButton,
                (!mealName.trim() || !mealTime.trim()) && styles.disabledButton
              ]}
              onPress={handleAdd}
              disabled={!mealName.trim() || !mealTime.trim()}
            >
              <MaterialCommunityIcons name="plus" size={18} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Añadir</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </Modal>
  );
}

/* ESTILOS DEL COMPONENTE */
const styles = StyleSheet.create({
  // Contenedor principal del modal
  modalContainer: {
    flex: 1,
  },

  modalSafeArea: {
    flex: 1,
  },

  // Encabezado del modal
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  closeButton: {
    padding: 4,
  },

  // Contenido scrolleable
  modalContent: {
    flex: 1,
    padding: 20,
  },

  // Sección de sugerencias
  suggestionsSection: {
    marginBottom: 32,
  },

  suggestionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },

  suggestionsGrid: {
    gap: 12,
  },

  suggestionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },

  suggestionIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(0, 212, 170, 0.1)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },

  suggestionTextContainer: {
    flex: 1,
  },

  suggestionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },

  suggestionTime: {
    fontSize: 14,
    color: '#B0B0C4',
    fontWeight: '500',
  },

  // Formulario personalizado
  formContainer: {
    gap: 20,
  },

  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },

  formSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  inputGroup: {
    gap: 8,
  },

  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },

  // Caja de información
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 212, 170, 0.1)',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginTop: 8,
  },

  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#00D4AA',
    fontWeight: '500',
    lineHeight: 20,
  },

  // Botones de acción
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },

  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 6,
  },

  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },

  addButton: {
    backgroundColor: '#00D4AA',
  },

  disabledButton: {
    backgroundColor: '#6B7280',
    opacity: 0.5,
  },

  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});