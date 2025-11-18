import React from 'react';
import { View, StyleSheet } from 'react-native';
import { RTCView } from 'react-native-webrtc';
import { colors } from '../styles/colors';

const LocalVideo = ({ stream, style }) => {
  if (!stream) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <RTCView
        streamURL={stream.toURL()}
        style={styles.video}
        objectFit="cover"
        mirror={true}
        zOrder={1}
      />
      <View style={styles.shineOverlay} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  shineOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    pointerEvents: 'none',
  },
});

export default LocalVideo;

