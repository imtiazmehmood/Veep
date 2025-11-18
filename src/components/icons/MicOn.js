import React from 'react';
import { View } from 'react-native';

const MicOn = ({ height = 24, width = 24, fill = '#FFF' }) => {
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
          bottom: 0,
          width: width * 0.15,
          height: height * 0.2,
          backgroundColor: fill,
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: -height * 0.1,
          width: width * 0.6,
          height: height * 0.15,
          borderTopWidth: 2,
          borderLeftWidth: 2,
          borderRightWidth: 2,
          borderColor: fill,
          borderTopLeftRadius: width * 0.3,
          borderTopRightRadius: width * 0.3,
        }}
      />
    </View>
  );
};

export default MicOn;

