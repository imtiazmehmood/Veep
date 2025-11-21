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
} from 'react-native-reanimated';
import MaskedView from '@react-native-masked-view/masked-view';
import LinearGradient from 'react-native-linear-gradient';

interface AnimatedGradientTextProps {
  text: string;
  style?: StyleProp<TextStyle>;
  colors?: string[];
  duration?: number;
}

const AnimatedGradientText: React.FC<AnimatedGradientTextProps> = ({
  text,
  style,
  colors = [
    '#FF0000',
    '#FFFF00',
    '#00FF00',
    '#00FFFF',
    '#0000FF',
    '#FF00FF',
    '#FF0000',
  ],
  duration = 2000,
}) => {
  const [layout, setLayout] = useState({ width: 0, height: 0 });
  const progress = useSharedValue(0);

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setLayout({ width, height });
  };

  useEffect(() => {
    if (layout.width > 0) {
      progress.value = withRepeat(
        withTiming(1, {
          duration: duration,
          easing: Easing.linear,
        }),
        -1,
        false,
      );
    }
  }, [layout.width, duration, progress]);

  const animatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(progress.value, [0, 1], [0, -layout.width]);
    return {
      transform: [{ translateX }],
    };
  });

  const renderGradient = (opacity: number = 1, scale: number = 1) => (
    <MaskedView
      style={[StyleSheet.absoluteFill, { opacity, transform: [{ scale }] }]}
      maskElement={
        <View
          style={{
            flex: 1,
            backgroundColor: 'transparent',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={style}>{text}</Text>
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

  return (
    <View style={[style, { flexDirection: 'row', alignItems: 'center' }]}>
      {/* Invisible text to establish layout size */}
      <Text style={[style, { opacity: 0 }]} onLayout={onLayout}>
        {text}
      </Text>

      {layout.width > 0 && (
        <>
          {/* Glow Layer (Behind) */}
          {renderGradient(0.5, 1.02)}

          {/* Main Layer (Front) */}
          {renderGradient(1, 1)}
        </>
      )}
    </View>
  );
};

export default AnimatedGradientText;
