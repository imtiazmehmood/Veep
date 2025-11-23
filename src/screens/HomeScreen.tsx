import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { globalStyles } from '../styles/globalStyles';
import { colors } from '../styles/colors';
import type { NavigationProps } from '../types/navigation';
import { Fonts } from '../theme/Fonts';
import AnimatedBorderButton from '../components/AnimatedBorderButton';
import AnimatedBorderView from '../components/AnimatedBorderView';
import AnimatedGradientText from '../components/AnimatedGradientText';
import { moderateScale } from '../utils/metrics';

const HomeScreen: React.FC<NavigationProps<'Home'>> = ({ navigation }) => {
  const startCall = () => {
    requestAnimationFrame(() => {
      navigation.navigate('WebRTCCall');
    });
  };
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={globalStyles.centerContainer}>
        {/* App Logo/Icon */}
        {/* <AnimatedBorderView
          style={styles.logoContainer}
        // borderWidth={3}
        // borderColors={[colors.primary, colors.primaryLight, colors.primary]}
        >
          <AnimatedGradientText
            text="Veep"
            style={{
              fontFamily: Fonts.NunitoBold,
              fontSize: moderateScale(24),
            }}
          />
        </AnimatedBorderView> */}
        <AnimatedGradientText
          text="Veep"
          style={{
            fontFamily: Fonts.NunitoBold,
            fontSize: moderateScale(24),
          }}
        />

        {/* Title */}
        {/* <Text style={globalStyles.title}>Veep</Text> */}

        {/* <AnimatedBorderButton title="Veep" onPress={() => { }} /> */}
        <Text style={styles.tagline}>Connect face-to-face</Text>
        <Text style={globalStyles.subtitle}>
          Start or join a video call instantly
        </Text>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          {/* <TouchableOpacity
            style={[globalStyles.button, styles.primaryButton]}
            onPress={() => navigation.navigate('WebRTCCall')}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonIcon}>📞</Text>
            <Text style={globalStyles.buttonText}>Start Video Call</Text>
          </TouchableOpacity> */}

          <AnimatedBorderButton title="Start Video Call" onPress={startCall} />
          <Text style={globalStyles.buttonText}></Text>
        </View>

        {/* Footer Info */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Secure • Private • Free</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  logoEmoji: {
    fontSize: 64,
  },
  tagline: {
    fontSize: 20,
    color: colors.primaryLight,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 24,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  buttonIcon: {
    fontSize: 24,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: colors.textTertiary,
    fontWeight: '500',
    letterSpacing: 1,
  },
});

export default HomeScreen;
