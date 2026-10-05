import { Router } from 'express';
import { 
  getCategories, 
  getEvents, 
  getEventById, 
  checkTicketStock 
} from '../controllers/event.controller';

const router = Router();

// Endpoint Kategori
router.get('/categories', getCategories);

// Endpoint Stok Tiket
router.get('/:id/stock', checkTicketStock);

// Endpoint Detail Event
router.get('/:id', getEventById);

// Endpoint List Event dengan Filter
router.get('/', getEvents);

export default router;