// components/stats/MetricCard.tsx
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface MetricCardProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: string;
  unit: string;
  subtitle?: string;
  progress?: number;
  goal?: number;
  color: string;
  isAvailable?: boolean; // Para ocultar métricas no disponibles
}

/**
 * Componente para mostrar una métrica individual en formato tarjeta
 * - Muestra icono, valor, unidad y progreso hacia objetivo
 * - Se oculta automáticamente si isAvailable es false
 * - Calcula progreso visual hacia el objetivo si se proporciona
 */
export function MetricCard({ 
  icon, 
  label, 
  value, 
  unit, 
  subtitle, 
  progress, 
  goal, 
  color,
  isAvailable = true
}: MetricCardProps) {
  // No renderizar si la métrica no está disponible
  if (!isAvailable) return null;

  return (
    <View style={styles.metricCard}>
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.02)']}
        style={styles.metricGradient}
      >
        <MaterialCommunityIcons name={icon} size={28} color={color} />
        
        <View style={styles.metricContent}>
          <Text style={styles.metricValue}>
            {value}<Text style={styles.metricUnit}>{unit}</Text>
          </Text>
          <Text style={styles.metricLabel}>{label}</Text>
          
          {subtitle && (
            <Text style={[styles.metricSubtitle, { color }]}>{subtitle}</Text>
          )}
          
          {progress !== undefined && goal && (
            <>
              <View style={styles.progressContainer}>
                <View style={styles.progressBg}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${Math.min(progress, 100)}%`, backgroundColor: color }
                    ]} 
                  />
                </View>
              </View>
              <Text style={styles.goalText}>Meta: {goal}{unit}</Text>
            </>
          )}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  metricCard: {
    width: '48%',
    borderRadius: 16,
    overflow: 'hidden',
  },

  metricGradient: {
    padding: 16,
    alignItems: 'center',
  },

  metricContent: {
    alignItems: 'center',
    marginTop: 8,
  },

  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },

  metricUnit: {
    fontSize: 16,
    fontWeight: '400',
    color: '#B0B0C4',
  },

  metricLabel: {
    fontSize: 12,
    color: '#B0B0C4',
    textAlign: 'center',
    marginBottom: 4,
  },

  metricSubtitle: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 8,
  },

  progressContainer: {
    width: '100%',
    marginBottom: 4,
  },

  progressBg: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
  },

  progressFill: {
    height: 4,
    borderRadius: 2,
  },

  goalText: {
    fontSize: 10,
    color: '#B0B0C4',
  },
});