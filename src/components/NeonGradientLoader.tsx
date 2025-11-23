import React, { useEffect } from 'react';
import {
    StyleSheet,
    View,
    StyleProp,
    ViewStyle,
} from 'react-native';
import {
    Canvas,
    Circle,
    LinearGradient,
    vec,
    BlurMask,
    Group,
    Path,
    Skia,
} from '@shopify/react-native-skia';
import {
    useSharedValue,
    withRepeat,
    withTiming,
    Easing,
    useDerivedValue,
} from 'react-native-reanimated';

interface NeonGradientLoaderProps {
    size?: number;
    colors?: string[];
    duration?: number;
    style?: StyleProp<ViewStyle>;
    strokeWidth?: number;
}

const DEFAULT_COLORS = [
    '#FF00FF', // Magenta
    '#8B00FF', // Purple
    '#00FFFF', // Cyan
    '#00FF88', // Teal
    '#FFFF00', // Yellow
    '#FF00FF', // Loop back
];

const NeonGradientLoader: React.FC<NeonGradientLoaderProps> = ({
    size = 80,
    colors = DEFAULT_COLORS,
    duration = 2000,
    style,
    strokeWidth = 6,
}) => {
    const rotation = useSharedValue(0);
    const scale = useSharedValue(1);

    useEffect(() => {
        // Continuous rotation
        rotation.value = withRepeat(
            withTiming(360, {
                duration: duration,
                easing: Easing.linear,
            }),
            -1,
            false
        );

        // Pulsing scale
        scale.value = withRepeat(
            withTiming(1.1, {
                duration: duration / 2,
                easing: Easing.inOut(Easing.ease),
            }),
            -1,
            true
        );
    }, [duration]);

    // Create arc path for the loader
    const createArcPath = (
        centerX: number,
        centerY: number,
        radius: number,
        startAngle: number,
        endAngle: number
    ) => {
        'worklet';
        const path = Skia.Path.Make();
        const startRad = (startAngle * Math.PI) / 180;
        const endRad = (endAngle * Math.PI) / 180;

        const startX = centerX + radius * Math.cos(startRad);
        const startY = centerY + radius * Math.sin(startRad);

        path.moveTo(startX, startY);
        path.arcToRotated(
            radius,
            radius,
            0,
            endAngle - startAngle > 180,
            true,
            centerX + radius * Math.cos(endRad),
            centerY + radius * Math.sin(endRad)
        );

        return path;
    };

    const center = size / 2;
    const radius = (size - strokeWidth) / 2;

    // Derived gradient positions
    const gradientStart = useDerivedValue(() => {
        'worklet';
        const angle = (rotation.value * Math.PI) / 180;
        return vec(
            center + radius * Math.cos(angle),
            center + radius * Math.sin(angle)
        );
    });

    const gradientEnd = useDerivedValue(() => {
        'worklet';
        const angle = ((rotation.value + 180) * Math.PI) / 180;
        return vec(
            center + radius * Math.cos(angle),
            center + radius * Math.sin(angle)
        );
    });

    // Glow opacity
    const glowOpacity = useDerivedValue(() => {
        'worklet';
        return 0.5 + Math.sin((rotation.value * Math.PI) / 180) * 0.3;
    });

    // Create the arc path
    const arcPath = Skia.Path.Make();
    arcPath.addCircle(center, center, radius);

    // Derived transform for rotation and scale
    const groupTransform = useDerivedValue(() => {
        'worklet';
        return [
            { rotate: (rotation.value * Math.PI) / 180 },
            { scale: scale.value }
        ];
    });

    return (
        <View style={[styles.container, style]}>
            <Canvas style={{ width: size, height: size }}>
                {/* Outer glow */}
                <Group opacity={glowOpacity}>
                    <Circle cx={center} cy={center} r={radius + 4}>
                        <LinearGradient
                            start={gradientStart}
                            end={gradientEnd}
                            colors={colors}
                        />
                        <BlurMask blur={16} style="solid" />
                    </Circle>
                </Group>

                {/* Main rotating circle */}
                <Group
                    transform={groupTransform}
                    origin={vec(center, center)}
                >
                    <Circle
                        cx={center}
                        cy={center}
                        r={radius}
                        style="stroke"
                        strokeWidth={strokeWidth}
                    >
                        <LinearGradient
                            start={vec(0, 0)}
                            end={vec(size, size)}
                            colors={colors}
                        />
                    </Circle>

                    {/* Inner accent circles */}
                    <Circle
                        cx={center}
                        cy={strokeWidth / 2}
                        r={strokeWidth * 1.5}
                        color={colors[0]}
                    >
                        <BlurMask blur={4} style="solid" />
                    </Circle>

                    <Circle
                        cx={center}
                        cy={size - strokeWidth / 2}
                        r={strokeWidth * 1.5}
                        color={colors[2]}
                    >
                        <BlurMask blur={4} style="solid" />
                    </Circle>
                </Group>

                {/* Center dot */}
                <Group opacity={0.8}>
                    <Circle cx={center} cy={center} r={strokeWidth / 2}>
                        <LinearGradient
                            start={gradientStart}
                            end={gradientEnd}
                            colors={colors}
                        />
                        <BlurMask blur={2} style="solid" />
                    </Circle>
                </Group>
            </Canvas>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignSelf: 'center',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
});

export default React.memo(NeonGradientLoader);
