import React, { useEffect } from 'react';
import { View, Text, StyleSheet, StyleProp, TextStyle } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
    Easing,
    interpolate,
} from 'react-native-reanimated';

interface AnimatedNeonTextProps {
    text: string;
    style?: StyleProp<TextStyle>;
    fontSize?: number;
    fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
    neonColor?: string;
    glowIntensity?: 'low' | 'medium' | 'high';
    flickerEnabled?: boolean;
    pulseSpeed?: number;
}

const AnimatedNeonText: React.FC<AnimatedNeonTextProps> = ({
    text,
    style,
    fontSize = 48,
    fontWeight = 'bold',
    neonColor = '#00FFFF',
    glowIntensity = 'high',
    flickerEnabled = true,
    pulseSpeed = 2000,
}) => {
    const glowProgress = useSharedValue(0);
    const flickerProgress = useSharedValue(1);

    // Enhanced glow intensity settings
    const intensityMap = {
        low: { blur: 15, opacity: 0.7, layers: 3 },
        medium: { blur: 25, opacity: 0.85, layers: 4 },
        high: { blur: 40, opacity: 1, layers: 5 },
    };

    const { blur, opacity, layers } = intensityMap[glowIntensity];

    useEffect(() => {
        // Smooth pulsing glow
        glowProgress.value = withRepeat(
            withTiming(1, {
                duration: pulseSpeed,
                easing: Easing.inOut(Easing.sin),
            }),
            -1,
            true
        );

        // Enhanced flicker effect
        if (flickerEnabled) {
            const flicker = () => {
                flickerProgress.value = withSequence(
                    withTiming(0.3, { duration: 40, easing: Easing.out(Easing.ease) }),
                    withTiming(1, { duration: 60, easing: Easing.in(Easing.ease) }),
                    withTiming(0.5, { duration: 30, easing: Easing.out(Easing.ease) }),
                    withTiming(1, { duration: 80, easing: Easing.in(Easing.ease) })
                );
            };

            const interval = setInterval(() => {
                if (Math.random() > 0.65) {
                    flicker();
                }
            }, 2500);

            return () => clearInterval(interval);
        }
    }, [pulseSpeed, flickerEnabled]);

    const glowStyle = useAnimatedStyle(() => {
        const glowOpacity = interpolate(
            glowProgress.value,
            [0, 1],
            [opacity * 0.6, opacity]
        );

        return {
            opacity: glowOpacity * flickerProgress.value,
        };
    });

    const textStyle = [
        style,
        {
            fontSize,
            fontWeight,
            color: neonColor,
            letterSpacing: 2,
        }
    ];

    return (
        <View style={styles.container}>
            {/* Background dark glow for depth */}
            <View style={StyleSheet.absoluteFill}>
                <Text
                    style={[
                        textStyle,
                        {
                            color: '#000000',
                            textShadowColor: neonColor,
                            textShadowRadius: blur * 2,
                            textShadowOffset: { width: 0, height: 0 },
                            opacity: 0.3,
                        },
                    ]}
                >
                    {text}
                </Text>
            </View>

            {/* Outer glow layers - multiple for depth */}
            {layers >= 5 && (
                <Animated.View style={[StyleSheet.absoluteFill, glowStyle]}>
                    <Text
                        style={[
                            textStyle,
                            {
                                textShadowColor: neonColor,
                                textShadowRadius: blur * 2,
                                textShadowOffset: { width: 0, height: 0 },
                            },
                        ]}
                    >
                        {text}
                    </Text>
                </Animated.View>
            )}

            {/* Far glow */}
            {layers >= 4 && (
                <Animated.View style={[StyleSheet.absoluteFill, glowStyle]}>
                    <Text
                        style={[
                            textStyle,
                            {
                                textShadowColor: neonColor,
                                textShadowRadius: blur * 1.5,
                                textShadowOffset: { width: 0, height: 0 },
                            },
                        ]}
                    >
                        {text}
                    </Text>
                </Animated.View>
            )}

            {/* Mid glow */}
            <Animated.View style={[StyleSheet.absoluteFill, glowStyle]}>
                <Text
                    style={[
                        textStyle,
                        {
                            textShadowColor: neonColor,
                            textShadowRadius: blur,
                            textShadowOffset: { width: 0, height: 0 },
                        },
                    ]}
                >
                    {text}
                </Text>
            </Animated.View>

            {/* Inner glow */}
            <Animated.View style={[StyleSheet.absoluteFill, glowStyle]}>
                <Text
                    style={[
                        textStyle,
                        {
                            textShadowColor: neonColor,
                            textShadowRadius: blur * 0.6,
                            textShadowOffset: { width: 0, height: 0 },
                        },
                    ]}
                >
                    {text}
                </Text>
            </Animated.View>

            {/* Bright inner core */}
            <Animated.View style={[StyleSheet.absoluteFill, glowStyle]}>
                <Text
                    style={[
                        textStyle,
                        {
                            textShadowColor: '#FFFFFF',
                            textShadowRadius: blur * 0.3,
                            textShadowOffset: { width: 0, height: 0 },
                        },
                    ]}
                >
                    {text}
                </Text>
            </Animated.View>

            {/* Core text - ultra bright */}
            <Animated.View style={glowStyle}>
                <Text
                    style={[
                        textStyle,
                        {
                            textShadowColor: '#FFFFFF',
                            textShadowRadius: 8,
                            textShadowOffset: { width: 0, height: 0 },
                        },
                    ]}
                >
                    {text}
                </Text>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignSelf: 'center',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 20,
        paddingHorizontal: 10,
    },
});

export default AnimatedNeonText;
