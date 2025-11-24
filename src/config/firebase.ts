import firestore from '@react-native-firebase/firestore';

/**
 * Firebase Firestore configuration
 * The Firebase app is automatically initialized by @react-native-firebase/app
 * using the GoogleService-Info.plist (iOS) and google-services.json (Android)
 */

// Firestore collections
export const COLLECTIONS = {
    CALLS: 'calls',
    ICE_CANDIDATES: 'ice-candidates',
} as const;

// Call status enum
export enum CallStatus {
    CALLING = 'calling',
    RINGING = 'ringing',
    ACTIVE = 'active',
    ENDED = 'ended',
    REJECTED = 'rejected',
}

// Get Firestore instance
export const db = firestore();

// Enable offline persistence (optional but recommended)
// This is enabled by default in React Native Firebase

export default db;
