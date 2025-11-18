import React from 'react';
import { View } from 'react-native';

const VideoOn = ({ height = 24, width = 24, fill = '#FFF' }) => {
  return (
    <View style={{ width, height, justifyContent: 'center', alignItems: 'center' }}>
      <View
        style={{
          width: width * 0.7,
          height: height * 0.5,
          borderRadius: 2,
          borderWidth: 2,
          borderColor: fill,
        }}
      />
      <View
        style={{
          position: 'absolute',
          right: -width * 0.1,
          width: 0,
          height: 0,
          borderTopWidth: height * 0.15,
          borderBottomWidth: height * 0.15,
          borderLeftWidth: width * 0.2,
          borderTopColor: 'transparent',
          borderBottomColor: 'transparent',
          borderLeftColor: fill,
        }}
      />
    </View>
  );
};

export default VideoOn;

