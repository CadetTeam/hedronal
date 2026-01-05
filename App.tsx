import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ClerkProvider } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';
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
  React.useEffect(() => {
    console.log('[App] Clerk publishable key:', CLERK_PUBLISHABLE_KEY ? 'SET' : 'MISSING');
    if (CLERK_PUBLISHABLE_KEY) {
      console.log('[App] Key starts with:', CLERK_PUBLISHABLE_KEY.substring(0, 10));
    }
  }, []);

  if (!CLERK_PUBLISHABLE_KEY) {
    console.error(
      'CLERK_PUBLISHABLE_KEY is missing. Please configure it in app.json or environment variables.'
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        {/* 
          Clerk session lifetime is configured in the Clerk Dashboard:
          1. Go to https://dashboard.clerk.com
          2. Navigate to Settings → Sessions
          3. Set "Session lifetime" to 7 days (604800 seconds)
          4. Save changes
          
          This will keep users logged in for 7 days before requiring re-authentication.
        */}
        <ClerkProvider
          publishableKey={CLERK_PUBLISHABLE_KEY}
          tokenCache={{
            async getToken(key: string) {
              try {
                return await SecureStore.getItemAsync(key);
              } catch (err) {
                return null;
              }
            },
            async saveToken(key: string, value: string) {
              try {
                await SecureStore.setItemAsync(key, value);
              } catch (err) {
                // Handle error
              }
            },
            async clearToken(key: string) {
              try {
                await SecureStore.deleteItemAsync(key);
              } catch (err) {
                // Handle error
              }
            },
          }}
        >
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
