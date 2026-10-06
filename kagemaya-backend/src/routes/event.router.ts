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
router.get('/', getEvents);

// 2. Route Dinamis (Parametric) dipasang di bawah
router.get('/:id/stock', checkTicketStock);
router.get('/:id', getEventById);

export default router;