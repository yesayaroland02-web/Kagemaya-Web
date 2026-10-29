"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const transaction_controller_1 = require("../controllers/transaction.controller");
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const role_middleware_1 = require("../middlewares/role.middleware"); // <-- Pastikan ini diimpor
const upload_middleware_1 = require("../middlewares/upload.middleware");
const router = (0, express_1.Router)();
// Semua rute transaksi membutuhkan autentikasi
router.use(auth_middleware_1.authenticateToken);
// =========================================================
// RUTE KHUSUS ORGANIZER (Wajib authorizeRoles 'ORGANIZER')
// =========================================================
// 1. Ambil daftar transaksi event masuk milik organizer
router.get('/organizer/incoming-transactions', (0, role_middleware_1.authorizeRoles)('ORGANIZER'), transaction_controller_1.getOrganizerTransactions);
// 2. Terima Pembayaran (Accept)
router.patch('/:id/accept', (0, role_middleware_1.authorizeRoles)('ORGANIZER'), transaction_controller_1.acceptTransaction);
// 3. Tolak Pembayaran (Reject dengan alasan)
router.patch('/:id/reject', (0, role_middleware_1.authorizeRoles)('ORGANIZER'), transaction_controller_1.rejectTransaction);
// =========================================================
// RUTE TRANSAKSI UMUM & CUSTOMER
// =========================================================
router.post('/calculate', transaction_controller_1.calculateCheckout);
router.post('/', transaction_controller_1.createTransaction);
router.get('/my-transactions', transaction_controller_1.getUserTransactions);
router.get('/:id', transaction_controller_1.getTransactionById);
router.post('/:id/payment-proof', upload_middleware_1.uploadSingleImage.single('payment_proof'), transaction_controller_1.uploadPaymentProof);
router.post('/:id/cancel', transaction_controller_1.cancelTransaction);
exports.default = router;
