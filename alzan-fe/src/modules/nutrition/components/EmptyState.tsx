import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Info } from 'lucide-react-native';
import { useNutritionStyles } from '../../../hooks/useNutritionStyles';

interface EmptyStateProps {
  message: string;
  subMessage?: string;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ message, subMessage, icon }) => {
  const { colors } = useNutritionStyles();

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>{icon || <Info size={32} color="#CCC" />}</View>
      <Text style={[styles.text, { color: colors.textPrimary }]}>{message}</Text>
      {subMessage && <Text style={[styles.subText, { color: colors.textSecondary }]}>{subMessage}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    opacity: 0.7,
  },
  iconContainer: {
    marginBottom: 16,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  subText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 4,
  },
});
