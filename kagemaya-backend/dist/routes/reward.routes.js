"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const reward_controller_1 = require("../controllers/reward.controller");
const router = (0, express_1.Router)();
// Semua endpoint rewards membutuhkan login
router.use(auth_middleware_1.authenticateToken);
// GET /api/me/points
router.get('/points', reward_controller_1.getMyPoints);
// GET /api/me/coupons
router.get('/coupons', reward_controller_1.getMyCoupons);
exports.default = router;
