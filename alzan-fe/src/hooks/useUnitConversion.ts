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

  // DEBUG: Log preferences to see if they update
  console.log('[useUnitConversion] Current weight_unit:', preferences?.weight_unit);

  const distanceUnit: DistanceUnit = preferences?.distance_unit === 'miles' ? 'miles' : 'km';
  const weightUnit: WeightUnit = preferences?.weight_unit === 'lb' ? 'lb' : 'kg';
  const energyUnit: EnergyUnit = 'kcal'; // Fixed to kcal (removed option)

  // Derived booleans for backward compatibility if needed, or convenience
  const isMetricDistance = distanceUnit === 'km';
  const isMetricWeight = weightUnit === 'kg';
  const isKcal = energyUnit === 'kcal';

  const convertDistanceToUi = (meters: number | null | undefined, precision = 2) => {
    return convertDist(meters, distanceUnit, precision);
  };

  const convertWeightToUi = (kg: number | null | undefined, precision = 1) => {
    return convertWeight(kg, weightUnit, precision);
  };

  const convertSpeedToUi = (speedMetersPerSecond: number | null | undefined, sport: SportType = 'other') => {
    return convertSpeed(speedMetersPerSecond, sport, distanceUnit);
  };

  const convertEnergyToUi = (kcal: number | null | undefined, precision = 0) => {
    return convertEnergy(kcal, energyUnit, precision);
  };

  const parseDistanceToMeters = (value: number) => {
    return parseDist(value, distanceUnit);
  };

  const parseWeightToKg = (value: number) => {
    return parseWeight(value, weightUnit);
  };

  const parseEnergyToKcal = (value: number) => {
    return parseEnergy(value, energyUnit);
  };

  const convertLengthToUi = (cm: number | null | undefined, precision = 1) => {
    return convertLength(cm, distanceUnit, precision);
  };

  const parseLengthToCm = (value: number) => {
    return parseLength(value, distanceUnit);
  };

  return {
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
    units: {
      distance: distanceUnit === 'km' ? 'km' : 'mi',
      weight: weightUnit === 'kg' ? 'kg' : 'lb',
      speed: distanceUnit === 'km' ? 'km/h' : 'mph',
      energy: energyUnit,
      length: distanceUnit === 'km' ? 'cm' : 'in',
    },
  };
};
