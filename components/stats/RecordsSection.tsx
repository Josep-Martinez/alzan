// components/stats/RecordsSection.tsx
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface PersonalRecord {
  id: string;
  exercise: string;
  weight: number;
  unit: string;
  date: string;
  improvement?: number;
}

interface RecordsSectionProps {
  records: PersonalRecord[];
  onRecordPress?: (record: PersonalRecord) => void;
  onViewAllPress?: () => void;
}

/**
 * Componente compacto que muestra resumen de récords personales
 * - Vista reducida con solo estadística general
 * - Botón para navegar a vista completa de récords
 * - Estado vacío cuando no hay récords
 */
export function RecordsSection({ 
  records, 
  onRecordPress,
  onViewAllPress 
}: RecordsSectionProps) {
  
  if (records.length === 0) {
    return (
      <View style={styles.recordsSection}>
        <View style={styles.recordsHeader}>
          <Text style={styles.sectionTitle}>Récords Personales</Text>
        </View>
        
        <View style={styles.emptyRecords}>
          <MaterialCommunityIcons name="trophy-outline" size={32} color="#6B7280" />
          <Text style={styles.emptyRecordsText}>Sin récords aún</Text>
          <Text style={styles.emptyRecordsSubtext}>
            ¡Entrena para establecer tus primeros récords!
          </Text>
        </View>
      </View>
    );
  }

  // Estadísticas de récords
  const totalRecords = records.length;
  const recentRecords = records.filter(record => {
    const recordDate = new Date(record.date);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return recordDate >= thirtyDaysAgo;
  }).length;

  return (
    <View style={styles.recordsSection}>
      <View style={styles.recordsHeader}>
        <Text style={styles.sectionTitle}>Récords Personales</Text>
        {onViewAllPress && (
          <Pressable onPress={onViewAllPress} style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>Ver todos</Text>
            <MaterialCommunityIcons name="chevron-right" size={16} color="#00D4AA" />
          </Pressable>
        )}
      </View>
      
      {/* Tarjeta compacta con estadísticas */}
      <Pressable 
        style={styles.compactRecordCard}
        onPress={onViewAllPress}
        android_ripple={{ color: 'rgba(255, 255, 255, 0.1)' }}
      >
        <LinearGradient
          colors={['#2D2D5F', '#3D3D7F']}
          style={styles.compactRecordGradient}
        >
          <View style={styles.recordStatsContainer}>
            <MaterialCommunityIcons name="trophy" size={32} color="#FFB84D" />
            
            <View style={styles.recordStats}>
              <Text style={styles.totalRecordsText}>{totalRecords}</Text>
              <Text style={styles.recordsLabel}>récords totales</Text>
            </View>
            
            <View style={styles.recordStatsDivider} />
            
            <View style={styles.recordStats}>
              <Text style={styles.recentRecordsText}>{recentRecords}</Text>
              <Text style={styles.recordsLabel}>este mes</Text>
            </View>
          </View>
          
          <MaterialCommunityIcons name="chevron-right" size={20} color="#B0B0C4" />
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  recordsSection: {
    marginBottom: 20,
  },

  recordsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },

  viewAllText: {
    fontSize: 14,
    color: '#00D4AA',
    fontWeight: '600',
  },

  emptyRecords: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
  },

  emptyRecordsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 12,
    textAlign: 'center',
  },

  emptyRecordsSubtext: {
    fontSize: 14,
    color: '#B0B0C4',
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Estilos para la nueva tarjeta compacta
  compactRecordCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },

  compactRecordGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },

  recordStatsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  recordStats: {
    alignItems: 'center',
    marginLeft: 20,
  },

  totalRecordsText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },

  recentRecordsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#00D4AA',
    marginBottom: 2,
  },

  recordsLabel: {
    fontSize: 12,
    color: '#B0B0C4',
    textAlign: 'center',
  },

  recordStatsDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 20,
  },
});