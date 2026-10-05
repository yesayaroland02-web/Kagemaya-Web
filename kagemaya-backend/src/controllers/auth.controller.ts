import { Request, Response } from 'express';
import { registerUser, loginUser } from '../services/auth.service';
import { successResponse, errorResponse } from '../utils/response';

export const register = async (req: Request, res: Response) => {
  try {
    const result = await registerUser(req.body);
    return successResponse(res, 'Registrasi berhasil', result, 201);
  } catch (error: any) {
    return errorResponse(res, error.message || 'Gagal registrasi', 400, error);
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const result = await loginUser(req.body);
    return successResponse(res, 'Login berhasil', result, 200);
  } catch (error: any) {
    return errorResponse(res, error.message || 'Gagal login', 400, error);
  }
};