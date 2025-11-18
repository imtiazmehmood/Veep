import React from 'react';
import { View } from 'react-native';

const MicOff = ({ height = 28, width = 28, fill = '#1D2939' }) => {
  return (
    <View style={{ width, height, justifyContent: 'center', alignItems: 'center' }}>
      <View
        style={{
          width: width * 0.4,
          height: height * 0.6,
          borderRadius: width * 0.2,
          borderWidth: 2,
          borderColor: fill,
        }}
      />
      <View
        style={{
          position: 'absolute',
          width: width * 0.8,
          height: 2,
          backgroundColor: fill,
          transform: [{ rotate: '45deg' }],
        }}
      />
    </View>
  );
};

export default MicOff;

