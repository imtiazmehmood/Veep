import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  StyleProp,
  ViewStyle,
  LayoutChangeEvent,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  cancelAnimation,
  runOnJS,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { moderateScale, verticalScale } from '../../utils/metrics';

interface AIParticleBoxProps {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  particleColor?: string[];
  particleSize?: number;
}

const AIParticleBox: React.FC<AIParticleBoxProps> = ({
  style,
  children,
  particleColor = ['#00FFFF', '#0000FF', 'transparent'],
  particleSize = moderateScale(60),
}) => {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setDimensions({ width, height });
  };

  useEffect(() => {
    if (dimensions.width === 0 || dimensions.height === 0) return;

    const moveParticle = () => {
      // Calculate random position within bounds
      // Subtract particle size to keep it fully inside (mostly)
      const maxX = dimensions.width - particleSize;
      const maxY = dimensions.height - particleSize;

      const randomX = Math.random() * maxX;
      const randomY = Math.random() * maxY;

      // Random duration for organic feel (2s to 5s)
      const duration = 2000 + Math.random() * 3000;

      translateX.value = withTiming(randomX, {
        duration: duration,
        easing: Easing.inOut(Easing.quad),
      });

      translateY.value = withTiming(
        randomY,
        {
          duration: duration,
          easing: Easing.inOut(Easing.quad),
        },
        finished => {
          if (finished) {
            runOnJS(moveParticle)();
          }
        },
      );
    };

    // Start movement
    moveParticle();

    // Breathing animation
    scale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 2000 }),
        withTiming(1, { duration: 2000 }),
      ),
      -1,
      true,
    );

    opacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 1500 }),
        withTiming(0.4, { duration: 1500 }),
      ),
      -1,
      true,
    );

    return () => {
      cancelAnimation(translateX);
      cancelAnimation(translateY);
      cancelAnimation(scale);
      cancelAnimation(opacity);
    };
  }, [dimensions, particleSize]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
      opacity: opacity.value,
    };
  });

  return (
    <View style={[styles.container, style]} onLayout={onLayout}>
      {dimensions.width > 0 && (
        <Animated.View
          style={[
            styles.particle,
            {
              width: particleSize,
              height: particleSize,
              borderRadius: particleSize / 2,
            },
            animatedStyle,
          ]}
        >
          <LinearGradient
            colors={particleColor}
            style={{ flex: 1, borderRadius: particleSize / 2 }}
            start={{ x: 0.3, y: 0.3 }}
            end={{ x: 1, y: 1 }}
          />
        </Animated.View>
      )}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden', // Keep particle inside
    backgroundColor: 'rgba(0,0,0,0.05)', // Subtle background to see the box
    borderRadius: moderateScale(16),
    height: verticalScale(200),
    width: '100%',
  },
  particle: {
    position: 'absolute',
    top: 0,
    left: 0,
    shadowColor: '#00FFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10, // Android glow
  },
});

export default AIParticleBox;
