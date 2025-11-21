import React, { useEffect, useRef, useState } from "react";
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
} from "react-native";
import Svg, { Rect, Defs, LinearGradient, Stop } from "react-native-svg";
import { moderateScale, verticalScale } from "../../utils/metrics";
import { Fonts } from "../../theme/Fonts";
import { useTheme } from "../../context/ThemeContext";
import { useThemeStyles } from "../../hooks/useThemeStyles";
import { ThemeColors } from "../../theme/Colors";

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
    borderColors = ["#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FF00FF", "#00FFFF"],
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

    // Calculate perimeter for rounded rectangle
    // Approximation: 2 * (w + h) - 8 * r + 2 * PI * r
    // Or simpler: 2 * w + 2 * h (good enough for dash offset)
    const radius = moderateScale(30);
    // Effective dimensions (center of the stroke)
    const effectiveWidth = dimensions.width - borderWidth;
    const effectiveHeight = dimensions.height - borderWidth;

    // Effective radius (clamped to half the shortest side)
    const effectiveRadius = Math.min(moderateScale(30), effectiveWidth / 2, effectiveHeight / 2);

    // Precise perimeter calculation: 2 * (w + h) - 8 * r + 2 * PI * r
    const perimeter = 2 * (effectiveWidth + effectiveHeight) - 8 * effectiveRadius + 2 * Math.PI * effectiveRadius;

    const snakeLength = perimeter * 0.6; // Snake is 60% of perimeter

    useEffect(() => {
        if (dimensions.width > 0 && dimensions.height > 0) {
            const startAnimation = () => {
                animationValue.setValue(0);
                Animated.loop(
                    Animated.timing(animationValue, {
                        toValue: 1,
                        duration: 2000,
                        easing: Easing.linear,
                        useNativeDriver: true,
                    })
                ).start();
            };
            startAnimation();
        }
    }, [dimensions, animationValue]);

    const strokeDashoffset = animationValue.interpolate({
        inputRange: [0, 1],
        outputRange: [perimeter, 0],
    });

    return (
        <View
            style={[styles.container, style, (disabled || loading) && styles.disabledContainer]}
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
                        {/* Background Border (Static/Dimmed) - Optional */}
                        <Rect
                            x={borderWidth / 2}
                            y={borderWidth / 2}
                            width={dimensions.width - borderWidth}
                            height={dimensions.height - borderWidth}
                            rx={radius}
                            ry={radius}
                            stroke={colors.border}
                            strokeWidth={borderWidth}
                            fill="none"
                            opacity={0.3}
                        />

                        {/* Animated Snake Border */}
                        <AnimatedRect
                            x={borderWidth / 2}
                            y={borderWidth / 2}
                            width={dimensions.width - borderWidth}
                            height={dimensions.height - borderWidth}
                            rx={radius}
                            ry={radius}
                            stroke="url(#grad)"
                            strokeWidth={borderWidth}
                            fill="none"
                            strokeDasharray={[snakeLength, perimeter - snakeLength]}
                            strokeDashoffset={strokeDashoffset}
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
            overflow: "hidden",
            alignItems: "center",
            justifyContent: "center",
            height: verticalScale(56),
            width: "100%",
            backgroundColor: "transparent", // Ensure container is transparent
        },
        disabledContainer: {
            opacity: 0.7,
        },
        innerButton: {
            borderRadius: moderateScale(28),
            alignItems: "center",
            justifyContent: "center",
            flex: 1,
            width: "100%",
        },
        buttonText: {
            fontWeight: "600",
            color: colors.text,
            fontSize: moderateScale(16),
            fontFamily: Fonts.OpenSansSemiBold,
        },
    });

export default AnimatedBorderButton;
