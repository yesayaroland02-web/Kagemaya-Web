import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/role.middleware';
import {
  checkFollowStatus,
  followOrganizer,
  getMyFollowers,
  getOrganizerFollowersById,
  getOrganizerProfile,
  unfollowOrganizer,
} from '../controllers/follow.controller';

const router = Router();

// GET /api/organizers/followers (Organizer yang login melihat siapa yang follow)
router.get(
  '/organizers/me/followers',
  authenticateToken,
  authorizeRoles('ORGANIZER'),
  getMyFollowers
);

// GET /api/organizers/:id/followers (Melihat daftar followers organizer tertentu)
router.get('/organizers/:id/followers', getOrganizerFollowersById);

// GET /api/organizers/:id (Profil publik organizer)
router.get('/organizers/:id', getOrganizerProfile);

// GET /api/follows/:organizerId/check (Cek status follow)
router.get('/follows/:organizerId/check', authenticateToken, checkFollowStatus);

// POST /api/follows/:organizerId (Follow organizer)
router.post('/follows/:organizerId', authenticateToken, followOrganizer);

// DELETE /api/follows/:organizerId (Unfollow organizer)
router.delete('/follows/:organizerId', authenticateToken, unfollowOrganizer);

export default router;
