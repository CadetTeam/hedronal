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
  const { isSignedIn, userId } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();
  const { organization } = useOrganization();
  const { organizationList, isLoaded: orgListLoaded } = useOrganizationList();

  const isLoaded = userLoaded && orgListLoaded;

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

