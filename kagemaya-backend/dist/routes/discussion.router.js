"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const discussion_controller_1 = require("../controllers/discussion.controller");
const router = (0, express_1.Router)();
// GET /api/events/:id/discussions (Ambil list diskusi Q&A event)
router.get('/events/:id/discussions', discussion_controller_1.getDiscussions);
// POST /api/events/:id/discussions (Kirim pertanyaan atau balasan)
router.post('/events/:id/discussions', auth_middleware_1.authenticateToken, discussion_controller_1.createDiscussion);
// PATCH /api/discussions/:id/pin (Organizer pin / unpin jawaban)
router.patch('/discussions/:id/pin', auth_middleware_1.authenticateToken, discussion_controller_1.togglePinDiscussion);
exports.default = router;
