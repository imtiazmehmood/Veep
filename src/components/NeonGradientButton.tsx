import React, { useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    Pressable,
    StyleProp,
    ViewStyle,
    TextStyle,
} from 'react-native';
import {
    Canvas,
    RoundedRect,
    LinearGradient,
    vec,
    BlurMask,
    Group,
} from '@shopify/react-native-skia';
import {
    useSharedValue,
    withRepeat,
    withTiming,
    Easing,
    useDerivedValue,
} from 'react-native-reanimated';

interface NeonGradientButtonProps {
    title: string;
    onPress?: () => void;
    width?: number;
    height?: number;
    borderRadius?: number;
    colors?: string[];
    glowColors?: string[];
    duration?: number;
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
    disabled?: boolean;
}

const DEFAULT_GRADIENT_COLORS = [
    '#FF00FF', // Magenta
    '#00FFFF', // Cyan
    '#FF00FF', // Magenta (loop)
];

const DEFAULT_GLOW_COLORS = [
    'rgba(255, 0, 255, 0.8)', // Magenta glow
    'rgba(0, 255, 255, 0.8)', // Cyan glow
    'rgba(255, 0, 255, 0.8)', // Magenta glow (loop)
];

const NeonGradientButton: React.FC<NeonGradientButtonProps> = ({
    title,
    onPress,
    width = 200,
    height = 56,
    borderRadius = 28,
    colors = DEFAULT_GRADIENT_COLORS,
    glowColors = DEFAULT_GLOW_COLORS,
    duration = 3000,
    style,
    textStyle,
    disabled = false,
}) => {
    // Animation progress (0 to 1)
    const progress = useSharedValue(0);
    const pressScale = useSharedValue(1);

    useEffect(() => {
        progress.value = withRepeat(
            withTiming(1, {
                duration: duration,
                easing: Easing.linear,
            }),
            -1,
            false
        );
    }, [duration]);

    // Derived values for gradient animation
    const gradientStart = useDerivedValue(() => {
        'worklet';
        const offset = progress.value * width * 2;
        return vec(-width + offset, 0);
    });

    const gradientEnd = useDerivedValue(() => {
        'worklet';
        const offset = progress.value * width * 2;
        return vec(width + offset, 0);
    });

    // Pulsing glow effect
    const glowOpacity = useDerivedValue(() => {
        'worklet';
        return 0.3 + Math.sin(progress.value * Math.PI * 2) * 0.3;
    });

    const handlePressIn = () => {
        pressScale.value = withTiming(0.95, {
            duration: 100,
            easing: Easing.out(Easing.ease),
        });
    };

    const handlePressOut = () => {
        pressScale.value = withTiming(1, {
            duration: 200,
            easing: Easing.out(Easing.ease),
        });
    };

    // Derived transform for press animation
    const transform = useDerivedValue(() => {
        'worklet';
        return [{ scale: pressScale.value }];
    });

    const borderWidth = 3;
    const innerWidth = width - borderWidth * 2;
    const innerHeight = height - borderWidth * 2;
    const innerRadius = borderRadius - borderWidth;

    return (
        <Pressable
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={disabled}
            style={[styles.container, style]}
        >
            <View style={{ width, height }}>
                <Canvas style={{ width, height }}>
                    <Group transform={transform} origin={vec(width / 2, height / 2)}>
                        {/* Outer glow layer */}
                        <Group opacity={glowOpacity}>
                            <RoundedRect
                                x={0}
                                y={0}
                                width={width}
                                height={height}
                                r={borderRadius}
                            >
                                <LinearGradient
                                    start={gradientStart}
                                    end={gradientEnd}
                                    colors={glowColors}
                                />
                                <BlurMask blur={10} style="solid" />
                            </RoundedRect>
                        </Group>

                        {/* Animated gradient border */}
                        <RoundedRect
                            x={0}
                            y={0}
                            width={width}
                            height={height}
                            r={borderRadius}
                        >
                            <LinearGradient
                                start={gradientStart}
                                end={gradientEnd}
                                colors={colors}
                            />
                        </RoundedRect>

                        {/* Inner background (dark) */}
                        <RoundedRect
                            x={borderWidth}
                            y={borderWidth}
                            width={innerWidth}
                            height={innerHeight}
                            r={innerRadius}
                            color="#0A0A0A"
                        />
                    </Group>
                </Canvas>

                {/* Text overlay */}
                <View style={styles.textContainer}>
                    <Text
                        style={[
                            styles.buttonText,
                            textStyle,
                            disabled && styles.disabledText,
                        ]}
                    >
                        {title}
                    </Text>
                </View>
            </View>
        </Pressable >
    );
};

const styles = StyleSheet.create({
    container: {
        alignSelf: 'center',
    },
    textContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    disabledText: {
        color: '#666666',
    },
});

export default React.memo(NeonGradientButton);
