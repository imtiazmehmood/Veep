/// <reference path="../types/global.d.ts" />

import { Platform } from 'react-native';

// Declare global __DEV__ variable for TypeScript
declare const __DEV__: boolean;

// Auto-configured server URL based on platform and environment
// No manual configuration needed! The system will automatically:
// - Use localhost for iOS Simulator
// - Use 10.0.2.2 for Android Emulator (when RN_USE_EMULATOR_HOST=true)
// - Try multiple common IPs for real devices (default: 192.168.60.111 first)

const SERVER_PORT: number = 3500;

// Get server URL based on platform
function getServerURL(): string {
  // Production URL
  if (!__DEV__) {
    return 'https://your-production-server.com:3500';
  }

  // Development - Auto-detect based on platform
  const isIOS: boolean = Platform.OS === 'ios';
  const isAndroid: boolean = Platform.OS === 'android';
  const preferEmulatorLoopback: boolean =
    process.env.RN_USE_EMULATOR_HOST === 'true' ||
    process.env.USE_ANDROID_EMULATOR === 'true'; // opt-in flag for emulator loopback

  // For iOS Simulator - use localhost
  if (isIOS && __DEV__) {
    return `http://localhost:${SERVER_PORT}`;
  }

  // For Android Emulator - use 10.0.2.2 (maps to host machine's localhost)
  if (isAndroid && __DEV__ && preferEmulatorLoopback) {
    return `http://10.0.2.2:${SERVER_PORT}`;
  }

  // For real devices, start with common development IPs
  // The connection system will automatically try alternatives if this fails
  // We prioritize common development machine IPs over router IPs
  const defaultIP: string = process.env.SERVER_IP || '192.168.60.111'; // Detected local IP
  return `http://${defaultIP}:${SERVER_PORT}`;
}

// Export the auto-configured URL
export const SERVER_URL = getServerURL();

// Export helper to get alternative URLs to try
export function getAlternativeURLs(): string[] {
  const port: number = SERVER_PORT;
  const alternatives: string[] = [];

  // Platform-specific defaults
  if (Platform.OS === 'ios') {
    alternatives.push(`http://localhost:${port}`);
  } else if (Platform.OS === 'android') {
    alternatives.push(`http://10.0.2.2:${port}`);
  }


  // For real devices, try a focused set first (common development IPs)
  // Priority order: most common development IPs first
  const commonDevIPs: string[] = [
    '192.168.60.111',  // Current development machine IP
    '192.168.1.10',
    '192.168.1.100',  // Common static IP
    '192.168.1.101',
    '192.168.1.2',
    '192.168.1.3',
    '192.168.1.4',
    '192.168.1.5',
    '192.168.0.10',   // Alternative network range
    '192.168.0.100',
    '192.168.0.2',
    '192.168.0.3',
  ];
  
  // Add common development IPs first
  commonDevIPs.forEach((ip: string) => {
    alternatives.push(`http://${ip}:${port}`);
  });
  
  // Then add gateway IPs
  const gatewayIPs: string[] = ['192.168.1.1', '192.168.0.1', '10.0.0.1'];
  gatewayIPs.forEach((ip: string) => {
    alternatives.push(`http://${ip}:${port}`);
  });

  return alternatives;
}

// Log the configuration for debugging
if (__DEV__) {
  console.log('🔧 Server Configuration:');
  console.log('Platform:', Platform.OS);
  console.log('Server URL:', SERVER_URL);
  console.log('Alternative URLs:', getAlternativeURLs());
}
