import { Request, Response } from 'express';
import { errorResponse, successResponse } from '../utils/response';
import { 
  getCategoriesService, 
  getEventByIdService, 
  getEventsService, 
  validateTicketStockService,
  createEventService,
  updateEventService,
  createEventVoucherService,
  getEventVouchersService
} from '../services/event.service';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

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

export const checkTicketStock = async (req: Request, res: Response) => {
  try {
    const ticketTypeId = req.params.ticketTypeId || req.params.id;
    const qty = req.query.qty ? Number(req.query.qty) : 1;
    const result = await validateTicketStockService(ticketTypeId, qty);
    if (!result.is_available) {
      return errorResponse(res, result.message, 400, result);
    }
    return successResponse(res, result.message, result, 200);
  } catch (error: any) {
    return errorResponse(res, error.message || 'Gagal memvalidasi kuota tiket', 500, error);
  }
};

export const createEvent = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return errorResponse(res, 'Autentikasi diperlukan. Silakan login sebagai Organizer.', 401);
    }

    const {
      title,
      category_id,
      city,
      location,
      description,
      start_date,
      end_date,
      tickets,
    } = req.body;

    if (!title || !category_id || !city || !location || !description || !start_date || !end_date) {
      return errorResponse(
        res,
        'Semua data event (judul, kategori, kota, lokasi, deskripsi, tanggal mulai, tanggal selesai) wajib diisi',
        400
      );
    }

    let parsedTickets = tickets;
    if (typeof tickets === 'string') {
      try {
        parsedTickets = JSON.parse(tickets);
      } catch (e) {
        return errorResponse(res, 'Format data tiket tidak valid (harus berupa array JSON)', 400);
      }
    }

    if (!Array.isArray(parsedTickets) || parsedTickets.length === 0) {
      return errorResponse(res, 'Minimal harus menyertakan satu jenis tiket', 400);
    }

    for (const ticket of parsedTickets) {
      if (!ticket.name || ticket.price === undefined || ticket.quota === undefined) {
        return errorResponse(res, 'Setiap jenis tiket harus memiliki nama, harga, dan kuota', 400);
      }
      if (Number(ticket.quota) <= 0) {
        return errorResponse(res, 'Kuota tiket minimal 1', 400);
      }
      if (Number(ticket.price) < 0) {
        return errorResponse(res, 'Harga tiket tidak boleh negatif', 400);
      }
    }

    const bannerUrl = req.file ? `/uploads/${req.file.filename}` : req.body.banner_url || null;

    const newEvent = await createEventService({
      organizer_id: userId,
      title,
      category_id,
      city,
      location,
      description,
      start_date,
      end_date,
      banner_url: bannerUrl,
      tickets: parsedTickets,
    });

    return successResponse(res, 'Event berhasil dibuat', newEvent, 201);
  } catch (error: any) {
    return errorResponse(res, error.message || 'Gagal membuat event', 500, error);
  }
};

export const updateEvent = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return errorResponse(res, 'Autentikasi diperlukan. Silakan login sebagai Organizer.', 401);
    }

    const { id } = req.params;
    const {
      title,
      category_id,
      city,
      location,
      description,
      start_date,
      end_date,
      tickets,
    } = req.body;

    let parsedTickets = tickets;
    if (typeof tickets === 'string') {
      try {
        parsedTickets = JSON.parse(tickets);
      } catch (e) {
        return errorResponse(res, 'Format data tiket tidak valid (harus berupa array JSON)', 400);
      }
    }

    if (parsedTickets && (!Array.isArray(parsedTickets) || parsedTickets.length === 0)) {
      return errorResponse(res, 'Minimal harus menyertakan satu jenis tiket', 400);
    }

    if (parsedTickets) {
      for (const ticket of parsedTickets) {
        if (!ticket.name || ticket.price === undefined || ticket.quota === undefined) {
          return errorResponse(res, 'Setiap jenis tiket harus memiliki nama, harga, dan kuota', 400);
        }
        if (Number(ticket.quota) <= 0) {
          return errorResponse(res, 'Kuota tiket minimal 1', 400);
        }
        if (Number(ticket.price) < 0) {
          return errorResponse(res, 'Harga tiket tidak boleh negatif', 400);
        }
      }
    }

    let bannerUrl: string | undefined = undefined;
    if (req.file) {
      bannerUrl = `/uploads/${req.file.filename}`;
    } else if (req.body.banner_url !== undefined) {
      bannerUrl = req.body.banner_url;
    }

    const updatedEvent = await updateEventService(id, userId, {
      title,
      category_id,
      city,
      location,
      description,
      start_date,
      end_date,
      banner_url: bannerUrl,
      tickets: parsedTickets,
    });

    return successResponse(res, 'Event berhasil diperbarui', updatedEvent, 200);
  } catch (error: any) {
    const statusCode =
      error.message === 'Event tidak ditemukan'
        ? 404
        : error.message.includes('Akses ditolak')
        ? 403
        : 500;
    return errorResponse(res, error.message || 'Gagal memperbarui event', statusCode, error);
  }
};

export const createEventVoucher = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return errorResponse(res, 'Autentikasi diperlukan. Silakan login sebagai Organizer.', 401);
    }

    const { id } = req.params;
    const { code, discount_type, discount_value, start_date, end_date } = req.body;

    if (!code || !discount_type || discount_value === undefined || !end_date) {
      return errorResponse(
        res,
        'Kode voucher, tipe diskon, nominal diskon, dan batas waktu akhir wajib diisi',
        400
      );
    }

    const voucher = await createEventVoucherService(id, userId, {
      code,
      discount_type,
      discount_value,
      start_date,
      end_date,
    });

    return successResponse(res, 'Voucher promo berhasil dibuat', voucher, 201);
  } catch (error: any) {
    const statusCode =
      error.message === 'Event tidak ditemukan'
        ? 404
        : error.message.includes('Akses ditolak')
        ? 403
        : 400;
    return errorResponse(res, error.message || 'Gagal membuat voucher', statusCode, error);
  }
};

export const getEventVouchers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return errorResponse(res, 'Autentikasi diperlukan. Silakan login sebagai Organizer.', 401);
    }

    const { id } = req.params;
    const vouchers = await getEventVouchersService(id, userId);

    return successResponse(res, 'Daftar voucher berhasil diambil', vouchers, 200);
  } catch (error: any) {
    const statusCode =
      error.message === 'Event tidak ditemukan'
        ? 404
        : error.message.includes('Akses ditolak')
        ? 403
        : 500;
    return errorResponse(res, error.message || 'Gagal memuat voucher', statusCode, error);
  }
};
