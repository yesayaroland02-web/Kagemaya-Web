"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteEvent = exports.getMyOrganizerEvents = exports.getEventVouchers = exports.createEventVoucher = exports.updateEvent = exports.createEvent = exports.checkTicketStock = exports.getEventById = exports.getCategories = exports.getEvents = void 0;
const event_service_1 = require("../services/event.service");
const response_1 = require("../utils/response");
const cloudinary_1 = require("../config/cloudinary");
const getEvents = async (req, res) => {
    try {
        // 1. Destructure semua parameter query dari frontend
        const { search, category, city, date, price, sort, page, limit } = req.query;
        // 2. Teruskan semua parameter ke Service
        const result = await (0, event_service_1.getEventsService)({
            search: search,
            category: category,
            city: city,
            date: date,
            price: price,
            sort: sort,
            page: page ? Number(page) : 1,
            limit: limit ? Number(limit) : 6,
        });
        return (0, response_1.successResponse)(res, 'Daftar event berhasil diambil', result.events, 200, result.pagination);
    }
    catch (error) {
        return (0, response_1.errorResponse)(res, error.message || 'Gagal memuat event', 500, error);
    }
};
exports.getEvents = getEvents;
const getCategories = async (_req, res) => {
    try {
        const categories = await (0, event_service_1.getCategoriesService)();
        return (0, response_1.successResponse)(res, 'Daftar kategori berhasil diambil', categories, 200);
    }
    catch (error) {
        return (0, response_1.errorResponse)(res, error.message || 'Gagal memuat kategori', 500, error);
    }
};
exports.getCategories = getCategories;
const getEventById = async (req, res) => {
    try {
        const { id } = req.params;
        const event = await (0, event_service_1.getEventByIdService)(id);
        return (0, response_1.successResponse)(res, 'Detail event berhasil diambil', event, 200);
    }
    catch (error) {
        const statusCode = error.message === 'Event tidak ditemukan' ? 404 : 500;
        return (0, response_1.errorResponse)(res, error.message || 'Gagal memuat detail event', statusCode, error);
    }
};
exports.getEventById = getEventById;
const checkTicketStock = async (req, res) => {
    try {
        const ticketTypeId = req.params.ticketTypeId || req.params.id;
        const qty = req.query.qty ? Number(req.query.qty) : 1;
        const result = await (0, event_service_1.validateTicketStockService)(ticketTypeId, qty);
        if (!result.is_available) {
            return (0, response_1.errorResponse)(res, result.message, 400, result);
        }
        return (0, response_1.successResponse)(res, result.message, result, 200);
    }
    catch (error) {
        return (0, response_1.errorResponse)(res, error.message || 'Gagal memvalidasi kuota tiket', 500, error);
    }
};
exports.checkTicketStock = checkTicketStock;
const createEvent = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return (0, response_1.errorResponse)(res, 'Autentikasi diperlukan. Silakan login sebagai Organizer.', 401);
        }
        const { title, category_id, city, location, description, start_date, end_date, tickets, } = req.body;
        if (!title || !category_id || !city || !location || !description || !start_date || !end_date) {
            return (0, response_1.errorResponse)(res, 'Semua data event (judul, kategori, kota, lokasi, deskripsi, tanggal mulai, tanggal selesai) wajib diisi', 400);
        }
        let parsedTickets = tickets;
        if (typeof tickets === 'string') {
            try {
                parsedTickets = JSON.parse(tickets);
            }
            catch (e) {
                return (0, response_1.errorResponse)(res, 'Format data tiket tidak valid (harus berupa array JSON)', 400);
            }
        }
        if (!Array.isArray(parsedTickets) || parsedTickets.length === 0) {
            return (0, response_1.errorResponse)(res, 'Minimal harus menyertakan satu jenis tiket', 400);
        }
        for (const ticket of parsedTickets) {
            if (!ticket.name || ticket.price === undefined || ticket.quota === undefined) {
                return (0, response_1.errorResponse)(res, 'Setiap jenis tiket harus memiliki nama, harga, dan kuota', 400);
            }
            if (Number(ticket.quota) <= 0) {
                return (0, response_1.errorResponse)(res, 'Kuota tiket minimal 1', 400);
            }
            if (Number(ticket.price) < 0) {
                return (0, response_1.errorResponse)(res, 'Harga tiket tidak boleh negatif', 400);
            }
        }
        let bannerUrl = req.body.banner_url || null;
        if (req.file) {
            bannerUrl = await (0, cloudinary_1.uploadToCloudinary)(req.file.buffer, 'kagemaya/banners');
        }
        const newEvent = await (0, event_service_1.createEventService)({
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
        return (0, response_1.successResponse)(res, 'Event berhasil dibuat', newEvent, 201);
    }
    catch (error) {
        return (0, response_1.errorResponse)(res, error.message || 'Gagal membuat event', 500, error);
    }
};
exports.createEvent = createEvent;
const updateEvent = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return (0, response_1.errorResponse)(res, 'Autentikasi diperlukan. Silakan login sebagai Organizer.', 401);
        }
        const { id } = req.params;
        const { title, category_id, city, location, description, start_date, end_date, tickets, } = req.body;
        let parsedTickets = tickets;
        if (typeof tickets === 'string') {
            try {
                parsedTickets = JSON.parse(tickets);
            }
            catch (e) {
                return (0, response_1.errorResponse)(res, 'Format data tiket tidak valid (harus berupa array JSON)', 400);
            }
        }
        if (parsedTickets && (!Array.isArray(parsedTickets) || parsedTickets.length === 0)) {
            return (0, response_1.errorResponse)(res, 'Minimal harus menyertakan satu jenis tiket', 400);
        }
        if (parsedTickets) {
            for (const ticket of parsedTickets) {
                if (!ticket.name || ticket.price === undefined || ticket.quota === undefined) {
                    return (0, response_1.errorResponse)(res, 'Setiap jenis tiket harus memiliki nama, harga, dan kuota', 400);
                }
                if (Number(ticket.quota) <= 0) {
                    return (0, response_1.errorResponse)(res, 'Kuota tiket minimal 1', 400);
                }
                if (Number(ticket.price) < 0) {
                    return (0, response_1.errorResponse)(res, 'Harga tiket tidak boleh negatif', 400);
                }
            }
        }
        let bannerUrl = undefined;
        if (req.file) {
            bannerUrl = await (0, cloudinary_1.uploadToCloudinary)(req.file.buffer, 'kagemaya/banners');
        }
        else if (req.body.banner_url !== undefined) {
            bannerUrl = req.body.banner_url;
        }
        const updatedEvent = await (0, event_service_1.updateEventService)(id, userId, {
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
        return (0, response_1.successResponse)(res, 'Event berhasil diperbarui', updatedEvent, 200);
    }
    catch (error) {
        const statusCode = error.message === 'Event tidak ditemukan'
            ? 404
            : error.message.includes('Akses ditolak')
                ? 403
                : 500;
        return (0, response_1.errorResponse)(res, error.message || 'Gagal memperbarui event', statusCode, error);
    }
};
exports.updateEvent = updateEvent;
const createEventVoucher = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return (0, response_1.errorResponse)(res, 'Autentikasi diperlukan. Silakan login sebagai Organizer.', 401);
        }
        const { id } = req.params;
        const { code, discount_type, discount_value, start_date, end_date } = req.body;
        if (!code || !discount_type || discount_value === undefined || !end_date) {
            return (0, response_1.errorResponse)(res, 'Kode voucher, tipe diskon, nominal diskon, dan batas waktu akhir wajib diisi', 400);
        }
        const voucher = await (0, event_service_1.createEventVoucherService)(id, userId, {
            code,
            discount_type,
            discount_value,
            start_date,
            end_date,
        });
        return (0, response_1.successResponse)(res, 'Voucher promo berhasil dibuat', voucher, 201);
    }
    catch (error) {
        const statusCode = error.message === 'Event tidak ditemukan'
            ? 404
            : error.message.includes('Akses ditolak')
                ? 403
                : 400;
        return (0, response_1.errorResponse)(res, error.message || 'Gagal membuat voucher', statusCode, error);
    }
};
exports.createEventVoucher = createEventVoucher;
const getEventVouchers = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return (0, response_1.errorResponse)(res, 'Autentikasi diperlukan. Silakan login sebagai Organizer.', 401);
        }
        const { id } = req.params;
        const vouchers = await (0, event_service_1.getEventVouchersService)(id, userId);
        return (0, response_1.successResponse)(res, 'Daftar voucher berhasil diambil', vouchers, 200);
    }
    catch (error) {
        const statusCode = error.message === 'Event tidak ditemukan'
            ? 404
            : error.message.includes('Akses ditolak')
                ? 403
                : 500;
        return (0, response_1.errorResponse)(res, error.message || 'Gagal memuat voucher', statusCode, error);
    }
};
exports.getEventVouchers = getEventVouchers;
const getMyOrganizerEvents = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return (0, response_1.errorResponse)(res, 'Autentikasi diperlukan. Silakan login sebagai Organizer.', 401);
        }
        const events = await (0, event_service_1.getMyOrganizerEventsService)(userId);
        return (0, response_1.successResponse)(res, 'Daftar seluruh event milik organizer berhasil diambil', events, 200);
    }
    catch (error) {
        return (0, response_1.errorResponse)(res, error.message || 'Gagal memuat event organizer', 500, error);
    }
};
exports.getMyOrganizerEvents = getMyOrganizerEvents;
const deleteEvent = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return (0, response_1.errorResponse)(res, 'Autentikasi diperlukan. Silahkan login sebagai Organizer');
        }
        const { id } = req.params;
        await (0, event_service_1.deleteEventService)(id, userId);
        return (0, response_1.successResponse)(res, 'Event berhasil dihapus', null, 200);
    }
    catch (error) {
        const statusCode = error.message === 'Event tidak ditemukan' ? 404
            : error.message.includes('Akses ditolak')
                ? 403
                : error.message.includes('transaksi')
                    ? 400
                    : 500;
        return (0, response_1.errorResponse)(res, error.message || 'Gagal menghapus event', statusCode, error);
    }
};
exports.deleteEvent = deleteEvent;
