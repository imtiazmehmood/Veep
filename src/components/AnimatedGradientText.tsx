import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  StyleProp,
  TextStyle,
  LayoutChangeEvent,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
  withSequence,
} from 'react-native-reanimated';
import MaskedView from '@react-native-masked-view/masked-view';
import LinearGradient from 'react-native-linear-gradient';
import { Fonts } from '../theme/Fonts';

interface AnimatedGradientTextProps {
  text: string;
  style?: StyleProp<TextStyle>;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  colors?: string[];
  duration?: number;
}

const AnimatedGradientText: React.FC<AnimatedGradientTextProps> = ({
  text,
  style,
  fontSize = 48,
  fontWeight = 'bold',
  colors = [
    '#8B00FF', // Purple
    '#FF00FF', // Magenta
    '#00FFFF', // Cyan
    '#8B00FF', // Purple
  ],
  duration = 2000,
}) => {
  const [layout, setLayout] = useState({ width: 0, height: 0 });
  const progress = useSharedValue(0);
  const shimmerProgress = useSharedValue(0);

  // Combine user style with fontSize and fontWeight
  const textStyle = [
    style,
    {
      fontSize,
      fontWeight,
      fontFamily: Fonts.NunitoBold,
    }
  ];


  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setLayout({ width, height });
  };

  useEffect(() => {
    if (layout.width > 0) {
      // Main gradient flow
      progress.value = withRepeat(
        withTiming(1, {
          duration: duration,
          easing: Easing.linear,
        }),
        -1,
        false,
      );

      // Faster shimmer overlay
      shimmerProgress.value = withRepeat(
        withTiming(1, {
          duration: duration * 0.7,
          easing: Easing.bezier(0.4, 0, 0.6, 1),
        }),
        -1,
        false,
      );
    }
  }, [layout.width, duration, progress, shimmerProgress]);

  const animatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(progress.value, [0, 1], [0, -layout.width]);
    return {
      transform: [{ translateX }],
    };
  });

  const shimmerStyle = useAnimatedStyle(() => {
    const translateX = interpolate(shimmerProgress.value, [0, 1], [-layout.width, layout.width * 2]);
    const opacity = interpolate(
      shimmerProgress.value,
      [0, 0.3, 0.5, 0.7, 1],
      [0, 0.5, 0.8, 0.5, 0]
    );
    return {
      transform: [{ translateX }],
      opacity,
    };
  });



  const renderGradient = (opacity: number = 1, blur: number = 0) => (
    <MaskedView
      style={[StyleSheet.absoluteFill, { opacity }]}
      maskElement={
        <View
          style={{
            flex: 1,
            backgroundColor: 'transparent',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={[textStyle, blur > 0 && { textShadowRadius: blur }]}>{text}</Text>
        </View>
      }
    >
      <Animated.View
        style={[
          {
            flexDirection: 'row',
            height: layout.height,
            width: layout.width * 2,
          },
          animatedStyle,
        ]}
      >
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ width: layout.width, height: '100%' }}
        />
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ width: layout.width, height: '100%' }}
        />
      </Animated.View>
    </MaskedView>
  );

  const renderShimmer = () => (
    <MaskedView
      style={StyleSheet.absoluteFill}
      maskElement={
        <View
          style={{
            flex: 1,
            backgroundColor: 'transparent',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={textStyle}>{text}</Text>
        </View>
      }
    >
      <Animated.View
        style={[
          {
            flexDirection: 'row',
            height: layout.height,
            width: layout.width * 3,
          },
          shimmerStyle,
        ]}
      >
        <LinearGradient
          colors={[
            'transparent',
            'rgba(255, 255, 255, 0.2)',
            'rgba(255, 255, 255, 0.6)',
            '#FFFFFF',
            'rgba(255, 255, 255, 0.6)',
            'rgba(255, 255, 255, 0.2)',
            'transparent'
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ width: layout.width, height: '100%' }}
        />
      </Animated.View>
    </MaskedView>
  );

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {/* Invisible text to establish layout size */}
      <Text
        style={[textStyle, { opacity: 0 }]}
        onLayout={onLayout}
      >
        {text}
      </Text>

      {layout.width > 0 && (
        <>
          {/* Outer glow - largest */}
          {renderGradient(0.3, 20)}

          {/* Mid glow */}
          {renderGradient(0.5, 10)}

          {/* Inner glow */}
          {renderGradient(0.7, 5)}

          {/* Main gradient layer */}
          {renderGradient(1, 0)}

          {/* Shimmer overlay */}
          {renderShimmer()}
        </>
      )}
    </View>
  );
};

export default AnimatedGradientText;
