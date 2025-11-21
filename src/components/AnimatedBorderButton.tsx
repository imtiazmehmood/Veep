import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
  Easing,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
  TextStyle,
  LayoutChangeEvent,
} from 'react-native';
import Svg, { Rect, Defs, LinearGradient, Stop } from 'react-native-svg';
import { moderateScale, verticalScale } from '../../utils/metrics';
import { Fonts } from '../../theme/Fonts';
import { useTheme } from '../../context/ThemeContext';
import { useThemeStyles } from '../../hooks/useThemeStyles';
import { ThemeColors } from '../../theme/Colors';

const AnimatedRect = Animated.createAnimatedComponent(Rect);

interface AnimatedBorderButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  borderColors?: string[];
  borderWidth?: number;
}

const AnimatedBorderButton: React.FC<AnimatedBorderButtonProps> = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  style,
  textStyle,
  borderColors = [
    '#FF0000',
    '#00FF00',
    '#0000FF',
    '#FFFF00',
    '#FF00FF',
    '#00FFFF',
  ],
  borderWidth = 2,
}) => {
  const { colors, isDarkMode } = useTheme();
  const styles = useThemeStyles(createStyles);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const animationValue = useRef(new Animated.Value(0)).current;

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setDimensions({ width, height });
  };

  // Effective dimensions (center of the stroke)
  const effectiveWidth = dimensions.width - borderWidth;
  const effectiveHeight = dimensions.height - borderWidth;

  // Effective radius (clamped to half the shortest side)
  const effectiveRadius = Math.min(
    moderateScale(30),
    effectiveWidth / 2,
    effectiveHeight / 2,
  );

  // Precise perimeter calculation: 2 * (w + h) - 8 * r + 2 * PI * r
  const perimeter =
    2 * (effectiveWidth + effectiveHeight) -
    8 * effectiveRadius +
    2 * Math.PI * effectiveRadius;

  const snakeLength = perimeter * 0.3; // Shorter snake for double effect (30% each)

  useEffect(() => {
    if (dimensions.width > 0 && dimensions.height > 0) {
      const startAnimation = () => {
        animationValue.setValue(0);
        Animated.loop(
          Animated.timing(animationValue, {
            toValue: 1,
            duration: 3000, // Slower for elegance
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ).start();
      };
      startAnimation();
    }
  }, [dimensions, animationValue]);

  // First snake offset
  const strokeDashoffset1 = animationValue.interpolate({
    inputRange: [0, 1],
    outputRange: [perimeter, 0],
  });

  // Second snake offset (shifted by half perimeter)
  const strokeDashoffset2 = animationValue.interpolate({
    inputRange: [0, 1],
    outputRange: [perimeter + perimeter / 2, 0 + perimeter / 2],
  });

  return (
    <View
      style={[
        styles.container,
        style,
        (disabled || loading) && styles.disabledContainer,
      ]}
      onLayout={onLayout}
    >
      {dimensions.width > 0 && (
        <View style={StyleSheet.absoluteFill}>
          <Svg width={dimensions.width} height={dimensions.height}>
            <Defs>
              <LinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                {borderColors.map((color, index) => (
                  <Stop
                    key={index}
                    offset={`${(index / (borderColors.length - 1)) * 100}%`}
                    stopColor={color}
                  />
                ))}
              </LinearGradient>
            </Defs>

            {/* Background Border (Static/Dimmed) */}
            <Rect
              x={borderWidth / 2}
              y={borderWidth / 2}
              width={dimensions.width - borderWidth}
              height={dimensions.height - borderWidth}
              rx={effectiveRadius}
              ry={effectiveRadius}
              stroke={colors.border}
              strokeWidth={borderWidth}
              fill="none"
              opacity={0.1}
            />

            {/* GLOW EFFECT - Snake 1 */}
            <AnimatedRect
              x={borderWidth / 2}
              y={borderWidth / 2}
              width={dimensions.width - borderWidth}
              height={dimensions.height - borderWidth}
              rx={effectiveRadius}
              ry={effectiveRadius}
              stroke="url(#grad)"
              strokeWidth={borderWidth * 4} // Wider for glow
              fill="none"
              strokeDasharray={[snakeLength, perimeter - snakeLength]}
              strokeDashoffset={strokeDashoffset1}
              strokeLinecap="round"
              opacity={0.3} // Transparent for glow
            />

            {/* GLOW EFFECT - Snake 2 */}
            <AnimatedRect
              x={borderWidth / 2}
              y={borderWidth / 2}
              width={dimensions.width - borderWidth}
              height={dimensions.height - borderWidth}
              rx={effectiveRadius}
              ry={effectiveRadius}
              stroke="url(#grad)"
              strokeWidth={borderWidth * 4} // Wider for glow
              fill="none"
              strokeDasharray={[snakeLength, perimeter - snakeLength]}
              strokeDashoffset={strokeDashoffset2}
              strokeLinecap="round"
              opacity={0.3} // Transparent for glow
            />

            {/* MAIN SNAKE 1 */}
            <AnimatedRect
              x={borderWidth / 2}
              y={borderWidth / 2}
              width={dimensions.width - borderWidth}
              height={dimensions.height - borderWidth}
              rx={effectiveRadius}
              ry={effectiveRadius}
              stroke="url(#grad)"
              strokeWidth={borderWidth}
              fill="none"
              strokeDasharray={[snakeLength, perimeter - snakeLength]}
              strokeDashoffset={strokeDashoffset1}
              strokeLinecap="round"
            />

            {/* MAIN SNAKE 2 */}
            <AnimatedRect
              x={borderWidth / 2}
              y={borderWidth / 2}
              width={dimensions.width - borderWidth}
              height={dimensions.height - borderWidth}
              rx={effectiveRadius}
              ry={effectiveRadius}
              stroke="url(#grad)"
              strokeWidth={borderWidth}
              fill="none"
              strokeDasharray={[snakeLength, perimeter - snakeLength]}
              strokeDashoffset={strokeDashoffset2}
              strokeLinecap="round"
            />
          </Svg>
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.innerButton,
          { margin: borderWidth },
          { backgroundColor: isDarkMode ? colors.background : colors.white },
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
    },
    buttonText: {
      fontWeight: '600',
      color: colors.text,
      fontSize: moderateScale(16),
      fontFamily: Fonts.OpenSansSemiBold,
    },
  });

export default AnimatedBorderButton;
