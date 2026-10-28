import {
  acceptTransaction,
  calculateCheckout,
  cancelTransaction,
  createTransaction,
  getOrganizerTransactions,
  getTransactionById,
  getUserTransactions,
  rejectTransaction,
  uploadPaymentProof
} from '../controllers/transaction.controller';

import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/role.middleware'; // <-- Pastikan ini diimpor
import { uploadSingleImage } from '../middlewares/upload.middleware';

const router = Router();

// Semua rute transaksi membutuhkan autentikasi
router.use(authenticateToken);

// =========================================================
// RUTE KHUSUS ORGANIZER (Wajib authorizeRoles 'ORGANIZER')
// =========================================================
// 1. Ambil daftar transaksi event masuk milik organizer
router.get(
  '/organizer/incoming-transactions',
  authorizeRoles('ORGANIZER'),
  getOrganizerTransactions
);

// 2. Terima Pembayaran (Accept)
router.patch(
  '/:id/accept',
  authorizeRoles('ORGANIZER'),
  acceptTransaction
);

// 3. Tolak Pembayaran (Reject dengan alasan)
router.patch(
  '/:id/reject',
  authorizeRoles('ORGANIZER'),
  rejectTransaction
);

// =========================================================
// RUTE TRANSAKSI UMUM & CUSTOMER
// =========================================================
router.post('/calculate', calculateCheckout);
router.post('/', createTransaction);
router.get('/my-transactions', getUserTransactions);
router.get('/:id', getTransactionById);
router.post(
  '/:id/payment-proof',
  uploadSingleImage.single('payment_proof'),
  uploadPaymentProof
);
router.post('/:id/cancel', cancelTransaction);

export default router;