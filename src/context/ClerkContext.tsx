import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth, useUser, useOrganization, useOrganizationList } from '@clerk/clerk-expo';

interface ClerkContextType {
  isSignedIn: boolean;
  userId: string | null | undefined;
  user: ReturnType<typeof useUser>['user'];
  organization: ReturnType<typeof useOrganization>['organization'];
  organizationList: ReturnType<typeof useOrganizationList>['organizationList'];
  isLoaded: boolean;
}

const ClerkContext = createContext<ClerkContextType | undefined>(undefined);

export function ClerkProvider({ children }: { children: ReactNode }) {
  const { isSignedIn, userId, isLoaded: authLoaded } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();
  const { organization } = useOrganization();
  const { organizationList, isLoaded: orgListLoaded } = useOrganizationList();

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
  
  const isLoaded = authLoaded && userLoaded || hasTimedOut;

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

