import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth, useUser, useOrganization, useOrganizationList } from '@clerk/clerk-expo';

import { initializeRevenueCat, logOutRevenueCat } from '../config/revenuecat';

interface ClerkContextType {
  isSignedIn: boolean;
  userId: string | null | undefined;
  user: ReturnType<typeof useUser>['user'];
  organization: ReturnType<typeof useOrganization>['organization'];
  organizationList: any[];
  isLoaded: boolean;
}

const ClerkContext = createContext<ClerkContextType | undefined>(undefined);

export function ClerkProvider({ children }: { children: ReactNode }) {
  const { isSignedIn, userId, isLoaded: authLoaded } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();
  const { organization } = useOrganization();
  const orgListData = useOrganizationList();
  const organizationList =
    (orgListData as any).organizationList || (orgListData as any).organizations || [];
  const orgListLoaded = orgListData.isLoaded || false;

  // Only require auth to be loaded - org list can load later
  // Add timeout fallback - if Clerk takes too long, show auth screen anyway
  const [hasTimedOut, setHasTimedOut] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (!authLoaded || !userLoaded) {
        console.warn('[ClerkContext] Clerk loading timeout - proceeding anyway');
        setHasTimedOut(true);
      }
    }, 5000); // 5 second timeout

    return () => clearTimeout(timer);
  }, [authLoaded, userLoaded]);

  const isLoaded = (authLoaded && userLoaded) || hasTimedOut;

  // Initialize RevenueCat when user signs in
  React.useEffect(() => {
    if (isLoaded && isSignedIn && user?.id) {
      initializeRevenueCat(user.id).catch(error => {
        console.error('[ClerkContext] Failed to initialize RevenueCat:', error);
      });
    }
  }, [isLoaded, isSignedIn, user?.id]);

  // Log out RevenueCat when user signs out
  React.useEffect(() => {
    if (isLoaded && !isSignedIn) {
      logOutRevenueCat().catch(error => {
        console.error('[ClerkContext] Failed to log out RevenueCat:', error);
      });
    }
  }, [isLoaded, isSignedIn]);

  // Debug logging
  React.useEffect(() => {
    console.log('[ClerkContext] Loading states:', {
      authLoaded,
      userLoaded,
      orgListLoaded,
      isLoaded,
      isSignedIn,
    });
  }, [authLoaded, userLoaded, orgListLoaded, isLoaded, isSignedIn]);

  return (
    <ClerkContext.Provider
      value={{
        isSignedIn: isSignedIn ?? false,
        userId,
        user: user ?? null,
        organization: organization ?? null,
        organizationList: organizationList ?? [],
        isLoaded,
      }}
    >
      {children}
    </ClerkContext.Provider>
  );
}

export function useClerkContext() {
  const context = useContext(ClerkContext);
  if (context === undefined) {
    throw new Error('useClerkContext must be used within a ClerkProvider');
  }
  return context;
}
