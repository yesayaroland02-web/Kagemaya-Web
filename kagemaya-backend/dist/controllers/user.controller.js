"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMyPassword = exports.updateMyProfile = exports.getMyProfile = void 0;
const user_service_1 = require("../services/user.service");
const response_1 = require("../utils/response");
// ========================================
// GET /me/profile
// ========================================
const getMyProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const profile = await (0, user_service_1.getMyProfileService)(userId);
        return (0, response_1.successResponse)(res, 'Profil berhasil diambil.', profile, 200);
    }
    catch (error) {
        return (0, response_1.errorResponse)(res, error.message || 'Gagal mengambil profil.', 500, error);
    }
};
exports.getMyProfile = getMyProfile;
// ========================================
// PATCH /me/profile
// ========================================
const updateMyProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const name = typeof req.body.name === 'string'
            ? req.body.name.trim()
            : undefined;
        const profile_picture = req.file
            ? `/uploads/${req.file.filename}`
            : undefined;
        if (!name && !profile_picture) {
            return (0, response_1.errorResponse)(res, 'Nama atau foto profil wajib diisi.', 400);
        }
        const updated = await (0, user_service_1.updateProfileService)(userId, {
            name,
            profile_picture,
        });
        return (0, response_1.successResponse)(res, 'Profil berhasil diperbarui.', updated, 200);
    }
    catch (error) {
        return (0, response_1.errorResponse)(res, error.message || 'Gagal memperbarui profil.', 400, error);
    }
};
exports.updateMyProfile = updateMyProfile;
// ========================================
// PATCH /me/password
// ========================================
const updateMyPassword = async (req, res) => {
    try {
        const userId = req.user.id;
        const { current_password, new_password, } = req.body;
        if (!current_password ||
            !new_password) {
            return (0, response_1.errorResponse)(res, 'current_password dan new_password wajib diisi.', 400);
        }
        if (new_password.length < 6) {
            return (0, response_1.errorResponse)(res, 'Password baru minimal 6 karakter.', 400);
        }
        const result = await (0, user_service_1.updatePasswordService)(userId, {
            current_password,
            new_password,
        });
        return (0, response_1.successResponse)(res, result.message, null, 200);
    }
    catch (error) {
        const message = error.message ||
            'Gagal memperbarui password.';
        const status = message.includes('tidak sesuai')
            ? 401
            : 400;
        return (0, response_1.errorResponse)(res, message, status, error);
    }
};
exports.updateMyPassword = updateMyPassword;
