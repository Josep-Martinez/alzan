// components/sport/TargetSelector.tsx
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

interface TargetSelectorProps {
  type: 'pace' | 'bpm' | 'power' | 'velocity';
  value: number;
  onChange: (value: number) => void;
}

const TargetSelector: React.FC<TargetSelectorProps> = ({ type, value, onChange }) => {
  const [activePart, setActivePart] = useState<'main' | 'decimal'>('main');

  const getConfig = () => {
    switch (type) {
      case 'pace':
        return {
          mainLabel: 'min/km',
          mainRange: { min: 3, max: 10, step: 1 },
          decimalRange: { min: 0, max: 59, step: 1 },
          format: (val: number) => {
            const mins = Math.floor(val);
            const secs = Math.round((val - mins) * 60);
            return `${mins}:${secs.toString().padStart(2, '0')}`;
          }
        };
      case 'bpm':
        return {
          mainLabel: 'ppm',
          mainRange: { min: 120, max: 200, step: 1 },
          decimalRange: null,
          format: (val: number) => Math.round(val).toString()
        };
      case 'power':
        return {
          mainLabel: 'W',
          mainRange: { min: 100, max: 400, step: 5 },
          decimalRange: null,
          format: (val: number) => Math.round(val).toString()
        };
      case 'velocity':
        return {
          mainLabel: 'km/h',
          mainRange: { min: 10, max: 40, step: 1 },
          decimalRange: { min: 0, max: 9, step: 1 },
          format: (val: number) => val.toFixed(1)
        };
      default:
        return {
          mainLabel: '',
          mainRange: { min: 0, max: 100, step: 1 },
          decimalRange: null,
          format: (val: number) => val.toString()
        };
    }
  };

  const config = getConfig();
  const mainValue = Math.floor(value);
  const decimalValue = type === 'pace' 
    ? Math.round((value - mainValue) * 60)
    : Math.round((value - mainValue) * 10);

  const renderSelector = (range: { min: number; max: number; step: number }, isDecimal = false) => {
    if (!range) return null;
    
    const items = [];
    for (let i = range.min; i <= range.max; i += range.step) {
      items.push(i);
    }

    return (
      <View style={styles.selectorContainer}>
        <ScrollView contentContainerStyle={styles.selectorItems}>
          {items.map((item) => (
            <Pressable
              key={item}
              style={styles.selectorItem}
              onPress={() => {
                let newValue;
                if (isDecimal) {
                  if (type === 'pace') {
                    newValue = mainValue + item / 60;
                  } else {
                    newValue = mainValue + item / 10;
                  }
                } else {
                  newValue = item + (decimalValue / (type === 'pace' ? 60 : 10));
                }
                onChange(newValue);
              }}
            >
              <Text style={[
                styles.selectorText,
                (isDecimal ? decimalValue === item : mainValue === item) && styles.selectorTextActive
              ]}>
                {item.toString().padStart(2, '0')}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.valueDisplay}>
        <Text style={styles.valueText}>
          {config.format(value)} 
          <Text style={styles.unitText}> {config.mainLabel}</Text>
        </Text>
      </View>
      
      <View style={styles.selectorRow}>
        <Pressable 
          style={[styles.selectorTab, activePart === 'main' && styles.selectorTabActive]}
          onPress={() => setActivePart('main')}
        >
          <Text style={styles.selectorTabText}>Principal</Text>
        </Pressable>
        
        {config.decimalRange && (
          <Pressable 
            style={[styles.selectorTab, activePart === 'decimal' && styles.selectorTabActive]}
            onPress={() => setActivePart('decimal')}
          >
            <Text style={styles.selectorTabText}>
              {type === 'pace' ? 'Segundos' : 'Decimales'}
            </Text>
          </Pressable>
        )}
      </View>
      
      {activePart === 'main' 
        ? renderSelector(config.mainRange) 
        : config.decimalRange && renderSelector(config.decimalRange, true)
      }
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  valueDisplay: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  valueText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  unitText: {
    fontSize: 16,
    color: '#B0B0C4',
    fontWeight: '500',
  },
  selectorRow: {
    flexDirection: 'row',
    marginVertical: 8,
  },
  selectorTab: {
    flex: 1,
    padding: 8,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  selectorTabActive: {
    borderBottomColor: '#00D4AA',
  },
  selectorTabText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  selectorContainer: {
    height: 150,
  },
  selectorItems: {
    alignItems: 'center',
  },
  selectorItem: {
    paddingVertical: 8,
    width: '100%',
    alignItems: 'center',
  },
  selectorText: {
    fontSize: 18,
    color: '#B0B0C4',
  },
  selectorTextActive: {
    color: '#00D4AA',
    fontWeight: '700',
  },
});

export default TargetSelector;