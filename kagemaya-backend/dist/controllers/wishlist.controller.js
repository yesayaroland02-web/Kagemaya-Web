"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkWishlistStatus = exports.getMyWishlists = exports.removeWishlist = exports.addWishlist = void 0;
const response_1 = require("../utils/response");
const wishlist_service_1 = require("../services/wishlist.service");
const addWishlist = async (req, res) => {
    try {
        const customerId = req.user?.id;
        const { eventId } = req.params;
        if (!customerId) {
            return (0, response_1.errorResponse)(res, 'Autentikasi diperlukan', 401);
        }
        if (!eventId) {
            return (0, response_1.errorResponse)(res, 'ID Event wajib disertakan', 400);
        }
        const result = await (0, wishlist_service_1.addWishlistService)(customerId, eventId);
        return (0, response_1.successResponse)(res, result.alreadyExists
            ? 'Event sudah ada di dalam wishlist Anda'
            : 'Event berhasil ditambahkan ke wishlist', result.wishlist, result.alreadyExists ? 200 : 201);
    }
    catch (error) {
        const status = error.message === 'Event tidak ditemukan' ? 404 : 400;
        return (0, response_1.errorResponse)(res, error.message || 'Gagal menambahkan wishlist', status);
    }
};
exports.addWishlist = addWishlist;
const removeWishlist = async (req, res) => {
    try {
        const customerId = req.user?.id;
        const { eventId } = req.params;
        if (!customerId) {
            return (0, response_1.errorResponse)(res, 'Autentikasi diperlukan', 401);
        }
        if (!eventId) {
            return (0, response_1.errorResponse)(res, 'ID Event wajib disertakan', 400);
        }
        await (0, wishlist_service_1.removeWishlistService)(customerId, eventId);
        return (0, response_1.successResponse)(res, 'Event berhasil dihapus dari wishlist', null, 200);
    }
    catch (error) {
        const status = error.message === 'Event belum ada di dalam wishlist Anda.' ? 404 : 400;
        return (0, response_1.errorResponse)(res, error.message || 'Gagal menghapus wishlist', status);
    }
};
exports.removeWishlist = removeWishlist;
const getMyWishlists = async (req, res) => {
    try {
        const customerId = req.user?.id;
        if (!customerId) {
            return (0, response_1.errorResponse)(res, 'Autentikasi diperlukan', 401);
        }
        const wishlists = await (0, wishlist_service_1.getUserWishlistsService)(customerId);
        return (0, response_1.successResponse)(res, 'Daftar wishlist berhasil diambil', wishlists, 200);
    }
    catch (error) {
        return (0, response_1.errorResponse)(res, error.message || 'Gagal mengambil wishlist', 500);
    }
};
exports.getMyWishlists = getMyWishlists;
const checkWishlistStatus = async (req, res) => {
    try {
        const customerId = req.user?.id;
        const { eventId } = req.params;
        if (!customerId) {
            return (0, response_1.successResponse)(res, 'Status wishlist', { is_wishlisted: false }, 200);
        }
        const result = await (0, wishlist_service_1.checkWishlistStatusService)(customerId, eventId);
        return (0, response_1.successResponse)(res, 'Status wishlist', result, 200);
    }
    catch (error) {
        return (0, response_1.errorResponse)(res, error.message || 'Gagal memeriksa status wishlist', 500);
    }
};
exports.checkWishlistStatus = checkWishlistStatus;
