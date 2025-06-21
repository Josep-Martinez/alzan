// components/AddFoodModal.tsx
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { FoodScanner } from './FoodScanner';

interface AddFoodModalProps {
  visible: boolean;
  onClose: () => void;
  onAddFood: (foodData: any) => void;
}

export function AddFoodModal({ visible, onClose, onAddFood }: AddFoodModalProps) {
  // Estados principales del formulario
  const [foodName, setFoodName] = useState('');
  const [gramsAmount, setGramsAmount] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  
  // Estados para el escáner
  const [showScanner, setShowScanner] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<any>(null);
  const [productQuantity, setProductQuantity] = useState<'unit' | 'grams'>('unit');
  const [customGrams, setCustomGrams] = useState('');

  /**
   * FUNCIÓN: Tomar foto con la cámara
   * Solicita permisos y abre la cámara para capturar una imagen
   */
  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      alert('Se necesitan permisos de cámara para tomar fotos');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  /**
   * FUNCIÓN: Seleccionar foto de la galería
   * Solicita permisos y abre la galería para seleccionar una imagen
   */
  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      alert('Se necesitan permisos de galería para seleccionar fotos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  /**
   * FUNCIÓN: Calcular nutrición para ingredientes escritos manualmente
   * Valores fijos por 100g que se ajustarán más adelante con IA
   */
  const calculateManualNutrition = (grams: number) => {
    // Valores nutricionales fijos por 100g (se reemplazará con IA)
    const nutritionPer100g = {
      calories: 150,
      protein: 8,
      carbs: 20,
      fats: 5
    };

    const multiplier = grams / 100;

    return {
      calories: Math.round(nutritionPer100g.calories * multiplier),
      protein: Math.round(nutritionPer100g.protein * multiplier),
      carbs: Math.round(nutritionPer100g.carbs * multiplier),
      fats: Math.round(nutritionPer100g.fats * multiplier),
    };
  };

  /**
   * FUNCIÓN: Calcular nutrición para productos escaneados
   * Ajusta los valores según si es unidad completa o gramos personalizados
   */
  const calculateScannedNutrition = () => {
    if (!scannedProduct) return { calories: 0, protein: 0, carbs: 0, fats: 0 };

    if (productQuantity === 'unit') {
      // Unidad completa - usar valores directos del producto
      return {
        calories: scannedProduct.calories,
        protein: scannedProduct.protein,
        carbs: scannedProduct.carbs,
        fats: scannedProduct.fats,
      };
    } else {
      // Gramos personalizados - calcular proporcionalmente (valores del escáner son por 100g)
      const grams = parseInt(customGrams) || 0;
      const multiplier = grams / 100;

      return {
        calories: Math.round(scannedProduct.calories * multiplier),
        protein: Math.round(scannedProduct.protein * multiplier),
        carbs: Math.round(scannedProduct.carbs * multiplier),
        fats: Math.round(scannedProduct.fats * multiplier),
      };
    }
  };

  /**
   * FUNCIÓN: Manejar producto escaneado
   * Recibe los datos del escáner y configura el estado
   */
  const handleProductScanned = (product: any) => {
    setScannedProduct(product);
    setShowScanner(false);
  };

  /**
   * FUNCIÓN: Añadir ingrediente manual
   * Procesa el ingrediente escrito manualmente con foto opcional
   */
  const handleAddManualFood = () => {
    if (!foodName.trim() || !gramsAmount.trim()) {
      return;
    }

    const grams = parseInt(gramsAmount);
    if (isNaN(grams) || grams <= 0) {
      alert('Por favor, introduce una cantidad válida en gramos');
      return;
    }

    const nutrition = calculateManualNutrition(grams);
    
    onAddFood({
      name: foodName.trim(),
      quantity: `${grams}g`,
      photoUri: photoUri,
      isAnalyzedByAI: false, // Será true cuando se implemente IA para fotos
      ...nutrition
    });

    handleClose();
  };

  /**
   * FUNCIÓN: Añadir producto escaneado
   * Procesa el producto del escáner con la cantidad seleccionada
   */
  const handleAddScannedFood = () => {
    if (!scannedProduct) return;

    const nutrition = calculateScannedNutrition();
    let quantity: string;

    if (productQuantity === 'unit') {
      quantity = '1 unidad';
    } else {
      const grams = parseInt(customGrams) || 0;
      if (grams <= 0) {
        alert('Por favor, introduce una cantidad válida en gramos');
        return;
      }
      quantity = `${grams}g`;
    }
    
    onAddFood({
      name: scannedProduct.name,
      quantity: quantity,
      photoUri: null,
      isAnalyzedByAI: false,
      category: scannedProduct.category,
      ...nutrition
    });

    handleClose();
  };

  /**
   * FUNCIÓN: Cerrar modal y limpiar estados
   */
  const handleClose = () => {
    // Limpiar estados del formulario manual
    setFoodName('');
    setGramsAmount('');
    setPhotoUri(null);
    
    // Limpiar estados del escáner
    setScannedProduct(null);
    setProductQuantity('unit');
    setCustomGrams('');
    
    onClose();
  };

  /**
   * FUNCIÓN: Remover foto seleccionada
   */
  const removePhoto = () => {
    setPhotoUri(null);
    setFoodName('');
    setGramsAmount('');
  };

  /**
   * FUNCIÓN: Volver al formulario principal desde el producto escaneado
   */
  const backToMainForm = () => {
    setScannedProduct(null);
    setProductQuantity('unit');
    setCustomGrams('');
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
          {/* HEADER */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {scannedProduct ? 'Producto Escaneado' : 'Añadir Ingrediente'}
            </Text>
            <Pressable onPress={handleClose} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={24} color="#FFFFFF" />
            </Pressable>
          </View>

          <ScrollView style={styles.modalContent}>
            {!scannedProduct ? (
              /* FORMULARIO PRINCIPAL */
              <>
                {/* BOTONES DE ACCIÓN PRINCIPALES */}
                <View style={styles.mainActions}>
                  <Pressable 
                    style={[styles.actionCard, styles.scannerCard]}
                    onPress={() => setShowScanner(true)}
                  >
                    <MaterialCommunityIcons name="barcode-scan" size={32} color="#00D4AA" />
                    <Text style={styles.actionCardTitle}>Escanear Código</Text>
                    <Text style={styles.actionCardSubtitle}>
                      Escanea el código de barras del producto
                    </Text>
                  </Pressable>

                  <View style={styles.orDivider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.orText}>O</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  <Text style={styles.manualFormTitle}>Escribir manualmente</Text>
                </View>

                {/* SECCIÓN DE FOTO */}
                <View style={styles.photoSection}>
                  {photoUri ? (
                    <View style={styles.photoContainer}>
                      <Image source={{ uri: photoUri }} style={styles.photoPreview} />
                      <Pressable style={styles.removePhotoButton} onPress={removePhoto}>
                        <MaterialCommunityIcons name="close-circle" size={24} color="#FF6B6B" />
                      </Pressable>
                    </View>
                  ) : (
                    <View style={styles.photoPlaceholder}>
                      <MaterialCommunityIcons name="camera-plus" size={48} color="#6B7280" />
                      <Text style={styles.photoPlaceholderText}>Añadir foto (opcional)</Text>
                      <Text style={styles.photoPlaceholderSubtext}>
                        La IA detectará automáticamente los nutrientes en el futuro
                      </Text>
                      
                      <View style={styles.photoButtons}>
                        <Pressable style={styles.photoButton} onPress={takePhoto}>
                          <MaterialCommunityIcons name="camera" size={20} color="#FFFFFF" />
                          <Text style={styles.photoButtonText}>Cámara</Text>
                        </Pressable>
                        
                        <Pressable style={styles.photoButton} onPress={pickImage}>
                          <MaterialCommunityIcons name="image" size={20} color="#FFFFFF" />
                          <Text style={styles.photoButtonText}>Galería</Text>
                        </Pressable>
                      </View>
                    </View>
                  )}
                </View>

                {/* FORMULARIO MANUAL */}
                <View style={styles.formContainer}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Nombre del ingrediente</Text>
                    <TextInput
                      style={styles.textInput}
                      value={foodName}
                      onChangeText={setFoodName}
                      placeholder="Ej: Pollo a la plancha, Arroz integral..."
                      placeholderTextColor="#6B7280"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Cantidad en gramos</Text>
                    <TextInput
                      style={styles.textInput}
                      value={gramsAmount}
                      onChangeText={setGramsAmount}
                      placeholder="Ej: 150, 200, 300..."
                      placeholderTextColor="#6B7280"
                      keyboardType="numeric"
                    />
                  </View>

                  {/* PREVIEW NUTRICIONAL */}
                  {foodName && gramsAmount && (
                    <View style={styles.nutritionPreview}>
                      <Text style={styles.nutritionPreviewTitle}>Valores nutricionales estimados</Text>
                      
                      <View style={styles.nutritionGrid}>
                        {(() => {
                          const grams = parseInt(gramsAmount) || 0;
                          const nutrition = calculateManualNutrition(grams);
                          return (
                            <>
                              <View style={styles.nutritionItem}>
                                <Text style={styles.nutritionValue}>{nutrition.calories}</Text>
                                <Text style={styles.nutritionLabel}>kcal</Text>
                              </View>
                              <View style={styles.nutritionItem}>
                                <Text style={styles.nutritionValue}>{nutrition.protein}g</Text>
                                <Text style={styles.nutritionLabel}>Proteínas</Text>
                              </View>
                              <View style={styles.nutritionItem}>
                                <Text style={styles.nutritionValue}>{nutrition.carbs}g</Text>
                                <Text style={styles.nutritionLabel}>Carbohidratos</Text>
                              </View>
                              <View style={styles.nutritionItem}>
                                <Text style={styles.nutritionValue}>{nutrition.fats}g</Text>
                                <Text style={styles.nutritionLabel}>Grasas</Text>
                              </View>
                            </>
                          );
                        })()}
                      </View>
                    </View>
                  )}

                  <View style={styles.infoNotice}>
                    <MaterialCommunityIcons name="information" size={20} color="#6366F1" />
                    <Text style={styles.infoNoticeText}>
                      Los valores nutricionales se calcularán con precisión usando IA próximamente
                    </Text>
                  </View>
                </View>
              </>
            ) : (
              /* VISTA DE PRODUCTO ESCANEADO */
              <View style={styles.scannedProductContainer}>
                {/* INFORMACIÓN DEL PRODUCTO */}
                <View style={styles.productInfo}>
                  <View style={[
                    styles.categoryBadge,
                    { backgroundColor: getCategoryColor(scannedProduct.category) }
                  ]}>
                    <MaterialCommunityIcons 
                      name={getCategoryIcon(scannedProduct.category)}
                      size={16} 
                      color="#FFFFFF" 
                    />
                    <Text style={styles.categoryText}>
                      {getCategoryName(scannedProduct.category)}
                    </Text>
                  </View>

                  <Text style={styles.productName}>{scannedProduct.name}</Text>
                  <Text style={styles.productBrand}>{scannedProduct.brand}</Text>
                </View>

                {/* VALORES NUTRICIONALES BASE (por 100g) */}
                <View style={styles.baseNutritionInfo}>
                  <Text style={styles.baseNutritionTitle}>Información nutricional (por 100g)</Text>
                  <View style={styles.nutritionGrid}>
                    <View style={styles.nutritionItem}>
                      <Text style={styles.nutritionValue}>{scannedProduct.calories}</Text>
                      <Text style={styles.nutritionLabel}>kcal</Text>
                    </View>
                    <View style={styles.nutritionItem}>
                      <Text style={styles.nutritionValue}>{scannedProduct.protein}g</Text>
                      <Text style={styles.nutritionLabel}>Proteínas</Text>
                    </View>
                    <View style={styles.nutritionItem}>
                      <Text style={styles.nutritionValue}>{scannedProduct.carbs}g</Text>
                      <Text style={styles.nutritionLabel}>Carbohidratos</Text>
                    </View>
                    <View style={styles.nutritionItem}>
                      <Text style={styles.nutritionValue}>{scannedProduct.fats}g</Text>
                      <Text style={styles.nutritionLabel}>Grasas</Text>
                    </View>
                  </View>
                </View>

                {/* SELECTOR DE CANTIDAD */}
                <View style={styles.quantitySection}>
                  <Text style={styles.quantitySectionTitle}>¿Qué cantidad has consumido?</Text>
                  
                  <View style={styles.quantityOptions}>
                    <Pressable 
                      style={[
                        styles.quantityOption,
                        productQuantity === 'unit' && styles.selectedQuantityOption
                      ]}
                      onPress={() => setProductQuantity('unit')}
                    >
                      <MaterialCommunityIcons 
                        name="package-variant" 
                        size={24} 
                        color={productQuantity === 'unit' ? '#00D4AA' : '#6B7280'} 
                      />
                      <Text style={[
                        styles.quantityOptionText,
                        productQuantity === 'unit' && styles.selectedQuantityOptionText
                      ]}>
                        Unidad completa
                      </Text>
                      <Text style={[
                        styles.quantityOptionSubtext,
                        productQuantity === 'unit' && styles.selectedQuantityOptionSubtext
                      ]}>
                        Todo el producto
                      </Text>
                    </Pressable>

                    <Pressable 
                      style={[
                        styles.quantityOption,
                        productQuantity === 'grams' && styles.selectedQuantityOption
                      ]}
                      onPress={() => setProductQuantity('grams')}
                    >
                      <MaterialCommunityIcons 
                        name="scale" 
                        size={24} 
                        color={productQuantity === 'grams' ? '#00D4AA' : '#6B7280'} 
                      />
                      <Text style={[
                        styles.quantityOptionText,
                        productQuantity === 'grams' && styles.selectedQuantityOptionText
                      ]}>
                        Cantidad personalizada
                      </Text>
                      <Text style={[
                        styles.quantityOptionSubtext,
                        productQuantity === 'grams' && styles.selectedQuantityOptionSubtext
                      ]}>
                        Especificar gramos
                      </Text>
                    </Pressable>
                  </View>

                  {/* INPUT PARA GRAMOS PERSONALIZADOS */}
                  {productQuantity === 'grams' && (
                    <View style={styles.customGramsInput}>
                      <Text style={styles.inputLabel}>Cantidad en gramos</Text>
                      <TextInput
                        style={styles.textInput}
                        value={customGrams}
                        onChangeText={setCustomGrams}
                        placeholder="Ej: 150, 200, 300..."
                        placeholderTextColor="#6B7280"
                        keyboardType="numeric"
                      />
                    </View>
                  )}
                </View>

                {/* PREVIEW NUTRICIONAL CALCULADO */}
                <View style={styles.calculatedNutrition}>
                  <Text style={styles.calculatedNutritionTitle}>Tu consumo calculado</Text>
                  <View style={styles.nutritionGrid}>
                    {(() => {
                      const nutrition = calculateScannedNutrition();
                      return (
                        <>
                          <View style={styles.nutritionItem}>
                            <Text style={styles.nutritionValue}>{nutrition.calories}</Text>
                            <Text style={styles.nutritionLabel}>kcal</Text>
                          </View>
                          <View style={styles.nutritionItem}>
                            <Text style={styles.nutritionValue}>{nutrition.protein}g</Text>
                            <Text style={styles.nutritionLabel}>Proteínas</Text>
                          </View>
                          <View style={styles.nutritionItem}>
                            <Text style={styles.nutritionValue}>{nutrition.carbs}g</Text>
                            <Text style={styles.nutritionLabel}>Carbohidratos</Text>
                          </View>
                          <View style={styles.nutritionItem}>
                            <Text style={styles.nutritionValue}>{nutrition.fats}g</Text>
                            <Text style={styles.nutritionLabel}>Grasas</Text>
                          </View>
                        </>
                      );
                    })()}
                  </View>
                </View>

                {/* BOTÓN VOLVER */}
                <Pressable style={styles.backButton} onPress={backToMainForm}>
                  <MaterialCommunityIcons name="arrow-left" size={20} color="#6B7280" />
                  <Text style={styles.backButtonText}>Escanear otro producto</Text>
                </Pressable>
              </View>
            )}
          </ScrollView>

          {/* ACCIONES DEL MODAL */}
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
                (!scannedProduct && (!foodName.trim() || !gramsAmount.trim())) && styles.disabledButton,
                (scannedProduct && productQuantity === 'grams' && !customGrams.trim()) && styles.disabledButton
              ]}
              onPress={scannedProduct ? handleAddScannedFood : handleAddManualFood}
              disabled={
                (!scannedProduct && (!foodName.trim() || !gramsAmount.trim())) ||
                (scannedProduct && productQuantity === 'grams' && !customGrams.trim())
              }
            >
              <MaterialCommunityIcons name="plus" size={18} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Añadir</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* MODAL DEL ESCÁNER */}
      <FoodScanner
        visible={showScanner}
        onClose={() => setShowScanner(false)}
        onProductScanned={handleProductScanned}
      />
    </Modal>
  );
}

/**
 * FUNCIONES HELPER para categorías de productos
 */
const getCategoryColor = (category?: string) => {
  switch (category) {
    case 'real': return '#10B981';
    case 'good': return '#F59E0B';
    case 'ultra': return '#EF4444';
    default: return '#6B7280';
  }
};

const getCategoryIcon = (category?: string) => {
  switch (category) {
    case 'real': return 'leaf' as const;
    case 'good': return 'check-circle' as const;
    case 'ultra': return 'alert-circle' as const;
    default: return 'help-circle' as const;
  }
};

const getCategoryName = (category?: string) => {
  switch (category) {
    case 'real': return 'Comida Real';
    case 'good': return 'Buen Procesado';
    case 'ultra': return 'Ultraprocesado';
    default: return 'Sin clasificar';
  }
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },

  modalSafeArea: {
    flex: 1,
  },

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

  modalContent: {
    flex: 1,
  },

  // Acciones principales
  mainActions: {
    padding: 20,
    paddingBottom: 10,
  },

  actionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },

  scannerCard: {
    borderColor: 'rgba(0, 212, 170, 0.3)',
    backgroundColor: 'rgba(0, 212, 170, 0.05)',
  },

  actionCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 12,
  },

  actionCardSubtitle: {
    fontSize: 14,
    color: '#B0B0C4',
    textAlign: 'center',
    marginTop: 4,
  },

  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },

  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },

  orText: {
    color: '#B0B0C4',
    paddingHorizontal: 16,
    fontSize: 14,
    fontWeight: '600',
  },

  manualFormTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },

  // Sección de foto
  photoSection: {
    padding: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },

  photoContainer: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
  },

  photoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 16,
  },

  removePhotoButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    padding: 4,
  },

  photoPlaceholder: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderStyle: 'dashed',
  },

  photoPlaceholderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 12,
  },

  photoPlaceholderSubtext: {
    fontSize: 12,
    color: '#B0B0C4',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
    lineHeight: 16,
  },

  photoButtons: {
    flexDirection: 'row',
    gap: 12,
  },

  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00D4AA',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },

  photoButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  // Formulario
  formContainer: {
    padding: 20,
    paddingTop: 10,
    gap: 20,
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

  // Preview nutricional
  nutritionPreview: {
    backgroundColor: 'rgba(0, 212, 170, 0.1)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 170, 0.3)',
  },

  nutritionPreviewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00D4AA',
    marginBottom: 12,
  },

  nutritionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  nutritionItem: {
    alignItems: 'center',
    flex: 1,
  },

  nutritionValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#00D4AA',
  },

  nutritionLabel: {
    fontSize: 12,
    color: '#B0B0C4',
    marginTop: 2,
  },

  infoNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },

  infoNoticeText: {
    flex: 1,
    fontSize: 12,
    color: '#6366F1',
    fontWeight: '500',
  },

  // Producto escaneado
  scannedProductContainer: {
    padding: 20,
    gap: 24,
  },

  productInfo: {
    alignItems: 'center',
    marginBottom: 8,
  },

  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
    marginBottom: 12,
  },

  categoryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  productName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },

  productBrand: {
    fontSize: 14,
    color: '#B0B0C4',
    textAlign: 'center',
  },

  // Información nutricional base
  baseNutritionInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },

  baseNutritionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#B0B0C4',
    marginBottom: 12,
    textAlign: 'center',
  },

  // Selector de cantidad
  quantitySection: {
    gap: 16,
  },

  quantitySectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },

  quantityOptions: {
    flexDirection: 'row',
    gap: 12,
  },

  quantityOption: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 8,
  },

  selectedQuantityOption: {
    backgroundColor: 'rgba(0, 212, 170, 0.1)',
    borderColor: '#00D4AA',
  },

  quantityOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },

  selectedQuantityOptionText: {
    color: '#00D4AA',
  },

  quantityOptionSubtext: {
    fontSize: 12,
    color: '#B0B0C4',
    textAlign: 'center',
  },

  selectedQuantityOptionSubtext: {
    color: '#00D4AA',
  },

  customGramsInput: {
    marginTop: 12,
    gap: 8,
  },

  // Nutrición calculada
  calculatedNutrition: {
    backgroundColor: 'rgba(0, 212, 170, 0.1)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 170, 0.3)',
  },

  calculatedNutritionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00D4AA',
    marginBottom: 12,
    textAlign: 'center',
  },

  // Botón volver
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },

  backButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },

  // Acciones del modal
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