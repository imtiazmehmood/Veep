declare module 'react-native-incall-manager' {
  interface InCallManager {
    start(options?: { media?: 'video' | 'audio' }): void;
    stop(): void;
    setForceSpeakerphoneOn(force: boolean): void;
    setMicrophoneMute(mute: boolean): void;
    startRingtone(ringtone?: string): void;
    stopRingtone(): void;
    startRingback(ringback?: string): void;
    stopRingback(): void;
  }

  const InCallManager: InCallManager;
  export default InCallManager;
}

