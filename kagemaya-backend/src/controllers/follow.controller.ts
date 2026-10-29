import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { errorResponse, successResponse } from '../utils/response';
import {
  checkFollowStatusService,
  followOrganizerService,
  getOrganizerFollowersService,
  getOrganizerPublicProfileService,
  unfollowOrganizerService,
} from '../services/follow.service';

export const followOrganizer = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const followerId = req.user?.id;
    const { organizerId } = req.params;

    if (!followerId) {
      return errorResponse(res, 'Autentikasi diperlukan', 401);
    }
    if (!organizerId) {
      return errorResponse(res, 'ID Organizer wajib disertakan', 400);
    }

    const result = await followOrganizerService(followerId, organizerId);
    return successResponse(
      res,
      result.alreadyFollowing
        ? 'Anda sudah mengikuti organizer ini'
        : 'Berhasil mengikuti organizer',
      result,
      result.alreadyFollowing ? 200 : 201
    );
  } catch (error: any) {
    const status =
      error.message === 'Organizer tidak ditemukan.'
        ? 404
        : error.message.includes('sendiri')
        ? 400
        : 500;
    return errorResponse(res, error.message || 'Gagal mengikuti organizer', status);
  }
};

export const unfollowOrganizer = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const followerId = req.user?.id;
    const { organizerId } = req.params;

    if (!followerId) {
      return errorResponse(res, 'Autentikasi diperlukan', 401);
    }
    if (!organizerId) {
      return errorResponse(res, 'ID Organizer wajib disertakan', 400);
    }

    const result = await unfollowOrganizerService(followerId, organizerId);
    return successResponse(res, 'Berhasil berhenti mengikuti organizer', result, 200);
  } catch (error: any) {
    const status = error.message === 'Anda belum mengikuti organizer ini.' ? 404 : 400;
    return errorResponse(res, error.message || 'Gagal berhenti mengikuti organizer', status);
  }
};

export const getOrganizerProfile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const authHeader = req.headers['authorization'];
    let currentUserId: string | undefined;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const jwt = require('jsonwebtoken');
        const config = require('../config').default;
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, config.jwtSecret) as any;
        currentUserId = decoded?.id;
      } catch {
        // ignore invalid token for public profile
      }
    }

    const profile = await getOrganizerPublicProfileService(id, currentUserId);
    return successResponse(res, 'Profil organizer berhasil diambil', profile, 200);
  } catch (error: any) {
    const status = error.message === 'Organizer tidak ditemukan' ? 404 : 500;
    return errorResponse(res, error.message || 'Gagal mengambil profil organizer', status);
  }
};

export const checkFollowStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const followerId = req.user?.id;
    const { organizerId } = req.params;

    if (!followerId) {
      return successResponse(res, 'Status follow', { is_following: false, followers_count: 0 }, 200);
    }

    const result = await checkFollowStatusService(followerId, organizerId);
    return successResponse(res, 'Status follow', result, 200);
  } catch (error: any) {
    return errorResponse(res, error.message || 'Gagal memeriksa status follow', 500);
  }
};

export const getMyFollowers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const organizerId = req.user?.id;
    if (!organizerId) {
      return errorResponse(res, 'Autentikasi diperlukan', 401);
    }

    const data = await getOrganizerFollowersService(organizerId);
    return successResponse(res, 'Daftar pengikut berhasil diambil', data, 200);
  } catch (error: any) {
    return errorResponse(res, error.message || 'Gagal mengambil daftar pengikut', 500);
  }
};

export const getOrganizerFollowersById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return errorResponse(res, 'ID Organizer wajib disertakan', 400);
    }

    const data = await getOrganizerFollowersService(id);
    return successResponse(res, 'Daftar pengikut berhasil diambil', data, 200);
  } catch (error: any) {
    return errorResponse(res, error.message || 'Gagal mengambil daftar pengikut', 500);
  }
};
