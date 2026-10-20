import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import {
  calculateCheckoutPriceService,
  createTransactionService,
  getTransactionByIdService,
  getUserTransactionsService,
  uploadPaymentProofService,
  cancelTransactionService,
} from '../services/transaction.service';
import { successResponse, errorResponse } from '../utils/response';

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
