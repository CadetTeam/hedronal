import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth, useUser, useOrganization, useOrganizationList } from '@clerk/clerk-expo';

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
  // Fetch user memberships to get organizations
  const orgListData = useOrganizationList({
    userMemberships: {
      pageSize: 100, // Get all memberships
    },
  });

  // Extract organizations from userMemberships.data
  // Handle both the new API structure and potential legacy structure
  const rawOrgList = React.useMemo(() => {
    // Try to get from userMemberships.data first (new API)
    if (orgListData.userMemberships?.data && Array.isArray(orgListData.userMemberships.data)) {
      return orgListData.userMemberships.data.map((membership: any) => ({
        id: membership.organization?.id || membership.id,
        name: membership.organization?.name || membership.name,
        slug: membership.organization?.slug || membership.slug,
        role: membership.role || 'basic_member', // 'admin', 'basic_member', etc.
        createdAt: membership.organization?.createdAt || membership.createdAt,
        ...(membership.organization || membership),
      }));
    }
    // Fallback: try legacy structure if it exists
    if (
      (orgListData as any).organizationList &&
      Array.isArray((orgListData as any).organizationList)
    ) {
      return (orgListData as any).organizationList;
    }
    if ((orgListData as any).organizations && Array.isArray((orgListData as any).organizations)) {
      return (orgListData as any).organizations;
    }
    return [];
  }, [
    orgListData.userMemberships?.data,
    (orgListData as any).organizationList,
    (orgListData as any).organizations,
  ]);

  const organizationList = rawOrgList || [];
  const orgListLoaded =
    orgListData.isLoaded &&
    (orgListData.userMemberships?.isLoading === false || orgListData.isLoaded);

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

  // Debug logging
  React.useEffect(() => {
    console.log('[ClerkContext] Loading states:', {
      authLoaded,
      userLoaded,
      orgListLoaded,
      isLoaded,
      isSignedIn,
      organizationCount: organizationList.length,
      organizationIds: organizationList.map((org: any) => org.id),
      userMembershipsData: orgListData.userMemberships?.data?.length || 0,
    });
  }, [
    authLoaded,
    userLoaded,
    orgListLoaded,
    isLoaded,
    isSignedIn,
    organizationList,
    orgListData.userMemberships,
  ]);

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
