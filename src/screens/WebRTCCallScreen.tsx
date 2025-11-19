import React, { useEffect, useState, useRef } from 'react';
import {
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import SocketIOClient, { Socket } from 'socket.io-client';
import {
  mediaDevices,
  RTCPeerConnection,
  RTCView,
  RTCIceCandidate,
  RTCSessionDescription,
  MediaStream,
} from 'react-native-webrtc';
import InCallManager from 'react-native-incall-manager';
import TextInputContainer from '../components/TextInputContainer';
import IconContainer from '../components/IconContainer';
import CallAnswer from '../asset/CallAnswer';
import CallEnd from '../asset/CallEnd';
import MicOn from '../asset/MicOn';
import MicOff from '../asset/MicOff';
import VideoOn from '../asset/VideoOn';
import VideoOff from '../asset/VideoOff';
import CameraSwitch from '../asset/CameraSwitch';
import { SERVER_URL, getAlternativeURLs } from '../config/server';
import type { NavigationProps } from '../types/navigation';
import { colors } from '../styles/colors';

const ICE_SERVERS = [
  {
    urls: 'stun:stun.l.google.com:19302',
  },
  {
    urls: 'stun:stun1.l.google.com:19302',
  },
  {
    urls: 'stun:stun2.l.google.com:19302',
  },
];

type CallType = 'JOIN' | 'INCOMING_CALL' | 'OUTGOING_CALL' | 'WEBRTC_ROOM';
type FacingMode = 'user' | 'environment';

interface CleanupCallOptions {
  notifyRemote?: boolean;
  resetForReuse?: boolean;
  reason?: string;
}

const WebRTCCallScreen: React.FC<NavigationProps<'WebRTCCall'>> = ({ navigation }) => {
  const [type, setType] = useState<CallType>('JOIN');
  const [callerId] = useState<string>(
    Math.floor(100000 + Math.random() * 900000).toString(),
  );
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [localMicOn, setLocalMicOn] = useState<boolean>(true);
  const [localWebcamOn, setLocalWebcamOn] = useState<boolean>(true);
  const [isSpeakerOn, setIsSpeakerOn] = useState<boolean>(true);
  const [otherUserIdInput, setOtherUserIdInput] = useState<string>('');
  const [isSocketConnected, setIsSocketConnected] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('Initializing...');
  const [canInitiateCall, setCanInitiateCall] = useState<boolean>(true);

  const otherUserId = useRef<string | null>(null);
  const remoteRTCMessage = useRef<RTCSessionDescription | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const isCaller = useRef<boolean>(false);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const facingModeRef = useRef<FacingMode>('user');
  const currentServerURL = useRef<string>(SERVER_URL);
  const alternativeURLs = useRef<string[]>(getAlternativeURLs());
  const connectionAttempts = useRef<number>(0);
  const pendingRemoteCandidates = useRef<RTCIceCandidate[]>([]);
  const [lastDialedId, setLastDialedId] = useState<string>('');
  const ringingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Log available alternatives on mount
  useEffect(() => {
    console.log('🔧 Available server URLs to try:', alternativeURLs.current.length);
    console.log('📋 URLs:', alternativeURLs.current);
  }, []);

  // Initialize Socket and WebRTC
  useEffect(() => {
    // Function to attach common event handlers
    const attachSocketHandlers = (socket: Socket) => {
      socket.on('reconnect_attempt', (attemptNumber: number) => {
        console.log('Reconnection attempt:', attemptNumber);
      });

      socket.on('reconnect', (attemptNumber: number) => {
        console.log('Reconnected after', attemptNumber, 'attempts');
        setIsSocketConnected(true);
      });

      socket.on('reconnect_error', (error: Error) => {
        console.log('Reconnection error:', error.message || error);
      });

      socket.on('reconnect_failed', () => {
        console.log('Failed to reconnect to server');
      });

      socket.on('disconnect', (reason: string) => {
        console.log('Socket disconnected:', reason);
        setIsSocketConnected(false);
        if (reason === 'io server disconnect') {
          // Server disconnected the socket, reconnect manually
          socket.connect();
        }
      });
    };

    // Function to create socket connection with all handlers
    const createSocket = (url: string) => {
      console.log('🔌 Attempting to connect to:', url, 'with callerId:', callerId);
      const socket = SocketIOClient(url, {
        transports: ['websocket', 'polling'], // Fallback to polling if websocket fails
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 1000,
        timeout: 10000,
        query: {
          callerId,
        },
      });

      socket.on('connect', () => {
        console.log('✅ Socket connected with ID:', socket.id, 'Transport:', socket.io.engine.transport.name);
        console.log('✅ Connected to server:', url);
        currentServerURL.current = url;
        setIsSocketConnected(true);
        connectionAttempts.current = 0;
        setConnectionStatus(`Connected to ${url.replace('http://', '')}`);
      });

      socket.on('connect_error', (error: Error) => {
        console.log('❌ Connection failed to:', url);
        console.log('Error:', error.message || error);
        
        // Try next alternative URL
        if (connectionAttempts.current < alternativeURLs.current.length) {
          const nextURL = alternativeURLs.current[connectionAttempts.current];
          connectionAttempts.current++;
          const attemptText = `Trying ${connectionAttempts.current}/${alternativeURLs.current.length}: ${nextURL.replace('http://', '')}`;
          console.log(`🔄 ${attemptText}`);
          console.log(`📊 Remaining attempts: ${alternativeURLs.current.length - connectionAttempts.current}`);
          setConnectionStatus(attemptText);
          
          // Disconnect current socket
          socket.disconnect();
          
          // Try next URL after a short delay
          setTimeout(() => {
            const newSocket = createSocket(nextURL);
            attachSocketHandlers(newSocket);
            socketRef.current = newSocket;
          }, 1500); // Slightly longer delay to ensure previous socket is cleaned up
        } else {
          // All URLs failed
          console.log('❌ All connection attempts failed');
          console.log(`📊 Tried ${connectionAttempts.current} URLs`);
          console.log('📋 Troubleshooting:');
          console.log('1. Make sure server is running: cd server && npm start');
          console.log('2. Find your computer IP: ifconfig (Mac/Linux) or ipconfig (Windows)');
          console.log('3. Ensure both devices are on the same Wi-Fi network');
          console.log('4. Check firewall allows connections on port 3500');
          console.log('5. Try manually setting SERVER_IP environment variable');
          setIsSocketConnected(false);
          setConnectionStatus('Connection failed - Check server and network');
        }
      });

      // Attach other event handlers
      attachSocketHandlers(socket);

      return socket;
    };

    // Start with primary URL
    const socket = createSocket(SERVER_URL);
    socketRef.current = socket;

    initializePeerConnection();

    // Socket event listeners
    socket.on('newCall', (data) => {
      console.log('Incoming call from', data.callerId);
      remoteRTCMessage.current = data.rtcMessage;
      otherUserId.current = data.callerId;
      isCaller.current = false; // We are the callee
      setType('INCOMING_CALL');
      startIncomingRingtone();
      startRingingTimeout();
    });

    socket.on('callAnswered', async (data) => {
      console.log('Call answered by', data.callee);
      remoteRTCMessage.current = data.rtcMessage;
      if (peerConnectionRef.current && remoteRTCMessage.current) {
        await peerConnectionRef.current.setRemoteDescription(
          new RTCSessionDescription(remoteRTCMessage.current),
        );
        flushPendingCandidates();
      }
      stopAllRingSounds();
      InCallManager.setForceSpeakerphoneOn(true);
      setIsSpeakerOn(true);
      // Ensure call manager is started when call is answered
      InCallManager.start({ media: 'video' });
      setType('WEBRTC_ROOM');
    });
    socket.on('callEnded', handleRemoteHangup);
    socket.on('callRejected', handleCallRejected);

    socket.on('ICEcandidate', (data) => {
      console.log('Received ICE candidate from', data.sender);
      let message = data.rtcMessage;
      if (peerConnectionRef.current) {
        if (peerConnectionRef.current.remoteDescription) {
          const iceCandidate = new RTCIceCandidate({
            candidate: message.candidate,
            sdpMLineIndex: message.label,
            sdpMid: message.id,
          });
          peerConnectionRef.current
            .addIceCandidate(iceCandidate)
            .then(() => {
              console.log('ICE candidate added successfully');
            })
            .catch((err) => {
              console.log('Error adding ICE candidate:', err);
            });
        } else {
          console.log('Remote description not set yet, queueing ICE candidate');
          pendingRemoteCandidates.current.push(message);
        }
      }
    });

    initializeLocalStream();

    return () => {
      cleanupCall({ notifyRemote: false, resetForReuse: false });
      socket.off('callEnded', handleRemoteHangup);
      socket.off('callRejected', handleCallRejected);
      socket.off('newCall');
      socket.off('callAnswered');
      socket.off('ICEcandidate');
      socket.disconnect();
    };
  }, []);

  async function getVideoSourceId(facingMode: FacingMode): Promise<string | null> {
    try {
      const sourceInfos = await mediaDevices.enumerateDevices() as any[];
      for (let i = 0; i < sourceInfos.length; i++) {
        const sourceInfo = sourceInfos[i] as any;
        if (
          sourceInfo.kind === 'videoinput' &&
          sourceInfo.facing === facingMode
        ) {
          return sourceInfo.deviceId;
        }
      }
    } catch (error: any) {
      console.log('Error enumerating media devices:', error?.message || error);
    }
    return null;
  }

  function initializePeerConnection() {
    if (peerConnectionRef.current) {
      try {
        peerConnectionRef.current.getSenders().forEach((sender) => {
          try {
            if (peerConnectionRef.current) {
              peerConnectionRef.current.removeTrack(sender);
            }
          } catch (err: any) {
            console.log('Error removing sender:', err?.message || err);
          }
        });
        (peerConnectionRef.current as any).ontrack = null;
        (peerConnectionRef.current as any).onicecandidate = null;
        peerConnectionRef.current.close();
      } catch (error: any) {
        console.log('Error cleaning previous peer connection:', error?.message || error);
      }
    }

    const peerConnection = new RTCPeerConnection({
      iceServers: ICE_SERVERS,
    });

    (peerConnection as any).ontrack = (event: any) => {
      const [stream] = event.streams;
      if (stream) {
        remoteStreamRef.current = stream;
        setRemoteStream(stream);
      }
    };

    (peerConnection as any).onicecandidate = (event: any) => {
      if (event.candidate && otherUserId.current) {
        const iceData: { rtcMessage: any; calleeId?: string; callerId?: string } = {
          rtcMessage: {
            label: event.candidate.sdpMLineIndex,
            id: event.candidate.sdpMid,
            candidate: event.candidate.candidate,
          },
        };
        if (isCaller.current) {
          iceData.calleeId = otherUserId.current;
        } else {
          iceData.callerId = otherUserId.current;
        }
        console.log('Sending ICE candidate to', otherUserId.current, 'isCaller:', isCaller.current);
        sendICEcandidate(iceData);
      } else {
        console.log('End of candidates.');
      }
    };

    peerConnectionRef.current = peerConnection;

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStreamRef.current!);
      });
    }
  }

  function flushPendingCandidates() {
    if (
      pendingRemoteCandidates.current.length &&
      peerConnectionRef.current &&
      peerConnectionRef.current.remoteDescription
    ) {
      const queue = [...pendingRemoteCandidates.current];
      pendingRemoteCandidates.current = [];
      queue.forEach((message: any) => {
        const iceCandidate = new RTCIceCandidate({
          candidate: message.candidate,
          sdpMLineIndex: message.label,
          sdpMid: message.id,
        });
        if (peerConnectionRef.current) {
          peerConnectionRef.current
            .addIceCandidate(iceCandidate)
            .then(() => {
              console.log('Queued ICE candidate added successfully');
            })
            .catch((err: any) => {
              console.log('Error adding queued ICE candidate:', err?.message || err);
            });
        }
      });
    }
  }

  async function initializeLocalStream(facingMode = facingModeRef.current) {
    try {
      const videoSourceId = await getVideoSourceId(facingMode);
      const stream = await mediaDevices.getUserMedia({
        audio: true,
        video: {
          width: { min: 500 },
          height: { min: 300 },
          frameRate: { min: 30 },
          facingMode,
          ...(videoSourceId ? { sourceId: videoSourceId } : {}),
        } as any,
      });
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      localStreamRef.current = stream;
      setLocalStream(stream);
      if (peerConnectionRef.current) {
        stream.getTracks().forEach((track) => {
          peerConnectionRef.current!.addTrack(track, stream);
        });
      }
    } catch (error: any) {
      console.log('Error getting user media:', error?.message || error);
    }
  }

  function cleanupCall({ notifyRemote = false, resetForReuse = true, reason = '' }: CleanupCallOptions = {}) {
    console.log('Cleaning up call state', reason);
    if (notifyRemote && socketRef.current) {
      const targetId = otherUserId.current || lastDialedId;
      if (targetId) {
        socketRef.current.emit('leaveCall', {
          targetId,
        });
      }
    }
    stopAllRingSounds();
    if (ringingTimeoutRef.current) {
      clearTimeout(ringingTimeoutRef.current);
      ringingTimeoutRef.current = null;
    }
    InCallManager.stop();
    remoteRTCMessage.current = null;
    isCaller.current = false;

    if (peerConnectionRef.current) {
      try {
        if (peerConnectionRef.current) {
          peerConnectionRef.current.getSenders().forEach((sender) => {
            try {
              if (peerConnectionRef.current) {
                peerConnectionRef.current.removeTrack(sender);
              }
            } catch (err: any) {
              console.log('Error removing sender during cleanup:', err?.message || err);
            }
          });
        }
        peerConnectionRef.current.close();
      } catch (error: any) {
        console.log('Error closing peer connection:', error?.message || error);
      } finally {
        peerConnectionRef.current = null;
      }
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    setLocalStream(null);

    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((track) => track.stop?.());
      remoteStreamRef.current = null;
    }
    setRemoteStream(null);

    pendingRemoteCandidates.current = [];

    otherUserId.current = null;
    facingModeRef.current = 'user';
    setIsSpeakerOn(true);
    InCallManager.setForceSpeakerphoneOn(true);

    if (resetForReuse) {
      initializePeerConnection();
      initializeLocalStream();
      setConnectionStatus(`Connected to ${currentServerURL.current.replace('http://', '')}`);
    }

    const lastDialed = lastDialedId;
    if (lastDialed) {
      otherUserId.current = lastDialed;
      setOtherUserIdInput(lastDialed);
    } else {
      setOtherUserIdInput('');
    }
    setType('JOIN');
    setCanInitiateCall(true);
  }

  function handleRemoteHangup(data: { sender?: string }) {
    console.log('Remote user ended the call', data?.sender);
    cleanupCall({ notifyRemote: false, reason: 'Remote hangup' });
    setConnectionStatus('Call ended by remote user');
  }

  function handleCallRejected(data: { callee?: string }) {
    console.log('Call rejected by', data?.callee);
    cleanupCall({ notifyRemote: false, reason: 'Call rejected' });
    setConnectionStatus('Call rejected by other user');
  }

  function stopAllRingSounds() {
    try {
      InCallManager.stopRingback();
    } catch (error: any) {
      console.log('Error stopping ringback:', error?.message || error);
    }
    try {
      InCallManager.stopRingtone();
    } catch (error: any) {
      console.log('Error stopping ringtone:', error?.message || error);
    }
  }

  function startOutgoingRingback() {
    try {
      InCallManager.startRingback('_DTMF_'); // short ring-back beep for caller
    } catch (error: any) {
      console.log('Error starting ringback:', error?.message || error);
    }
  }

  function startIncomingRingtone() {
    try {
      InCallManager.startRingtone('_DEFAULT_');
    } catch (error: any) {
      console.log('Error starting ringtone:', error?.message || error);
    }
  }

  function startRingingTimeout() {
    if (ringingTimeoutRef.current) {
      clearTimeout(ringingTimeoutRef.current);
    }
    ringingTimeoutRef.current = setTimeout(() => {
      console.log('Ringing timeout reached – ending call');
      stopAllRingSounds();
      cleanupCall({ notifyRemote: true, reason: 'Ringing timeout', resetForReuse: true });
      setConnectionStatus('Call timed out (no answer)');
    }, 30000); // 30 seconds
  }

  // Process call (initiate)
  async function processCall() {
    if (!peerConnectionRef.current) {
      console.error('Cannot initiate call: Peer connection not ready');
      return;
    }

    if (!isSocketConnected) {
      console.error('Cannot initiate call: Socket not connected to server');
      console.error('Please check:');
      console.error('1. Server is running');
      console.error('2. SERVER_URL is correct:', SERVER_URL);
      console.error('3. Network connectivity');
      return;
    }

    if (!canInitiateCall) {
      console.log('Call already in progress – ignoring new attempt');
      return;
    }

    console.log('Initiating call to', otherUserId.current);
    isCaller.current = true; // We are the caller
    const currentDialTarget =
      otherUserId.current || otherUserIdInput || '';
    if (currentDialTarget) {
      setLastDialedId(currentDialTarget);
    }
    setCanInitiateCall(false);
    
    // Start call manager for audio routing and proximity sensor
    InCallManager.start({ media: 'video' });
    InCallManager.setForceSpeakerphoneOn(true);
    setIsSpeakerOn(true);
    
    const sessionDescription = await peerConnectionRef.current.createOffer();
    await peerConnectionRef.current.setLocalDescription(sessionDescription);

    if (otherUserId.current) {
      sendCall({
        calleeId: otherUserId.current,
        rtcMessage: sessionDescription,
      });
    }
    startOutgoingRingback();
    startRingingTimeout();
  }

  // Process accept (answer call)
  async function processAccept() {
    if (!peerConnectionRef.current || !remoteRTCMessage.current) return;

    console.log('Answering call from', otherUserId.current);
    isCaller.current = false; // We are the callee
    await peerConnectionRef.current.setRemoteDescription(
      new RTCSessionDescription(remoteRTCMessage.current),
    );
    flushPendingCandidates();
    if (ringingTimeoutRef.current) {
      clearTimeout(ringingTimeoutRef.current);
      ringingTimeoutRef.current = null;
    }
      stopAllRingSounds();
      if (ringingTimeoutRef.current) {
        clearTimeout(ringingTimeoutRef.current);
        ringingTimeoutRef.current = null;
      }

    const sessionDescription = await peerConnectionRef.current.createAnswer();
    await peerConnectionRef.current.setLocalDescription(sessionDescription);

    // Start call manager for audio routing and proximity sensor
    InCallManager.start({ media: 'video' });
    InCallManager.setForceSpeakerphoneOn(true);
    setIsSpeakerOn(true);

    if (otherUserId.current) {
      answerCall({
        callerId: otherUserId.current,
        rtcMessage: sessionDescription,
      });
    }
    
    setType('WEBRTC_ROOM');
  }

  function answerCall(data: { callerId: string; rtcMessage: RTCSessionDescription }) {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('answerCall', data);
      console.log('Answer signal sent to server');
    } else {
      console.error('Cannot answer call: Socket not connected');
    }
  }

  function sendCall(data: { calleeId: string; rtcMessage: RTCSessionDescription }) {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('call', data);
      console.log('Call signal sent to server');
    } else {
      console.error('Cannot send call: Socket not connected');
    }
  }

  function sendICEcandidate(data: { calleeId?: string; callerId?: string; rtcMessage: RTCIceCandidate }) {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('ICEcandidate', data);
    } else {
      console.warn('Cannot send ICE candidate: Socket not connected');
    }
  }

  // Switch Camera
  async function switchCamera() {
    if (!localStreamRef.current) {
      return;
    }
    const nextFacing =
      facingModeRef.current === 'user' ? 'environment' : 'user';
    try {
      const videoSourceId = await getVideoSourceId(nextFacing);
      const videoStream = await mediaDevices.getUserMedia({
        audio: false,
        video: {
          width: { min: 500 },
          height: { min: 300 },
          frameRate: { min: 30 },
          facingMode: nextFacing,
          ...(videoSourceId ? { sourceId: videoSourceId } : {}),
        } as any,
      });
      const newVideoTrack = videoStream.getVideoTracks()[0];
      if (!newVideoTrack) {
        console.log('No video track available for camera switch');
        return;
      }

      facingModeRef.current = nextFacing;

      const videoSender = peerConnectionRef.current
        ?.getSenders()
        ?.find((sender) => sender.track && sender.track.kind === 'video');

      if (videoSender) {
        await videoSender.replaceTrack(newVideoTrack);
      } else if (peerConnectionRef.current) {
        peerConnectionRef.current.addTrack(newVideoTrack, localStreamRef.current);
      }

      if (localStreamRef.current) {
        localStreamRef.current.getVideoTracks().forEach((track) => {
          track.stop();
          localStreamRef.current!.removeTrack(track);
        });
      }
      localStreamRef.current.addTrack(newVideoTrack);

      const updatedStream = new MediaStream(localStreamRef.current);
      localStreamRef.current = updatedStream;
      setLocalStream(updatedStream);
    } catch (error: any) {
      console.log('Error switching camera:', error?.message || error);
    }
  }

  // Enable/Disable Camera
  function toggleCamera() {
    if (localStreamRef.current) {
      const newState = !localWebcamOn;
      setLocalWebcamOn(newState);
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = newState;
      });
    }
  }

  // Enable/Disable Mic
  function toggleMic() {
    if (localStreamRef.current) {
      const newState = !localMicOn;
      setLocalMicOn(newState);
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = newState;
      });
      try {
        InCallManager.setMicrophoneMute(!newState);
      } catch (error: any) {
        console.log('Error toggling microphone mute:', error?.message || error);
      }
    }
  }

  function toggleSpeaker() {
    const newState = !isSpeakerOn;
    setIsSpeakerOn(newState);
    try {
      InCallManager.setForceSpeakerphoneOn(newState);
    } catch (error: any) {
      console.log('Error toggling speakerphone:', error?.message || error);
    }
  }

  // Destroy WebRTC Connection
  function leave() {
    cleanupCall({ notifyRemote: true, reason: 'Local hangup' });
  }

  function rejectIncomingCall() {
    console.log('Rejecting incoming call');
    if (socketRef.current && socketRef.current.connected && otherUserId.current) {
      socketRef.current.emit('rejectCall', {
        callerId: otherUserId.current,
      });
    }
    stopAllRingSounds();
    cleanupCall({ notifyRemote: false, reason: 'Rejected incoming call' });
    setConnectionStatus('You rejected the call');
  }

  const JoinScreen = () => {
    const effectiveDialTarget =
      (otherUserIdInput && otherUserIdInput.trim()) ||
      lastDialedId ||
      '';
    
    const statusIndicatorStyle: StyleProp<ViewStyle> = [
      styles.statusIndicator,
      { backgroundColor: isSocketConnected ? colors.success : colors.danger },
    ];

    const callButtonStyle: StyleProp<ViewStyle> = [
      styles.callButton,
      {
        backgroundColor:
          isSocketConnected && effectiveDialTarget && canInitiateCall
            ? '#5568FE'
            : '#555555',
        opacity:
          isSocketConnected && effectiveDialTarget && canInitiateCall
            ? 1
            : 0.5,
      },
    ];

    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.joinContainer}>
        {/* Connection Status Indicator */}
        <View style={statusIndicatorStyle}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>{connectionStatus}</Text>
        </View>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View>
            <View style={styles.callerIdCard}>
              <Text style={styles.callerIdLabel}>Your Caller ID</Text>
              <View style={styles.callerIdRow}>
                <Text style={styles.callerIdValue}>{callerId}</Text>
              </View>
            </View>

            <View style={styles.inputCard}>
              <Text style={styles.inputLabel}>Enter call id of another user</Text>
              <TextInputContainer
                placeholder={'Enter Caller ID'}
                value={otherUserIdInput}
                setValue={(text: string) => {
                  setOtherUserIdInput(text);
                  otherUserId.current = text;
                }}
                keyboardType={'number-pad'}
              />
              {!isSocketConnected && (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorText}>
                    Not connected to server. Please check your connection.
                  </Text>
                </View>
              )}
              <TouchableOpacity
                onPress={() => {
                  if (!effectiveDialTarget) {
                    return;
                  }
                  if (!isSocketConnected) {
                    console.error('Cannot call: Socket not connected');
                    return;
                  }
                  otherUserId.current = effectiveDialTarget;
                  setOtherUserIdInput(effectiveDialTarget);
                  processCall();
                  setType('OUTGOING_CALL');
                }}
                disabled={
                  !isSocketConnected || !effectiveDialTarget || !canInitiateCall
                }
                style={callButtonStyle}>
                <Text style={styles.callButtonText}>
                  {!isSocketConnected
                    ? 'Connecting...'
                    : !effectiveDialTarget
                    ? 'Enter Caller ID'
                    : canInitiateCall
                    ? 'Call Now'
                    : 'Preparing...'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    );
  };

  const OutgoingCallScreen = () => {
    return (
      <View style={styles.outgoingCallContainer}>
        <View style={styles.outgoingCallContent}>
          <Text style={styles.outgoingCallLabel}>Calling to...</Text>
          <Text style={styles.outgoingCallId}>{otherUserId.current}</Text>
        </View>
        <View style={styles.outgoingCallActions}>
          <TouchableOpacity
            onPress={() => {
              leave();
            }}
            style={styles.hangupButton}>
            <CallEnd width={50} height={50} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const IncomingCallScreen = () => {
    return (
      <View style={styles.incomingCallContainer}>
        <View style={styles.incomingCallContent}>
          <Text style={styles.incomingCallText}>
            {otherUserId.current} is calling..
          </Text>
        </View>
        <View style={styles.incomingCallActions}>
          <TouchableOpacity
            onPress={() => {
              rejectIncomingCall();
            }}
            style={[styles.rejectButton, styles.callActionButton]}>
            <CallEnd width={32} height={32} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              processAccept();
            }}
            style={[styles.acceptButton, styles.callActionButton]}>
            <CallAnswer width={60} height={60} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const WebrtcRoomScreen = () => {
    const micIconStyle: StyleProp<ViewStyle> = [
      styles.iconButtonBorder,
      { backgroundColor: !localMicOn ? colors.white : 'transparent' },
    ];

    const videoIconStyle: StyleProp<ViewStyle> = [
      styles.iconButtonBorder,
      { backgroundColor: !localWebcamOn ? colors.white : 'transparent' },
    ];

    const speakerIconStyle: StyleProp<ViewStyle> = [
      styles.iconButtonBorder,
      { backgroundColor: isSpeakerOn ? '#5568FE' : 'transparent' },
    ];

    const speakerTextStyle: StyleProp<TextStyle> = [
      styles.speakerText,
      { color: isSpeakerOn ? colors.white : '#1D2939' },
    ];

    return (
      <View style={styles.webrtcRoomContainer}>
        {localStream ? (
          <RTCView
            objectFit={'cover'}
            style={styles.localRTCView}
            streamURL={localStream.toURL()}
          />
        ) : null}
        {remoteStream ? (
          <RTCView
            objectFit={'cover'}
            style={styles.remoteRTCView}
            streamURL={remoteStream.toURL()}
          />
        ) : null}
        <View style={styles.controlBar}>
          <IconContainer
            backgroundColor={colors.danger}
            onPress={() => {
              leave();
            }}
            Icon={() => {
              return <CallEnd width={26} height={26} />;
            }}
          />
          <IconContainer
            style={micIconStyle}
            backgroundColor={!localMicOn ? colors.white : 'transparent'}
            onPress={() => {
              toggleMic();
            }}
            Icon={() => {
              return localMicOn ? (
                <MicOn width={24} height={24} />
              ) : (
                <MicOff width={28} height={28} fill="#1D2939" />
              );
            }}
          />
          <IconContainer
            style={videoIconStyle}
            backgroundColor={!localWebcamOn ? colors.white : 'transparent'}
            onPress={() => {
              toggleCamera();
            }}
            Icon={() => {
              return localWebcamOn ? (
                <VideoOn width={24} height={24} fill="#FFF" />
              ) : (
                <VideoOff width={36} height={36} fill="#1D2939" />
              );
            }}
          />
          <IconContainer
            style={speakerIconStyle}
            backgroundColor={isSpeakerOn ? '#5568FE' : 'transparent'}
            onPress={() => {
              toggleSpeaker();
            }}
            Icon={() => {
              return (
                <Text style={speakerTextStyle}>
                  {isSpeakerOn ? 'SPK' : 'EAR'}
                </Text>
              );
            }}
          />
          <IconContainer
            style={styles.iconButtonBorder}
            backgroundColor={'transparent'}
            onPress={() => {
              switchCamera();
            }}
            Icon={() => {
              return <CameraSwitch width={24} height={24} fill="#FFF" />;
            }}
          />
        </View>
      </View>
    );
  };

  switch (type) {
    case 'JOIN':
      return JoinScreen();
    case 'INCOMING_CALL':
      return IncomingCallScreen();
    case 'OUTGOING_CALL':
      return OutgoingCallScreen();
    case 'WEBRTC_ROOM':
      return WebrtcRoomScreen();
    default:
      return JoinScreen();
  }
};

const styles = StyleSheet.create({
  // Join Screen Styles
  joinContainer: {
    flex: 1,
    backgroundColor: '#050A0E',
    justifyContent: 'center',
    paddingHorizontal: 42,
  },
  statusIndicator: {
    position: 'absolute',
    top: 50,
    left: 42,
    right: 42,
    zIndex: 1000,
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.white,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    color: colors.white,
    fontWeight: '600',
  },
  callerIdCard: {
    padding: 35,
    backgroundColor: '#1A1C22',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14,
  },
  callerIdLabel: {
    fontSize: 18,
    color: '#D0D4DD',
  },
  callerIdRow: {
    flexDirection: 'row',
    marginTop: 12,
    alignItems: 'center',
  },
  callerIdValue: {
    fontSize: 32,
    color: colors.white,
    letterSpacing: 6,
  },
  inputCard: {
    backgroundColor: '#1A1C22',
    padding: 40,
    marginTop: 25,
    justifyContent: 'center',
    borderRadius: 14,
  },
  inputLabel: {
    fontSize: 18,
    color: '#D0D4DD',
  },
  errorBanner: {
    backgroundColor: colors.danger,
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  errorText: {
    fontSize: 14,
    color: colors.white,
    textAlign: 'center',
  },
  callButton: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    marginTop: 16,
  },
  callButtonText: {
    fontSize: 16,
    color: colors.white,
  },
  // Outgoing Call Screen Styles
  outgoingCallContainer: {
    flex: 1,
    justifyContent: 'space-around',
    backgroundColor: '#050A0E',
  },
  outgoingCallContent: {
    padding: 35,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14,
  },
  outgoingCallLabel: {
    fontSize: 16,
    color: '#D0D4DD',
  },
  outgoingCallId: {
    fontSize: 36,
    marginTop: 12,
    color: colors.white,
    letterSpacing: 6,
  },
  outgoingCallActions: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  hangupButton: {
    backgroundColor: colors.danger,
    borderRadius: 30,
    height: 60,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Incoming Call Screen Styles
  incomingCallContainer: {
    flex: 1,
    justifyContent: 'space-around',
    backgroundColor: '#050A0E',
  },
  incomingCallContent: {
    padding: 35,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14,
  },
  incomingCallText: {
    fontSize: 36,
    marginTop: 12,
    color: colors.white,
  },
  incomingCallActions: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  callActionButton: {
    borderRadius: 30,
    height: 60,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectButton: {
    backgroundColor: colors.danger,
    marginRight: 24,
  },
  acceptButton: {
    backgroundColor: colors.success,
  },
  // WebRTC Room Screen Styles
  webrtcRoomContainer: {
    flex: 1,
    backgroundColor: '#050A0E',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  localRTCView: {
    flex: 1,
    backgroundColor: '#050A0E',
  },
  remoteRTCView: {
    flex: 1,
    backgroundColor: '#050A0E',
    marginTop: 8,
  },
  controlBar: {
    marginVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  iconButtonBorder: {
    borderWidth: 1.5,
    borderColor: '#2B3034',
  },
  speakerText: {
    fontSize: 16,
    fontWeight: '700',
  },
});

export default WebRTCCallScreen;

