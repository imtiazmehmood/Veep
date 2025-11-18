import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  onSnapshot,
  addDoc,
  deleteDoc,
} from 'firebase/firestore';

// Firebase configuration
// TODO: Replace with your Firebase config
const firebaseConfig = {
  apiKey: 'AIzaSyDvsnI2T_8MFHQbjQ54PEU6FSeF2qRQRDM', //"YOUR_API_KEY"
  authDomain: 'black-nucleus-372414.firebasestorage.app', //"YOUR_AUTH_DOMAIN"
  projectId: 'black-nucleus-372414', //"YOUR_PROJECT_ID"
  storageBucket: 'black-nucleus-372414.firebasestorage.app', //"YOUR_STORAGE_BUCKET"
  messagingSenderId: '385632215351', //"YOUR_MESSAGING_SENDER_ID"
  appId: '1:385632215351:android:8479d936885592bc4b3ab2', //"YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

/**
 * Create a new call document in Firestore
 */
export const createCall = async (callId, offer) => {
  const callRef = doc(db, 'calls', callId);
  await setDoc(callRef, {
    offer: offer,
    answer: null,
    createdAt: new Date().toISOString(),
  });
  return callId;
};

/**
 * Listen for offer in a call document
 */
export const listenOffer = (callId, callback) => {
  const callRef = doc(db, 'calls', callId);
  return onSnapshot(callRef, snapshot => {
    if (snapshot.exists()) {
      const data = snapshot.data();
      if (data.offer) {
        callback(data.offer);
      }
    }
  });
};

/**
 * Listen for answer in a call document
 */
export const listenAnswer = (callId, callback) => {
  const callRef = doc(db, 'calls', callId);
  return onSnapshot(callRef, snapshot => {
    if (snapshot.exists()) {
      const data = snapshot.data();
      if (data.answer) {
        callback(data.answer);
      }
    }
  });
};

/**
 * Set answer in call document
 */
export const setAnswer = async (callId, answer) => {
  const callRef = doc(db, 'calls', callId);
  await setDoc(callRef, { answer }, { merge: true });
};

/**
 * Add offer ICE candidate
 */
export const addOfferCandidate = async (callId, candidate) => {
  const candidatesRef = collection(db, 'calls', callId, 'offerCandidates');
  await addDoc(candidatesRef, candidate);
};

/**
 * Add answer ICE candidate
 */
export const addAnswerCandidate = async (callId, candidate) => {
  const candidatesRef = collection(db, 'calls', callId, 'answerCandidates');
  await addDoc(candidatesRef, candidate);
};

/**
 * Listen for offer candidates
 */
export const listenOfferCandidates = (callId, callback) => {
  const candidatesRef = collection(db, 'calls', callId, 'offerCandidates');
  return onSnapshot(candidatesRef, snapshot => {
    snapshot.docChanges().forEach(change => {
      if (change.type === 'added') {
        callback(change.doc.data());
      }
    });
  });
};

/**
 * Listen for answer candidates
 */
export const listenAnswerCandidates = (callId, callback) => {
  const candidatesRef = collection(db, 'calls', callId, 'answerCandidates');
  return onSnapshot(candidatesRef, snapshot => {
    snapshot.docChanges().forEach(change => {
      if (change.type === 'added') {
        callback(change.doc.data());
      }
    });
  });
};

/**
 * Delete call document and all subcollections
 */
export const deleteCall = async callId => {
  try {
    // Delete offer candidates
    const offerCandidatesRef = collection(
      db,
      'calls',
      callId,
      'offerCandidates',
    );
    const offerSnapshot = await getDocs(offerCandidatesRef);
    const offerDeletePromises = offerSnapshot.docs.map(doc =>
      deleteDoc(doc.ref),
    );
    await Promise.all(offerDeletePromises);

    // Delete answer candidates
    const answerCandidatesRef = collection(
      db,
      'calls',
      callId,
      'answerCandidates',
    );
    const answerSnapshot = await getDocs(answerCandidatesRef);
    const answerDeletePromises = answerSnapshot.docs.map(doc =>
      deleteDoc(doc.ref),
    );
    await Promise.all(answerDeletePromises);

    // Delete call document
    const callRef = doc(db, 'calls', callId);
    await deleteDoc(callRef);
  } catch (error) {
    console.error('Error deleting call:', error);
    // Still try to delete the main document even if subcollections fail
    try {
      const callRef = doc(db, 'calls', callId);
      await deleteDoc(callRef);
    } catch (e) {
      console.error('Error deleting call document:', e);
    }
  }
};
