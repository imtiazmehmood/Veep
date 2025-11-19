import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';

interface MicOnProps {
  height?: number;
  width?: number;
  fill?: string;
}

const MicOn: React.FC<MicOnProps> = ({ height = 24, width = 24, fill = '#FFF' }) => {
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

  const standStyle: StyleProp<ViewStyle> = [
    styles.stand,
    {
      width: width * 0.15,
      height: height * 0.2,
      backgroundColor: fill,
    },
  ];

  const topStyle: StyleProp<ViewStyle> = [
    styles.top,
    {
      top: -height * 0.1,
      width: width * 0.6,
      height: height * 0.15,
      borderTopLeftRadius: width * 0.3,
      borderTopRightRadius: width * 0.3,
      borderColor: fill,
    },
  ];

  return (
    <View style={containerStyle}>
      <View style={micBodyStyle} />
      <View style={standStyle} />
      <View style={topStyle} />
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
  stand: {
    position: 'absolute',
    bottom: 0,
  },
  top: {
    position: 'absolute',
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
  },
});

export default MicOn;

