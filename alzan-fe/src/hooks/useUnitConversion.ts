import { useCallback, useMemo } from 'react';
import { usePreferences } from './settings/usePreferences';
import {
  convertDistanceToUi as convertDist,
  convertWeightToUi as convertWeight,
  convertSpeedToUi as convertSpeed,
  parseDistanceToMeters as parseDist,
  parseWeightToKg as parseWeight,
  convertEnergyToUi as convertEnergy,
  parseEnergyToKcal as parseEnergy,
  convertLengthToUi as convertLength,
  parseLengthToCm as parseLength,
} from '../utils/unitConversionUtils'; // Adjust path if needed
import { DistanceUnit, EnergyUnit, SportType, WeightUnit } from '../types/requests.types';

export const useUnitConversion = () => {
  const { preferences } = usePreferences();

  const distanceUnit: DistanceUnit = preferences?.distance_unit === 'miles' ? 'miles' : 'km';
  const weightUnit: WeightUnit = preferences?.weight_unit === 'lb' ? 'lb' : 'kg';
  const energyUnit: EnergyUnit = 'kcal'; // Fixed to kcal (removed option)

  // Derived booleans for backward compatibility if needed, or convenience
  const isMetricDistance = distanceUnit === 'km';
  const isMetricWeight = weightUnit === 'kg';
  const isKcal = energyUnit === 'kcal';

  const convertDistanceToUi = useCallback(
    (meters: number | null | undefined, precision = 2) => {
      return convertDist(meters, distanceUnit, precision);
    },
    [distanceUnit],
  );

  const convertWeightToUi = useCallback(
    (kg: number | null | undefined, precision = 1) => {
      return convertWeight(kg, weightUnit, precision);
    },
    [weightUnit],
  );

  const convertSpeedToUi = useCallback(
    (speedMetersPerSecond: number | null | undefined, sport: SportType = 'other') => {
      return convertSpeed(speedMetersPerSecond, sport, distanceUnit);
    },
    [distanceUnit],
  );

  const convertEnergyToUi = useCallback(
    (kcal: number | null | undefined, precision = 0) => {
      return convertEnergy(kcal, energyUnit, precision);
    },
    [energyUnit],
  );

  const parseDistanceToMeters = useCallback(
    (value: number) => {
      return parseDist(value, distanceUnit);
    },
    [distanceUnit],
  );

  const parseWeightToKg = useCallback(
    (value: number) => {
      return parseWeight(value, weightUnit);
    },
    [weightUnit],
  );

  const parseEnergyToKcal = useCallback(
    (value: number) => {
      return parseEnergy(value, energyUnit);
    },
    [energyUnit],
  );

  const convertLengthToUi = useCallback(
    (cm: number | null | undefined, precision = 1) => {
      return convertLength(cm, distanceUnit, precision);
    },
    [distanceUnit],
  );

  const parseLengthToCm = useCallback(
    (value: number) => {
      return parseLength(value, distanceUnit);
    },
    [distanceUnit],
  );

  const units = useMemo(
    () => ({
      distance: distanceUnit === 'km' ? 'km' : 'mi',
      weight: weightUnit === 'kg' ? 'kg' : 'lb',
      speed: distanceUnit === 'km' ? 'km/h' : 'mph',
      energy: energyUnit,
      length: distanceUnit === 'km' ? 'cm' : 'in',
    }),
    [distanceUnit, energyUnit, weightUnit],
  );

  return useMemo(
    () => ({
      isMetricDistance,
      isMetricWeight,
      isKcal,
      convertDistanceToUi,
      convertWeightToUi,
      convertSpeedToUi,
      convertEnergyToUi,
      convertLengthToUi,
      parseDistanceToMeters,
      parseWeightToKg,
      parseEnergyToKcal,
      parseLengthToCm,
      units,
    }),
    [
      convertDistanceToUi,
      convertEnergyToUi,
      convertLengthToUi,
      convertSpeedToUi,
      convertWeightToUi,
      isKcal,
      isMetricDistance,
      isMetricWeight,
      parseDistanceToMeters,
      parseEnergyToKcal,
      parseLengthToCm,
      parseWeightToKg,
      units,
    ],
  );
};
