import React, { useEffect, useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  StyleProp,
  ViewStyle,
  LayoutChangeEvent,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  useFrameCallback,
  runOnJS,
  SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { moderateScale, verticalScale } from '../utils/metrics';

const NUM_PARTICLES = 80;
const MAX_SPEED = 4;
const NEIGHBOR_DIST = 50; // This constant is no longer used in the new logic, but kept for consistency if needed later.
const MOUSE_ATTRACTION = 0.005; // This constant is no longer used in the new logic, but kept for consistency if needed later.

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface AIParticleFlokProps {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  particleColor?: string;
}

const Particle = ({
  index,
  x,
  y,
  size,
  opacity,
}: {
  index: number;
  x: SharedValue<number[]>;
  y: SharedValue<number[]>;
  size: number;
  opacity: number;
}) => {
  const animatedProps = useAnimatedProps(() => {
    return {
      cx: x.value[index],
      cy: y.value[index],
    };
  });

  return (
    <AnimatedCircle
      animatedProps={animatedProps}
      r={size}
      fill="url(#grad)"
      opacity={opacity}
    />
  );
};

const AIParticleFlok: React.FC<AIParticleFlokProps> = ({
  style,
  children,
  particleColor = '#00FFFF',
}) => {
  // Use SharedValues for dimensions to avoid JS-UI bridge crossing in frame callback
  const boxWidth = useSharedValue(0);
  const boxHeight = useSharedValue(0);
  const [isReady, setIsReady] = useState(false); // Track if layout is ready for rendering SVG

  // Initialize state arrays
  const initialX = useMemo(
    () => Array.from({ length: NUM_PARTICLES }).map(() => Math.random() * 300),
    [],
  );
  const initialY = useMemo(
    () => Array.from({ length: NUM_PARTICLES }).map(() => Math.random() * 200),
    [],
  );
  const initialVX = useMemo(
    () =>
      Array.from({ length: NUM_PARTICLES }).map(
        () => (Math.random() - 0.5) * MAX_SPEED,
      ),
    [],
  );
  const initialVY = useMemo(
    () =>
      Array.from({ length: NUM_PARTICLES }).map(
        () => (Math.random() - 0.5) * MAX_SPEED,
      ),
    [],
  );
  const sizes = useMemo(
    () =>
      Array.from({ length: NUM_PARTICLES }).map(() => Math.random() * 2 + 1),
    [],
  );
  const opacities = useMemo(
    () =>
      Array.from({ length: NUM_PARTICLES }).map(
        () => Math.random() * 0.5 + 0.3,
      ),
    [],
  );

  // Shared Values for physics state
  const x = useSharedValue(initialX);
  const y = useSharedValue(initialY);
  const vx = useSharedValue(initialVX);
  const vy = useSharedValue(initialVY);

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    boxWidth.value = width;
    boxHeight.value = height;
    setIsReady(true);
  };

  useFrameCallback(() => {
    const width = boxWidth.value;
    const height = boxHeight.value;

    if (width === 0 || height === 0) return;

    const centerX = width / 2;
    const centerY = height / 2;
    const time = Date.now() / 1000;
    const targetX = centerX + Math.sin(time * 0.5) * (width * 0.3);
    const targetY = centerY + Math.cos(time * 0.3) * (height * 0.3);

    // Clone arrays to mutate (or mutate in place if Reanimated allows, but let's be safe with new refs for reactivity)
    // Actually, for performance, we should mutate a local copy and assign back?
    // Reanimated SharedValues holding arrays: assigning .value = newArray triggers updates.
    // Mutating .value[i] = ... does NOT trigger updates usually.
    // However, we need useAnimatedProps to pick it up.

    const currentX = [...x.value];
    const currentY = [...y.value];
    const currentVX = [...vx.value];
    const currentVY = [...vy.value];

    for (let i = 0; i < NUM_PARTICLES; i++) {
      let pvx = currentVX[i];
      let pvy = currentVY[i];
      let px = currentX[i];
      let py = currentY[i];

      const dx = targetX - px;
      const dy = targetY - py;

      pvx += dx * 0.0005;
      pvy += dy * 0.0005;

      pvx += (Math.random() - 0.5) * 0.1;
      pvy += (Math.random() - 0.5) * 0.1;

      const speed = Math.sqrt(pvx * pvx + pvy * pvy);
      if (speed > MAX_SPEED) {
        pvx = (pvx / speed) * MAX_SPEED;
        pvy = (pvy / speed) * MAX_SPEED;
      }

      px += pvx;
      py += pvy;

      if (px < 0) px = width;
      if (px > width) px = 0;
      if (py < 0) py = height;
      if (py > height) py = 0;

      currentX[i] = px;
      currentY[i] = py;
      currentVX[i] = pvx;
      currentVY[i] = pvy;
    }

    x.value = currentX;
    y.value = currentY;
    vx.value = currentVX;
    vy.value = currentVY;
  });

  return (
    <View style={[styles.container, style]} onLayout={onLayout}>
      {isReady && (
        <View style={StyleSheet.absoluteFill}>
          <Svg width="100%" height="100%">
            <Defs>
              <RadialGradient
                id="grad"
                cx="50%"
                cy="50%"
                r="50%"
                fx="50%"
                fy="50%"
              >
                <Stop offset="0%" stopColor={particleColor} stopOpacity="1" />
                <Stop offset="100%" stopColor={particleColor} stopOpacity="0" />
              </RadialGradient>
            </Defs>
            {initialX.map((_, i) => (
              <Particle
                key={i}
                index={i}
                x={x}
                y={y}
                size={sizes[i]}
                opacity={opacities[i]}
              />
            ))}
          </Svg>
        </View>
      )}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: moderateScale(16),
    height: verticalScale(200),
    width: '100%',
  },
});

export default AIParticleFlok;
