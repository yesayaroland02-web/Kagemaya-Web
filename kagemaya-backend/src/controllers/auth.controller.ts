import { Request, Response } from 'express';
import { registerUser, loginUser } from '../services/auth.service';
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