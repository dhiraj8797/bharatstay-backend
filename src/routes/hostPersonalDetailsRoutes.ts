import express from 'express';
import {
  getHostPersonalDetails,
  upsertHostPersonalDetails,
  deleteHostPersonalDetails
} from '../controllers/hostPersonalDetailsController';

const router = express.Router();

// Routes without auth middleware (for now)
router.get('/:hostId', getHostPersonalDetails);
router.put('/:hostId', upsertHostPersonalDetails);
router.delete('/:hostId', deleteHostPersonalDetails);

export default router;
