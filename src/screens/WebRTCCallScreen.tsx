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
  BackHandler,
  Animated,
  Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import { Socket } from 'socket.io-client';
import { useSocket } from '../context/SocketContext';
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
import { SERVER_URL } from '../config/server';
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

enum CallType {
  JOIN = 'JOIN',
  INCOMING_CALL = 'INCOMING_CALL',
  OUTGOING_CALL = 'OUTGOING_CALL',
  WEBRTC_ROOM = 'WEBRTC_ROOM',
}

type FacingMode = 'user' | 'environment';

interface CleanupCallOptions {
  notifyRemote?: boolean;
  resetForReuse?: boolean;
  reason?: string;
}

const WebRTCCallScreen: React.FC<NavigationProps<'WebRTCCall'>> = ({
  navigation,
  route,
}) => {
  const { socket, isSocketConnected, callerId, connectionStatus } = useSocket();
  const incomingCallData = route?.params?.incomingCallData;
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [localMicOn, setLocalMicOn] = useState<boolean>(true);
  const [localWebcamOn, setLocalWebcamOn] = useState<boolean>(true);
  const [isSpeakerOn, setIsSpeakerOn] = useState<boolean>(true);
  const [otherUserIdInput, setOtherUserIdInput] = useState<string>('');
  const [canInitiateCall, setCanInitiateCall] = useState<boolean>(true);
  const [isLocalVideoFloating, setIsLocalVideoFloating] =
    useState<boolean>(true);
  // Minimal render trigger - only increments when screen needs to change
  const [renderTrigger, setRenderTrigger] = useState<number>(0);

  const otherUserId = useRef<string | null>(null);
  const remoteRTCMessage = useRef<RTCSessionDescription | null>(null);
  // socketRef is now coming from context, but we keep a local ref for compatibility with existing code structure if needed,
  // or better yet, just use the socket from context directly.
  // However, existing code uses socketRef.current widely.
  // Let's keep socketRef but sync it with context socket.
  const socketRef = useRef<Socket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const isCaller = useRef<boolean>(false);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const facingModeRef = useRef<FacingMode>('user');

  const pendingRemoteCandidates = useRef<RTCIceCandidate[]>([]);
  const [lastDialedId, setLastDialedId] = useState<string>('');
  const ringingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentCallTypeRef = useRef<CallType>(CallType.JOIN);
  const isMountedRef = useRef<boolean>(true);
  const isCleaningUpRef = useRef<boolean>(false);

  // Animation values for draggable call screen
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } =
    Dimensions.get('window');

  // Animation refs for call screens (moved to parent to avoid hooks violation)
  const outgoingCallScale = useRef(new Animated.Value(1)).current;
  const incomingCallScale = useRef(new Animated.Value(1)).current;
  const incomingCallRotation = useRef(new Animated.Value(0)).current;

  // Animation refs for draggable local video (picture-in-picture)
  // Initialize to 0, we will set offset in useEffect
  const localVideoTranslateX = useRef(new Animated.Value(0)).current;
  const localVideoTranslateY = useRef(new Animated.Value(0)).current;

  // Set initial position
  useEffect(() => {
    localVideoTranslateX.setOffset(SCREEN_WIDTH - 140);
    localVideoTranslateY.setOffset(100);
  }, []);

  // Helper function to update call type without causing unnecessary re-renders
  const updateCallType = (newType: CallType) => {
    if (currentCallTypeRef.current !== newType) {
      currentCallTypeRef.current = newType;
      // Only trigger re-render when screen actually needs to change
      setRenderTrigger(prev => prev + 1);
    }
  };

  // Get current call type (for switch statement)
  const currentCallType = currentCallTypeRef.current;

  // Sync socket from context to local ref
  useEffect(() => {
    socketRef.current = socket;
  }, [socket]);

  // Handle incoming call data from navigation
  useEffect(() => {
    if (incomingCallData && socket) {
      console.log('📱 Handling incoming call data:', incomingCallData);
      remoteRTCMessage.current = incomingCallData.rtcMessage;
      otherUserId.current = incomingCallData.callerId;
      isCaller.current = false;
      updateCallType(CallType.INCOMING_CALL);
      startIncomingRingtone();
      startRingingTimeout();
    }
  }, [incomingCallData, socket]);

  // Helper function to safely set state only if component is mounted
  const safeSetState = <T,>(setter: (value: T) => void, value: T) => {
    if (isMountedRef.current) {
      setter(value);
    }
  };

  // Log available alternatives on mount
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Animation effects for call screens
  useEffect(() => {
    let outgoingAnimation: Animated.CompositeAnimation | null = null;
    let incomingAnimation: Animated.CompositeAnimation | null = null;

    if (currentCallTypeRef.current === CallType.OUTGOING_CALL) {
      // Pulse animation for outgoing call
      outgoingAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(outgoingCallScale, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(outgoingCallScale, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      );
      outgoingAnimation.start();
    } else {
      outgoingCallScale.setValue(1);
    }

    if (currentCallTypeRef.current === CallType.INCOMING_CALL) {
      // Pulse and rotate animation for incoming call
      incomingAnimation = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(incomingCallScale, {
              toValue: 1.15,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(incomingCallRotation, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(incomingCallScale, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(incomingCallRotation, {
              toValue: 0,
              duration: 800,
              useNativeDriver: true,
            }),
          ]),
        ]),
      );
      incomingAnimation.start();
    } else {
      incomingCallScale.setValue(1);
      incomingCallRotation.setValue(0);
    }

    return () => {
      if (outgoingAnimation) {
        outgoingAnimation.stop();
      }
      if (incomingAnimation) {
        incomingAnimation.stop();
      }
    };
  }, [renderTrigger]);

  // Handle back button press
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        console.log('Back button pressed');
        // If in a call, end it first
        if (
          currentCallTypeRef.current === CallType.WEBRTC_ROOM ||
          currentCallTypeRef.current === CallType.OUTGOING_CALL ||
          currentCallTypeRef.current === CallType.INCOMING_CALL
        ) {
          leave();
          return true; // Prevent default back action
        }
        // Otherwise allow navigation back
        return false;
      };

      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress,
      );
      return () => backHandler.remove();
    }, []),
  );

  // Initialize WebRTC (PeerConnection and LocalStream) - Run ONCE on mount
  useEffect(() => {
    initializePeerConnection();
    initializeLocalStream();

    return () => {
      console.log('🧹 Component unmounting - cleaning up WebRTC...');
      isMountedRef.current = false;

      // Stop all timers first
      if (ringingTimeoutRef.current) {
        clearTimeout(ringingTimeoutRef.current);
        ringingTimeoutRef.current = null;
      }

      // Stop all ring sounds
      try {
        InCallManager.stopRingback();
        InCallManager.stopRingtone();
        InCallManager.stop();
      } catch (error: any) {
        console.log('Error stopping InCallManager:', error?.message || error);
      }

      // Cleanup peer connection
      if (peerConnectionRef.current) {
        try {
          (peerConnectionRef.current as any).ontrack = null;
          (peerConnectionRef.current as any).onicecandidate = null;
          (peerConnectionRef.current as any).onconnectionstatechange = null;
          (peerConnectionRef.current as any).oniceconnectionstatechange = null;
          peerConnectionRef.current.close();
        } catch (error: any) {
          console.log(
            'Error closing peer connection:',
            error?.message || error,
          );
        } finally {
          peerConnectionRef.current = null;
        }
      }

      // Cleanup streams
      if (localStreamRef.current) {
        try {
          localStreamRef.current.getTracks().forEach(track => track.stop());
        } catch (error: any) {
          console.log(
            'Error stopping local stream tracks:',
            error?.message || error,
          );
        }
        localStreamRef.current = null;
      }

      if (remoteStreamRef.current) {
        try {
          remoteStreamRef.current.getTracks().forEach(track => track.stop?.());
        } catch (error: any) {
          console.log(
            'Error stopping remote stream tracks:',
            error?.message || error,
          );
        }
        remoteStreamRef.current = null;
      }

      console.log('WebRTC Cleanup complete');
    };
  }, []);

  // Attach Socket Listeners - Run when socket changes
  useEffect(() => {
    if (!socket) return;

    console.log('🔌 Attaching socket listeners to ID:', socket.id);

    // Function to attach screen-specific handlers
    const attachScreenHandlers = (socketInstance: Socket) => {
      // Remove existing listeners to avoid duplicates
      socketInstance.off('callAnswered');
      socketInstance.off('callEnded');
      socketInstance.off('callRejected');
      socketInstance.off('ICEcandidate');

      socketInstance.on('callAnswered', async data => {
        console.log('📞 Call answered by', data.callee);
        if (!isMountedRef.current) return;

        remoteRTCMessage.current = data.rtcMessage;

        if (!peerConnectionRef.current) {
          console.error('PeerConnection is null in callAnswered!');
          return;
        }

        if (remoteRTCMessage.current) {
          try {
            const currentState = peerConnectionRef.current.signalingState;
            console.log('Current signaling state:', currentState);

            // Only set remote description if we're in the correct state
            // For an answer, we should be in 'have-local-offer' state
            if (currentState === 'have-local-offer') {
              await peerConnectionRef.current.setRemoteDescription(
                new RTCSessionDescription(remoteRTCMessage.current),
              );
              console.log('Remote description set (Answer)');
              flushPendingCandidates();
            } else if (currentState === 'stable') {
              console.warn(
                'Already in stable state, skipping setRemoteDescription',
              );
              // If already stable, the connection might already be established
              // Just flush any pending candidates
              flushPendingCandidates();
            } else {
              console.error(
                'Unexpected signaling state for answer:',
                currentState,
              );
            }
          } catch (error: any) {
            console.error('Error setting remote description:', error);
          }
        } else {
          console.error('Remote RTC message is missing in callAnswered');
        }

        // Clear the ringing timeout since call is now answered
        if (ringingTimeoutRef.current) {
          clearTimeout(ringingTimeoutRef.current);
          ringingTimeoutRef.current = null;
        }
        stopAllRingSounds();
        InCallManager.setForceSpeakerphoneOn(true);
        setIsSpeakerOn(true);
        // Ensure call manager is started when call is answered
        InCallManager.start({ media: 'video' });
        updateCallType(CallType.WEBRTC_ROOM);

        // Reset local video position
        localVideoTranslateX.setOffset(SCREEN_WIDTH - 140);
        localVideoTranslateX.setValue(0);
        localVideoTranslateY.setOffset(100);
        localVideoTranslateY.setValue(0);
      });

      socketInstance.on('callEnded', handleRemoteHangup);
      socketInstance.on('callRejected', handleCallRejected);

      socketInstance.on('ICEcandidate', async data => {
        console.log('Received ICE candidate from', data.sender);
        if (!isMountedRef.current) return;

        let message = data.rtcMessage;

        if (peerConnectionRef.current) {
          if (peerConnectionRef.current.remoteDescription) {
            const iceCandidate = new RTCIceCandidate({
              candidate: message.candidate,
              sdpMLineIndex: message.label,
              sdpMid: message.id,
            });
            try {
              await peerConnectionRef.current.addIceCandidate(iceCandidate);
              console.log('ICE candidate added successfully');
            } catch (err) {
              console.error('Error adding ICE candidate:', err);
            }
          } else {
            console.log(
              'Remote description not set yet, queueing ICE candidate',
            );
            pendingRemoteCandidates.current.push(message);
          }
        }
      });
    };

    attachScreenHandlers(socket);

    return () => {
      // Cleanup socket listeners only
      if (socket) {
        try {
          socket.off('callEnded');
          socket.off('callRejected');
          socket.off('callAnswered');
          socket.off('ICEcandidate');
          console.log('Socket listeners detached');
        } catch (error: any) {
          console.log(
            'Error cleaning up socket listeners:',
            error?.message || error,
          );
        }
      }
    };
  }, [socket]);

  // Removed local createSocket and attachSocketHandlers functions as they are replaced by context

  /*
  // Function to reconnect socket if disconnected
  function reconnectSocketIfNeeded() {
     // Global socket handles reconnection automatically
  }
  */

  // We need to keep initializePeerConnection and other helper functions
  // but remove the socket creation part.

  async function getVideoSourceId(
    facingMode: FacingMode,
  ): Promise<string | null> {
    try {
      const sourceInfos = (await mediaDevices.enumerateDevices()) as any[];
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
        peerConnectionRef.current.getSenders().forEach(sender => {
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
        (peerConnectionRef.current as any).onconnectionstatechange = null;
        (peerConnectionRef.current as any).oniceconnectionstatechange = null;
        peerConnectionRef.current.close();
      } catch (error: any) {
        console.log(
          'Error cleaning previous peer connection:',
          error?.message || error,
        );
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
        const iceData: {
          rtcMessage: any;
          calleeId?: string;
          callerId?: string;
        } = {
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
        console.log(
          'Sending ICE candidate to',
          otherUserId.current,
          'isCaller:',
          isCaller.current,
        );
        sendICEcandidate(iceData);
      } else {
        console.log('End of candidates.');
      }
    };

    // Monitor connection state changes
    (peerConnection as any).onconnectionstatechange = () => {
      const state = peerConnection.connectionState;
      console.log('Peer connection state changed:', state);

      if (
        state === 'disconnected' ||
        state === 'failed' ||
        state === 'closed'
      ) {
        console.log('Peer connection lost, cleaning up call');
        // Only cleanup if we're in an active call state and not already cleaning up
        const currentType = currentCallTypeRef.current;
        if (
          !isCleaningUpRef.current &&
          (currentType === CallType.WEBRTC_ROOM ||
            currentType === CallType.OUTGOING_CALL ||
            currentType === CallType.INCOMING_CALL)
        ) {
          // Reset canInitiateCall immediately
          if (isMountedRef.current) {
            setCanInitiateCall(true);
            // setConnectionStatus('Call disconnected - Ready to call again');
          }
          cleanupCall({
            notifyRemote: true,
            reason: `Connection ${state}`,
            resetForReuse: true,
          });
        }
      }
    };

    // Monitor ICE connection state changes
    (peerConnection as any).oniceconnectionstatechange = () => {
      const iceState = peerConnection.iceConnectionState;
      console.log('ICE connection state changed:', iceState);

      if (
        iceState === 'disconnected' ||
        iceState === 'failed' ||
        iceState === 'closed'
      ) {
        console.log('ICE connection lost');
        // Only cleanup if we're in an active call state and not already cleaning up
        const currentType = currentCallTypeRef.current;
        if (
          !isCleaningUpRef.current &&
          (currentType === CallType.WEBRTC_ROOM ||
            currentType === CallType.OUTGOING_CALL ||
            currentType === CallType.INCOMING_CALL)
        ) {
          // Reset canInitiateCall immediately
          if (isMountedRef.current) {
            setCanInitiateCall(true);
            // setConnectionStatus('Call disconnected - Ready to call again');
          }
          cleanupCall({
            notifyRemote: true,
            reason: `ICE connection ${iceState}`,
            resetForReuse: true,
          });
        }
      }
    };

    peerConnectionRef.current = peerConnection;

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
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
              console.log(
                'Error adding queued ICE candidate:',
                err?.message || err,
              );
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
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      localStreamRef.current = stream;
      setLocalStream(stream);
      if (peerConnectionRef.current) {
        stream.getTracks().forEach(track => {
          peerConnectionRef.current!.addTrack(track, stream);
        });
      }
    } catch (error: any) {
      console.log('Error getting user media:', error?.message || error);
    }
  }

  // Function to reconnect socket if disconnected
  function reconnectSocketIfNeeded() {
    if (!isMountedRef.current) return;
    if (socket && !socket.connected) {
      console.log('Socket disconnected, attempting to reconnect...');
      // Global socket handles reconnection, but we can trigger it manually if needed
      socket.connect();
    }
  }

  function cleanupCall({
    notifyRemote = false,
    resetForReuse = true,
    reason = '',
  }: CleanupCallOptions = {}) {
    // Don't update state if component is unmounted
    if (!isMountedRef.current) {
      console.log('Component unmounted, skipping state updates');
      return;
    }

    // Prevent multiple simultaneous cleanup calls
    if (isCleaningUpRef.current) {
      console.log('Cleanup already in progress, skipping duplicate cleanup');
      return;
    }

    isCleaningUpRef.current = true;
    console.log('Cleaning up call state', reason);
    if (notifyRemote && socketRef.current && socketRef.current.connected) {
      try {
        const targetId = otherUserId.current || lastDialedId;
        if (targetId) {
          socketRef.current.emit('leaveCall', {
            targetId,
          });
        }
      } catch (error: any) {
        console.log(
          'Error notifying remote of leave:',
          error?.message || error,
        );
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
          peerConnectionRef.current.getSenders().forEach(sender => {
            try {
              if (peerConnectionRef.current) {
                peerConnectionRef.current.removeTrack(sender);
              }
            } catch (err: any) {
              console.log(
                'Error removing sender during cleanup:',
                err?.message || err,
              );
            }
          });
        }
        (peerConnectionRef.current as any).ontrack = null;
        (peerConnectionRef.current as any).onicecandidate = null;
        (peerConnectionRef.current as any).onconnectionstatechange = null;
        (peerConnectionRef.current as any).oniceconnectionstatechange = null;
        peerConnectionRef.current.close();
      } catch (error: any) {
        console.log('Error closing peer connection:', error?.message || error);
      } finally {
        peerConnectionRef.current = null;
      }
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    setLocalStream(null);

    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach(track => track.stop?.());
      remoteStreamRef.current = null;
    }
    setRemoteStream(null);

    pendingRemoteCandidates.current = [];

    otherUserId.current = null;
    facingModeRef.current = 'user';
    setIsSpeakerOn(true);
    InCallManager.setForceSpeakerphoneOn(true);

    // Reset state first to allow UI to update (only if mounted)
    if (isMountedRef.current) {
      updateCallType(CallType.JOIN);
      setCanInitiateCall(true); // Reset immediately to allow new calls
    }

    const lastDialed = lastDialedId;
    if (lastDialed) {
      otherUserId.current = lastDialed;
      setOtherUserIdInput(lastDialed);
    } else {
      setOtherUserIdInput('');
      otherUserId.current = null;
    }

    // Reconnect socket if needed
    reconnectSocketIfNeeded();

    if (resetForReuse) {
      // Reinitialize peer connection and stream asynchronously
      // Don't block the UI update
      setTimeout(() => {
        if (!isMountedRef.current) {
          isCleaningUpRef.current = false;
          return;
        }

        try {
          initializePeerConnection();
          initializeLocalStream()
            .then(() => {
              // Update connection status based on socket state (only if mounted)
              if (isMountedRef.current) {
                if (socketRef.current && socketRef.current.connected) {
                  // setConnectionStatus(`Connected to ${currentServerURL.current.replace('http://', '')}`);
                } else {
                  // setConnectionStatus('Reconnecting to server...');
                }
                // Ensure canInitiateCall is true after reinitialization
                setCanInitiateCall(true);
              }
              isCleaningUpRef.current = false;
            })
            .catch((error: any) => {
              console.error(
                'Error reinitializing local stream:',
                error?.message || error,
              );
              if (isMountedRef.current) {
                // setConnectionStatus('Ready to call - Reinitializing...');
                // Still allow calls even if stream init fails
                setCanInitiateCall(true);
              }
              isCleaningUpRef.current = false;
            });
        } catch (error: any) {
          console.error(
            'Error during reinitialization:',
            error?.message || error,
          );
          if (isMountedRef.current) {
            setCanInitiateCall(true);
          }
          isCleaningUpRef.current = false;
        }
      }, 100); // Small delay to ensure cleanup is complete
    } else {
      // Update connection status based on socket state (only if mounted)
      if (isMountedRef.current) {
        if (socketRef.current && socketRef.current.connected) {
          // setConnectionStatus(`Connected to ${currentServerURL.current.replace('http://', '')}`);
        } else {
          // setConnectionStatus('Reconnecting to server...');
        }
      }
      isCleaningUpRef.current = false;
    }
  }

  function handleRemoteHangup(data: { sender?: string }) {
    console.log('Remote user ended the call', data?.sender);
    cleanupCall({ notifyRemote: false, reason: 'Remote hangup' });
    // setConnectionStatus('Call ended by remote user');
  }

  function handleCallRejected(data: { callee?: string }) {
    console.log('Call rejected by', data?.callee);
    cleanupCall({ notifyRemote: false, reason: 'Call rejected' });
    // setConnectionStatus('Call rejected by other user');
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
    // Clear any existing timeout first
    if (ringingTimeoutRef.current) {
      clearTimeout(ringingTimeoutRef.current);
      ringingTimeoutRef.current = null;
    }
    // Only start timeout if we're in a ringing state (not in active call)
    const currentType = currentCallTypeRef.current;
    if (
      currentType === CallType.INCOMING_CALL ||
      currentType === CallType.OUTGOING_CALL
    ) {
      ringingTimeoutRef.current = setTimeout(() => {
        // Double-check we're still in ringing state before timing out
        const stillRinging =
          currentCallTypeRef.current === CallType.INCOMING_CALL ||
          currentCallTypeRef.current === CallType.OUTGOING_CALL;
        if (stillRinging) {
          console.log('Ringing timeout reached – ending call');
          stopAllRingSounds();
          cleanupCall({
            notifyRemote: true,
            reason: 'Ringing timeout',
            resetForReuse: true,
          });
          // setConnectionStatus('Call timed out (no answer)');
        }
        ringingTimeoutRef.current = null;
      }, 30000); // 30 seconds
    }
  }

  // Process call (initiate)
  async function processCall() {
    // Prevent calling during cleanup
    if (isCleaningUpRef.current) {
      console.log('Cannot initiate call: Cleanup in progress');
      return;
    }

    // Early validation checks - reset canInitiateCall if validation fails
    if (!peerConnectionRef.current) {
      console.error('Cannot initiate call: Peer connection not ready');
      setCanInitiateCall(true); // Reset to allow retry
      // setConnectionStatus('Peer connection not ready - Initializing...');
      // Try to reinitialize peer connection
      initializePeerConnection();
      // Wait a bit and allow retry
      setTimeout(() => {
        if (isMountedRef.current && peerConnectionRef.current) {
          // setConnectionStatus(`Connected to ${currentServerURL.current.replace('http://', '')}`);
        }
      }, 500);
      return;
    }

    if (!isSocketConnected) {
      console.error('Cannot initiate call: Socket not connected to server');
      console.error('Please check:');
      console.error('1. Server is running');
      console.error('2. SERVER_URL is correct:', SERVER_URL);
      console.error('3. Network connectivity');
      setCanInitiateCall(true); // Reset to allow retry
      // setConnectionStatus('Not connected to server - Reconnecting...');
      reconnectSocketIfNeeded();
      return;
    }

    if (!canInitiateCall) {
      console.log('Call already in progress – ignoring new attempt');
      return;
    }

    const currentDialTarget = otherUserId.current || otherUserIdInput || '';

    if (!currentDialTarget || !currentDialTarget.trim()) {
      console.error('Cannot initiate call: No target user ID');
      setCanInitiateCall(true); // Reset to allow retry
      return;
    }

    console.log('Initiating call to', currentDialTarget);
    isCaller.current = true; // We are the caller
    setLastDialedId(currentDialTarget);
    otherUserId.current = currentDialTarget; // Ensure it's set
    setCanInitiateCall(false);

    try {
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
        startOutgoingRingback();
        startRingingTimeout();
      } else {
        console.error('otherUserId is null after setting');
        setCanInitiateCall(true); // Reset on error
        cleanupCall({
          notifyRemote: false,
          reason: 'Failed to initiate call',
          resetForReuse: true,
        });
      }
    } catch (error: any) {
      console.error('Error initiating call:', error?.message || error);
      setCanInitiateCall(true); // Reset on error
      cleanupCall({
        notifyRemote: false,
        reason: `Call initiation failed: ${error?.message || 'Unknown error'}`,
        resetForReuse: true,
      });
      // setConnectionStatus('Call failed - Ready to try again');
    }
  }

  // Process accept (answer call)
  async function processAccept() {
    if (!peerConnectionRef.current || !remoteRTCMessage.current) return;

    console.log('Answering call from', otherUserId.current);
    isCaller.current = false; // We are the callee

    try {
      const currentState = peerConnectionRef.current.signalingState;
      console.log(
        'Current signaling state before setting offer:',
        currentState,
      );

      // For an offer, we should be in 'stable' state
      if (currentState === 'stable' || currentState === 'have-remote-offer') {
        await peerConnectionRef.current.setRemoteDescription(
          new RTCSessionDescription(remoteRTCMessage.current),
        );
        console.log('Remote description set (Offer)');
      } else {
        console.error('Unexpected signaling state for offer:', currentState);
        // Try to recover by setting anyway
        await peerConnectionRef.current.setRemoteDescription(
          new RTCSessionDescription(remoteRTCMessage.current),
        );
      }
    } catch (error: any) {
      console.error(
        'Error setting remote description in processAccept:',
        error,
      );
      // Don't return, try to continue
    }
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

    updateCallType(CallType.WEBRTC_ROOM);
    // Ensure local stream is initialized
    if (!localStreamRef.current) {
      initializeLocalStream();
    }
    // Reset local video position
    localVideoTranslateX.setOffset(SCREEN_WIDTH - 140);
    localVideoTranslateX.setValue(0);
    localVideoTranslateY.setOffset(100);
    localVideoTranslateY.setValue(0);
  }

  function answerCall(data: {
    callerId: string;
    rtcMessage: RTCSessionDescription;
  }) {
    if (socketRef.current && socketRef.current.connected) {
      console.log('Sending answerCall to:', data.callerId);
      socketRef.current.emit('answerCall', data);
    } else {
      console.error('Cannot answer call: Socket not connected', {
        socketExists: !!socketRef.current,
        connected: socketRef.current?.connected,
      });
    }
  }

  function sendCall(data: {
    calleeId: string;
    rtcMessage: RTCSessionDescription;
  }) {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('call', data);
      console.log('Call signal sent to server');
    } else {
      console.error('Cannot send call: Socket not connected');
    }
  }

  function sendICEcandidate(data: {
    calleeId?: string;
    callerId?: string;
    rtcMessage: RTCIceCandidate;
  }) {
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
        ?.find(sender => sender.track && sender.track.kind === 'video');

      if (videoSender) {
        await videoSender.replaceTrack(newVideoTrack);
      } else if (peerConnectionRef.current) {
        peerConnectionRef.current.addTrack(
          newVideoTrack,
          localStreamRef.current,
        );
      }

      if (localStreamRef.current) {
        localStreamRef.current.getVideoTracks().forEach(track => {
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
      localStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = newState;
      });
    }
  }

  // Enable/Disable Mic
  function toggleMic() {
    if (localStreamRef.current) {
      const newState = !localMicOn;
      setLocalMicOn(newState);
      localStreamRef.current.getAudioTracks().forEach(track => {
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
    console.log('User initiated hangup');
    // Stop all sounds immediately
    stopAllRingSounds();
    // Cleanup and reset
    cleanupCall({
      notifyRemote: true,
      reason: 'Local hangup',
      resetForReuse: true,
    });
    // setConnectionStatus('Call ended - Ready to call again');
  }

  function rejectIncomingCall() {
    console.log('Rejecting incoming call');
    if (
      socketRef.current &&
      socketRef.current.connected &&
      otherUserId.current
    ) {
      socketRef.current.emit('rejectCall', {
        callerId: otherUserId.current,
      });
    }
    stopAllRingSounds();
    cleanupCall({ notifyRemote: false, reason: 'Rejected incoming call' });
    // setConnectionStatus('You rejected the call');
  }

  const JoinScreen = () => {
    const effectiveDialTarget =
      (otherUserIdInput && otherUserIdInput.trim()) || lastDialedId || '';

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
          isSocketConnected && effectiveDialTarget && canInitiateCall ? 1 : 0.5,
      },
    ];

    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.joinContainer}
      >
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
              <Text style={styles.inputLabel}>
                Enter call id of another user
              </Text>
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
                  <Text style={styles.errorText}>Disconnected.</Text>
                </View>
              )}
              <TouchableOpacity
                onPress={() => {
                  if (!effectiveDialTarget || !effectiveDialTarget.trim()) {
                    console.error('Cannot call: No target user ID provided');
                    return;
                  }
                  if (!isSocketConnected) {
                    console.error('Cannot call: Socket not connected');
                    // setConnectionStatus('Not connected - Reconnecting...');
                    reconnectSocketIfNeeded();
                    return;
                  }
                  if (!canInitiateCall) {
                    console.log('Call already in progress');
                    return;
                  }

                  // Set the target user ID before calling
                  otherUserId.current = effectiveDialTarget.trim();
                  setOtherUserIdInput(effectiveDialTarget.trim());

                  // Process the call
                  processCall();

                  // Update UI state
                  updateCallType(CallType.OUTGOING_CALL);
                }}
                disabled={
                  !isSocketConnected || !effectiveDialTarget || !canInitiateCall
                }
                style={callButtonStyle}
              >
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
        <Animated.View
          style={[
            styles.outgoingCallContent,
            { transform: [{ scale: outgoingCallScale }] },
          ]}
        >
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {otherUserId.current?.charAt(0) || '?'}
            </Text>
          </View>
          <Text style={styles.outgoingCallLabel}>Calling...</Text>
          <Text style={styles.outgoingCallId}>{otherUserId.current}</Text>
        </Animated.View>
        <View style={styles.outgoingCallActions}>
          <TouchableOpacity
            onPress={() => {
              leave();
            }}
            style={styles.hangupButton}
          >
            <CallEnd width={50} height={50} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const IncomingCallScreen = () => {
    const rotation = incomingCallRotation.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '5deg'],
    });

    return (
      <View style={styles.incomingCallContainer}>
        <Animated.View
          style={[
            styles.incomingCallContent,
            {
              transform: [{ scale: incomingCallScale }, { rotate: rotation }],
            },
          ]}
        >
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {otherUserId.current?.charAt(0) || '?'}
            </Text>
          </View>
          <Text style={styles.incomingCallLabel}>Incoming Call</Text>
          <Text style={styles.incomingCallText}>{otherUserId.current}</Text>
        </Animated.View>
        <View style={styles.incomingCallActions}>
          <TouchableOpacity
            onPress={() => {
              rejectIncomingCall();
            }}
            style={[styles.rejectButton, styles.callActionButton]}
          >
            <CallEnd width={32} height={32} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              processAccept();
            }}
            style={[styles.acceptButton, styles.callActionButton]}
          >
            <CallAnswer width={60} height={60} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const WebrtcRoomScreen = () => {
    console.log('Rendering WebrtcRoomScreen', {
      currentCallType: currentCallTypeRef.current,
      hasLocalStream: !!(localStream || localStreamRef.current),
      hasRemoteStream: !!remoteStream,
      isLocalVideoFloating,
    });

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

    // Gesture handler for drag to dismiss
    const onGestureEvent = Animated.event(
      [{ nativeEvent: { translationY: translateY } }],
      { useNativeDriver: true },
    );

    const onHandlerStateChange = (event: any) => {
      if (event.nativeEvent.oldState === 4) {
        // ACTIVE state ended
        const { translationY, velocityY } = event.nativeEvent;

        // If dragged down more than 150px or with high velocity, dismiss
        if (translationY > 150 || velocityY > 1000) {
          Animated.parallel([
            Animated.timing(translateY, {
              toValue: SCREEN_HEIGHT,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(scale, {
              toValue: 0.8,
              duration: 300,
              useNativeDriver: true,
            }),
          ]).start(() => {
            leave();
            // Reset animations
            translateY.setValue(0);
            opacity.setValue(1);
            scale.setValue(1);
          });
        } else {
          // Spring back to original position
          Animated.parallel([
            Animated.spring(translateY, {
              toValue: 0,
              useNativeDriver: true,
              tension: 50,
              friction: 7,
            }),
            Animated.spring(opacity, {
              toValue: 1,
              useNativeDriver: true,
              tension: 50,
              friction: 7,
            }),
            Animated.spring(scale, {
              toValue: 1,
              useNativeDriver: true,
              tension: 50,
              friction: 7,
            }),
          ]).start();
        }
      }
    };

    // Calculate opacity and scale based on drag position
    const dragOpacity = translateY.interpolate({
      inputRange: [0, SCREEN_HEIGHT / 2],
      outputRange: [1, 0.5],
      extrapolate: 'clamp',
    });

    const dragScale = translateY.interpolate({
      inputRange: [0, SCREEN_HEIGHT / 2],
      outputRange: [1, 0.9],
      extrapolate: 'clamp',
    });

    // Gesture handler for draggable local video (picture-in-picture)
    const onLocalVideoGestureEvent = Animated.event(
      [
        {
          nativeEvent: {
            translationX: localVideoTranslateX,
            translationY: localVideoTranslateY,
          },
        },
      ],
      { useNativeDriver: true },
    );

    const onLocalVideoHandlerStateChange = (event: any) => {
      if (event.nativeEvent.oldState === 4) {
        // ACTIVE state ended
        // Flatten offset to get absolute position
        localVideoTranslateX.flattenOffset();
        localVideoTranslateY.flattenOffset();

        // Get current absolute position (approximate since we can't read async value synchronously easily,
        // but for snapping logic we can calculate from the event)
        // Actually, we can just use the translation + offset logic if we tracked it,
        // but since we flattened, the Animated.Value now holds the absolute position.
        // However, we can't read it synchronously on the JS thread if it's driven natively.
        // So we rely on the event's absolute coordinates or calculate from translation.

        // Better approach for snapping with Native Driver:
        // We can't easily read the value to decide where to snap.
        // So we'll just snap to the nearest corner based on the drag release position relative to screen.

        const { absoluteX, absoluteY } = event.nativeEvent;
        // absoluteX/Y are raw touch coordinates, not view coordinates.
        // Let's use the translation + known start position logic for calculation,
        // but for the animation we use the Animated.Value.

        // Wait, we need to know where it is to snap it.
        // Let's assume the user dragged it to where the touch ended.

        let targetX = 0;
        let targetY = 0;

        const videoWidth = 130;
        const videoHeight = 170;
        const padding = 16;

        // Simple snap logic: Left or Right
        if (absoluteX < SCREEN_WIDTH / 2) {
          targetX = padding;
        } else {
          targetX = SCREEN_WIDTH - videoWidth - padding;
        }

        // Simple snap logic: Top or Bottom (constrained)
        if (absoluteY < SCREEN_HEIGHT / 2) {
          targetY = 100; // Top area
        } else {
          targetY = SCREEN_HEIGHT - videoHeight - 100; // Bottom area
        }

        Animated.parallel([
          Animated.spring(localVideoTranslateX, {
            toValue: targetX,
            useNativeDriver: true,
            tension: 50,
            friction: 7,
          }),
          Animated.spring(localVideoTranslateY, {
            toValue: targetY,
            useNativeDriver: true,
            tension: 50,
            friction: 7,
          }),
        ]).start(() => {
          // After snapping, set the offset to the new position and reset value to 0
          // This prepares for the next drag
          localVideoTranslateX.setOffset(targetX);
          localVideoTranslateX.setValue(0);
          localVideoTranslateY.setOffset(targetY);
          localVideoTranslateY.setValue(0);
        });
      }
    };

    console.log('currentCallTypeRef', currentCallTypeRef.current);

    return (
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
        activeOffsetY={10}
        failOffsetX={[-50, 50]}
      >
        <Animated.View
          style={[
            styles.webrtcRoomContainer,
            {
              transform: [{ translateY: translateY }, { scale: dragScale }],
              opacity: dragOpacity,
            },
          ]}
        >
          {/* Primary User Screen (Fixed) - Renders Remote or Local based on swap state */}
          <View style={styles.fullScreenVideo}>
            {isLocalVideoFloating ? (
              remoteStream ? (
                <RTCView
                  objectFit={'cover'}
                  style={styles.fullScreenRTCView}
                  streamURL={remoteStream.toURL()}
                />
              ) : (
                <View
                  style={[
                    styles.fullScreenRTCView,
                    {
                      backgroundColor: '#1A1C22',
                      justifyContent: 'center',
                      alignItems: 'center',
                    },
                  ]}
                >
                  <Text style={{ color: '#D0D4DD', fontSize: 18 }}>
                    Waiting for video...
                  </Text>
                </View>
              )
            ) : localStream || localStreamRef.current ? (
              <RTCView
                objectFit={'cover'}
                style={styles.fullScreenRTCView}
                streamURL={(localStream || localStreamRef.current)!.toURL()}
              />
            ) : null}
          </View>

          {/* Secondary User Screen (Draggable) - Renders Local or Remote based on swap state */}
          {currentCallTypeRef.current === CallType.WEBRTC_ROOM ? (
            <PanGestureHandler
              onGestureEvent={onLocalVideoGestureEvent}
              onHandlerStateChange={onLocalVideoHandlerStateChange}
              activeOffsetX={5}
              activeOffsetY={5}
            >
              <Animated.View
                style={[
                  styles.smallVideoContainer,
                  {
                    transform: [
                      { translateX: localVideoTranslateX },
                      { translateY: localVideoTranslateY },
                    ],
                  },
                ]}
              >
                <TouchableWithoutFeedback
                  onPress={() => setIsLocalVideoFloating(!isLocalVideoFloating)}
                >
                  <View style={styles.smallVideoTouchable}>
                    {isLocalVideoFloating ? (
                      localStream || localStreamRef.current ? (
                        <RTCView
                          objectFit={'cover'}
                          style={styles.smallRTCView}
                          streamURL={(localStream ||
                            localStreamRef.current)!.toURL()}
                        />
                      ) : (
                        <View style={styles.smallVideoPlaceholder}>
                          <Text style={styles.smallVideoPlaceholderText}>
                            Camera Off
                          </Text>
                        </View>
                      )
                    ) : remoteStream ? (
                      <RTCView
                        objectFit={'cover'}
                        style={styles.smallRTCView}
                        streamURL={remoteStream.toURL()}
                      />
                    ) : (
                      <View style={styles.smallVideoPlaceholder}>
                        <Text style={styles.smallVideoPlaceholderText}>
                          Remote Off
                        </Text>
                      </View>
                    )}
                    <View style={styles.smallVideoBorder} />
                  </View>
                </TouchableWithoutFeedback>
              </Animated.View>
            </PanGestureHandler>
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
          {/* Drag indicator */}
          <View style={styles.dragIndicator}>
            <View style={styles.dragHandle} />
          </View>
        </Animated.View>
      </PanGestureHandler>
    );
  };

  switch (currentCallType) {
    case CallType.JOIN:
      return JoinScreen();
    case CallType.INCOMING_CALL:
      return IncomingCallScreen();
    case CallType.OUTGOING_CALL:
      return OutgoingCallScreen();
    case CallType.WEBRTC_ROOM:
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
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#5568FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#5568FE',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  avatarText: {
    fontSize: 48,
    color: colors.white,
    fontWeight: 'bold',
  },
  outgoingCallLabel: {
    fontSize: 18,
    color: '#D0D4DD',
    marginBottom: 8,
    fontWeight: '500',
  },
  outgoingCallId: {
    fontSize: 32,
    color: colors.white,
    letterSpacing: 4,
    fontWeight: '600',
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
  incomingCallLabel: {
    fontSize: 16,
    color: '#D0D4DD',
    marginTop: 24,
    marginBottom: 8,
    fontWeight: '500',
  },
  incomingCallText: {
    fontSize: 32,
    color: colors.white,
    letterSpacing: 4,
    fontWeight: '600',
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
    paddingTop: 12,
    paddingBottom: 24,
  },
  dragIndicator: {
    position: 'absolute',
    top: 8,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
  },
  fullScreenVideo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  fullScreenRTCView: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#050A0E',
  },
  smallVideoContainer: {
    position: 'absolute',
    width: 130,
    height: 170,
    zIndex: 100,
    top: 0,
    left: 0,
  },
  smallVideoTouchable: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    backgroundColor: '#1A1C22',
  },
  smallRTCView: {
    width: '100%',
    height: '100%',
  },
  smallVideoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1A1C22',
    justifyContent: 'center',
    alignItems: 'center',
  },
  smallVideoPlaceholderText: {
    color: '#D0D4DD',
    fontSize: 14,
    fontWeight: '500',
  },
  smallVideoBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  controlBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingHorizontal: 8,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    paddingTop: 16,
    zIndex: 20,
    backgroundColor: 'rgba(5, 10, 14, 0.7)',
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
