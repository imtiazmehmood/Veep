import { useState, useEffect, useRef, useCallback } from 'react';
import { RTCSessionDescription, RTCIceCandidate } from 'react-native-webrtc';
import {
  createPeerConnection,
  getUserMedia,
  switchCamera as switchCameraUtil,
  toggleMute as toggleMuteUtil,
  toggleVideo as toggleVideoUtil,
  stopStream,
} from '../services/webrtc';
import {
  createCall as createCallInFirebase,
  listenOffer,
  listenAnswer,
  setAnswer,
  addOfferCandidate,
  addAnswerCandidate,
  listenOfferCandidates,
  listenAnswerCandidates,
  deleteCall,
} from '../services/firebase';

export const useWebRTC = () => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [callId, setCallId] = useState(null);
  const [isCallActive, setIsCallActive] = useState(false);

  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const unsubscribeRefs = useRef([]);

  // Cleanup function
  const cleanup = useCallback(() => {
    // Stop local stream
    if (localStreamRef.current) {
      stopStream(localStreamRef.current);
      localStreamRef.current = null;
      setLocalStream(null);
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Unsubscribe from Firestore listeners
    unsubscribeRefs.current.forEach((unsubscribe) => {
      if (unsubscribe) unsubscribe();
    });
    unsubscribeRefs.current = [];

    // Clear remote stream
    setRemoteStream(null);
    setIsCallActive(false);
  }, []);

  // Initialize local stream
  const initLocalStream = useCallback(async () => {
    try {
      const stream = await getUserMedia();
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (error) {
      console.error('Error initializing local stream:', error);
      throw error;
    }
  }, []);

  // Create call (caller)
  const createCall = useCallback(async () => {
    try {
      // Initialize local stream
      const stream = await initLocalStream();
      if (!stream) throw new Error('Failed to get local stream');

      // Generate call ID
      const newCallId = Math.random().toString(36).substring(2, 15);
      setCallId(newCallId);

      // Create peer connection
      const peerConnection = createPeerConnection(
        async (candidate) => {
          // Send ICE candidate to Firestore
          await addOfferCandidate(newCallId, candidate.toJSON());
        },
        (stream) => {
          // Handle remote stream
          setRemoteStream(stream);
          setIsCallActive(true);
        }
      );

      // Add local tracks to peer connection
      stream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, stream);
      });

      peerConnectionRef.current = peerConnection;

      // Create offer
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      // Save offer to Firestore
      await createCallInFirebase(newCallId, offer.toJSON());

      // Listen for answer
      const unsubscribeAnswer = listenAnswer(newCallId, async (answer) => {
        if (peerConnectionRef.current) {
          await peerConnectionRef.current.setRemoteDescription(
            new RTCSessionDescription(answer)
          );
        }
      });
      unsubscribeRefs.current.push(unsubscribeAnswer);

      // Listen for answer candidates
      const unsubscribeAnswerCandidates = listenAnswerCandidates(
        newCallId,
        async (candidate) => {
          if (peerConnectionRef.current) {
            await peerConnectionRef.current.addIceCandidate(
              new RTCIceCandidate(candidate)
            );
          }
        }
      );
      unsubscribeRefs.current.push(unsubscribeAnswerCandidates);

      return newCallId;
    } catch (error) {
      console.error('Error creating call:', error);
      cleanup();
      throw error;
    }
  }, [initLocalStream, cleanup]);

  // Join call (callee)
  const joinCall = useCallback(async (callIdToJoin) => {
    try {
      // Initialize local stream
      const stream = await initLocalStream();
      if (!stream) throw new Error('Failed to get local stream');

      setCallId(callIdToJoin);

      // Create peer connection
      const peerConnection = createPeerConnection(
        async (candidate) => {
          // Send ICE candidate to Firestore
          await addAnswerCandidate(callIdToJoin, candidate.toJSON());
        },
        (stream) => {
          // Handle remote stream
          setRemoteStream(stream);
          setIsCallActive(true);
        }
      );

      // Add local tracks to peer connection
      stream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, stream);
      });

      peerConnectionRef.current = peerConnection;

      // Listen for offer
      const unsubscribeOffer = listenOffer(callIdToJoin, async (offer) => {
        if (peerConnectionRef.current) {
          await peerConnectionRef.current.setRemoteDescription(
            new RTCSessionDescription(offer)
          );

          // Create answer
          const answer = await peerConnectionRef.current.createAnswer();
          await peerConnectionRef.current.setLocalDescription(answer);

          // Send answer to Firestore
          await setAnswer(callIdToJoin, answer.toJSON());
        }
      });
      unsubscribeRefs.current.push(unsubscribeOffer);

      // Listen for offer candidates
      const unsubscribeOfferCandidates = listenOfferCandidates(
        callIdToJoin,
        async (candidate) => {
          if (peerConnectionRef.current) {
            await peerConnectionRef.current.addIceCandidate(
              new RTCIceCandidate(candidate)
            );
          }
        }
      );
      unsubscribeRefs.current.push(unsubscribeOfferCandidates);

      return callIdToJoin;
    } catch (error) {
      console.error('Error joining call:', error);
      cleanup();
      throw error;
    }
  }, [initLocalStream, cleanup]);

  // Switch camera
  const switchCamera = useCallback(async () => {
    if (localStreamRef.current) {
      try {
        await switchCameraUtil(localStreamRef.current);
      } catch (error) {
        console.error('Error switching camera:', error);
      }
    }
  }, []);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const newMuteState = toggleMuteUtil(
        localStreamRef.current,
        isMuted
      );
      setIsMuted(newMuteState);
      return newMuteState;
    }
    return isMuted;
  }, [isMuted]);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const newVideoState = toggleVideoUtil(
        localStreamRef.current,
        isVideoEnabled
      );
      setIsVideoEnabled(newVideoState);
      return newVideoState;
    }
    return isVideoEnabled;
  }, [isVideoEnabled]);

  // Hangup
  const hangup = useCallback(async () => {
    if (callId) {
      try {
        await deleteCall(callId);
      } catch (error) {
        console.error('Error deleting call:', error);
      }
    }
    cleanup();
    setCallId(null);
  }, [callId, cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    localStream,
    remoteStream,
    isMuted,
    isVideoEnabled,
    switchCamera,
    toggleMute,
    toggleVideo,
    createCall,
    joinCall,
    hangup,
    callId,
    isCallActive,
    initLocalStream,
  };
};

