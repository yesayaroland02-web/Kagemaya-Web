"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.forgotPassword = exports.login = exports.register = void 0;
const auth_service_1 = require("../services/auth.service");
const response_1 = require("../utils/response");
const zod_1 = require("zod");
const register = async (req, res) => {
    try {
        const result = await (0, auth_service_1.registerUser)(req.body);
        return (0, response_1.successResponse)(res, 'Registrasi berhasil', result, 201);
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            const firstMessage = error.errors[0]?.message || 'Format input tidak valid';
            return (0, response_1.errorResponse)(res, firstMessage, 400, error.errors);
        }
        return (0, response_1.errorResponse)(res, error.message || 'Gagal registrasi', 400, error);
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const result = await (0, auth_service_1.loginUser)(req.body);
        return (0, response_1.successResponse)(res, 'Login berhasil', result, 200);
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            const firstMessage = error.errors[0]?.message || 'Format input tidak valid';
            return (0, response_1.errorResponse)(res, firstMessage, 400, error.errors);
        }
        return (0, response_1.errorResponse)(res, error.message || 'Gagal login', 400, error);
    }
};
exports.login = login;
/**
 * FTRIN-002 - Forgot Password Controller
 */
const forgotPassword = async (req, res) => {
    const message = 'Jika email terdaftar, tautan reset password akan dikirim.';
    try {
        await (0, auth_service_1.forgotPasswordUser)(req.body);
        return (0, response_1.successResponse)(res, message, null, 200);
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            const firstMessage = error.errors[0]?.message || 'Format input tidak valid';
            return (0, response_1.errorResponse)(res, firstMessage, 400, error.errors);
        }
        // Respons tetap seragam agar keberadaan akun
        // tidak dapat ditebak dari hasil permintaan.
        console.error('Forgot password processing failed:', error instanceof Error ? error.name : 'UnknownError');
        return (0, response_1.successResponse)(res, message, null, 200);
    }
};
exports.forgotPassword = forgotPassword;
/**
 * FTRIN-002 - Reset Password Controller
 */
const resetPassword = async (req, res) => {
    try {
        const result = await (0, auth_service_1.resetPasswordUser)(req.body);
        return (0, response_1.successResponse)(res, result.message, null, 200);
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            const firstMessage = error.errors[0]?.message || 'Format input tidak valid';
            return (0, response_1.errorResponse)(res, firstMessage, 400, error.errors);
        }
        if (error instanceof Error &&
            error.message.startsWith('Token reset')) {
            return (0, response_1.errorResponse)(res, error.message, 400);
        }
        console.error('Reset password processing failed:', error instanceof Error ? error.name : 'UnknownError');
        return (0, response_1.errorResponse)(res, 'Terjadi kesalahan saat mengubah password.', 500);
    }
};
exports.resetPassword = resetPassword;
