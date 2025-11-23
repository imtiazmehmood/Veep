import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Image } from 'react-native';
import Animated, {
    useSharedValue,
    withTiming,
    withSequence,
    withRepeat,
    Easing,
    useAnimatedStyle,
    runOnJS,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';

interface BurnAnimationProps {
    imageSource: any;
    width?: number;
    height?: number;
    onComplete?: () => void;
}

const BurnAnimation: React.FC<BurnAnimationProps> = ({
    imageSource,
    width = 300,
    height = 300,
    onComplete,
}) => {
    const [isBurning, setIsBurning] = useState(false);
    const burnProgress = useSharedValue(0);

    const startBurn = () => {
        if (isBurning) return;
        setIsBurning(true);

        burnProgress.value = withTiming(
            1,
            {
                duration: 3000,
                easing: Easing.inOut(Easing.ease),
            },
            (finished) => {
                if (finished && onComplete) {
                    runOnJS(onComplete)();
                }
            }
        );
    };

    const resetBurn = () => {
        setIsBurning(false);
        burnProgress.value = 0;
    };

    const imageStyle = useAnimatedStyle(() => {
        const clipHeight = height * (1 - burnProgress.value);
        return {
            height: clipHeight,
            opacity: 1 - burnProgress.value * 0.3,
        };
    });

    const burnEdgeStyle = useAnimatedStyle(() => {
        const edgeY = height * (1 - burnProgress.value) - 60;
        return {
            top: Math.max(0, edgeY),
            opacity: burnProgress.value,
        };
    });

    const charredStyle = useAnimatedStyle(() => {
        const charHeight = height * burnProgress.value;
        return {
            height: charHeight,
            opacity: burnProgress.value * 0.8,
        };
    });

    return (
        <View style={styles.container}>
            <Pressable onPress={startBurn} onLongPress={resetBurn}>
                <View style={{ width, height, overflow: 'hidden', borderRadius: 12, backgroundColor: '#000' }}>
                    {/* Charred/burned area at bottom */}
                    <Animated.View
                        style={[
                            {
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                backgroundColor: '#1a0a00',
                            },
                            charredStyle,
                        ]}
                    />

                    {/* Original Image - clipped from bottom */}
                    <Animated.View style={[{ overflow: 'hidden' }, imageStyle]}>
                        <Image
                            source={imageSource}
                            style={{ width, height }}
                            resizeMode="cover"
                        />
                    </Animated.View>

                    {/* Burn edge glow */}
                    {isBurning && (
                        <Animated.View
                            style={[
                                {
                                    position: 'absolute',
                                    left: 0,
                                    right: 0,
                                    height: 120,
                                },
                                burnEdgeStyle,
                            ]}
                        >
                            <LinearGradient
                                colors={[
                                    'rgba(255, 240, 100, 0)',
                                    'rgba(255, 200, 50, 0.6)',
                                    'rgba(255, 140, 0, 0.9)',
                                    'rgba(255, 80, 0, 1)',
                                    'rgba(220, 40, 0, 0.9)',
                                    'rgba(150, 20, 0, 0.6)',
                                    'rgba(80, 0, 0, 0.3)',
                                    'rgba(0, 0, 0, 0)',
                                ]}
                                style={{ flex: 1 }}
                            />
                        </Animated.View>
                    )}

                    {/* Flame particles */}
                    {isBurning && (
                        <View style={StyleSheet.absoluteFill} pointerEvents="none">
                            {Array.from({ length: 30 }).map((_, i) => (
                                <FlameParticle
                                    key={i}
                                    delay={i * 60}
                                    startX={Math.random() * width}
                                    startY={height * 0.7 + Math.random() * height * 0.2}
                                    width={width}
                                    height={height}
                                    isFlame={i < 20}
                                />
                            ))}
                        </View>
                    )}
                </View>
            </Pressable>
        </View>
    );
};

const FlameParticle: React.FC<{
    delay: number;
    startX: number;
    startY: number;
    width: number;
    height: number;
    isFlame: boolean;
}> = ({ delay, startX, startY, width, height, isFlame }) => {
    const translateY = useSharedValue(0);
    const translateX = useSharedValue(0);
    const opacity = useSharedValue(0);
    const scale = useSharedValue(0.3);

    React.useEffect(() => {
        setTimeout(() => {
            const distance = isFlame ? -height * 0.35 : -height * 0.5;
            const drift = (Math.random() - 0.5) * 50;

            translateY.value = withTiming(distance, {
                duration: isFlame ? 1000 : 1500,
                easing: Easing.out(Easing.ease),
            });

            translateX.value = withTiming(drift, {
                duration: isFlame ? 1000 : 1500,
                easing: Easing.inOut(Easing.ease),
            });

            if (isFlame) {
                opacity.value = withSequence(
                    withTiming(1, { duration: 150 }),
                    withTiming(0.7, { duration: 300 }),
                    withTiming(0, { duration: 550 })
                );

                scale.value = withTiming(1.5, {
                    duration: 1000,
                    easing: Easing.out(Easing.ease),
                });
            } else {
                opacity.value = withSequence(
                    withTiming(0.6, { duration: 250 }),
                    withTiming(0, { duration: 1250 })
                );

                scale.value = withTiming(0.6, {
                    duration: 1500,
                });
            }
        }, delay);
    }, []);

    const particleStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
            { scale: scale.value },
        ],
        opacity: opacity.value,
    }));

    if (isFlame) {
        const size = 14 + Math.random() * 10;
        return (
            <Animated.View
                style={[
                    {
                        position: 'absolute',
                        left: startX - size / 2,
                        top: startY - size / 2,
                        width: size,
                        height: size * 1.4,
                        borderRadius: size / 2,
                    },
                    particleStyle,
                ]}
            >
                <LinearGradient
                    colors={['#FFFF66', '#FFAA00', '#FF5500', '#CC0000']}
                    style={{
                        flex: 1,
                        borderRadius: size / 2,
                    }}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                />
            </Animated.View>
        );
    } else {
        const size = 4 + Math.random() * 5;
        return (
            <Animated.View
                style={[
                    {
                        position: 'absolute',
                        left: startX,
                        top: startY,
                        width: size,
                        height: size,
                        borderRadius: size / 2,
                        backgroundColor: '#666666',
                    },
                    particleStyle,
                ]}
            />
        );
    }
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default React.memo(BurnAnimation);
