// components/AddFoodModal.tsx
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

// ⬇️ nuestro nuevo servicio IA
import {
  analyzeImage,
  analyzeText,
  NutritionData,
} from '../services/FoodAnalysisService';

// ⚙️ props
interface Props {
  visible:    boolean;
  onAdd:      (name: string, qty: string, nutrition: NutritionData) => void;
  onClose:    () => void;
}

export default function AddFoodModal({ visible, onAdd, onClose }: Props) {
  // ---------- estado del componente ----------
  const [foodDesc,      setFoodDesc]      = useState('');        // texto ("100 g arroz")
  const [photoUri,      setPhotoUri]      = useState<string>();  // uri de la foto
  const [nutrition,     setNutrition]     = useState<NutritionData | null>(null);
  const [isAnalyzing,   setIsAnalyzing]   = useState(false);

  /*----------------------------------------------------------
   *  FUNCIÓN: lanzar cámara y analizar imagen con Spoonacular
   *---------------------------------------------------------*/
  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permiso denegado', 'Necesitamos acceso a la cámara');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
      await analyzePhoto(result.assets[0].uri);
    }
  };

  /*----------------------------------------------------------
   *  FUNCIÓN: coger imagen de la galería
   *---------------------------------------------------------*/
  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permiso denegado', 'Necesitamos acceder a la galería');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.8,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
      await analyzePhoto(result.assets[0].uri);
    }
  };

  /*----------------------------------------------------------
   *  FUNCIÓN: analiza la foto con Spoonacular
   *---------------------------------------------------------*/
  const analyzePhoto = async (uri: string) => {
    try {
      setIsAnalyzing(true);
      const data = await analyzeImage(uri); // 🚀 Spoonacular
      setNutrition(data);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'No se pudo analizar la imagen');
      setNutrition(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  /*----------------------------------------------------------
   *  FUNCIÓN: analiza el texto con Edamam
   *---------------------------------------------------------*/
  const analyzeFoodText = async () => {
    if (!foodDesc.trim()) return;
    try {
      setIsAnalyzing(true);
      const data = await analyzeText(foodDesc); // 🚀 Edamam
      setNutrition(data);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'No se pudo analizar el texto');
      setNutrition(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  /*----------------------------------------------------------
   *  FUNCIÓN: confirmar y devolver al padre
   *---------------------------------------------------------*/
  const handleAdd = async () => {
    // Si aún no tenemos macros, intenta calcular texto antes de salir
    if (!nutrition) await analyzeFoodText();
    if (!nutrition) {
      Alert.alert('Faltan datos', 'Introduce texto o foto primero');
      return;
    }
    onAdd(foodDesc || 'Sin nombre', '1 porción', nutrition);
    resetAndClose();
  };

  /*----------------------------------------------------------*/
  const resetAndClose = () => {
    setFoodDesc('');
    setPhotoUri(undefined);
    setNutrition(null);
    onClose();
  };

  /*=========================  UI  =========================*/
  return (
    <Modal visible={visible} transparent animationType="slide">
      <SafeAreaView style={styles.container}>
        {/* Cabecera */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Añadir alimento</Text>
          <Pressable onPress={resetAndClose}>
            <MaterialCommunityIcons name="close" size={28} color="#fff" />
          </Pressable>
        </View>

        {/* Contenido desplazable */}
        <ScrollView contentContainerStyle={styles.content}>
          {/* Entrada de texto */}
          <View style={styles.block}>
            <Text style={styles.label}>{`Descripción (ej. 100 g arroz)`}</Text>
            <TextInput
              placeholder="Escribe cantidad y alimento"
              value={foodDesc}
              onChangeText={setFoodDesc}
              style={styles.input}
            />
            <Pressable style={styles.analyzeBtn} onPress={analyzeFoodText}>
              <Text style={styles.analyzeTxt}>Analizar texto</Text>
            </Pressable>
          </View>

          {/* Foto */}
          <View style={styles.block}>
            <Text style={styles.label}>Foto opcional</Text>
            {photoUri && <Image source={{ uri: photoUri }} style={styles.photo} />}
            <View style={styles.photoActions}>
              <Pressable onPress={takePhoto}>
                <MaterialCommunityIcons name="camera" size={32} color="#00D4AA" />
              </Pressable>
              <Pressable onPress={pickImage}>
                <MaterialCommunityIcons name="image" size={32} color="#00D4AA" />
              </Pressable>
            </View>
          </View>

          {/* Loader / Resultado */}
          {isAnalyzing && (
            <ActivityIndicator size="large" color="#00D4AA" style={{ marginVertical: 20 }} />
          )}

          {nutrition && !isAnalyzing && (
            <View style={styles.resultBox}>
              <Text style={styles.resultLine}>Calorías: {nutrition.calories} kcal</Text>
              <Text style={styles.resultLine}>Proteína: {nutrition.protein} g</Text>
              <Text style={styles.resultLine}>Carbs:    {nutrition.carbs} g</Text>
              <Text style={styles.resultLine}>Grasas:   {nutrition.fats} g</Text>
            </View>
          )}
        </ScrollView>

        {/* Botón final */}
        <Pressable style={styles.addBtn} onPress={handleAdd}>
          <LinearGradient
            colors={['#00D4AA', '#01BEBE']}
            style={styles.addBtnGradient}
          >
            <Text style={styles.addBtnText}>Añadir</Text>
          </LinearGradient>
        </Pressable>
      </SafeAreaView>
    </Modal>
  );
}

/* ---------------- estilos ---------------- */
const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' },
  header:      { flexDirection: 'row', justifyContent: 'space-between', padding: 16, backgroundColor: '#1F2937' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '600' },
  content:     { padding: 20 },
  block:       { marginBottom: 24 },
  label:       { color: '#D1D5DB', marginBottom: 8 },
  input:       { backgroundColor: '#fff', padding: 12, borderRadius: 8 },
  analyzeBtn:  { alignSelf: 'flex-start', marginTop: 8, backgroundColor: '#00D4AA', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  analyzeTxt:  { color: '#fff' },
  photo:       { width: '100%', height: 180, borderRadius: 10, marginTop: 8 },
  photoActions:{ flexDirection: 'row', gap: 20, marginTop: 12 },
  resultBox:   { backgroundColor: '#1F2937', padding: 16, borderRadius: 10 },
  resultLine:  { color: '#fff' },
  addBtn:      { margin: 20 },
  addBtnGradient:{ paddingVertical: 14, borderRadius: 30, alignItems: 'center' },
  addBtnText:  { color: '#fff', fontSize: 16, fontWeight: '700' },
});