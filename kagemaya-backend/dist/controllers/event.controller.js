"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkTicketStock = exports.getEventById = exports.getCategories = exports.getEvents = void 0;
const response_1 = require("../utils/response");
const event_service_1 = require("../services/event.service");
const event_service_2 = require("../services/event.service");
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
        const result = await (0, event_service_2.validateTicketStockService)(ticketTypeId, qty);
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
