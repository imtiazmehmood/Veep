import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import SocketIOClient, { Socket } from 'socket.io-client';
import { SERVER_URL, getAlternativeURLs } from '../config/server';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

interface SocketContextType {
  socket: Socket | null;
  isSocketConnected: boolean;
  callerId: string;
  connectionStatus: string;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isSocketConnected: false,
  callerId: '',
  connectionStatus: 'Disconnected',
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Initializing...');
  const [callerId] = useState<string>(
    Math.floor(100000 + Math.random() * 900000).toString(),
  );

  const socketRef = useRef<Socket | null>(null);
  const currentServerURL = useRef<string>(SERVER_URL);
  const alternativeURLs = useRef<string[]>(getAlternativeURLs());
  const connectionAttempts = useRef<number>(0);

  // We need a navigation ref or hook to navigate when a call comes in
  // Since this provider is inside NavigationContainer (in App.tsx), we can use useNavigation
  // But we need to make sure SocketProvider is a child of NavigationContainer
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    const attachSocketHandlers = (socketInstance: Socket) => {
      socketInstance.on('connect', () => {
        console.log('Socket connected with ID:', socketInstance.id);
        setIsSocketConnected(true);
        setConnectionStatus("Connected.");
        // setConnectionStatus(`Connected to ${currentServerURL.current.replace('http://', '')}`);
        connectionAttempts.current = 0;
      });

      socketInstance.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        setIsSocketConnected(false);
        setConnectionStatus('Disconnected');

        if (reason === 'io server disconnect') {
          socketInstance.connect();
        }
      });

      socketInstance.on('connect_error', (error) => {
        console.log('Connection failed to:', currentServerURL.current);

        // Try next alternative URL
        if (connectionAttempts.current < alternativeURLs.current.length) {
          const nextURL = alternativeURLs.current[connectionAttempts.current];
          connectionAttempts.current++;
          const attemptText = `Trying ${connectionAttempts.current}/${alternativeURLs.current.length}: ${nextURL.replace('http://', '')}`;
          console.log(`${attemptText}`);
          setConnectionStatus(attemptText);

          socketInstance.disconnect();

          setTimeout(() => {
            createSocket(nextURL);
          }, 1500);
        } else {
          setConnectionStatus('Connection failed');
        }
      });

      // Handle incoming calls globally
      socketInstance.on('newCall', (data) => {
        console.log('Incoming call from', data.callerId);
        // Navigate to WebRTCCall screen with incoming call data
        navigation.navigate('WebRTCCall', {
          incomingCallData: {
            callerId: data.callerId,
            rtcMessage: data.rtcMessage,
          }
        });
      });
    };

    const createSocket = (url: string) => {
      console.log('Connecting to:', url);
      currentServerURL.current = url;

      const newSocket = SocketIOClient(url, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 1000,
        timeout: 10000,
        query: {
          callerId,
        },
      });

      attachSocketHandlers(newSocket);
      setSocket(newSocket);
      socketRef.current = newSocket;
      return newSocket;
    };

    createSocket(SERVER_URL);

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [callerId, navigation]);

  return (
    <SocketContext.Provider value={{ socket, isSocketConnected, callerId, connectionStatus }}>
      {children}
    </SocketContext.Provider>
  );
};
