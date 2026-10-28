import {
  acceptTransactionService,
  calculateCheckoutPriceService,
  cancelTransactionService,
  createTransactionService,
  getOrganizerTransactionsService,
  getTransactionByIdService,
  getUserTransactionsService,
  rejectTransactionService,
  uploadPaymentProofService
} from '../services/transaction.service';
import { errorResponse, successResponse } from '../utils/response';

import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { Response } from 'express';

// =========================================================
// 1. POST /api/transactions/calculate (Calculation Engine Preview)
// =========================================================
export const calculateCheckout = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user!.id;
    const { event_id, items, voucher_code, coupon_id, points_used } = req.body;

    if (!event_id || !items || !Array.isArray(items)) {
      return errorResponse(res, 'event_id dan list items wajib diisi.', 400);
    }

    const calculation = await calculateCheckoutPriceService(userId, {
      event_id,
      items,
      voucher_code,
      coupon_id,
      points_used: Number(points_used || 0),
    });

    return successResponse(
      res,
      'Kalkulasi harga berhasil dihitung.',
      calculation,
      200
    );
  } catch (error: any) {
    console.error('Calculate checkout controller error:', error.message);
    return errorResponse(
      res,
      error.message || 'Gagal menghitung kalkulasi harga.',
      400,
      error
    );
  }
};

// =========================================================
// 2. POST /api/transactions (Create Transaction with Lock)
// =========================================================
export const createTransaction = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user!.id;
    const { event_id, items, voucher_code, coupon_id, points_used } = req.body;

    if (!event_id || !items || !Array.isArray(items) || items.length === 0) {
      return errorResponse(res, 'event_id dan list items tiket wajib disertakan.', 400);
    }

    const transaction = await createTransactionService(userId, {
      event_id,
      items,
      voucher_code,
      coupon_id,
      points_used: Number(points_used || 0),
    });

    return successResponse(
      res,
      'Pemesanan tiket berhasil dibuat. Silakan lakukan pembayaran dalam 2 jam.',
      transaction,
      201
    );
  } catch (error: any) {
    console.error('Create transaction controller error:', error.message);
    return errorResponse(
      res,
      error.message || 'Gagal membuat transaksi.',
      400,
      error
    );
  }
};

// =========================================================
// 3. GET /api/transactions/:id
// =========================================================
export const getTransactionById = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!id) {
      return errorResponse(res, 'ID Transaksi wajib diisi.', 400);
    }

    const transaction = await getTransactionByIdService(id, userId);

    return successResponse(res, 'Detail transaksi berhasil diambil.', transaction, 200);
  } catch (error: any) {
    console.error('Get transaction controller error:', error.message);
    return errorResponse(
      res,
      error.message || 'Transaksi tidak ditemukan.',
      404,
      error
    );
  }
};

// =========================================================
// 4. GET /api/transactions/my-transactions (Customer History)
// =========================================================
export const getUserTransactions = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user!.id;
    const { status, page = 1, limit = 10 } = req.query;

    const result = await getUserTransactionsService(
      userId,
      status as string,
      Number(page),
      Number(limit)
    );

    return successResponse(
      res,
      'Daftar transaksi berhasil diambil.',
      result.transactions,
      200,
      result.pagination
    );
  } catch (error: any) {
    console.error('Get user transactions controller error:', error.message);
    return errorResponse(
      res,
      error.message || 'Gagal mengambil riwayat transaksi.',
      500,
      error
    );
  }
};

// =========================================================
// 5. POST /api/transactions/:id/payment-proof (Upload Bukti Bayar)
// =========================================================
export const uploadPaymentProof = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    if (!id) {
      return errorResponse(res, 'ID Transaksi wajib diisi.', 400);
    }

    if (!req.file) {
      return errorResponse(res, 'File bukti pembayaran wajib diunggah (JPG, PNG, atau WEBP).', 400);
    }

    const updatedTransaction = await uploadPaymentProofService(
      id,
      userId,
      req.file.buffer
    );

    return successResponse(
      res,
      'Bukti transfer berhasil diunggah. Menunggu verifikasi dari admin.',
      updatedTransaction,
      200
    );
  } catch (error: any) {
    console.error('Upload payment proof controller error:', error.message);
    return errorResponse(
      res,
      error.message || 'Gagal mengunggah bukti pembayaran.',
      400,
      error
    );
  }
};

// =========================================================
// 6. POST /api/transactions/:id/cancel (Cancel & Rollback)
// =========================================================
export const cancelTransaction = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    if (!id) {
      return errorResponse(res, 'ID Transaksi wajib diisi.', 400);
    }

    const canceled = await cancelTransactionService(id, userId);

    return successResponse(
      res,
      'Transaksi berhasil dibatalkan dan kuota tiket telah dikembalikan.',
      canceled,
      200
    );
  } catch (error: any) {
    console.error('Cancel transaction controller error:', error.message);
    return errorResponse(
      res,
      error.message || 'Gagal membatalkan transaksi.',
      400,
      error
    );
  }
};

// =========================================================
// 7. GET /api/transactions/organizer/incoming-transactions
// =========================================================
export const getOrganizerTransactions = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const organizerId = req.user!.id;
    const { status, page, limit } = req.query;
    const result = await getOrganizerTransactionsService(
      organizerId,
      status as string,
      page ? parseInt(page as string, 10) : 1,
      limit ? parseInt(limit as string, 10) : 20
    );
    return successResponse(
      res,
      'Daftar transaksi masuk organizer berhasil dimuat.',
      result.transactions,
      200,
      result.pagination
    );
  } catch (error: any) {
    console.error('Error getOrganizerTransactions:', error);
    return errorResponse(
      res,
      error.message || 'Gagal memuat transaksi organizer.',
      500,
      error
    );
  }
};
// =========================================================
// 8. PATCH /api/transactions/:id/accept
// =========================================================
export const acceptTransaction = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const organizerId = req.user!.id;
    const { id } = req.params;
    const updated = await acceptTransactionService(id, organizerId);
    return successResponse(
      res,
      'Pembayaran transaksi berhasil dikonfirmasi. Tiket resmi telah diterbitkan.',
      updated,
      200
    );
  } catch (error: any) {
    console.error('Error acceptTransaction:', error);
    return errorResponse(
      res,
      error.message || 'Gagal menerima transaksi.',
      400,
      error
    );
  }
};
// =========================================================
// 9. PATCH /api/transactions/:id/reject
// =========================================================
export const rejectTransaction = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const organizerId = req.user!.id;
    const { id } = req.params;
    const { reason } = req.body;
    if (!reason || !reason.trim()) {
      return errorResponse(res, 'Alasan penolakan bukti bayar wajib disertakan.', 400);
    }
    const updated = await rejectTransactionService(id, organizerId, reason);
    return successResponse(
      res,
      'Bukti bayar berhasil ditolak. Kuota tiket dan poin customer telah di-rollback.',
      updated,
      200
    );
  } catch (error: any) {
    console.error('Error rejectTransaction:', error);
    return errorResponse(
      res,
      error.message || 'Gagal menolak transaksi.',
      400,
      error
    );
  }
};