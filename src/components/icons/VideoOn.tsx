import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';

interface VideoOnProps {
  height?: number;
  width?: number;
  fill?: string;
}

const VideoOn: React.FC<VideoOnProps> = ({ height = 24, width = 24, fill = '#FFF' }) => {
  const containerStyle: StyleProp<ViewStyle> = [
    styles.container,
    { width, height },
  ];

  const videoBoxStyle: StyleProp<ViewStyle> = [
    styles.videoBox,
    {
      width: width * 0.7,
      height: height * 0.5,
      borderColor: fill,
    },
  ];

  const playTriangleStyle: StyleProp<ViewStyle> = [
    styles.playTriangle,
    {
      right: -width * 0.1,
      borderTopWidth: height * 0.15,
      borderBottomWidth: height * 0.15,
      borderLeftWidth: width * 0.2,
      borderLeftColor: fill,
    },
  ];

  return (
    <View style={containerStyle}>
      <View style={videoBoxStyle} />
      <View style={playTriangleStyle} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoBox: {
    borderRadius: 2,
    borderWidth: 2,
  },
  playTriangle: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
});

export default VideoOn;

