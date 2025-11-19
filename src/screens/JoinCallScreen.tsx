import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { globalStyles } from '../styles/globalStyles';
import { colors } from '../styles/colors';
import { useWebRTCContext } from '../context/WebRTCContext';
import type { NavigationProps } from '../types/navigation';

const JoinCallScreen: React.FC<NavigationProps<'JoinCall'>> = ({ navigation }) => {
  const [callIdInput, setCallIdInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const { joinCall, initLocalStream } = useWebRTCContext();

  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    try {
      const cameraPermission =
        Platform.OS === 'ios'
          ? PERMISSIONS.IOS.CAMERA
          : PERMISSIONS.ANDROID.CAMERA;
      const microphonePermission =
        Platform.OS === 'ios'
          ? PERMISSIONS.IOS.MICROPHONE
          : PERMISSIONS.ANDROID.RECORD_AUDIO;

      const cameraResult = await request(cameraPermission);
      const microphoneResult = await request(microphonePermission);

      if (
        cameraResult !== RESULTS.GRANTED ||
        microphoneResult !== RESULTS.GRANTED
      ) {
        Alert.alert(
          'Permissions Required',
          'Camera and microphone permissions are required for video calls.',
          [{ text: 'OK' }]
        );
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
    }
  };

  const handleJoinCall = async () => {
    if (!callIdInput.trim()) {
      Alert.alert('Error', 'Please enter a call ID');
      return;
    }

    try {
      setIsLoading(true);
      await initLocalStream();
      await joinCall(callIdInput.trim());
      (navigation as any).replace('Call', {
        callId: callIdInput.trim(),
        isCaller: false,
      });
    } catch (error) {
      console.error('Error joining call:', error);
      Alert.alert('Error', 'Failed to join call. Please check the call ID and try again.');
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={globalStyles.centerContainer}>
          <View style={styles.iconContainer}>
            <Text style={styles.iconEmoji}>🔗</Text>
          </View>
          <Text style={globalStyles.title}>Join Call</Text>
          <Text style={globalStyles.subtitle}>
            Enter the call ID provided by the host to join the video call
          </Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={[
                globalStyles.input,
                isFocused && globalStyles.inputFocused,
                styles.inputField,
              ]}
              placeholder="Enter Call ID"
              placeholderTextColor={colors.textTertiary}
              value={callIdInput}
              onChangeText={setCallIdInput}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
              returnKeyType="go"
              onSubmitEditing={handleJoinCall}
            />
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <View style={styles.loadingIconContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
              <Text style={styles.loadingTitle}>Connecting...</Text>
              <Text style={styles.loadingSubtitle}>
                Waiting for caller to accept
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[
                globalStyles.button,
                styles.joinButton,
                (!callIdInput.trim() || isLoading) && globalStyles.buttonDisabled,
              ]}
              onPress={handleJoinCall}
              disabled={isLoading || !callIdInput.trim()}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonIcon}>🚀</Text>
              <Text style={globalStyles.buttonText}>Join Call</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 2,
    borderColor: colors.secondary,
  },
  iconEmoji: {
    fontSize: 56,
  },
  inputContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
  },
  inputField: {
    width: '100%',
    maxWidth: 320,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  buttonIcon: {
    fontSize: 22,
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 32,
  },
  loadingIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  loadingTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  loadingSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});

export default JoinCallScreen;
