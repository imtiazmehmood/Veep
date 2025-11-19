import { Platform } from 'react-native';
import {
  RTCPeerConnection,
  RTCSessionDescription,
  RTCIceCandidate,
  MediaStream,
  mediaDevices,
} from 'react-native-webrtc';

type FacingMode = 'user' | 'environment';

interface RTCIceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

// TURN/STUN configuration
export const iceServers: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  {
    urls: 'turn:relay1.expressturn.com:3478',
    username: 'expressturn',
    credential: 'expressturn',
  },
];

interface RTCTrackEvent {
  streams: MediaStream[];
}

interface RTCIceCandidateEvent {
  candidate: RTCIceCandidate | null;
}

/**
 * Create a new RTCPeerConnection
 */
export const createPeerConnection = (
  onIceCandidate: (candidate: RTCIceCandidate) => void | Promise<void>,
  onTrack: (stream: MediaStream) => void
): RTCPeerConnection => {
  const peerConnection = new RTCPeerConnection({
    iceServers: iceServers,
  });

  // Handle ICE candidates
  (peerConnection as any).onicecandidate = (event: RTCIceCandidateEvent) => {
    if (event.candidate) {
      onIceCandidate(event.candidate);
    }
  };

  // Handle remote tracks
  (peerConnection as any).ontrack = (event: RTCTrackEvent) => {
    if (event.streams && event.streams[0]) {
      onTrack(event.streams[0]);
    }
  };

  // Handle connection state changes
  (peerConnection as any).onconnectionstatechange = () => {
    console.log('Connection state:', peerConnection.connectionState);
  };

  // Handle ICE connection state changes
  (peerConnection as any).oniceconnectionstatechange = () => {
    console.log('ICE connection state:', peerConnection.iceConnectionState);
  };

  return peerConnection;
};

/**
 * Get user media (camera and microphone)
 * Works on both iOS and Android
 */
export const getUserMedia = async (facingMode: FacingMode = 'user'): Promise<MediaStream> => {
  try {
    // Video constraints that work on both iOS and Android
    const videoConstraints: any = {
      facingMode: facingMode, // 'user' for front, 'environment' for back
      width: { min: 640, ideal: 1280, max: 1920 },
      height: { min: 480, ideal: 720, max: 1080 },
    };

    // For iOS, we can also specify deviceId if needed
    if (Platform.OS === 'ios') {
      // iOS supports facingMode, but we can add additional constraints if needed
      videoConstraints.frameRate = { ideal: 30, max: 30 };
    }

    const stream = await mediaDevices.getUserMedia({
      audio: true,
      video: videoConstraints,
    });
    return stream;
  } catch (error: any) {
    console.error('Error getting user media:', error?.message || error);
    throw error;
  }
};

/**
 * Switch camera (front/back)
 * Works on both iOS and Android
 * react-native-webrtc supports switchCamera on both platforms
 */
export const switchCamera = async (stream: MediaStream): Promise<void> => {
  const videoTrack = stream.getVideoTracks()[0];
  if (videoTrack) {
    try {
      // react-native-webrtc provides switchCamera method on both iOS and Android
      // Try different method names for compatibility
      const track = videoTrack as any;
      if (typeof track.switchCamera === 'function') {
        await track.switchCamera();
      } else if (typeof track._switchCamera === 'function') {
        // Some versions use _switchCamera
        await track._switchCamera();
      } else {
        console.warn('switchCamera method not available on this video track');
      }
    } catch (error: any) {
      console.error('Error switching camera:', error?.message || error);
      // Don't throw - allow the app to continue even if camera switch fails
    }
  }
};

/**
 * Toggle mute/unmute audio
 * @param stream - The media stream
 * @param isMuted - Current mute state (true = muted, false = unmuted)
 * @returns New mute state
 */
export const toggleMute = (stream: MediaStream, isMuted: boolean): boolean => {
  const audioTrack = stream.getAudioTracks()[0];
  if (audioTrack) {
    // If currently muted (isMuted=true), unmute (enable=true). If unmuted (isMuted=false), mute (enable=false).
    audioTrack.enabled = !isMuted;
  }
  return !isMuted;
};

/**
 * Toggle video on/off
 * @param stream - The media stream
 * @param isVideoEnabled - Current video state (true = enabled, false = disabled)
 * @returns New video state
 */
export const toggleVideo = (stream: MediaStream, isVideoEnabled: boolean): boolean => {
  const videoTrack = stream.getVideoTracks()[0];
  if (videoTrack) {
    // If currently enabled, disable. If disabled, enable.
    videoTrack.enabled = !isVideoEnabled;
  }
  return !isVideoEnabled;
};

/**
 * Stop all tracks in a stream
 */
export const stopStream = (stream: MediaStream | null): void => {
  if (stream) {
    stream.getTracks().forEach((track) => {
      track.stop();
    });
  }
};

