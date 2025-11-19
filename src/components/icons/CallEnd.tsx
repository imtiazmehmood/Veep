import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';

interface CallEndProps {
  width?: number;
  height?: number;
  fill?: string;
}

const CallEnd: React.FC<CallEndProps> = ({ width = 50, height = 12, fill = '#fff' }) => {
  const containerStyle: StyleProp<ViewStyle> = [
    styles.container,
    {
      width,
      height,
      backgroundColor: fill,
    },
  ];

  return <View style={containerStyle} />;
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 2,
  },
});

export default CallEnd;

