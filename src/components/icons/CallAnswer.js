import React from 'react';
import { View } from 'react-native';

const CallAnswer = ({ height = 28, fill = '#fff' }) => {
  return (
    <View
      style={{
        width: height,
        height: height,
        borderRadius: height / 2,
        backgroundColor: fill,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
      <View
        style={{
          width: height * 0.4,
          height: height * 0.4,
          borderLeftWidth: 2,
          borderBottomWidth: 2,
          borderColor: '#050A0E',
          transform: [{ rotate: '45deg' }],
          marginLeft: height * 0.1,
          marginTop: -height * 0.05,
        }}
      />
    </View>
  );
};

export default CallAnswer;

