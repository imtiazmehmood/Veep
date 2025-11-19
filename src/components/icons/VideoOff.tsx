import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';

interface VideoOffProps {
  height?: number;
  width?: number;
  fill?: string;
}

const VideoOff: React.FC<VideoOffProps> = ({ height = 36, width = 36, fill = '#1D2939' }) => {
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

  const slashStyle: StyleProp<ViewStyle> = [
    styles.slash,
    {
      width: width * 0.9,
      backgroundColor: fill,
    },
  ];

  return (
    <View style={containerStyle}>
      <View style={videoBoxStyle} />
      <View style={slashStyle} />
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
  slash: {
    position: 'absolute',
    height: 2,
    transform: [{ rotate: '45deg' }],
  },
});

export default VideoOff;

