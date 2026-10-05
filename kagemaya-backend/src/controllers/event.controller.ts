import { Request, Response } from 'express';
import { errorResponse, successResponse } from '../utils/response';
import { getCategoriesService, getEventsService, getEventByIdService } from '../services/event.service';

export const getEvents = async (req: Request, res: Response) => {
  try {
    const { search, category, city, page, limit } = req.query;

    const result = await getEventsService({
      search: search as string,
      category: category as string,
      city: city as string,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 8,
    });

    return successResponse(
      res,
      'Daftar event berhasil diambil',
      result.events,
      200,
      result.pagination
    );
  } catch (error: any) {
    return errorResponse(res, error.message || 'Gagal memuat event', 500, error);
  }
};

export const getCategories = async (_req: Request, res: Response) => {
  try {
    const categories = await getCategoriesService();
    return successResponse(res, 'Daftar kategori berhasil diambil', categories, 200);
  } catch (error: any) {
    return errorResponse(res, error.message || 'Gagal memuat kategori', 500, error);
  }
};

export const getEventById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const event = await getEventByIdService(id);
    return successResponse(res, 'Detail event berhasil diambil', event, 200);
  } catch (error: any) {
    const statusCode = error.message === 'Event tidak ditemukan' ? 404 : 500;
    return errorResponse(res, error.message || 'Gagal memuat detail event', statusCode, error);
  }
};