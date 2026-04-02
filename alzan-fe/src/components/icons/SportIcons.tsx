import React from 'react';
import Svg, { Path, Circle, Ellipse, Line } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

// Corredor - silueta clásica corriendo
export const RunnerIcon = ({ size = 24, color = 'currentColor', strokeWidth = 2 }: IconProps) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <Circle cx="14" cy="4" r="2" />
    <Path d="M4 17l4 1l2 -3l2 -1" />
    <Path d="M15 21l-2 -5l-3 -1l2 -4l4 1l3 -2" />
    <Path d="M9 11l-2 -2" />
  </Svg>
);

// Gym - Persona haciendo squat con barra
export const LifterIcon = ({ size = 24, color = 'currentColor', strokeWidth = 2 }: IconProps) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <Circle cx="12" cy="4" r="2" />
    <Path d="M4 8h16" />
    <Path d="M4 6v4" />
    <Path d="M20 6v4" />
    <Path d="M9 8v2l-2 4v6" />
    <Path d="M15 8v2l2 4v6" />
    <Path d="M9 14h6" />
  </Svg>
);

// Ciclismo - Persona en bicicleta de perfil
export const CyclistIcon = ({ size = 24, color = 'currentColor', strokeWidth = 2 }: IconProps) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <Circle cx="5" cy="17" r="3" />
    <Circle cx="19" cy="17" r="3" />
    <Circle cx="12" cy="10" r="2" />
    <Path d="M12 12l-2 5h-5" />
    <Path d="M12 12l3 5h4" />
    <Path d="M10 17l2 -5l5 -4" />
    <Path d="M14 8l3 -2" />
  </Svg>
);

// Nadador - brazada clara
export const SwimmerIcon = ({ size = 24, color = 'currentColor', strokeWidth = 2 }: IconProps) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <Circle cx="6" cy="8" r="2" />
    <Path d="M8 8l4 -2l4 2l4 -1" />
    <Path d="M8 10l8 2" />
    <Path d="M2 16c1.5 -1.5 3 -1.5 4.5 0s3 1.5 4.5 0s3 -1.5 4.5 0s3 1.5 4.5 0" />
    <Path d="M2 20c1.5 -1.5 3 -1.5 4.5 0s3 1.5 4.5 0s3 -1.5 4.5 0s3 1.5 4.5 0" />
  </Svg>
);

// Senderismo/Ruta - Montaña con sendero
export const HikerIcon = ({ size = 24, color = 'currentColor', strokeWidth = 2 }: IconProps) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <Path d="M3 20l5 -10l4 6l4 -8l5 12" />
    <Path d="M3 20h18" />
    <Circle cx="17" cy="6" r="2" />
  </Svg>
);

// Futbolista - con balón en pie
export const FootballPlayerIcon = ({ size = 24, color = 'currentColor', strokeWidth = 2 }: IconProps) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <Circle cx="12" cy="4" r="2" />
    <Path d="M10 21l2 -9" />
    <Path d="M14 21l-1 -5" />
    <Path d="M12 12l-4 -4" />
    <Path d="M12 12l2 -3" />
    <Circle cx="6" cy="18" r="2.5" />
  </Svg>
);

// Jugador de Basket - tiro con balón
export const BasketballPlayerIcon = ({ size = 24, color = 'currentColor', strokeWidth = 2 }: IconProps) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <Circle cx="10" cy="4" r="2" />
    <Path d="M8 21l2 -9" />
    <Path d="M12 21l0 -6" />
    <Path d="M10 12l-2 -4" />
    <Path d="M10 12l4 -5" />
    <Circle cx="17" cy="5" r="2.5" />
    <Line x1="15" y1="3" x2="19" y2="7" />
    <Line x1="19" y1="3" x2="15" y2="7" />
  </Svg>
);

// Jugador de Tenis - con raqueta
export const TennisPlayerIcon = ({ size = 24, color = 'currentColor', strokeWidth = 2 }: IconProps) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <Circle cx="10" cy="4" r="2" />
    <Path d="M8 21l2 -9" />
    <Path d="M12 21l0 -6" />
    <Path d="M10 12l-3 -2" />
    <Path d="M10 12l5 -6" />
    <Ellipse cx="18" cy="4" rx="3" ry="4" />
    <Line x1="18" y1="0" x2="18" y2="8" />
    <Line x1="15" y1="4" x2="21" y2="4" />
  </Svg>
);

export const SPORT_ICONS = {
  running: RunnerIcon,
  gym: LifterIcon,
  cycling: CyclistIcon,
  swimming: SwimmerIcon,
  hiking: HikerIcon,
  football: FootballPlayerIcon,
  basketball: BasketballPlayerIcon,
  tennis: TennisPlayerIcon,
};
