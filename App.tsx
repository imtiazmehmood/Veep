import React from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import HomeScreen from './src/screens/HomeScreen';
import CreateCallScreen from './src/screens/CreateCallScreen';
import JoinCallScreen from './src/screens/JoinCallScreen';
import CallScreen from './src/screens/CallScreen';
import { WebRTCProvider } from './src/context/WebRTCContext';

const Stack = createNativeStackNavigator();

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <WebRTCProvider>
          <NavigationContainer>
            <Stack.Navigator
            initialRouteName="Home"
            screenOptions={{
              headerStyle: {
                backgroundColor: '#000000',
              },
              headerTintColor: '#FFFFFF',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}
            >
              <Stack.Screen
                name="Home"
                component={HomeScreen}
                options={{ title: 'Veep' }}
              />
              <Stack.Screen
                name="CreateCall"
                component={CreateCallScreen}
                options={{ title: 'Create Call' }}
              />
              <Stack.Screen
                name="JoinCall"
                component={JoinCallScreen}
                options={{ title: 'Join Call' }}
              />
              <Stack.Screen
                name="Call"
                component={CallScreen}
                options={{ 
                  headerShown: false,
                  gestureEnabled: false,
                }}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </WebRTCProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;
