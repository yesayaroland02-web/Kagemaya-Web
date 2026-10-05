import { getCategories, getEvents, getEventById } from '../controllers/event.controller';

import { Router } from 'express';

const router = Router();

router.get('/', getEvents);
router.get('/categories', getCategories);
router.get('/:id', getEventById);

export default router;