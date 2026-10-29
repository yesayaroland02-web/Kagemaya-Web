import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { errorResponse, successResponse } from '../utils/response';
import {
  addWishlistService,
  checkWishlistStatusService,
  getUserWishlistsService,
  removeWishlistService,
} from '../services/wishlist.service';

export const addWishlist = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const customerId = req.user?.id;
    const { eventId } = req.params;

    if (!customerId) {
      return errorResponse(res, 'Autentikasi diperlukan', 401);
    }
    if (!eventId) {
      return errorResponse(res, 'ID Event wajib disertakan', 400);
    }

    const result = await addWishlistService(customerId, eventId);
    return successResponse(
      res,
      result.alreadyExists
        ? 'Event sudah ada di dalam wishlist Anda'
        : 'Event berhasil ditambahkan ke wishlist',
      result.wishlist,
      result.alreadyExists ? 200 : 201
    );
  } catch (error: any) {
    const status = error.message === 'Event tidak ditemukan' ? 404 : 400;
    return errorResponse(res, error.message || 'Gagal menambahkan wishlist', status);
  }
};

export const removeWishlist = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const customerId = req.user?.id;
    const { eventId } = req.params;

    if (!customerId) {
      return errorResponse(res, 'Autentikasi diperlukan', 401);
    }
    if (!eventId) {
      return errorResponse(res, 'ID Event wajib disertakan', 400);
    }

    await removeWishlistService(customerId, eventId);
    return successResponse(res, 'Event berhasil dihapus dari wishlist', null, 200);
  } catch (error: any) {
    const status = error.message === 'Event belum ada di dalam wishlist Anda.' ? 404 : 400;
    return errorResponse(res, error.message || 'Gagal menghapus wishlist', status);
  }
};

export const getMyWishlists = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const customerId = req.user?.id;
    if (!customerId) {
      return errorResponse(res, 'Autentikasi diperlukan', 401);
    }

    const wishlists = await getUserWishlistsService(customerId);
    return successResponse(res, 'Daftar wishlist berhasil diambil', wishlists, 200);
  } catch (error: any) {
    return errorResponse(res, error.message || 'Gagal mengambil wishlist', 500);
  }
};

export const checkWishlistStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const customerId = req.user?.id;
    const { eventId } = req.params;

    if (!customerId) {
      return successResponse(res, 'Status wishlist', { is_wishlisted: false }, 200);
    }

    const result = await checkWishlistStatusService(customerId, eventId);
    return successResponse(res, 'Status wishlist', result, 200);
  } catch (error: any) {
    return errorResponse(res, error.message || 'Gagal memeriksa status wishlist', 500);
  }
};
