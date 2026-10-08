import { Response } from 'express';

import { AuthenticatedRequest } from '../middlewares/auth.middleware';

import {
  getMyPointsService,
  getMyCouponsService,
} from '../services/reward.service';

import {
  successResponse,
  errorResponse,
} from '../utils/response';

// =========================================================
// GET /api/me/points
// =========================================================

export const getMyPoints = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user!.id;

    const data =
      await getMyPointsService(userId);

    return successResponse(
      res,
      'Data poin berhasil diambil.',
      data,
      200
    );
  } catch (error: any) {
    console.error(
      'Get my points error:',
      error
    );

    return errorResponse(
      res,
      error.message ||
        'Gagal mengambil data poin.',
      500,
      error
    );
  }
};

// =========================================================
// GET /api/me/coupons
// =========================================================

export const getMyCoupons = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user!.id;

    const data =
      await getMyCouponsService(userId);

    return successResponse(
      res,
      'Data kupon berhasil diambil.',
      data,
      200
    );
  } catch (error: any) {
    console.error(
      'Get my coupons error:',
      error
    );

    return errorResponse(
      res,
      error.message ||
        'Gagal mengambil data kupon.',
      500,
      error
    );
  }
};