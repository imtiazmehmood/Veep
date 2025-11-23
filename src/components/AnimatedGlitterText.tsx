import React, { useEffect, useMemo } from "react";
import { View, StyleSheet, StyleProp, TextStyle } from "react-native";
import {
    useSharedValue,
    withRepeat,
    withTiming,
    Easing,
    useDerivedValue,
    SharedValue,
} from "react-native-reanimated";
import {
    Canvas,
    Text as SkiaText,
    LinearGradient,
    vec,
    Circle,
    Group,
    BlurMask,
    RadialGradient,
    matchFont,
} from "@shopify/react-native-skia";

interface GlitterParticleData {
    id: number;
    offsetX: number;
    offsetY: number;
    size: number;
    delay: number;
    speed: number;
    color: string;
}

interface AnimatedGlitterTextProps {
    text: string;
    style?: StyleProp<TextStyle>;
    fontSize?: number;
    fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
    textColor?: string;
    glitterColors?: string[];
    particleCount?: number;
    duration?: number;
    glitterSize?: number;
}

const DEFAULT_COLORS = ["#FFFFFF", "#FFD700", "#FFA500", "#FF69B4", "#00FFFF"];

const Particle = React.memo(({ p, progress, padding }: { p: GlitterParticleData, progress: SharedValue<number>, padding: number }) => {
    const particleCenter = useDerivedValue(() => {
        'worklet';
        const t = (progress.value + p.delay) % 1;
        const x = padding + p.offsetX + Math.sin(t * Math.PI * 2) * 10;
        const y = padding + p.offsetY + Math.cos(t * Math.PI * 2) * 8;
        return vec(x, y);
    });

    const opacity = useDerivedValue(() => {
        'worklet';
        const t = ((progress.value + p.delay) % 1) * p.speed;
        if (t < 0.3) return t / 0.3;
        if (t < 0.5) return 1;
        if (t < 0.8) return 1 - (t - 0.5) / 0.3;
        return 0;
    });

    return (
        <Group opacity={opacity}>
            {/* Outer glow */}
            <Circle c={particleCenter} r={p.size * 2}>
                <RadialGradient
                    c={particleCenter}
                    r={p.size * 2}
                    colors={[p.color, p.color + "00"]}
                />
            </Circle>

            {/* Core sparkle */}
            <Circle c={particleCenter} r={p.size} color={p.color}>
                <BlurMask blur={2} style="solid" />
            </Circle>

            {/* Bright center */}
            <Circle c={particleCenter} r={p.size * 0.5} color="#fff" />
        </Group>
    );
});

export default function AnimatedGlitterText({
    text = "Sparkle",
    fontSize = 48,
    fontWeight = "bold",
    textColor = "#fff",
    glitterColors = DEFAULT_COLORS,
    particleCount = 30,
    duration = 3000,
    glitterSize = 4,
}: AnimatedGlitterTextProps) {
    const progress = useSharedValue(0);

    useEffect(() => {
        progress.value = withRepeat(
            withTiming(1, { duration, easing: Easing.linear }),
            -1,
            false
        );
    }, [duration]);

    const getFontWeight = () => {
        const weightMap: Record<string, number> = {
            'normal': 400,
            'bold': 700,
            '100': 100,
            '200': 200,
            '300': 300,
            '400': 400,
            '500': 500,
            '600': 600,
            '700': 700,
            '800': 800,
            '900': 900,
        };
        return weightMap[fontWeight as string] || 700;
    };

    const font = matchFont({
        fontSize,
        fontWeight: getFontWeight() as any,
    });

    if (!font) {
        return null;
    }

    const textWidth = font.getTextWidth(text);
    const textHeight = fontSize * 1.2;

    const padding = 40;
    const width = textWidth + padding * 2;
    const height = textHeight + padding * 2;

    const particles = useMemo(() => {
        return Array.from({ length: particleCount }, (_, i) => ({
            id: i,
            offsetX: Math.random() * textWidth,
            offsetY: Math.random() * textHeight,
            size: glitterSize * (0.6 + Math.random() * 1.4),
            delay: Math.random(),
            speed: 0.7 + Math.random() * 0.5,
            color:
                glitterColors[Math.floor(Math.random() * glitterColors.length)] ||
                "#FFFFFF",
        }));
    }, [particleCount, textWidth, textHeight, glitterColors, glitterSize]);

    /** TEXT GRADIENT ANIMATION */
    const gradientStart = useDerivedValue(() => {
        'worklet';
        const off = progress.value * width * 1.4;
        return vec(-width * 0.5 + off, height / 2);
    });

    const gradientEnd = useDerivedValue(() => {
        'worklet';
        const off = progress.value * width * 1.4;
        return vec(width * 0.5 + off, height / 2);
    });

    return (
        <View style={styles.container}>
            <Canvas style={{ width, height }}>
                {/* glow */}
                <Group opacity={0.3}>
                    <SkiaText
                        x={padding}
                        y={height / 2 + fontSize / 3}
                        text={text}
                        font={font}
                        color={textColor}
                    >
                        <BlurMask blur={8} style="solid" />
                    </SkiaText>
                </Group>

                {/* main text */}
                <SkiaText
                    x={padding}
                    y={height / 2 + fontSize / 3}
                    text={text}
                    font={font}
                >
                    <LinearGradient
                        start={gradientStart}
                        end={gradientEnd}
                        colors={[textColor, "#fff", textColor]}
                    />
                </SkiaText>

                {/* PARTICLES */}
                {particles.map((p) => (
                    <Particle
                        key={p.id}
                        p={p}
                        progress={progress}
                        padding={padding}
                    />
                ))}
            </Canvas>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { alignSelf: "center" },
});
