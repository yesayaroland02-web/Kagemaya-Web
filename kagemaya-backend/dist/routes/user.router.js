"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const upload_middleware_1 = require("../middlewares/upload.middleware");
const user_controller_1 = require("../controllers/user.controller");
const router = (0, express_1.Router)();
// Semua route di sini memerlukan autentikasi
router.use(auth_middleware_1.authenticateToken);
// GET  /api/me/profile  → ambil profil user yang login
router.get('/profile', user_controller_1.getMyProfile);
// PATCH /api/me/profile → update nama dan/atau foto profil
// Field upload: "avatar" (form-data)
router.patch('/profile', upload_middleware_1.uploadSingleImage.single('avatar'), user_controller_1.updateMyProfile);
// PATCH /api/me/password → ganti password
router.patch('/password', user_controller_1.updateMyPassword);
exports.default = router;
