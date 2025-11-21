import React, { useEffect, useRef, useState } from "react";
import {
    StyleSheet,
    Text,
    View,
    Animated,
    Easing,
    StyleProp,
    TextStyle,
    LayoutChangeEvent,
} from "react-native";
import MaskedView from "@react-native-masked-view/masked-view";
import LinearGradient from "react-native-linear-gradient";

interface AnimatedGradientTextProps {
    text: string;
    style?: StyleProp<TextStyle>;
    colors?: string[];
    duration?: number;
}

const AnimatedGradientText: React.FC<AnimatedGradientTextProps> = ({
    text,
    style,
    colors = ["#FF0000", "#FFFF00", "#00FF00", "#00FFFF", "#0000FF", "#FF00FF", "#FF0000"],
    duration = 2000,
}) => {
    const [layout, setLayout] = useState({ width: 0, height: 0 });
    const animatedValue = useRef(new Animated.Value(0)).current;

    const onLayout = (event: LayoutChangeEvent) => {
        const { width, height } = event.nativeEvent.layout;
        setLayout({ width, height });
    };

    useEffect(() => {
        if (layout.width > 0) {
            const startAnimation = () => {
                animatedValue.setValue(0);
                Animated.loop(
                    Animated.timing(animatedValue, {
                        toValue: 1,
                        duration: duration,
                        easing: Easing.linear,
                        useNativeDriver: true,
                    })
                ).start();
            };
            startAnimation();
        }
    }, [layout.width, animatedValue, duration]);

    const translateX = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -layout.width],
    });

    return (
        <View style={[style, { flexDirection: "row", alignItems: "center" }]}>
            {/* Invisible text to establish layout size */}
            <Text style={[style, { opacity: 0 }]} onLayout={onLayout}>
                {text}
            </Text>

            {/* MaskedView overlay */}
            {layout.width > 0 && (
                <MaskedView
                    style={StyleSheet.absoluteFill}
                    maskElement={
                        <View
                            style={{
                                flex: 1,
                                backgroundColor: "transparent",
                                justifyContent: "center",
                                alignItems: "center",
                            }}
                        >
                            <Text style={style}>{text}</Text>
                        </View>
                    }
                >
                    <Animated.View
                        style={{
                            flexDirection: "row",
                            height: layout.height,
                            width: layout.width * 2,
                            transform: [{ translateX }],
                        }}
                    >
                        <LinearGradient
                            colors={colors}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={{ width: layout.width, height: "100%" }}
                        />
                        <LinearGradient
                            colors={colors}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={{ width: layout.width, height: "100%" }}
                        />
                    </Animated.View>
                </MaskedView>
            )}
        </View>
    );
};

export default AnimatedGradientText;
