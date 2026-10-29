"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const wishlist_controller_1 = require("../controllers/wishlist.controller");
const router = (0, express_1.Router)();
// GET /api/wishlists (Ambil daftar wishlist user)
router.get('/', auth_middleware_1.authenticateToken, wishlist_controller_1.getMyWishlists);
// GET /api/wishlists/:eventId/check (Cek status wishlist untuk event tertentu)
router.get('/:eventId/check', auth_middleware_1.authenticateToken, wishlist_controller_1.checkWishlistStatus);
// POST /api/wishlists/:eventId (Tambah wishlist)
router.post('/:eventId', auth_middleware_1.authenticateToken, wishlist_controller_1.addWishlist);
// DELETE /api/wishlists/:eventId (Hapus wishlist)
router.delete('/:eventId', auth_middleware_1.authenticateToken, wishlist_controller_1.removeWishlist);
exports.default = router;
