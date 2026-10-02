import { Response } from 'express';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Helper untuk Response Berhasil
export const successResponse = <T>(
  res: Response,
  message: string,
  data: T | null = null,
  statusCode: number = 200,
  pagination: PaginationMeta | null = null
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    ...(pagination ? { pagination } : {}),
  });
};

// Helper untuk Response Gagal
export const errorResponse = (
  res: Response,
  message: string,
  statusCode: number = 400,
  error: unknown = null
) => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(error !== null && error !== undefined ? { error } : {}),
  });
};