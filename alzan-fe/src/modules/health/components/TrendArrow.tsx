import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react-native';
import { colors } from '../../../theme';

interface TrendArrowProps {
  trend: 'increasing' | 'decreasing' | 'stable';
  size?: number;
}

export const TrendArrow: React.FC<TrendArrowProps> = ({ trend, size = 16 }) => {
  switch (trend) {
    case 'increasing':
      return <ArrowUpRight size={size} color={colors.danger} />;
    case 'decreasing':
      return <ArrowDownRight size={size} color={colors.success} />;
    case 'stable':
      return <Minus size={size} color={colors.textSecondary} />;
  }
  return null;
};
