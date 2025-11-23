import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Canvas, Rect, vec, Group } from '@shopify/react-native-skia';
import {
    useSharedValue,
    withRepeat,
    withTiming,
    useDerivedValue,
    Easing,
} from 'react-native-reanimated';

const SimpleSkiaBox = () => {
    const rotation = useSharedValue(0);

    useEffect(() => {
        rotation.value = withRepeat(
            withTiming(2 * Math.PI, { duration: 2000, easing: Easing.linear }),
            -1,
            false
        );
    }, []);

    const transform = useDerivedValue(() => {
        'worklet';
        return [{ rotate: rotation.value }];
    });

    const size = 100;
    const center = size / 2;

    return (
        <View style={styles.container}>
            <Canvas style={{ width: size, height: size }}>
                <Group origin={vec(center, center)} transform={transform}>
                    <Rect x={0} y={0} width={size} height={size} color="cyan" />
                </Group>
            </Canvas>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        margin: 20,
        borderWidth: 1,
        borderColor: '#ccc',
    },
});

export default SimpleSkiaBox;
