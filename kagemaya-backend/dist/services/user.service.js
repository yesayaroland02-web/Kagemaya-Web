"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyProfileService = exports.updatePasswordService = exports.updateProfileService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma_1 = require("../lib/prisma");
// ─── PATCH /me/profile ───────────────────────────────────────────────────────
const updateProfileService = async (userId, data) => {
    if (!data.name && !data.profile_picture) {
        throw new Error('Tidak ada data yang diubah.');
    }
    const updated = await prisma_1.prisma.user.update({
        where: { id: userId },
        data: {
            ...(data.name ? { name: data.name } : {}),
            ...(data.profile_picture ? { profile_picture: data.profile_picture } : {}),
        },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            profile_picture: true,
            referral_code: true,
            created_at: true,
        },
    });
    return updated;
};
exports.updateProfileService = updateProfileService;
// ─── PATCH /me/password ──────────────────────────────────────────────────────
const updatePasswordService = async (userId, data) => {
    const { current_password, new_password } = data;
    // 1. Ambil user (dengan password hash)
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, password: true },
    });
    if (!user) {
        throw new Error('Pengguna tidak ditemukan.');
    }
    // 2. Verifikasi password lama
    const isMatch = await bcrypt_1.default.compare(current_password, user.password);
    if (!isMatch) {
        throw new Error('Password saat ini tidak sesuai.');
    }
    // 3. Pastikan password baru berbeda dari yang lama
    const isSame = await bcrypt_1.default.compare(new_password, user.password);
    if (isSame) {
        throw new Error('Password baru tidak boleh sama dengan password saat ini.');
    }
    // 4. Hash & simpan
    const hashedNewPassword = await bcrypt_1.default.hash(new_password, 10);
    await prisma_1.prisma.user.update({
        where: { id: userId },
        data: { password: hashedNewPassword },
    });
    return { message: 'Password berhasil diperbarui.' };
};
exports.updatePasswordService = updatePasswordService;
// ─── GET /me/profile ─────────────────────────────────────────────────────────
const getMyProfileService = async (userId) => {
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            profile_picture: true,
            referral_code: true,
            referred_by_id: true,
            created_at: true,
            organizer_profile: {
                select: {
                    organization_name: true,
                    bio: true,
                },
            },
        },
    });
    if (!user) {
        throw new Error('Pengguna tidak ditemukan.');
    }
    return user;
};
exports.getMyProfileService = getMyProfileService;
