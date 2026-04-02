import React, { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export interface TooltipTriggerProps {
  /** Attach to the trigger element so the tooltip shows on long-press (native) */
  onLongPress: () => void;
  /** Attach to the trigger element so the tooltip shows on hover (web) */
  onPointerEnter: () => void;
  /** Attach to the trigger element so the tooltip hides on hover-out (web) */
  onPointerLeave: () => void;
}

interface TooltipProps {
  /** Label displayed in the tooltip pill */
  text: string;
  /** Where the tooltip appears relative to the trigger. Default: 'bottom' */
  placement?: 'top' | 'bottom';
  /**
   * Render prop — receives the event handlers to spread onto the trigger element.
   *
   * @example
   * <Tooltip text="Upload Route">
   *   {(tipProps) => (
   *     <Pressable {...tipProps} onPress={handlePress}>
   *       <Icon />
   *     </Pressable>
   *   )}
   * </Tooltip>
   */
  children: (triggerProps: TooltipTriggerProps) => React.ReactNode;
}

/**
 * Lightweight, fully-typed tooltip.
 *
 * Uses a render-prop so the trigger element owns all its own events —
 * there is no wrapper element that could intercept presses.
 * The tooltip pill is pointerEvents="none" and purely visual.
 */
export const Tooltip: React.FC<TooltipProps> = ({ text, children, placement = 'bottom' }) => {
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = () => {
    setVisible(true);
    // Auto-hide after 2.5 s for long-press on native
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setVisible(false), 2500);
  };

  const hide = () => {
    if (timer.current) clearTimeout(timer.current);
    setVisible(false);
  };

  const triggerProps: TooltipTriggerProps = {
    onLongPress: show,
    onPointerEnter: show,
    onPointerLeave: hide,
  };

  return (
    <View style={styles.wrapper}>
      {children(triggerProps)}

      {visible && (
        <View
          pointerEvents="none"
          style={[styles.tooltip, placement === 'top' ? styles.tooltipTop : styles.tooltipBottom]}
        >
          <Text style={styles.tooltipText} numberOfLines={1}>
            {text}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  tooltip: {
    position: 'absolute',
    right: 0,
    backgroundColor: 'rgba(20,20,30,0.88)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 4,
    elevation: 8,
  },
  tooltipBottom: {
    top: '100%',
    marginTop: 6,
  },
  tooltipTop: {
    bottom: '100%',
    marginBottom: 6,
  },
  tooltipText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
