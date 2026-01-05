// RevenueCat configuration
// These values should be set in your environment variables
// For Expo, use EAS environment variables or .env file
// NOTE: This requires a development build or production build (not Expo Go)

import Constants from 'expo-constants';
import Purchases, { CustomerInfo, PurchasesOffering, PurchasesPackage } from 'react-native-purchases';

// Get RevenueCat API key from environment variables
const REVENUECAT_API_KEY =
  process.env.EXPO_PUBLIC_REVENUECAT_API_KEY ||
  Constants.expoConfig?.extra?.revenuecatApiKey ||
  '';

if (!REVENUECAT_API_KEY) {
  console.warn(
    'RevenueCat API key is not set. Please add EXPO_PUBLIC_REVENUECAT_API_KEY to your environment variables or EAS secrets.'
  );
}

// Track initialization state
let isRevenueCatInitialized = false;

// Initialize RevenueCat SDK
export async function initializeRevenueCat(userId?: string): Promise<void> {
  try {
    // Configure RevenueCat with API key
    if (REVENUECAT_API_KEY) {
      // Configure RevenueCat (synchronous operation)
      Purchases.configure({ apiKey: REVENUECAT_API_KEY });

      // Set user ID if provided (usually Clerk user ID)
      if (userId) {
        await Purchases.logIn(userId);
      }

      isRevenueCatInitialized = true;
      console.log('[RevenueCat] Initialized successfully');
    } else {
      console.warn('[RevenueCat] API key not found, skipping initialization');
      isRevenueCatInitialized = false;
    }
  } catch (error) {
    console.error('[RevenueCat] Initialization error:', error);
    throw error;
  }
}

// Get customer info
export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo;
  } catch (error) {
    console.error('[RevenueCat] Error getting customer info:', error);
    return null;
  }
}

// Get available offerings
export async function getOfferings(): Promise<PurchasesOffering | null> {
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current;
  } catch (error) {
    console.error('[RevenueCat] Error getting offerings:', error);
    return null;
  }
}

// Purchase a package
export async function purchasePackage(packageToPurchase: PurchasesPackage): Promise<CustomerInfo> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
    return customerInfo;
  } catch (error) {
    console.error('[RevenueCat] Error purchasing package:', error);
    throw error;
  }
}

// Restore purchases
export async function restorePurchases(): Promise<CustomerInfo> {
  try {
    const customerInfo = await Purchases.restorePurchases();
    return customerInfo;
  } catch (error) {
    console.error('[RevenueCat] Error restoring purchases:', error);
    throw error;
  }
}

// Log out user
export async function logOutRevenueCat(): Promise<void> {
  try {
    // Check if RevenueCat was initialized
    if (!isRevenueCatInitialized || !REVENUECAT_API_KEY) {
      // Not initialized, nothing to log out
      return;
    }
    
    await Purchases.logOut();
    isRevenueCatInitialized = false;
    console.log('[RevenueCat] Logged out successfully');
  } catch (error: any) {
    // If error is about no singleton instance, it means RevenueCat was never initialized
    // This is fine - just log and don't throw
    if (error?.message?.includes('singleton instance')) {
      isRevenueCatInitialized = false;
      console.log('[RevenueCat] Not initialized, skipping logout');
      return;
    }
    console.error('[RevenueCat] Error logging out:', error);
    isRevenueCatInitialized = false;
    // Don't throw - allow app to continue
  }
}

// Export the API key for reference
export { REVENUECAT_API_KEY };
