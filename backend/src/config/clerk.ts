import { createClerkClient } from '@clerk/clerk-sdk-node';
import * as dotenv from 'dotenv';

dotenv.config();

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY || '';

if (!CLERK_SECRET_KEY) {
  console.warn('⚠️  Missing CLERK_SECRET_KEY environment variable');
  console.warn('⚠️  Clerk authentication will not work until this is set');
}

export const clerk = CLERK_SECRET_KEY
  ? createClerkClient({ secretKey: CLERK_SECRET_KEY })
  : (null as any); // Will fail gracefully when used

// Helper function to verify Clerk token
// Clerk SDK uses authenticateRequest for token verification
export async function verifyClerkToken(token: string) {
  try {
    if (!CLERK_SECRET_KEY || !clerk) {
      console.error('[verifyClerkToken] Clerk client not initialized - missing CLERK_SECRET_KEY');
      return null;
    }

    if (!token || token.trim().length === 0) {
      console.error('[verifyClerkToken] Empty or invalid token provided');
      return null;
    }

    console.log('[verifyClerkToken] Verifying token, length:', token.length);

    // Create a mock request object for authenticateRequest
    const mockRequest = {
      headers: {
        authorization: `Bearer ${token}`,
      },
    } as any;

    const authResult = await clerk.authenticateRequest(mockRequest);

    if (authResult.isSignedIn && authResult.toAuth()) {
      const auth = authResult.toAuth();
      console.log('[verifyClerkToken] Token verified successfully, userId:', auth.userId);
      return {
        userId: auth.userId,
        sessionId: auth.sessionId,
        orgId: auth.orgId,
      };
    }

    console.log('[verifyClerkToken] Token verification failed - not signed in');
    return null;
  } catch (error: any) {
    console.error('[verifyClerkToken] Token verification error:', error?.message || error);
    console.error('[verifyClerkToken] Error details:', {
      name: error?.name,
      message: error?.message,
      stack: error?.stack?.substring(0, 200),
    });
    return null;
  }
}

// Helper function to get user by ID
export async function getClerkUser(userId: string) {
  try {
    const user = await clerk.users.getUser(userId);
    return user;
  } catch (error) {
    return null;
  }
}

// Helper function to get organization by ID
export async function getClerkOrganization(orgId: string) {
  try {
    const organization = await clerk.organizations.getOrganization({ organizationId: orgId });
    return organization;
  } catch (error) {
    return null;
  }
}
