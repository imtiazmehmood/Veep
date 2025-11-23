import React, { useEffect, useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  StyleProp,
  ViewStyle,
  LayoutChangeEvent,
} from 'react-native';
import {
  useSharedValue,
  useFrameCallback,
  useDerivedValue,
} from 'react-native-reanimated';
import {
  Canvas,
  Circle,
  RadialGradient,
  vec,
  Group,
} from '@shopify/react-native-skia';
import { moderateScale, verticalScale } from '../utils/metrics';

interface ParticleFlockProps {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  particleColor?: string;
  count?: number;
  maxSpeed?: number;
  minSize?: number;
  maxSize?: number;
}

const ParticleFlock: React.FC<ParticleFlockProps> = ({
  style,
  children,
  particleColor = '#00FFFF',
  count = 80,
  maxSpeed = 4,
  minSize = 1,
  maxSize = 3,
}) => {
  // Use SharedValues for dimensions to avoid JS-UI bridge crossing in frame callback
  const boxWidth = useSharedValue(0);
  const boxHeight = useSharedValue(0);
  const [isReady, setIsReady] = useState(false); // Track if layout is ready for rendering

  // Initialize state arrays
  const initialX = useMemo(
    () => Array.from({ length: count }).map(() => Math.random() * 300),
    [count],
  );
  const initialY = useMemo(
    () => Array.from({ length: count }).map(() => Math.random() * 200),
    [count],
  );
  const initialVX = useMemo(
    () =>
      Array.from({ length: count }).map(
        () => (Math.random() - 0.5) * maxSpeed,
      ),
    [count, maxSpeed],
  );
  const initialVY = useMemo(
    () =>
      Array.from({ length: count }).map(
        () => (Math.random() - 0.5) * maxSpeed,
      ),
    [count, maxSpeed],
  );
  const sizes = useMemo(
    () =>
      Array.from({ length: count }).map(() => Math.random() * (maxSize - minSize) + minSize),
    [count, minSize, maxSize],
  );
  const opacities = useMemo(
    () =>
      Array.from({ length: count }).map(
        () => Math.random() * 0.5 + 0.3,
      ),
    [count],
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

    const currentX = [...x.value];
    const currentY = [...y.value];
    const currentVX = [...vx.value];
    const currentVY = [...vy.value];

    for (let i = 0; i < count; i++) {
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
      if (speed > maxSpeed) {
        pvx = (pvx / speed) * maxSpeed;
        pvy = (pvy / speed) * maxSpeed;
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

  // We can't map directly inside Canvas easily with shared values updating every frame
  // unless we use a custom drawing component or pass the shared value to a component that reads it.
  // However, Skia's declarative API is fast.
  // A better approach for high particle count is using `Atlas` but for < 100 particles,
  // mapping components is usually fine if we can read the shared value.
  // Since x and y are arrays in a SharedValue, we need a component that reads them.

  const Particles = () => {
    // This will re-render on every frame because x.value changes?
    // No, SharedValue changes don't trigger React re-renders unless we use useDerivedValue or similar.
    // But we need to read the values to pass to Circle.
    // Skia components accept SharedValues for props!
    // But x is an array... Skia doesn't support array shared values for mapping directly.
    // We need to create individual shared values or use a custom drawing loop.
    // For simplicity in this migration, let's stick to the declarative approach but we might need
    // to force update or use a different strategy if it doesn't animate.
    // Actually, useFrameCallback updates the shared value, but React doesn't know.
    // We need a way to drive the Skia view.
    // Let's use a simpler approach: Individual shared values would be too many hooks.
    // Let's use the `useDerivedValue` to slice the array? No.
    // Correct Skia approach for particles:
    // 1. Use `Picture` or `Atlas` (complex)
    // 2. Just map and hope Skia handles it? No, we need to pass `cx` and `cy` as props.
    // If we pass `x.value[i]`, it's just a number, not a shared value.
    // So we need to wrap each particle in a component that reads the specific index from the shared array?

    return (
      <Group>
        {initialX.map((_, i) => (
          <SingleParticle
            key={i}
            index={i}
            x={x}
            y={y}
            size={sizes[i]}
            opacity={opacities[i]}
            color={particleColor}
          />
        ))}
      </Group>
    );
  };

  return (
    <View style={[styles.container, style]} onLayout={onLayout}>
      {isReady && (
        <View style={StyleSheet.absoluteFill}>
          <Canvas style={{ flex: 1 }}>
            <Particles />
          </Canvas>
        </View>
      )}
      {children}
    </View>
  );
};

const SingleParticle = ({
  index,
  x,
  y,
  size,
  opacity,
  color,
}: {
  index: number;
  x: any; // SharedValue<number[]>
  y: any; // SharedValue<number[]>
  size: number;
  opacity: number;
  color: string;
}) => {
  // Create a derived value for this specific particle's position
  const cx = useDerivedValue(() => x.value[index]);
  const cy = useDerivedValue(() => y.value[index]);
  const center = useDerivedValue(() => vec(x.value[index], y.value[index]));

  return (
    <Circle cx={cx} cy={cy} r={size} opacity={opacity}>
      <RadialGradient
        c={center}
        r={size}
        colors={[color, 'transparent']}
      />
    </Circle>
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

export default React.memo(ParticleFlock);
