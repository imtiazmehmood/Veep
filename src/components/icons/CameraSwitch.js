import React from 'react';
import { View } from 'react-native';

const CameraSwitch = ({ height = 24, width = 24, fill = '#FFF' }) => {
  return (
    <View style={{ width, height, justifyContent: 'center', alignItems: 'center' }}>
      <View
        style={{
          width: width * 0.6,
          height: height * 0.6,
          borderRadius: 2,
          borderWidth: 2,
          borderColor: fill,
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: -height * 0.1,
          left: -width * 0.1,
          width: width * 0.3,
          height: height * 0.3,
          borderRadius: width * 0.15,
          borderWidth: 1.5,
          borderColor: fill,
        }}
      />
      <View
        style={{
          position: 'absolute',
          bottom: -height * 0.1,
          right: -width * 0.1,
          width: width * 0.3,
          height: height * 0.3,
          borderRadius: width * 0.15,
          borderWidth: 1.5,
          borderColor: fill,
        }}
      />
    </View>
  );
};

export default CameraSwitch;

