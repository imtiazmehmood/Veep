import React from 'react';
import { View, StyleSheet, Text as RNText } from 'react-native';
import {
    Canvas,
    Rect,
    RoundedRect,
    Circle,
    LinearGradient,
    SweepGradient,
    vec,
    Text,
    matchFont,
    Group,
} from '@shopify/react-native-skia';

const ComponentDebugger = () => {
    const size = 100;
    const font = matchFont({ fontSize: 20 });

    return (
        <View style={styles.container}>
            <RNText style={styles.label}>Debug Panel</RNText>

            {/* Test 1: RoundedRect (Used in Button/Card) */}
            <View style={styles.row}>
                <RNText>RoundedRect:</RNText>
                <Canvas style={{ width: 50, height: 50 }}>
                    <RoundedRect x={0} y={0} width={50} height={50} r={10} color="cyan" />
                </Canvas>
            </View>

            {/* Test 2: Text (Used in GradientText/GlitterText) */}
            <View style={styles.row}>
                <RNText>Skia Text:</RNText>
                <Canvas style={{ width: 100, height: 50 }}>
                    {font && <Text x={0} y={30} text="Hello" font={font} color="magenta" />}
                </Canvas>
            </View>

            {/* Test 3: SweepGradient (Used in Card) */}
            <View style={styles.row}>
                <RNText>SweepGrad:</RNText>
                <Canvas style={{ width: 50, height: 50 }}>
                    <Rect x={0} y={0} width={50} height={50}>
                        <SweepGradient
                            c={vec(25, 25)}
                            colors={['cyan', 'magenta', 'cyan']}
                        />
                    </Rect>
                </Canvas>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 10,
        backgroundColor: '#222',
        margin: 10,
        borderRadius: 8,
    },
    label: {
        color: 'white',
        fontWeight: 'bold',
        marginBottom: 10,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#444',
        paddingBottom: 5,
    },
});

export default ComponentDebugger;
