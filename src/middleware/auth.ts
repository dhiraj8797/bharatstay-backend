import { Request, Response, NextFunction } from 'express';
import User from '../models/User';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({ success: false, message: 'Access token required' });
      return;
    }

    // For now, we'll use a simple token validation (in production, use JWT)
    // This is a simplified version - you should implement proper JWT verification
    const user = await User.findOne({ firebaseUid: token });
    
    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid token' });
      return;
    }

    if (user.isSuspended) {
      res.status(403).json({ success: false, message: 'Account suspended' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};
