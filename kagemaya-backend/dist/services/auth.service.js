"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllUsers = exports.loginUser = exports.registerUser = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../lib/prisma");
const auth_validation_1 = require("../validations/auth.validation");
const generateReferralCode = (name) => {
    const prefix = name.replace(/\s+/g, '').slice(0, 3).toUpperCase();
    const randomStr = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `${prefix}${randomStr}`;
};
// ... dilanjutkan fungsi registerUser & loginUser
// Pastikan fungsi di-export menggunakan kata kunci 'export'
const registerUser = async (payload) => {
    const { name, email, password, role, referredBy } = auth_validation_1.registerSchema.parse(payload);
    // 1. Cek email
    const existingUser = await prisma_1.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        throw new Error('Email sudah terdaftar');
    }
    // 2. Hash password & buat referral code
    const hashedPassword = await bcrypt_1.default.hash(password, 10);
    const userReferralCode = generateReferralCode(name);
    // 3. Cek referral code pengajak
    let referrerUser = null;
    if (referredBy) {
        referrerUser = await prisma_1.prisma.user.findUnique({ where: { referral_code: referredBy } });
        if (!referrerUser) {
            throw new Error('Kode referral tidak valid');
        }
    }
    // 4. Eksekusi Transaction
    // WAJIB tambahkan kata kunci 'return' di depan prisma.$transaction
    return await prisma_1.prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role,
                referral_code: userReferralCode,
            },
        });
        // Buat profil organizer otomatis jika role ORGANIZER
        if (role === 'ORGANIZER') {
            await tx.organizerProfile.create({
                data: {
                    user_id: newUser.id,
                    organization_name: name,
                },
            });
        }
        if (referrerUser) {
            const expiresAt = new Date();
            expiresAt.setMonth(expiresAt.getMonth() + 3);
            // Pemberi referral mendapat +10.000 Poin
            await tx.pointTransaction.create({
                data: {
                    user_id: referrerUser.id,
                    amount: 10000,
                    remaining_amount: 10000,
                    type: 'EARN',
                    expires_at: expiresAt,
                },
            });
            // Pendaftar baru mendapat Kupon Diskon Referral
            await tx.coupon.create({
                data: {
                    user_id: newUser.id,
                    discount_amount: 25000,
                    expires_at: expiresAt,
                    is_used: false,
                },
            });
        }
        // WAJIB mengembalikan data user baru dari dalam callback transaction
        return {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            referral_code: newUser.referral_code,
        };
    });
};
exports.registerUser = registerUser;
const loginUser = async (payload) => {
    // 1. Validasi input
    const { email, password } = auth_validation_1.loginSchema.parse(payload);
    // 2. Cari user berdasarkan email
    const user = await prisma_1.prisma.user.findUnique({ where: { email } });
    if (!user) {
        throw new Error('Email atau password salah');
    }
    // 3. Verifikasi password
    const isPasswordValid = await bcrypt_1.default.compare(password, user.password);
    if (!isPasswordValid) {
        throw new Error('Email atau password salah');
    }
    // 4. Generate JWT Token
    const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'secret_key_kagemaya', { expiresIn: '1d' });
    // 5. WAJIB RETURN OBJEK DATA (agar tidak null)
    return {
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            referral_code: user.referral_code,
        },
        token,
    };
};
exports.loginUser = loginUser;
const getAllUsers = async () => {
    return await prisma_1.prisma.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            referral_code: true,
            created_at: true,
        },
    });
};
exports.getAllUsers = getAllUsers;
