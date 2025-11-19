import React, { createContext, useContext, ReactNode } from 'react';
import { useWebRTC } from '../hooks/useWebRTC';
import type { WebRTCContextValue } from '../types/webrtc';

const WebRTCContext = createContext<WebRTCContextValue | null>(null);

interface WebRTCProviderProps {
  children: ReactNode;
}

export const WebRTCProvider: React.FC<WebRTCProviderProps> = ({ children }) => {
  const webrtc = useWebRTC();
  return (
    <WebRTCContext.Provider value={webrtc}>
      {children}
    </WebRTCContext.Provider>
  );
};

export const useWebRTCContext = (): WebRTCContextValue => {
  const context = useContext(WebRTCContext);
  if (!context) {
    throw new Error('useWebRTCContext must be used within a WebRTCProvider');
  }
  return context;
};


