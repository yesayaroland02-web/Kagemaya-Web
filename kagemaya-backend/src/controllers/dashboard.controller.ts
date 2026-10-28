import { errorResponse, successResponse } from '../utils/response';

import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { Response } from 'express';
import { getOrganizerDashboardStatsService } from '../services/dashboard.service';

export const getOrganizerDashboardStats = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const organizerId = req.user!.id;
    const days = req.query.days ? parseInt(req.query.days as string, 10) : 30;

    const stats = await getOrganizerDashboardStatsService(organizerId, days);

    return successResponse(
      res,
      'Statistik dashboard organizer berhasil dimuat.',
      stats,
      200
    );
  } catch (error: any) {
    console.error('Error getOrganizerDashboardStats:', error);
    return errorResponse(
      res,
      error.message || 'Gagal mengambil statistik dashboard organizer.',
      500,
      error
    );
  }
};