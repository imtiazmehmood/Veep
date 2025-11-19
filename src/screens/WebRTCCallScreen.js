import React, { useEffect, useState, useRef } from 'react';
import {
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import SocketIOClient from 'socket.io-client';
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

export default function WebRTCCallScreen({ navigation }) {
  const [type, setType] = useState('JOIN');
  const [callerId] = useState(
    Math.floor(100000 + Math.random() * 900000).toString(),
  );
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [localMicOn, setLocalMicOn] = useState(true);
  const [localWebcamOn, setLocalWebcamOn] = useState(true);
  const [otherUserIdInput, setOtherUserIdInput] = useState('');
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Initializing...');

  const otherUserId = useRef(null);
  const remoteRTCMessage = useRef(null);
  const socketRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const isCaller = useRef(false);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const facingModeRef = useRef('user');
  const currentServerURL = useRef(SERVER_URL);
  const alternativeURLs = useRef(getAlternativeURLs());
  const connectionAttempts = useRef(0);
  const pendingRemoteCandidates = useRef([]);
  
  // Log available alternatives on mount
  useEffect(() => {
    console.log('🔧 Available server URLs to try:', alternativeURLs.current.length);
    console.log('📋 URLs:', alternativeURLs.current);
  }, []);

  // Initialize Socket and WebRTC
  useEffect(() => {
    // Function to attach common event handlers
    const attachSocketHandlers = (socket) => {
      socket.on('reconnect_attempt', (attemptNumber) => {
        console.log('Reconnection attempt:', attemptNumber);
      });

      socket.on('reconnect', (attemptNumber) => {
        console.log('Reconnected after', attemptNumber, 'attempts');
        setIsSocketConnected(true);
      });

      socket.on('reconnect_error', (error) => {
        console.log('Reconnection error:', error.message || error);
      });

      socket.on('reconnect_failed', () => {
        console.log('Failed to reconnect to server');
      });

      socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        setIsSocketConnected(false);
        if (reason === 'io server disconnect') {
          // Server disconnected the socket, reconnect manually
          socket.connect();
        }
      });
    };

    // Function to create socket connection with all handlers
    const createSocket = (url) => {
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

      socket.on('connect_error', (error) => {
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
    });

    socket.on('callAnswered', async (data) => {
      console.log('Call answered by', data.callee);
      remoteRTCMessage.current = data.rtcMessage;
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(
          new RTCSessionDescription(remoteRTCMessage.current),
        );
        flushPendingCandidates();
      }
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

  async function getVideoSourceId(facingMode) {
    try {
      const sourceInfos = await mediaDevices.enumerateDevices();
      for (let i = 0; i < sourceInfos.length; i++) {
        const sourceInfo = sourceInfos[i];
        if (
          sourceInfo.kind === 'videoinput' &&
          sourceInfo.facing === facingMode
        ) {
          return sourceInfo.deviceId;
        }
      }
    } catch (error) {
      console.log('Error enumerating media devices:', error);
    }
    return null;
  }

  function initializePeerConnection() {
    if (peerConnectionRef.current) {
      try {
        peerConnectionRef.current.getSenders().forEach((sender) => {
          try {
            peerConnectionRef.current.removeTrack(sender);
          } catch (err) {
            console.log('Error removing sender:', err?.message);
          }
        });
        peerConnectionRef.current.ontrack = null;
        peerConnectionRef.current.onicecandidate = null;
        peerConnectionRef.current.close();
      } catch (error) {
        console.log('Error cleaning previous peer connection:', error);
      }
    }

    const peerConnection = new RTCPeerConnection({
      iceServers: ICE_SERVERS,
    });

    peerConnection.ontrack = (event) => {
      const [stream] = event.streams;
      if (stream) {
        remoteStreamRef.current = stream;
        setRemoteStream(stream);
      }
    };

    peerConnection.onicecandidate = (event) => {
      if (event.candidate && otherUserId.current) {
        const iceData = {
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
        peerConnection.addTrack(track, localStreamRef.current);
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
      queue.forEach((message) => {
        const iceCandidate = new RTCIceCandidate({
          candidate: message.candidate,
          sdpMLineIndex: message.label,
          sdpMid: message.id,
        });
        peerConnectionRef.current
          .addIceCandidate(iceCandidate)
          .then(() => {
            console.log('Queued ICE candidate added successfully');
          })
          .catch((err) => {
            console.log('Error adding queued ICE candidate:', err);
          });
      });
    }
  }

  async function initializeLocalStream(facingMode = facingModeRef.current) {
    try {
      const videoSourceId = await getVideoSourceId(facingMode);
      const stream = await mediaDevices.getUserMedia({
        audio: true,
        video: {
          mandatory: {
            minWidth: 500,
            minHeight: 300,
            minFrameRate: 30,
          },
          facingMode,
          optional: videoSourceId ? [{ sourceId: videoSourceId }] : [],
        },
      });
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      localStreamRef.current = stream;
      setLocalStream(stream);
      if (peerConnectionRef.current) {
        stream.getTracks().forEach((track) => {
          peerConnectionRef.current.addTrack(track, stream);
        });
      }
    } catch (error) {
      console.log('Error getting user media:', error);
    }
  }

  function cleanupCall({ notifyRemote = false, resetForReuse = true, reason = '' } = {}) {
    console.log('Cleaning up call state', reason);
    if (notifyRemote && socketRef.current && otherUserId.current) {
      socketRef.current.emit('leaveCall', {
        targetId: otherUserId.current,
      });
    }
    InCallManager.stop();
    remoteRTCMessage.current = null;
    isCaller.current = false;

    if (peerConnectionRef.current) {
      try {
        peerConnectionRef.current.getSenders().forEach((sender) => {
          try {
            peerConnectionRef.current.removeTrack(sender);
          } catch (err) {
            console.log('Error removing sender during cleanup:', err?.message);
          }
        });
        peerConnectionRef.current.close();
      } catch (error) {
        console.log('Error closing peer connection:', error);
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

    if (resetForReuse) {
      initializePeerConnection();
      initializeLocalStream();
      setConnectionStatus(`Connected to ${currentServerURL.current.replace('http://', '')}`);
    }

    setType('JOIN');
    setOtherUserIdInput('');
  }

  function handleRemoteHangup(data) {
    console.log('Remote user ended the call', data?.sender);
    cleanupCall({ notifyRemote: false, reason: 'Remote hangup' });
    setConnectionStatus('Call ended by remote user');
  }

  function handleCallRejected(data) {
    console.log('Call rejected by', data?.callee);
    cleanupCall({ notifyRemote: false, reason: 'Call rejected' });
    setConnectionStatus('Call rejected by other user');
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

    console.log('Initiating call to', otherUserId.current);
    isCaller.current = true; // We are the caller
    
    // Start call manager for audio routing and proximity sensor
    InCallManager.start({ media: 'video' });
    
    const sessionDescription = await peerConnectionRef.current.createOffer();
    await peerConnectionRef.current.setLocalDescription(sessionDescription);

    sendCall({
      calleeId: otherUserId.current,
      rtcMessage: sessionDescription,
    });
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

    const sessionDescription = await peerConnectionRef.current.createAnswer();
    await peerConnectionRef.current.setLocalDescription(sessionDescription);

    // Start call manager for audio routing and proximity sensor
    InCallManager.start({ media: 'video' });

    answerCall({
      callerId: otherUserId.current,
      rtcMessage: sessionDescription,
    });
    
    setType('WEBRTC_ROOM');
  }

  function answerCall(data) {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('answerCall', data);
      console.log('Answer signal sent to server');
    } else {
      console.error('Cannot answer call: Socket not connected');
    }
  }

  function sendCall(data) {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('call', data);
      console.log('Call signal sent to server');
    } else {
      console.error('Cannot send call: Socket not connected');
    }
  }

  function sendICEcandidate(data) {
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
          mandatory: {
            minWidth: 500,
            minHeight: 300,
            minFrameRate: 30,
          },
          facingMode: nextFacing,
          optional: videoSourceId ? [{ sourceId: videoSourceId }] : [],
        },
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

      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.stop();
        localStreamRef.current.removeTrack(track);
      });
      localStreamRef.current.addTrack(newVideoTrack);

      const updatedStream = new MediaStream(localStreamRef.current);
      localStreamRef.current = updatedStream;
      setLocalStream(updatedStream);
    } catch (error) {
      console.log('Error switching camera:', error);
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
    cleanupCall({ notifyRemote: false, reason: 'Rejected incoming call' });
    setConnectionStatus('You rejected the call');
  }

  const JoinScreen = () => {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{
          flex: 1,
          backgroundColor: '#050A0E',
          justifyContent: 'center',
          paddingHorizontal: 42,
        }}>
        {/* Connection Status Indicator */}
        <View
          style={{
            position: 'absolute',
            top: 50,
            left: 42,
            right: 42,
            zIndex: 1000,
            backgroundColor: isSocketConnected ? '#4CAF50' : '#FF5D5D',
            padding: 12,
            borderRadius: 8,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: '#FFFFFF',
              marginRight: 8,
            }}
          />
          <Text
            style={{
              fontSize: 12,
              color: '#FFFFFF',
              fontWeight: '600',
            }}>
            {connectionStatus}
          </Text>
        </View>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View>
            <View
              style={{
                padding: 35,
                backgroundColor: '#1A1C22',
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: 14,
              }}>
              <Text
                style={{
                  fontSize: 18,
                  color: '#D0D4DD',
                }}>
                Your Caller ID
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  marginTop: 12,
                  alignItems: 'center',
                }}>
                <Text
                  style={{
                    fontSize: 32,
                    color: '#ffff',
                    letterSpacing: 6,
                  }}>
                  {callerId}
                </Text>
              </View>
            </View>

            <View
              style={{
                backgroundColor: '#1A1C22',
                padding: 40,
                marginTop: 25,
                justifyContent: 'center',
                borderRadius: 14,
              }}>
              <Text
                style={{
                  fontSize: 18,
                  color: '#D0D4DD',
                }}>
                Enter call id of another user
              </Text>
              <TextInputContainer
                placeholder={'Enter Caller ID'}
                value={otherUserIdInput}
                setValue={text => {
                  setOtherUserIdInput(text);
                  otherUserId.current = text;
                }}
                keyboardType={'number-pad'}
              />
              {!isSocketConnected && (
                <View
                  style={{
                    backgroundColor: '#FF5D5D',
                    padding: 12,
                    borderRadius: 8,
                    marginTop: 12,
                  }}>
                  <Text
                    style={{
                      fontSize: 14,
                      color: '#FFFFFF',
                      textAlign: 'center',
                    }}>
                    Not connected to server. Please check your connection.
                  </Text>
                </View>
              )}
              <TouchableOpacity
                onPress={() => {
                  if (otherUserIdInput && otherUserIdInput.trim()) {
                    if (!isSocketConnected) {
                      console.error('Cannot call: Socket not connected');
                      return;
                    }
                    otherUserId.current = otherUserIdInput.trim();
                    processCall();
                    setType('OUTGOING_CALL');
                  }
                }}
                disabled={!isSocketConnected || !otherUserIdInput || !otherUserIdInput.trim()}
                style={{
                  height: 50,
                  backgroundColor: isSocketConnected ? '#5568FE' : '#555555',
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderRadius: 12,
                  marginTop: 16,
                  opacity: isSocketConnected ? 1 : 0.5,
                }}>
                <Text
                  style={{
                    fontSize: 16,
                    color: '#FFFFFF',
                  }}>
                  {isSocketConnected ? 'Call Now' : 'Connecting...'}
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
      <View
        style={{
          flex: 1,
          justifyContent: 'space-around',
          backgroundColor: '#050A0E',
        }}>
        <View
          style={{
            padding: 35,
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 14,
          }}>
          <Text
            style={{
              fontSize: 16,
              color: '#D0D4DD',
            }}>
            Calling to...
          </Text>

          <Text
            style={{
              fontSize: 36,
              marginTop: 12,
              color: '#ffff',
              letterSpacing: 6,
            }}>
            {otherUserId.current}
          </Text>
        </View>
        <View
          style={{
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <TouchableOpacity
            onPress={() => {
              leave();
            }}
            style={{
              backgroundColor: '#FF5D5D',
              borderRadius: 30,
              height: 60,
              aspectRatio: 1,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <CallEnd width={50} height={50} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const IncomingCallScreen = () => {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'space-around',
          backgroundColor: '#050A0E',
        }}>
        <View
          style={{
            padding: 35,
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 14,
          }}>
          <Text
            style={{
              fontSize: 36,
              marginTop: 12,
              color: '#ffff',
            }}>
            {otherUserId.current} is calling..
          </Text>
        </View>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-evenly',
            alignItems: 'center',
          }}>
          <TouchableOpacity
            onPress={() => {
              rejectIncomingCall();
            }}
            style={{
              backgroundColor: '#FF5D5D',
              borderRadius: 30,
              height: 60,
              aspectRatio: 1,
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 24,
            }}>
            <CallEnd width={32} height={32} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              processAccept();
            }}
            style={{
              backgroundColor: 'green',
              borderRadius: 30,
              height: 60,
              aspectRatio: 1,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <CallAnswer width={60} height={60} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const WebrtcRoomScreen = () => {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#050A0E',
          paddingHorizontal: 12,
          paddingVertical: 12,
        }}>
        {localStream ? (
          <RTCView
            objectFit={'cover'}
            style={{ flex: 1, backgroundColor: '#050A0E' }}
            streamURL={localStream.toURL()}
          />
        ) : null}
        {remoteStream ? (
          <RTCView
            objectFit={'cover'}
            style={{
              flex: 1,
              backgroundColor: '#050A0E',
              marginTop: 8,
            }}
            streamURL={remoteStream.toURL()}
          />
        ) : null}
        <View
          style={{
            marginVertical: 12,
            flexDirection: 'row',
            justifyContent: 'space-evenly',
          }}>
          <IconContainer
            backgroundColor={'red'}
            onPress={() => {
              leave();
            }}
            Icon={() => {
              return <CallEnd width={26} height={26} />;
            }}
          />
          <IconContainer
            style={{
              borderWidth: 1.5,
              borderColor: '#2B3034',
            }}
            backgroundColor={!localMicOn ? '#fff' : 'transparent'}
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
            style={{
              borderWidth: 1.5,
              borderColor: '#2B3034',
            }}
            backgroundColor={!localWebcamOn ? '#fff' : 'transparent'}
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
            style={{
              borderWidth: 1.5,
              borderColor: '#2B3034',
            }}
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
}

