import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { listenForIncomingCalls, CallDocument } from '../services/firebaseSignaling';
import { db } from '../config/firebase';

interface FirebaseContextType {
    isFirestoreConnected: boolean;
    callerId: string;
    connectionStatus: string;
}

const FirebaseContext = createContext<FirebaseContextType>({
    isFirestoreConnected: false,
    callerId: '',
    connectionStatus: 'Initializing...',
});

export const useFirebase = () => useContext(FirebaseContext);

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isFirestoreConnected, setIsFirestoreConnected] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('Initializing...');
    const [callerId] = useState<string>(
        Math.floor(100000 + Math.random() * 900000).toString(),
    );

    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const incomingCallListenerRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        // Monitor Firestore connection state
        const checkConnection = async () => {
            try {
                // Try to perform a simple Firestore operation to check connectivity
                await db.collection('_connection_test').doc('test').get();
                setIsFirestoreConnected(true);
                setConnectionStatus('Connected.');
                console.log('✅ Firestore connected');
            } catch (error) {
                setIsFirestoreConnected(false);
                setConnectionStatus('Disconnected');
                console.log('❌ Firestore connection error:', error);
            }
        };

        checkConnection();

        // Set up periodic connection check
        const connectionCheckInterval = setInterval(checkConnection, 10000); // Check every 10 seconds

        // Listen for incoming calls
        console.log('👂 Listening for incoming calls for caller ID:', callerId);
        const unsubscribe = listenForIncomingCalls(callerId, (callData: CallDocument) => {
            console.log('📞 Incoming call detected from:', callData.callerId);

            // Navigate to WebRTCCall screen with incoming call data
            navigation.navigate('WebRTCCall', {
                incomingCallData: {
                    callerId: callData.callerId,
                    callId: callData.callId,
                    rtcMessage: callData.offer,
                },
            });
        });

        incomingCallListenerRef.current = unsubscribe;

        return () => {
            clearInterval(connectionCheckInterval);
            if (incomingCallListenerRef.current) {
                incomingCallListenerRef.current();
            }
        };
    }, [callerId, navigation]);

    return (
        <FirebaseContext.Provider value={{ isFirestoreConnected, callerId, connectionStatus }}>
            {children}
        </FirebaseContext.Provider>
    );
};
