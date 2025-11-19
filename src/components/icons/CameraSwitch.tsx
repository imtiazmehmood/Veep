import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';

interface CameraSwitchProps {
  height?: number;
  width?: number;
  fill?: string;
}

const CameraSwitch: React.FC<CameraSwitchProps> = ({ height = 24, width = 24, fill = '#FFF' }) => {
  const containerStyle: StyleProp<ViewStyle> = [
    styles.container,
    { width, height },
  ];

  const mainBoxStyle: StyleProp<ViewStyle> = [
    styles.mainBox,
    {
      width: width * 0.6,
      height: height * 0.6,
      borderColor: fill,
    },
  ];

  const topCornerStyle: StyleProp<ViewStyle> = [
    styles.corner,
    {
      top: -height * 0.1,
      left: -width * 0.1,
      width: width * 0.3,
      height: height * 0.3,
      borderRadius: width * 0.15,
      borderColor: fill,
    },
  ];

  const bottomCornerStyle: StyleProp<ViewStyle> = [
    styles.corner,
    {
      bottom: -height * 0.1,
      right: -width * 0.1,
      width: width * 0.3,
      height: height * 0.3,
      borderRadius: width * 0.15,
      borderColor: fill,
    },
  ];

  return (
    <View style={containerStyle}>
      <View style={mainBoxStyle} />
      <View style={topCornerStyle} />
      <View style={bottomCornerStyle} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainBox: {
    borderRadius: 2,
    borderWidth: 2,
  },
  corner: {
    position: 'absolute',
    borderWidth: 1.5,
  },
});

export default CameraSwitch;

