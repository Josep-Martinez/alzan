import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { HealthScreenNavigationProp } from '../../../types/navigation.types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { typography } from '../../../theme';
import { ChevronRight, Plus } from 'lucide-react-native';
import { useMeasurements } from '../hooks/useMeasurements';
import { useHealthStyles } from '../../../hooks/useHealthStyles';
import { LinearGradient } from 'expo-linear-gradient';
import { MeasurementType } from '../../../types/requests.types';
import { useTranslation } from 'react-i18next';

type Measurements = { key: MeasurementType; label: string };

const MEASUREMENT_TYPES: Measurements[] = [
  { key: 'abdomen', label: 'Abdomen' },
  { key: 'hips', label: 'Cadera' },
  { key: 'chest', label: 'Pecho' },
  { key: 'arm', label: 'Brazo' },
  { key: 'thigh', label: 'Muslo' },
];

export const MeasurementsList = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<HealthScreenNavigationProp>();
  const { data: allMeasurements } = useMeasurements();
  const { styles: dynamicStyles, colors: themeColors } = useHealthStyles();

  const getLatestValue = (type: MeasurementType) => {
    if (!allMeasurements) return null;
    const typeMeas = allMeasurements.filter(m => m.measurement_type === type);
    if (typeMeas.length === 0) return null;
    // Sort DESC
    return typeMeas.sort((a, b) => new Date(b.measured_at).getTime() - new Date(a.measured_at).getTime())[0];
  };

  const renderItem = ({ item }: { item: Measurements }) => {
    const latest = getLatestValue(item.key);
    return (
      <TouchableOpacity
        style={[styles.item, dynamicStyles.glassCard]}
        onPress={() => navigation.navigate('MeasurementDetail', { type: item.key, label: item.label })}
      >
        <View>
          <Text style={[styles.label, dynamicStyles.title]}>{item.label}</Text>
          <Text style={[styles.value, dynamicStyles.subtitle]}>{latest ? `${latest.value_cm} cm` : '--'}</Text>
          {latest && (
            <Text style={[styles.date, dynamicStyles.subtitle]}>
              {new Date(latest.measured_at).toLocaleDateString()}
            </Text>
          )}
        </View>
        <ChevronRight size={20} color={themeColors.textSecondary} />
      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient colors={dynamicStyles.gradientColors} style={styles.safeArea}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={[styles.backButtonText, { color: themeColors.primary }]}>{t('common.back')}</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, dynamicStyles.title]}>{t('health.measurements')}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('MeasurementAdd')} style={styles.addButton}>
            <Plus size={24} color={themeColors.primary} />
          </TouchableOpacity>
        </View>

        <FlatList
          data={MEASUREMENT_TYPES}
          renderItem={renderItem}
          keyExtractor={item => item.key}
          contentContainerStyle={styles.content}
        />
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    ...typography.body,
  },
  headerTitle: {
    ...typography.h2,
  },
  addButton: {
    padding: 8,
  },
  content: {
    padding: 20,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  label: {
    ...typography.body,
    fontWeight: '600',
  },
  value: {
    ...typography.body,
    marginTop: 4,
  },
  date: {
    ...typography.caption,
    marginTop: 2,
  },
});
