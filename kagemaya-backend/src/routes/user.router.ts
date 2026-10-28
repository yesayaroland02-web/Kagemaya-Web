import {
  getMyProfile,
  updateMyPassword,
  updateMyProfile,
} from '../controllers/user.controller';

import { Router } from 'express';
import {
  authenticateToken,
} from '../middlewares/auth.middleware';
import {
  authorizeRoles
} from '../middlewares/role.middleware';
import {
  getOrganizerDashboardStats
} from '../controllers/dashboard.controller';
import {
  uploadSingleImage,
} from '../middlewares/upload.middleware';

const router = Router();

// Semua route di bawah membutuhkan token
router.use(authenticateToken);

// ==========================================
// ORGANIZER DASHBOARD STATS: GET /api/me/dashboard/stats
// ==========================================
router.get(
  '/dashboard/stats',
  authorizeRoles('ORGANIZER'),
  getOrganizerDashboardStats
);

// GET /api/me/profile
router.get(
  '/profile',
  getMyProfile
);

// PATCH /api/me/profile
router.patch(
  '/profile',
  uploadSingleImage.single('avatar'),
  updateMyProfile
);

// PATCH /api/me/password
router.patch(
  '/password',
  updateMyPassword
);

export default router;