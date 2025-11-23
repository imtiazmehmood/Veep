import React from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    Alert,
} from 'react-native';
import NeonGradientButton from '../components/NeonGradientButton';
import NeonGradientCard from '../components/NeonGradientCard';
import NeonGradientLoader from '../components/NeonGradientLoader';
import AnimatedGradientText from '../components/AnimatedGradientText';
import AnimatedNeonText from '../components/AnimatedNeonText';
import AnimatedGlitterText from '../components/AnimatedGlitterText';
import ParticleFlock from '../components/ParticleFlock';
import ParticleBox from '../components/ParticleBox';
import AnimatedBorderButton from '../components/AnimatedBorderButton';
import AnimatedBorderView from '../components/AnimatedBorderView';
import BurnAnimation from '../components/BurnAnimation';
import { SafeAreaView } from 'react-native-safe-area-context';

const SkiaComponentsDemo: React.FC = () => {
    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.header}>Skia Components</Text>

                {/* Gradient Text Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Gradient Text</Text>
                    <AnimatedGradientText
                        text="Skia Components"
                        fontSize={42}
                        duration={3000}
                    />

                    <View style={styles.spacer} />

                    <AnimatedGradientText
                        text="Pure Skia Power"
                        fontSize={36}
                        colors={['#00FFFF', '#00FF88', '#FFFF00', '#FF00FF', '#00FFFF']}
                        duration={2500}
                    />
                </View>

                {/* Neon Text Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Neon Text</Text>
                    <Text style={styles.sectionSubtitle}>Premium neon sign effects with dramatic glows</Text>

                    <AnimatedNeonText
                        text="✨ LUXURY ✨"
                        fontSize={52}
                        fontWeight="bold"
                        neonColor="#FF00FF"
                        glowIntensity="high"
                        pulseSpeed={2500}
                    />

                    <View style={styles.spacer} />

                    <AnimatedNeonText
                        text="CYBER PUNK"
                        fontSize={46}
                        fontWeight="bold"
                        neonColor="#00FFFF"
                        glowIntensity="high"
                        pulseSpeed={1800}
                    />

                    <View style={styles.spacer} />

                    <AnimatedNeonText
                        text="⚡ ELECTRIC ⚡"
                        fontSize={44}
                        fontWeight="bold"
                        neonColor="#FFFF00"
                        glowIntensity="high"
                        flickerEnabled={true}
                        pulseSpeed={2000}
                    />

                    <View style={styles.spacer} />

                    <AnimatedNeonText
                        text="RETRO VIBES"
                        fontSize={40}
                        fontWeight="bold"
                        neonColor="#FF0066"
                        glowIntensity="medium"
                        pulseSpeed={2200}
                    />
                </View>

                {/* AI Particles Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>AI Particles</Text>
                    <Text style={styles.sectionSubtitle}>Flocking simulation & Floating particles</Text>

                    <ParticleFlock style={{ marginBottom: 20 }}>
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                            <Text style={{ color: 'white', fontWeight: 'bold' }}>Flock Simulation</Text>
                        </View>
                    </ParticleFlock>

                    <ParticleBox>
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                            <Text style={{ color: 'white', fontWeight: 'bold' }}>Floating Particles</Text>
                        </View>
                    </ParticleBox>
                </View>

                {/* Border Animations Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Snake Borders</Text>

                    <AnimatedBorderView style={{ height: 100, marginBottom: 20 }}>
                        <Text style={{ color: 'white' }}>Animated Border View</Text>
                    </AnimatedBorderView>

                    <AnimatedBorderButton
                        title="Snake Border Button"
                        onPress={() => Alert.alert('Pressed')}
                    />
                </View>

                {/* Loader Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Animated Loader</Text>
                    <NeonGradientLoader size={100} duration={2000} />
                </View>

                {/* Burn Animation Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Burn Animation</Text>
                    <Text style={styles.sectionSubtitle}>Tap to burn, long press to reset</Text>
                    <BurnAnimation
                        imageSource={require('../assets/sample-image.png')}
                        width={250}
                        height={250}
                        onComplete={() => Alert.alert('Burned!', 'Image has been destroyed')}
                    />
                </View>

                {/* Glitter Text Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Glitter Text</Text>

                    <AnimatedGlitterText
                        text="✨ Sparkle ✨"
                        fontSize={52}
                        fontWeight="bold"
                        textColor="#FFD700"
                        particleCount={40}
                        duration={3000}
                        glitterSize={5}
                    />

                    <View style={styles.spacer} />

                    <AnimatedGlitterText
                        text="Diamond"
                        fontSize={44}
                        fontWeight="700"
                        textColor="#00FFFF"
                        glitterColors={['#FFFFFF', '#00FFFF', '#0088FF', '#FFFFFF']}
                        particleCount={35}
                        duration={2500}
                        glitterSize={4}
                    />

                    <View style={styles.spacer} />

                    <AnimatedGlitterText
                        text="Magic"
                        fontSize={40}
                        fontWeight="600"
                        textColor="#FF00FF"
                        glitterColors={['#FFFFFF', '#FF00FF', '#FF69B4', '#FFD700']}
                        particleCount={30}
                        duration={3500}
                        glitterSize={3}
                    />
                </View>

                {/* Buttons Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Animated Buttons</Text>

                    <NeonGradientButton
                        title="Primary Action"
                        onPress={() => Alert.alert('Button Pressed', 'Primary action triggered!')}
                        width={280}
                        height={60}
                        duration={3000}
                        style={styles.button}
                    />

                    <NeonGradientButton
                        title="Secondary Action"
                        onPress={() => Alert.alert('Button Pressed', 'Secondary action triggered!')}
                        width={280}
                        height={60}
                        colors={['#00FFFF', '#00FF88', '#00FFFF']}
                        glowColors={[
                            'rgba(0, 255, 255, 0.8)',
                            'rgba(0, 255, 136, 0.8)',
                            'rgba(0, 255, 255, 0.8)',
                        ]}
                        duration={2500}
                        style={styles.button}
                    />

                    <NeonGradientButton
                        title="Disabled"
                        width={280}
                        height={60}
                        disabled={true}
                        style={styles.button}
                    />
                </View>

                {/* Cards Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Animated Cards</Text>

                    <NeonGradientCard
                        height={180}
                        duration={4000}
                        style={styles.card}
                    >
                        <Text style={styles.cardTitle}>Premium Card</Text>
                        <Text style={styles.cardDescription}>
                            This card features a rotating sweep gradient border with a
                            mesmerizing shimmer effect powered by React Native Skia.
                        </Text>
                    </NeonGradientCard>

                    <NeonGradientCard
                        height={180}
                        colors={['#FFFF00', '#FF00FF', '#00FFFF', '#00FF88', '#FFFF00']}
                        shimmerColors={[
                            'rgba(255, 255, 0, 0)',
                            'rgba(255, 0, 255, 0.5)',
                            'rgba(0, 255, 255, 0.5)',
                            'rgba(0, 255, 136, 0)',
                        ]}
                        duration={3500}
                        style={styles.card}
                    >
                        <Text style={styles.cardTitle}>Custom Colors</Text>
                        <Text style={styles.cardDescription}>
                            Fully customizable gradient colors and animation duration for
                            unique visual effects.
                        </Text>
                    </NeonGradientCard>
                </View>

                {/* Loaders Variety */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Loader Variations</Text>
                    <View style={styles.loaderRow}>
                        <NeonGradientLoader size={60} duration={1500} />
                        <NeonGradientLoader
                            size={80}
                            duration={2500}
                            colors={['#00FFFF', '#00FF88', '#FFFF00', '#00FFFF']}
                        />
                        <NeonGradientLoader
                            size={60}
                            duration={2000}
                            colors={['#FF0000', '#FF00FF', '#8B00FF', '#FF0000']}
                            strokeWidth={4}
                        />
                    </View>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        All components use React Native Skia for 60fps performance
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#000000',
    },
    container: {
        flex: 1,
    },
    contentContainer: {
        padding: 20,
        paddingBottom: 40,
    },
    header: {
        alignItems: 'center',
        marginVertical: 30,
    },
    headerText: {
        fontSize: 42,
        fontWeight: 'bold',
    },
    section: {
        marginBottom: 40,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 10,
        textAlign: 'center',
    },
    sectionSubtitle: {
        fontSize: 14,
        color: '#AAAAAA',
        marginBottom: 20,
    },
    button: {
        marginBottom: 16,
    },
    card: {
        marginBottom: 20,
    },
    cardTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 12,
    },
    cardDescription: {
        fontSize: 14,
        color: '#CCCCCC',
        lineHeight: 20,
    },
    loaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingVertical: 20,
    },
    spacer: {
        height: 30,
    },
    footer: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 20,
    },
    footerText: {
        fontSize: 12,
        color: '#666666',
        textAlign: 'center',
    },
});

export default SkiaComponentsDemo;
