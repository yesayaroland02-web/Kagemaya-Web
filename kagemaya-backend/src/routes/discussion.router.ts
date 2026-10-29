import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware';
import {
  createDiscussion,
  getDiscussions,
  togglePinDiscussion,
} from '../controllers/discussion.controller';

const router = Router();

// GET /api/events/:id/discussions (Ambil list diskusi Q&A event)
router.get('/events/:id/discussions', getDiscussions);

// POST /api/events/:id/discussions (Kirim pertanyaan atau balasan)
router.post('/events/:id/discussions', authenticateToken, createDiscussion);

// PATCH /api/discussions/:id/pin (Organizer pin / unpin jawaban)
router.patch('/discussions/:id/pin', authenticateToken, togglePinDiscussion);

export default router;
