declare module '*.png' {
  const value: number;
  export = value;
}

declare module '*.jpg' {
  const value: number;
  export = value;
}

declare module '*.jpeg' {
  const value: number;
  export = value;
}

declare module '*.svg' {
  import React from 'react';
  import { SvgProps } from 'react-native-svg';
  const content: React.FC<SvgProps>;
  export default content;
}

declare module '*.mp3' {}
