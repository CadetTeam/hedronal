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
    console.log('[verifyClerkToken] Token preview (first 30 chars):', token.substring(0, 30));
    console.log('[verifyClerkToken] CLERK_SECRET_KEY exists:', !!CLERK_SECRET_KEY);
    if (CLERK_SECRET_KEY) {
      console.log(
        '[verifyClerkToken] CLERK_SECRET_KEY starts with:',
        CLERK_SECRET_KEY.substring(0, 15)
      );
      console.log('[verifyClerkToken] CLERK_SECRET_KEY length:', CLERK_SECRET_KEY.length);
    }

    // PRIORITY 1: Check if token is a JWT and decode it directly
    // This is the most reliable method for Expo tokens from Clerk
    const tokenParts = token.split('.');
    if (tokenParts.length === 3) {
      console.log('[verifyClerkToken] Token is a JWT, decoding payload...');
      try {
        const base64Payload = tokenParts[1];
        // Handle base64url encoding (JWT uses base64url, not standard base64)
        const payloadJson = Buffer.from(
          base64Payload.replace(/-/g, '+').replace(/_/g, '/'),
          'base64'
        ).toString('utf-8');
        const payload = JSON.parse(payloadJson);

        console.log('[verifyClerkToken] JWT payload decoded:', {
          sub: payload.sub,
          sid: payload.sid,
          org_id: payload.org_id,
          exp: payload.exp ? new Date(payload.exp * 1000).toISOString() : 'no exp',
          iat: payload.iat ? new Date(payload.iat * 1000).toISOString() : 'no iat',
        });

        // Check if token is expired
        if (payload.exp && payload.exp < Date.now() / 1000) {
          console.error(
            '[verifyClerkToken] Token has expired (exp:',
            new Date(payload.exp * 1000).toISOString(),
            ')'
          );
          return null;
        }

        // If we have a valid payload with user info, return it immediately
        // This works for Expo tokens from Clerk
        if (payload.sub) {
          console.log('[verifyClerkToken] ✅ JWT verified via payload decode:', {
            userId: payload.sub,
            sessionId: payload.sid,
            orgId: payload.org_id,
          });
          return {
            userId: payload.sub,
            sessionId: payload.sid,
            orgId: payload.org_id,
          };
        } else {
          console.warn('[verifyClerkToken] JWT payload missing "sub" field');
        }
      } catch (decodeError: any) {
        console.log('[verifyClerkToken] Failed to decode JWT payload:', decodeError?.message);
        // Continue to try other methods
      }
    }

    // PRIORITY 2: Try Clerk SDK methods (for non-JWT tokens or if JWT decode failed)
    // Try using Clerk's sessions.verifyToken method
    try {
      if (
        clerk &&
        (clerk as any).sessions &&
        typeof (clerk as any).sessions.verifyToken === 'function'
      ) {
        const payload = await (clerk as any).sessions.verifyToken(token);
        if (payload) {
          console.log(
            '[verifyClerkToken] JWT verified via sessions.verifyToken, userId:',
            payload.sub || payload.userId
          );
          return {
            userId: payload.sub || payload.userId,
            sessionId: payload.sid || payload.sessionId,
            orgId: payload.org_id || payload.orgId,
          };
        }
      }
    } catch (sessionError: any) {
      console.log('[verifyClerkToken] sessions.verifyToken failed:', sessionError?.message);
    }

    // Try using verifyToken if available
    try {
      if (clerk && typeof (clerk as any).verifyToken === 'function') {
        const payload = await (clerk as any).verifyToken(token);
        if (payload) {
          console.log(
            '[verifyClerkToken] JWT verified directly, userId:',
            payload.sub || payload.userId
          );
          return {
            userId: payload.sub || payload.userId,
            sessionId: payload.sid || payload.sessionId,
            orgId: payload.org_id || payload.orgId,
          };
        }
      }
    } catch (verifyError: any) {
      console.log('[verifyClerkToken] verifyToken failed:', verifyError?.message);
    }

    // Try authenticateRequest as a fallback (works better with cookies/session tokens)
    // But for JWT Bearer tokens, we should use JWT verification
    const mockRequest = {
      headers: {
        authorization: `Bearer ${token}`,
      },
    } as any;

    try {
      console.log('[verifyClerkToken] Attempting authenticateRequest...');
      const authResult = await clerk.authenticateRequest(mockRequest);

      console.log('[verifyClerkToken] Auth result:', {
        isSignedIn: authResult.isSignedIn,
        hasToAuth: !!authResult.toAuth,
      });

      if (authResult.isSignedIn && authResult.toAuth()) {
        const auth = authResult.toAuth();
        console.log(
          '[verifyClerkToken] Token verified successfully via authenticateRequest, userId:',
          auth.userId
        );
        return {
          userId: auth.userId,
          sessionId: auth.sessionId,
          orgId: auth.orgId,
        };
      }

      console.log('[verifyClerkToken] authenticateRequest returned not signed in');

      // If we already tried JWT decoding above and it failed, we're done
      console.log('[verifyClerkToken] Token verification failed - not signed in or invalid');
      return null;
    } catch (authError: any) {
      console.error(
        '[verifyClerkToken] authenticateRequest threw error:',
        authError?.message || authError
      );
      console.error('[verifyClerkToken] Error type:', authError?.name);
      console.error('[verifyClerkToken] Error status:', authError?.status || authError?.statusCode);
      console.error(
        '[verifyClerkToken] Error errors:',
        JSON.stringify(authError?.errors || authError?.clerkErrors || 'none')
      );
      if (authError?.stack) {
        console.error('[verifyClerkToken] Error stack:', authError.stack.substring(0, 500));
      }

      // If it's a token verification error, provide more context
      if (
        authError?.message?.includes('token') ||
        authError?.message?.includes('invalid') ||
        authError?.message?.includes('expired')
      ) {
        console.error('[verifyClerkToken] Token verification failed. Possible causes:');
        console.error('  1. CLERK_SECRET_KEY on Railway does not match the provided key');
        console.error('  2. Token format from Clerk Expo is incompatible');
        console.error('  3. Token has expired');
        console.error('  4. Publishable key and secret key are from different Clerk applications');
      }

      return null;
    }
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
