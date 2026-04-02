import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { colors, typography } from '../theme';

interface SimpleWheelPickerProps {
  items: string[];
  selectedValue: string;
  onValueChange: (value: string) => void;
  width?: number;
  height?: number;
}

const ITEM_HEIGHT = 50;

export const SimpleWheelPicker = ({
  items,
  selectedValue,
  onValueChange,
  width = 80,
  height = 150,
}: SimpleWheelPickerProps) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const lastEmittedIndexRef = useRef(-1);
  const isWeb = Platform.OS === 'web';
  const currentOffsetYRef = useRef(0);
  const settleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getOffsetY = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetFromContent = event.nativeEvent.contentOffset?.y;
    if (typeof offsetFromContent === 'number') return offsetFromContent;

    // Fallback for RN Web where scroll offset may come from target.scrollTop.
    const nativeEvent = event.nativeEvent as unknown;
    if (typeof nativeEvent !== 'object' || nativeEvent === null) return 0;

    const target = (nativeEvent as { target?: unknown }).target;
    if (typeof target !== 'object' || target === null) return 0;

    const scrollTop = (target as { scrollTop?: unknown }).scrollTop;
    return typeof scrollTop === 'number' ? scrollTop : 0;
  };

  const emitValueFromOffset = (offsetY: number) => {
    const index = Math.round(offsetY / ITEM_HEIGHT);
    if (index < 0 || index >= items.length) return;
    if (lastEmittedIndexRef.current === index) return;

    lastEmittedIndexRef.current = index;
    onValueChange(items[index]);
  };

  const snapToIndex = (index: number, animated: boolean) => {
    if (index < 0 || index >= items.length) return;
    scrollViewRef.current?.scrollTo({ y: index * ITEM_HEIGHT, animated });
  };

  const settleToNearest = (offsetY: number) => {
    const index = Math.round(offsetY / ITEM_HEIGHT);
    if (index < 0 || index >= items.length) return;
    emitValueFromOffset(offsetY);
    snapToIndex(index, false);
  };

  const handleSelectIndex = (index: number) => {
    if (index < 0 || index >= items.length) return;
    lastEmittedIndexRef.current = index;
    onValueChange(items[index]);
    snapToIndex(index, true);
  };

  // Calculate initial offset
  useEffect(() => {
    const index = items.indexOf(selectedValue);
    if (index >= 0 && scrollViewRef.current) {
      lastEmittedIndexRef.current = index;
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: index * ITEM_HEIGHT, animated: false });
      }, 100);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (settleTimeoutRef.current) {
        clearTimeout(settleTimeoutRef.current);
      }
    };
  }, []);

  const handleScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = getOffsetY(e);
    currentOffsetYRef.current = offsetY;
    settleToNearest(offsetY);
  };

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = getOffsetY(e);
    currentOffsetYRef.current = offsetY;
    emitValueFromOffset(offsetY);

    if (settleTimeoutRef.current) {
      clearTimeout(settleTimeoutRef.current);
    }

    settleTimeoutRef.current = setTimeout(() => {
      settleToNearest(currentOffsetYRef.current);
    }, 80);
  };

  return (
    <View style={[styles.container, { width, height }]}>
      <View style={[styles.selectionOverlay, { top: (height - ITEM_HEIGHT) / 2 }]} />
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        snapToAlignment="start"
        disableIntervalMomentum
        decelerationRate="fast"
        onMomentumScrollEnd={handleScrollEnd}
        onScrollEndDrag={isWeb ? handleScrollEnd : undefined}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{
          paddingVertical: (height - ITEM_HEIGHT) / 2,
        }}
      >
        {items.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.item, { height: ITEM_HEIGHT }]}
            onPress={() => handleSelectIndex(index)}
            activeOpacity={0.7}
          >
            <Text style={[styles.itemText, item === selectedValue && styles.selectedItemText]}>{item}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  item: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemText: {
    ...typography.h4,
    width: '100%',
    lineHeight: ITEM_HEIGHT,
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
    fontVariant: ['tabular-nums'],
    color: colors.textSecondary,
    opacity: 0.5,
  },
  selectedItemText: {
    color: colors.textPrimary,
    opacity: 1,
    fontWeight: 'bold',
    fontSize: 24,
  },
  selectionOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(0,0,0,0.02)',
    pointerEvents: 'none', // Ensure touches pass through
  },
});
