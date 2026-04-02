import React, { ReactNode } from 'react';
import { StyleSheet, ViewStyle, StyleProp, View, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../context/ThemeContext';

// Type definitions for the liquid-glass module
type LiquidGlassViewComponent = React.ComponentType<{
  style?: StyleProp<ViewStyle>;
  effect?: 'clear' | 'regular';
  colorScheme?: 'light' | 'dark';
  children?: ReactNode;
}>;

interface LiquidGlassModule {
  LiquidGlassView: LiquidGlassViewComponent;
  isLiquidGlassSupported?: boolean;
}

// Safe import pattern for native modules that might not be linked yet
let LiquidGlassView: LiquidGlassViewComponent | null = null;
let isLiquidGlassSupported = false;

try {
  // Dynamic import for optional native module
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const lib = require('@callstack/liquid-glass') as LiquidGlassModule;
  LiquidGlassView = lib.LiquidGlassView;
  isLiquidGlassSupported = lib.isLiquidGlassSupported ?? false;
} catch (_e) {
  // Module not loaded - will use BlurView fallback
  console.log('[LiquidGlassCard] Using BlurView fallback (native module not available)');
}

// Re-export for external use
export { isLiquidGlassSupported };

interface LiquidGlassNativeCardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  borderRadius?: number;
  /** 'regular' = frosted blur, 'clear' = more transparent */
  effect?: 'clear' | 'regular';
}

/**
 * LiquidGlassNativeCard - iOS 26+ Liquid Glass Card Container
 *
 * Uses Apple's native Liquid Glass effect on iOS 26+.
 * Falls back to BlurView with glassmorphism styling on older versions.
 *
 * Unlike LiquidGlassFooter, this component does NOT use flex: 1,
 * making it suitable for centered modals and cards.
 */
export const LiquidGlassNativeCard: React.FC<LiquidGlassNativeCardProps> = ({
  children,
  style,
  borderRadius = 24,
  effect = 'regular',
}) => {
  const { isDark } = useTheme();

  // If native module is loaded AND supported (iOS 26+)
  if (LiquidGlassView && isLiquidGlassSupported) {
    return (
      <LiquidGlassView
        style={[styles.container, { borderRadius }, style]}
        effect={effect}
        colorScheme={isDark ? 'dark' : 'light'}
      >
        {children}
      </LiquidGlassView>
    );
  }

  // Fallback for iOS (Standard BlurView)
  if (Platform.OS === 'ios') {
    return (
      <View style={[styles.container, styles.glassFallback, { borderRadius, overflow: 'hidden' }, style]}>
        <BlurView intensity={80} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
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
      </View>
    );
  }

  // Fallback for Android (High Intensity Experimental Blur)
  return (
    <View
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
      <BlurView
        intensity={20}
        tint={isDark ? 'dark' : 'default'}
        experimentalBlurMethod="dimezisBlurView"
        style={StyleSheet.absoluteFill}
      />
      {/* Balanced Glass Overlay */}
      <View
        style={[
          styles.glassOverlay,
          {
            backgroundColor: isDark ? 'rgba(20, 20, 25, 0.15)' : 'rgba(255, 255, 255, 0.15)',
            borderRadius,
          },
        ]}
      />
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // No flex: 1 - suitable for modals/cards
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
