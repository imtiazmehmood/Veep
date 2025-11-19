import type { StyleProp, ViewStyle } from 'react-native';
import type { MediaStream } from 'react-native-webrtc';
import type React from 'react';

export interface LocalVideoProps {
  stream?: MediaStream | null;
  style?: StyleProp<ViewStyle>;
}

export interface RemoteVideoProps {
  stream?: MediaStream | null;
}

export interface IconContainerProps {
  backgroundColor?: string;
  onPress?: () => void;
  Icon: React.ComponentType;
  style?: StyleProp<ViewStyle>;
}

export interface TextInputContainerProps {
  placeholder?: string;
  value?: string;
  setValue: (value: string) => void;
  keyboardType?: 'default' | 'number-pad' | 'email-address' | 'phone-pad';
}

