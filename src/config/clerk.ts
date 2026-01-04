// Clerk configuration
// These values should be set in your environment variables
// For Expo, use app.json extra or .env file

import Constants from 'expo-constants';

export const CLERK_PUBLISHABLE_KEY =
  Constants.expoConfig?.extra?.clerkPublishableKey ||
  process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ||
  '';

if (!CLERK_PUBLISHABLE_KEY) {
  console.warn(
    'CLERK_PUBLISHABLE_KEY is not set. Please add it to your environment variables or app.json extra config.'
  );
}

