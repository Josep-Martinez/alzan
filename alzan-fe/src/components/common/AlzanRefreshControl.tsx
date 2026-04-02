import React from 'react';
import { RefreshControl as RNRefreshControl } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface AlzanRefreshControlProps {
  refreshing: boolean;
  onRefresh: () => void;
  tintColor?: string;
}

/**
 * Reusable RefreshControl component with Alzan styling
 * Use this in ScrollView/FlatList for consistent pull-to-refresh behavior
 * Automatically adapts to dark/light mode - white in dark mode, primary blue in light mode
 */
export const AlzanRefreshControl: React.FC<
  AlzanRefreshControlProps & React.ComponentProps<typeof RNRefreshControl>
> = ({ refreshing, onRefresh, tintColor, ...props }) => {
  const { colors, isDark } = useTheme();

  // Debugging: Check if theme is correctly detected
  // console.log('[AlzanRefreshControl] isDark:', isDark, 'tintColor prop:', tintColor);

  // Use white in dark mode for visibility, primary color in light mode
  const finalTintColor = tintColor || (isDark ? '#FFFFFF' : colors.primary);

  // Force update when theme changes by using key
  return (
    <RNRefreshControl
      key={isDark ? 'dark' : 'light'}
      {...props} // Spread props FIRST
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={finalTintColor}
      titleColor={finalTintColor}
      // Android colors
      colors={[finalTintColor]}
      progressBackgroundColor={isDark ? undefined : undefined}
    />
  );
};

/**
 * Hook to manage refresh state with simulated delay
 * In production, replace setTimeout with actual API calls
 */
export const useRefresh = (delayMs: number = 1500) => {
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Simulated refresh - replace with actual data fetching
    setTimeout(() => {
      setRefreshing(false);
    }, delayMs);
  }, [delayMs]);

  return { refreshing, onRefresh };
};
