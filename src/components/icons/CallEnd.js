import React from 'react';
import { View } from 'react-native';

const CallEnd = ({ width = 50, height = 12, fill = '#fff' }) => {
  return (
    <View
      style={{
        width: width,
        height: height,
        backgroundColor: fill,
        borderRadius: 2,
      }}
    />
  );
};

export default CallEnd;

