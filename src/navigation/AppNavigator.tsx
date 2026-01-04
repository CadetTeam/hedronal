import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useClerkContext } from '../context/ClerkContext';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export function AppNavigator() {
  const { isSignedIn, isLoaded } = useClerkContext();
  const { theme } = useTheme();

  if (!isLoaded) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <LoadingSpinner />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isSignedIn ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
