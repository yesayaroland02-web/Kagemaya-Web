import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware';
import { uploadSingleImage } from '../middlewares/upload.middleware';
import {
  calculateCheckout,
  createTransaction,
  getTransactionById,
  getUserTransactions,
  uploadPaymentProof,
  cancelTransaction,
} from '../controllers/transaction.controller';

const router = Router();

// Semua rute transaksi membutuhkan autentikasi
router.use(authenticateToken);

// 1. Kalkulasi Checkout (Dry-run / Preview) - Day 10 & 11
router.post('/calculate', calculateCheckout);

// 2. Buat Transaksi Baru (Locking kuota + simpan transaksi) - Day 10 & 11
router.post('/', createTransaction);

// 3. Riwayat Transaksi Pengguna (Tab status filter) - Day 13
router.get('/my-transactions', getUserTransactions);

// 4. Detail Transaksi Berdasarkan ID - Day 10 & 12
router.get('/:id', getTransactionById);

// 5. Upload Bukti Transfer (Multer + Cloudinary) - Day 12
router.post(
  '/:id/payment-proof',
  uploadSingleImage.single('payment_proof'),
  uploadPaymentProof
);

// 6. Batalkan Transaksi oleh Pengguna (Rollback kuota/poin/voucher) - Day 13 & 14
router.post('/:id/cancel', cancelTransaction);

export default router;
