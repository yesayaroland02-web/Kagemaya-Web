import { Request, Response } from 'express';
import { errorResponse, successResponse } from '../utils/response';
import { getCategoriesService, getEventsService } from '../services/event.service';

export const getEvents = async (req: Request, res: Response) => {
  try {
    // 1. Destructure semua parameter query dari frontend
    const { search, category, city, date, price, sort, page, limit } = req.query;

    // 2. Teruskan semua parameter ke Service
    const result = await getEventsService({
      search: search as string,
      category: category as string,
      city: city as string,
      date: date as string,
      price: price as string,
      sort: sort as string,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 6,
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