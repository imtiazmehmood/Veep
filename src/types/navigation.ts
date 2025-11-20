import { NavigationProp } from '@react-navigation/native';

export type RootStackParamList = {
  Home: undefined;
  WebRTCCall: {
    incomingCallData?: {
      callerId: string;
      rtcMessage: any;
    };
  } | undefined;
  CreateCall: undefined;
  JoinCall: undefined;
  Call: { callId: string; isCaller: boolean };
};

export type NavigationProps<T extends keyof RootStackParamList> = {
  navigation: NavigationProp<RootStackParamList, T>;
  route?: {
    params?: RootStackParamList[T];
  };
};

