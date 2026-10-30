
import { Router } from 'express';

import {
  createReview,
  getEventReviews,
} from '../controllers/review.controller';

import { authenticateToken } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/role.middleware';

const router = Router();

// GET - Melihat daftar ulasan sebuah event
// Endpoint ini dapat diakses publik
router.get(
  '/events/:id/reviews',
  getEventReviews
);

// POST - Mengirim rating dan ulasan event
// Hanya customer yang sudah login
router.post(
  '/events/:id/reviews',
  authenticateToken,
  authorizeRoles('CUSTOMER'),
  createReview
);

export default router;
