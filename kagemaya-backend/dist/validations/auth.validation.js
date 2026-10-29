"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPasswordSchema = exports.forgotPasswordSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Nama minimal 2 karakter'),
    email: zod_1.z.string().email('Format email tidak valid'),
    password: zod_1.z.string().min(6, 'Password minimal 6 karakter'),
    role: zod_1.z.enum(['CUSTOMER', 'ORGANIZER']).default('CUSTOMER'),
    referredBy: zod_1.z.string().optional(), // Kode referral pengajak (opsional)
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Format email tidak valid'),
    password: zod_1.z.string().min(1, 'Password wajib diisi'),
});
exports.forgotPasswordSchema = zod_1.z.object({
    email: zod_1.z.string()
        .trim()
        .toLowerCase()
        .email('Format email tidak valid'),
});
exports.resetPasswordSchema = zod_1.z.object({
    token: zod_1.z.string()
        .regex(/^[a-f0-9]{64}$/i, 'Token reset tidak valid'),
    password: zod_1.z.string()
        .min(6, 'Password minimal 6 karakter'),
    confirmPassword: zod_1.z.string()
        .min(1, 'Konfirmasi password wajib diisi'),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Konfirmasi password tidak sama',
    path: ['confirmPassword'],
});
