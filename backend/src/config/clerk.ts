import { createClerkClient } from '@clerk/clerk-sdk-node';
import * as dotenv from 'dotenv';

dotenv.config();

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY || '';

if (!CLERK_SECRET_KEY) {
  throw new Error('Missing CLERK_SECRET_KEY environment variable');
}

export const clerk = createClerkClient({ secretKey: CLERK_SECRET_KEY });

// Helper function to verify Clerk token
// Clerk SDK uses authenticateRequest for token verification
export async function verifyClerkToken(token: string) {
  try {
    // Create a mock request object for authenticateRequest
    const mockRequest = {
      headers: {
        authorization: `Bearer ${token}`,
      },
    } as any;
    
    const authResult = await clerk.authenticateRequest(mockRequest);
    
    if (authResult.isSignedIn && authResult.toAuth()) {
      const auth = authResult.toAuth();
      return {
        userId: auth.userId,
        sessionId: auth.sessionId,
        orgId: auth.orgId,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Token verification error:', error);
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

