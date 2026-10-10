import { Router } from 'express';
import { 
  getCategories, 
  getEvents, 
  getEventById, 
  checkTicketStock 
} from '../controllers/event.controller';

const router = Router();

// 1. Route Statis & Root dipasang lebih dulu
router.get('/categories', getCategories);
router.get('/tickets/:ticketTypeId/availability', checkTicketStock);
router.get('/:ticketTypeId/stock', checkTicketStock);
router.get('/', getEvents);

// 2. Route Dinamis (Parametric) dipasang di bawah
router.get('/:id', getEventById);

export default router;