import { getCategories, getEvents } from '../controllers/event.controller';

import { Router } from 'express';

const router = Router();

router.get('/', getEvents);
router.get('/categories', getCategories);

export default router;