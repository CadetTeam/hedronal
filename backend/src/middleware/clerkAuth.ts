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
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const session = await verifyClerkToken(token);

    if (!session) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.userId = session.userId;
    req.user = session;
    next();
  } catch (error: any) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
}

