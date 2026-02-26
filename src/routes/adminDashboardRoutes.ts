import { Router } from 'express';
import { Request, Response } from 'express';

const router = Router();

console.log('Admin dashboard routes loaded');

// Test endpoint
router.get('/stats', (req: Request, res: Response) => {
  console.log('Admin dashboard stats endpoint called');
  res.json({
    success: true,
    message: 'Admin dashboard stats endpoint working',
    data: {
      totalUsers: 100,
      totalHosts: 50,
      activeProperties: 25,
      totalBookingsToday: 10
    }
  });
});

export default router;
