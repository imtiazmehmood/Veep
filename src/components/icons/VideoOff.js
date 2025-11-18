import React from 'react';
import { View } from 'react-native';

const VideoOff = ({ height = 36, width = 36, fill = '#1D2939' }) => {
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
          width: width * 0.9,
          height: 2,
          backgroundColor: fill,
          transform: [{ rotate: '45deg' }],
        }}
      />
    </View>
  );
};

export default VideoOff;

