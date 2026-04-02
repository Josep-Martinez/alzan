// src/modules/nutrition/components/FoodScanner.tsx
// Barcode scanner component using expo-camera

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { X, Flashlight, FlashlightOff, ScanBarcode } from 'lucide-react-native';
import { warmBarcodeLookup } from '../services/nutritionSearchService';
import { useTranslation } from 'react-i18next';
import { useNutritionStyles } from '../../../hooks/useNutritionStyles';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCAN_AREA_SIZE = SCREEN_WIDTH * 0.7;
const SCAN_CONFIRMATION_WINDOW_MS = 800;

type SupportedBarcodeType = 'ean13' | 'ean8' | 'upc_a' | 'upc_e';

type PendingScanState = {
  barcode: string;
  matches: number;
  timestamp: number;
};

function normalizeBarcode(value: string): string {
  return value.replace(/\s+/g, '').trim();
}

function isSupportedBarcodeType(value: string): value is SupportedBarcodeType {
  return value === 'ean13' || value === 'ean8' || value === 'upc_a' || value === 'upc_e';
}

function isValidBarcodeForType(type: SupportedBarcodeType, barcode: string): boolean {
  if (!/^\d+$/.test(barcode)) {
    return false;
  }

  switch (type) {
    case 'ean13':
      return barcode.length === 13;
    case 'ean8':
      return barcode.length === 8;
    case 'upc_a':
      return barcode.length === 12;
    case 'upc_e':
      return barcode.length >= 6 && barcode.length <= 8;
    default:
      return false;
  }
}

interface FoodScannerProps {
  onBarcodeDetected: (barcode: string) => void;
  onClose: () => void;
}

export const FoodScanner: React.FC<FoodScannerProps> = ({ onBarcodeDetected, onClose }) => {
  const { t } = useTranslation();
  const { colors: themeColors, isDark } = useNutritionStyles();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const pendingScanRef = useRef<PendingScanState | null>(null);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  useEffect(() => {
    warmBarcodeLookup();
  }, []);

  const handleBarCodeScanned = (result: BarcodeScanningResult) => {
    if (scanned) return;

    const { data, type } = result;
    const normalizedType = type.toLowerCase();

    if (!isSupportedBarcodeType(normalizedType)) {
      return;
    }

    const normalizedBarcode = normalizeBarcode(data);
    if (!isValidBarcodeForType(normalizedType, normalizedBarcode)) {
      return;
    }

    const now = Date.now();
    const pendingScan = pendingScanRef.current;

    if (
      pendingScan &&
      pendingScan.barcode === normalizedBarcode &&
      now - pendingScan.timestamp <= SCAN_CONFIRMATION_WINDOW_MS
    ) {
      const nextMatches = pendingScan.matches + 1;
      pendingScanRef.current = {
        barcode: normalizedBarcode,
        matches: nextMatches,
        timestamp: now,
      };

      if (nextMatches >= 2) {
        setScanned(true);
        onBarcodeDetected(normalizedBarcode);
      }
      return;
    }

    pendingScanRef.current = {
      barcode: normalizedBarcode,
      matches: 1,
      timestamp: now,
    };
  };

  // Permission not determined yet
  if (!permission) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? themeColors.surfaceSolid : '#F5F5F5' }]}>
        <Text style={[styles.permissionText, { color: themeColors.textSecondary }]}>
          {t('nutrition.loadingCamera')}
        </Text>
      </View>
    );
  }

  // Permission denied
  if (!permission.granted) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? themeColors.surfaceSolid : '#F5F5F5' }]}>
        <ScanBarcode size={64} color="#CCC" />
        <Text style={[styles.permissionTitle, { color: themeColors.textPrimary }]}>
          {t('nutrition.cameraPermissionTitle')}
        </Text>
        <Text style={[styles.permissionText, { color: themeColors.textSecondary }]}>
          {t('nutrition.cameraPermissionRequest')}
        </Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>{t('nutrition.allowCamera')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
          <Text style={[styles.cancelBtnText, { color: themeColors.textSecondary }]}>{t('common.cancel')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.scannerContainer}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={flashOn}
        barcodeScannerSettings={{
          barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />

      {/* Overlay */}
      <View style={styles.overlay}>
        {/* Top dark area */}
        <View style={styles.overlayTop} />

        {/* Middle row with scan area */}
        <View style={styles.overlayMiddle}>
          <View style={styles.overlaySide} />
          <View style={styles.scanArea}>
            {/* Corner markers */}
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
          <View style={styles.overlaySide} />
        </View>

        {/* Bottom dark area */}
        <View style={styles.overlayBottom}>
          <Text style={styles.instructionText}>{t('nutrition.scanBarcodeInstruction')}</Text>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlBtn} onPress={onClose}>
          <X size={24} color="#FFF" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlBtn} onPress={() => setFlashOn(!flashOn)}>
          {flashOn ? <FlashlightOff size={24} color="#FFF" /> : <Flashlight size={24} color="#FFF" />}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 40,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginTop: 20,
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  permissionBtn: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 20,
  },
  permissionBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelBtn: {
    marginTop: 12,
    padding: 12,
  },
  cancelBtnText: {
    color: '#999',
    fontSize: 15,
  },
  scannerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
  },
  overlayTop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  overlayMiddle: {
    flexDirection: 'row',
    height: SCAN_AREA_SIZE,
  },
  overlaySide: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  scanArea: {
    width: SCAN_AREA_SIZE,
    height: SCAN_AREA_SIZE,
    position: 'relative',
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    paddingTop: 30,
  },
  instructionText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#007AFF',
    borderWidth: 3,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 8,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 8,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 8,
  },
  controls: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  controlBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
