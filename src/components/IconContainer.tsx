import React from 'react';
import { TouchableOpacity, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import type { IconContainerProps } from '../types/components';

const IconContainer: React.FC<IconContainerProps> = ({
  backgroundColor,
  onPress,
  Icon,
  style,
}) => {
  const containerStyle: StyleProp<ViewStyle> = [
    styles.container,
    backgroundColor && { backgroundColor },
    style,
  ];

  return (
    <TouchableOpacity onPress={onPress} style={containerStyle}>
      <Icon />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    borderRadius: 30,
    height: 60,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default IconContainer;
