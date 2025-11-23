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
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  cancelAnimation,
  runOnJS,
  useDerivedValue,
} from 'react-native-reanimated';
import {
  Canvas,
  Circle,
  LinearGradient,
  vec,
  Group,
  BlurMask,
} from '@shopify/react-native-skia';
import { moderateScale, verticalScale } from '../utils/metrics';

interface ParticleBoxProps {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  particleColor?: string[];
  particleSize?: number;
  minDuration?: number;
  maxDuration?: number;
  backgroundColor?: string;
}

const ParticleBox: React.FC<ParticleBoxProps> = ({
  style,
  children,
  particleColor = ['#00FFFF', '#0000FF', 'transparent'],
  particleSize = moderateScale(60),
  minDuration = 2000,
  maxDuration = 5000,
  backgroundColor = 'rgba(0,0,0,0.05)',
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

      // Random duration for organic feel
      const duration = minDuration + Math.random() * (maxDuration - minDuration);

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
  }, [dimensions, particleSize, minDuration, maxDuration]);

  // Derived values for Skia
  const cx = useDerivedValue(() => translateX.value + particleSize / 2);
  const cy = useDerivedValue(() => translateY.value + particleSize / 2);
  const r = useDerivedValue(() => (particleSize / 2) * scale.value);

  // Gradient positions
  const start = useDerivedValue(() => vec(translateX.value, translateY.value));
  const end = useDerivedValue(() => vec(translateX.value + particleSize, translateY.value + particleSize));

  return (
    <View style={[styles.container, { backgroundColor }, style]} onLayout={onLayout}>
      {dimensions.width > 0 && (
        <View style={StyleSheet.absoluteFill}>
          <Canvas style={{ flex: 1 }}>
            <Group opacity={opacity}>
              <Circle cx={cx} cy={cy} r={r}>
                <LinearGradient
                  start={start}
                  end={end}
                  colors={particleColor}
                />
                <BlurMask blur={20} style="normal" />
              </Circle>
            </Group>
          </Canvas>
        </View>
      )}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden', // Keep particle inside
    borderRadius: moderateScale(16),
    height: verticalScale(200),
    width: '100%',
  },
});

export default React.memo(ParticleBox);
