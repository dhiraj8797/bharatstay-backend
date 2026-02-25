import { Router } from 'express';
import { submitContactForm } from '../controllers/contactController';

const router = Router();

// POST /api/contact - Submit contact form
router.post('/contact', submitContactForm);

export default router;
