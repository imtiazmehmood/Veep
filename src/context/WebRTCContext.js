import React, { createContext, useContext } from 'react';
import { useWebRTC } from '../hooks/useWebRTC';

const WebRTCContext = createContext(null);

export const WebRTCProvider = ({ children }) => {
  const webrtc = useWebRTC();
  return (
    <WebRTCContext.Provider value={webrtc}>
      {children}
    </WebRTCContext.Provider>
  );
};

export const useWebRTCContext = () => {
  const context = useContext(WebRTCContext);
  if (!context) {
    throw new Error('useWebRTCContext must be used within a WebRTCProvider');
  }
  return context;
};


