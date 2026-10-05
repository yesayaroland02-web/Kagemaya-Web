import { Router } from 'express';
import { getCategories, getEvents } from '../controllers/event.controller';

const router = Router();

// Endpoint Kategori (Wajib di atas '/')
router.get('/categories', getCategories);

// Endpoint List Event dengan Filter
router.get('/', getEvents);

export default router;