import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Animated,
} from 'react-native';
import { globalStyles } from '../styles/globalStyles';
import { colors } from '../styles/colors';
import LocalVideo from '../components/LocalVideo';
import RemoteVideo from '../components/RemoteVideo';
import { useWebRTCContext } from '../context/WebRTCContext';
import type { NavigationProps } from '../types/navigation';

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  style?: object;
}

// Improved icon component with better Unicode symbols
const Icon: React.FC<IconProps> = ({ name, size = 24, color = colors.white, style }) => {
  const iconMap: Record<string, string> = {
    mic: '🎤',
    'mic-off': '🔇',
    videocam: '📹',
    'videocam-off': '📵',
    camera: '🔄',
    'call-end': '📞',
    copy: '📋',
  };
  return (
    <Text style={[{ fontSize: size, color }, style]}>
      {iconMap[name] || '•'}
    </Text>
  );
};

const CallScreen: React.FC<NavigationProps<'Call'>> = ({ route, navigation }) => {
  const { isCaller = false } = route?.params || {};
  const fadeAnim = React.useRef(new Animated.Value(1)).current;

  const {
    localStream,
    remoteStream,
    isMuted,
    isVideoEnabled,
    switchCamera,
    toggleMute,
    toggleVideo,
    hangup,
    callId,
    isCallActive,
  } = useWebRTCContext();

  useEffect(() => {
    // Animate call ID container
    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0.5,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleHangup = () => {
    Alert.alert(
      'End Call',
      'Are you sure you want to end the call?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Call',
          style: 'destructive',
          onPress: () => {
            hangup();
            navigation.navigate('Home');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Remote Video - Full Screen */}
      <View style={styles.remoteVideoContainer}>
        <RemoteVideo stream={remoteStream} />
        {!isCallActive && (
          <View style={styles.waitingOverlay}>
            <View style={styles.waitingContent}>
              <View style={styles.waitingIconContainer}>
                <Text style={styles.waitingIcon}>⏳</Text>
              </View>
              <Text style={styles.waitingTitle}>
                {isCaller ? 'Waiting for someone to join...' : 'Waiting for caller...'}
              </Text>
              <Text style={styles.waitingSubtitle}>
                {isCaller
                  ? 'Share the call ID below with others'
                  : 'Please wait while we connect you'}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Local Video - Picture in Picture */}
      {localStream && (
        <View style={styles.localVideoContainer}>
          <LocalVideo stream={localStream} style={styles.localVideo} />
          <View style={styles.localVideoBadge}>
            <Text style={styles.badgeText}>You</Text>
          </View>
        </View>
      )}

      {/* Call ID Display */}
      {callId && (
        <Animated.View
          style={[
            styles.callIdContainer,
            { opacity: fadeAnim },
          ]}
        >
          <View style={styles.callIdHeader}>
            <Text style={styles.callIdLabel}>Call ID</Text>
            <TouchableOpacity
              style={styles.copyButton}
              onPress={() => {
                Alert.alert('Call ID', callId);
              }}
            >
              <Icon name="copy" size={16} color={colors.primaryLight} />
            </TouchableOpacity>
          </View>
          <Text style={styles.callIdValue} numberOfLines={1}>
            {callId}
          </Text>
        </Animated.View>
      )}

      {/* Status Indicator */}
      {isCallActive && (
        <View style={styles.statusIndicator}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>Connected</Text>
        </View>
      )}

      {/* Control Bar */}
      <View style={styles.controlBar}>
        <TouchableOpacity
          style={[
            styles.controlButton,
            isMuted && styles.controlButtonActive,
          ]}
          onPress={toggleMute}
          activeOpacity={0.7}
        >
          <Icon
            name={isMuted ? 'mic-off' : 'mic'}
            size={26}
            color={isMuted ? colors.white : colors.text}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.controlButton,
            !isVideoEnabled && styles.controlButtonActive,
          ]}
          onPress={toggleVideo}
          activeOpacity={0.7}
        >
          <Icon
            name={isVideoEnabled ? 'videocam' : 'videocam-off'}
            size={26}
            color={isVideoEnabled ? colors.text : colors.white}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={switchCamera}
          activeOpacity={0.7}
        >
          <Icon name="camera" size={26} color={colors.text} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, styles.hangupButton]}
          onPress={handleHangup}
          activeOpacity={0.8}
        >
          <Icon name="call-end" size={28} color={colors.white} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  remoteVideoContainer: {
    flex: 1,
    position: 'relative',
  },
  localVideoContainer: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 140,
    height: 180,
    zIndex: 10,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 12,
  },
  localVideo: {
    width: '100%',
    height: '100%',
  },
  localVideoBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: colors.overlay,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  waitingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.overlay,
  },
  waitingContent: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  waitingIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  waitingIcon: {
    fontSize: 56,
  },
  waitingTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  waitingSubtitle: {
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  callIdContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    backgroundColor: colors.overlay,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    zIndex: 10,
    borderWidth: 1,
    borderColor: colors.primary,
    minWidth: 200,
    maxWidth: 250,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  callIdHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  callIdLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  copyButton: {
    padding: 4,
  },
  callIdValue: {
    color: colors.primaryLight,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  statusIndicator: {
    position: 'absolute',
    top: 60,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    zIndex: 10,
    shadowColor: colors.success,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.white,
    marginRight: 6,
  },
  statusText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  controlBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    backgroundColor: colors.overlay,
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  controlButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  controlButtonActive: {
    backgroundColor: colors.danger,
    borderColor: colors.danger,
  },
  hangupButton: {
    backgroundColor: colors.danger,
    borderColor: colors.danger,
    width: 72,
    height: 72,
    borderRadius: 36,
    shadowColor: colors.danger,
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default CallScreen;
