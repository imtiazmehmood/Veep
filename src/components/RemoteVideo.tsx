import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { RTCView } from 'react-native-webrtc';
import { colors } from '../styles/colors';
import type { RemoteVideoProps } from '../types/components';

const RemoteVideo: React.FC<RemoteVideoProps> = ({ stream }) => {
  if (!stream) {
    return (
      <View style={styles.container}>
        <View style={styles.placeholder}>
          <View style={styles.placeholderIconContainer}>
            <Text style={styles.placeholderIcon}>👤</Text>
          </View>
          <Text style={styles.placeholderText}>Waiting for remote video...</Text>
          <Text style={styles.placeholderSubtext}>
            The other participant's video will appear here
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <RTCView
        streamURL={stream.toURL()}
        style={styles.video}
        objectFit="cover"
        zOrder={0}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  video: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 32,
  },
  placeholderIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: colors.border,
  },
  placeholderIcon: {
    fontSize: 64,
  },
  placeholderText: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  placeholderSubtext: {
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default RemoteVideo;

