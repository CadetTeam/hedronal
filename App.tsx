import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ClerkProvider } from '@clerk/clerk-expo';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { DemoModeProvider } from './src/context/DemoModeContext';
import { ClerkProvider as CustomClerkProvider } from './src/context/ClerkContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { CLERK_PUBLISHABLE_KEY } from './src/config/clerk';

function AppContent() {
  const { isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <CustomClerkProvider>
        <AppNavigator />
      </CustomClerkProvider>
    </>
  );
}

export default function App() {
  if (!CLERK_PUBLISHABLE_KEY) {
    console.error('CLERK_PUBLISHABLE_KEY is missing. Please configure it in app.json or environment variables.');
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
          <ThemeProvider>
            <DemoModeProvider>
              <AppContent />
            </DemoModeProvider>
          </ThemeProvider>
        </ClerkProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}