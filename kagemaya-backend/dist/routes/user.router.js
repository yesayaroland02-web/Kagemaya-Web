"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const user_controller_1 = require("../controllers/user.controller");
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const role_middleware_1 = require("../middlewares/role.middleware");
const dashboard_controller_1 = require("../controllers/dashboard.controller");
const upload_middleware_1 = require("../middlewares/upload.middleware");
const router = (0, express_1.Router)();
// Semua route di bawah membutuhkan token
router.use(auth_middleware_1.authenticateToken);
// ==========================================
// ORGANIZER DASHBOARD STATS: GET /api/me/dashboard/stats
// ==========================================
router.get('/dashboard/stats', (0, role_middleware_1.authorizeRoles)('ORGANIZER'), dashboard_controller_1.getOrganizerDashboardStats);
// GET /api/me/profile
router.get('/profile', user_controller_1.getMyProfile);
// PATCH /api/me/profile
router.patch('/profile', upload_middleware_1.uploadSingleImage.single('avatar'), user_controller_1.updateMyProfile);
// PATCH /api/me/password
router.patch('/password', user_controller_1.updateMyPassword);
exports.default = router;
