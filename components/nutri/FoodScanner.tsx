// components/FoodScanner.tsx - Escáner de productos para el modal de añadir ingredientes
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Camera, CameraView } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View
} from 'react-native';

/**
 * INTERFACE: Estructura de un producto escaneado
 * Contiene toda la información nutricional y de clasificación del producto
 */
interface ScannedProduct {
  id: string;
  name: string;
  brand: string;
  category: 'real' | 'good' | 'ultra';
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  ingredients: string[];
  additives: string[];
  score: number;
  nova?: number;
  nutriscore?: string;
}

/**
 * INTERFACE: Props del componente FoodScanner
 */
interface FoodScannerProps {
  visible: boolean;
  onClose: () => void;
  onProductScanned: (product: ScannedProduct) => void;
}

export function FoodScanner({ visible, onClose, onProductScanned }: FoodScannerProps) {
  // Estados principales del escáner
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [lastScannedBarcode, setLastScannedBarcode] = useState<string>('');

  /**
   * EFECTO: Solicitar permisos de cámara cuando el modal se abre
   * Se ejecuta cada vez que el modal se hace visible
   */
  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };

    if (visible) {
      getCameraPermissions();
      // Limpiar estado cuando se abre el modal
      setLastScannedBarcode('');
      setIsScanning(false);
    }
  }, [visible]);

  /**
   * FUNCIÓN: Obtener datos del producto desde la API de Open Food Facts
   * Hace una llamada HTTP para obtener información nutricional del código de barras
   */
  const fetchProductFromAPI = async (barcode: string): Promise<ScannedProduct | null> => {
    try {
      console.log(`🔍 Buscando producto con código: ${barcode}`);
      
      const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`);
      const data = await response.json();

      if (data.status === 0) {
        console.log('❌ Producto no encontrado en la base de datos');
        return null;
      }

      const product = data.product;
      console.log('✅ Producto encontrado:', product.product_name);
      
      // Clasificar producto según NOVA y aditivos (estilo MyRealFood)
      const category = classifyProduct(product);
      
      return {
        id: barcode,
        name: product.product_name || 'Producto desconocido',
        brand: product.brands || 'Marca desconocida',
        category,
        calories: Math.round(product.nutriments?.['energy-kcal_100g'] || 0),
        protein: Math.round(product.nutriments?.proteins_100g || 0),
        carbs: Math.round(product.nutriments?.carbohydrates_100g || 0),
        fats: Math.round(product.nutriments?.fat_100g || 0),
        ingredients: product.ingredients_text?.split(', ') || [],
        additives: product.additives_tags || [],
        score: calculateHealthScore(product),
        nova: product.nova_group,
        nutriscore: product.nutrition_grades
      };
    } catch (error) {
      console.error('🚨 Error al obtener datos del producto:', error);
      return null;
    }
  };

  /**
   * FUNCIÓN: Clasificar producto según criterios de MyRealFood
   * Determina si es comida real, buen procesado o ultraprocesado
   */
  const classifyProduct = (product: any): 'real' | 'good' | 'ultra' => {
    const nova = product.nova_group;
    const additives = product.additives_tags || [];

    // Ultraprocesado: NOVA 4 o muchos aditivos
    if (nova === 4 || additives.length > 5) {
      return 'ultra';
    }

    // Comida real: NOVA 1 (alimentos no procesados)
    if (nova === 1 && additives.length === 0) {
      return 'real';
    }

    // Buen procesado: NOVA 2-3 con pocos aditivos
    return 'good';
  };

  /**
   * FUNCIÓN: Calcular puntuación de salud del producto
   * Combina Nutri-Score y clasificación NOVA para dar una puntuación
   */
  const calculateHealthScore = (product: any): number => {
    const nutriscore = product.nutrition_grades;
    const nova = product.nova_group || 3;
    
    let score = 5; // Puntuación base
    
    // Ajustar por Nutri-Score (A=mejor, E=peor)
    const nutriscoreMap: { [key: string]: number } = {
      'a': 2, 'b': 1, 'c': 0, 'd': -1, 'e': -2
    };
    score += nutriscoreMap[nutriscore] || 0;
    
    // Penalizar por nivel NOVA (1=mejor, 4=peor)
    score -= (nova - 1) * 1.5;
    
    return Math.max(0, Math.min(10, score));
  };

  /**
   * FUNCIÓN: Manejar el escaneo de códigos de barras
   * Procesa el código escaneado y busca información del producto
   */
  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    // Evitar escanear el mismo código repetidamente
    if (data === lastScannedBarcode || isScanning) {
      return;
    }

    console.log(`📱 Código escaneado: ${data}`);
    setLastScannedBarcode(data);
    setIsScanning(true);

    try {
      const product = await fetchProductFromAPI(data);
      
      if (product) {
        console.log('✅ Producto procesado, enviando datos');
        onProductScanned(product);
      } else {
        // Producto no encontrado, crear uno básico para que el usuario pueda añadirlo
        Alert.alert(
          'Producto no encontrado',
          'Este producto no está en nuestra base de datos. ¿Quieres añadirlo con valores estimados?',
          [
            { 
              text: 'Cancelar', 
              style: 'cancel',
              onPress: () => {
                setIsScanning(false);
                setLastScannedBarcode('');
              }
            },
            { 
              text: 'Añadir', 
              onPress: () => {
                const basicProduct: ScannedProduct = {
                  id: data,
                  name: 'Producto desconocido',
                  brand: 'Marca desconocida',
                  category: 'good',
                  calories: 200,
                  protein: 8,
                  carbs: 25,
                  fats: 6,
                  ingredients: [],
                  additives: [],
                  score: 5
                };
                onProductScanned(basicProduct);
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('🚨 Error durante el escaneo:', error);
      Alert.alert(
        'Error', 
        'No se pudo obtener información del producto. Inténtalo de nuevo.',
        [
          {
            text: 'OK',
            onPress: () => {
              setIsScanning(false);
              setLastScannedBarcode('');
            }
          }
        ]
      );
    } finally {
      setIsScanning(false);
    }
  };

  /**
   * FUNCIÓN: Cerrar escáner y limpiar estado
   */
  const handleClose = () => {
    setLastScannedBarcode('');
    setIsScanning(false);
    onClose();
  };

  /**
   * RENDERIZADO: Estado sin permisos de cámara (cargando)
   */
  if (hasPermission === null) {
    return (
      <Modal visible={visible} animationType="slide">
        <LinearGradient
          colors={['#0F0F23', '#1A1A3A', '#2D2D5F']}
          style={styles.container}
        >
          <View style={styles.permissionContainer}>
            <ActivityIndicator size="large" color="#00D4AA" />
            <Text style={styles.permissionText}>Solicitando permisos de cámara...</Text>
          </View>
        </LinearGradient>
      </Modal>
    );
  }

  /**
   * RENDERIZADO: Estado sin permisos de cámara (denegados)
   */
  if (hasPermission === false) {
    return (
      <Modal visible={visible} animationType="slide">
        <LinearGradient
          colors={['#0F0F23', '#1A1A3A', '#2D2D5F']}
          style={styles.container}
        >
          <View style={styles.permissionContainer}>
            <MaterialCommunityIcons name="camera-off" size={64} color="#EF4444" />
            <Text style={styles.permissionText}>Sin acceso a la cámara</Text>
            <Text style={styles.permissionSubtext}>
              Necesitas habilitar los permisos de cámara en la configuración para usar el escáner
            </Text>
            <Pressable style={styles.permissionButton} onPress={handleClose}>
              <Text style={styles.permissionButtonText}>Cerrar</Text>
            </Pressable>
          </View>
        </LinearGradient>
      </Modal>
    );
  }

  /**
   * RENDERIZADO PRINCIPAL: Interfaz del escáner
   */
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
    >
      <LinearGradient
        colors={['#0F0F23', '#1A1A3A', '#2D2D5F']}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea}>
          {/* HEADER DEL ESCÁNER */}
          <View style={styles.header}>
            <Pressable onPress={handleClose} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={24} color="#FFFFFF" />
            </Pressable>
            <Text style={styles.headerTitle}>Escáner de Códigos</Text>
            <View style={styles.placeholder} />
          </View>

          {/* VISTA DE LA CÁMARA CON OVERLAY */}
          <View style={styles.scannerContainer}>
            <CameraView
              style={styles.camera}
              barcodeScannerSettings={{
                barcodeTypes: ['ean13', 'ean8', 'upc_a', 'qr', 'code128'],
              }}
              onBarcodeScanned={handleBarcodeScanned}
            >
              {/* OVERLAY DEL ESCÁNER */}
              <View style={styles.scannerOverlay}>
                <View style={styles.scannerBox}>
                  {/* MARCOS DE ENFOQUE */}
                  <View style={styles.scannerCorners}>
                    <View style={[styles.corner, styles.topLeft]} />
                    <View style={[styles.corner, styles.topRight]} />
                    <View style={[styles.corner, styles.bottomLeft]} />
                    <View style={[styles.corner, styles.bottomRight]} />
                  </View>
                  
                  {/* INDICADOR DE ESCANEO ACTIVO */}
                  {isScanning && (
                    <View style={styles.scanningIndicator}>
                      <ActivityIndicator size="large" color="#00D4AA" />
                      <Text style={styles.scanningText}>Analizando producto...</Text>
                    </View>
                  )}
                </View>
                
                {/* INSTRUCCIONES */}
                <Text style={styles.scanPromptText}>
                  Coloca el código de barras dentro del marco
                </Text>
                
                <Text style={styles.scanPromptSubtext}>
                  Asegúrate de que haya buena iluminación y mantén el código estable
                </Text>
              </View>
            </CameraView>
          </View>

          {/* INFORMACIÓN ADICIONAL */}
          <View style={styles.infoSection}>
            <View style={styles.infoCard}>
              <MaterialCommunityIcons name="information" size={20} color="#6366F1" />
              <Text style={styles.infoText}>
                Escaneamos productos de la base de datos de Open Food Facts
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  safeArea: {
    flex: 1,
  },

  // Estados de permisos
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  permissionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
    textAlign: 'center',
  },

  permissionSubtext: {
    fontSize: 14,
    color: '#B0B0C4',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },

  permissionButton: {
    backgroundColor: '#00D4AA',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },

  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },

  closeButton: {
    padding: 8,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  placeholder: {
    width: 40,
  },

  // Contenedor del escáner
  scannerContainer: {
    flex: 1,
  },

  camera: {
    flex: 1,
  },

  scannerOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 20,
  },

  scannerBox: {
    width: 280,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 40,
  },

  // Marcos de enfoque
  scannerCorners: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },

  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#00D4AA',
    borderWidth: 3,
  },

  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },

  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },

  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },

  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },

  // Indicador de escaneo
  scanningIndicator: {
    alignItems: 'center',
    gap: 12,
  },

  scanningText: {
    color: '#00D4AA',
    fontSize: 16,
    fontWeight: '600',
  },

  // Textos de instrucciones
  scanPromptText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },

  scanPromptSubtext: {
    color: '#B0B0C4',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Sección de información
  infoSection: {
    padding: 20,
  },

  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
    gap: 12,
  },

  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '500',
    lineHeight: 18,
  },
});