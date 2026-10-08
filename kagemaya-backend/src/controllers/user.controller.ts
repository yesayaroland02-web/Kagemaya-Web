import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

import {
  getMyProfileService,
  updateProfileService,
  updatePasswordService,
} from '../services/user.service';

import {
  successResponse,
  errorResponse,
} from '../utils/response';

// ========================================
// GET /me/profile
// ========================================

export const getMyProfile = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user!.id;

    const profile =
      await getMyProfileService(userId);

    return successResponse(
      res,
      'Profil berhasil diambil.',
      profile,
      200
    );
  } catch (error: any) {
    return errorResponse(
      res,
      error.message || 'Gagal mengambil profil.',
      500,
      error
    );
  }
};

// ========================================
// PATCH /me/profile
// ========================================

export const updateMyProfile = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user!.id;

    const name =
      typeof req.body.name === 'string'
        ? req.body.name.trim()
        : undefined;

    const profile_picture = req.file
      ? `/uploads/${req.file.filename}`
      : undefined;

    if (!name && !profile_picture) {
      return errorResponse(
        res,
        'Nama atau foto profil wajib diisi.',
        400
      );
    }

    const updated =
      await updateProfileService(userId, {
        name,
        profile_picture,
      });

    return successResponse(
      res,
      'Profil berhasil diperbarui.',
      updated,
      200
    );
  } catch (error: any) {
    return errorResponse(
      res,
      error.message || 'Gagal memperbarui profil.',
      400,
      error
    );
  }
};

// ========================================
// PATCH /me/password
// ========================================

export const updateMyPassword = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user!.id;

    const {
      current_password,
      new_password,
    } = req.body;

    if (
      !current_password ||
      !new_password
    ) {
      return errorResponse(
        res,
        'current_password dan new_password wajib diisi.',
        400
      );
    }

    if (new_password.length < 6) {
      return errorResponse(
        res,
        'Password baru minimal 6 karakter.',
        400
      );
    }

    const result =
      await updatePasswordService(
        userId,
        {
          current_password,
          new_password,
        }
      );

    return successResponse(
      res,
      result.message,
      null,
      200
    );
  } catch (error: any) {
    const message =
      error.message ||
      'Gagal memperbarui password.';

    const status =
      message.includes(
        'tidak sesuai'
      )
        ? 401
        : 400;

    return errorResponse(
      res,
      message,
      status,
      error
    );
  }
};