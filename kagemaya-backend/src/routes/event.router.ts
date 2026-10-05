import { checkTicketStock, getCategories, getEventById, getEvents } from '../controllers/event.controller';

import { Router } from 'express';

const router = Router();

router.get('/', getEvents);
router.get('/categories', getCategories);
router.get('/tickets/:ticketTypeId/availability', checkTicketStock);
router.get('/:id', getEventById);

export default router;