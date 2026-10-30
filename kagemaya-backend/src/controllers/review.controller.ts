
import { Request, Response } from 'express';
import { z } from 'zod';

import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { successResponse, errorResponse } from '../utils/response';

import {
  createReviewService,
  getEventReviewsService,
  ReviewError,
} from '../services/review.service';

// Validasi input rating dan komentar
const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).nullable().optional(),
}).strict();

// Penanganan error Review API
const handleReviewError = (
  error: unknown,
  res: Response
) => {
  if (error instanceof ReviewError) {
    return errorResponse(
      res,
      error.message,
      error.statusCode
    );
  }

  console.error('Review API Error:', error);

  return errorResponse(
    res,
    'Terjadi kesalahan pada server.',
    500
  );
};

// POST /api/events/:id/reviews
export const createReview = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const validation = reviewSchema.safeParse(req.body);

  if (!validation.success) {
    return errorResponse(
      res,
      'Rating harus 1-5 dan komentar maksimal 1000 karakter.',
      400
    );
  }

  if (!req.user) {
    return errorResponse(
      res,
      'Silakan login terlebih dahulu.',
      401
    );
  }

  try {
    const review = await createReviewService(
      req.params.id,
      req.user.id,
      validation.data.rating,
      validation.data.comment
    );

    return successResponse(
      res,
      'Review berhasil dikirim.',
      review,
      201
    );
  } catch (error) {
    return handleReviewError(error, res);
  }
};

// GET /api/events/:id/reviews
export const getEventReviews = async (
  req: Request,
  res: Response
) => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 10);

  if (
    !Number.isInteger(page) ||
    page < 1 ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 50
  ) {
    return errorResponse(
      res,
      'Parameter page atau limit tidak valid.',
      400
    );
  }

  try {
    const result = await getEventReviewsService(
      req.params.id,
      page,
      limit
    );

    return successResponse(
      res,
      'Daftar review berhasil diambil.',
      {
        reviews: result.reviews,
        summary: result.summary,
      },
      200,
      result.pagination
    );
  } catch (error) {
    return handleReviewError(error, res);
  }
};
