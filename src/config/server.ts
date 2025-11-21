/// <reference path="../types/global.d.ts" />

import { Platform } from 'react-native';

// Declare global __DEV__ variable for TypeScript
declare const __DEV__: boolean;

// Production server URL - always use Render deployment
const PRODUCTION_SERVER_URL = 'https://veep-app-server.onrender.com';

// Get server URL - always returns production Render server
function getServerURL(): string {
  return PRODUCTION_SERVER_URL;
}

// Export the server URL
export const SERVER_URL = getServerURL();

// Export empty alternative URLs (no fallbacks needed for production server)
export function getAlternativeURLs(): string[] {
  return []; // No alternatives - only use Render server
}

// Log the configuration for debugging
console.log('🔧 Server Configuration:');
console.log('Platform:', Platform.OS);
console.log('Server URL:', SERVER_URL);
console.log('Using production Render server');
