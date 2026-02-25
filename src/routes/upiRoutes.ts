import { Router } from 'express';
import { verifyUPI, getSupportedProviders } from '../controllers/upiController';

const router = Router();

// Verify UPI ID
router.post('/verify', verifyUPI);

// Get supported UPI providers
router.get('/providers', getSupportedProviders);

export default router;
