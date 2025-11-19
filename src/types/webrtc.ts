import type { MediaStream } from 'react-native-webrtc';

export interface WebRTCContextValue {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isVideoEnabled: boolean;
  switchCamera: () => Promise<void>;
  toggleMute: () => boolean;
  toggleVideo: () => boolean;
  createCall: () => Promise<string>;
  joinCall: (callId: string) => Promise<string>;
  hangup: () => Promise<void>;
  callId: string | null;
  isCallActive: boolean;
  initLocalStream: () => Promise<MediaStream>;
}

