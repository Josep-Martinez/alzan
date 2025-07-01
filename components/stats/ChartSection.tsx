// components/stats/ChartSection.tsx
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface ChartDataPoint {
  date: string;
  value: number;
}

interface ChartSectionProps {
  title: string;
  currentValue: string;
  unit: string;
  currentDate: string;
  data: ChartDataPoint[];
  selectedMetric: 'peso' | 'grasa' | 'musculo' | 'cintura' | 'pecho' | 'brazo' | 'muslo';
  selectedPeriod: '7dias' | '30dias' | '90dias';
  goal?: number;
  onMetricChange: (metric: ChartSectionProps['selectedMetric']) => void;
  onPeriodChange: (period: ChartSectionProps['selectedPeriod']) => void;
}

/**
 * Componente de gráfica interactiva que permite:
 * - Cambiar entre diferentes métricas (peso, %grasa, %músculo, medidas corporales)
 * - Alternar entre periodos de 7, 30 y 90 días
 * - Mostrar progreso hacia objetivo
 * - Tocar puntos para ver valores específicos
 */
export function ChartSection({
  title,
  currentValue,
  unit,
  currentDate,
  data,
  selectedMetric,
  selectedPeriod,
  goal,
  onMetricChange,
  onPeriodChange
}: ChartSectionProps) {
  
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);
  
  // Configuración de métricas disponibles con sus iconos y colores
  const getMetricInfo = (metric: string) => {
    const metrics = {
      peso: { label: 'Peso', icon: 'weight', color: '#00D4AA' },
      grasa: { label: '% Grasa', icon: 'scale-bathroom', color: '#FF6B6B' },
      musculo: { label: '% Músculo', icon: 'arm-flex', color: '#A78BFA' },
      cintura: { label: 'Cintura', icon: 'ruler', color: '#FFB84D' },
      pecho: { label: 'Pecho', icon: 'ruler', color: '#4ADE80' },
      brazo: { label: 'Brazo', icon: 'ruler', color: '#F472B6' },
      muslo: { label: 'Muslo', icon: 'ruler', color: '#60A5FA' },
    };
    return metrics[metric as keyof typeof metrics];
  };

  // Calcula la diferencia con el objetivo
  const calculateGoalDifference = () => {
    if (!goal || !data.length) return null;
    const current = data[data.length - 1].value;
    const difference = current - goal;
    return difference > 0 ? `+${difference.toFixed(1)}${unit}` : `${difference.toFixed(1)}${unit}`;
  };

  // Renderiza la gráfica estilo Apple Health con puntos interactivos
  const renderChart = () => {
    if (!data.length) return <Text style={styles.noDataText}>Sin datos disponibles</Text>;

    const minValue = Math.min(...data.map(d => d.value));
    const maxValue = Math.max(...data.map(d => d.value));
    const range = maxValue - minValue || 1;

    // Crear puntos para la línea
    const chartWidth = 280;
    const chartHeight = 180;
    const padding = 20;
    const usableWidth = chartWidth - (padding * 2);
    const usableHeight = chartHeight - (padding * 2);

    // Función para formatear fechas a formato español legible
const formatDateToSpanish = (dateString: string) => {
  // Asumiendo que dateString viene como '10/6' o '1/7'
  const [day, month] = dateString.split('/');
  
  const months = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];
  
  const monthName = months[parseInt(month) - 1];
  return `${parseInt(day)} de ${monthName}`;
};

    const points = data.map((point, index) => {
      const x = (index / (data.length - 1)) * usableWidth + padding;
      const normalizedValue = (point.value - minValue) / range;
      const y = chartHeight - padding - (normalizedValue * usableHeight);
      return { x, y, value: point.value };
    });

    return (
      <View style={styles.chartContainer}>
        {/* Líneas de cuadrícula de fondo */}
        <View style={styles.gridContainer}>
          {[...Array(4)].map((_, i) => (
            <View key={i} style={styles.gridLine} />
          ))}
        </View>

        {/* Etiquetas del eje Y */}
        <View style={styles.yAxisLabels}>
          <Text style={styles.yAxisLabel}>{maxValue.toFixed(1)}</Text>
          <Text style={styles.yAxisLabel}>{((maxValue + minValue) / 2).toFixed(1)}</Text>
          <Text style={styles.yAxisLabel}>{minValue.toFixed(1)}</Text>
        </View>

        {/* Área de la gráfica */}
        <View style={styles.chartArea}>
          {/* Área rellena con gradiente */}
          <View style={styles.chartFillContainer}>
            <LinearGradient
              colors={['rgba(74, 158, 255, 0.3)', 'rgba(74, 158, 255, 0.05)']}
              style={[styles.chartFill, { height: '70%' }]}
            />
          </View>

          {/* Líneas conectoras */}
          <View style={styles.dataPointsContainer}>
            {points.map((point, index) => (
              <View key={`connector-${index}`}>
                {/* Línea conectora */}
                {index < points.length - 1 && (
                  <View
                    style={[
                      styles.connector,
                      {
                        left: point.x,
                        top: point.y,
                        width: Math.sqrt(
                          Math.pow(points[index + 1].x - point.x, 2) + 
                          Math.pow(points[index + 1].y - point.y, 2)
                        ),
                        transform: [
                          {
                            rotate: `${Math.atan2(
                              points[index + 1].y - point.y,
                              points[index + 1].x - point.x
                            )}rad`
                          }
                        ]
                      }
                    ]}
                  />
                )}
              </View>
            ))}
          </View>

          {/* Puntos de datos interactivos */}
          <View style={styles.dataPointsContainer}>
            {points.map((point, index) => (
              <Pressable
                key={`point-${index}`}
                style={[
                  styles.dataPointTouchable,
                  { 
                    left: point.x - 12,
                    top: point.y - 12,
                  }
                ]} 
                onPress={() => setSelectedPointIndex(index === selectedPointIndex ? null : index)}
              >
                <View 
                  style={[
                    styles.dataPoint,
                    index === points.length - 1 && styles.currentDataPoint,
                    selectedPointIndex === index && styles.selectedDataPoint
                  ]} 
                />
              </Pressable>
            ))}
          </View>

          {/* Tooltip para el punto seleccionado */}
          {selectedPointIndex !== null && points[selectedPointIndex] && (
            <View style={[
              styles.tooltipContainer,
              { 
                left: points[selectedPointIndex].x - 40,
                top: points[selectedPointIndex].y - 55,
              }
            ]}>
              <View style={styles.tooltip}>
              <Text style={styles.tooltipDate}>{formatDateToSpanish(data[selectedPointIndex].date)}</Text>
                <Text style={styles.tooltipValue}>
                  {points[selectedPointIndex].value.toFixed(1)}{unit}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Etiquetas del eje X - Solo algunas fechas */}
        <View style={styles.xAxisLabels}>
          {data.filter((_, index) => 
            index === 0 || 
            index === Math.floor(data.length / 2) || 
            index === data.length - 1
          ).map((point, index) => (
            <Text key={index} style={styles.xAxisLabel}>{point.date}</Text>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.chartSection}>
      <LinearGradient colors={['#2D2D5F', '#3D3D7F']} style={styles.chartGradient}>
        {/* Header con selectores de métrica */}
        <View style={styles.chartHeader}>
          <View style={styles.chartHeaderLeft}>
            <Text style={styles.cardTitle}>{title}</Text>
            
            {/* Selector de métrica */}
            <View style={styles.metricSelector}>
              {(['peso', 'grasa', 'musculo', 'cintura', 'pecho', 'brazo', 'muslo'] as const).map((metric) => {
                const metricInfo = getMetricInfo(metric);
                const isSelected = selectedMetric === metric;
                
                return (
                  <Pressable
                    key={metric}
                    style={[styles.metricOption, isSelected && styles.selectedMetricOption]}
                    onPress={() => onMetricChange(metric)}
                  >
                    <MaterialCommunityIcons 
                      name={metricInfo.icon as any} 
                      size={16} 
                      color={isSelected ? '#FFFFFF' : '#B0B0C4'} 
                    />
                    <Text style={[
                      styles.metricOptionText,
                      isSelected && styles.selectedMetricOptionText
                    ]}>
                      {metricInfo.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Selector de período */}
            <View style={styles.periodSelector}>
              <Pressable
                style={[styles.periodOption, selectedPeriod === '7dias' && styles.selectedPeriodOption]}
                onPress={() => onPeriodChange('7dias')}
              >
                <Text style={[
                  styles.periodOptionText,
                  selectedPeriod === '7dias' && styles.selectedPeriodOptionText
                ]}>
                  7 días
                </Text>
              </Pressable>
              
              <Pressable
                style={[styles.periodOption, selectedPeriod === '30dias' && styles.selectedPeriodOption]}
                onPress={() => onPeriodChange('30dias')}
              >
                <Text style={[
                  styles.periodOptionText,
                  selectedPeriod === '30dias' && styles.selectedPeriodOptionText
                ]}>
                  30 días
                </Text>
              </Pressable>

              <Pressable
                style={[styles.periodOption, selectedPeriod === '90dias' && styles.selectedPeriodOption]}
                onPress={() => onPeriodChange('90dias')}
              >
                <Text style={[
                  styles.periodOptionText,
                  selectedPeriod === '90dias' && styles.selectedPeriodOptionText
                ]}>
                  90 días
                </Text>
              </Pressable>
            </View>
          </View>
          
          <View style={styles.chartHeaderRight}>
            <Text style={styles.currentValueText}>{currentValue}</Text>
            <Text style={styles.dateText}>{currentDate}</Text>
          </View>
        </View>

        {/* Gráfica interactiva */}
        {renderChart()}

        {/* Progreso hacia objetivo */}
        {goal && (
          <View style={styles.goalProgress}>
            <Text style={styles.goalProgressText}>
              Comparar con objetivo: 
              <Text style={styles.goalDifference}> {calculateGoalDifference()}</Text>
            </Text>
          </View>
        )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  chartSection: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },

  chartGradient: {
    padding: 20,
  },

  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },

  chartHeaderLeft: {
    flex: 1,
    marginRight: 16,
  },

  chartHeaderRight: {
    alignItems: 'flex-end',
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },

  metricSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },

  metricOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },

  selectedMetricOption: {
    backgroundColor: '#00D4AA',
  },

  metricOptionText: {
    fontSize: 10,
    color: '#B0B0C4',
    fontWeight: '500',
  },

  selectedMetricOptionText: {
    color: '#FFFFFF',
  },

  periodSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 2,
    alignSelf: 'flex-start',
  },

  periodOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 40,
    alignItems: 'center',
  },

  selectedPeriodOption: {
    backgroundColor: '#4A9EFF',
  },

  periodOptionText: {
    fontSize: 14,
    color: '#B0B0C4',
    fontWeight: '600',
  },

  selectedPeriodOptionText: {
    color: '#FFFFFF',
  },

  currentValueText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  dateText: {
    fontSize: 14,
    color: '#B0B0C4',
    marginTop: 4,
  },

  chartContainer: {
    height: 220,
    marginBottom: 16,
    position: 'relative',
  },

  gridContainer: {
    position: 'absolute',
    top: 20,
    left: 50,
    right: 20,
    height: 180,
    justifyContent: 'space-between',
  },

  gridLine: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },

  yAxisLabels: {
    position: 'absolute',
    left: 0,
    top: 20,
    height: 180,
    width: 45,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },

  yAxisLabel: {
    fontSize: 12,
    color: '#B0B0C4',
    textAlign: 'right',
  },

  chartArea: {
    position: 'absolute',
    top: 20,
    left: 50,
    right: 20,
    height: 180,
  },

  chartFillContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '100%',
    justifyContent: 'flex-end',
  },

  chartFill: {
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },

  dataPointsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  dataPointTouchable: {
    position: 'absolute',
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },

  dataPoint: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4A9EFF',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#4A9EFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },

  currentDataPoint: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 3,
    backgroundColor: '#4A9EFF',
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },

  selectedDataPoint: {
    backgroundColor: '#FFB84D',
    borderColor: '#FFFFFF',
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 3,
    shadowColor: '#FFB84D',
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },

  connector: {
    position: 'absolute',
    height: 2,
    backgroundColor: '#4A9EFF',
    transformOrigin: '0 50%',
  },

  tooltipContainer: {
    position: 'absolute',
    zIndex: 10,
  },

  tooltip: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },

  tooltipDate: {
    fontSize: 12,
    color: '#B0B0C4',
    marginBottom: 2,
  },

  tooltipValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  xAxisLabels: {
    position: 'absolute',
    bottom: 0,
    left: 50,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 20,
  },

  xAxisLabel: {
    fontSize: 12,
    color: '#B0B0C4',
    textAlign: 'center',
  },

  goalProgress: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 16,
  },

  goalProgressText: {
    fontSize: 14,
    color: '#B0B0C4',
  },

  goalDifference: {
    color: '#FFB84D',
    fontWeight: '600',
  },

  noDataText: {
    fontSize: 16,
    color: '#B0B0C4',
    textAlign: 'center',
    marginVertical: 40,
  },
});