"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_rate_limit_1 = require("express-rate-limit");
const auth_controller_1 = require("../controllers/auth.controller");
const router = (0, express_1.Router)();
// FTRIN-002 - Rate Limiting Forgot Password
const forgotPasswordLimiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Terlalu banyak permintaan reset password. Silakan coba lagi dalam 15 menit.',
    },
});
// Existing Authentication Routes
router.post('/register', auth_controller_1.register);
router.post('/login', auth_controller_1.login);
// FTRIN-002 - Forgot & Reset Password
router.post('/forgot-password', forgotPasswordLimiter, auth_controller_1.forgotPassword);
router.post('/reset-password', auth_controller_1.resetPassword);
exports.default = router;
