import { Platform } from 'react-native';

// Auto-configured server URL based on platform and environment
// No manual configuration needed! The system will automatically:
// - Use localhost for iOS Simulator
// - Use 10.0.2.2 for Android Emulator  
// - Try multiple common IPs for real devices

const SERVER_PORT = 3500;

// Get server URL based on platform
function getServerURL() {
  // Production URL
  if (!__DEV__) {
    return 'https://your-production-server.com:3500';
  }

  // Development - Auto-detect based on platform
  const isIOS = Platform.OS === 'ios';
  const isAndroid = Platform.OS === 'android';

  // For iOS Simulator - use localhost
  if (isIOS && __DEV__) {
    return `http://localhost:${SERVER_PORT}`;
  }

  // For Android Emulator - use 10.0.2.2 (maps to host machine's localhost)
  if (isAndroid && __DEV__) {
    return `http://10.0.2.2:${SERVER_PORT}`;
  }

  // For real devices, start with common development IPs
  // The connection system will automatically try alternatives if this fails
  // We prioritize common development machine IPs over router IPs
  const defaultIP = process.env.SERVER_IP || '192.168.1.10'; // Common dev machine IP
  return `http://${defaultIP}:${SERVER_PORT}`;
}

// Export the auto-configured URL
export const SERVER_URL = getServerURL();

// Export helper to get alternative URLs to try
export function getAlternativeURLs() {
  const port = SERVER_PORT;
  const alternatives = [];

  // Platform-specific defaults
  if (Platform.OS === 'ios') {
    alternatives.push(`http://localhost:${port}`);
  } else if (Platform.OS === 'android') {
    alternatives.push(`http://10.0.2.2:${port}`);
  }

  // Generate IP addresses to try for real devices
  // We'll try common ranges: 192.168.1.x, 192.168.0.x, 10.0.0.x
  const generateIPs = () => {
    const ips = [];
    
    // Common router/gateway IPs (try first)
    const gateways = [
      '192.168.1.1',
      '192.168.0.1',
      '192.168.1.254',
      '192.168.0.254',
      '10.0.0.1',
      '172.16.0.1',
    ];
    ips.push(...gateways);
    
    // Common development machine IPs (192.168.1.x range)
    for (let i = 2; i <= 255; i++) {
      if (i !== 1 && i !== 254) { // Skip gateway IPs already added
        ips.push(`192.168.1.${i}`);
      }
    }
    
    // Alternative range (192.168.0.x)
    for (let i = 2; i <= 255; i++) {
      if (i !== 1 && i !== 254) {
        ips.push(`192.168.0.${i}`);
      }
    }
    
    return ips;
  };

  // For real devices, try a focused set first (common development IPs)
  // Priority order: most common development IPs first
  const commonDevIPs = [
    '192.168.1.10',   // Very common development IP (tried FIRST)
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
  commonDevIPs.forEach(ip => {
    alternatives.push(`http://${ip}:${port}`);
  });
  
  // Then add gateway IPs
  ['192.168.1.1', '192.168.0.1', '10.0.0.1'].forEach(ip => {
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
