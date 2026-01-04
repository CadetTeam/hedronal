import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';

export function AppNavigator() {
  // For now, show main navigator to test the app
  // Later, add logic to check auth state and show auth navigator if not authenticated
  const isAuthenticated = true; // Placeholder - implement auth check

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
