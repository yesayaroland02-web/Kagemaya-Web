"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rejectTransaction = exports.acceptTransaction = exports.getOrganizerTransactions = exports.cancelTransaction = exports.uploadPaymentProof = exports.getUserTransactions = exports.getTransactionById = exports.createTransaction = exports.calculateCheckout = void 0;
const transaction_service_1 = require("../services/transaction.service");
const response_1 = require("../utils/response");
// =========================================================
// 1. POST /api/transactions/calculate (Calculation Engine Preview)
// =========================================================
const calculateCheckout = async (req, res) => {
    try {
        const userId = req.user.id;
        const { event_id, items, voucher_code, coupon_id, points_used } = req.body;
        if (!event_id || !items || !Array.isArray(items)) {
            return (0, response_1.errorResponse)(res, 'event_id dan list items wajib diisi.', 400);
        }
        const calculation = await (0, transaction_service_1.calculateCheckoutPriceService)(userId, {
            event_id,
            items,
            voucher_code,
            coupon_id,
            points_used: Number(points_used || 0),
        });
        return (0, response_1.successResponse)(res, 'Kalkulasi harga berhasil dihitung.', calculation, 200);
    }
    catch (error) {
        console.error('Calculate checkout controller error:', error.message);
        return (0, response_1.errorResponse)(res, error.message || 'Gagal menghitung kalkulasi harga.', 400, error);
    }
};
exports.calculateCheckout = calculateCheckout;
// =========================================================
// 2. POST /api/transactions (Create Transaction with Lock)
// =========================================================
const createTransaction = async (req, res) => {
    try {
        const userId = req.user.id;
        const { event_id, items, voucher_code, coupon_id, points_used } = req.body;
        if (!event_id || !items || !Array.isArray(items) || items.length === 0) {
            return (0, response_1.errorResponse)(res, 'event_id dan list items tiket wajib disertakan.', 400);
        }
        const transaction = await (0, transaction_service_1.createTransactionService)(userId, {
            event_id,
            items,
            voucher_code,
            coupon_id,
            points_used: Number(points_used || 0),
        });
        return (0, response_1.successResponse)(res, 'Pemesanan tiket berhasil dibuat. Silakan lakukan pembayaran dalam 2 jam.', transaction, 201);
    }
    catch (error) {
        console.error('Create transaction controller error:', error.message);
        return (0, response_1.errorResponse)(res, error.message || 'Gagal membuat transaksi.', 400, error);
    }
};
exports.createTransaction = createTransaction;
// =========================================================
// 3. GET /api/transactions/:id
// =========================================================
const getTransactionById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        if (!id) {
            return (0, response_1.errorResponse)(res, 'ID Transaksi wajib diisi.', 400);
        }
        const transaction = await (0, transaction_service_1.getTransactionByIdService)(id, userId);
        return (0, response_1.successResponse)(res, 'Detail transaksi berhasil diambil.', transaction, 200);
    }
    catch (error) {
        console.error('Get transaction controller error:', error.message);
        return (0, response_1.errorResponse)(res, error.message || 'Transaksi tidak ditemukan.', 404, error);
    }
};
exports.getTransactionById = getTransactionById;
// =========================================================
// 4. GET /api/transactions/my-transactions (Customer History)
// =========================================================
const getUserTransactions = async (req, res) => {
    try {
        const userId = req.user.id;
        const { status, page = 1, limit = 10 } = req.query;
        const result = await (0, transaction_service_1.getUserTransactionsService)(userId, status, Number(page), Number(limit));
        return (0, response_1.successResponse)(res, 'Daftar transaksi berhasil diambil.', result.transactions, 200, result.pagination);
    }
    catch (error) {
        console.error('Get user transactions controller error:', error.message);
        return (0, response_1.errorResponse)(res, error.message || 'Gagal mengambil riwayat transaksi.', 500, error);
    }
};
exports.getUserTransactions = getUserTransactions;
// =========================================================
// 5. POST /api/transactions/:id/payment-proof (Upload Bukti Bayar)
// =========================================================
const uploadPaymentProof = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        if (!id) {
            return (0, response_1.errorResponse)(res, 'ID Transaksi wajib diisi.', 400);
        }
        if (!req.file) {
            return (0, response_1.errorResponse)(res, 'File bukti pembayaran wajib diunggah (JPG, PNG, atau WEBP).', 400);
        }
        const updatedTransaction = await (0, transaction_service_1.uploadPaymentProofService)(id, userId, req.file.buffer);
        return (0, response_1.successResponse)(res, 'Bukti transfer berhasil diunggah. Menunggu verifikasi dari admin.', updatedTransaction, 200);
    }
    catch (error) {
        console.error('Upload payment proof controller error:', error.message);
        return (0, response_1.errorResponse)(res, error.message || 'Gagal mengunggah bukti pembayaran.', 400, error);
    }
};
exports.uploadPaymentProof = uploadPaymentProof;
// =========================================================
// 6. POST /api/transactions/:id/cancel (Cancel & Rollback)
// =========================================================
const cancelTransaction = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        if (!id) {
            return (0, response_1.errorResponse)(res, 'ID Transaksi wajib diisi.', 400);
        }
        const canceled = await (0, transaction_service_1.cancelTransactionService)(id, userId);
        return (0, response_1.successResponse)(res, 'Transaksi berhasil dibatalkan dan kuota tiket telah dikembalikan.', canceled, 200);
    }
    catch (error) {
        console.error('Cancel transaction controller error:', error.message);
        return (0, response_1.errorResponse)(res, error.message || 'Gagal membatalkan transaksi.', 400, error);
    }
};
exports.cancelTransaction = cancelTransaction;
// =========================================================
// 7. GET /api/transactions/organizer/incoming-transactions
// =========================================================
const getOrganizerTransactions = async (req, res) => {
    try {
        const organizerId = req.user.id;
        const { status, page, limit } = req.query;
        const result = await (0, transaction_service_1.getOrganizerTransactionsService)(organizerId, status, page ? parseInt(page, 10) : 1, limit ? parseInt(limit, 10) : 20);
        return (0, response_1.successResponse)(res, 'Daftar transaksi masuk organizer berhasil dimuat.', result.transactions, 200, result.pagination);
    }
    catch (error) {
        console.error('Error getOrganizerTransactions:', error);
        return (0, response_1.errorResponse)(res, error.message || 'Gagal memuat transaksi organizer.', 500, error);
    }
};
exports.getOrganizerTransactions = getOrganizerTransactions;
// =========================================================
// 8. PATCH /api/transactions/:id/accept
// =========================================================
const acceptTransaction = async (req, res) => {
    try {
        const organizerId = req.user.id;
        const { id } = req.params;
        const updated = await (0, transaction_service_1.acceptTransactionService)(id, organizerId);
        return (0, response_1.successResponse)(res, 'Pembayaran transaksi berhasil dikonfirmasi. Tiket resmi telah diterbitkan.', updated, 200);
    }
    catch (error) {
        console.error('Error acceptTransaction:', error);
        return (0, response_1.errorResponse)(res, error.message || 'Gagal menerima transaksi.', 400, error);
    }
};
exports.acceptTransaction = acceptTransaction;
// =========================================================
// 9. PATCH /api/transactions/:id/reject
// =========================================================
const rejectTransaction = async (req, res) => {
    try {
        const organizerId = req.user.id;
        const { id } = req.params;
        const { reason } = req.body;
        if (!reason || !reason.trim()) {
            return (0, response_1.errorResponse)(res, 'Alasan penolakan bukti bayar wajib disertakan.', 400);
        }
        const updated = await (0, transaction_service_1.rejectTransactionService)(id, organizerId, reason);
        return (0, response_1.successResponse)(res, 'Bukti bayar berhasil ditolak. Kuota tiket dan poin customer telah di-rollback.', updated, 200);
    }
    catch (error) {
        console.error('Error rejectTransaction:', error);
        return (0, response_1.errorResponse)(res, error.message || 'Gagal menolak transaksi.', 400, error);
    }
};
exports.rejectTransaction = rejectTransaction;
