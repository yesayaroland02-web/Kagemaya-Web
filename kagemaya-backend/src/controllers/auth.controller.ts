import { Request, Response } from 'express';
import { successResponse, errorResponse } from '../utils/response';

export const login = async (req: Request, res: Response) => {
  try {
    const user = { id: '1', email: 'budi@gmail.com' };
    const token = 'jwt_token_here';

    // Mengembalikan response sukses standar
    return successResponse(res, 'Login berhasil', { user, token }, 200);
  } catch (error) {
    // Mengembalikan response error standar
    return errorResponse(res, 'Email atau password salah', 401, error);
  }
};