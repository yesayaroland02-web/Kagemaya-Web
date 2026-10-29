import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware';
import {
  addWishlist,
  checkWishlistStatus,
  getMyWishlists,
  removeWishlist,
} from '../controllers/wishlist.controller';

const router = Router();

// GET /api/wishlists (Ambil daftar wishlist user)
router.get('/', authenticateToken, getMyWishlists);

// GET /api/wishlists/:eventId/check (Cek status wishlist untuk event tertentu)
router.get('/:eventId/check', authenticateToken, checkWishlistStatus);

// POST /api/wishlists/:eventId (Tambah wishlist)
router.post('/:eventId', authenticateToken, addWishlist);

// DELETE /api/wishlists/:eventId (Hapus wishlist)
router.delete('/:eventId', authenticateToken, removeWishlist);

export default router;
