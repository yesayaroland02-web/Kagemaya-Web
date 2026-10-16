import { Request, Response } from 'express';
import {
  registerUser,
  loginUser,
  forgotPasswordUser,
  resetPasswordUser,
} from '../services/auth.service';
import { successResponse, errorResponse } from '../utils/response';
import { ZodError } from 'zod';

export const register = async (req: Request, res: Response) => {
  try {
    const result = await registerUser(req.body);
    return successResponse(res, 'Registrasi berhasil', result, 201);
  } catch (error: any) {
    if (error instanceof ZodError) {
      const firstMessage = error.errors[0]?.message || 'Format input tidak valid';
      return errorResponse(res, firstMessage, 400, error.errors);
    }
    return errorResponse(res, error.message || 'Gagal registrasi', 400, error);
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const result = await loginUser(req.body);
    return successResponse(res, 'Login berhasil', result, 200);
  } catch (error: any) {
    if (error instanceof ZodError) {
      const firstMessage = error.errors[0]?.message || 'Format input tidak valid';
      return errorResponse(res, firstMessage, 400, error.errors);
    }
    return errorResponse(res, error.message || 'Gagal login', 400, error);
  }
};

/**
 * FTRIN-002 - Forgot Password Controller
 */
export const forgotPassword = async (
  req: Request,
  res: Response
) => {
  const message =
    'Jika email terdaftar, tautan reset password akan dikirim.';

  try {
    await forgotPasswordUser(req.body);

    return successResponse(res, message, null, 200);
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      const firstMessage =
        error.errors[0]?.message || 'Format input tidak valid';

      return errorResponse(
        res,
        firstMessage,
        400,
        error.errors
      );
    }

    // Respons tetap seragam agar keberadaan akun
    // tidak dapat ditebak dari hasil permintaan.
    console.error(
      'Forgot password processing failed:',
      error instanceof Error ? error.name : 'UnknownError'
    );

    return successResponse(res, message, null, 200);
  }
};

/**
 * FTRIN-002 - Reset Password Controller
 */
export const resetPassword = async (
  req: Request,
  res: Response
) => {
  try {
    const result = await resetPasswordUser(req.body);

    return successResponse(
      res,
      result.message,
      null,
      200
    );
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      const firstMessage =
        error.errors[0]?.message || 'Format input tidak valid';

      return errorResponse(
        res,
        firstMessage,
        400,
        error.errors
      );
    }

    if (
      error instanceof Error &&
      error.message.startsWith('Token reset')
    ) {
      return errorResponse(res, error.message, 400);
    }

    console.error(
      'Reset password processing failed:',
      error instanceof Error ? error.name : 'UnknownError'
    );

    return errorResponse(
      res,
      'Terjadi kesalahan saat mengubah password.',
      500
    );
  }
};
