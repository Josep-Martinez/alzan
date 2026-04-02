import React from 'react';
import { View, Modal, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { borderRadius } from '../theme';

interface LiquidGlassModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Callback when the modal should close (backdrop tap) */
  onClose: () => void;
  /** Content to render inside the modal */
  children: React.ReactNode;
  /** Height of the modal content. Can be a number (pixels) or string (e.g., '85%'). Default: '85%' */
  height?: number | string;
  /** Animation type. Default: 'slide' */
  animationType?: 'slide' | 'fade' | 'none';
}

/**
 * LiquidGlassModal - A premium modal component with the Liquid Glass aesthetic.
 *
 * Features:
 * - Blurred backdrop
 * - Glass-like content container with gradient reflections
 * - Semi-transparent white border
 * - Slide-up animation (default)
 *
 * Usage:
 * ```tsx
 * <LiquidGlassModal visible={isOpen} onClose={() => setIsOpen(false)}>
 *   <YourContent />
 * </LiquidGlassModal>
 * ```
 */
export const LiquidGlassModal: React.FC<LiquidGlassModalProps> = ({
  visible,
  onClose,
  children,
  height = '85%',
  animationType = 'slide',
}) => {
  return (
    <Modal visible={visible} animationType={animationType} transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        {/* Blurred Backdrop */}
        <BlurView intensity={Platform.OS === 'ios' ? 20 : 30} tint="dark" style={StyleSheet.absoluteFill} />

        {/* Backdrop Touch to Close */}
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />

        {/* Liquid Glass Content Container */}
        <View style={[styles.contentContainer, { height: height as import('react-native').DimensionValue }]}>
          {/* Blur for the glass effect */}
          <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFill} />

          {/* Base white tint */}
          <View style={styles.baseTint} pointerEvents="none" />

          {/* Top-Left Reflection Gradient */}
          <LinearGradient
            colors={['rgba(255,255,255,0.6)', 'rgba(255,255,255,0.1)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.6, y: 0.6 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />

          {/* Bottom Reflection for depth */}
          <LinearGradient
            colors={['transparent', 'rgba(255,255,255,0.2)']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />

          {/* Border Highlight */}
          <View style={styles.borderOverlay} pointerEvents="none" />

          {/* Actual Content */}
          <View style={styles.content}>{children}</View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  contentContainer: {
    borderTopLeftRadius: borderRadius.l,
    borderTopRightRadius: borderRadius.l,
    overflow: 'hidden',
    // Shadow for floating effect
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 20,
  },
  baseTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  borderOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderTopLeftRadius: borderRadius.l,
    borderTopRightRadius: borderRadius.l,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  content: {
    flex: 1,
  },
});
