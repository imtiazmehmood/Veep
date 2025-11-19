declare module '*.svg' {
  import type { SvgProps } from 'react-native-svg';
  const content: React.FC<SvgProps>;
  export default content;
}

declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';

// React Native process.env declaration
declare namespace NodeJS {
  interface ProcessEnv {
    [key: string]: string | undefined;
    RN_USE_EMULATOR_HOST?: string;
    USE_ANDROID_EMULATOR?: string;
    SERVER_IP?: string;
  }
}

declare const process: {
  env: NodeJS.ProcessEnv;
};

