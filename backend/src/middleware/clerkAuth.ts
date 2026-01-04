import { Request, Response, NextFunction } from 'express';
import { verifyClerkToken } from '../config/clerk';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  user?: any;
}

export async function clerkAuthMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    console.log('[clerkAuthMiddleware] Processing request:', req.method, req.path);
    
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[clerkAuthMiddleware] No authorization header');
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    console.log('[clerkAuthMiddleware] Verifying token...');
    
    const session = await verifyClerkToken(token);

    if (!session) {
      console.log('[clerkAuthMiddleware] Token verification failed');
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    console.log('[clerkAuthMiddleware] Token verified, userId:', session.userId);
    req.userId = session.userId;
    req.user = session;
    next();
  } catch (error: any) {
    console.error('[clerkAuthMiddleware] Error:', error);
    console.error('[clerkAuthMiddleware] Error stack:', error.stack);
    return res.status(401).json({ error: 'Authentication failed' });
  }
}

