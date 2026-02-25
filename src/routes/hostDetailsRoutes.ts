import { Router } from 'express';
import { 
  getHostDetails, 
  saveHostDetails, 
  deleteHostDetails, 
  getHostDetailsForGuest 
} from '../controllers/hostDetailsController';

const router = Router();

// GET /api/host-details/:hostId - Get host details
router.get('/:hostId', getHostDetails);

// PUT /api/host-details/:hostId - Create or update host details
router.put('/:hostId', saveHostDetails);

// DELETE /api/host-details/:hostId - Delete host details
router.delete('/:hostId', deleteHostDetails);

// GET /api/host-details/:hostId/public - Get host details for guest view
router.get('/:hostId/public', getHostDetailsForGuest);

export default router;
