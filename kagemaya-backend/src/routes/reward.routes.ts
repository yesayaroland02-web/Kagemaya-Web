import { Router } from 'express';

import {
  authenticateToken,
} from '../middlewares/auth.middleware';

import {
  getMyPoints,
  getMyCoupons,
} from '../controllers/reward.controller';

const router = Router();

// Semua endpoint rewards membutuhkan login
router.use(authenticateToken);

// GET /api/me/points
router.get(
  '/points',
  getMyPoints
);

// GET /api/me/coupons
router.get(
  '/coupons',
  getMyCoupons
);

export default router;