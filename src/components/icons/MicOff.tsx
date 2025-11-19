import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';

interface MicOffProps {
  height?: number;
  width?: number;
  fill?: string;
}

const MicOff: React.FC<MicOffProps> = ({ height = 28, width = 28, fill = '#1D2939' }) => {
  const containerStyle: StyleProp<ViewStyle> = [
    styles.container,
    { width, height },
  ];

  const micBodyStyle: StyleProp<ViewStyle> = [
    styles.micBody,
    {
      width: width * 0.4,
      height: height * 0.6,
      borderRadius: width * 0.2,
      borderColor: fill,
    },
  ];

  const slashStyle: StyleProp<ViewStyle> = [
    styles.slash,
    {
      width: width * 0.8,
      backgroundColor: fill,
    },
  ];

  return (
    <View style={containerStyle}>
      <View style={micBodyStyle} />
      <View style={slashStyle} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  micBody: {
    borderWidth: 2,
  },
  slash: {
    position: 'absolute',
    height: 2,
    transform: [{ rotate: '45deg' }],
  },
});

export default MicOff;

