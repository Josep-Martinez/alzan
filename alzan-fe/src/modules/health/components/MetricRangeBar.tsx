import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getSegmentsForMetric } from '../constants/metricRanges';
import { MaleOrFemale } from '../../../types/requests.types';
import { useHealthStyles } from '../../../hooks/useHealthStyles';

interface MetricRangeBarProps {
  value: number;
  metricKey: string;
  age: number;
  sex: MaleOrFemale;
  height?: number; // Optional height of the bar
}

export const MetricRangeBar: React.FC<MetricRangeBarProps> = ({ value, metricKey, age, sex, height = 12 }) => {
  const { colors: themeColors } = useHealthStyles();

  const segments = useMemo(() => {
    return getSegmentsForMetric(metricKey, sex, age);
  }, [metricKey, sex, age]);

  if (!segments || segments.length === 0) {
    return null;
  }

  // Determine which segment the value falls into and its global percentage
  const calculatePosition = (): number => {
    // Find the segment index
    let segmentIndex = -1;

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];

      // Check if value fits in this segment
      // Treating null min as -Infinity and null max as +Infinity
      const aboveMin = seg.min === null || value >= seg.min;
      const belowMax = seg.max === null || value <= seg.max;

      if (aboveMin && belowMax) {
        segmentIndex = i;
        break;
      }
    }

    // Clamp if out of bounds (should cover most cases with null checks, but just in case)
    if (segmentIndex === -1) {
      if (value < (segments[0].max || 0)) segmentIndex = 0;
      else segmentIndex = segments.length - 1;
    }

    const currentSegment = segments[segmentIndex];
    const segmentWidth = 100 / segments.length; // Each segment takes equal visual width

    // Calculate percentage within the segment
    let positionInSegment = 0.5; // Default center

    if (currentSegment.min === null) {
      // First segment (open ended low)
      // Visual logic: Define a visual "range" for the open end.
      // ex: if max is 18.5, let's say visual range covers down to 13.5 (difference of 5)
      // This prevents the marker from disappearing to the left for standard low values
      const safeMax = currentSegment.max || 20;
      const visualRange = 10; // arbitrary visual span
      const diff = safeMax - value; // larger diff = more left
      positionInSegment = 1 - Math.min(diff / visualRange, 1);
    } else if (currentSegment.max === null) {
      // Last segment (open ended high)
      const safeMin = currentSegment.min || 30;
      const visualRange = 20; // arbitrary visual span
      const diff = value - safeMin;
      positionInSegment = Math.min(diff / visualRange, 1);
      // Don't let it hit right edge exactly, keep it 90% max
      positionInSegment = Math.min(positionInSegment, 0.9);
    } else {
      // Middle segments (definite range)
      const range = currentSegment.max - currentSegment.min;
      if (range > 0) {
        positionInSegment = (value - currentSegment.min) / range;
      }
    }

    // Clamp internal position 0-1
    positionInSegment = Math.max(0, Math.min(1, positionInSegment));

    // Global position = Start of segment + (width of segment * internal position)
    return segmentIndex * segmentWidth + positionInSegment * segmentWidth;
  };

  const markerPosition = calculatePosition();
  const formatCutoffValue = (cutoff: number) => {
    return Number.isInteger(cutoff) ? cutoff.toString() : cutoff.toFixed(1);
  };

  return (
    <View style={styles.container}>
      {/* Value Marker */}
      <View style={[styles.markerContainer, { left: `${markerPosition}%` }]}>
        <Text style={[styles.valueText, { color: themeColors.textPrimary }]}>{value.toFixed(1)}</Text>
        <View style={[styles.triangle, { borderTopColor: themeColors.textPrimary }]} />
      </View>

      <View style={styles.barWrapper}>
        {/* Bar Segments */}
        <View style={[styles.barContainer, { height }]}>
          {segments.map((seg, index) => (
            <View
              key={index}
              style={[
                styles.segment,
                {
                  backgroundColor: seg.color,
                  borderTopLeftRadius: index === 0 ? height / 2 : 0,
                  borderBottomLeftRadius: index === 0 ? height / 2 : 0,
                  borderTopRightRadius: index === segments.length - 1 ? height / 2 : 0,
                  borderBottomRightRadius: index === segments.length - 1 ? height / 2 : 0,
                },
              ]}
            />
          ))}
        </View>

        {segments.slice(0, -1).map((seg, index) => {
          const cutoffPosition = ((index + 1) * 100) / segments.length;

          return (
            <React.Fragment key={`cutoff-${index}`}>
              <View
                style={[
                  styles.cutoffDivider,
                  {
                    left: `${cutoffPosition}%`,
                    height: height + 8,
                    backgroundColor: themeColors.background,
                  },
                ]}
              />
              {seg.max !== null && (
                <Text
                  style={[
                    styles.cutoffText,
                    {
                      left: `${cutoffPosition}%`,
                      color: themeColors.textSecondary,
                    },
                  ]}
                >
                  {formatCutoffValue(seg.max)}
                </Text>
              )}
            </React.Fragment>
          );
        })}
      </View>

      {/* Labels */}
      <View style={styles.labelsContainer}>
        {segments.map((seg, index) => (
          <View key={index} style={styles.labelWrapper}>
            <Text
              style={[
                styles.labelText,
                {
                  color:
                    index === 0 || index === segments.length - 1 ? themeColors.textSecondary : themeColors.textPrimary,
                },
              ]}
              numberOfLines={1}
            >
              {seg.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 10,
    paddingHorizontal: 10,
  },
  markerContainer: {
    position: 'absolute',
    top: -24,
    alignItems: 'center',
    transform: [{ translateX: -10 }], // Center visually (approx width 20)
    zIndex: 10,
  },
  valueText: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  triangle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#1F2937',
  },
  barContainer: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: '#E5E7EB',
    borderRadius: 999,
    overflow: 'hidden',
  },
  barWrapper: {
    position: 'relative',
    marginTop: 2,
  },
  segment: {
    flex: 1,
    height: '100%',
    borderRightWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  cutoffDivider: {
    position: 'absolute',
    top: -4,
    width: 2,
    transform: [{ translateX: -1 }],
    borderRadius: 999,
    opacity: 0.9,
  },
  cutoffText: {
    position: 'absolute',
    top: 18,
    fontSize: 9,
    fontWeight: '600',
    transform: [{ translateX: -10 }],
    width: 24,
    textAlign: 'center',
  },
  labelsContainer: {
    flexDirection: 'row',
    marginTop: 18,
    justifyContent: 'space-between',
  },
  labelWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  labelText: {
    fontSize: 10,
    textAlign: 'center',
    opacity: 0.8,
  },
});
