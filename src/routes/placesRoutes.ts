import { Router } from 'express';
import { autocompletePlaces } from '../controllers/placesController';

const router = Router();

router.get('/autocomplete', autocompletePlaces);

export default router;
