// components/stats/AddMeasurementModal.tsx
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Alert, Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

interface MeasurementData {
  peso?: number;
  altura?: number;
  grasa?: number;
  musculo?: number;
  cintura?: number;
  pecho?: number;
  brazo?: number;
  muslo?: number;
  agua?: number;
}

interface AddMeasurementModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: MeasurementData) => void;
  currentData?: MeasurementData;
}

/**
 * Modal para añadir/editar mediciones corporales
 * - Peso es obligatorio, resto de métricas opcionales
 * - Validación de rangos razonables
 * - Soporte para datos automáticos de apps externas
 * - Diseño preparado para integración futura
 */
export function AddMeasurementModal({
  visible,
  onClose,
  onSave,
  currentData
}: AddMeasurementModalProps) {
  
  const [measurements, setMeasurements] = useState<MeasurementData>(currentData || {});
  
  // Configuración de campos de medición con validaciones
  const measurementFields = [
    { key: 'peso' as keyof MeasurementData, label: 'Peso', unit: 'kg', required: true, icon: 'weight' },
    { key: 'altura' as keyof MeasurementData, label: 'Altura', unit: 'cm', required: false, icon: 'ruler' },
    { key: 'grasa' as keyof MeasurementData, label: '% Grasa Corporal', unit: '%', required: false, icon: 'scale-bathroom' },
    { key: 'musculo' as keyof MeasurementData, label: '% Masa Muscular', unit: '%', required: false, icon: 'arm-flex' },
    { key: 'agua' as keyof MeasurementData, label: '% Agua Corporal', unit: '%', required: false, icon: 'water' },
    { key: 'cintura' as keyof MeasurementData, label: 'Cintura', unit: 'cm', required: false, icon: 'tape-measure' },
    { key: 'pecho' as keyof MeasurementData, label: 'Pecho', unit: 'cm', required: false, icon: 'tape-measure' },
    { key: 'brazo' as keyof MeasurementData, label: 'Brazo', unit: 'cm', required: false, icon: 'tape-measure' },
    { key: 'muslo' as keyof MeasurementData, label: 'Muslo', unit: 'cm', required: false, icon: 'tape-measure' },
  ];

  const updateMeasurement = (key: keyof MeasurementData, value: string) => {
    const numericValue = value === '' ? undefined : parseFloat(value);
    setMeasurements(prev => ({
      ...prev,
      [key]: numericValue
    }));
  };

  const handleSave = () => {
    // Validar que al menos el peso esté presente
    if (!measurements.peso) {
      Alert.alert('Error', 'El peso es obligatorio');
      return;
    }

    // Validar rangos razonables para evitar errores de entrada
    if (measurements.peso && (measurements.peso < 30 || measurements.peso > 300)) {
      Alert.alert('Error', 'El peso debe estar entre 30 y 300 kg');
      return;
    }

    if (measurements.altura && (measurements.altura < 100 || measurements.altura > 250)) {
      Alert.alert('Error', 'La altura debe estar entre 100 y 250 cm');
      return;
    }

    if (measurements.grasa && (measurements.grasa < 3 || measurements.grasa > 50)) {
      Alert.alert('Error', 'El porcentaje de grasa debe estar entre 3% y 50%');
      return;
    }

    if (measurements.musculo && (measurements.musculo < 20 || measurements.musculo > 60)) {
      Alert.alert('Error', 'El porcentaje de músculo debe estar entre 20% y 60%');
      return;
    }

    if (measurements.agua && (measurements.agua < 40 || measurements.agua > 80)) {
      Alert.alert('Error', 'El porcentaje de agua debe estar entre 40% y 80%');
      return;
    }

    onSave(measurements);
    setMeasurements({});
    onClose();
  };

  const handleClose = () => {
    setMeasurements(currentData || {});
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
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Añadir Medición</Text>
            <Pressable onPress={handleClose} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={24} color="#FFFFFF" />
            </Pressable>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalSubtitle}>
              Registra tus métricas corporales. Solo el peso es obligatorio.
            </Text>

            {/* Campos de medición */}
            <View style={styles.measurementsContainer}>
              {measurementFields.map((field) => (
                <View key={field.key} style={styles.measurementField}>
                  <View style={styles.fieldHeader}>
                    <View style={styles.fieldLabelContainer}>
                      <MaterialCommunityIcons 
                        name={field.icon as any} 
                        size={20} 
                        color="#00D4AA" 
                      />
                      <Text style={styles.fieldLabel}>
                        {field.label}
                        {field.required && <Text style={styles.requiredAsterisk}> *</Text>}
                      </Text>
                    </View>
                    <Text style={styles.fieldUnit}>{field.unit}</Text>
                  </View>
                  
                  <TextInput
                    style={[
                      styles.measurementInput,
                      field.required && !measurements[field.key] && styles.inputError
                    ]}
                    value={measurements[field.key]?.toString() || ''}
                    onChangeText={(value) => updateMeasurement(field.key, value)}
                    placeholder={`Ingresa tu ${field.label.toLowerCase()}`}
                    placeholderTextColor="#6B7280"
                    keyboardType="decimal-pad"
                  />
                </View>
              ))}
            </View>

            {/* Información adicional */}
            <View style={styles.infoSection}>
              <MaterialCommunityIcons name="information" size={20} color="#6366F1" />
              <Text style={styles.infoText}>
                Las métricas opcionales te ayudarán a tener un seguimiento más completo de tu progreso.
                Puedes completarlas gradualmente.
              </Text>
            </View>

            {/* Nota sobre integración automática */}
            <View style={styles.autoImportSection}>
              <MaterialCommunityIcons name="sync" size={20} color="#FFB84D" />
              <Text style={styles.autoImportText}>
                En el futuro podrás sincronizar automáticamente desde apps como Apple Health o Google Fit.
              </Text>
            </View>
          </ScrollView>

          {/* Actions */}
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
                styles.saveButton,
                !measurements.peso && styles.disabledButton
              ]}
              onPress={handleSave}
              disabled={!measurements.peso}
            >
              <MaterialCommunityIcons name="content-save" size={18} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Guardar</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </Modal>
  );
}

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
    borderRadius: 8,
  },

  modalContent: {
    flex: 1,
    padding: 20,
  },

  modalSubtitle: {
    fontSize: 16,
    color: '#B0B0C4',
    marginBottom: 24,
    lineHeight: 22,
  },

  measurementsContainer: {
    gap: 20,
  },

  measurementField: {
    gap: 8,
  },

  fieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  fieldLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  requiredAsterisk: {
    color: '#FF6B6B',
  },

  fieldUnit: {
    fontSize: 14,
    color: '#B0B0C4',
    fontWeight: '500',
  },

  measurementInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },

  inputError: {
    borderColor: '#FF6B6B',
  },

  infoSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginTop: 24,
  },

  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#6366F1',
    lineHeight: 20,
  },

  autoImportSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 184, 77, 0.1)',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginTop: 12,
  },

  autoImportText: {
    flex: 1,
    fontSize: 14,
    color: '#FFB84D',
    lineHeight: 20,
  },

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

  saveButton: {
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