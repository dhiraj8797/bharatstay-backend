import { Router } from 'express';
import { Request, Response } from 'express';

const router = Router();

// Test endpoint
router.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Admin settings endpoint working',
    data: {
      commissionRate: 10,
      commissionType: 'percentage',
      gstEnabled: false,
      gstRate: 18,
      platformFeeEnabled: false,
      platformFeeRate: 2,
      defaultCurrency: 'INR',
      defaultLanguage: 'en'
    }
  });
});

export default router;
