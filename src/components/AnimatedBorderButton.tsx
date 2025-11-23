import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
  TextStyle,
  LayoutChangeEvent,
} from 'react-native';
import Animated, {
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
  useDerivedValue,
  cancelAnimation,
  useFrameCallback,
} from 'react-native-reanimated';
import {
  Canvas,
  SweepGradient,
  BlurMask,
  vec,
  Group,
  RoundedRect,
  DashPathEffect,
  Paint,
} from '@shopify/react-native-skia';
import { moderateScale, verticalScale } from '../utils/metrics';
import { Fonts } from '../theme/Fonts';
import { useTheme } from '../context/ThemeContext';
import { useThemeStyles } from '../hooks/useThemeStyles';
import { ThemeColors } from '../theme/Colors';

interface AnimatedBorderButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  borderColors?: string[];
  borderWidth?: number;
  borderRadius?: number;
  duration?: number;
  snakeLength?: number;
}

const DEFAULT_BORDER_COLORS = [
  '#FF00FF', // Magenta
  '#00FFFF', // Cyan
  '#00FF00', // Green
  '#FFFF00', // Yellow
  '#FF00FF', // Loop back to Magenta
];

const AnimatedBorderButton: React.FC<AnimatedBorderButtonProps> = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  style,
  textStyle,
  borderColors = DEFAULT_BORDER_COLORS,
  borderWidth = 2,
  borderRadius,
  duration = 2000,
  snakeLength: customSnakeLength,
}) => {
  const { colors, isDarkMode } = useTheme();
  const styles = useThemeStyles(createStyles);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const progress = useSharedValue(0);

  const onLayout = React.useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setDimensions((prev) => {
      if (prev.width === width && prev.height === height) return prev;
      return { width, height };
    });
  }, []);

  const effectiveRadius = borderRadius ?? moderateScale(30);

  // Clamp radius to ensure it fits
  const r = dimensions.width > 0 && dimensions.height > 0
    ? Math.min(effectiveRadius, dimensions.width / 2, dimensions.height / 2)
    : effectiveRadius;

  const center = vec(dimensions.width / 2, dimensions.height / 2);

  // Calculate perimeter
  const perimeter = React.useMemo(() => {
    // 2 * (w + h) - 8 * r + 2 * PI * r
    // Using the inset dimensions for accurate path length
    const w = dimensions.width - borderWidth;
    const h = dimensions.height - borderWidth;
    const rad = Math.max(0, r - borderWidth / 2);

    return 2 * (w + h) - 8 * rad + 2 * Math.PI * rad;
  }, [dimensions, r, borderWidth]);

  const snakeLength = customSnakeLength ?? perimeter * 0.3;
  const intervals = React.useMemo(() => [snakeLength, perimeter - snakeLength], [snakeLength, perimeter]);

  useFrameCallback((frameInfo) => {
    if (!frameInfo.timeSinceFirstFrame) return;
    // Use absolute timestamp to ensure synchronization across mounts
    // We use a large divisor to keep the number manageable, but the modulo keeps it in 0-1 range
    // duration is in ms, timestamp is in ms
    const totalDuration = duration;
    const time = frameInfo.timestamp;
    progress.value = (time % totalDuration) / totalDuration;
  });

  // Animate the dash phase
  // We want it to move around the path.
  // phase = 0 -> start
  // phase = perimeter -> full loop
  // Note: DashPathEffect phase usually shifts the dash.
  // To move "forward", we might need negative phase or positive depending on direction.
  const phase = useDerivedValue(() => {
    return -progress.value * perimeter;
  });

  return (
    <View
      style={[
        styles.container,
        { borderRadius: effectiveRadius },
        style,
        (disabled || loading) && styles.disabledContainer,
      ]}
      onLayout={onLayout}
    >
      {dimensions.width > 0 && (
        <View style={StyleSheet.absoluteFill}>
          <Canvas style={{ flex: 1 }}>
            <Group>
              {/* Layer 1: Wide Outer Glow (Atmosphere) */}
              <RoundedRect
                x={borderWidth / 2}
                y={borderWidth / 2}
                width={dimensions.width - borderWidth}
                height={dimensions.height - borderWidth}
                r={Math.max(0, r - borderWidth / 2)}
                style="stroke"
                strokeWidth={borderWidth + 4} // Slightly wider for glow
                color="white"
                opacity={0.5}
              >
                <SweepGradient
                  c={center}
                  colors={borderColors}
                />
                <DashPathEffect intervals={intervals} phase={phase} />
                <BlurMask blur={20} style="normal" />
              </RoundedRect>

              {/* Layer 2: Tight Inner Glow (Intensity) */}
              <RoundedRect
                x={borderWidth / 2}
                y={borderWidth / 2}
                width={dimensions.width - borderWidth}
                height={dimensions.height - borderWidth}
                r={Math.max(0, r - borderWidth / 2)}
                style="stroke"
                strokeWidth={borderWidth + 2}
                color="white"
                opacity={0.8}
              >
                <SweepGradient
                  c={center}
                  colors={borderColors}
                />
                <DashPathEffect intervals={intervals} phase={phase} />
                <BlurMask blur={8} style="normal" />
              </RoundedRect>

              {/* Layer 3: The Core (Sharp Border) */}
              <RoundedRect
                x={borderWidth / 2}
                y={borderWidth / 2}
                width={dimensions.width - borderWidth}
                height={dimensions.height - borderWidth}
                r={Math.max(0, r - borderWidth / 2)}
                style="stroke"
                strokeWidth={borderWidth}
                color="white"
              >
                <SweepGradient
                  c={center}
                  colors={borderColors}
                />
                <DashPathEffect intervals={intervals} phase={phase} />
              </RoundedRect>
            </Group>
          </Canvas>
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.innerButton,
          { margin: borderWidth },
          {
            borderRadius: Math.max(0, effectiveRadius - borderWidth)
          },
        ]}
        onPress={onPress}
        activeOpacity={0.8}
        disabled={disabled || loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.text} />
        ) : (
          <Text style={[styles.buttonText, textStyle]}>{title}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      borderRadius: moderateScale(30),
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
      height: verticalScale(56),
      width: '100%',
      backgroundColor: 'transparent',
    },
    disabledContainer: {
      opacity: 0.7,
    },
    innerButton: {
      borderRadius: moderateScale(28),
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
      width: '100%',
      zIndex: 1, // Ensure button is above canvas
    },
    buttonText: {
      fontWeight: '600',
      color: colors.text,
      fontSize: moderateScale(16),
      fontFamily: Fonts.OpenSansSemiBold,
    },
  });

export default React.memo(AnimatedBorderButton);
