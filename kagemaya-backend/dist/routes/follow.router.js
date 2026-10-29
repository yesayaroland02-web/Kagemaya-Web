"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const role_middleware_1 = require("../middlewares/role.middleware");
const follow_controller_1 = require("../controllers/follow.controller");
const router = (0, express_1.Router)();
// GET /api/organizers/followers (Organizer yang login melihat siapa yang follow)
router.get('/organizers/me/followers', auth_middleware_1.authenticateToken, (0, role_middleware_1.authorizeRoles)('ORGANIZER'), follow_controller_1.getMyFollowers);
// GET /api/organizers/:id/followers (Melihat daftar followers organizer tertentu)
router.get('/organizers/:id/followers', follow_controller_1.getOrganizerFollowersById);
// GET /api/organizers/:id (Profil publik organizer)
router.get('/organizers/:id', follow_controller_1.getOrganizerProfile);
// GET /api/follows/:organizerId/check (Cek status follow)
router.get('/follows/:organizerId/check', auth_middleware_1.authenticateToken, follow_controller_1.checkFollowStatus);
// POST /api/follows/:organizerId (Follow organizer)
router.post('/follows/:organizerId', auth_middleware_1.authenticateToken, follow_controller_1.followOrganizer);
// DELETE /api/follows/:organizerId (Unfollow organizer)
router.delete('/follows/:organizerId', auth_middleware_1.authenticateToken, follow_controller_1.unfollowOrganizer);
exports.default = router;
