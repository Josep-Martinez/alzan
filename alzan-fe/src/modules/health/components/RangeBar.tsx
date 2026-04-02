import React from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent } from 'react-native';
import { colors, spacing } from '../../../theme';

export type Segment = {
  to: number;
  color: string;
  label?: string;
};

type RangeBarProps = {
  value: number;
  min: number;
  max: number;
  segments: Segment[];

  label?: string;
  hideLegend?: boolean;
  showCutoffs?: boolean;
  unit?: string;
  formatCutoff?: (value: number) => string;

  /**
   * If true, all segments will have equal visual width regardless of numeric range.
   * This is the standard for body composition bars (Apple Health style).
   * Default: true
   */
  equalWidths?: boolean;
};

export const RangeBar: React.FC<RangeBarProps> = ({
  value,
  min,
  max,
  segments,
  label,
  hideLegend,
  showCutoffs,
  unit,
  formatCutoff,
  equalWidths = true, // Default to equal widths
}) => {
  const [barWidth, setBarWidth] = React.useState(0);

  const onLayout = (e: LayoutChangeEvent) => {
    setBarWidth(e.nativeEvent.layout.width);
  };

  const clampedValue = Math.max(min, Math.min(value, max));

  // Find which segment the value falls into
  const getSegmentIndex = () => {
    let prevLimit = min;
    for (let i = 0; i < segments.length; i++) {
      if (clampedValue >= prevLimit && clampedValue <= segments[i].to) {
        return i;
      }
      prevLimit = segments[i].to;
    }
    return segments.length - 1;
  };

  const activeSegmentIndex = getSegmentIndex();

  /**
   * Calculate thumb position based on equal or proportional widths
   */
  const getThumbPosition = () => {
    if (!barWidth) return 0;

    if (equalWidths) {
      // With equal widths, each segment takes 100/n % of the bar
      const segmentWidth = barWidth / segments.length;
      const activeIdx = activeSegmentIndex;

      // Get the bounds of the active segment
      const prevTo = activeIdx === 0 ? min : segments[activeIdx - 1].to;
      const segTo = segments[activeIdx].to;

      // Calculate relative position within the segment (0-1)
      const segmentRange = segTo - prevTo;
      const positionInSegment = segmentRange > 0 ? (clampedValue - prevTo) / segmentRange : 0.5;

      // Calculate absolute position: start of segment + position within segment
      const segmentStart = activeIdx * segmentWidth;
      const thumbPos = segmentStart + positionInSegment * segmentWidth;

      // Clamp to bar bounds (accounting for thumb size of 22px)
      return Math.min(Math.max(thumbPos - 11, 0), barWidth - 22);
    } else {
      // Proportional positioning
      const percentage = ((clampedValue - min) / (max - min)) * 100;
      return Math.min(Math.max((percentage / 100) * barWidth - 11, 0), barWidth - 22);
    }
  };

  /**
   * Get segment width as a percentage string
   */
  const getSegmentWidth = (index: number): `${number}%` => {
    if (equalWidths) {
      return `${100 / segments.length}%`;
    } else {
      const prevTo = index === 0 ? min : segments[index - 1].to;
      const segWidthPercent = Math.max(0, ((segments[index].to - prevTo) / (max - min)) * 100);
      return `${segWidthPercent}%`;
    }
  };

  return (
    <View style={styles.container}>
      {!!label && (
        <View style={styles.header}>
          <Text style={styles.label}>{label}</Text>
        </View>
      )}

      {showCutoffs && barWidth > 0 && (
        <View style={styles.cutoffsContainer}>
          {segments.slice(0, -1).map((seg, index) => {
            // Position cutoffs based on segment widths
            const posPercent = equalWidths
              ? ((index + 1) * 100) / segments.length
              : ((seg.to - min) / (max - min)) * 100;

            const cutoffText = formatCutoff ? formatCutoff(seg.to) : `${seg.to}${unit || ''}`;

            return (
              <Text
                key={`cutoff-${index}`}
                style={[styles.cutoffText, { left: `${posPercent}%`, transform: [{ translateX: -15 }] }]}
              >
                {cutoffText}
              </Text>
            );
          })}
        </View>
      )}

      <View style={styles.barContainer} onLayout={onLayout}>
        <View style={styles.barBackground}>
          {segments.map((seg, index) => (
            <View
              key={index}
              style={[
                styles.segment,
                {
                  width: getSegmentWidth(index),
                  backgroundColor: seg.color,
                },
                index === 0 && styles.firstSeg,
                index === segments.length - 1 && styles.lastSeg,
              ]}
            />
          ))}
        </View>

        {barWidth > 0 && (
          <View
            style={[
              styles.thumb,
              {
                left: getThumbPosition(),
                borderColor: segments[activeSegmentIndex]?.color || colors.primary,
              },
            ]}
          />
        )}
      </View>

      {!hideLegend && (
        <View style={styles.legendContainer}>
          {segments.map((seg, index) => (
            <View key={index} style={[styles.legendItem, { width: getSegmentWidth(index) }]}>
              <Text style={styles.legendLabel}>{seg.label || ''}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.s,
  },
  header: {
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  barContainer: {
    position: 'relative',
    height: 28,
    justifyContent: 'center',
    marginTop: 4,
  },
  barBackground: {
    flexDirection: 'row',
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center',
  },
  segment: {
    height: '100%',
    opacity: 0.95,
  },
  firstSeg: {
    borderTopLeftRadius: 5,
    borderBottomLeftRadius: 5,
  },
  lastSeg: {
    borderTopRightRadius: 5,
    borderBottomRightRadius: 5,
  },
  thumb: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 2,
    elevation: 3,
  },
  legendContainer: {
    flexDirection: 'row',
    marginTop: spacing.s,
    width: '100%',
  },
  legendItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  cutoffsContainer: {
    position: 'absolute',
    top: -18,
    left: 0,
    right: 0,
    height: 20,
  },
  cutoffText: {
    position: 'absolute',
    fontSize: 11,
    color: colors.textSecondary,
    width: 40,
    textAlign: 'center',
  },
});
