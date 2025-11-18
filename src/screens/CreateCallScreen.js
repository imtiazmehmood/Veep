import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { Platform } from 'react-native';
import { globalStyles } from '../styles/globalStyles';
import { colors } from '../styles/colors';
import { useWebRTCContext } from '../context/WebRTCContext';

const CreateCallScreen = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(false);
  const {
    createCall,
  } = useWebRTCContext();

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

  const handleCreateCall = async () => {
    try {
      setIsLoading(true);
      const newCallId = await createCall();
      navigation.replace('Call', { callId: newCallId, isCaller: true });
    } catch (error) {
      console.error('Error creating call:', error);
      Alert.alert('Error', 'Failed to create call. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={globalStyles.centerContainer}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <View style={styles.loadingIconContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
            <Text style={styles.loadingTitle}>
              Initializing...
            </Text>
            <Text style={styles.loadingSubtitle}>
              Setting up your call...
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.iconContainer}>
              <Text style={styles.iconEmoji}>📞</Text>
            </View>
            <Text style={globalStyles.title}>Create Call</Text>
            <Text style={globalStyles.subtitle}>
              Start a new video call and share the call ID with others to connect
            </Text>
            <TouchableOpacity
              style={[globalStyles.button, styles.createButton]}
              onPress={handleCreateCall}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonIcon}>✨</Text>
              <Text style={globalStyles.buttonText}>Create Call</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    borderColor: colors.primary,
  },
  iconEmoji: {
    fontSize: 56,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 24,
  },
  buttonIcon: {
    fontSize: 22,
  },
  loadingContainer: {
    alignItems: 'center',
    width: '100%',
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
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  loadingSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 32,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  callIdCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  callIdLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  copyButton: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  copyButtonText: {
    fontSize: 14,
    color: colors.primaryLight,
    fontWeight: '600',
  },
});

export default CreateCallScreen;
