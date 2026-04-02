import React from 'react';
import { View, StyleSheet, ViewStyle, ViewProps, StyleProp } from 'react-native';
import { borderRadius, spacing } from '../theme';
import { LiquidBackground } from './LiquidBackground';

interface GlassCardProps extends ViewProps {
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

export const GlassCard: React.FC<GlassCardProps> = ({ style, children, ...props }) => {
  return (
    <View>
      <LiquidBackground style={[styles.card, style, styles.shadowWrapper]} {...props}>
        {children}
      </LiquidBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  shadowWrapper: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  card: {
    borderRadius: borderRadius.m,
    padding: spacing.m,
    overflow: 'hidden',
  },
});
