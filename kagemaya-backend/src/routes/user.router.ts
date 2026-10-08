import { Router } from 'express';

import {
  authenticateToken,
} from '../middlewares/auth.middleware';

import {
  uploadSingleImage,
} from '../middlewares/upload.middleware';

import {
  getMyProfile,
  updateMyProfile,
  updateMyPassword,
} from '../controllers/user.controller';

const router = Router();

// Semua route di bawah membutuhkan token
router.use(authenticateToken);

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