import { Router } from 'express';
import { 
  getCategories, 
  getEvents, 
  getEventById, 
  checkTicketStock,
  createEvent,
  updateEvent,
  createEventVoucher,
  getEventVouchers,
  getMyOrganizerEvents
} from '../controllers/event.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/role.middleware';
import { uploadSingleImage } from '../middlewares/upload.middleware';

const router = Router();

// 1. Route Statis & Root dipasang lebih dulu
router.get('/categories', getCategories);
router.get('/tickets/:ticketTypeId/availability', checkTicketStock);
router.get('/:ticketTypeId/stock', checkTicketStock);
router.get('/', getEvents);

// 2. Organizer Route: Buat Event Baru
router.post(
  '/',
  authenticateToken,
  authorizeRoles('ORGANIZER'),
  uploadSingleImage.single('banner'),
  createEvent
);

// 3. Organizer Routes: Edit Event & Manajemen Voucher
router.patch(
  '/:id',
  authenticateToken,
  authorizeRoles('ORGANIZER'),
  uploadSingleImage.single('banner'),
  updateEvent
);

router.post(
  '/:id/vouchers',
  authenticateToken,
  authorizeRoles('ORGANIZER'),
  createEventVoucher
);

router.get(
  '/:id/vouchers',
  authenticateToken,
  authorizeRoles('ORGANIZER'),
  getEventVouchers
);

// Organizer Route: Ambil seluruh event milik EO yang sedang login
router.get(
  '/organizer/my-events',
  authenticateToken,
  authorizeRoles('ORGANIZER'),
  getMyOrganizerEvents
);

// 4. Route Dinamis (Parametric) dipasang di bawah
router.get('/:id', getEventById);

export default router;