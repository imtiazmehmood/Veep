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
} from '@shopify/react-native-skia';
import { moderateScale } from '../utils/metrics';
import { useTheme } from '../context/ThemeContext';
import { useThemeStyles } from '../hooks/useThemeStyles';
import { ThemeColors } from '../theme/Colors';

interface AnimatedBorderViewProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    contentContainerStyle?: StyleProp<ViewStyle>;
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

const AnimatedBorderView: React.FC<AnimatedBorderViewProps> = ({
    children,
    style,
    contentContainerStyle,
    borderColors = DEFAULT_BORDER_COLORS,
    borderWidth = 2,
    borderRadius,
    duration = 3000,
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

    // Effective radius
    const requestedRadius = borderRadius !== undefined
        ? borderRadius
        : Math.min(dimensions.width / 2, dimensions.height / 2);

    // Clamp radius
    const r = dimensions.width > 0 && dimensions.height > 0
        ? Math.min(requestedRadius, dimensions.width / 2, dimensions.height / 2)
        : requestedRadius;

    const center = vec(dimensions.width / 2, dimensions.height / 2);

    const perimeter = React.useMemo(() => {
        const w = dimensions.width - borderWidth;
        const h = dimensions.height - borderWidth;
        const rad = Math.max(0, r - borderWidth / 2);
        return 2 * (w + h) - 8 * rad + 2 * Math.PI * rad;
    }, [dimensions, r, borderWidth]);

    const snakeLength = customSnakeLength ?? perimeter * 0.3;
    const intervals = React.useMemo(() => [snakeLength, perimeter - snakeLength], [snakeLength, perimeter]);

    useFrameCallback((frameInfo) => {
        if (!frameInfo.timeSinceFirstFrame) return;
        const totalDuration = duration;
        const time = frameInfo.timestamp;
        progress.value = (time % totalDuration) / totalDuration;
    });

    const phase = useDerivedValue(() => {
        return -progress.value * perimeter;
    });

    return (
        <View
            style={[
                styles.container,
                { borderRadius: r },
                style
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
                                strokeWidth={borderWidth + 4}
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

            <View
                style={[
                    styles.contentContainer,
                    { margin: borderWidth },
                    {
                        backgroundColor: isDarkMode ? colors.background : colors.white,
                        borderRadius: Math.max(0, r - borderWidth)
                    },
                    contentContainerStyle
                ]}
            >
                {children}
            </View>
        </View>
    );
};

const createStyles = (colors: ThemeColors) =>
    StyleSheet.create({
        container: {
            overflow: 'hidden',
            alignItems: 'center',
            justifyContent: 'center',
        },
        contentContainer: {
            flex: 1,
            width: '100%',
            height: '100%',
            alignItems: 'center',
            justifyContent: 'center',
        },
    });

export default React.memo(AnimatedBorderView);
