
import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';

import {
  register,
  login,
  forgotPassword,
  resetPassword,
} from '../controllers/auth.controller';

const router = Router();

// FTRIN-002 - Rate Limiting Forgot Password
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    message:
      'Terlalu banyak permintaan reset password. Silakan coba lagi dalam 15 menit.',
  },
});

// Existing Authentication Routes
router.post('/register', register);
router.post('/login', login);

// FTRIN-002 - Forgot & Reset Password
router.post(
  '/forgot-password',
  forgotPasswordLimiter,
  forgotPassword
);

router.post('/reset-password', resetPassword);

export default router;
