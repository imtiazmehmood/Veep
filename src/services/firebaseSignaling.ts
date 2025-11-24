import { db, COLLECTIONS, CallStatus } from '../config/firebase';
import type { RTCSessionDescription, RTCIceCandidate } from 'react-native-webrtc';

/**
 * Firebase Firestore Signaling Service
 * Replaces Socket.IO for WebRTC signaling
 */

export interface CallDocument {
    callId: string;
    callerId: string;
    calleeId: string;
    status: CallStatus;
    offer: RTCSessionDescription | null;
    answer: RTCSessionDescription | null;
    createdAt: number;
    updatedAt: number;
}

export interface IceCandidateDocument {
    candidate: string;
    sdpMLineIndex: number | null;
    sdpMid: string | null;
    timestamp: number;
}

/**
 * Create a new call document with offer
 */
export const createCall = async (
    callerId: string,
    calleeId: string,
    offer: RTCSessionDescription
): Promise<string> => {
    const callId = `${callerId}_${calleeId}_${Date.now()}`;
    const timestamp = Date.now();

    const callDoc: CallDocument = {
        callId,
        callerId,
        calleeId,
        status: CallStatus.CALLING,
        offer,
        answer: null,
        createdAt: timestamp,
        updatedAt: timestamp,
    };

    await db.collection(COLLECTIONS.CALLS).doc(callId).set(callDoc);
    console.log('📞 Created call document:', callId);
    return callId;
};

/**
 * Answer a call by updating the call document with answer
 */
export const answerCall = async (
    callId: string,
    answer: RTCSessionDescription
): Promise<void> => {
    await db.collection(COLLECTIONS.CALLS).doc(callId).update({
        answer,
        status: CallStatus.ACTIVE,
        updatedAt: Date.now(),
    });
    console.log('✅ Answered call:', callId);
};

/**
 * Add ICE candidate to Firestore
 */
export const addIceCandidate = async (
    callId: string,
    candidate: RTCIceCandidate,
    party: 'caller' | 'callee'
): Promise<void> => {
    const candidateDoc: IceCandidateDocument = {
        candidate: candidate.candidate || '',
        sdpMLineIndex: candidate.sdpMLineIndex ?? null,
        sdpMid: candidate.sdpMid ?? null,
        timestamp: Date.now(),
    };

    await db
        .collection(COLLECTIONS.ICE_CANDIDATES)
        .doc(callId)
        .collection(party)
        .add(candidateDoc);

    console.log(`🧊 Added ICE candidate for ${party}:`, callId);
};

/**
 * Listen to call document changes
 */
export const listenToCall = (
    callId: string,
    callbacks: {
        onAnswer?: (answer: RTCSessionDescription) => void;
        onStatusChange?: (status: CallStatus) => void;
        onCallEnded?: () => void;
    }
): (() => void) => {
    const unsubscribe = db
        .collection(COLLECTIONS.CALLS)
        .doc(callId)
        .onSnapshot(
            (snapshot) => {
                if (!snapshot.exists) {
                    console.log('Call document does not exist:', callId);
                    return;
                }

                const data = snapshot.data() as CallDocument;
                console.log('📱 Call update:', data.status);

                // Handle answer
                if (data.answer && callbacks.onAnswer) {
                    callbacks.onAnswer(data.answer);
                }

                // Handle status changes
                if (callbacks.onStatusChange) {
                    callbacks.onStatusChange(data.status);
                }

                // Handle call ended
                if (
                    (data.status === CallStatus.ENDED ||
                        data.status === CallStatus.REJECTED) &&
                    callbacks.onCallEnded
                ) {
                    callbacks.onCallEnded();
                }
            },
            (error) => {
                console.error('Error listening to call:', error);
            }
        );

    return unsubscribe;
};

/**
 * Listen to ICE candidates
 */
export const listenToIceCandidates = (
    callId: string,
    party: 'caller' | 'callee',
    onCandidate: (candidate: RTCIceCandidate) => void
): (() => void) => {
    const unsubscribe = db
        .collection(COLLECTIONS.ICE_CANDIDATES)
        .doc(callId)
        .collection(party)
        .onSnapshot(
            (snapshot) => {
                snapshot.docChanges().forEach((change) => {
                    if (change.type === 'added') {
                        const data = change.doc.data() as IceCandidateDocument;
                        const candidate: RTCIceCandidate = {
                            candidate: data.candidate,
                            sdpMLineIndex: data.sdpMLineIndex,
                            sdpMid: data.sdpMid,
                        } as RTCIceCandidate;

                        console.log(`🧊 Received ICE candidate from ${party}`);
                        onCandidate(candidate);
                    }
                });
            },
            (error) => {
                console.error('Error listening to ICE candidates:', error);
            }
        );

    return unsubscribe;
};

/**
 * Update call status
 */
export const updateCallStatus = async (
    callId: string,
    status: CallStatus
): Promise<void> => {
    await db.collection(COLLECTIONS.CALLS).doc(callId).update({
        status,
        updatedAt: Date.now(),
    });
    console.log('📊 Updated call status:', status);
};

/**
 * End call and cleanup
 */
export const endCall = async (callId: string): Promise<void> => {
    try {
        // Update call status to ended
        await updateCallStatus(callId, CallStatus.ENDED);

        // Optional: Delete ICE candidates after a delay to ensure both parties see the ended status
        setTimeout(async () => {
            try {
                // Delete caller ICE candidates
                const callerCandidates = await db
                    .collection(COLLECTIONS.ICE_CANDIDATES)
                    .doc(callId)
                    .collection('caller')
                    .get();

                const callerDeletePromises = callerCandidates.docs.map((doc) =>
                    doc.ref.delete()
                );
                await Promise.all(callerDeletePromises);

                // Delete callee ICE candidates
                const calleeCandidates = await db
                    .collection(COLLECTIONS.ICE_CANDIDATES)
                    .doc(callId)
                    .collection('callee')
                    .get();

                const calleeDeletePromises = calleeCandidates.docs.map((doc) =>
                    doc.ref.delete()
                );
                await Promise.all(calleeDeletePromises);

                // Delete ICE candidates parent document
                await db.collection(COLLECTIONS.ICE_CANDIDATES).doc(callId).delete();

                // Optionally delete call document after some time
                // await db.collection(COLLECTIONS.CALLS).doc(callId).delete();

                console.log('🧹 Cleaned up call:', callId);
            } catch (error) {
                console.error('Error cleaning up call:', error);
            }
        }, 5000); // 5 second delay
    } catch (error) {
        console.error('Error ending call:', error);
        throw error;
    }
};

/**
 * Reject incoming call
 */
export const rejectCall = async (callId: string): Promise<void> => {
    await updateCallStatus(callId, CallStatus.REJECTED);
    console.log('❌ Rejected call:', callId);
};

/**
 * Listen for incoming calls for a specific user
 */
export const listenForIncomingCalls = (
    calleeId: string,
    onIncomingCall: (callData: CallDocument) => void
): (() => void) => {
    const unsubscribe = db
        .collection(COLLECTIONS.CALLS)
        .where('calleeId', '==', calleeId)
        .where('status', '==', CallStatus.CALLING)
        .onSnapshot(
            (snapshot) => {
                snapshot.docChanges().forEach((change) => {
                    if (change.type === 'added') {
                        const data = change.doc.data() as CallDocument;
                        console.log('📞 Incoming call from:', data.callerId);
                        onIncomingCall(data);
                    }
                });
            },
            (error) => {
                console.error('Error listening for incoming calls:', error);
            }
        );

    return unsubscribe;
};
