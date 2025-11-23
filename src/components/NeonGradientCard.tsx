import React, { useEffect } from 'react';
import {
    StyleSheet,
    View,
    StyleProp,
    ViewStyle,
    Dimensions,
} from 'react-native';
import {
    Canvas,
    RoundedRect,
    LinearGradient,
    vec,
    BlurMask,
    Group,
    SweepGradient,
} from '@shopify/react-native-skia';
import {
    useSharedValue,
    withRepeat,
    withTiming,
    Easing,
    useDerivedValue,
} from 'react-native-reanimated';

interface NeonGradientCardProps {
    children?: React.ReactNode;
    width?: number;
    height?: number;
    borderRadius?: number;
    colors?: string[];
    shimmerColors?: string[];
    duration?: number;
    style?: StyleProp<ViewStyle>;
    borderWidth?: number;
}

const DEFAULT_BORDER_COLORS = [
    '#FF00FF', // Magenta
    '#8B00FF', // Purple
    '#00FFFF', // Cyan
    '#00FF88', // Teal
    '#FF00FF', // Loop back to Magenta
];

const DEFAULT_SHIMMER_COLORS = [
    'rgba(255, 0, 255, 0)',
    'rgba(255, 0, 255, 0.6)',
    'rgba(0, 255, 255, 0.6)',
    'rgba(0, 255, 255, 0)',
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const NeonGradientCard: React.FC<NeonGradientCardProps> = ({
    children,
    width = SCREEN_WIDTH - 40,
    height = 200,
    borderRadius = 20,
    colors = DEFAULT_BORDER_COLORS,
    shimmerColors = DEFAULT_SHIMMER_COLORS,
    duration = 4000,
    style,
    borderWidth = 2,
}) => {
    // Rotation animation for sweep gradient
    const rotation = useSharedValue(0);

    // Shimmer animation
    const shimmerProgress = useSharedValue(0);

    useEffect(() => {
        // Continuous rotation for the border gradient
        rotation.value = withRepeat(
            withTiming(360, {
                duration: duration,
                easing: Easing.linear,
            }),
            -1,
            false
        );

        // Shimmer effect
        shimmerProgress.value = withRepeat(
            withTiming(1, {
                duration: duration * 0.6,
                easing: Easing.inOut(Easing.ease),
            }),
            -1,
            true
        );
    }, [duration]);

    // Derived values for shimmer animation
    const shimmerStart = useDerivedValue(() => {
        'worklet';
        const offset = shimmerProgress.value * (width * 2);
        return vec(-width + offset, 0);
    });

    const shimmerEnd = useDerivedValue(() => {
        'worklet';
        const offset = shimmerProgress.value * (width * 2);
        return vec(offset, height);
    });

    // Pulsing glow
    const glowIntensity = useDerivedValue(() => {
        'worklet';
        return 0.4 + Math.sin(shimmerProgress.value * Math.PI * 2) * 0.2;
    });

    // Derived transform for rotation
    const rotationTransform = useDerivedValue(() => {
        'worklet';
        return [{ rotate: (rotation.value * Math.PI) / 180 }]; // Skia expects radians for rotate transform in matrix
    });

    const innerWidth = width - borderWidth * 2;
    const innerHeight = height - borderWidth * 2;
    const innerRadius = borderRadius - borderWidth;

    return (
        <View style={[styles.container, style, { width, height }]}>
            <Canvas style={{ width, height }}>
                {/* Outer glow */}
                <Group opacity={glowIntensity}>
                    <RoundedRect
                        x={-4}
                        y={-4}
                        width={width + 8}
                        height={height + 8}
                        r={borderRadius + 4}
                    >
                        <SweepGradient
                            c={vec(width / 2, height / 2)}
                            colors={colors}
                            transform={rotationTransform}
                            origin={vec(width / 2, height / 2)}
                        />
                        <BlurMask blur={12} style="solid" />
                    </RoundedRect>
                </Group>

                {/* Animated rotating border */}
                <RoundedRect
                    x={0}
                    y={0}
                    width={width}
                    height={height}
                    r={borderRadius}
                >
                    <SweepGradient
                        c={vec(width / 2, height / 2)}
                        colors={colors}
                        transform={rotationTransform}
                        origin={vec(width / 2, height / 2)}
                    />
                </RoundedRect>

                {/* Inner dark background */}
                <RoundedRect
                    x={borderWidth}
                    y={borderWidth}
                    width={innerWidth}
                    height={innerHeight}
                    r={innerRadius}
                    color="#0F0F0F"
                />

                {/* Shimmer overlay */}
                <Group opacity={0.3}>
                    <RoundedRect
                        x={borderWidth}
                        y={borderWidth}
                        width={innerWidth}
                        height={innerHeight}
                        r={innerRadius}
                    >
                        <LinearGradient
                            start={shimmerStart}
                            end={shimmerEnd}
                            colors={shimmerColors}
                        />
                    </RoundedRect>
                </Group>
            </Canvas>

            {/* Content overlay */}
            <View style={styles.contentContainer}>
                {children}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignSelf: 'center',
        overflow: 'hidden',
    },
    contentContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        padding: 20,
    },
});

export default React.memo(NeonGradientCard);
