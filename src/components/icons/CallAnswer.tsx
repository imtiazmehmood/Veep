import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';

interface CallAnswerProps {
  height?: number;
  fill?: string;
}

const CallAnswer: React.FC<CallAnswerProps> = ({ height = 28, fill = '#fff' }) => {
  const containerStyle: StyleProp<ViewStyle> = [
    styles.container,
    {
      width: height,
      height: height,
      borderRadius: height / 2,
      backgroundColor: fill,
    },
  ];

  const arrowStyle: StyleProp<ViewStyle> = [
    styles.arrow,
    {
      width: height * 0.4,
      height: height * 0.4,
      marginLeft: height * 0.1,
      marginTop: -height * 0.05,
    },
  ];

  return (
    <View style={containerStyle}>
      <View style={arrowStyle} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrow: {
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#050A0E',
    transform: [{ rotate: '45deg' }],
  },
});

export default CallAnswer;

