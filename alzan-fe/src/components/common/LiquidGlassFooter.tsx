import React, { ReactNode } from 'react';
import { StyleSheet, ViewStyle, StyleProp, View, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../context/ThemeContext';

// Type definitions for @callstack/liquid-glass module
interface LiquidGlassViewProps {
  style?: StyleProp<ViewStyle>;
  effect?: 'clear' | 'regular';
  colorScheme?: 'light' | 'dark';
  interactive?: boolean;
  children?: ReactNode;
}

type LiquidGlassViewComponent = React.ComponentType<LiquidGlassViewProps>;

interface LiquidGlassModule {
  LiquidGlassView: LiquidGlassViewComponent;
  isLiquidGlassSupported?: boolean;
}

// Safe import pattern for native modules that might not be linked yet
let LiquidGlassView: LiquidGlassViewComponent | null = null;
let isLiquidGlassSupported = false;

try {
  // Dynamic import with proper typing

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const lib = require('@callstack/liquid-glass') as LiquidGlassModule;
  LiquidGlassView = lib.LiquidGlassView;
  isLiquidGlassSupported = lib.isLiquidGlassSupported ?? false;
} catch (_error) {
  // Module not loaded - will use BlurView fallback
  console.log('[LiquidGlassFooter] Using BlurView fallback (native module not available)');
}

// Re-export for external use
export { isLiquidGlassSupported };

interface LiquidGlassFooterProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  borderRadius?: number;
  /** 'regular' = frosted blur, 'clear' = more transparent */
  effect?: 'clear' | 'regular';
  /** Enable subtle touch interaction effects */
  interactive?: boolean;
}

/**
 * LiquidGlassFooter - iOS 26+ Liquid Glass Tab Bar Container
 *
 * Uses Apple's native Liquid Glass effect on iOS 26+.
 * Falls back to BlurView with glassmorphism styling on older versions.
 */
export const LiquidGlassFooter: React.FC<LiquidGlassFooterProps> = ({
  children,
  style,
  borderRadius = 40,
  effect = 'regular',
  interactive = false,
}) => {
  const { isDark } = useTheme();

  // If native module is loaded AND supported (iOS 26+)
  if (LiquidGlassView && isLiquidGlassSupported) {
    return (
      <LiquidGlassView
        style={[styles.container, { borderRadius }, style]}
        effect={effect}
        colorScheme={isDark ? 'dark' : 'light'}
        interactive={interactive}
      >
        {children}
      </LiquidGlassView>
    );
  }

  // Fallback for iOS (Standard BlurView)
  if (Platform.OS === 'ios') {
    return (
      <BlurView
        intensity={80}
        tint={isDark ? 'dark' : 'light'}
        style={[styles.container, styles.glassFallback, { borderRadius, overflow: 'hidden' }, style]}
      >
        {/* Subtle glass overlay for extra depth */}
        <View
          style={[
            styles.glassOverlay,
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.25)',
              borderRadius,
            },
          ]}
        />
        {children}
      </BlurView>
    );
  }

  // Fallback for Android (High Intensity Experimental Blur)
  return (
    <BlurView
      intensity={20} // Minimal blur for maximum background clarity
      tint={isDark ? 'dark' : 'default'} // 'default' usually blends better on Android
      experimentalBlurMethod="dimezisBlurView" // Force blur effect on Android
      style={[
        styles.container,
        styles.glassFallback,
        {
          borderRadius,
          overflow: 'hidden',
          // Stronger borders for definition on Android
          borderWidth: isDark ? 0.5 : 0.5,
          borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.4)',
        },
        style,
      ]}
    >
      {/* Balanced Glass Overlay: Visible but lets blur through */}
      <View
        style={[
          styles.glassOverlay,
          {
            backgroundColor: isDark
              ? 'rgba(20, 20, 25, 0.15)' // Very transparent
              : 'rgba(255, 255, 255, 0.15)',
            borderRadius,
          },
        ]}
      />
      {children}
    </BlurView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  glassFallback: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 12,
  },
  glassOverlay: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
  },
});
